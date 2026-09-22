from datetime import datetime

from db.base import Base
from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum
from models.enums import NeedStatus


class Need(Base):
    __tablename__ = "needs"

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

    max_price: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    status: Mapped[NeedStatus] = mapped_column(
    SQLEnum(
        NeedStatus,
        native_enum=False,
        length=30,
    ),
    default=NeedStatus.ACTIVE,
    nullable=False,
    index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    company = relationship(
        "Company",
        back_populates="needs",
    )

    material = relationship(
        "Material",
        back_populates="needs",
    )

    specifications = relationship(
        "NeedSpecification",
        back_populates="need",
        cascade="all, delete-orphan",
    )