from datetime import datetime

from models.enums import UserRole
from pydantic import BaseModel, ConfigDict, EmailStr, Field


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


class UserUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    company_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )