# ReStockMX

> **Inteligencia para convertir excedentes industriales en valor.**

ReStockMX es una plataforma B2B de **valorización y comercialización inteligente de excedentes industriales**. No busca ser un simple marketplace de sobrantes: combina información técnica, económica y geográfica para ayudar a las empresas a descubrir qué hacer con un excedente, quién podría utilizarlo y qué alternativa puede generar mayor valor.

**Mercado inicial:** Guadalajara / El Salto, Jalisco — con foco inicial en la industria de plásticos.

## ¿Qué hace diferente a ReStockMX?

```text
Excedente industrial
        +
Información técnica
        +
Compatibilidad
        +
Ubicación
        +
Logística
        +
Valorización
        ↓
Recomendación de alternativas
        ↓
Oferta → Negociación → Transacción
```

La plataforma permite:

- Catalogar materiales y especificaciones técnicas.
- Publicar excedentes industriales.
- Registrar necesidades de compra.
- Encontrar empresas técnicamente compatibles.
- Explicar por qué una oportunidad es compatible.
- Estimar logística y valor neto.
- Negociar mediante ofertas y contraofertas.
- Dar seguimiento a transacciones y notificaciones.
- Consultar indicadores operativos desde un dashboard.

La idea central es transformar **“tengo material sobrante”** en **“sé qué tengo, quién puede utilizarlo, cuánto puede valer y qué alternativa me conviene analizar”**.

## Arquitectura general

ReStockMX utiliza un **monolito modular** con frontend y backend separados:

```text
┌─────────────────────────────────────────┐
│ Frontend                                │
│ Next.js · React · TypeScript            │
│ Dashboard · Marketplace · Operaciones   │
└──────────────────┬──────────────────────┘
                   │ REST / HTTP
                   ▼
┌─────────────────────────────────────────┐
│ Backend                                 │
│ FastAPI · Python                        │
│ API → Services → Repositories → Models │
└──────────────────┬──────────────────────┘
                   │ SQLAlchemy
                   ▼
┌─────────────────────────────────────────┐
│ PostgreSQL 17                           │
└─────────────────────────────────────────┘
```

La separación modular permite mantener una arquitectura profesional sin introducir la complejidad operativa de microservicios.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript |
| UI | Tailwind CSS v4 |
| Backend | Python 3.13 · FastAPI |
| ORM | SQLAlchemy 2.x |
| Migraciones | Alembic |
| Base de datos | PostgreSQL 17 |
| Validación | Pydantic |
| Seguridad | JWT · cookies httpOnly · Argon2 |
| Infraestructura | Docker · Docker Compose |
| CI | GitHub Actions |

## Dominios del producto

```text
Auth
Companies
Materials
Specifications
Surpluses
Needs
Matching
Valuation
Offers
Transactions
Notifications
Dashboard
```

El modelo de negocio conecta materiales con especificaciones, excedentes y necesidades; posteriormente una coincidencia puede evolucionar hacia una oferta y una transacción.

## Motor de matching

El matching inicial es determinista y explicable:

```text
Material          40%
Cantidad          20%
Ubicación         20%
Precio            10%
Especificaciones  10%
```

Cada resultado puede mostrar un desglose de puntuación, de modo que la plataforma no solamente diga **“hay compatibilidad”**, sino que pueda explicar sus componentes.

## Valorización y logística

La plataforma estima:

```text
valor bruto = cantidad × precio unitario

valor neto estimado
    = valor bruto − costo logístico
```

Esto permite analizar una oportunidad considerando no solo el precio publicado, sino también el costo estimado de llevar el material hasta el comprador.

## Estructura del repositorio

```text
restock/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   └── tests/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Ejecutar el proyecto

Requisitos:

- Docker
- Docker Compose

```bash
git clone <repo-url>
cd restock
cp .env.example .env
docker compose up --build
```

Servicios:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

Para detener:

```bash
docker compose down
```

Para eliminar también los datos de PostgreSQL:

```bash
docker compose down -v
```

## Filosofía

> **El excedente no necesariamente es desperdicio; puede ser un activo para otra empresa.**

ReStockMX busca convertir información industrial dispersa en decisiones operativas más claras, haciendo que la plataforma sea una herramienta de **inteligencia, valorización y comercialización industrial**, no solamente un catálogo de materiales.

---

## Documentación

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
