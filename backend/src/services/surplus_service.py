from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import (
    InvalidSpecificationValueError,
    InvalidStatusTransitionError,
    MaterialNotAvailableError,
    MaterialNotFoundError,
    PermissionDeniedError,
    SpecificationNotBelongToMaterialError,
    SpecificationNotFoundError,
    SurplusNotFoundError,
)
from models.enums import (
    MaterialStatus,
    SpecificationDataType,
    SurplusStatus,
    UserRole,
)
from models.material import Material
from models.specification import Specification
from models.surplus import Surplus
from models.surplus_specification import SurplusSpecification
from models.user import User
from repositories import material_repository, surplus_repository
from schemas.surplus import (
    SurplusCreate,
    SurplusSpecificationInput,
    SurplusUpdate,
)


# Transiciones de status permitidas por el dueño
_ALLOWED_TRANSITIONS: dict[SurplusStatus, set[SurplusStatus]] = {
    SurplusStatus.AVAILABLE: {
        SurplusStatus.RESERVED,
        SurplusStatus.INACTIVE,
    },
    SurplusStatus.RESERVED: {
        SurplusStatus.AVAILABLE,
        SurplusStatus.SOLD,
        SurplusStatus.INACTIVE,
    },
    SurplusStatus.SOLD: set(),  # terminal para el dueño
    SurplusStatus.INACTIVE: {
        SurplusStatus.AVAILABLE,
    },
}


def _assert_owner_or_admin(surplus: Surplus, current_user: User) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if surplus.company_id != current_user.company_id:
        raise PermissionDeniedError(
            "Solo puedes modificar excedentes de tu empresa",
        )


def _validate_and_build_specs(
    db: Session,
    material_id: int,
    inputs: list[SurplusSpecificationInput],
) -> list[SurplusSpecification]:
    """Valida que cada spec exista, pertenezca al material y su valor
    corresponda al data_type. También verifica que estén presentes
    las specs requeridas del material."""

    # Detectar duplicados
    seen: set[int] = set()
    for inp in inputs:
        if inp.specification_id in seen:
            raise InvalidSpecificationValueError(
                f"Especificación {inp.specification_id} duplicada"
            )
        seen.add(inp.specification_id)

    # Cargar specs referenciadas
    specs_by_id: dict[int, Specification] = {}
    if seen:
        rows = db.scalars(
            select(Specification).where(Specification.id.in_(seen))
        ).all()
        specs_by_id = {s.id: s for s in rows}

    result: list[SurplusSpecification] = []

    for inp in inputs:
        spec = specs_by_id.get(inp.specification_id)
        if spec is None:
            raise SpecificationNotFoundError(inp.specification_id)

        if spec.material_id != material_id:
            raise SpecificationNotBelongToMaterialError(
                inp.specification_id, material_id,
            )

        # Validar que solo el campo correcto tenga valor
        if spec.data_type == SpecificationDataType.NUMBER:
            if inp.value_number is None:
                raise InvalidSpecificationValueError(
                    f"'{spec.name}' requiere value_number"
                )
            if inp.value_text is not None or inp.value_boolean is not None:
                raise InvalidSpecificationValueError(
                    f"'{spec.name}' solo acepta value_number"
                )
        elif spec.data_type == SpecificationDataType.TEXT:
            if inp.value_text is None:
                raise InvalidSpecificationValueError(
                    f"'{spec.name}' requiere value_text"
                )
            if inp.value_number is not None or inp.value_boolean is not None:
                raise InvalidSpecificationValueError(
                    f"'{spec.name}' solo acepta value_text"
                )
        elif spec.data_type == SpecificationDataType.BOOLEAN:
            if inp.value_boolean is None:
                raise InvalidSpecificationValueError(
                    f"'{spec.name}' requiere value_boolean"
                )
            if inp.value_number is not None or inp.value_text is not None:
                raise InvalidSpecificationValueError(
                    f"'{spec.name}' solo acepta value_boolean"
                )

        result.append(
            SurplusSpecification(
                specification_id=spec.id,
                value_number=inp.value_number,
                value_text=inp.value_text,
                value_boolean=inp.value_boolean,
            )
        )

    # Verificar requeridas
    required = db.scalars(
        select(Specification).where(
            Specification.material_id == material_id,
            Specification.is_required.is_(True),
        )
    ).all()

    missing = [s for s in required if s.id not in seen]
    if missing:
        names = ", ".join(s.name for s in missing)
        raise InvalidSpecificationValueError(
            f"Faltan especificaciones requeridas: {names}"
        )

    return result


