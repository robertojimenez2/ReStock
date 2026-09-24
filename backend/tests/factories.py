"""Factories para crear entidades de prueba sin pasar por la API."""

from decimal import Decimal

from sqlalchemy.orm import Session

from models.company import Company
from models.enums import (
    MaterialStatus,
    NeedStatus,
    SpecificationDataType,
    SurplusStatus,
    UserRole,
)
from models.material import Material
from models.need import Need
from models.need_specification import NeedSpecification
from models.specification import Specification
from models.surplus import Surplus
from models.surplus_specification import SurplusSpecification
from models.user import User
from core.security import hash_password


def make_company(
    db: Session,
    name: str = "Test Co",
    city: str = "Guadalajara",
    state: str = "Jalisco",
) -> Company:
    company = Company(
        name=name,
        legal_name=f"{name} SA de CV",
        industry="Manufactura",
        city=city,
        state=state,
    )
    db.add(company)
    db.flush()
    return company


def make_user(
    db: Session,
    company: Company,
    email: str = "user@test.mx",
    role: UserRole = UserRole.COMPANY_ADMIN,
    password: str = "test12345",
    is_active: bool = True,
) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=hash_password(password),
        full_name="Test User",
        role=role,
        is_active=is_active,
        company_id=company.id,
    )
    db.add(user)
    db.flush()
    return user


def make_material(
    db: Session,
    name: str = "PEBD",
    category: str = "Plásticos",
    status: MaterialStatus = MaterialStatus.ACTIVE,
    proposed_by_company_id: int | None = None,
) -> Material:
    material = Material(
        name=name,
        category=category,
        description=None,
        status=status,
        proposed_by_company_id=proposed_by_company_id,
    )
    db.add(material)
    db.flush()
    return material


def make_specification(
    db: Session,
    material: Material,
    name: str = "Índice de fluidez",
    data_type: SpecificationDataType = SpecificationDataType.NUMBER,
    unit: str | None = "g/10min",
    is_required: bool = True,
) -> Specification:
    spec = Specification(
        material_id=material.id,
        name=name,
        data_type=data_type,
        unit=unit,
        is_required=is_required,
    )
    db.add(spec)
    db.flush()
    return spec


def make_surplus(
    db: Session,
    company: Company,
    material: Material,
    quantity: str = "5000",
    unit: str = "kg",
    unit_price: str = "15",
    status: SurplusStatus = SurplusStatus.AVAILABLE,
    specs: list[tuple[Specification, dict]] | None = None,
) -> Surplus:
    surplus = Surplus(
        company_id=company.id,
        material_id=material.id,
        quantity=Decimal(quantity),
        unit=unit,
        unit_price=Decimal(unit_price),
        status=status,
    )
    db.add(surplus)
    db.flush()

    if specs:
        for spec, values in specs:
            db.add(
                SurplusSpecification(
                    surplus_id=surplus.id,
                    specification_id=spec.id,
                    **values,
                )
            )
        db.flush()

    return surplus


def make_need(
    db: Session,
    company: Company,
    material: Material,
    quantity: str = "3000",
    unit: str = "kg",
    max_price: str | None = "16",
    status: NeedStatus = NeedStatus.ACTIVE,
    specs: list[tuple[Specification, dict]] | None = None,
) -> Need:
    need = Need(
        company_id=company.id,
        material_id=material.id,
        quantity=Decimal(quantity),
        unit=unit,
        max_price=Decimal(max_price) if max_price else None,
        status=status,
    )
    db.add(need)
    db.flush()

    if specs:
        for spec, values in specs:
            db.add(
                NeedSpecification(
                    need_id=need.id,
                    specification_id=spec.id,
                    **values,
                )
            )
        db.flush()

    return need