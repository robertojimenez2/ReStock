from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from core.security import decode_access_token
from db.dependencies import get_db
from models.enums import UserRole
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No se pudieron validar las credenciales",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = decode_access_token(token)
    except InvalidTokenError:
        raise credentials_exception from None

    sub = payload.get("sub")
    if not sub:
        raise credentials_exception

    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        raise credentials_exception from None

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está desactivado",
        )
    return user


def require_roles(*roles: UserRole):
    """Factory: devuelve una dependencia que exige uno de los roles dados."""
    allowed = set(roles)

    def dependency(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return current_user

    return dependency



require_company_user = require_roles(
    UserRole.COMPANY_USER,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
)

require_company_admin = require_roles(
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
)

require_platform_admin = require_roles(UserRole.PLATFORM_ADMIN)