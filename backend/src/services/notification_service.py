import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import NotificationNotFoundError
from models.company import Company
from models.enums import NotificationType, UserRole
from models.notification import Notification
from models.offer import Offer
from models.transaction import Transaction
from models.user import User
from repositories import notification_repository

logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    return datetime.now(UTC)


# ── Recipients 

def _recipient_user_ids(db: Session, company_id: int) -> list[int]:
    """Usuarios activos de la empresa. Prefiere admins."""
    admin_ids = list(db.scalars(
        select(User.id).where(
            User.company_id == company_id,
            User.role == UserRole.COMPANY_ADMIN,
            User.is_active.is_(True),
        )
    ).all())
    if admin_ids:
        return admin_ids

    return list(db.scalars(
        select(User.id).where(
            User.company_id == company_id,
            User.is_active.is_(True),
        )
    ).all())


def _company_name(db: Session, company_id: int) -> str:
    company = db.get(Company, company_id)
    return company.name if company else f"Empresa {company_id}"


# ── Core insert ─────────────────────────────────────────────────────

def _emit(
    db: Session,
    *,
    company_id: int,
    type: NotificationType,
    payload: dict,
) -> None:
    """Inserta notificaciones para todos los destinatarios.

    Best-effort: cualquier error se loguea pero no se propaga.
    """
    try:
        user_ids = _recipient_user_ids(db, company_id)
        if not user_ids:
            return

        notifications = [
            Notification(
                user_id=uid,
                type=type,
                payload=payload,
            )
            for uid in user_ids
        ]
        notification_repository.bulk_insert(db, notifications)
    except Exception:
        logger.exception(
            "No se pudo crear notificación tipo=%s para empresa=%s",
            type.value, company_id,
        )
        db.rollback()


# ── Eventos específicos 

def notify_offer_received(db: Session, offer: Offer) -> None:
    """B acaba de ofertar a A. A recibe la notificación."""
    payload = {
        "offer_id": offer.id,
        "surplus_id": offer.surplus_id,
        "from_company_id": offer.offered_by_company_id,
        "from_company_name": _company_name(db, offer.offered_by_company_id),
        "quantity": str(offer.quantity),
        "unit_price": str(offer.unit_price),
        "message": offer.message,
    }
    _emit(
        db,
        company_id=offer.offered_to_company_id,
        type=NotificationType.OFFER_RECEIVED,
        payload=payload,
    )


def notify_offer_accepted(
    db: Session, offer: Offer, transaction: Transaction,
) -> None:
    """A aceptó la oferta de B. B recibe la notificación."""
    payload = {
        "offer_id": offer.id,
        "transaction_id": transaction.id,
        "surplus_id": offer.surplus_id,
        "from_company_id": offer.offered_to_company_id,
        "from_company_name": _company_name(db, offer.offered_to_company_id),
        "quantity": str(offer.quantity),
        "unit_price": str(offer.unit_price),
        "total_amount": str(transaction.total_amount),
    }
    _emit(
        db,
        company_id=offer.offered_by_company_id,
        type=NotificationType.OFFER_ACCEPTED,
        payload=payload,
    )


def notify_offer_rejected(db: Session, offer: Offer) -> None:
    payload = {
        "offer_id": offer.id,
        "surplus_id": offer.surplus_id,
        "from_company_id": offer.offered_to_company_id,
        "from_company_name": _company_name(db, offer.offered_to_company_id),
    }
    _emit(
        db,
        company_id=offer.offered_by_company_id,
        type=NotificationType.OFFER_REJECTED,
        payload=payload,
    )


def notify_offer_countered(
    db: Session, new_offer: Offer, parent_offer: Offer,
) -> None:
    """A contraofert. B (emisor de la original) recibe la notificación."""
    payload = {
        "offer_id": new_offer.id,
        "parent_offer_id": parent_offer.id,
        "surplus_id": new_offer.surplus_id,
        "from_company_id": new_offer.offered_by_company_id,
        "from_company_name": _company_name(db, new_offer.offered_by_company_id),
        "quantity": str(new_offer.quantity),
        "unit_price": str(new_offer.unit_price),
        "message": new_offer.message,
    }
    _emit(
        db,
        company_id=parent_offer.offered_by_company_id,
        type=NotificationType.OFFER_COUNTERED,
        payload=payload,
    )


