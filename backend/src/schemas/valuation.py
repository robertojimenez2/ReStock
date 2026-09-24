from decimal import Decimal

from pydantic import BaseModel


class ValuationResponse(BaseModel):
    surplus_id: int
    seller_company_id: int
    buyer_company_id: int
    quantity: Decimal
    unit_price: Decimal
    gross_value: Decimal
    logistics_cost: Decimal
    net_value: Decimal
    distance_km: float
    distance_source: str
    material_multiplier: float
    estimated_delivery_days: int
    notes: list[str]