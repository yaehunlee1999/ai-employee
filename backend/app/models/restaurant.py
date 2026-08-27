from sqlalchemy import Boolean, Column, String, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base
from sqlalchemy.orm import relationship
import uuid


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name = Column(String, nullable=False)
    phone_number = Column(String)
    address = Column(String)
    max_capacity = Column(Integer)

    is_demo = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false")
    )

    restaurant_users = relationship(
        "RestaurantUser",
        back_populates="restaurant",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    customers = relationship(
        "Customer",
        back_populates="restaurant",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
