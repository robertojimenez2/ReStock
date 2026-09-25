from sqlalchemy.orm import Session

from core.exceptions import CompanyNotFoundError
from models.company import Company
from models.user import User
from repositories import company_repository
from schemas.company import CompanyUpdate


def get_my_company(db: Session, current_user: User) -> Company:
    company = company_repository.get_by_id(db, current_user.company_id)
    if company is None:
        raise CompanyNotFoundError(current_user.company_id)
    return company


def update_my_company(
    db: Session,
    data: CompanyUpdate,
    current_user: User,
) -> Company:
    company = get_my_company(db, current_user)

    return company_repository.update(
        db,
        company,
        name=data.name,
        legal_name=data.legal_name,
        industry=data.industry,
        description=data.description,
        city=data.city,
        state=data.state,
        address=data.address,
    )