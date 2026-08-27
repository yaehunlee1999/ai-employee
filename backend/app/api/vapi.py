import logging
import hmac
import json
import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.ai.tools import execute_create_reservation
from app.database.connection import SessionLocal
from app.models.conversation_log import ConversationLog
from app.models.restaurant_settings import RestaurantSettings


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/vapi",
    tags=["vapi"]
)


def extract_assistant_id(payload: dict[str, Any]) -> str | None:
    """Read the assistant ID from the Vapi webhook envelope.

    Vapi tool-call webhooks normally place this value in message.call.assistantId.
    The alternative paths keep the existing webhook compatible with payload
    variants used by older Vapi configurations.
    """

    message = payload.get("message")
    call = payload.get("call")
    assistant = payload.get("assistant")
    message_call = message.get("call") if isinstance(message, dict) else None

    containers = [
        payload,
        call if isinstance(call, dict) else {},
        message if isinstance(message, dict) else {},
        message_call if isinstance(message_call, dict) else {},
        assistant if isinstance(assistant, dict) else {}
    ]

    for container in containers:
        for key in ("assistantId", "assistant_id"):
            assistant_id = container.get(key)
            if isinstance(assistant_id, str) and assistant_id.strip():
                return assistant_id.strip()

        nested_assistant = container.get("assistant")
        if isinstance(nested_assistant, dict):
            assistant_id = nested_assistant.get("id")
            if isinstance(assistant_id, str) and assistant_id.strip():
                return assistant_id.strip()

    return None


def verify_vapi_webhook(request: Request) -> None:
    """Validate Vapi's Bearer credential and fail closed in production."""

    webhook_secret = os.getenv("VAPI_WEBHOOK_SECRET")
    if not webhook_secret:
        if os.getenv("APP_ENV", "development").lower() == "production":
            logger.error("VAPI_WEBHOOK_SECRET is missing in production")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vapi webhook is not configured"
            )
        return

    received_authorization = request.headers.get("Authorization", "")
    expected_authorization = "Bearer " + webhook_secret

    if not hmac.compare_digest(received_authorization, expected_authorization):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vapi webhook credential"
        )


def extract_tool_calls(payload: dict[str, Any]) -> list[dict[str, Any]]:
    message = payload.get("message")
    if not isinstance(message, dict):
        return []

    tool_calls = message.get("toolCalls") or message.get("toolCallList")

    if not isinstance(tool_calls, list):
        return []

    return [tool_call for tool_call in tool_calls if isinstance(tool_call, dict)]


def get_message(payload: dict[str, Any]) -> dict[str, Any] | None:
    message = payload.get("message")
    return message if isinstance(message, dict) else None


def extract_vapi_call_id(payload: dict[str, Any]) -> str | None:
    message = get_message(payload)
    call = message.get("call") if message else None

    if not isinstance(call, dict):
        return None

    call_id = call.get("id")
    return call_id.strip() if isinstance(call_id, str) and call_id.strip() else None


def extract_customer_phone(payload: dict[str, Any]) -> str | None:
    message = get_message(payload)
    call = message.get("call") if message else None

    containers = [
        payload.get("customer"),
        message.get("customer") if message else None,
        call.get("customer") if isinstance(call, dict) else None,
        call
    ]

    for container in containers:
        if not isinstance(container, dict):
            continue

        for key in ("number", "phoneNumber", "phone", "customerNumber"):
            phone = container.get(key)
            if isinstance(phone, str) and phone.strip():
                return phone.strip()

    return None


def extract_transcript(payload: dict[str, Any]) -> str | None:
    message = get_message(payload)
    if not message:
        return None

    artifact = message.get("artifact")
    if isinstance(artifact, dict):
        transcript = artifact.get("transcript")
        if isinstance(transcript, str) and transcript.strip():
            return transcript.strip()

        messages = artifact.get("messages")
        if isinstance(messages, list):
            transcript_lines = []
            for item in messages:
                if not isinstance(item, dict):
                    continue
                role = item.get("role")
                text = item.get("message") or item.get("content")
                if isinstance(role, str) and isinstance(text, str) and text.strip():
                    transcript_lines.append(role.capitalize() + ": " + text.strip())
            if transcript_lines:
                return "\n".join(transcript_lines)

    for container in (message, payload):
        transcript = container.get("transcript")
        if isinstance(transcript, str) and transcript.strip():
            return transcript.strip()

    return None


def extract_end_of_call_fields(
    payload: dict[str, Any]
) -> tuple[str | None, str | None, float | None, dict[str, Any] | None]:
    message = get_message(payload) or {}
    call = message.get("call") if isinstance(message.get("call"), dict) else {}
    artifact = (
        message.get("artifact")
        if isinstance(message.get("artifact"), dict)
        else call.get("artifact")
        if isinstance(call.get("artifact"), dict)
        else {}
    )
    analysis = (
        message.get("analysis")
        if isinstance(message.get("analysis"), dict)
        else call.get("analysis")
        if isinstance(call.get("analysis"), dict)
        else payload.get("analysis")
        if isinstance(payload.get("analysis"), dict)
        else None
    )

    summary = analysis.get("summary") if analysis else None
    if not isinstance(summary, str) or not summary.strip():
        summary = message.get("summary") or payload.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        summary = None

    recording_url = extract_recording_url(artifact, call, message, payload)

    raw_duration = next(
        (
            container[key]
            for container in (message, call, payload)
            for key in ("durationSeconds", "duration")
            if container.get(key) is not None
        ),
        None
    )
    try:
        if raw_duration is not None:
            duration = max(float(raw_duration), 0)
        else:
            duration = extract_duration_from_timestamps(message, call, payload)
    except (TypeError, ValueError):
        duration = None

    return (
        summary.strip() if summary else None,
        recording_url.strip() if recording_url else None,
        duration,
        analysis
    )


def extract_recording_url(*containers: dict[str, Any]) -> str | None:
    """Return the first usable recording URL from Vapi's artifact variants."""

    url_keys = (
        "recordingUrl",
        "recording_url",
        "url",
        "monoUrl",
        "stereoUrl",
        "presignedMonoUrl",
        "presignedStereoUrl"
    )

    def find_url(value: Any) -> str | None:
        if isinstance(value, str):
            candidate = value.strip()
            return candidate if candidate.startswith(("https://", "http://")) else None

        if not isinstance(value, dict):
            return None

        for key in url_keys:
            candidate = value.get(key)
            if isinstance(candidate, str):
                candidate = candidate.strip()
                if candidate.startswith(("https://", "http://")):
                    return candidate

        for key in ("recording", "mono", "stereo"):
            candidate = find_url(value.get(key))
            if candidate:
                return candidate

        return None

    for container in containers:
        recording_url = find_url(container)
        if recording_url:
            return recording_url

    return None


def extract_duration_from_timestamps(*containers: dict[str, Any]) -> float | None:
    """Calculate Vapi call duration in seconds from ISO 8601 timestamps."""

    for container in containers:
        started_at = container.get("startedAt")
        ended_at = container.get("endedAt")
        if not isinstance(started_at, str) or not isinstance(ended_at, str):
            continue

        try:
            started = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
            ended = datetime.fromisoformat(ended_at.replace("Z", "+00:00"))
        except ValueError:
            continue

        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        if ended.tzinfo is None:
            ended = ended.replace(tzinfo=timezone.utc)

        return max((ended - started).total_seconds(), 0)

    return None


def get_call_ended_reason(payload: dict[str, Any]) -> str | None:
    message = get_message(payload)
    if not message:
        return None

    call = message.get("call")
    ended_reason = message.get("endedReason")
    if not ended_reason and isinstance(call, dict):
        ended_reason = call.get("endedReason")
    return (
        ended_reason.strip()
        if isinstance(ended_reason, str) and ended_reason.strip()
        else None
    )


def save_vapi_conversation(
    db: Session,
    restaurant_id: UUID,
    vapi_call_id: str,
    customer_phone: str | None = None,
    reservation_id: UUID | None = None,
    transcript: str | None = None,
    call_ended_reason: str | None = None,
    summary: str | None = None,
    recording_url: str | None = None,
    duration: float | None = None,
    analysis: dict[str, Any] | None = None
) -> ConversationLog:
    conversation_log = (
        db.query(ConversationLog)
        .filter(ConversationLog.vapi_call_id == vapi_call_id)
        .first()
    )

    if conversation_log and conversation_log.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vapi call is already linked to another restaurant"
        )

    if not conversation_log:
        conversation_log = ConversationLog(
            restaurant_id=restaurant_id,
            vapi_call_id=vapi_call_id
        )
        db.add(conversation_log)

    if customer_phone:
        conversation_log.customer_phone = customer_phone
    if reservation_id:
        conversation_log.reservation_id = reservation_id
        conversation_log.ai_response = "Vapi reservation created"
    if transcript:
        conversation_log.transcript = transcript
    if summary:
        conversation_log.summary = summary
    if recording_url:
        conversation_log.recording_url = recording_url
    if duration is not None:
        conversation_log.duration = duration
    if analysis is not None:
        conversation_log.analysis = analysis
    if call_ended_reason:
        conversation_log.call_ended_reason = call_ended_reason
        if not conversation_log.ai_response:
            conversation_log.ai_response = "Vapi call ended: " + call_ended_reason

    db.commit()
    return conversation_log


