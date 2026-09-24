from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from schemas.offer import OfferResponse
from schemas.transaction import TransactionResponse


class DashboardCompanyInfo(BaseModel):
    id: int
    name: str
    city: str
    state: str

    model_config = ConfigDict(from_attributes=True)


class SurplusSummary(BaseModel):
    total: int
    available: int
    reserved: int
    sold: int
    inactive: int
    total_value_available: Decimal


class NeedSummary(BaseModel):
    total: int
    active: int
    fulfilled: int
    inactive: int


class OfferSummary(BaseModel):
    pending_received: int
    pending_sent: int
    accepted: int
    rejected: int
    countered: int
    cancelled: int
    expired: int


class TransactionSummary(BaseModel):
    pending: int
    in_transit: int
    completed: int
    cancelled: int
    total_completed_amount: Decimal


class DashboardResponse(BaseModel):
    company: DashboardCompanyInfo
    surpluses: SurplusSummary
    needs: NeedSummary
    offers: OfferSummary
    transactions: TransactionSummary
    recent_offers: list[OfferResponse]
    recent_transactions: list[TransactionResponse]