from decimal import Decimal

import pytest

from models.enums import MaterialStatus, UserRole
from tests.factories import (
    make_company,
    make_material,
    make_specification,
    make_user,
)


@pytest.fixture
def surplus_setup(db):
    """Empresa + material activo + spec requerida."""
    company = make_company(db, name="Seller Co")
    make_user(
        db, company,
        email="seller@test.mx",
        role=UserRole.COMPANY_ADMIN,
    )

    material = make_material(db, status=MaterialStatus.ACTIVE)
    spec = make_specification(db, material, is_required=True)
    db.commit()
    return {"company": company, "material": material, "spec": spec}


@pytest.fixture
def seller_headers(client, surplus_setup):
    r = client.post(
        "/auth/login",
        data={"username": "seller@test.mx", "password": "test12345"},
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.mark.integration
class TestCreateSurplus:
    def test_create_with_required_specs(
        self, client, surplus_setup, seller_headers,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "quantity": "5000",
                "unit": "kg",
                "unit_price": "15",
                "specifications": [
                    {
                        "specification_id": surplus_setup["spec"].id,
                        "value_number": "0.8",
                    }
                ],
            },
            headers=seller_headers,
        )
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["status"] == "available"
        assert data["company_id"] == surplus_setup["company"].id
        assert len(data["specifications"]) == 1

    def test_missing_required_spec_returns_409(
        self, client, surplus_setup, seller_headers,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "quantity": "5000",
                "unit": "kg",
                "unit_price": "15",
                "specifications": [],
            },
            headers=seller_headers,
        )
        assert r.status_code == 409
        assert "Faltan" in r.json()["detail"]

    def test_company_id_cannot_be_injected(
        self, client, surplus_setup, seller_headers,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "company_id": 9999,
                "quantity": "5000",
                "unit": "kg",
                "unit_price": "15",
                "specifications": [],
            },
            headers=seller_headers,
        )
        assert r.status_code == 422

    def test_pending_material_rejected(
        self, client, db, surplus_setup, seller_headers,
    ):
        pending = make_material(
            db,
            name="PENDING-MAT",
            status=MaterialStatus.PENDING,
        )
        db.commit()

        r = client.post(
            "/surpluses",
            json={
                "material_id": pending.id,
                "quantity": "100",
                "unit": "kg",
                "unit_price": "10",
                "specifications": [],
            },
            headers=seller_headers,
        )
        assert r.status_code == 409


@pytest.mark.integration
class TestStatusTransitions:
    def test_valid_transition_available_to_reserved(
        self, client, surplus_setup, seller_headers,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "quantity": "100",
                "unit": "kg",
                "unit_price": "10",
                "specifications": [
                    {
                        "specification_id": surplus_setup["spec"].id,
                        "value_number": "0.8",
                    }
                ],
            },
            headers=seller_headers,
        )
        sid = r.json()["id"]

        r = client.patch(
            f"/surpluses/{sid}/status",
            json={"status": "reserved"},
            headers=seller_headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "reserved"

    def test_invalid_transition_available_to_sold(
        self, client, surplus_setup, seller_headers,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "quantity": "100",
                "unit": "kg",
                "unit_price": "10",
                "specifications": [
                    {
                        "specification_id": surplus_setup["spec"].id,
                        "value_number": "0.8",
                    }
                ],
            },
            headers=seller_headers,
        )
        sid = r.json()["id"]

        r = client.patch(
            f"/surpluses/{sid}/status",
            json={"status": "sold"},
            headers=seller_headers,
        )
        assert r.status_code == 409


@pytest.mark.integration
class TestOwnership:
    def test_other_company_cannot_edit(
        self, client, surplus_setup, seller_headers, make_client_for_user,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "quantity": "100",
                "unit": "kg",
                "unit_price": "10",
                "specifications": [
                    {
                        "specification_id": surplus_setup["spec"].id,
                        "value_number": "0.8",
                    }
                ],
            },
            headers=seller_headers,
        )
        sid = r.json()["id"]

        other_headers = make_client_for_user("other@test.mx", "Other Co")

        r = client.patch(
            f"/surpluses/{sid}",
            json={"unit_price": "999"},
            headers=other_headers,
        )
        assert r.status_code == 403

    def test_delete_is_soft(
        self, client, surplus_setup, seller_headers,
    ):
        r = client.post(
            "/surpluses",
            json={
                "material_id": surplus_setup["material"].id,
                "quantity": "100",
                "unit": "kg",
                "unit_price": "10",
                "specifications": [
                    {
                        "specification_id": surplus_setup["spec"].id,
                        "value_number": "0.8",
                    }
                ],
            },
            headers=seller_headers,
        )
        sid = r.json()["id"]

        r = client.delete(f"/surpluses/{sid}", headers=seller_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "inactive"

        r = client.get(f"/surpluses/{sid}", headers=seller_headers)
        assert r.status_code == 200