"""Tests unitarios del servicio de logística. Sin BD."""

from decimal import Decimal

import pytest

from models.company import Company
from models.enums import MaterialStatus
from models.material import Material
from models.surplus import Surplus
from services import logistics_service


def _make_company(city: str, state: str) -> Company:
    return Company(
        id=1, name="X", legal_name="X SA", industry="X",
        city=city, state=state,
    )


def _make_surplus(quantity: str = "5000", company: Company | None = None) -> Surplus:
    s = Surplus(
        company_id=1, material_id=1,
        quantity=Decimal(quantity), unit="kg",
        unit_price=Decimal("15"),
    )
    s.company = company
    return s


@pytest.mark.unit
class TestDistance:
    def test_same_city_returns_intra_city_km(self):
        origin = _make_company("Guadalajara", "Jalisco")
        dest = _make_company("Guadalajara", "Jalisco")
        km, source, notes = logistics_service._resolve_distance(origin, dest)
        assert source == "same_city"
        assert km == logistics_service.LOGISTICS_INTRA_CITY_KM
        assert any("Misma ciudad" in n for n in notes)

    def test_same_state_different_city_uses_centroids(self):
        origin = _make_company("Guadalajara", "Jalisco")
        dest = _make_company("Puerto Vallarta", "Jalisco")
        km, source, _ = logistics_service._resolve_distance(origin, dest)
        assert source == "state_centroids"
        assert km > 0

    def test_different_state_uses_centroids(self):
        origin = _make_company("Guadalajara", "Jalisco")
        dest = _make_company("CDMX", "Ciudad de Mexico")
        km, source, _ = logistics_service._resolve_distance(origin, dest)
        assert source == "state_centroids"
        assert 400 < km < 700  # Jalisco a CDMX ~540 km

    def test_unknown_state_falls_back_to_default(self):
        origin = _make_company("X", "Estado Inexistente")
        dest = _make_company("Y", "Otro Inexistente")
        km, source, notes = logistics_service._resolve_distance(origin, dest)
        assert source == "default"
        assert km == logistics_service.LOGISTICS_DEFAULT_DISTANCE_KM
        assert any("No se pudo resolver" in n for n in notes)

    def test_accent_insensitive(self):
        origin = _make_company("GDL", "Jalisco")
        dest = _make_company("CDMX", "Ciudad de México")  # con acento
        km, source, _ = logistics_service._resolve_distance(origin, dest)
        assert source == "state_centroids"


@pytest.mark.unit
class TestMaterialMultiplier:
    def test_plastic_default(self):
        m = Material(name="PEBD", category="Plásticos", status=MaterialStatus.ACTIVE)
        factor, _ = logistics_service._material_multiplier(m)
        assert factor == 1.0

    def test_copper_has_higher_factor(self):
        m = Material(name="Cobre", category="Metales", status=MaterialStatus.ACTIVE)
        factor, _ = logistics_service._material_multiplier(m)
        assert factor > 1.0

    def test_none_material(self):
        factor, _ = logistics_service._material_multiplier(None)
        assert factor == 1.0


@pytest.mark.unit
class TestEstimate:
    def test_full_estimate_same_city(self):
        origin = _make_company("Guadalajara", "Jalisco")
        dest = _make_company("Guadalajara", "Jalisco")
        surplus = _make_surplus("5000", origin)
        material = Material(name="PEBD", category="Plásticos", status=MaterialStatus.ACTIVE)

        est = logistics_service.estimate(surplus, dest, material)

        assert est.distance_source == "same_city"
        assert est.material_multiplier == 1.0
        assert est.total_cost > 0
        assert est.estimated_delivery_days == 1

    def test_estimate_between_states(self):
        origin = _make_company("Guadalajara", "Jalisco")
        dest = _make_company("CDMX", "Ciudad de Mexico")
        surplus = _make_surplus("5000", origin)
        material = Material(name="PEBD", category="Plásticos", status=MaterialStatus.ACTIVE)

        est = logistics_service.estimate(surplus, dest, material)

        assert est.distance_km > 400
        assert est.total_cost > 5000
        assert est.estimated_delivery_days >= 1

    def test_factor_material_applies_to_total(self):
        origin = _make_company("Guadalajara", "Jalisco")
        dest = _make_company("CDMX", "Ciudad de Mexico")
        surplus = _make_surplus("5000", origin)

        plastic = Material(name="PEBD", category="Plásticos")
        copper = Material(name="Cobre", category="Metales")

        est_plastic = logistics_service.estimate(surplus, dest, plastic)
        est_copper = logistics_service.estimate(surplus, dest, copper)

        assert est_copper.total_cost > est_plastic.total_cost