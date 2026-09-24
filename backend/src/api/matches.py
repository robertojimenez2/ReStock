from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_current_active_user
from core.exceptions import (
    NeedNotFoundError,
    PermissionDeniedError,
    SurplusNotFoundError,
)
from db.dependencies import get_db
from models.user import User
from schemas.matching import (
    MatchBreakdownResponse,
    MatchCompanyInfo,
    MatchResponse,
)
from schemas.need import NeedResponse
from schemas.surplus import SurplusResponse
from services import matching_service

router = APIRouter(prefix="/matches", tags=["matches"])


def _to_response(m: matching_service.ScoredMatch) -> MatchResponse:
    return MatchResponse(
        score=m.score,
        breakdown=MatchBreakdownResponse(
            material=m.breakdown.material,
            quantity=m.breakdown.quantity,
            location=m.breakdown.location,
            price=m.breakdown.price,
            specifications=m.breakdown.specifications,
        ),
        notes=m.breakdown.notes,
        counterpart_company=MatchCompanyInfo.model_validate(
            m.counterpart_company
        ),
        surplus=(
            SurplusResponse.model_validate(m.surplus)
            if m.surplus is not None
            else None
        ),
        need=(
            NeedResponse.model_validate(m.need)
            if m.need is not None
            else None
        ),
    )


@router.get(
    "/for-surplus/{surplus_id}",
    response_model=list[MatchResponse],
)
def matches_for_surplus(
    surplus_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    exclude_own: Annotated[bool, Query()] = True,
    min_score: Annotated[float, Query(ge=0, le=100)] = 0.0,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
):
    """Compradores potenciales para mi excedente."""
    try:
        matches = matching_service.find_matches_for_surplus(
            db, surplus_id, current_user,
            exclude_own_company=exclude_own,
            min_score=min_score,
            limit=limit,
        )
    except SurplusNotFoundError as error:
        raise HTTPException(404, detail=str(error)) from error
    except PermissionDeniedError as error:
        raise HTTPException(403, detail=str(error)) from error

    return [_to_response(m) for m in matches]


@router.get(
    "/for-need/{need_id}",
    response_model=list[MatchResponse],
)
def matches_for_need(
    need_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    exclude_own: Annotated[bool, Query()] = True,
    min_score: Annotated[float, Query(ge=0, le=100)] = 0.0,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
):
    """Proveedores potenciales para mi necesidad."""
    try:
        matches = matching_service.find_matches_for_need(
            db, need_id, current_user,
            exclude_own_company=exclude_own,
            min_score=min_score,
            limit=limit,
        )
    except NeedNotFoundError as error:
        raise HTTPException(404, detail=str(error)) from error
    except PermissionDeniedError as error:
        raise HTTPException(403, detail=str(error)) from error

    return [_to_response(m) for m in matches]