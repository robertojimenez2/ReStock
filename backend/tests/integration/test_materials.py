import pytest


@pytest.mark.integration
class TestCreateMaterial:
    def test_company_admin_creates_pending(self, client, register_and_login):
        _, _, headers = register_and_login()
        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers,
        )
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "pending"
        assert data["proposed_by_company_id"] is not None

    def test_platform_admin_creates_active(self, client, db, register_and_login):
        _, _, headers = register_and_login()

        from sqlalchemy import update
        from models.enums import UserRole
        from models.user import User

        db.execute(
            update(User).where(User.email == "admin@test.mx").values(
                role=UserRole.PLATFORM_ADMIN,
            )
        )
        db.flush()

        # Necesitamos un token nuevo porque el rol viaja en el JWT.
        r_login = client.post(
            "/auth/login",
            data={"username": "admin@test.mx", "password": "test12345"},
        )
        new_headers = {"Authorization": f"Bearer {r_login.json()['access_token']}"}

        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=new_headers,
        )
        assert r.status_code == 201
        assert r.json()["status"] == "active"
        assert r.json()["proposed_by_company_id"] is None

    def test_duplicate_name_returns_409(self, client, register_and_login):
        _, _, headers = register_and_login()
        payload = {"name": "PEBD", "category": "Plásticos"}

        r1 = client.post("/materials", json=payload, headers=headers)
        assert r1.status_code == 201

        r2 = client.post("/materials", json=payload, headers=headers)
        assert r2.status_code == 409

    def test_unauthenticated_returns_401(self, client):
        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
        )
        assert r.status_code == 401


@pytest.mark.integration
class TestListMaterials:
    def test_company_admin_only_sees_active(self, client, register_and_login):
        _, _, headers = register_and_login()
        client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers,
        )
        r = client.get("/materials", headers=headers)
        assert r.status_code == 200
        assert r.json() == []  # El creado está pending


@pytest.mark.integration
class TestApproval:
    def test_full_approval_flow(self, client, db, register_and_login):
        _, _, user_headers = register_and_login()

        # Usuario propone material
        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=user_headers,
        )
        material_id = r.json()["id"]

        # Cambiar rol a platform_admin
        from sqlalchemy import update
        from models.enums import UserRole
        from models.user import User

        db.execute(
            update(User).where(User.email == "admin@test.mx").values(
                role=UserRole.PLATFORM_ADMIN,
            )
        )
        db.flush()

        r_login = client.post(
            "/auth/login",
            data={"username": "admin@test.mx", "password": "test12345"},
        )
        admin_headers = {
            "Authorization": f"Bearer {r_login.json()['access_token']}"
        }

        # Aprobar
        r = client.post(
            f"/materials/{material_id}/approve",
            headers=admin_headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "active"

    def test_non_admin_cannot_approve(self, client, register_and_login):
        _, _, headers = register_and_login()
        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers,
        )
        material_id = r.json()["id"]

        r = client.post(
            f"/materials/{material_id}/approve",
            headers=headers,
        )
        assert r.status_code == 403