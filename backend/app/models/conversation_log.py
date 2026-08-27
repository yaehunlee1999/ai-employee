from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from app.database.connection import Base
import uuid


class ConversationLog(Base):
    __tablename__ = "conversation_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id")
    )

    customer_phone = Column(String)

    user_message = Column(Text)

    ai_response = Column(Text)

    vapi_call_id = Column(String, unique=True)

    reservation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reservations.id", ondelete="SET NULL")
    )

    transcript = Column(Text)

    summary = Column(Text)

    recording_url = Column(Text)

    duration = Column(Float)

    analysis = Column(JSONB)

    call_ended_reason = Column(String)

    created_at = Column(DateTime, server_default=func.now()
    )
