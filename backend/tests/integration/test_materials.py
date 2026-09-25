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

    def test_company_admin_sees_active_and_own_pending(
        self, client, register_and_login
    ):
        _, _, headers = register_and_login()

        # Propone un material propio (PENDING)
        client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers,
        )

        r = client.get("/materials", headers=headers)
        assert r.status_code == 200
        data = r.json()

        # Debe ver su propia propuesta PENDING
        assert len(data) == 1
        assert data[0]["status"] == "pending"
        assert data[0]["proposed_by_company_id"] is not None


    def test_company_admin_does_not_see_other_pending(
        self, client, register_and_login, make_client_for_user
    ):
        # Empresa A propone
        _, _, headers_a = register_and_login(
            email="a@test.mx", company_name="A Co"
        )
        client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers_a,
        )

        # Empresa B consulta
        headers_b = make_client_for_user("b@test.mx", "B Co")
        r = client.get("/materials", headers=headers_b)
        assert r.status_code == 200
        assert r.json() == []   # no ve la propuesta ajena


@pytest.mark.integration
class TestListMaterials:
    def test_company_admin_sees_own_pending_in_list(
        self, client, register_and_login,
    ):
        """Un company_admin que propone un material lo ve en su listado
        (aunque esté PENDING)."""
        _, _, headers = register_and_login()

        # Propone un material (queda PENDING)
        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers,
        )
        assert r.status_code == 201
        created = r.json()
        assert created["status"] == "pending"

        # Lista → debe incluir la propia propuesta
        r = client.get("/materials", headers=headers)
        assert r.status_code == 200
        data = r.json()

        assert len(data) == 1
        assert data[0]["id"] == created["id"]
        assert data[0]["status"] == "pending"
        assert data[0]["proposed_by_company_id"] is not None

    def test_company_admin_does_not_see_others_pending(
        self, client, register_and_login, make_client_for_user,
    ):
        """Un company_admin NO ve propuestas PENDING de otras empresas."""
        # Empresa A propone
        _, _, headers_a = register_and_login(
            email="a@test.mx", company_name="A Co",
        )
        r = client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers_a,
        )
        assert r.status_code == 201

        # Empresa B consulta
        headers_b = make_client_for_user("b@test.mx", "B Co")
        r = client.get("/materials", headers=headers_b)
        assert r.status_code == 200

        # B no ve la propuesta de A (aún no está ACTIVE)
        assert r.json() == []

    def test_company_admin_sees_active_plus_own_pending(
        self, client, db, register_and_login,
    ):
        """Un company_admin ve ACTIVE del catálogo + sus propias
        propuestas en cualquier estado."""
        from models.enums import MaterialStatus
        from tests.factories import make_material

        # Material ACTIVE global (sin proponente)
        make_material(db, name="PP", status=MaterialStatus.ACTIVE)
        db.commit()

        _, _, headers = register_and_login()

        # Propone uno nuevo (PENDING)
        client.post(
            "/materials",
            json={"name": "PEBD", "category": "Plásticos"},
            headers=headers,
        )

        r = client.get("/materials", headers=headers)
        assert r.status_code == 200
        data = r.json()

        # Debe ver 2: PP (ACTIVE) + PEBD (PENDING propio)
        assert len(data) == 2
        names = {m["name"] for m in data}
        assert names == {"PP", "PEBD"}

    def test_platform_admin_sees_everything(
        self, client, db, register_and_login,
    ):
        """Un platform_admin ve ACTIVE + PENDING + REJECTED."""
        from sqlalchemy import update
        from models.enums import MaterialStatus, UserRole
        from models.user import User
        from tests.factories import make_material

        # Materiales variados
        make_material(db, name="PP", status=MaterialStatus.ACTIVE)
        make_material(db, name="PEBD", status=MaterialStatus.PENDING)
        make_material(db, name="PET", status=MaterialStatus.REJECTED)
        db.commit()

        _, _, headers = register_and_login()

        # Promover a platform_admin
        db.execute(
            update(User)
            .where(User.email == "admin@test.mx")
            .values(role=UserRole.PLATFORM_ADMIN)
        )
        db.commit()

        # Re-login para obtener JWT con el nuevo rol
        r_login = client.post(
            "/auth/login",
            data={"username": "admin@test.mx", "password": "test12345"},
        )
        admin_headers = {
            "Authorization": f"Bearer {r_login.json()['access_token']}"
        }

        r = client.get("/materials", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()

        # Debe ver los 3
        assert len(data) == 3
        names = {m["name"] for m in data}
        assert names == {"PP", "PEBD", "PET"}


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