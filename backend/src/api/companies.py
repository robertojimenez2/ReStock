from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_current_active_user, require_company_admin
from core.exceptions import CompanyNotFoundError
from db.dependencies import get_db
from models.user import User
from schemas.company import CompanyResponse, CompanyUpdate
from services import company_service

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyResponse)
def get_my_company(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Devuelve los datos de la empresa del usuario autenticado."""
    try:
        return company_service.get_my_company(db, current_user)
    except CompanyNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


@router.patch("/me", response_model=CompanyResponse)
def update_my_company(
    data: CompanyUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_company_admin)],
):
    """Actualiza los datos de la empresa. Solo company_admin o superior."""
    try:
        return company_service.update_my_company(db, data, current_user)
    except CompanyNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error