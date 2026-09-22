from pydantic import BaseModel, EmailStr, Field
from schemas.company import CompanyCreate
from schemas.user import UserCreate

class RegisterUserData(BaseModel):
    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class RegisterRequest(BaseModel):
    company: CompanyCreate
    user: RegisterUserData

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: str