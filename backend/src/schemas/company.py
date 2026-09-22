from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompanyBase(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    legal_name: str | None = Field(
        default=None,
        max_length=200,
    )

    industry: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str = Field(
        min_length=2,
        max_length=100,
    )

    state: str = Field(
        min_length=2,
        max_length=100,
    )

    address: str | None = Field(
        default=None,
        max_length=250,
    )


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    legal_name: str | None = Field(
        default=None,
        max_length=200,
    )

    industry: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    state: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    address: str | None = Field(
        default=None,
        max_length=250,
    )


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )