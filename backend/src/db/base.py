from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from models.company import Company
from models.user import User
from models.material import Material
from models.surplus import Surplus
from models.need import Need
from models.specification import Specification
from models.surplus_specification import SurplusSpecification
from models.need_specification import NeedSpecification