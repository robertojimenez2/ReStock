"""Configuración global de pytest.

Setear DATABASE_URL antes de importar la app para que pydantic-settings
apunte a la BD de test.
"""

import os

# 1. Forzar la BD de test ANTES de cualquier import de la app.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://restock:restock_dev@localhost:5432/restock_test",
)
os.environ["DATABASE_ECHO"] = "false"

# 2. Imports de terceros
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# 3. CRÍTICO: importar db.metadata ANTES de tocar Base.
#    Ejecuta todos los `from models.X import Y` que registran cada
#    clase en Base.metadata.
import db.metadata  # noqa: F401

# 4. Ahora sí, los imports que dependen de que los modelos ya estén.
from db.base import Base
from db.dependencies import get_db
from main import app


TEST_DATABASE_URL = os.environ["DATABASE_URL"]

# Verificación en tiempo de import. Si esto imprime 0, nada funciona.
print(
    f"\n[conftest] Tablas en Base.metadata: "
    f"{sorted(Base.metadata.tables.keys())}"
)


@pytest.fixture(scope="session")
def engine():
    if not Base.metadata.tables:
        raise RuntimeError(
            "Base.metadata.tables está vacío. "
            "Falta `import db.metadata` al inicio de conftest.py "
            "o el import falló."
        )

    engine = create_engine(TEST_DATABASE_URL, echo=False)
    Base.metadata.create_all(engine)

    yield engine

    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helpers de autenticación 

@pytest.fixture
def register_and_login(client):
    """Registra empresa + usuario admin y devuelve (user_data, token, headers)."""

    def _register(
        email: str = "admin@test.mx",
        password: str = "test12345",
        company_name: str = "Test Co",
        city: str = "Guadalajara",
        state: str = "Jalisco",
    ):
        payload = {
            "company": {
                "name": company_name,
                "legal_name": f"{company_name} SA de CV",
                "industry": "Manufactura",
                "city": city,
                "state": state,
            },
            "user": {
                "email": email,
                "full_name": "Admin Test",
                "password": password,
            },
        }

        r = client.post("/auth/register", json=payload)
        assert r.status_code == 201, r.text
        user_data = r.json()

        r = client.post(
            "/auth/login",
            data={"username": email, "password": password},
        )
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]

        return user_data, token, {"Authorization": f"Bearer {token}"}

    return _register


@pytest.fixture
def make_client_for_user(client, register_and_login):
    """Crea un cliente autenticado con su propia empresa."""

    def _make(
        email: str,
        company_name: str,
        city: str = "Guadalajara",
        state: str = "Jalisco",
    ):
        _, _, headers = register_and_login(
            email=email,
            company_name=company_name,
            city=city,
            state=state,
        )
        return headers

    return _make    