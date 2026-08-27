from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.auth import get_current_restaurant_user
from app.database.connection import SessionLocal
from app.models.restaurant import Restaurant
from app.models.restaurant_settings import RestaurantSettings
from app.models.restaurant_user import RestaurantUser
from app.schemas.settings import VapiAssistantSettingsUpdate


router = APIRouter(
    prefix="/settings",
    tags=["settings"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_restaurant_or_404(
    db: Session,
    restaurant_id
) -> Restaurant:
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    return restaurant


def get_restaurant_settings(
    db: Session,
    restaurant_id
) -> RestaurantSettings | None:
    return (
        db.query(RestaurantSettings)
        .filter(RestaurantSettings.restaurant_id == restaurant_id)
        .first()
    )


def serialize_settings(
    restaurant: Restaurant,
    restaurant_settings: RestaurantSettings | None
):
    return {
        "restaurant_name": restaurant.name,
        "vapi_assistant_id": (
            restaurant_settings.vapi_assistant_id
            if restaurant_settings
            else None
        )
    }


@router.get("")
def get_settings(
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    restaurant = get_restaurant_or_404(db, restaurant_user.restaurant_id)
    restaurant_settings = get_restaurant_settings(
        db,
        restaurant_user.restaurant_id
    )

    return serialize_settings(restaurant, restaurant_settings)


@router.patch("/vapi")
def update_vapi_assistant(
    update: VapiAssistantSettingsUpdate,
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user),
    db: Session = Depends(get_db)
):
    if restaurant_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only restaurant owners can update Vapi settings"
        )

    if "vapi_assistant_id" not in update.model_fields_set:
        raise HTTPException(
            status_code=422,
            detail="vapi_assistant_id is required"
        )

    restaurant = get_restaurant_or_404(db, restaurant_user.restaurant_id)
    restaurant_settings = get_restaurant_settings(
        db,
        restaurant_user.restaurant_id
    )

    assistant_id = update.vapi_assistant_id
    if assistant_id is not None:
        assistant_id = assistant_id.strip() or None

    try:
        if not restaurant_settings:
            restaurant_settings = RestaurantSettings(
                restaurant_id=restaurant_user.restaurant_id
            )
            db.add(restaurant_settings)

        restaurant_settings.vapi_assistant_id = assistant_id
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Vapi Assistant is already linked to another restaurant"
        ) from error
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update Vapi settings"
        ) from error

    return serialize_settings(restaurant, restaurant_settings)
