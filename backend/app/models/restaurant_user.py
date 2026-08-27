import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.connection import Base


class RestaurantUser(Base):
    __tablename__ = "restaurant_users"

    __table_args__ = (
        UniqueConstraint("email", name="restaurant_users_email_key"),
        Index("restaurant_users_restaurant_id_idx", "restaurant_id"),
        Index(
            "restaurant_users_auth_user_id_key",
            "auth_user_id",
            unique=True,
            postgresql_where=text("auth_user_id IS NOT NULL")
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False
    )

    auth_user_id = Column(
        UUID(as_uuid=True),
        nullable=True
    )

    email = Column(
        Text,
        nullable=False
    )

    password_hash = Column(
        Text,
        nullable=True
    )

    name = Column(
        String
    )

    role = Column(
        String,
        default="owner",
        server_default="owner"
    )

    created_at = Column(
        DateTime(timezone=False),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=False),
        server_default=func.now()
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="restaurant_users"
    )
