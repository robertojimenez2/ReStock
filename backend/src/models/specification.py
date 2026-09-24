from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import SpecificationDataType


def utc_now() -> datetime:
    return datetime.now(UTC)




class Specification(Base):
    __tablename__ = "specifications"

    __table_args__ = (
        UniqueConstraint(
            "material_id",
            "name",
            name="uq_specification_material_name",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    data_type: Mapped[SpecificationDataType] = mapped_column(
        SQLEnum(
            SpecificationDataType,
            native_enum=False,
            length=20,
        ),
        nullable=False,
    )

    unit: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    material = relationship(
        "Material",
        back_populates="specifications",
    )

    surplus_values = relationship(
        "SurplusSpecification",
        back_populates="specification",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    need_values = relationship(
        "NeedSpecification",
        back_populates="specification",
        cascade="all, delete-orphan",
        passive_deletes=True
    )