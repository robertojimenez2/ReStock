import pytest

from models.enums import MaterialStatus
from tests.factories import (
    make_company,
    make_material,
    make_specification,
    make_surplus,
    make_user,
)
from models.enums import UserRole


@pytest.fixture
def negotiation_setup(db):
    """Empresa vendedora con un surplus disponible y empresa compradora."""
    seller = make_company(db, name="Seller Co")
    buyer = make_company(db, name="Buyer Co", city="CDMX", state="Ciudad de Mexico")

    make_user(db, seller, email="seller@test.mx", role=UserRole.COMPANY_ADMIN)
    make_user(db, buyer, email="buyer@test.mx", role=UserRole.COMPANY_ADMIN)

    material = make_material(db, status=MaterialStatus.ACTIVE)
    surplus = make_surplus(db, seller, material, quantity="5000", unit_price="15")
    db.commit()

    return {
        "seller": seller,
        "buyer": buyer,
        "surplus": surplus,
        "material": material,
    }


@pytest.fixture
def seller_headers(client, negotiation_setup):
    r = client.post(
        "/auth/login",
        data={"username": "seller@test.mx", "password": "test12345"},
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def buyer_headers(client, negotiation_setup):
    r = client.post(
        "/auth/login",
        data={"username": "buyer@test.mx", "password": "test12345"},
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.mark.integration
class TestCreateOffer:
    def test_buyer_creates_offer(
        self, client, negotiation_setup, buyer_headers,
    ):
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
                "message": "Me interesa",
            },
            headers=buyer_headers,
        )
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["offered_by_company_id"] == negotiation_setup["buyer"].id
        assert data["offered_to_company_id"] == negotiation_setup["seller"].id

    def test_cannot_offer_own_surplus(
        self, client, negotiation_setup, seller_headers,
    ):
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
            },
            headers=seller_headers,
        )
        assert r.status_code == 403

    def test_quantity_exceeds_available(
        self, client, negotiation_setup, buyer_headers,
    ):
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "99999",
                "unit_price": "14",
            },
            headers=buyer_headers,
        )
        assert r.status_code == 409


@pytest.mark.integration
class TestOfferLifecycle:
    def test_accept_creates_transaction(
        self, client, negotiation_setup, seller_headers, buyer_headers,
    ):
        # Buyer oferta
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
            },
            headers=buyer_headers,
        )
        offer_id = r.json()["id"]

        # Seller acepta
        r = client.post(
            f"/offers/{offer_id}/accept",
            headers=seller_headers,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["offer"]["status"] == "accepted"
        assert data["transaction"]["status"] == "pending"
        assert data["transaction"]["seller_company_id"] == negotiation_setup["seller"].id
        assert data["transaction"]["buyer_company_id"] == negotiation_setup["buyer"].id

    def test_reject_offer(
        self, client, negotiation_setup, seller_headers, buyer_headers,
    ):
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
            },
            headers=buyer_headers,
        )
        offer_id = r.json()["id"]

        r = client.post(
            f"/offers/{offer_id}/reject",
            headers=seller_headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "rejected"

    def test_counter_flips_roles(
        self, client, negotiation_setup, seller_headers, buyer_headers,
    ):
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
            },
            headers=buyer_headers,
        )
        offer_id = r.json()["id"]

        r = client.post(
            f"/offers/{offer_id}/counter",
            json={
                "quantity": "5000",
                "unit_price": "16",
                "message": "Mínimo $16",
            },
            headers=seller_headers,
        )
        assert r.status_code == 201
        new_offer = r.json()
        assert new_offer["offered_by_company_id"] == negotiation_setup["seller"].id
        assert new_offer["offered_to_company_id"] == negotiation_setup["buyer"].id
        assert new_offer["parent_offer_id"] == offer_id

    def test_accepting_one_cancels_others(
        self, client, negotiation_setup, seller_headers, buyer_headers,
    ):
        # Dos ofertas del mismo buyer
        r1 = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
            },
            headers=buyer_headers,
        )
        r2 = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "13",
            },
            headers=buyer_headers,
        )
        id1 = r1.json()["id"]
        id2 = r2.json()["id"]

        client.post(f"/offers/{id1}/accept", headers=seller_headers)

        r = client.get(f"/offers/{id2}", headers=seller_headers)
        assert r.json()["status"] == "cancelled"

    def test_sender_cannot_accept_own_offer(
        self, client, negotiation_setup, buyer_headers,
    ):
        r = client.post(
            "/offers",
            json={
                "surplus_id": negotiation_setup["surplus"].id,
                "quantity": "5000",
                "unit_price": "14",
            },
            headers=buyer_headers,
        )
        offer_id = r.json()["id"]

        r = client.post(
            f"/offers/{offer_id}/accept",
            headers=buyer_headers,
        )
        assert r.status_code == 403