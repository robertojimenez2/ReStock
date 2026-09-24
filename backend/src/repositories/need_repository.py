from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models.enums import NeedStatus
from models.need import Need


def get_by_id(db: Session, need_id: int) -> Need | None:
    return db.scalar(
        select(Need)
        .options(selectinload(Need.specifications))
        .where(Need.id == need_id)
    )


def list_needs(
    db: Session,
    *,
    status: NeedStatus | None = None,
    material_id: int | None = None,
    company_id: int | None = None,
    min_quantity: float | None = None,
    max_quantity: float | None = None,
    min_max_price: float | None = None,
    max_max_price: float | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Need]:
    stmt = select(Need).options(selectinload(Need.specifications))

    if status is not None:
        stmt = stmt.where(Need.status == status)
    if material_id is not None:
        stmt = stmt.where(Need.material_id == material_id)
    if company_id is not None:
        stmt = stmt.where(Need.company_id == company_id)
    if min_quantity is not None:
        stmt = stmt.where(Need.quantity >= min_quantity)
    if max_quantity is not None:
        stmt = stmt.where(Need.quantity <= max_quantity)
    if min_max_price is not None:
        stmt = stmt.where(Need.max_price >= min_max_price)
    if max_max_price is not None:
        stmt = stmt.where(Need.max_price <= max_max_price)

    stmt = stmt.order_by(Need.created_at.desc()).offset(skip).limit(limit)

    return list(db.scalars(stmt).all())


def create(db: Session, need: Need) -> Need:
    db.add(need)
    db.commit()
    db.refresh(need)
    return need