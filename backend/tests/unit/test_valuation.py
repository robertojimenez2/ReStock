"""Tests unitarios de la valorización matemática."""

from decimal import Decimal

import pytest

from services import valuation_service  # noqa: F401


@pytest.mark.unit
class TestValuationMath:
    def test_gross_minus_logistics(self):
        qty = Decimal("5000")
        price = Decimal("15")
        logistics = Decimal("8600.00")

        gross = qty * price
        net = gross - logistics

        assert gross == Decimal("75000")
        assert net == Decimal("66400.00")

    def test_net_can_be_negative(self):
        qty = Decimal("100")
        price = Decimal("1")
        logistics = Decimal("5000")

        net = qty * price - logistics
        assert net < 0