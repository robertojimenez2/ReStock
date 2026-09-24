from enum import StrEnum


class SpecificationDataType(StrEnum):
    NUMBER = "number"
    TEXT = "text"
    BOOLEAN = "boolean"


class UserRole(StrEnum):
    COMPANY_USER = "company_user"
    COMPANY_ADMIN = "company_admin"
    PLATFORM_ADMIN = "platform_admin"


class SurplusStatus(StrEnum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    INACTIVE = "inactive"


class NeedStatus(StrEnum):
    ACTIVE = "active"
    FULFILLED = "fulfilled"
    INACTIVE = "inactive"


class MaterialStatus(StrEnum):
    ACTIVE = "active"
    PENDING = "pending"
    REJECTED = "rejected"


class OfferStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTERED = "countered"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class TransactionStatus(StrEnum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class NotificationType(StrEnum):
    OFFER_RECEIVED = "offer_received"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    OFFER_COUNTERED = "offer_countered"
    OFFER_CANCELLED = "offer_cancelled"
    TRANSACTION_STATUS_CHANGED = "transaction_status_changed"
    MATERIAL_APPROVED = "material_approved"
    MATERIAL_REJECTED = "material_rejected"