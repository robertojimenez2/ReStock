from datetime import datetime

from db.base import Base
from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship



class NeedSpecification(Base):
    __tablename__ = "need_specifications"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    need_id: Mapped[int] = mapped_column(
        ForeignKey("needs.id"),
        nullable=False,
        index=True,
    )

    specification_id: Mapped[int] = mapped_column(
        ForeignKey("specifications.id"),
        nullable=False,
        index=True,
    )

    value_number: Mapped[float | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    min_value_number: Mapped[float | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    max_value_number: Mapped[float | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    value_text: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    value_boolean: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    need = relationship(
        "Need",
        back_populates="specifications",
    )

    specification = relationship(
        "Specification",
        back_populates="need_values",
    )