from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base
from sqlalchemy.orm import relationship
import uuid


class Customer(Base):
    __tablename__ = "customers"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    reservations = relationship(
        "Reservation",
        back_populates="customer"
    )

    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="customers"
    )

    name = Column(String, nullable=False)
    phone = Column(String)
