# app/core/exceptions.py
class AppError(Exception):
    """Base para todas las excepciones de dominio de la app."""


class EmailAlreadyRegisteredError(AppError):
    def __init__(self, email: str | None = None) -> None:
        self.email = email
        super().__init__("El correo electrónico ya está registrado")


class CompanyAlreadyExistsError(AppError):
    def __init__(self, name: str | None = None) -> None:
        self.name = name
        super().__init__("La empresa ya está registrada")


class MaterialNotFoundError(AppError):
    def __init__(self, material_id: int | None = None) -> None:
        self.material_id = material_id
        super().__init__("Material no encontrado")


class MaterialAlreadyExistsError(AppError):
    def __init__(self, name: str | None = None) -> None:
        self.name = name
        super().__init__("Ya existe un material con ese nombre")


class MaterialNotPendingError(AppError):
    def __init__(self) -> None:
        super().__init__("El material no está pendiente de aprobación")


class PermissionDeniedError(AppError):
    def __init__(self, message: str = "No tienes permisos para esta acción") -> None:
        super().__init__(message)


class SurplusNotFoundError(AppError):
    def __init__(self, surplus_id: int | None = None) -> None:
        self.surplus_id = surplus_id
        super().__init__("Excedente no encontrado")


class SpecificationNotFoundError(AppError):
    def __init__(self, specification_id: int | None = None) -> None:
        self.specification_id = specification_id
        super().__init__("Especificación no encontrada")


class SpecificationNotBelongToMaterialError(AppError):
    def __init__(self, specification_id: int, material_id: int) -> None:
        self.specification_id = specification_id
        self.material_id = material_id
        super().__init__(
            f"La especificación {specification_id} no pertenece al material {material_id}"
        )


class InvalidSpecificationValueError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class InvalidStatusTransitionError(AppError):
    def __init__(self, current: str, target: str) -> None:
        self.current = current
        self.target = target
        super().__init__(
            f"No se puede pasar de '{current}' a '{target}'"
        )


class MaterialNotAvailableError(AppError):
    def __init__(self, material_id: int) -> None:
        self.material_id = material_id
        super().__init__(
            f"El material {material_id} no está disponible para publicar excedentes"
        )

class SpecificationAlreadyExistsError(AppError):
    def __init__(self, name: str, material_id: int) -> None:
        self.name = name
        self.material_id = material_id
        super().__init__(
            f"Ya existe una especificación '{name}' para este material"
        )


class SpecificationInUseError(AppError):
    def __init__(self, specification_id: int) -> None:
        self.specification_id = specification_id
        super().__init__(
            "No se puede eliminar: la especificación tiene valores asociados"
        )


class SpecificationTypeChangeError(AppError):
    def __init__(self, specification_id: int) -> None:
        self.specification_id = specification_id
        super().__init__(
            "No se puede cambiar data_type: la especificación tiene valores asociados"
        )


class MaterialNotEditableError(AppError):
    def __init__(self, material_id: int) -> None:
        self.material_id = material_id
        super().__init__(
            "Solo puedes modificar especificaciones de materiales pendientes propuestos por tu empresa"
        )


class NeedNotFoundError(AppError):
    def __init__(self, need_id: int | None = None) -> None:
        self.need_id = need_id
        super().__init__("Necesidad no encontrada")


class OfferNotFoundError(AppError):
    def __init__(self, offer_id: int | None = None) -> None:
        self.offer_id = offer_id
        super().__init__("Oferta no encontrada")


class TransactionNotFoundError(AppError):
    def __init__(self, transaction_id: int | None = None) -> None:
        self.transaction_id = transaction_id
        super().__init__("Transacción no encontrada")


class OfferNotActionableError(AppError):
    def __init__(self, reason: str) -> None:
        super().__init__(reason)


class SurplusNotAvailableError(AppError):
    def __init__(self, surplus_id: int) -> None:
        self.surplus_id = surplus_id
        super().__init__(
            "El excedente no está disponible para nuevas ofertas"
        )


class InvalidTransactionTransitionError(AppError):
    def __init__(self, current: str, target: str) -> None:
        self.current = current
        self.target = target
        super().__init__(
            f"No se puede pasar de '{current}' a '{target}'"
        )


class CompanyNotFoundError(AppError):
    def __init__(self, company_id: int | None = None) -> None:
        self.company_id = company_id
        super().__init__("Empresa no encontrada")


class NotificationNotFoundError(AppError):
    def __init__(self, notification_id: int | None = None) -> None:
        self.notification_id = notification_id
        super().__init__("Notificación no encontrada")