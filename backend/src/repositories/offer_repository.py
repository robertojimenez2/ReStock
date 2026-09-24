from sqlalchemy import select
from sqlalchemy.orm import Session

from models.enums import OfferStatus
from models.offer import Offer


def get_by_id(db: Session, offer_id: int) -> Offer | None:
    return db.get(Offer, offer_id)


def list_offers(
    db: Session,
    *,
    company_id: int | None = None,
    surplus_id: int | None = None,
    status: OfferStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Offer]:
    stmt = select(Offer)

    if company_id is not None:
        # Ofertas donde participa la empresa (emisor o receptor)
        stmt = stmt.where(
            (Offer.offered_by_company_id == company_id)
            | (Offer.offered_to_company_id == company_id)
        )
    if surplus_id is not None:
        stmt = stmt.where(Offer.surplus_id == surplus_id)
    if status is not None:
        stmt = stmt.where(Offer.status == status)

    stmt = stmt.order_by(Offer.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def list_pending_for_surplus(
    db: Session, surplus_id: int, exclude_offer_id: int,
) -> list[Offer]:
    return list(
        db.scalars(
            select(Offer).where(
                Offer.surplus_id == surplus_id,
                Offer.status == OfferStatus.PENDING,
                Offer.id != exclude_offer_id,
            )
        ).all()
    )


def create(db: Session, offer: Offer) -> Offer:
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def save(db: Session, offer: Offer) -> Offer:
    db.commit()
    db.refresh(offer)
    return offer