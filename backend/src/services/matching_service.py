from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from core.exceptions import (
    NeedNotFoundError,
    PermissionDeniedError,
    SurplusNotFoundError,
)
from models.company import Company
from models.enums import (
    NeedStatus,
    SpecificationDataType,
    SurplusStatus,
    UserRole,
)
from models.need import Need
from models.need_specification import NeedSpecification
from models.surplus import Surplus
from models.surplus_specification import SurplusSpecification
from models.user import User

# Pesos por dimensión (README)
W_MATERIAL = 0.40
W_QUANTITY = 0.20
W_LOCATION = 0.20
W_PRICE = 0.10
W_SPECS = 0.10


@dataclass
class ScoreBreakdown:
    material: float
    quantity: float
    location: float
    price: float
    specifications: float
    notes: list[str] = field(default_factory=list)


@dataclass
class ScoredMatch:
    score: float
    breakdown: ScoreBreakdown
    counterpart_company: Company
    surplus: Surplus | None = None
    need: Need | None = None


# ── Funciones de score 

def _material_score(surplus: Surplus, need: Need) -> float:
    return 1.0 if surplus.material_id == need.material_id else 0.0


def _quantity_score(surplus: Surplus, need: Need) -> float:
    sq = float(surplus.quantity)
    nq = float(need.quantity)
    if sq <= 0 or nq <= 0:
        return 0.0
    return min(sq, nq) / max(sq, nq)


def _location_score(seller: Company, buyer: Company) -> float:
    """MVP sin coordenadas. Heurística por ciudad/estado.

    Sustituible en el futuro por PostGIS / lookup de distancias reales.
    """
    if seller.state == buyer.state:
        if seller.city == buyer.city:
            return 1.0
        return 0.7
    return 0.3


def _price_score(surplus: Surplus, need: Need) -> float:
    if need.max_price is None:
        return 1.0

    max_price = float(need.max_price)
    if max_price <= 0:
        return 0.0

    surplus_price = float(surplus.unit_price)
    if surplus_price <= max_price:
        return 1.0

    overrun = (surplus_price - max_price) / max_price
    return max(0.0, 1.0 - overrun)


def _compare_number(
    surplus_value,
    need_exact,
    need_min,
    need_max,
) -> bool:
    if surplus_value is None:
        return False

    sv = float(surplus_value)

    if need_exact is not None:
        return sv == float(need_exact)

    if need_min is not None and sv < float(need_min):
        return False
    return need_max is None or sv <= float(need_max)


def _specs_score(
    surplus: Surplus, need: Need,
) -> tuple[float, list[str]]:
    """Devuelve (score, nombres de specs con mismatch)."""

    surplus_specs = {s.specification_id: s for s in surplus.specifications}
    need_specs = {s.specification_id: s for s in need.specifications}

    common = set(surplus_specs) & set(need_specs)
    if not common:
        return 1.0, []

    matched = 0
    mismatches: list[str] = []

    for spec_id in common:
        ss = surplus_specs[spec_id]
        ns = need_specs[spec_id]
        spec = ss.specification  # relationship precargada

        if spec.data_type == SpecificationDataType.NUMBER:
            ok = _compare_number(
                ss.value_number,
                ns.value_number,
                ns.min_value_number,
                ns.max_value_number,
            )
        elif spec.data_type == SpecificationDataType.TEXT:
            ok = ss.value_text == ns.value_text
        elif spec.data_type == SpecificationDataType.BOOLEAN:
            ok = ss.value_boolean == ns.value_boolean
        else:
            ok = False

        if ok:
            matched += 1
        else:
            mismatches.append(spec.name)

    return matched / len(common), mismatches


# ── Composicion

def _score_pair(
    surplus: Surplus,
    need: Need,
) -> ScoreBreakdown:
    seller = surplus.company
    buyer = need.company

    material_s = _material_score(surplus, need)
    quantity_s = _quantity_score(surplus, need)
    location_s = _location_score(seller, buyer)
    price_s = _price_score(surplus, need)
    specs_s, spec_mismatches = _specs_score(surplus, need)

    notes: list[str] = []

    if quantity_s >= 0.95:
        notes.append("Cantidades prácticamente equivalentes")
    elif quantity_s >= 0.5:
        notes.append("Cantidades parcialmente compatibles")
    else:
        notes.append("Diferencia grande de cantidad")

    if location_s >= 1.0:
        notes.append("Misma ciudad")
    elif location_s >= 0.7:
        notes.append("Mismo estado")
    else:
        notes.append("Estados distintos")

    if need.max_price is None:
        notes.append("El comprador no fijó precio máximo")
    elif price_s >= 1.0:
        notes.append("Precio dentro del presupuesto del comprador")
    elif price_s > 0.0:
        notes.append("Precio ligeramente por encima del presupuesto")
    else:
        notes.append("Precio fuera del presupuesto")

    if spec_mismatches:
        notes.append(
            "Especificaciones incompatibles: " + ", ".join(spec_mismatches)
        )
    elif specs_s == 1.0 and surplus.specifications:
        notes.append("Todas las especificaciones coinciden")

    return ScoreBreakdown(
        material=round(material_s * 100, 2),
        quantity=round(quantity_s * 100, 2),
        location=round(location_s * 100, 2),
        price=round(price_s * 100, 2),
        specifications=round(specs_s * 100, 2),
        notes=notes,
    )


