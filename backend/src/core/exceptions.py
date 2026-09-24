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