from datetime import datetime, timezone

from sqlalchemy.orm import Session

from core.exceptions import (
    InvalidTransactionTransitionError,
    PermissionDeniedError,
    TransactionNotFoundError,
)
from models.enums import (
    SurplusStatus,
    TransactionStatus,
    UserRole,
)
from models.transaction import Transaction
from models.user import User
from repositories import (
    surplus_repository,
    transaction_repository,
)
from schemas.transaction import TransactionStatusUpdate


_ALLOWED: dict[TransactionStatus, set[TransactionStatus]] = {
    TransactionStatus.PENDING: {
        TransactionStatus.IN_TRANSIT,
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
    },
    TransactionStatus.IN_TRANSIT: {
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
    },
    TransactionStatus.COMPLETED: set(),
    TransactionStatus.CANCELLED: set(),
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _assert_participant(tx: Transaction, current_user: User) -> None:
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if current_user.company_id not in (
        tx.seller_company_id, tx.buyer_company_id,
    ):
        raise PermissionDeniedError(
            "No participas en esta transacción"
        )


def list_transactions(
    db: Session,
    current_user: User,
    *,
    status: TransactionStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Transaction]:
    company_id = (
        None
        if current_user.role == UserRole.PLATFORM_ADMIN
        else current_user.company_id
    )
    return transaction_repository.list_transactions(
        db,
        company_id=company_id,
        status=status,
        skip=skip,
        limit=limit,
    )


def get_transaction(
    db: Session, transaction_id: int, current_user: User,
) -> Transaction:
    tx = transaction_repository.get_by_id(db, transaction_id)
    if tx is None:
        raise TransactionNotFoundError(transaction_id)
    _assert_participant(tx, current_user)
    return tx


def change_status(
    db: Session,
    transaction_id: int,
    data: TransactionStatusUpdate,
    current_user: User,
) -> Transaction:
    tx = transaction_repository.get_by_id(db, transaction_id)
    if tx is None:
        raise TransactionNotFoundError(transaction_id)

    _assert_participant(tx, current_user)

    target = data.status

    if current_user.role != UserRole.PLATFORM_ADMIN:
        allowed = _ALLOWED.get(tx.status, set())
        if target not in allowed:
            raise InvalidTransactionTransitionError(
                tx.status.value, target.value,
            )

    tx.status = target
    if data.notes is not None:
        tx.notes = data.notes

    # Efectos sobre el surplus
    if target == TransactionStatus.COMPLETED:
        tx.completed_at = _utc_now()
        surplus = surplus_repository.get_by_id(db, tx.surplus_id)
        if surplus is not None:
            surplus.status = SurplusStatus.SOLD
            db.add(surplus)

    elif target == TransactionStatus.CANCELLED:
        surplus = surplus_repository.get_by_id(db, tx.surplus_id)
        if surplus is not None and surplus.status == SurplusStatus.RESERVED:
            surplus.status = SurplusStatus.AVAILABLE
            db.add(surplus)

    return transaction_repository.save(db, tx)