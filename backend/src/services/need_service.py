from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import (
    InvalidSpecificationValueError,
    InvalidStatusTransitionError,
    MaterialNotAvailableError,
    MaterialNotFoundError,
    NeedNotFoundError,
    PermissionDeniedError,
)
from models.enums import (
    MaterialStatus,
    NeedStatus,
    SpecificationDataType,
    UserRole,
)
from models.need import Need
from models.need_specification import NeedSpecification
from models.specification import Specification
from models.user import User
from repositories import material_repository, need_repository
from schemas.need import (
    NeedCreate,
    NeedSpecificationInput,
    NeedUpdate,
)
from services import _spec_validation

_ALLOWED_TRANSITIONS: dict[NeedStatus, set[NeedStatus]] = {
    NeedStatus.ACTIVE: {
        NeedStatus.FULFILLED,
        NeedStatus.INACTIVE,
    },
    NeedStatus.FULFILLED: set(),  # terminal para el dueño
    NeedStatus.INACTIVE: {
        NeedStatus.ACTIVE,
    },
}


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _assert_owner_or_admin(need: Need, current_user: User) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if need.company_id != current_user.company_id:
        raise PermissionDeniedError(
            "Solo puedes modificar necesidades de tu empresa",
        )


def _load_specs_by_ids(
    db: Session, ids: set[int],
) -> dict[int, Specification]:
    if not ids:
        return {}
    rows = db.scalars(
        select(Specification).where(Specification.id.in_(ids))
    ).all()
    return {s.id: s for s in rows}


def _validate_and_build_specs(
    db: Session,
    material_id: int,
    inputs: list[NeedSpecificationInput],
) -> list[NeedSpecification]:
    """Valida que cada spec exista, pertenezca al material, y su valor
    o rango corresponda al data_type. Verifica también que estén las
    requeridas."""

    specs_by_id = _spec_validation.resolve_specs(
        db, material_id, inputs,
    )

    result: list[NeedSpecification] = []

    for inp in inputs:
        spec = specs_by_id[inp.specification_id]
        _validate_value_for_spec(inp, spec)
        result.append(
            NeedSpecification(
                specification_id=spec.id,
                value_number=inp.value_number,
                min_value_number=inp.min_value_number,
                max_value_number=inp.max_value_number,
                value_text=inp.value_text,
                value_boolean=inp.value_boolean,
            )
        )

    _spec_validation.assert_required_specs_present(
        db, material_id, {inp.specification_id for inp in inputs},
    )

    return result


def _validate_value_for_spec(
    inp: NeedSpecificationInput, spec: Specification,
) -> None:
    """Valida que el input tenga exactamente los campos correctos según
    el data_type de la spec."""

    if spec.data_type == SpecificationDataType.NUMBER:
        has_exact = inp.value_number is not None
        has_range = (
            inp.min_value_number is not None
            or inp.max_value_number is not None
        )

        if not has_exact and not has_range:
            raise InvalidSpecificationValueError(
                f"'{spec.name}' requiere value_number o un rango min/max"
            )

        if inp.value_text is not None or inp.value_boolean is not None:
            raise InvalidSpecificationValueError(
                f"'{spec.name}' solo acepta valores numéricos"
            )

    elif spec.data_type == SpecificationDataType.TEXT:
        if inp.value_text is None:
            raise InvalidSpecificationValueError(
                f"'{spec.name}' requiere value_text"
            )
        if (
            inp.value_number is not None
            or inp.min_value_number is not None
            or inp.max_value_number is not None
            or inp.value_boolean is not None
        ):
            raise InvalidSpecificationValueError(
                f"'{spec.name}' solo acepta value_text"
            )

    elif spec.data_type == SpecificationDataType.BOOLEAN:
        if inp.value_boolean is None:
            raise InvalidSpecificationValueError(
                f"'{spec.name}' requiere value_boolean"
            )
        if (
            inp.value_number is not None
            or inp.min_value_number is not None
            or inp.max_value_number is not None
            or inp.value_text is not None
        ):
            raise InvalidSpecificationValueError(
                f"'{spec.name}' solo acepta value_boolean"
            )


def create_need(
    db: Session,
    data: NeedCreate,
    current_user: User,
) -> Need:
    material = material_repository.get_by_id(db, data.material_id)
    if material is None:
        raise MaterialNotFoundError(data.material_id)

    if material.status != MaterialStatus.ACTIVE:
        raise MaterialNotAvailableError(data.material_id)

    specs = _validate_and_build_specs(
        db, data.material_id, data.specifications,
    )

    need = Need(
        company_id=current_user.company_id,   # ← NUNCA del cliente
        material_id=data.material_id,
        quantity=data.quantity,
        unit=data.unit,
        max_price=data.max_price,
        description=data.description,
        status=NeedStatus.ACTIVE,
        specifications=specs,
    )

    return need_repository.create(db, need)


def list_needs(
    db: Session,
    current_user: User,
    *,
    mine: bool = False,
    status: NeedStatus | None = None,
    material_id: int | None = None,
    min_quantity: float | None = None,
    max_quantity: float | None = None,
    min_max_price: float | None = None,
    max_max_price: float | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Need]:

    company_id: int | None = None
    status_filter: NeedStatus | None = status

    if mine:
        company_id = current_user.company_id
    elif (
        current_user.role != UserRole.PLATFORM_ADMIN
        and status_filter is None
    ):
        # El resto solo ve ACTIVE (candidatas a matching)
        status_filter = NeedStatus.ACTIVE

    return need_repository.list_needs(
        db,
        status=status_filter,
        material_id=material_id,
        company_id=company_id,
        min_quantity=min_quantity,
        max_quantity=max_quantity,
        min_max_price=min_max_price,
        max_max_price=max_max_price,
        skip=skip,
        limit=limit,
    )


def get_need(db: Session, need_id: int, current_user: User) -> Need:
    need = need_repository.get_by_id(db, need_id)
    if need is None:
        raise NeedNotFoundError(need_id)

    if (
        need.status != NeedStatus.ACTIVE
        and need.company_id != current_user.company_id
        and current_user.role != UserRole.PLATFORM_ADMIN
    ):
        raise NeedNotFoundError(need_id)

    return need


def update_need(
    db: Session,
    need_id: int,
    data: NeedUpdate,
    current_user: User,
) -> Need:
    need = need_repository.get_by_id(db, need_id)
    if need is None:
        raise NeedNotFoundError(need_id)

    _assert_owner_or_admin(need, current_user)

    if (
        need.status == NeedStatus.FULFILLED
        and current_user.role != UserRole.PLATFORM_ADMIN
    ):
        raise PermissionDeniedError(
            "No se puede editar una necesidad ya cumplida",
        )

    if data.quantity is not None:
        need.quantity = data.quantity
    if data.unit is not None:
        need.unit = data.unit
    if data.max_price is not None:
        need.max_price = data.max_price
    if data.description is not None:
        need.description = data.description

    if data.specifications is not None:
        need.specifications = _validate_and_build_specs(
            db, need.material_id, data.specifications,
        )

    # Forzar updated_at aunque solo cambien specs
    need.updated_at = _utc_now()

    db.commit()
    db.refresh(need)
    return need


def delete_need(
    db: Session,
    need_id: int,
    current_user: User,
) -> Need:
    """Soft delete: marca como INACTIVE."""
    need = need_repository.get_by_id(db, need_id)
    if need is None:
        raise NeedNotFoundError(need_id)

    _assert_owner_or_admin(need, current_user)

    if need.status == NeedStatus.FULFILLED:
        raise PermissionDeniedError(
            "No se puede desactivar una necesidad cumplida",
        )

    need.status = NeedStatus.INACTIVE
    db.commit()
    db.refresh(need)
    return need


def change_status(
    db: Session,
    need_id: int,
    target: NeedStatus,
    current_user: User,
) -> Need:
    need = need_repository.get_by_id(db, need_id)
    if need is None:
        raise NeedNotFoundError(need_id)

    _assert_owner_or_admin(need, current_user)

    if current_user.role != UserRole.PLATFORM_ADMIN:
        allowed = _ALLOWED_TRANSITIONS.get(need.status, set())
        if target not in allowed:
            raise InvalidStatusTransitionError(
                need.status.value, target.value,
            )

    need.status = target
    db.commit()
    db.refresh(need)
    return need