from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_current_active_user, require_company_user
from core.exceptions import (
    InvalidTransactionTransitionError,
    PermissionDeniedError,
    TransactionNotFoundError,
)
from db.dependencies import get_db
from models.enums import TransactionStatus
from models.user import User
from schemas.transaction import TransactionResponse, TransactionStatusUpdate
from services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _map_error(error: Exception) -> HTTPException:
    if isinstance(error, TransactionNotFoundError):
        return HTTPException(404, detail=str(error))
    if isinstance(error, PermissionDeniedError):
        return HTTPException(403, detail=str(error))
    if isinstance(error, InvalidTransactionTransitionError):
        return HTTPException(409, detail=str(error))
    return HTTPException(500, detail="Error inesperado")


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    status_filter: Annotated[
        TransactionStatus | None, Query(alias="status")
    ] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    try:
        return transaction_service.list_transactions(
            db, current_user,
            status=status_filter,
            skip=skip,
            limit=limit,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return transaction_service.get_transaction(
            db, transaction_id, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.patch("/{transaction_id}/status", response_model=TransactionResponse)
def change_status(
    transaction_id: int,
    data: TransactionStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return transaction_service.change_status(
            db, transaction_id, data, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error