from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.enums import (
    NeedStatus,
    OfferStatus,
    SurplusStatus,
    TransactionStatus,
)
from models.need import Need
from models.offer import Offer
from models.surplus import Surplus
from models.transaction import Transaction


# ── Surpluses 

def count_surpluses_by_status(
    db: Session, company_id: int,
) -> dict[SurplusStatus, int]:
    rows = db.execute(
        select(Surplus.status, func.count(Surplus.id))
        .where(Surplus.company_id == company_id)
        .group_by(Surplus.status)
    ).all()
    return {status: count for status, count in rows}


def sum_available_surplus_value(
    db: Session, company_id: int,
) -> float:
    """Valor bruto teórico de lo que tengo publicable."""
    value = db.scalar(
        select(
            func.coalesce(
                func.sum(Surplus.quantity * Surplus.unit_price),
                0,
            )
        ).where(
            Surplus.company_id == company_id,
            Surplus.status == SurplusStatus.AVAILABLE,
        )
    )
    return float(value or 0)


# ── Needs 

def count_needs_by_status(
    db: Session, company_id: int,
) -> dict[NeedStatus, int]:
    rows = db.execute(
        select(Need.status, func.count(Need.id))
        .where(Need.company_id == company_id)
        .group_by(Need.status)
    ).all()
    return {status: count for status, count in rows}


# ── Offers 

def count_offers_by_status(
    db: Session, company_id: int,
) -> dict[OfferStatus, int]:
    """Cuenta ofertas donde la empresa participa (emisor o receptor)."""
    rows = db.execute(
        select(Offer.status, func.count(Offer.id))
        .where(
            (Offer.offered_by_company_id == company_id)
            | (Offer.offered_to_company_id == company_id)
        )
        .group_by(Offer.status)
    ).all()
    return {status: count for status, count in rows}


def count_pending_offers_received(
    db: Session, company_id: int,
) -> int:
    value = db.scalar(
        select(func.count(Offer.id)).where(
            Offer.offered_to_company_id == company_id,
            Offer.status == OfferStatus.PENDING,
        )
    )
    return int(value or 0)


def count_pending_offers_sent(
    db: Session, company_id: int,
) -> int:
    value = db.scalar(
        select(func.count(Offer.id)).where(
            Offer.offered_by_company_id == company_id,
            Offer.status == OfferStatus.PENDING,
        )
    )
    return int(value or 0)


# ── Transactions 

def count_transactions_by_status(
    db: Session, company_id: int,
) -> dict[TransactionStatus, int]:
    rows = db.execute(
        select(Transaction.status, func.count(Transaction.id))
        .where(
            (Transaction.seller_company_id == company_id)
            | (Transaction.buyer_company_id == company_id)
        )
        .group_by(Transaction.status)
    ).all()
    return {status: count for status, count in rows}


def sum_completed_transactions_amount(
    db: Session, company_id: int,
) -> float:
    value = db.scalar(
        select(
            func.coalesce(func.sum(Transaction.total_amount), 0)
        ).where(
            (
                (Transaction.seller_company_id == company_id)
                | (Transaction.buyer_company_id == company_id)
            ),
            Transaction.status == TransactionStatus.COMPLETED,
        )
    )
    return float(value or 0)


# ── Actividad reciente 

def list_recent_offers(
    db: Session, company_id: int, limit: int = 5,
) -> list[Offer]:
    return list(
        db.scalars(
            select(Offer)
            .where(
                (Offer.offered_by_company_id == company_id)
                | (Offer.offered_to_company_id == company_id)
            )
            .order_by(Offer.created_at.desc())
            .limit(limit)
        ).all()
    )


def list_recent_transactions(
    db: Session, company_id: int, limit: int = 5,
) -> list[Transaction]:
    return list(
        db.scalars(
            select(Transaction)
            .where(
                (Transaction.seller_company_id == company_id)
                | (Transaction.buyer_company_id == company_id)
            )
            .order_by(Transaction.created_at.desc())
            .limit(limit)
        ).all()
    )