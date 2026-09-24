from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from models.enums import OfferStatus


class OfferCreate(BaseModel):
    surplus_id: int
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    message: str | None = Field(default=None, max_length=500)
    model_config = ConfigDict(extra="forbid")


class OfferCounter(BaseModel):
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    message: str | None = Field(default=None, max_length=500)


class OfferResponse(BaseModel):
    id: int
    surplus_id: int
    offered_by_company_id: int
    offered_to_company_id: int
    parent_offer_id: int | None
    quantity: Decimal
    unit_price: Decimal
    message: str | None
    status: OfferStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)