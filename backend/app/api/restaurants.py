from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.models.restaurant import Restaurant
from app.models.restaurant_user import RestaurantUser


router = APIRouter(
    prefix="/restaurants",
    tags=["restaurants"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{restaurant_id}")
def get_restaurant(
    restaurant_id: UUID,
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):

    if restaurant_user.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view another restaurant"
        )

    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    return restaurant
