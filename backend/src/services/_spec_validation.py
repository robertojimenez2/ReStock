"""Utilidades compartidas de validación de especificaciones.

Usadas por surplus_service y need_service. No conoce reglas de negocio
de cada entidad — solo validaciones estructurales comunes.
"""

from collections.abc import Sequence
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import (
    InvalidSpecificationValueError,
    SpecificationNotBelongToMaterialError,
    SpecificationNotFoundError,
)
from models.specification import Specification


class HasSpecificationId(Protocol):

    specification_id: int


def load_specs_by_ids(
    db: Session, ids: set[int],
) -> dict[int, Specification]:
    """Carga Specifications por ID. Retorna dict {id: Specification}."""
    if not ids:
        return {}

    rows = db.scalars(
        select(Specification).where(Specification.id.in_(ids))
    ).all()
    return {s.id: s for s in rows}


def assert_no_duplicates(
    inputs: Sequence[HasSpecificationId],
) -> None:
    """Falla si hay specification_id repetidos."""
    seen: set[int] = set()
    for inp in inputs:
        if inp.specification_id in seen:
            raise InvalidSpecificationValueError(
                f"Especificación {inp.specification_id} duplicada"
            )
        seen.add(inp.specification_id)


def resolve_specs(
    db: Session,
    material_id: int,
    inputs: Sequence[HasSpecificationId],
) -> dict[int, Specification]:
    """Valida duplicados, existencia y pertenencia al material.

    Devuelve un dict {specification_id: Specification} para que el
    caller use las specs ya cargadas sin volver a consultar.
    """
    assert_no_duplicates(inputs)

    ids = {inp.specification_id for inp in inputs}
    specs_by_id = load_specs_by_ids(db, ids)

    for inp in inputs:
        spec = specs_by_id.get(inp.specification_id)
        if spec is None:
            raise SpecificationNotFoundError(inp.specification_id)
        if spec.material_id != material_id:
            raise SpecificationNotBelongToMaterialError(
                inp.specification_id, material_id,
            )

    return specs_by_id


def assert_required_specs_present(
    db: Session,
    material_id: int,
    provided_ids: set[int],
) -> None:
    """Falla si falta alguna Specification con is_required=True del
    material indicado."""
    required = db.scalars(
        select(Specification).where(
            Specification.material_id == material_id,
            Specification.is_required.is_(True),
        )
    ).all()

    missing = [s for s in required if s.id not in provided_ids]
    if missing:
        names = ", ".join(s.name for s in missing)
        raise InvalidSpecificationValueError(
            f"Faltan especificaciones requeridas: {names}"
        )