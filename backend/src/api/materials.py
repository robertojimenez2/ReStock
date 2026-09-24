from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import (
    get_current_active_user,
    require_company_user,
    require_platform_admin,
)
from core.exceptions import (
    MaterialAlreadyExistsError,
    MaterialNotFoundError,
    MaterialNotPendingError,
    PermissionDeniedError,
)
from db.dependencies import get_db
from models.user import User
from schemas.material import (
    MaterialCreate,
    MaterialResponse,
    MaterialUpdate,
)
from services import material_services

router = APIRouter(prefix="/materials", tags=["materials"])


def _handle_domain_errors(error: Exception) -> HTTPException:
    if isinstance(error, MaterialNotFoundError):
        return HTTPException(404, detail=str(error))
    if isinstance(error, MaterialAlreadyExistsError):
        return HTTPException(409, detail=str(error))
    if isinstance(error, MaterialNotPendingError):
        return HTTPException(409, detail=str(error))
    if isinstance(error, PermissionDeniedError):
        return HTTPException(403, detail=str(error))
    return HTTPException(500, detail="Error inesperado")


@router.post(
    "",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_material(
    data: MaterialCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
) -> MaterialResponse:
    """platform_admin crea ACTIVE directo; company_admin propone (PENDING)."""
    try:
        return material_services.create_material(db, data, current_user)
    except MaterialAlreadyExistsError as error:
        raise _handle_domain_errors(error) from error


@router.get("", response_model=list[MaterialResponse])
def list_materials(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    category: Annotated[str | None, Query(max_length=100)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[MaterialResponse]:
    return material_services.list_materials(
        db, current_user, category=category, skip=skip, limit=limit,
    )


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> MaterialResponse:
    try:
        return material_services.get_material(db, material_id, current_user)
    except MaterialNotFoundError as error:
        raise _handle_domain_errors(error) from error


@router.patch("/{material_id}", response_model=MaterialResponse)
def update_material(
    material_id: int,
    data: MaterialUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
) -> MaterialResponse:
    try:
        return material_services.update_material(
            db, material_id, data, current_user,
        )
    except (
        MaterialNotFoundError,
        MaterialAlreadyExistsError,
        PermissionDeniedError,
    ) as error:
        raise _handle_domain_errors(error) from error


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_platform_admin)],
) -> None:
    try:
        material_services.delete_material(db, material_id)
    except MaterialNotFoundError as error:
        raise _handle_domain_errors(error) from error


@router.post("/{material_id}/approve", response_model=MaterialResponse)
def approve_material(
    material_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_platform_admin)],
) -> MaterialResponse:
    try:
        return material_services.approve_material(db, material_id)
    except (MaterialNotFoundError, MaterialNotPendingError) as error:
        raise _handle_domain_errors(error) from error


@router.post("/{material_id}/reject", response_model=MaterialResponse)
def reject_material(
    material_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_platform_admin)],
) -> MaterialResponse:
    try:
        return material_services.reject_material(db, material_id)
    except (MaterialNotFoundError, MaterialNotPendingError) as error:
        raise _handle_domain_errors(error) from error