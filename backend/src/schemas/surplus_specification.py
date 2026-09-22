from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SurplusSpecificationBase(BaseModel):
    value_number: Decimal | None = None

    value_text: str | None = Field(
        default=None,
        max_length=255,
    )

    value_boolean: bool | None = None


class SurplusSpecificationCreate(SurplusSpecificationBase):
    surplus_id: int
    specification_id: int


class SurplusSpecificationResponse(
    SurplusSpecificationBase
):
    id: int
    surplus_id: int
    specification_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )