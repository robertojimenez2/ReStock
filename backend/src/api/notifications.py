from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_current_active_user
from core.exceptions import NotificationNotFoundError
from db.dependencies import get_db
from models.user import User
from schemas.notification import (
    NotificationCountResponse,
    NotificationReadAllResponse,
    NotificationResponse,
)
from services import notification_service


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    unread_only: Annotated[bool, Query()] = False,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
):
    return notification_service.list_notifications(
        db, current_user,
        unread_only=unread_only,
        skip=skip,
        limit=limit,
    )


@router.get("/count", response_model=NotificationCountResponse)
def count_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    total, unread = notification_service.count_notifications(
        db, current_user,
    )
    return NotificationCountResponse(total=total, unread=unread)


@router.patch("/read-all", response_model=NotificationReadAllResponse)
def mark_all_read(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    updated = notification_service.mark_all_read(db, current_user)
    return NotificationReadAllResponse(updated=updated)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return notification_service.mark_read(
            db, notification_id, current_user,
        )
    except NotificationNotFoundError as error:
        raise HTTPException(404, detail=str(error)) from error