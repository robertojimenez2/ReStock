from datetime import UTC, datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Numeric,
    String,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import SurplusStatus
from models.offer import Offer


def utc_now() -> datetime:
    return datetime.now(UTC)


class Surplus(Base):
    __tablename__ = "surpluses"

    id: Mapped[int] = mapped_column(primary_key=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    unit_price: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    status: Mapped[SurplusStatus] = mapped_column(
        SQLEnum(
            SurplusStatus,
            native_enum=False,
            length=30,
        ),
        default=SurplusStatus.AVAILABLE,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    company = relationship(
        "Company",
        back_populates="surpluses",
    )

    material = relationship(
        "Material",
        back_populates="surpluses",
    )

    specifications = relationship(
        "SurplusSpecification",
        back_populates="surplus",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )   

    offers: Mapped[list["Offer"]] = relationship(
        "Offer",
        back_populates="surplus",
        cascade="all, delete-orphan",
        passive_deletes=True,   # ← añadir
    )