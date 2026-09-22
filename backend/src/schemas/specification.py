from pydantic import BaseModel, ConfigDict, Field

from models.enums import SpecificationDataType


class SpecificationBase(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    data_type: SpecificationDataType

    unit: str | None = Field(
        default=None,
        max_length=50,
    )

    description: str | None = Field(
        default=None,
        max_length=300,
    )

    is_required: bool = False


class SpecificationCreate(SpecificationBase):
    material_id: int


class SpecificationUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    data_type: SpecificationDataType | None = None

    unit: str | None = Field(
        default=None,
        max_length=50,
    )

    description: str | None = Field(
        default=None,
        max_length=300,
    )

    is_required: bool | None = None


class SpecificationResponse(SpecificationBase):
    id: int
    material_id: int

    model_config = ConfigDict(
        from_attributes=True,
    )