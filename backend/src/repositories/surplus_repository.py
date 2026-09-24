from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models.enums import SurplusStatus
from models.surplus import Surplus


def get_by_id(db: Session, surplus_id: int) -> Surplus | None:
    return db.scalar(
        select(Surplus)
        .options(selectinload(Surplus.specifications))
        .where(Surplus.id == surplus_id)
    )


def list_surpluses(
    db: Session,
    *,
    status: SurplusStatus | None = None,
    material_id: int | None = None,
    company_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Surplus]:
    stmt = (
        select(Surplus)
        .options(selectinload(Surplus.specifications))
    )

    if status is not None:
        stmt = stmt.where(Surplus.status == status)
    if material_id is not None:
        stmt = stmt.where(Surplus.material_id == material_id)
    if company_id is not None:
        stmt = stmt.where(Surplus.company_id == company_id)
    if min_price is not None:
        stmt = stmt.where(Surplus.unit_price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Surplus.unit_price <= max_price)

    stmt = stmt.order_by(Surplus.created_at.desc()).offset(skip).limit(limit)

    return list(db.scalars(stmt).all())


def create(db: Session, surplus: Surplus) -> Surplus:
    db.add(surplus)
    db.commit()
    db.refresh(surplus)
    return surplus


def delete(db: Session, surplus: Surplus) -> None:
    db.delete(surplus)
    db.commit()