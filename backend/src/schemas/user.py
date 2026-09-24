from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models.enums import UserRole


class UserBase(BaseModel):
    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=150,
    )


class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        max_length=128,
    )

    company_id: int
    model_config = ConfigDict(extra="forbid")


class UserUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None
    model_config = ConfigDict(extra="forbid")


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    company_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )