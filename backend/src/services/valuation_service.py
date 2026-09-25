from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import (
    CompanyNotFoundError,
    PermissionDeniedError,
    SurplusNotFoundError,
)
from models.company import Company
from models.enums import NeedStatus, UserRole
from models.need import Need
from models.user import User
from repositories import material_repository, surplus_repository
from services import logistics_service


@dataclass
class ValuationResult:
    surplus_id: int
    seller_company_id: int
    buyer_company_id: int
    buyer_company_name: str          
    buyer_company_city: str          
    buyer_company_state: str
    quantity: Decimal
    unit_price: Decimal
    gross_value: Decimal
    logistics_cost: Decimal
    net_value: Decimal
    distance_km: float
    distance_source: str
    material_multiplier: float
    estimated_delivery_days: int
    notes: list[str] = field(default_factory=list)


def _compute(db: Session, surplus, buyer_company_id: int) -> ValuationResult:
    buyer = db.get(Company, buyer_company_id)
    if buyer is None:
        raise CompanyNotFoundError(buyer_company_id)

    material = material_repository.get_by_id(db, surplus.material_id)
    estimate = logistics_service.estimate(surplus, buyer, material)

    qty = Decimal(surplus.quantity)
    price = Decimal(surplus.unit_price)
    gross = qty * price
    logistics = Decimal(str(estimate.total_cost))
    net = gross - logistics

    return ValuationResult(
        surplus_id=surplus.id,
        seller_company_id=surplus.company_id,
        buyer_company_id=buyer_company_id,
        buyer_company_name=buyer.name,
        buyer_company_city=buyer.city,
        buyer_company_state=buyer.state,
        quantity=qty,
        unit_price=price,
        gross_value=gross,
        logistics_cost=logistics,
        net_value=net,
        distance_km=estimate.distance_km,
        distance_source=estimate.distance_source,
        material_multiplier=estimate.material_multiplier,
        estimated_delivery_days=estimate.estimated_delivery_days,
        notes=estimate.notes,
    )


def valuate_surplus_for_company(
    db: Session,
    surplus_id: int,
    buyer_company_id: int,
    current_user: User,
) -> ValuationResult:
    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    # Solo el vendedor, el comprador específico, o platform_admin
    if current_user.role != UserRole.PLATFORM_ADMIN:
        allowed = {surplus.company_id, buyer_company_id}
        if current_user.company_id not in allowed:
            raise PermissionDeniedError(
                "No puedes ver esta valorización"
            )

    return _compute(db, surplus, buyer_company_id)


def valuate_surplus_against_all_buyers(
    db: Session,
    surplus_id: int,
    current_user: User,
    *,
    limit: int = 20,
) -> list[ValuationResult]:
    """Para el dueño: compara valor neto contra empresas con Need
    activa del mismo material. Ordenado por net_value descendente."""

    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    if (
        current_user.role != UserRole.PLATFORM_ADMIN
        and current_user.company_id != surplus.company_id
    ):
        raise PermissionDeniedError(
            "Solo el dueño del excedente puede ver este análisis"
        )

    buyer_ids = db.scalars(
        select(Need.company_id)
        .where(
            Need.material_id == surplus.material_id,
            Need.status == NeedStatus.ACTIVE,
            Need.company_id != surplus.company_id,
        )
        .distinct()
    ).all()

    results: list[ValuationResult] = []
    for buyer_company_id in buyer_ids:
        try:
            results.append(
                _compute(db, surplus, buyer_company_id)
            )
        except CompanyNotFoundError:
            continue

    results.sort(key=lambda r: r.net_value, reverse=True)
    return results[:limit]