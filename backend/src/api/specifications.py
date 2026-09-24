from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_current_active_user, require_company_user
from core.exceptions import (
    MaterialNotEditableError,
    MaterialNotFoundError,
    PermissionDeniedError,
    SpecificationAlreadyExistsError,
    SpecificationInUseError,
    SpecificationNotFoundError,
    SpecificationTypeChangeError,
)
from db.dependencies import get_db
from models.user import User
from schemas.specification import (
    SpecificationCreate,
    SpecificationResponse,
    SpecificationUpdate,
)
from services import specification_service


router = APIRouter(
    prefix="/materials/{material_id}/specifications",
    tags=["specifications"],
)


def _map_error(error: Exception) -> HTTPException:
    if isinstance(
        error, (MaterialNotFoundError, SpecificationNotFoundError)
    ):
        return HTTPException(404, detail=str(error))
    if isinstance(error, PermissionDeniedError):
        return HTTPException(403, detail=str(error))
    if isinstance(error, MaterialNotEditableError):
        return HTTPException(403, detail=str(error))
    if isinstance(
        error,
        (
            SpecificationAlreadyExistsError,
            SpecificationInUseError,
            SpecificationTypeChangeError,
        ),
    ):
        return HTTPException(409, detail=str(error))
    return HTTPException(500, detail="Error inesperado")


@router.get("", response_model=list[SpecificationResponse])
def list_specifications(
    material_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return specification_service.list_specifications(db, material_id)
    except Exception as error:
        raise _map_error(error) from error


@router.get("/{specification_id}", response_model=SpecificationResponse)
def get_specification(
    material_id: int,
    specification_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return specification_service.get_specification(
            db, material_id, specification_id,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.post(
    "",
    response_model=SpecificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_specification(
    material_id: int,
    data: SpecificationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return specification_service.create_specification(
            db, material_id, data, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.patch("/{specification_id}", response_model=SpecificationResponse)
def update_specification(
    material_id: int,
    specification_id: int,
    data: SpecificationUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return specification_service.update_specification(
            db, material_id, specification_id, data, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.delete(
    "/{specification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_specification(
    material_id: int,
    specification_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
) -> None:
    try:
        specification_service.delete_specification(
            db, material_id, specification_id, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error