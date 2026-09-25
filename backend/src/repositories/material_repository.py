from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models.enums import MaterialStatus
from models.material import Material


def get_by_id(db: Session, material_id: int) -> Material | None:
    return db.get(Material, material_id)


def get_by_name(db: Session, name: str) -> Material | None:
    return db.scalar(select(Material).where(Material.name == name))


def list_materials(
    db: Session,
    *,
    status: MaterialStatus | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Material]:
    stmt = select(Material)

    if status is not None:
        stmt = stmt.where(Material.status == status)

    if category is not None:
        stmt = stmt.where(Material.category == category)

    stmt = stmt.order_by(Material.name).offset(skip).limit(limit)

    return list(db.scalars(stmt).all())


def create(
    db: Session,
    *,
    name: str,
    category: str,
    description: str | None,
    status: MaterialStatus,
    proposed_by_company_id: int | None,
) -> Material:
    material = Material(
        name=name,
        category=category,
        description=description,
        status=status,
        proposed_by_company_id=proposed_by_company_id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def update(db: Session, material: Material, **fields) -> Material:
    for key, value in fields.items():
        if value is not None:
            setattr(material, key, value)

    db.commit()
    db.refresh(material)
    return material


def delete(db: Session, material: Material) -> None:
    db.delete(material)
    db.commit()


def list_materials_for_company(
    db: Session,
    *,
    company_id: int,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Material]:
    """Materiales visibles para una empresa:
    - ACTIVE del catálogo (compartidos)
    - propuestas propias en cualquier estado (PENDING, REJECTED)
    """
    stmt = select(Material).where(
        or_(
            Material.status == MaterialStatus.ACTIVE,
            Material.proposed_by_company_id == company_id,
        )
    )

    if category is not None:
        stmt = stmt.where(Material.category == category)

    stmt = stmt.order_by(Material.name).offset(skip).limit(limit)

    return list(db.scalars(stmt).all())