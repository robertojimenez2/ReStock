from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import get_current_active_user, require_company_user
from core.exceptions import (
    OfferNotActionableError,
    OfferNotFoundError,
    PermissionDeniedError,
    SurplusNotAvailableError,
    SurplusNotFoundError,
)
from db.dependencies import get_db
from models.enums import OfferStatus
from models.user import User
from schemas.offer import OfferCounter, OfferCreate, OfferResponse
from schemas.transaction import TransactionResponse
from services import offer_service

router = APIRouter(prefix="/offers", tags=["offers"])


def _map_error(error: Exception) -> HTTPException:
    if isinstance(error, (OfferNotFoundError, SurplusNotFoundError)):
        return HTTPException(404, detail=str(error))
    if isinstance(error, PermissionDeniedError):
        return HTTPException(403, detail=str(error))
    if isinstance(
        error, (OfferNotActionableError, SurplusNotAvailableError)
    ):
        return HTTPException(409, detail=str(error))
    return HTTPException(500, detail="Error inesperado")


@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    data: OfferCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return offer_service.create_offer(db, data, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.get("", response_model=list[OfferResponse])
def list_offers(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    mine: Annotated[bool, Query()] = True,
    surplus_id: Annotated[int | None, Query(ge=1)] = None,
    status_filter: Annotated[OfferStatus | None, Query(alias="status")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    try:
        return offer_service.list_offers(
            db, current_user,
            mine=mine,
            surplus_id=surplus_id,
            status=status_filter,
            skip=skip,
            limit=limit,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer(
    offer_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return offer_service.get_offer(db, offer_id, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.post("/{offer_id}/accept")
def accept_offer(
    offer_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    """Acepta la oferta y genera una transacción."""
    try:
        offer, tx = offer_service.accept_offer(db, offer_id, current_user)
    except Exception as error:
        raise _map_error(error) from error

    return {
        "offer": OfferResponse.model_validate(offer),
        "transaction": TransactionResponse.model_validate(tx),
    }


@router.post("/{offer_id}/reject", response_model=OfferResponse)
def reject_offer(
    offer_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return offer_service.reject_offer(db, offer_id, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.post(
    "/{offer_id}/counter",
    response_model=OfferResponse,
    status_code=status.HTTP_201_CREATED,
)
def counter_offer(
    offer_id: int,
    data: OfferCounter,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return offer_service.counter_offer(db, offer_id, data, current_user)
    except Exception as error:
        raise _map_error(error) from error


@router.post("/{offer_id}/cancel", response_model=OfferResponse)
def cancel_offer(
    offer_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_user)],
):
    try:
        return offer_service.cancel_offer(db, offer_id, current_user)
    except Exception as error:
        raise _map_error(error) from error