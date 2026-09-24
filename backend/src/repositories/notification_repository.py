from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from models.notification import Notification


def get_by_id(db: Session, notification_id: int) -> Notification | None:
    return db.get(Notification, notification_id)


def list_for_user(
    db: Session,
    user_id: int,
    *,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> list[Notification]:
    stmt = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        stmt = stmt.where(Notification.read_at.is_(None))

    stmt = stmt.order_by(Notification.created_at.desc())
    stmt = stmt.offset(skip).limit(limit)

    return list(db.scalars(stmt).all())


def count_for_user(
    db: Session, user_id: int,
) -> tuple[int, int]:
    """Devuelve (total, unread)."""
    total = db.scalar(
        select(func.count(Notification.id))
        .where(Notification.user_id == user_id)
    )
    unread = db.scalar(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
    )
    return int(total or 0), int(unread or 0)


def mark_all_read(
    db: Session, user_id: int, when: datetime,
) -> int:
    result = db.execute(
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
        .values(read_at=when)
    )
    db.commit()
    return result.rowcount or 0


def save(db: Session, notification: Notification) -> Notification:
    db.commit()
    db.refresh(notification)
    return notification


def bulk_insert(
    db: Session, notifications: list[Notification],
) -> None:
    if not notifications:
        return
    db.add_all(notifications)
    db.commit()