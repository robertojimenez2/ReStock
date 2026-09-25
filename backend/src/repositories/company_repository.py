from sqlalchemy.orm import Session

from models.company import Company


def get_by_id(db: Session, company_id: int) -> Company | None:
    return db.get(Company, company_id)


def update(db: Session, company: Company, **fields) -> Company:
    for key, value in fields.items():
        if value is not None:
            setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return company