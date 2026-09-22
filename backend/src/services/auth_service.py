from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.exceptions import EmailAlreadyRegisteredError
from core.security import hash_password, verify_password, create_access_token
from models.company import Company
from models.enums import UserRole
from models.user import User
from schemas.auth import RegisterRequest

def register_user(db: Session, data: RegisterRequest) -> User:
    email = data.user.email.lower().strip()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )
    if existing_user:
        raise EmailAlreadyRegisteredError()

    company = Company(
        name=data.company.name,
        legal_name=data.company.legal_name,
        industry=data.company.industry,
        description=data.company.description,
        city=data.company.city,
        state=data.company.state,
        address=data.company.address,
    )

    user = User(
        email=email,
        password_hash=hash_password(data.user.password),
        full_name=data.user.full_name,
        role=UserRole.COMPANY_ADMIN,
    )

    try:
        db.add(company)
        db.flush()  # para obtener company.id

        user.company_id = company.id
        db.add(user)

        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        # Aquí decides según el constraint violado
        raise EmailAlreadyRegisteredError() from exc
    except Exception:
        db.rollback()
        raise

    return user


_DUMMY_HASH = hash_password("timing_attack_mitigation")


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    email = email.lower().strip()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None:
        verify_password(password, _DUMMY_HASH)
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.is_active:
        return None

    return user

def create_user_token(user: User) -> str:
    return create_access_token(
        user_id=user.id,
        role=user.role.value,
    )