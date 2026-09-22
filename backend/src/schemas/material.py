from pydantic import BaseModel, ConfigDict, Field


class MaterialBase(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    category: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    category: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )


class MaterialResponse(MaterialBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )