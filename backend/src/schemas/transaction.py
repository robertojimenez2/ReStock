from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from models.enums import TransactionStatus


class TransactionStatusUpdate(BaseModel):
    status: TransactionStatus
    notes: str | None = Field(default=None, max_length=1000)
    model_config = ConfigDict(extra="forbid")


class TransactionResponse(BaseModel):
    id: int
    offer_id: int
    surplus_id: int
    seller_company_id: int
    buyer_company_id: int
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    notes: str | None
    status: TransactionStatus
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)