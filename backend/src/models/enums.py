from enum import Enum


class SpecificationDataType(str, Enum):
    NUMBER = "number"
    TEXT = "text"
    BOOLEAN = "boolean"


class UserRole(str, Enum):
    COMPANY_USER = "company_user"
    COMPANY_ADMIN = "company_admin"
    PLATFORM_ADMIN = "platform_admin"


class SurplusStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    INACTIVE = "inactive"


class NeedStatus(str, Enum):
    ACTIVE = "active"
    FULFILLED = "fulfilled"
    INACTIVE = "inactive"


class MaterialStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    REJECTED = "rejected"