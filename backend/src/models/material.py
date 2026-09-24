from datetime import datetime, timezone
from typing import TYPE_CHECKING

from db.base import Base
from models.enums import MaterialStatus
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from models.surplus import Surplus
    from models.need import Need
    from models.specification import Specification


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

    status: Mapped[MaterialStatus] = mapped_column(
        SQLEnum(
            MaterialStatus,
            native_enum=False,
            length=20,
        ),
        default=MaterialStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    proposed_by_company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id"),
        nullable=True,
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

    surpluses: Mapped[list["Surplus"]] = relationship(
        "Surplus",
        back_populates="material",
    )

    needs: Mapped[list["Need"]] = relationship(
        "Need",
        back_populates="material",
    )

    specifications: Mapped[list["Specification"]] = relationship(
        "Specification",
        back_populates="material",
    )