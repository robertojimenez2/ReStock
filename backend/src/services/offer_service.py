from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.src.services import notification_service
from core.exceptions import (
    OfferNotFoundError,
    OfferNotActionableError,
    PermissionDeniedError,
    SurplusNotAvailableError,
    SurplusNotFoundError,
)
from models.enums import (
    OfferStatus,
    SurplusStatus,
    TransactionStatus,
    UserRole,
)
from models.offer import Offer
from models.surplus import Surplus
from models.transaction import Transaction
from models.user import User
from repositories import (
    offer_repository,
    surplus_repository,
    transaction_repository,
)
from schemas.offer import OfferCounter, OfferCreate
from services import notification_service


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _load_surplus_or_404(db: Session, surplus_id: int) -> Surplus:
    surplus = surplus_repository.get_by_id(db, surplus_id)
    if surplus is None:
        raise SurplusNotFoundError(surplus_id)
    return surplus


def _assert_participant(offer: Offer, current_user: User) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if current_user.company_id not in (
        offer.offered_by_company_id,
        offer.offered_to_company_id,
    ):
        raise PermissionDeniedError(
            "No participas en esta oferta"
        )


def _assert_recipient(offer: Offer, current_user: User) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if offer.offered_to_company_id != current_user.company_id:
        raise PermissionDeniedError(
            "Solo el destinatario puede aceptar, rechazar o contraofertar"
        )


def _assert_sender(offer: Offer, current_user: User) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if offer.offered_by_company_id != current_user.company_id:
        raise PermissionDeniedError(
            "Solo quien emitió la oferta puede cancelarla"
        )


def _assert_pending(offer: Offer) -> None:
    if offer.status != OfferStatus.PENDING:
        raise OfferNotActionableError(
            f"La oferta está en estado '{offer.status.value}' y ya no admite acciones"
        )


# ── Crear oferta inicial 

def create_offer(
    db: Session,
    data: OfferCreate,
    current_user: User,
) -> Offer:
    surplus = _load_surplus_or_404(db, data.surplus_id)

    if surplus.company_id == current_user.company_id:
        raise PermissionDeniedError(
            "No puedes ofertar sobre tu propio excedente"
        )

    if surplus.status != SurplusStatus.AVAILABLE:
        raise SurplusNotAvailableError(surplus.id)

    if data.quantity > surplus.quantity:
        raise OfferNotActionableError(
            "La cantidad ofertada excede la cantidad disponible"
        )

    offer = Offer(
        surplus_id=surplus.id,
        offered_by_company_id=current_user.company_id,
        offered_to_company_id=surplus.company_id,
        quantity=data.quantity,
        unit_price=data.unit_price,
        message=data.message,
        status=OfferStatus.PENDING,
    )

    offer_repository.create(db, offer)
    offer = offer_repository.create(db, offer)
    notification_service.notify_offer_received(db, offer)
    return offer


# ── Acciones sobre una oferta 

def accept_offer(
    db: Session,
    offer_id: int,
    current_user: User,
) -> tuple[Offer, Transaction]:
    offer = offer_repository.get_by_id(db, offer_id)
    if offer is None:
        raise OfferNotFoundError(offer_id)

    _assert_recipient(offer, current_user)
    _assert_pending(offer)

    surplus = _load_surplus_or_404(db, offer.surplus_id)
    if surplus.status != SurplusStatus.AVAILABLE:
        raise SurplusNotAvailableError(surplus.id)

    # Cancelar las demás ofertas PENDING sobre el mismo surplus
    others = offer_repository.list_pending_for_surplus(
        db, surplus.id, exclude_offer_id=offer.id,
    )
    for other in others:
        other.status = OfferStatus.CANCELLED
        db.add(other)

    # Marcar la oferta aceptada
    offer.status = OfferStatus.ACCEPTED
    db.add(offer)

    # Reservar el surplus
    surplus.status = SurplusStatus.RESERVED
    db.add(surplus)

    # Buyer = quien no es dueño del surplus
    seller_company_id = surplus.company_id
    buyer_company_id = (
        offer.offered_by_company_id
        if offer.offered_by_company_id != seller_company_id
        else offer.offered_to_company_id
    )

    transaction = Transaction(
        offer_id=offer.id,
        surplus_id=surplus.id,
        seller_company_id=seller_company_id,
        buyer_company_id=buyer_company_id,
        quantity=offer.quantity,
        unit_price=offer.unit_price,
        total_amount=offer.quantity * offer.unit_price,
        status=TransactionStatus.PENDING,
    )
    db.add(transaction)
    db.commit()
    db.refresh(offer)
    db.refresh(transaction)
    db.refresh(offer)
    db.refresh(transaction)

    notification_service.notify_offer_accepted(db, offer, transaction)

    return offer, transaction



def reject_offer(
    db: Session,
    offer_id: int,
    current_user: User,
) -> Offer:
    offer = offer_repository.get_by_id(db, offer_id)
    if offer is None:
        raise OfferNotFoundError(offer_id)

    _assert_recipient(offer, current_user)
    _assert_pending(offer)

    offer.status = OfferStatus.REJECTED

    offer = offer_repository.save(db, offer)
    notification_service.notify_offer_rejected(db, offer)
    return offer


def counter_offer(
    db: Session,
    offer_id: int,
    data: OfferCounter,
    current_user: User,
) -> Offer:
    offer = offer_repository.get_by_id(db, offer_id)
    if offer is None:
        raise OfferNotFoundError(offer_id)

    _assert_recipient(offer, current_user)
    _assert_pending(offer)

    # Solo el dueño del surplus puede contraofertar cantidades mayores a
    # las disponibles, así que validamos igual.
    surplus = _load_surplus_or_404(db, offer.surplus_id)
    if data.quantity > surplus.quantity:
        raise OfferNotActionableError(
            "La cantidad contraofertada excede la cantidad disponible"
        )

    # Marcar la original como COUNTERED
    offer.status = OfferStatus.COUNTERED
    db.add(offer)

    # Nueva oferta con roles invertidos
    new_offer = Offer(
        surplus_id=offer.surplus_id,
        offered_by_company_id=current_user.company_id,
        offered_to_company_id=offer.offered_by_company_id,
        parent_offer_id=offer.id,
        quantity=data.quantity,
        unit_price=data.unit_price,
        message=data.message,
        status=OfferStatus.PENDING,
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    notification_service.notify_offer_countered(db, new_offer, offer)
    return new_offer


def cancel_offer(
    db: Session,
    offer_id: int,
    current_user: User,
) -> Offer:
    offer = offer_repository.get_by_id(db, offer_id)
    if offer is None:
        raise OfferNotFoundError(offer_id)

    _assert_sender(offer, current_user)
    _assert_pending(offer)

    offer.status = OfferStatus.CANCELLED
    offer = offer_repository.save(db, offer)
    notification_service.notify_offer_cancelled(db, offer)
    return offer


def list_offers(
    db: Session,
    current_user: User,
    *,
    mine: bool = True,
    surplus_id: int | None = None,
    status: OfferStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Offer]:
    company_id = current_user.company_id if mine else None

    if not mine and current_user.role != UserRole.PLATFORM_ADMIN:
        company_id = current_user.company_id

    return offer_repository.list_offers(
        db,
        company_id=company_id,
        surplus_id=surplus_id,
        status=status,
        skip=skip,
        limit=limit,
    )


def get_offer(
    db: Session, offer_id: int, current_user: User,
) -> Offer:
    offer = offer_repository.get_by_id(db, offer_id)
    if offer is None:
        raise OfferNotFoundError(offer_id)
    _assert_participant(offer, current_user)
    return offer