def _combine_score(b: ScoreBreakdown) -> float:
    total = (
        (b.material / 100) * W_MATERIAL
        + (b.quantity / 100) * W_QUANTITY
        + (b.location / 100) * W_LOCATION
        + (b.price / 100) * W_PRICE
        + (b.specifications / 100) * W_SPECS
    )
    return round(total * 100, 2)


# ── Carga de candidatos 

def _load_surplus(db: Session, surplus_id: int) -> Surplus | None:
    return db.scalar(
        select(Surplus)
        .options(
            selectinload(Surplus.specifications)
            .selectinload(SurplusSpecification.specification),
            selectinload(Surplus.company),
        )
        .where(Surplus.id == surplus_id)
    )


def _load_need(db: Session, need_id: int) -> Need | None:
    return db.scalar(
        select(Need)
        .options(
            selectinload(Need.specifications)
            .selectinload(NeedSpecification.specification),
            selectinload(Need.company),
        )
        .where(Need.id == need_id)
    )


def _candidate_needs(
    db: Session,
    surplus: Surplus,
    exclude_company_id: int | None,
) -> list[Need]:
    stmt = (
        select(Need)
        .options(
            selectinload(Need.specifications)
            .selectinload(NeedSpecification.specification),
            selectinload(Need.company),
        )
        .where(
            Need.status == NeedStatus.ACTIVE,
            Need.material_id == surplus.material_id,
        )
    )
    if exclude_company_id is not None:
        stmt = stmt.where(Need.company_id != exclude_company_id)
    return list(db.scalars(stmt).all())


def _candidate_surpluses(
    db: Session,
    need: Need,
    exclude_company_id: int | None,
) -> list[Surplus]:
    stmt = (
        select(Surplus)
        .options(
            selectinload(Surplus.specifications)
            .selectinload(SurplusSpecification.specification),
            selectinload(Surplus.company),
        )
        .where(
            Surplus.status == SurplusStatus.AVAILABLE,
            Surplus.material_id == need.material_id,
        )
    )
    if exclude_company_id is not None:
        stmt = stmt.where(Surplus.company_id != exclude_company_id)
    return list(db.scalars(stmt).all())


# ── API pública del servicio 

def _assert_can_see_matches(
    resource_company_id: int, current_user: User,
) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if resource_company_id != current_user.company_id:
        raise PermissionDeniedError(
            "Solo puedes ver coincidencias de tus propios registros"
        )


def find_matches_for_surplus(
    db: Session,
    surplus_id: int,
    current_user: User,
    *,
    exclude_own_company: bool = True,
    min_score: float = 0.0,
    limit: int = 50,
) -> list[ScoredMatch]:

    surplus = _load_surplus(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)

    _assert_can_see_matches(surplus.company_id, current_user)

    exclude = surplus.company_id if exclude_own_company else None
    candidates = _candidate_needs(db, surplus, exclude)

    matches: list[ScoredMatch] = []
    for need in candidates:
        breakdown = _score_pair(surplus, need)
        total = _combine_score(breakdown)

        if total < min_score:
            continue

        matches.append(
            ScoredMatch(
                score=total,
                breakdown=breakdown,
                counterpart_company=need.company,
                need=need,
            )
        )

    matches.sort(key=lambda m: m.score, reverse=True)
    return matches[:limit]


def find_matches_for_need(
    db: Session,
    need_id: int,
    current_user: User,
    *,
    exclude_own_company: bool = True,
    min_score: float = 0.0,
    limit: int = 50,
) -> list[ScoredMatch]:

    need = _load_need(db, need_id)
    if need is None:
        raise NeedNotFoundError(need_id)

    _assert_can_see_matches(need.company_id, current_user)

    exclude = need.company_id if exclude_own_company else None
    candidates = _candidate_surpluses(db, need, exclude)

    matches: list[ScoredMatch] = []
    for surplus in candidates:
        breakdown = _score_pair(surplus, need)
        total = _combine_score(breakdown)

        if total < min_score:
            continue

        matches.append(
            ScoredMatch(
                score=total,
                breakdown=breakdown,
                counterpart_company=surplus.company,
                surplus=surplus,
            )
        )

    matches.sort(key=lambda m: m.score, reverse=True)
    return matches[:limit]