def get_tool_call_details(
    tool_call: dict[str, Any]
) -> tuple[str | None, dict[str, Any] | str | None, str | None, bool]:
    """Normalize legacy and current Vapi tool-call shapes.

    Current Vapi server events use toolCallList entries with name/parameters.
    The project's existing webhook accepts the older function/arguments shape.
    """

    function = tool_call.get("function")
    if isinstance(function, dict):
        return (
            function.get("name"),
            function.get("arguments"),
            tool_call.get("id"),
            False
        )

    return (
        tool_call.get("name"),
        tool_call.get("parameters"),
        tool_call.get("id"),
        True
    )


def get_restaurant_id_for_assistant(
    db: Session,
    assistant_id: str
) -> UUID:
    settings_matches = (
        db.query(RestaurantSettings)
        .filter(RestaurantSettings.vapi_assistant_id == assistant_id)
        .limit(2)
        .all()
    )

    if not settings_matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No restaurant is configured for this Vapi assistant"
        )

    if len(settings_matches) > 1:
        logger.error(
            "Multiple restaurant settings are configured for one Vapi assistant"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Vapi assistant is linked to multiple restaurants"
        )

    return settings_matches[0].restaurant_id


@router.post("/webhook")
async def vapi_webhook(request: Request):
    verify_vapi_webhook(request)

    body = await request.body()
    if not body.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Vapi webhook request body is required"}
        )

    try:
        data = json.loads(body)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in Vapi webhook payload"
        ) from error

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Vapi webhook payload"
        )

    message = get_message(data)
    if message and message.get("type") == "end-of-call-report":
        assistant_id = extract_assistant_id(data)
        vapi_call_id = extract_vapi_call_id(data)

        if not assistant_id or not vapi_call_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vapi end-of-call report is missing an assistant or call ID"
            )

        db = SessionLocal()
        try:
            restaurant_id = get_restaurant_id_for_assistant(db, assistant_id)
            summary, recording_url, duration, analysis = extract_end_of_call_fields(data)
            save_vapi_conversation(
                db=db,
                restaurant_id=restaurant_id,
                vapi_call_id=vapi_call_id,
                customer_phone=extract_customer_phone(data),
                transcript=extract_transcript(data),
                call_ended_reason=get_call_ended_reason(data),
                summary=summary,
                recording_url=recording_url,
                duration=duration,
                analysis=analysis
            )
            return {"success": True, "message": "Vapi conversation saved"}
        finally:
            db.close()

    tool_calls = extract_tool_calls(data)

    if not tool_calls:
        return {
            "success": False,
            "message": "No tool call found"
        }

    tool_name, tool_arguments, tool_call_id, uses_vapi_tool_call_list = (
        get_tool_call_details(tool_calls[0])
    )

    if tool_name != "create_reservation":
        return {
            "success": False,
            "message": "Unsupported tool call"
        }

    assistant_id = extract_assistant_id(data)
    if not assistant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vapi webhook payload is missing an assistant ID"
        )

    db = SessionLocal()

    try:
        restaurant_id = get_restaurant_id_for_assistant(db, assistant_id)

        reservation = execute_create_reservation(
            tool_arguments,
            db,
            restaurant_id=restaurant_id
        )

        vapi_call_id = extract_vapi_call_id(data)
        if vapi_call_id:
            try:
                save_vapi_conversation(
                    db=db,
                    restaurant_id=restaurant_id,
                    vapi_call_id=vapi_call_id,
                    customer_phone=extract_customer_phone(data),
                    reservation_id=reservation.id
                )
            except Exception:
                # Conversation logging must not prevent an already-created
                # reservation from being returned to Vapi.
                db.rollback()
                logger.exception("Unable to link Vapi call to reservation")

        if uses_vapi_tool_call_list and tool_call_id:
            return {
                "results": [
                    {
                        "name": "create_reservation",
                        "toolCallId": tool_call_id,
                        "result": "{\"status\": \"confirmed\"}"
                    }
                ]
            }

        return {
            "result": "Reservation successfully created. The reservation is confirmed."
        }
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        ) from error
    finally:
        db.close()
