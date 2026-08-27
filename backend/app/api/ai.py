from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.ai.agent import run_agent
from app.models.restaurant_user import RestaurantUser


router = APIRouter(
    prefix="/ai",
    tags=["ai"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



@router.post("/chat")
def chat(
    message: str = Query(min_length=1, max_length=2000),
    phone: str = Query(min_length=3, max_length=50),
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    if not message.strip() or not phone.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Message and phone must not be blank"
        )

    response = run_agent(
        message.strip(),
        db,
        phone.strip(),
        restaurant_id=restaurant_user.restaurant_id
    )
    return response
