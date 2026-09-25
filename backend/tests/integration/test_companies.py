import pytest


@pytest.mark.integration
class TestMyCompany:
    def test_get_my_company(self, client, register_and_login):
        _, _, headers = register_and_login()
        r = client.get("/companies/me", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Test Co"
        assert data["city"] == "Guadalajara"

    def test_update_my_company(self, client, register_and_login):
        _, _, headers = register_and_login()
        r = client.patch(
            "/companies/me",
            json={"name": "Nuevo Nombre", "city": "Monterrey"},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["name"] == "Nuevo Nombre"
        assert r.json()["city"] == "Monterrey"

    def test_company_user_cannot_update(
        self, client, db, register_and_login,
    ):
        """Un company_user no puede editar la empresa."""
        from sqlalchemy import update
        from models.enums import UserRole
        from models.user import User

        _, _, headers = register_and_login()

        # Degradar el rol del usuario
        db.execute(
            update(User)
            .where(User.email == "admin@test.mx")
            .values(role=UserRole.COMPANY_USER)
        )
        db.commit()

        # Re-login para token con el rol nuevo
        r_login = client.post(
            "/auth/login",
            data={"username": "admin@test.mx", "password": "test12345"},
        )
        user_headers = {
            "Authorization": f"Bearer {r_login.json()['access_token']}"
        }

        r = client.patch(
            "/companies/me",
            json={"name": "Hack"},
            headers=user_headers,
        )
        assert r.status_code == 403

    def test_get_without_auth(self, client):
        r = client.get("/companies/me")
        assert r.status_code == 401