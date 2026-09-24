from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    database_echo: bool = False

     
    cookie_name: str = "restock_session"
    cookie_secure: bool = False       # True en producción con HTTPS
    cookie_samesite: str = "lax"      # "lax" | "strict" | "none"
    cookie_domain: str | None = None  # None = dominio del backend

    
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()