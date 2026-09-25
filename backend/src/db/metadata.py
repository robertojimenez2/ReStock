"""Registra todos los modelos SQLAlchemy en Base.metadata.

Este módulo NO se importa en runtime normal — solo existe para que
Alembic y los tests tengan el metadata completo disponible.

Se importa explícitamente desde:
- alembic/env.py       (para autogenerate)
- tests/conftest.py    (para create_all en la BD de test)
- main.py              (por si alguna ruta lazy falla)
"""

from db.base import Base  # noqa: F401
from models.company import Company  # noqa: F401
from models.material import Material  # noqa: F401
from models.need import Need  # noqa: F401
from models.need_specification import NeedSpecification  # noqa: F401
from models.notification import Notification  # noqa: F401
from models.offer import Offer  # noqa: F401
from models.specification import Specification  # noqa: F401
from models.surplus import Surplus  # noqa: F401
from models.surplus_specification import SurplusSpecification  # noqa: F401
from models.transaction import Transaction  # noqa: F401
from models.user import User  # noqa: F401

__all__ = [
    "Base",
    "Company",
    "User",
    "Material",
    "Specification",
    "Surplus",
    "SurplusSpecification",
    "Need",
    "NeedSpecification",
    "Offer",
    "Transaction",
    "Notification",
]
