from datetime import datetime
from decimal import Decimal
from models.enums import SurplusStatus
from pydantic import BaseModel, ConfigDict, Field


class SurplusBase(BaseModel):
    quantity: Decimal = Field(
        gt=0,
    )

    unit: str = Field(
        min_length=1,
        max_length=20,
    )

    unit_price: Decimal = Field(
        ge=0,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )


class SurplusCreate(SurplusBase):
    material_id: int


class SurplusUpdate(BaseModel):
    quantity: Decimal | None = Field(
        default=None,
        gt=0,
    )

    unit: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    unit_price: Decimal | None = Field(
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


class SurplusResponse(SurplusBase):
    id: int
    company_id: int
    material_id: int
    status: SurplusStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )