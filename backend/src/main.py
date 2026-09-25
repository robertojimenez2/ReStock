from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.auth import router as auth_router
from api.companies import router as companies_router
from api.dashboard import router as dashboard_router
from api.matches import router as matches_router
from api.materials import router as materials_router
from api.needs import router as needs_router
from api.notifications import router as notifications_router
from api.offers import router as offers_router
from api.specifications import router as specifications_router
from api.surpluses import router as surpluses_router
from api.transactions import router as transactions_router
from api.valuation import router as valuation_router
from core.config import settings
from db.session import engine

app = FastAPI(
    title="ReStockMX API",
    description="API para la plataforma de valorización y comercialización de excedentes industriales.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(materials_router)
app.include_router(surpluses_router)
app.include_router(specifications_router)
app.include_router(needs_router)
app.include_router(matches_router)
app.include_router(offers_router)
app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(companies_router)
app.include_router(valuation_router)
app.include_router(notifications_router)

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