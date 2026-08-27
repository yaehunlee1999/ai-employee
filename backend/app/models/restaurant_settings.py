import uuid

from sqlalchemy import Column, String, Text, JSON, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database.connection import Base


class RestaurantSettings(Base):

    __tablename__ = "restaurant_settings"


    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id"),
        nullable=False,
        unique=True
    )


    vapi_assistant_id = Column(
        Text
    )


    phone_number = Column(
        String
    )


    business_hours = Column(
        JSON,
        default={}
    )


    timezone = Column(
        String,
        default="Europe/Dublin"
    )


    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )


    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )
