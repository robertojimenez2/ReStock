from datetime import datetime
from db.base import Base
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    legal_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=False
    )

    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
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
        DateTime,
        default=datetime.utcnow,
    )

    users = relationship(
        "User",
        back_populates="company",
    )

    surpluses = relationship(
        "Surplus",
        back_populates="company",
    )

    needs = relationship(
        "Needs",
        back_populates="company"
    )