from datetime import datetime, timezone

from db.base import Base
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

def utc_now() -> datetime:
    return datetime.now(timezone.utc)



class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    surpluses = relationship(
        "Surplus",
        back_populates="material",
    )

    needs = relationship(
        "Need",
        back_populates="material"
    )

    specifications = relationship(
        "Specification",
        back_populates="material"
    )