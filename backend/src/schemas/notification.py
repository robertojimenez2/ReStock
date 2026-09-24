from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.enums import NotificationType


class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    payload: dict
    read_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationCountResponse(BaseModel):
    total: int
    unread: int


class NotificationReadAllResponse(BaseModel):
    updated: int