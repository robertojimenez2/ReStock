import math
import unicodedata
from dataclasses import dataclass, field

from core.constants import (
    LOGISTICS_BASE_PICKUP_MXN,
    LOGISTICS_DEFAULT_DISTANCE_KM,
    LOGISTICS_DELIVERY_KM_PER_DAY,
    LOGISTICS_INTRA_CITY_KM,
    LOGISTICS_MIN_DISTANCE_KM,
    LOGISTICS_RATE_MXN_PER_KG_KM,
    MATERIAL_CATEGORY_MULTIPLIERS,
    MEXICAN_STATE_CENTROIDS,
)
from models.company import Company
from models.material import Material
from models.surplus import Surplus


@dataclass
class LogisticsEstimate:
    distance_km: float
    distance_source: str
    material_multiplier: float
    base_cost: float
    distance_cost: float
    total_cost: float
    estimated_delivery_days: int
    notes: list[str] = field(default_factory=list)


def _normalize(text: str | None) -> str:
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", text.lower())
    return "".join(
        c for c in normalized if unicodedata.category(c) != "Mn"
    ).strip()


def _haversine_km(
    lat1: float, lng1: float, lat2: float, lng2: float,
) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


def _lookup_coords(state: str | None) -> tuple[float, float] | None:
    key = _normalize(state)
    if not key:
        return None
    return MEXICAN_STATE_CENTROIDS.get(key)


def _material_multiplier(
    material: Material | None,
) -> tuple[float, list[str]]:
    if material is None:
        return 1.0, ["Material desconocido: factor 1.0"]

    text = _normalize(f"{material.category} {material.name}")

    for keyword, factor in MATERIAL_CATEGORY_MULTIPLIERS.items():
        if keyword in text:
            return factor, [
                f"Factor logístico por material '{keyword}': ×{factor}"
            ]

    return 1.0, ["Material sin categoría específica: factor 1.0"]


def _resolve_distance(
    origin: Company, destination: Company,
) -> tuple[float, str, list[str]]:
    notes: list[str] = []

    origin_coords = _lookup_coords(origin.state)
    dest_coords = _lookup_coords(destination.state)

    if origin_coords is None or dest_coords is None:
        notes.append(
            "No se pudo resolver la ubicación: distancia promedio nacional asumida"
        )
        return LOGISTICS_DEFAULT_DISTANCE_KM, "default", notes

    same_state = _normalize(origin.state) == _normalize(destination.state)
    same_city = (
        same_state
        and _normalize(origin.city) == _normalize(destination.city)
        and _normalize(origin.city) != ""
    )

    if same_city:
        notes.append("Misma ciudad: costo intra-urbano")
        return LOGISTICS_INTRA_CITY_KM, "same_city", notes

    distance = _haversine_km(*origin_coords, *dest_coords)
    distance = max(distance, LOGISTICS_MIN_DISTANCE_KM)

    if same_state:
        notes.append(
            f"Mismo estado ({origin.state}), ciudades distintas"
        )
    else:
        notes.append(
            f"Trayecto aproximado {origin.state} → {destination.state}"
        )

    return round(distance, 2), "state_centroids", notes


def estimate(
    surplus: Surplus,
    destination: Company,
    material: Material | None = None,
) -> LogisticsEstimate:
    """Estima el costo de enviar un Surplus desde su empresa origen
    hasta `destination`. Función pura, sin acceso a BD."""

    origin = surplus.company

    distance_km, source, distance_notes = _resolve_distance(
        origin, destination,
    )

    material_factor, material_notes = _material_multiplier(material)

    quantity_kg = float(surplus.quantity)
    distance_cost_raw = (
        quantity_kg * distance_km * LOGISTICS_RATE_MXN_PER_KG_KM
    )
    base_cost_raw = LOGISTICS_BASE_PICKUP_MXN

    base_cost = base_cost_raw * material_factor
    distance_cost = distance_cost_raw * material_factor
    total = base_cost + distance_cost

    days = max(
        1,
        math.ceil(distance_km / LOGISTICS_DELIVERY_KM_PER_DAY),
    )

    return LogisticsEstimate(
        distance_km=distance_km,
        distance_source=source,
        material_multiplier=material_factor,
        base_cost=round(base_cost, 2),
        distance_cost=round(distance_cost, 2),
        total_cost=round(total, 2),
        estimated_delivery_days=days,
        notes=distance_notes + material_notes,
    )