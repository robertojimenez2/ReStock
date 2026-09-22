from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NeedSpecificationBase(BaseModel):
    specification_id: int
    value_number: float | None = None
    min_value_number: float | None = None
    max_value_number: float | None = None
    value_text: str | None = Field(default=None, max_length=255)
    value_boolean: bool | None = None


class NeedSpecificationCreate(NeedSpecificationBase):
    need_id: int
    specification_id: int


class NeedSpecificationResponse(NeedSpecificationBase):
    id: int
    need_id: int
    specification_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)