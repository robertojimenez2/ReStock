"""Tests unitarios del motor de matching. Sin BD."""

from decimal import Decimal

import pytest

from models.company import Company
from models.enums import (
    MaterialStatus,
    NeedStatus,
    SpecificationDataType,
    SurplusStatus,
)
from models.material import Material
from models.need import Need
from models.need_specification import NeedSpecification
from models.specification import Specification
from models.surplus import Surplus
from models.surplus_specification import SurplusSpecification
from services import matching_service


def _company(id: int, city: str, state: str) -> Company:
    c = Company(
        id=id, name=f"C{id}", legal_name="X SA", industry="X",
        city=city, state=state,
    )
    return c


def _material(id: int = 1) -> Material:
    return Material(id=id, name="PEBD", category="Plásticos", status=MaterialStatus.ACTIVE)


def _spec(id: int, data_type=SpecificationDataType.NUMBER) -> Specification:
    return Specification(
        id=id, material_id=1, name=f"spec-{id}",
        data_type=data_type, is_required=True,
    )


def _make_surplus(company, material, qty, price, specs=None):
    s = Surplus(
        company_id=company.id, material_id=material.id,
        quantity=Decimal(str(qty)), unit="kg",
        unit_price=Decimal(str(price)),
        status=SurplusStatus.AVAILABLE,
    )
    s.company = company
    s.material = material
    s.specifications = specs or []
    return s


def _make_need(company, material, qty, max_price, specs=None):
    n = Need(
        company_id=company.id, material_id=material.id,
        quantity=Decimal(str(qty)), unit="kg",
        max_price=Decimal(str(max_price)) if max_price is not None else None,
        status=NeedStatus.ACTIVE,
    )
    n.company = company
    n.material = material
    n.specifications = specs or []
    return n


@pytest.mark.unit
class TestQuantityScore:
    def test_equal_quantities(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16)
        assert matching_service._quantity_score(s, n) == 1.0

    def test_half_quantity(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 2500, 16)
        assert matching_service._quantity_score(s, n) == 0.5

    def test_zero_quantity_returns_zero(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16)
        n.quantity = Decimal("0")
        assert matching_service._quantity_score(s, n) == 0.0


@pytest.mark.unit
class TestLocationScore:
    def test_same_city(self):
        a = _company(1, "Guadalajara", "Jalisco")
        b = _company(2, "Guadalajara", "Jalisco")
        assert matching_service._location_score(a, b) == 1.0

    def test_same_state(self):
        a = _company(1, "Guadalajara", "Jalisco")
        b = _company(2, "Puerto Vallarta", "Jalisco")
        assert matching_service._location_score(a, b) == 0.7

    def test_different_state(self):
        a = _company(1, "Guadalajara", "Jalisco")
        b = _company(2, "CDMX", "Ciudad de Mexico")
        assert matching_service._location_score(a, b) == 0.3


@pytest.mark.unit
class TestPriceScore:
    def test_no_max_price_is_full(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 999)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, None)
        assert matching_service._price_score(s, n) == 1.0

    def test_within_budget_is_full(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 20)
        assert matching_service._price_score(s, n) == 1.0

    def test_over_budget_penalizes_linearly(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 20)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 10)
        # 20 sobre 10 = 100% de exceso → 1 - 1 = 0
        assert matching_service._price_score(s, n) == 0.0

    def test_slightly_over_budget(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 11)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 10)
        # 10% de exceso → 0.9
        assert matching_service._price_score(s, n) == pytest.approx(0.9)


@pytest.mark.unit
class TestSpecsScore:
    def test_no_common_specs_is_full(self):
        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15)
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16)
        score, mismatches = matching_service._specs_score(s, n)
        assert score == 1.0
        assert mismatches == []

    def test_number_in_range(self):
        spec = _spec(1)
        ss = SurplusSpecification(specification_id=1, value_number=Decimal("0.8"))
        ss.specification = spec
        ns = NeedSpecification(
            specification_id=1,
            min_value_number=Decimal("0.7"),
            max_value_number=Decimal("1.0"),
        )
        ns.specification = spec

        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15, [ss])
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16, [ns])

        score, mismatches = matching_service._specs_score(s, n)
        assert score == 1.0
        assert mismatches == []

    def test_number_out_of_range(self):
        spec = _spec(1)
        ss = SurplusSpecification(specification_id=1, value_number=Decimal("2.5"))
        ss.specification = spec
        ns = NeedSpecification(
            specification_id=1,
            min_value_number=Decimal("0.7"),
            max_value_number=Decimal("1.0"),
        )
        ns.specification = spec

        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15, [ss])
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16, [ns])

        score, mismatches = matching_service._specs_score(s, n)
        assert score == 0.0
        assert "spec-1" in mismatches

    def test_text_mismatch(self):
        spec = _spec(1, SpecificationDataType.TEXT)
        ss = SurplusSpecification(specification_id=1, value_text="Natural")
        ss.specification = spec
        ns = NeedSpecification(specification_id=1, value_text="Negro")
        ns.specification = spec

        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15, [ss])
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16, [ns])

        score, mismatches = matching_service._specs_score(s, n)
        assert score == 0.0
        assert "spec-1" in mismatches

    def test_partial_match(self):
        spec1 = _spec(1)
        spec2 = _spec(2, SpecificationDataType.TEXT)

        ss1 = SurplusSpecification(specification_id=1, value_number=Decimal("0.8"))
        ss1.specification = spec1
        ss2 = SurplusSpecification(specification_id=2, value_text="Natural")
        ss2.specification = spec2

        ns1 = NeedSpecification(specification_id=1, min_value_number=Decimal("0.7"), max_value_number=Decimal("1.0"))
        ns1.specification = spec1
        ns2 = NeedSpecification(specification_id=2, value_text="Negro")
        ns2.specification = spec2

        s = _make_surplus(_company(1, "GDL", "Jalisco"), _material(), 5000, 15, [ss1, ss2])
        n = _make_need(_company(2, "GDL", "Jalisco"), _material(), 5000, 16, [ns1, ns2])

        score, mismatches = matching_service._specs_score(s, n)
        assert score == 0.5
        assert "spec-2" in mismatches


@pytest.mark.unit
class TestCombineScore:
    def test_perfect_score(self):
        b = matching_service.ScoreBreakdown(
            material=100, quantity=100, location=100,
            price=100, specifications=100,
        )
        assert matching_service._combine_score(b) == 100.0

    def test_zero_score(self):
        b = matching_service.ScoreBreakdown(
            material=0, quantity=0, location=0,
            price=0, specifications=0,
        )
        assert matching_service._combine_score(b) == 0.0

    def test_weighted_correctly(self):
        b = matching_service.ScoreBreakdown(
            material=100, quantity=50, location=30,
            price=100, specifications=100,
        )
        # 100*0.4 + 50*0.2 + 30*0.2 + 100*0.1 + 100*0.1
        # = 40 + 10 + 6 + 10 + 10 = 76
        assert matching_service._combine_score(b) == 76.0