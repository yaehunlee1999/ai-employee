from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date, time
from typing import Optional


class ReservationCreate(BaseModel):
    """Admin reservation input scoped by the authenticated membership.

    Restaurant identity is intentionally not accepted from a client. The API
    resolves it from the Supabase-authenticated RestaurantUser instead.
    """

    model_config = ConfigDict(extra="forbid")

    customer_id: UUID
    reservation_date: date
    reservation_time: time
    guests: int = Field(ge=1, le=20)
    notes: Optional[str] = Field(default=None, max_length=1000)


class VapiReservationCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=3, max_length=50)
    reservation_date: date
    reservation_time: time
    guests: int = Field(ge=1, le=20)

    @field_validator("customer_name", "phone")
    @classmethod
    def strip_and_require_text(cls, value: str) -> str:
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Value must not be blank")
        return cleaned_value
