from sqlalchemy.orm import Session

from core.exceptions import (
    MaterialNotEditableError,
    MaterialNotFoundError,
    PermissionDeniedError,
    SpecificationAlreadyExistsError,
    SpecificationInUseError,
    SpecificationNotFoundError,
    SpecificationTypeChangeError,
)
from models.enums import MaterialStatus, UserRole
from models.material import Material
from models.specification import Specification
from models.user import User
from repositories import material_repository, specifications_repository
from schemas.specification import SpecificationCreate, SpecificationUpdate


def _get_material_or_404(db: Session, material_id: int) -> Material:
    material = material_repository.get_by_id(db, material_id)
    if material is None:
        raise MaterialNotFoundError(material_id)
    return material


def _assert_can_manage_specs(material: Material, current_user: User) -> None:
    """platform_admin: siempre.
    company_admin/company_user: solo si el material está PENDING y fue
    propuesto por su empresa."""
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return

    if (
        material.status == MaterialStatus.PENDING
        and material.proposed_by_company_id == current_user.company_id
    ):
        return

    raise MaterialNotEditableError(material.id)


def list_specifications(
    db: Session, material_id: int,
) -> list[Specification]:
    _get_material_or_404(db, material_id)
    return specifications_repository.list_by_material(db, material_id)


def get_specification(
    db: Session, material_id: int, specification_id: int,
) -> Specification:
    _get_material_or_404(db, material_id)

    spec = specifications_repository.get_by_id(db, specification_id)
    if spec is None or spec.material_id != material_id:
        raise SpecificationNotFoundError(specification_id)

    return spec


def create_specification(
    db: Session,
    material_id: int,
    data: SpecificationCreate,
    current_user: User,
) -> Specification:
    material = _get_material_or_404(db, material_id)
    _assert_can_manage_specs(material, current_user)

    existing = specifications_repository.get_by_material_and_name(
        db, material_id, data.name,
    )
    if existing is not None:
        raise SpecificationAlreadyExistsError(data.name, material_id)

    return specifications_repository.create(
        db,
        material_id=material_id,
        name=data.name,
        data_type=data.data_type,
        unit=data.unit,
        description=data.description,
        is_required=data.is_required,
    )


def update_specification(
    db: Session,
    material_id: int,
    specification_id: int,
    data: SpecificationUpdate,
    current_user: User,
) -> Specification:
    material = _get_material_or_404(db, material_id)
    _assert_can_manage_specs(material, current_user)

    spec = specifications_repository.get_by_id(db, specification_id)
    if spec is None or spec.material_id != material_id:
        raise SpecificationNotFoundError(specification_id)

    # Cambio de nombre: verificar unicidad
    if data.name is not None and data.name != spec.name:
        conflict = specifications_repository.get_by_material_and_name(
            db, material_id, data.name,
        )
        if conflict is not None:
            raise SpecificationAlreadyExistsError(data.name, material_id)

    # Cambio de data_type: prohibido si hay valores asociados
    if data.data_type is not None and data.data_type != spec.data_type:
        if specifications_repository.has_associated_values(db, spec.id):
            raise SpecificationTypeChangeError(spec.id)

    return specifications_repository.update(
        db,
        spec,
        name=data.name,
        data_type=data.data_type,
        unit=data.unit,
        description=data.description,
        is_required=data.is_required,
    )


def delete_specification(
    db: Session,
    material_id: int,
    specification_id: int,
    current_user: User,
) -> None:
    material = _get_material_or_404(db, material_id)
    _assert_can_manage_specs(material, current_user)

    spec = specifications_repository.get_by_id(db, specification_id)
    if spec is None or spec.material_id != material_id:
        raise SpecificationNotFoundError(specification_id)

    if specifications_repository.has_associated_values(db, spec.id):
        raise SpecificationInUseError(spec.id)

    specifications_repository.delete(db, spec)