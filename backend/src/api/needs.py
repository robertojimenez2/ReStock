from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import get_current_active_user, require_company_user
from core.exceptions import (
    InvalidSpecificationValueError,
    InvalidStatusTransitionError,
    MaterialNotAvailableError,
    MaterialNotFoundError,
    NeedNotFoundError,
    PermissionDeniedError,
    SpecificationNotBelongToMaterialError,
    SpecificationNotFoundError,
)
from db.dependencies import get_db
from models.enums import NeedStatus
from models.user import User
from schemas.need import (
    NeedCreate,
    NeedResponse,
    NeedStatusUpdate,
    NeedUpdate,
)
from services import need_service


router = APIRouter(prefix="/needs", tags=["needs"])


def _map_error(error: Exception) -> HTTPException:
    if isinstance(
        error, (NeedNotFoundError, MaterialNotFoundError, SpecificationNotFoundError)
    ):
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


@router.post("", response_model=NeedResponse, status_code=status.HTTP_201_CREATED)
def create_need(
    data: NeedCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return need_service.create_need(db, data, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.get("", response_model=list[NeedResponse])
def list_needs(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    mine: Annotated[bool, Query()] = False,
    status_filter: Annotated[NeedStatus | None, Query(alias="status")] = None,
    material_id: Annotated[int | None, Query(ge=1)] = None,
    min_quantity: Annotated[float | None, Query(gt=0)] = None,
    max_quantity: Annotated[float | None, Query(gt=0)] = None,
    min_max_price: Annotated[float | None, Query(ge=0)] = None,
    max_max_price: Annotated[float | None, Query(ge=0)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    try:
        return need_service.list_needs(
            db, current_user,
            mine=mine,
            status=status_filter,
            material_id=material_id,
            min_quantity=min_quantity,
            max_quantity=max_quantity,
            min_max_price=min_max_price,
            max_max_price=max_max_price,
            skip=skip,
            limit=limit,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.get("/{need_id}", response_model=NeedResponse)
def get_need(
    need_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return need_service.get_need(db, need_id, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.patch("/{need_id}", response_model=NeedResponse)
def update_need(
    need_id: int,
    data: NeedUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return need_service.update_need(db, need_id, data, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.delete("/{need_id}", response_model=NeedResponse)
def delete_need(
    need_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    """Soft delete: marca la necesidad como INACTIVE."""
    try:
        return need_service.delete_need(db, need_id, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.patch("/{need_id}/status", response_model=NeedResponse)
def change_status(
    need_id: int,
    data: NeedStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return need_service.change_status(
            db, need_id, data.status, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error