def create_surplus(
    db: Session,
    data: SurplusCreate,
    current_user: User,
) -> Surplus:
    material = material_repository.get_by_id(db, data.material_id)
    if material is None:
        raise MaterialNotFoundError(data.material_id)

    if material.status != MaterialStatus.ACTIVE:
        raise MaterialNotAvailableError(data.material_id)

    specs = _validate_and_build_specs(
        db, data.material_id, data.specifications,
    )

    surplus = Surplus(
        company_id=current_user.company_id,   # ← NUNCA del cliente
        material_id=data.material_id,
        quantity=data.quantity,
        unit=data.unit,
        unit_price=data.unit_price,
        description=data.description,
        status=SurplusStatus.AVAILABLE,
        specifications=specs,
    )

    return surplus_repository.create(db, surplus)


def list_surpluses(
    db: Session,
    current_user: User,
    *,
    mine: bool = False,
    status: SurplusStatus | None = None,
    material_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Surplus]:

    company_id: int | None = None
    status_filter: SurplusStatus | None = status

    if mine:
        company_id = current_user.company_id
        # El dueño ve todos sus status salvo que pida uno específico
    else:
        if current_user.role == UserRole.PLATFORM_ADMIN:
            # Admin ve todo salvo que filtre
            pass
        else:
            # Resto: solo AVAILABLE
            if status_filter is None:
                status_filter = SurplusStatus.AVAILABLE

    return surplus_repository.list_surpluses(
        db,
        status=status_filter,
        material_id=material_id,
        company_id=company_id,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=limit,
    )


def get_surplus(db: Session, surplus_id: int, current_user: User) -> Surplus:
    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    # Visible si:
    #   - status AVAILABLE (cualquiera lo ve)
    #   - eres del mismo company_id
    #   - eres platform_admin
    if (
        surplus.status != SurplusStatus.AVAILABLE
        and surplus.company_id != current_user.company_id
        and current_user.role != UserRole.PLATFORM_ADMIN
    ):
        raise SurplusNotFoundError(surplus_id)

    return surplus


def update_surplus(
    db: Session,
    surplus_id: int,
    data: SurplusUpdate,
    current_user: User,
) -> Surplus:
    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    _assert_owner_or_admin(surplus, current_user)

    # No se puede editar si está SOLD
    if (
        surplus.status == SurplusStatus.SOLD
        and current_user.role != UserRole.PLATFORM_ADMIN
    ):
        raise PermissionDeniedError(
            "No se puede editar un excedente vendido",
        )

    if data.quantity is not None:
        surplus.quantity = data.quantity
    if data.unit is not None:
        surplus.unit = data.unit
    if data.unit_price is not None:
        surplus.unit_price = data.unit_price
    if data.description is not None:
        surplus.description = data.description

    if data.specifications is not None:
        # Reemplazo total
        surplus.specifications = _validate_and_build_specs(
            db, surplus.material_id, data.specifications,
        )

    db.commit()
    db.refresh(surplus)
    return surplus


def delete_surplus(
    db: Session,
    surplus_id: int,
    current_user: User,
) -> Surplus:
    """Soft delete: marca como INACTIVE."""
    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    _assert_owner_or_admin(surplus, current_user)

    if surplus.status == SurplusStatus.SOLD:
        raise PermissionDeniedError(
            "No se puede desactivar un excedente vendido",
        )

    surplus.status = SurplusStatus.INACTIVE
    db.commit()
    db.refresh(surplus)
    return surplus


def change_status(
    db: Session,
    surplus_id: int,
    target: SurplusStatus,
    current_user: User,
) -> Surplus:
    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    _assert_owner_or_admin(surplus, current_user)

    # platform_admin salta validación de transiciones
    if current_user.role != UserRole.PLATFORM_ADMIN:
        allowed = _ALLOWED_TRANSITIONS.get(surplus.status, set())
        if target not in allowed:
            raise InvalidStatusTransitionError(
                surplus.status.value, target.value,
            )

    surplus.status = target
    db.commit()
    db.refresh(surplus)
    return surplus