from decimal import Decimal

from sqlalchemy.orm import Session

from models.company import Company
from models.enums import (
    NeedStatus,
    OfferStatus,
    SurplusStatus,
    TransactionStatus,
)
from models.user import User
from repositories import dashboard_repository
from schemas.dashboard import (
    DashboardCompanyInfo,
    DashboardResponse,
    NeedSummary,
    OfferSummary,
    SurplusSummary,
    TransactionSummary,
)
from schemas.offer import OfferResponse
from schemas.transaction import TransactionResponse


def _build_surplus_summary(
    by_status: dict[SurplusStatus, int],
    total_value: float,
) -> SurplusSummary:
    counts = {
        SurplusStatus.AVAILABLE: 0,
        SurplusStatus.RESERVED: 0,
        SurplusStatus.SOLD: 0,
        SurplusStatus.INACTIVE: 0,
    }
    counts.update(by_status)

    return SurplusSummary(
        total=sum(counts.values()),
        available=counts[SurplusStatus.AVAILABLE],
        reserved=counts[SurplusStatus.RESERVED],
        sold=counts[SurplusStatus.SOLD],
        inactive=counts[SurplusStatus.INACTIVE],
        total_value_available=Decimal(str(round(total_value, 2))),
    )


def _build_need_summary(
    by_status: dict[NeedStatus, int],
) -> NeedSummary:
    counts = {
        NeedStatus.ACTIVE: 0,
        NeedStatus.FULFILLED: 0,
        NeedStatus.INACTIVE: 0,
    }
    counts.update(by_status)

    return NeedSummary(
        total=sum(counts.values()),
        active=counts[NeedStatus.ACTIVE],
        fulfilled=counts[NeedStatus.FULFILLED],
        inactive=counts[NeedStatus.INACTIVE],
    )


def _build_offer_summary(
    by_status: dict[OfferStatus, int],
    pending_received: int,
    pending_sent: int,
) -> OfferSummary:
    counts = {
        OfferStatus.PENDING: 0,
        OfferStatus.ACCEPTED: 0,
        OfferStatus.REJECTED: 0,
        OfferStatus.COUNTERED: 0,
        OfferStatus.CANCELLED: 0,
        OfferStatus.EXPIRED: 0,
    }
    counts.update(by_status)

    return OfferSummary(
        pending_received=pending_received,
        pending_sent=pending_sent,
        accepted=counts[OfferStatus.ACCEPTED],
        rejected=counts[OfferStatus.REJECTED],
        countered=counts[OfferStatus.COUNTERED],
        cancelled=counts[OfferStatus.CANCELLED],
        expired=counts[OfferStatus.EXPIRED],
    )


def _build_transaction_summary(
    by_status: dict[TransactionStatus, int],
    total_completed_amount: float,
) -> TransactionSummary:
    counts = {
        TransactionStatus.PENDING: 0,
        TransactionStatus.IN_TRANSIT: 0,
        TransactionStatus.COMPLETED: 0,
        TransactionStatus.CANCELLED: 0,
    }
    counts.update(by_status)

    return TransactionSummary(
        pending=counts[TransactionStatus.PENDING],
        in_transit=counts[TransactionStatus.IN_TRANSIT],
        completed=counts[TransactionStatus.COMPLETED],
        cancelled=counts[TransactionStatus.CANCELLED],
        total_completed_amount=Decimal(
            str(round(total_completed_amount, 2))
        ),
    )


def build_dashboard(
    db: Session, current_user: User,
) -> DashboardResponse:
    company_id = current_user.company_id

    company = db.get(Company, company_id)
    if company is None:
        # No debería ocurrir por la FK, pero por seguridad.
        raise RuntimeError(
            f"Company {company_id} no existe para el usuario actual"
        )

    # Surpluses
    surplus_counts = dashboard_repository.count_surpluses_by_status(
        db, company_id,
    )
    surplus_value = dashboard_repository.sum_available_surplus_value(
        db, company_id,
    )

    # Needs
    need_counts = dashboard_repository.count_needs_by_status(
        db, company_id,
    )

    # Offers
    offer_counts = dashboard_repository.count_offers_by_status(
        db, company_id,
    )
    pending_received = dashboard_repository.count_pending_offers_received(
        db, company_id,
    )
    pending_sent = dashboard_repository.count_pending_offers_sent(
        db, company_id,
    )

    # Transactions
    tx_counts = dashboard_repository.count_transactions_by_status(
        db, company_id,
    )
    tx_amount = dashboard_repository.sum_completed_transactions_amount(
        db, company_id,
    )

    # Actividad reciente
    recent_offers = dashboard_repository.list_recent_offers(
        db, company_id, limit=5,
    )
    recent_txs = dashboard_repository.list_recent_transactions(
        db, company_id, limit=5,
    )

    return DashboardResponse(
        company=DashboardCompanyInfo.model_validate(company),
        surpluses=_build_surplus_summary(surplus_counts, surplus_value),
        needs=_build_need_summary(need_counts),
        offers=_build_offer_summary(
            offer_counts, pending_received, pending_sent,
        ),
        transactions=_build_transaction_summary(tx_counts, tx_amount),
        recent_offers=[
            OfferResponse.model_validate(o) for o in recent_offers
        ],
        recent_transactions=[
            TransactionResponse.model_validate(t) for t in recent_txs
        ],
    )