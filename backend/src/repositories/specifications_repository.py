from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.need_specification import NeedSpecification
from models.specification import Specification
from models.surplus_specification import SurplusSpecification


def get_by_id(db: Session, specification_id: int) -> Specification | None:
    return db.get(Specification, specification_id)


def get_by_material_and_name(
    db: Session, material_id: int, name: str,
) -> Specification | None:
    return db.scalar(
        select(Specification).where(
            Specification.material_id == material_id,
            Specification.name == name,
        )
    )


def list_by_material(db: Session, material_id: int) -> list[Specification]:
    return list(
        db.scalars(
            select(Specification)
            .where(Specification.material_id == material_id)
            .order_by(Specification.name)
        ).all()
    )


def create(
    db: Session,
    *,
    material_id: int,
    name: str,
    data_type,
    unit: str | None,
    description: str | None,
    is_required: bool,
) -> Specification:
    spec = Specification(
        material_id=material_id,
        name=name,
        data_type=data_type,
        unit=unit,
        description=description,
        is_required=is_required,
    )
    db.add(spec)
    db.commit()
    db.refresh(spec)
    return spec


def update(db: Session, spec: Specification, **fields) -> Specification:
    for key, value in fields.items():
        if value is not None:
            setattr(spec, key, value)
    db.commit()
    db.refresh(spec)
    return spec


def delete(db: Session, spec: Specification) -> None:
    db.delete(spec)
    db.commit()


def has_associated_values(db: Session, specification_id: int) -> bool:
    surplus_count = db.scalar(
        select(func.count())
        .select_from(SurplusSpecification)
        .where(SurplusSpecification.specification_id == specification_id)
    )
    if surplus_count:
        return True

    need_count = db.scalar(
        select(func.count())
        .select_from(NeedSpecification)
        .where(NeedSpecification.specification_id == specification_id)
    )
    return bool(need_count)