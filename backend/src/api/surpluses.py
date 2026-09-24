from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import get_current_active_user, require_company_user
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
from db.dependencies import get_db
from models.enums import SurplusStatus
from models.user import User
from schemas.surplus import (
    SurplusCreate,
    SurplusResponse,
    SurplusStatusUpdate,
    SurplusUpdate,
)
from services import surplus_service


router = APIRouter(prefix="/surpluses", tags=["surpluses"])


def _map_error(error: Exception) -> HTTPException:
    if isinstance(error, SurplusNotFoundError):
        return HTTPException(404, detail=str(error))
    if isinstance(error, MaterialNotFoundError):
        return HTTPException(404, detail=str(error))
    if isinstance(error, SpecificationNotFoundError):
        return HTTPException(404, detail=str(error))
    if isinstance(error, PermissionDeniedError):
        return HTTPException(403, detail=str(error))
    if isinstance(
        error,
        (
            InvalidSpecificationValueError,
            SpecificationNotBelongToMaterialError,
            MaterialNotAvailableError,
            InvalidStatusTransitionError,
        ),
    ):
        return HTTPException(409, detail=str(error))
    return HTTPException(500, detail="Error inesperado")


@router.post("", response_model=SurplusResponse, status_code=status.HTTP_201_CREATED)
def create_surplus(
    data: SurplusCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return surplus_service.create_surplus(db, data, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.get("", response_model=list[SurplusResponse])
def list_surpluses(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    mine: Annotated[bool, Query()] = False,
    status_filter: Annotated[SurplusStatus | None, Query(alias="status")] = None,
    material_id: Annotated[int | None, Query(ge=1)] = None,
    min_price: Annotated[float | None, Query(ge=0)] = None,
    max_price: Annotated[float | None, Query(ge=0)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    try:
        return surplus_service.list_surpluses(
            db, current_user,
            mine=mine,
            status=status_filter,
            material_id=material_id,
            min_price=min_price,
            max_price=max_price,
            skip=skip,
            limit=limit,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.get("/{surplus_id}", response_model=SurplusResponse)
def get_surplus(
    surplus_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return surplus_service.get_surplus(db, surplus_id, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.patch("/{surplus_id}", response_model=SurplusResponse)
def update_surplus(
    surplus_id: int,
    data: SurplusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return surplus_service.update_surplus(db, surplus_id, data, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.delete("/{surplus_id}", response_model=SurplusResponse)
def delete_surplus(
    surplus_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    """Soft delete: marca el excedente como INACTIVE."""
    try:
        return surplus_service.delete_surplus(db, surplus_id, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.patch("/{surplus_id}/status", response_model=SurplusResponse)
def change_status(
    surplus_id: int,
    data: SurplusStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return surplus_service.change_status(
            db, surplus_id, data.status, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error