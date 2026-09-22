from datetime import datetime
from decimal import Decimal
from models.enums import NeedStatus
from pydantic import BaseModel, ConfigDict, Field


class NeedBase(BaseModel):
    quantity: Decimal = Field(
        gt=0,
    )

    unit: str = Field(
        min_length=1,
        max_length=20,
    )

    max_price: Decimal | None = Field(
        default=None,
        ge=0,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )


class NeedCreate(NeedBase):
    material_id: int


class NeedUpdate(BaseModel):
    quantity: Decimal | None = Field(
        default=None,
        gt=0,
    )

    unit: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    max_price: Decimal | None = Field(
        default=None,
        ge=0,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    status: str | None = Field(
        default=None,
        max_length=30,
    )


class NeedResponse(NeedBase):
    id: int
    company_id: int
    material_id: int
    status: NeedStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )