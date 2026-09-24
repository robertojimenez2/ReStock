from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import NotificationType


def utc_now() -> datetime:
    return datetime.now(UTC)


class Notification(Base):
    __tablename__ = "notifications"

    __table_args__ = (
        Index("ix_notifications_user_unread", "user_id", "read_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType, native_enum=False, length=40),
        nullable=False,
        index=True,
    )

    payload: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )

    user = relationship("User", backref="notifications")