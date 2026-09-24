from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from models.need import Need
    from models.surplus import Surplus
    from models.user import User

def utc_now() -> datetime:
    return datetime.now(UTC)

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    legal_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    address: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="company",
    )

    surpluses: Mapped[list["Surplus"]] = relationship(
        "Surplus",
        back_populates="company",
    )

    needs: Mapped[list["Need"]] = relationship(
        "Need",
        back_populates="company",
    )