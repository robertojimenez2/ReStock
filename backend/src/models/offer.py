from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import OfferStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True)

    surplus_id: Mapped[int] = mapped_column(
        ForeignKey("surpluses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    offered_by_company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    offered_to_company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    parent_offer_id: Mapped[int | None] = mapped_column(
        ForeignKey("offers.id"),
        nullable=True,
        index=True,
    )

    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    status: Mapped[OfferStatus] = mapped_column(
        SQLEnum(OfferStatus, native_enum=False, length=20),
        default=OfferStatus.PENDING,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now,
    )

    surplus = relationship("Surplus", back_populates="offers")
    offered_by = relationship("Company", foreign_keys=[offered_by_company_id])
    offered_to = relationship("Company", foreign_keys=[offered_to_company_id])
    parent_offer = relationship("Offer", remote_side=[id])
    transaction = relationship(
        "Transaction",
        back_populates="offer",
        uselist=False,
    )