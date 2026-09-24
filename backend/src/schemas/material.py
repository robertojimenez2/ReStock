from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from models.enums import MaterialStatus


class MaterialBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class MaterialCreate(MaterialBase):
    """Payload para crear un material.

    El status y proposed_by_company_id los determina el backend
    según el rol del usuario autenticado.
    """

    model_config = ConfigDict(extra="forbid")


class MaterialUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    category: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(extra="forbid")


class MaterialResponse(MaterialBase):
    id: int
    status: MaterialStatus
    proposed_by_company_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)