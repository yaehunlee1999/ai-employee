from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.models.customer import Customer
from app.models.restaurant_user import RestaurantUser
from app.schemas.customer import CustomerCreate


router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_customer(
    customer: CustomerCreate,
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):

    new_customer = Customer(
        restaurant_id=restaurant_user.restaurant_id,
        name=customer.name,
        phone=customer.phone
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer
