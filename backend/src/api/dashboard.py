from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.deps import get_current_active_user
from db.dependencies import get_db
from models.user import User
from schemas.dashboard import DashboardResponse
from services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> DashboardResponse:
    """Resumen consolidado de la actividad de mi empresa."""
    return dashboard_service.build_dashboard(db, current_user)