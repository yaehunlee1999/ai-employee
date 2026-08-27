from sqlalchemy.orm import Session
from uuid import UUID

from app.models.customer import Customer
from app.models.reservation import Reservation


def create_reservation(
    db: Session,
    restaurant_id: UUID | str,
    customer_name: str,
    phone: str,
    reservation_date: str,
    reservation_time: str,
    guests: int
):

    customer = Customer(
        restaurant_id=restaurant_id,
        name=customer_name,
        phone=phone
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)


    reservation = Reservation(
        restaurant_id=restaurant_id,
        customer_id=customer.id,
        reservation_date=reservation_date,
        reservation_time=reservation_time,
        guests=guests,
        status="confirmed"
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)


    return reservation
