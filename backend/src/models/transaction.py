from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import TransactionStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)

    offer_id: Mapped[int] = mapped_column(
        ForeignKey("offers.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    surplus_id: Mapped[int] = mapped_column(
        ForeignKey("surpluses.id"),
        nullable=False,
        index=True,
    )

    seller_company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    buyer_company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    status: Mapped[TransactionStatus] = mapped_column(
        SQLEnum(TransactionStatus, native_enum=False, length=20),
        default=TransactionStatus.PENDING,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    offer = relationship("Offer", back_populates="transaction")
    surplus = relationship("Surplus")
    seller = relationship("Company", foreign_keys=[seller_company_id])
    buyer = relationship("Company", foreign_keys=[buyer_company_id])