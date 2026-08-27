from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.models.conversation_log import ConversationLog
from app.models.reservation import Reservation
from app.models.restaurant_user import RestaurantUser


router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def to_percentage(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0

    return round((numerator / denominator) * 100, 1)


def count_distinct_vapi_calls(
    db: Session,
    restaurant_id,
    require_linked_reservation: bool = False
) -> int:
    """Count calls, rather than conversation-log rows, for one restaurant.

    A Vapi call can result in more than one webhook event. A normalized call ID
    keeps those events from inflating any operational metric. When a booking is
    required, the join also proves that the linked reservation belongs to the
    same restaurant as the authenticated owner.
    """

    normalized_call_id = func.nullif(func.trim(ConversationLog.vapi_call_id), "")
    query = (
        db.query(func.count(func.distinct(normalized_call_id)))
        .filter(
            ConversationLog.restaurant_id == restaurant_id,
            normalized_call_id.isnot(None)
        )
    )

    if require_linked_reservation:
        query = (
            query.join(
                Reservation,
                ConversationLog.reservation_id == Reservation.id
            )
            .filter(Reservation.restaurant_id == restaurant_id)
        )

    return int(query.scalar() or 0)


@router.get("")
def get_analytics(
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    """Return operational metrics for the authenticated user's restaurant."""

    restaurant_id = restaurant_user.restaurant_id

    reservation_status_counts = (
        db.query(func.lower(Reservation.status), func.count(Reservation.id))
        .filter(Reservation.restaurant_id == restaurant_id)
        .group_by(func.lower(Reservation.status))
        .all()
    )
    status_counts = {
        status or "": count
        for status, count in reservation_status_counts
    }
    reservations_created = sum(status_counts.values())
    confirmed_reservations = status_counts.get("confirmed", 0)
    cancelled_reservations = status_counts.get("cancelled", 0)

    ai_calls_handled = count_distinct_vapi_calls(db, restaurant_id)
    booked_vapi_calls = count_distinct_vapi_calls(
        db,
        restaurant_id,
        require_linked_reservation=True
    )
    calls_without_booking = ai_calls_handled - booked_vapi_calls

    today = date.today()
    start_date = today - timedelta(days=6)
    start_at = datetime.combine(start_date, time.min)
    end_at = datetime.combine(today + timedelta(days=1), time.min)
    trend_rows = (
        db.query(
            func.date(Reservation.created_at).label("reservation_day"),
            func.count(Reservation.id).label("reservation_count")
        )
        .filter(
            Reservation.restaurant_id == restaurant_id,
            Reservation.created_at >= start_at,
            Reservation.created_at < end_at
        )
        .group_by(func.date(Reservation.created_at))
        .order_by(func.date(Reservation.created_at))
        .all()
    )
    trend_counts = {
        reservation_day.isoformat(): reservation_count
        for reservation_day, reservation_count in trend_rows
        if reservation_day is not None
    }
    recent_7_days_reservations = [
        {
            "date": (start_date + timedelta(days=offset)).isoformat(),
            "count": trend_counts.get(
                (start_date + timedelta(days=offset)).isoformat(),
                0
            )
        }
        for offset in range(7)
    ]

    return {
        "reservations_created": reservations_created,
        "confirmed_reservations": confirmed_reservations,
        "cancelled_reservations": cancelled_reservations,
        "ai_calls_handled": ai_calls_handled,
        "booked_vapi_calls": booked_vapi_calls,
        "calls_without_booking": calls_without_booking,
        "call_to_booking_rate": to_percentage(
            booked_vapi_calls,
            ai_calls_handled
        ),
        "recent_7_days_reservations": recent_7_days_reservations
    }
