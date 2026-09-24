from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from models.enums import SurplusStatus


class SurplusSpecificationInput(BaseModel):
    """Valor de una especificación técnica.

    Solo el campo correspondiente al data_type de la Specification
    debe venir informado.
    """

    specification_id: int
    value_number: Decimal | None = None
    value_text: str | None = Field(default=None, max_length=255)
    value_boolean: bool | None = None


class SurplusBase(BaseModel):
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)
    unit_price: Decimal = Field(ge=0)
    description: str | None = Field(default=None, max_length=1000)


class SurplusCreate(SurplusBase):
    material_id: int
    specifications: list[SurplusSpecificationInput] = Field(default_factory=list)

    model_config= ConfigDict(extra="forbid")


class SurplusUpdate(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    unit_price: Decimal | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=1000)
    specifications: list[SurplusSpecificationInput] | None = None


class SurplusStatusUpdate(BaseModel):
    status: SurplusStatus
    model_config= ConfigDict(extra="forbid")



class SurplusSpecificationResponse(BaseModel):
    id: int
    specification_id: int
    value_number: Decimal | None
    value_text: str | None
    value_boolean: bool | None

    model_config = ConfigDict(from_attributes=True)


class SurplusResponse(SurplusBase):
    id: int
    company_id: int
    material_id: int
    status: SurplusStatus
    specifications: list[SurplusSpecificationResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)