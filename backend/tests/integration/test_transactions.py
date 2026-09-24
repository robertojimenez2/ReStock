import pytest

from models.enums import MaterialStatus, UserRole
from tests.factories import (
    make_company,
    make_material,
    make_surplus,
    make_user,
)


@pytest.fixture
def tx_setup(client, db):
    seller = make_company(db, name="Seller Co")
    buyer = make_company(db, name="Buyer Co")

    make_user(db, seller, email="s@test.mx", role=UserRole.COMPANY_ADMIN)
    make_user(db, buyer, email="b@test.mx", role=UserRole.COMPANY_ADMIN)

    material = make_material(db, status=MaterialStatus.ACTIVE)
    surplus = make_surplus(db, seller, material, quantity="1000", unit_price="15")
    db.commit()

    s_login = client.post("/auth/login", data={"username": "s@test.mx", "password": "test12345"})
    b_login = client.post("/auth/login", data={"username": "b@test.mx", "password": "test12345"})
    s_headers = {"Authorization": f"Bearer {s_login.json()['access_token']}"}
    b_headers = {"Authorization": f"Bearer {b_login.json()['access_token']}"}

    # Buyer oferta, seller acepta
    r = client.post(
        "/offers",
        json={"surplus_id": surplus.id, "quantity": "1000", "unit_price": "15"},
        headers=b_headers,
    )
    offer_id = r.json()["id"]

    r = client.post(f"/offers/{offer_id}/accept", headers=s_headers)
    tx_id = r.json()["transaction"]["id"]

    return {
        "seller": seller,
        "buyer": buyer,
        "surplus": surplus,
        "tx_id": tx_id,
        "seller_headers": s_headers,
        "buyer_headers": b_headers,
    }


@pytest.mark.integration
class TestTransactionFlow:
    def test_full_completion(self, client, db, tx_setup):
        tx_id = tx_setup["tx_id"]
        h = tx_setup["seller_headers"]

        r = client.patch(
            f"/transactions/{tx_id}/status",
            json={"status": "in_transit"},
            headers=h,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "in_transit"

        r = client.patch(
            f"/transactions/{tx_id}/status",
            json={"status": "completed"},
            headers=h,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "completed"
        assert r.json()["completed_at"] is not None

        # Verificar surplus SOLD
        from models.surplus import Surplus
        db.expire_all()
        surplus = db.get(Surplus, tx_setup["surplus"].id)
        assert surplus.status.value == "sold"

    def test_cancel_restores_surplus(self, client, db, tx_setup):
        tx_id = tx_setup["tx_id"]
        h = tx_setup["seller_headers"]

        r = client.patch(
            f"/transactions/{tx_id}/status",
            json={"status": "cancelled"},
            headers=h,
        )
        assert r.status_code == 200

        from models.surplus import Surplus
        db.expire_all()
        surplus = db.get(Surplus, tx_setup["surplus"].id)
        assert surplus.status.value == "available"

    def test_invalid_transition_from_completed(self, client, tx_setup):
        tx_id = tx_setup["tx_id"]
        h = tx_setup["seller_headers"]

        client.patch(
            f"/transactions/{tx_id}/status",
            json={"status": "completed"},
            headers=h,
        )

        r = client.patch(
            f"/transactions/{tx_id}/status",
            json={"status": "cancelled"},
            headers=h,
        )
        assert r.status_code == 409

    def test_third_party_cannot_access(self, client, tx_setup, make_client_for_user):
        other = make_client_for_user("other@test.mx", "Other Co")
        r = client.get(
            f"/transactions/{tx_setup['tx_id']}",
            headers=other,
        )
        assert r.status_code == 403