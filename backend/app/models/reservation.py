from sqlalchemy import Column, String, Integer, Date, Time, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id")
    )

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id")
    )

    customer = relationship(
        "Customer",  
        back_populates="reservations"
    )

    reservation_date = Column(Date)
    reservation_time = Column(Time)

    guests = Column(Integer)

    status = Column(String)

    notes = Column(String)

    # This column already exists in Supabase and is used for read-only
    # operational analytics. Reservation creation remains unchanged.
    created_at = Column(DateTime, server_default=func.now())
