from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from uuid import UUID


from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.models.customer import Customer
from app.models.reservation import Reservation
from app.models.restaurant_user import RestaurantUser
from app.schemas.reservation import ReservationCreate


router = APIRouter(
    prefix="/reservations",
    tags=["reservations"]
)

restaurant_router = APIRouter(
    prefix="/restaurants",
    tags=["reservations"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_reservations_for_restaurant(
    db: Session,
    restaurant_id: UUID | str
) -> list[Reservation]:
    return (
        db.query(Reservation)
        .options(joinedload(Reservation.customer))
        .filter(Reservation.restaurant_id == restaurant_id)
        .order_by(
            Reservation.reservation_date.asc(),
            Reservation.reservation_time.asc()
        )
        .all()
    )


@router.post("/")
def create_reservation(
    reservation: ReservationCreate,
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    """Create a reservation only for the authenticated restaurant.

    Vapi does not use this HTTP endpoint: it calls the internal reservation
    service through the authenticated webhook mapping. This endpoint remains
    available for an authenticated restaurant admin. Its restaurant is
    resolved exclusively from the authenticated RestaurantUser membership.
    """

    customer = (
        db.query(Customer)
        .filter(Customer.id == reservation.customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    if customer.restaurant_id != restaurant_user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot use a customer from another restaurant"
        )

    new_reservation = Reservation(
        restaurant_id=restaurant_user.restaurant_id,
        customer_id=customer.id,
        reservation_date=reservation.reservation_date,
        reservation_time=reservation.reservation_time,
        guests=reservation.guests,
        notes=reservation.notes,
        status="confirmed"
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    return new_reservation


@router.get("")
def get_current_restaurant_reservations(
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    """Return reservations for the authenticated user's restaurant only."""

    return get_reservations_for_restaurant(
        db,
        str(restaurant_user.restaurant_id)
    )


@restaurant_router.get("/{restaurant_id}/reservations")
def get_restaurant_reservations(
    restaurant_id: UUID,
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    if restaurant_user.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view reservations for another restaurant"
        )

    return get_reservations_for_restaurant(db, restaurant_id)


@router.delete("/{reservation_id}")
def cancel_reservation(
    reservation_id: UUID,
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    if reservation.restaurant_id != restaurant_user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot cancel reservations for another restaurant"
        )

    reservation.status = "cancelled"
    db.commit()

    return {
        "message": "Reservation cancelled"
    }
