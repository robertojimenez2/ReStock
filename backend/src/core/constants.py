from typing import Final

# ── Logística 
# Costos estimados en MXN. Ajustables según feedback operativo. Buscarlos depues
LOGISTICS_BASE_PICKUP_MXN: Final = 500.0
LOGISTICS_RATE_MXN_PER_KG_KM: Final = 0.003
LOGISTICS_MIN_DISTANCE_KM: Final = 30.0
LOGISTICS_DEFAULT_DISTANCE_KM: Final = 800.0
LOGISTICS_DELIVERY_KM_PER_DAY: Final = 500.0
LOGISTICS_INTRA_CITY_KM: Final = 15.0

# Factor multiplicador según categoría/nombre del material.
# Se busca por substring normalizado (sin acentos, minúsculas).
MATERIAL_CATEGORY_MULTIPLIERS: Final[dict[str, float]] = {
    "plastico": 1.0,
    "plastic": 1.0,
    "polimero": 1.0,
    "pebd": 1.0,
    "pead": 1.0,
    "pp": 1.0,
    "pet": 1.0,
    "hdpe": 1.0,
    "ldpe": 1.0,
    "metal": 1.5,
    "acero": 1.5,
    "aluminio": 1.3,
    "cobre": 1.8,
    "carton": 0.7,
    "papel": 0.7,
    "vidrio": 1.3,
    "madera": 0.9,
    "quimico": 1.2,
}


# ── Geografía 
# Centroides aproximados de estados mexicanos (lat, lng).
# Fuente: aproximación manual para MVP. Reemplazar por PostGIS cuando
# Company tenga columnas de coordenadas reales. CAMBIAR DESPUES
MEXICAN_STATE_CENTROIDS: Final[dict[str, tuple[float, float]]] = {
    "aguascalientes": (21.8853, -102.2916),
    "baja california": (32.6245, -115.4523),
    "baja california sur": (24.1426, -110.3128),
    "campeche": (19.8301, -90.5349),
    "chiapas": (16.7569, -93.1292),
    "chihuahua": (28.6330, -106.0691),
    "ciudad de mexico": (19.4326, -99.1332),
    "cdmx": (19.4326, -99.1332),
    "distrito federal": (19.4326, -99.1332),
    "coahuila": (27.0587, -101.7068),
    "colima": (19.2452, -103.7241),
    "durango": (24.5593, -104.6584),
    "estado de mexico": (19.4969, -99.7233),
    "edomex": (19.4969, -99.7233),
    "guanajuato": (21.0190, -101.2574),
    "guerrero": (17.4392, -99.5451),
    "hidalgo": (20.0911, -98.7624),
    "jalisco": (20.6597, -103.3496),
    "michoacan": (19.5665, -101.7068),
    "morelos": (18.6813, -99.1013),
    "nayarit": (21.7514, -104.8455),
    "nuevo leon": (25.5922, -99.9962),
    "oaxaca": (17.0732, -96.7266),
    "puebla": (19.0413, -98.2062),
    "queretaro": (20.5888, -100.3899),
    "quintana roo": (19.1817, -88.4791),
    "san luis potosi": (22.1565, -100.9855),
    "sinaloa": (25.1721, -107.4795),
    "sonora": (29.0729, -110.9559),
    "tabasco": (17.8409, -92.6189),
    "tamaulipas": (24.2669, -98.8363),
    "tlaxcala": (19.3182, -98.2375),
    "veracruz": (19.1738, -96.1342),
    "yucatan": (20.9674, -89.5926),
    "zacatecas": (22.7709, -102.5832),
}