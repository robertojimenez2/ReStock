from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from models.enums import NeedStatus


class NeedSpecificationInput(BaseModel):
    """Valor requerido para una especificación técnica.

    - NUMBER: value_number (exacto) o min/max_value_number (rango). No ambos.
    - TEXT: value_text.
    - BOOLEAN: value_boolean.
    """

    specification_id: int
    value_number: Decimal | None = None
    min_value_number: Decimal | None = None
    max_value_number: Decimal | None = None
    value_text: str | None = Field(default=None, max_length=255)
    value_boolean: bool | None = None

    @model_validator(mode="after")
    def _check_range_consistency(self) -> "NeedSpecificationInput":
        has_range = (
            self.min_value_number is not None
            or self.max_value_number is not None
        )

        if has_range and self.value_number is not None:
            raise ValueError(
                "No puedes combinar value_number con min/max_value_number"
            )

        if (
            self.min_value_number is not None
            and self.max_value_number is not None
            and self.min_value_number > self.max_value_number
        ):
            raise ValueError(
                "min_value_number no puede ser mayor que max_value_number"
            )

        return self


class NeedBase(BaseModel):
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)
    max_price: Decimal | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=1000)


class NeedCreate(NeedBase):
    material_id: int
    specifications: list[NeedSpecificationInput] = Field(default_factory=list)
    model_config = ConfigDict(extra="forbid")


class NeedUpdate(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    max_price: Decimal | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=1000)
    specifications: list[NeedSpecificationInput] | None = None
    model_config = ConfigDict(extra="forbid")


class NeedStatusUpdate(BaseModel):
    status: NeedStatus


class NeedSpecificationResponse(BaseModel):
    id: int
    specification_id: int
    value_number: Decimal | None
    min_value_number: Decimal | None
    max_value_number: Decimal | None
    value_text: str | None
    value_boolean: bool | None

    model_config = ConfigDict(from_attributes=True)


class NeedResponse(NeedBase):
    id: int
    company_id: int
    material_id: int
    status: NeedStatus
    specifications: list[NeedSpecificationResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)