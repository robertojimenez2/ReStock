from sqlalchemy.orm import Session

from core.exceptions import (
    MaterialAlreadyExistsError,
    MaterialNotFoundError,
    MaterialNotPendingError,
    PermissionDeniedError,
)
from models.enums import MaterialStatus, UserRole
from models.material import Material
from models.user import User
from repositories import material_repository
from schemas.material import MaterialCreate, MaterialUpdate
from services import notification_service


def _assert_can_edit(material: Material, current_user: User) -> None:
    """Regla: platform_admin siempre; company_admin solo si la propuso
    y sigue en PENDING."""
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return

    if (
        material.status == MaterialStatus.PENDING
        and material.proposed_by_company_id == current_user.company_id
    ):
        return

    raise PermissionDeniedError(
        "Solo puedes editar tus propias propuestas pendientes",
    )


def create_material(
    db: Session,
    data: MaterialCreate,
    current_user: User,
) -> Material:
    existing = material_repository.get_by_name(db, data.name)
    if existing is not None:
        raise MaterialAlreadyExistsError(name=data.name)

    if current_user.role == UserRole.PLATFORM_ADMIN:
        status = MaterialStatus.ACTIVE
        proposed_by = None
    else:
        status = MaterialStatus.PENDING
        proposed_by = current_user.company_id

    return material_repository.create(
        db,
        name=data.name,
        category=data.category,
        description=data.description,
        status=status,
        proposed_by_company_id=proposed_by,
    )


def list_materials(
    db: Session,
    current_user: User,
    *,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Material]:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        # platform_admin ve todo (ACTIVE, PENDING, REJECTED)
        return material_repository.list_materials(
            db,
            category=category,
            skip=skip,
            limit=limit,
        )

    # Resto: ACTIVE + propias (cualquier estado)
    return material_repository.list_materials_for_company(
        db,
        company_id=current_user.company_id,
        category=category,
        skip=skip,
        limit=limit,
    )


def get_material(db: Session, material_id: int, current_user: User) -> Material:
    material = material_repository.get_by_id(db, material_id)
    if material is None:
        raise MaterialNotFoundError(material_id)

    if (
        material.status != MaterialStatus.ACTIVE
        and current_user.role != UserRole.PLATFORM_ADMIN
        and material.proposed_by_company_id != current_user.company_id
    ):
        raise MaterialNotFoundError(material_id)

    return material


def update_material(
    db: Session,
    material_id: int,
    data: MaterialUpdate,
    current_user: User,
) -> Material:
    material = material_repository.get_by_id(db, material_id)
    if material is None:
        raise MaterialNotFoundError(material_id)

    _assert_can_edit(material, current_user)

    if data.name is not None and data.name != material.name:
        conflict = material_repository.get_by_name(db, data.name)
        if conflict is not None:
            raise MaterialAlreadyExistsError(name=data.name)

    return material_repository.update(
        db,
        material,
        name=data.name,
        category=data.category,
        description=data.description,
    )


def delete_material(db: Session, material_id: int) -> None:
    """Solo platform_admin llega aquí (lo garantiza la dependencia)."""
    material = material_repository.get_by_id(db, material_id)
    if material is None:
        raise MaterialNotFoundError(material_id)

    material_repository.delete(db, material)


def approve_material(db: Session, material_id: int) -> Material:
    material = material_repository.get_by_id(db, material_id)
    if material is None:
        raise MaterialNotFoundError(material_id)

    if material.status != MaterialStatus.PENDING:
        raise MaterialNotPendingError()

    material = material_repository.update(
        db, material, status=MaterialStatus.ACTIVE,
    )
    notification_service.notify_material_approved(db, material)
    return material


def reject_material(db: Session, material_id: int) -> Material:
    material = material_repository.get_by_id(db, material_id)
    if material is None:
        raise MaterialNotFoundError(material_id)

    if material.status != MaterialStatus.PENDING:
        raise MaterialNotPendingError()

    material = material_repository.update(
        db, material, status=MaterialStatus.REJECTED,
    )
    notification_service.notify_material_rejected(db, material)
    return material