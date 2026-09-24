from pydantic import BaseModel, ConfigDict

from schemas.need import NeedResponse
from schemas.surplus import SurplusResponse


class MatchBreakdownResponse(BaseModel):
    material: float
    quantity: float
    location: float
    price: float
    specifications: float


class MatchCompanyInfo(BaseModel):
    id: int
    name: str
    city: str
    state: str

    model_config = ConfigDict(from_attributes=True)


class MatchResponse(BaseModel):
    score: float
    breakdown: MatchBreakdownResponse
    notes: list[str]
    counterpart_company: MatchCompanyInfo

    # Solo uno de estos dos viene poblado, según la dirección.
    surplus: SurplusResponse | None = None
    need: NeedResponse | None = None