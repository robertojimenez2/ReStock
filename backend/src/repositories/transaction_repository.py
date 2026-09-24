from sqlalchemy import select
from sqlalchemy.orm import Session

from models.enums import TransactionStatus
from models.transaction import Transaction


def get_by_id(db: Session, transaction_id: int) -> Transaction | None:
    return db.get(Transaction, transaction_id)


def get_by_surplus(db: Session, surplus_id: int) -> Transaction | None:
    return db.scalar(
        select(Transaction)
        .where(Transaction.surplus_id == surplus_id)
        .order_by(Transaction.created_at.desc())
    )


def list_transactions(
    db: Session,
    *,
    company_id: int | None = None,
    status: TransactionStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Transaction]:
    stmt = select(Transaction)

    if company_id is not None:
        stmt = stmt.where(
            (Transaction.seller_company_id == company_id)
            | (Transaction.buyer_company_id == company_id)
        )
    if status is not None:
        stmt = stmt.where(Transaction.status == status)

    stmt = stmt.order_by(Transaction.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def create(db: Session, transaction: Transaction) -> Transaction:
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def save(db: Session, transaction: Transaction) -> Transaction:
    db.commit()
    db.refresh(transaction)
    return transaction