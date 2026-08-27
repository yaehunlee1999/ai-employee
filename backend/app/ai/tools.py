import json
from typing import Any
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant
from app.schemas.reservation import VapiReservationCreate


create_reservation_tool = {
    "type": "function",
    "function": {
        "name": "create_reservation",
        "description": "Create a restaurant reservation",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_name": {
                    "type": "string"
                },
                "phone": {
                    "type": "string"
                },
                "reservation_date": {
                    "type": "string"
                },
                "reservation_time": {
                    "type": "string"
                },
                "guests": {
                    "type": "integer"
                }
            },
            "required": [
                "customer_name",
                "phone",
                "reservation_date",
                "reservation_time",
                "guests"
            ]
        }
    }
}


def get_single_restaurant_id(db: Session) -> UUID:
    """Keep the legacy single-restaurant AI test path safe.

    Vapi webhooks always pass an explicit restaurant ID. This fallback only
    works when there is exactly one restaurant, preventing an
    unscoped legacy request from being assigned to an arbitrary restaurant.
    """

    restaurants = db.query(Restaurant).limit(2).all()

    if len(restaurants) != 1:
        raise ValueError(
            "A restaurant context is required when multiple restaurants exist"
        )

    return restaurants[0].id


def parse_tool_arguments(arguments: dict[str, Any] | str | None) -> dict[str, Any]:
    if isinstance(arguments, str):
        try:
            arguments = json.loads(arguments)
        except json.JSONDecodeError as error:
            raise ValueError("create_reservation arguments must be valid JSON") from error

    if not isinstance(arguments, dict):
        raise ValueError("create_reservation arguments are missing")

    try:
        return VapiReservationCreate.model_validate(arguments).model_dump()
    except ValidationError as error:
        raise ValueError("Invalid reservation information") from error


def execute_create_reservation(
    arguments: dict[str, Any] | str | None,
    db: Session,
    restaurant_id: UUID | str | None = None
):

    from app.services.reservation_service import create_reservation

    reservation_arguments = parse_tool_arguments(arguments)
    resolved_restaurant_id = restaurant_id or get_single_restaurant_id(db)

    return create_reservation(
        db=db,
        restaurant_id=resolved_restaurant_id,
        customer_name=reservation_arguments["customer_name"],
        phone=reservation_arguments["phone"],
        reservation_date=reservation_arguments["reservation_date"],
        reservation_time=reservation_arguments["reservation_time"],
        guests=reservation_arguments["guests"]
    )