def notify_offer_cancelled(db: Session, offer: Offer) -> None:
    """Emisor cancela. Receptor recibe la notificación."""
    payload = {
        "offer_id": offer.id,
        "surplus_id": offer.surplus_id,
        "from_company_id": offer.offered_by_company_id,
        "from_company_name": _company_name(db, offer.offered_by_company_id),
    }
    _emit(
        db,
        company_id=offer.offered_to_company_id,
        type=NotificationType.OFFER_CANCELLED,
        payload=payload,
    )


def notify_transaction_status_changed(
    db: Session,
    transaction: Transaction,
    *,
    acting_company_id: int,
    old_status: str,
    new_status: str,
) -> None:
    """Notifica a la contraparte (no a quien actuó)."""
    if acting_company_id == transaction.seller_company_id:
        recipient_company_id = transaction.buyer_company_id
    elif acting_company_id == transaction.buyer_company_id:
        recipient_company_id = transaction.seller_company_id
    else:
        # platform_admin u otro: notificar a ambos
        _emit(
            db,
            company_id=transaction.seller_company_id,
            type=NotificationType.TRANSACTION_STATUS_CHANGED,
            payload=_tx_payload(db, transaction, old_status, new_status, acting_company_id),
        )
        _emit(
            db,
            company_id=transaction.buyer_company_id,
            type=NotificationType.TRANSACTION_STATUS_CHANGED,
            payload=_tx_payload(db, transaction, old_status, new_status, acting_company_id),
        )
        return

    _emit(
        db,
        company_id=recipient_company_id,
        type=NotificationType.TRANSACTION_STATUS_CHANGED,
        payload=_tx_payload(db, transaction, old_status, new_status, acting_company_id),
    )


def _tx_payload(
    db: Session,
    transaction: Transaction,
    old_status: str,
    new_status: str,
    acting_company_id: int,
) -> dict:
    return {
        "transaction_id": transaction.id,
        "surplus_id": transaction.surplus_id,
        "old_status": old_status,
        "new_status": new_status,
        "from_company_id": acting_company_id,
        "from_company_name": _company_name(db, acting_company_id),
        "total_amount": str(transaction.total_amount),
    }


def notify_material_approved(db: Session, material) -> None:
    if material.proposed_by_company_id is None:
        return
    payload = {
        "material_id": material.id,
        "material_name": material.name,
    }
    _emit(
        db,
        company_id=material.proposed_by_company_id,
        type=NotificationType.MATERIAL_APPROVED,
        payload=payload,
    )


def notify_material_rejected(db: Session, material) -> None:
    if material.proposed_by_company_id is None:
        return
    payload = {
        "material_id": material.id,
        "material_name": material.name,
    }
    _emit(
        db,
        company_id=material.proposed_by_company_id,
        type=NotificationType.MATERIAL_REJECTED,
        payload=payload,
    )


# ── Lectura y estado 

def list_notifications(
    db: Session,
    current_user: User,
    *,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> list[Notification]:
    return notification_repository.list_for_user(
        db,
        current_user.id,
        unread_only=unread_only,
        skip=skip,
        limit=limit,
    )


def count_notifications(
    db: Session, current_user: User,
) -> tuple[int, int]:
    return notification_repository.count_for_user(db, current_user.id)


def mark_read(
    db: Session, notification_id: int, current_user: User,
) -> Notification:
    notification = notification_repository.get_by_id(db, notification_id)
    if notification is None:
        raise NotificationNotFoundError(notification_id)

    # Solo el destinatario puede marcarla
    if notification.user_id != current_user.id:
        raise NotificationNotFoundError(notification_id)

    if notification.read_at is None:
        notification.read_at = _utc_now()

    return notification_repository.save(db, notification)


def mark_all_read(db: Session, current_user: User) -> int:
    return notification_repository.mark_all_read(
        db, current_user.id, _utc_now(),
    )