import re
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.models.conversation_log import ConversationLog
from app.models.reservation import Reservation
from app.models.restaurant_user import RestaurantUser


router = APIRouter(
    prefix="/conversations",
    tags=["conversations"]
)

RESERVATION_ID_PATTERN = re.compile(
    r"Reservation ID:\s*([0-9a-fA-F]{8}"
    r"-[0-9a-fA-F]{4}"
    r"-[0-9a-fA-F]{4}"
    r"-[0-9a-fA-F]{4}"
    r"-[0-9a-fA-F]{12})",
    re.IGNORECASE
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_reservation_id_from_response(ai_response: str | None) -> UUID | None:
    if not ai_response:
        return None

    match = RESERVATION_ID_PATTERN.search(ai_response)
    if not match:
        return None

    try:
        return UUID(match.group(1))
    except ValueError:
        return None


@router.get("")
def get_conversations(
    limit: int = Query(default=100, ge=1, le=100),
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    conversation_logs = (
        db.query(ConversationLog)
        .filter(ConversationLog.restaurant_id == restaurant_user.restaurant_id)
        .order_by(ConversationLog.created_at.desc())
        .limit(limit)
        .all()
    )

    reservation_ids = {
        log.reservation_id or reservation_id
        for log in conversation_logs
        if (
            log.reservation_id
            or (reservation_id := get_reservation_id_from_response(log.ai_response))
        )
    }
    reservations_by_id: dict[UUID, Reservation] = {}

    if reservation_ids:
        reservations = (
            db.query(Reservation)
            .filter(
                Reservation.restaurant_id == restaurant_user.restaurant_id,
                Reservation.id.in_(reservation_ids)
            )
            .all()
        )
        reservations_by_id = {reservation.id: reservation for reservation in reservations}

    conversations = []
    for log in conversation_logs:
        reservation_id = (
            log.reservation_id
            or get_reservation_id_from_response(log.ai_response)
        )
        reservation = reservations_by_id.get(reservation_id)

        if reservation:
            conversation_status = reservation.status
        elif log.vapi_call_id:
            conversation_status = "call_ended"
        else:
            conversation_status = "no_reservation"

        conversations.append(
            {
                "id": str(log.id),
                "created_at": log.created_at,
                "customer_phone": log.customer_phone,
                "summary": log.summary or log.ai_response or log.user_message or "No summary available",
                "transcript": log.transcript,
                "recording_url": log.recording_url,
                "duration": log.duration,
                "analysis": log.analysis,
                "source": "vapi" if log.vapi_call_id else "ai_chat",
                "reservation_created": reservation is not None,
                "status": conversation_status
            }
        )

    return conversations
