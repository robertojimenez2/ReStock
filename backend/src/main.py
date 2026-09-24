from fastapi import FastAPI
from sqlalchemy import text

from db.session import engine
from api.auth import router as auth_router
from api.materials import router as materials_router
from api.surpluses import router as surpluses_router
from api.specifications import router as specifications_router
from api.needs import router as needs_router
import db.metadata

app = FastAPI(
    title="ReStockMX API",
    description="API para la plataforma de valorización y comercialización de excedentes industriales.",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(materials_router)
app.include_router(surpluses_router)
app.include_router(specifications_router)
app.include_router(needs_router)

@app.get("/")
async def root():
    return {
        "message": "ReStockMX API funcionando",
        "version": "0.1.0",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "restock-backend",
    }


@app.get("/health/database")
async def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "postgresql",
    }