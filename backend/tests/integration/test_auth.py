import pytest


@pytest.mark.integration
class TestRegister:
    def test_register_success(self, client):
        payload = {
            "company": {
                "name": "Plásticos del Centro",
                "legal_name": "PC SA de CV",
                "industry": "Manufactura",
                "city": "Guadalajara",
                "state": "Jalisco",
            },
            "user": {
                "email": "admin@test.mx",
                "full_name": "Admin",
                "password": "test12345",
            },
        }
        r = client.post("/auth/register", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "admin@test.mx"
        assert data["role"] == "company_admin"
        assert "password" not in data
        assert "password_hash" not in data

    def test_duplicate_email_returns_409(self, client):
        payload = {
            "company": {
                "name": "Empresa Test",
                "legal_name": "Empresa Test SA de CV",
                "industry": "Manufactura",
                "city": "Guadalajara",
                "state": "Jalisco",
            },
            "user": {
                "email": "dup@test.mx",
                "full_name": "Admin Test",
                "password": "test12345",
            },
        }
        r1 = client.post("/auth/register", json=payload)
        assert r1.status_code == 201, r1.text

        r2 = client.post("/auth/register", json=payload)
        assert r2.status_code == 409

    def test_missing_legal_name_returns_422(self, client):
        payload = {
            "company": {
                "name": "A", "industry": "X",
                "city": "GDL", "state": "Jalisco",
            },
            "user": {
                "email": "x@test.mx", "full_name": "Admin",
                "password": "test12345",
            },
        }
        r = client.post("/auth/register", json=payload)
        assert r.status_code == 422

    def test_short_password_returns_422(self, client):
        payload = {
            "company": {
                "name": "A", "legal_name": "A SA", "industry": "X",
                "city": "GDL", "state": "Jalisco",
            },
            "user": {
                "email": "x@test.mx", "full_name": "Admin",
                "password": "123",
            },
        }
        r = client.post("/auth/register", json=payload)
        assert r.status_code == 422


@pytest.mark.integration
class TestLogin:
    def test_login_success(self, client, register_and_login):
        _, token, _ = register_and_login()
        assert token

    def test_wrong_password_returns_401(self, client, register_and_login):
        register_and_login(email="a@test.mx", password="test12345")

        r = client.post(
            "/auth/login",
            data={"username": "a@test.mx", "password": "wrong"},
        )
        assert r.status_code == 401

    def test_unknown_email_returns_401(self, client):
        r = client.post(
            "/auth/login",
            data={"username": "nobody@test.mx", "password": "x"},
        )
        assert r.status_code == 401


@pytest.mark.integration
class TestMe:
    def test_me_with_valid_token(self, client, register_and_login):
        _, _, headers = register_and_login()
        r = client.get("/auth/me", headers=headers)
        assert r.status_code == 200
        assert r.json()["email"] == "admin@test.mx"

    def test_me_without_token_returns_401(self, client):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_me_with_invalid_token_returns_401(self, client):
        r = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert r.status_code == 401

    def test_inactive_user_returns_403(self, client, db, register_and_login):
        _, token, headers = register_and_login()

        # Desactivar al usuario directamente
        from sqlalchemy import update
        from models.user import User

        db.execute(
            update(User).where(User.email == "admin@test.mx").values(is_active=False)
        )
        db.flush()

        r = client.get("/auth/me", headers=headers)
        assert r.status_code == 403