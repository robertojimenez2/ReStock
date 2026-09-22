from fastapi import FastAPI
from sqlalchemy import text

from db.session import engine


app = FastAPI(
    title="ReStockMX API",
    description="API para la plataforma de valorización y comercialización de excedentes industriales.",
    version="0.1.0",
)


@get("/")
async def root():
    return {
        "message": "ReStockMX API funcionando",
        "version": "0.1.0",
    }


@get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "restock-backend",
    }


@get("/health/database")
async def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "postgresql",
    }