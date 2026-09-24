from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_current_active_user
from core.exceptions import (
    CompanyNotFoundError,
    PermissionDeniedError,
    SurplusNotFoundError,
)
from db.dependencies import get_db
from models.user import User
from schemas.valuation import ValuationResponse
from services import valuation_service

router = APIRouter(prefix="/valuation", tags=["valuation"])


def _map_error(error: Exception) -> HTTPException:
    if isinstance(error, (SurplusNotFoundError, CompanyNotFoundError)):
        return HTTPException(404, detail=str(error))
    if isinstance(error, PermissionDeniedError):
        return HTTPException(403, detail=str(error))
    return HTTPException(500, detail="Error inesperado")


@router.get(
    "/surplus/{surplus_id}",
    response_model=ValuationResponse,
)
def valuate_surplus_for_company(
    surplus_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    buyer_company_id: Annotated[int | None, Query(ge=1)] = None,
):
    """Valoriza un surplus desde el punto de vista de un comprador.

    Si no se especifica buyer_company_id, se usa la empresa del usuario
    autenticado."""
    if buyer_company_id is None:
        buyer_company_id = current_user.company_id

    try:
        return valuation_service.valuate_surplus_for_company(
            db, surplus_id, buyer_company_id, current_user,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.get(
    "/surplus/{surplus_id}/buyers",
    response_model=list[ValuationResponse],
)
def valuate_surplus_against_buyers(
    surplus_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    """Como dueño del excedente, compara el valor neto contra todas las
    empresas con necesidad activa del mismo material. Ordenado por
    net_value descendente."""
    try:
        return valuation_service.valuate_surplus_against_all_buyers(
            db, surplus_id, current_user, limit=limit,
        )
    except Exception as error:
        raise _map_error(error) from error