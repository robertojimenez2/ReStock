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