# Booking Platform API

A **Booking Platform REST API** that lets authenticated users manage services and
lets customers create bookings. Built with **NestJS**, **TypeScript**,
**PostgreSQL** and **TypeORM**.

> Built for the EN2H "Software Engineer Intern (NestJS)" technical assignment.
> Services are seeded with a beauty-salon catalogue 


---

## Project Overview

The API is split into feature modules following NestJS best practices:

```
src/
├── auth/           # JWT authentication (register, login, refresh, logout)
├── users/          # User entity + repository access
├── services/       # Service CRUD (protected)
├── bookings/       # Booking lifecycle + business rules
├── common/         # Shared DTOs, filters, transformers
├── config/         # TypeORM configuration factory
└── database/
    ├── data-source.ts   # Standalone DataSource for the CLI
    ├── migrations/      # TypeORM migration files
    └── seeds/           # Seed script (admin user + salon services)
```

### Key features

- **JWT authentication** with access + refresh tokens (refresh tokens are hashed at rest).
- **Service management** (create / update / delete / list / get) — protected by JWT.
- **Booking management** with a status enum and enforced business rules.
- **Validation** via `class-validator` and a global `ValidationPipe`.
- **Global exception handling** with a consistent error envelope.
- **Pagination, search and filtering** on services and bookings.
- **Swagger** documentation and a **Postman** collection.
- **Docker** support (`Dockerfile` + `docker-compose.yml`).
- **Database migrations** and a **seed** script.
- **Unit tests** for the core business logic.

---

## Tech Stack

| Concern        | Choice                     |
| -------------- | -------------------------- |
| Framework      | NestJS 11                  |
| Language       | TypeScript                 |
| Database       | PostgreSQL                 |
| ORM            | TypeORM                    |
| Auth           | Passport + JWT + bcrypt    |
| Validation     | class-validator / class-transformer |
| Docs           | Swagger (OpenAPI) + Postman |

---

## Installation Steps

Requirements: **Node.js 20+**, **npm**, and **PostgreSQL 14+** (or Docker).

```bash
git clone <your-repo-url>
cd booking-platform-api
npm install
cp .env.example .env   # then adjust values as needed
```

---

## Environment Variables

Copy `.env.example` to `.env`. All variables:

| Variable                 | Description                                        | Example              |
| ------------------------ | -------------------------------------------------- | -------------------- |
| `NODE_ENV`               | Runtime environment                                | `development`        |
| `PORT`                   | HTTP port                                          | `3000`               |
| `DB_HOST`                | PostgreSQL host                                    | `localhost`          |
| `DB_PORT`                | PostgreSQL port                                    | `5432`               |
| `DB_USERNAME`            | PostgreSQL user                                    | `postgres`           |
| `DB_PASSWORD`            | PostgreSQL password                                | `postgres`           |
| `DB_NAME`                | Database name                                      | `booking_platform`   |
| `DB_AUTO_MIGRATE`        | Run migrations automatically on startup (`true`/`false`) | `true`         |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens                   | `change_me`          |
| `JWT_ACCESS_EXPIRES_IN`  | Access token TTL                                   | `15m`                |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens                  | `change_me`          |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL                                  | `7d`                 |

---

## Database Setup

### Option A — Docker (quickest)

Spin up PostgreSQL **and** the API together:

```bash
docker compose up --build
```

The API container runs migrations automatically (`DB_AUTO_MIGRATE=true`) and
listens on `http://localhost:3000`.

To run **only** PostgreSQL in Docker and the API locally:

```bash
docker run -d --name booking-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booking_platform -p 5432:5432 postgres:16-alpine
```

### Option B — Local PostgreSQL

Create the database:

```sql
CREATE DATABASE booking_platform;
```

---

## Running Migrations

Migrations live in `src/database/migrations`.

```bash
npm run migration:run        # apply all pending migrations
npm run migration:revert     # revert the last migration
npm run migration:generate   # generate a migration from entity changes
```

> When `DB_AUTO_MIGRATE=true`, migrations also run automatically on app startup.

### Seed sample data

Seeds an admin user and a catalogue of salon services:

```bash
npm run seed
```

Seeded admin credentials: **`admin@romandbeauty.com` / `Admin@1234`**

---

## Running the Application

```bash
npm run start:dev     # watch mode
npm run start         # normal
npm run build && npm run start:prod   # production build
```

Once running:

- API base URL: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`
- Health check: `http://localhost:3000/api/health`

### Running tests & lint

```bash
npm test          # unit tests
npm run test:cov  # coverage
npm run lint      # eslint
```

---

## API Documentation

Interactive Swagger docs are available at **`/docs`** while the app runs.
A **Postman collection** is included at
[`docs/booking-platform.postman_collection.json`](docs/booking-platform.postman_collection.json)
— import it, set the `baseUrl` variable, and the Login/Register requests will
automatically store the access & refresh tokens.

All routes are prefixed with `/api`.

### Auth

| Method | Endpoint             | Auth | Description                     |
| ------ | -------------------- | ---- | ------------------------------- |
| POST   | `/api/auth/register` | —    | Register and receive tokens     |
| POST   | `/api/auth/login`    | —    | Login and receive tokens        |
| POST   | `/api/auth/refresh`  | —    | Exchange a refresh token        |
| POST   | `/api/auth/logout`   | JWT  | Invalidate the refresh token    |

### Services (JWT required for write operations)

| Method | Endpoint            | Auth | Description                         |
| ------ | ------------------- | ---- | ----------------------------------- |
| POST   | `/api/services`     | JWT  | Create a service                    |
| GET    | `/api/services`     | —    | List services (pagination/search/filter) |
| GET    | `/api/services/:id` | —    | Get a service by id                 |
| PATCH  | `/api/services/:id` | JWT  | Update a service                    |
| DELETE | `/api/services/:id` | JWT  | Delete a service                    |

`GET /api/services` query params: `page`, `limit`, `search`, `isActive`.

### Bookings

| Method | Endpoint                    | Auth | Description                        |
| ------ | --------------------------- | ---- | ---------------------------------- |
| POST   | `/api/bookings`             | —    | Create a booking (public)          |
| GET    | `/api/bookings`             | JWT  | List bookings (pagination/search/filter) |
| GET    | `/api/bookings/:id`         | JWT  | Get a booking by id                |
| PATCH  | `/api/bookings/:id/status`  | JWT  | Update booking status              |
| PATCH  | `/api/bookings/:id/cancel`  | JWT  | Cancel a booking                   |

`GET /api/bookings` query params: `page`, `limit`, `search`, `status`, `serviceId`.

### Data models

**Service**: `title`, `description`, `duration` (minutes), `price`, `isActive`.

**Booking**: `customerName`, `customerEmail`, `customerPhone`, `serviceId`,
`bookingDate`, `bookingTime`, `status`, `notes`.

**Booking status enum**: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

### Business rules enforced

- A booking must reference an **existing** service.
- Booking date/time **cannot be in the past**.
- A **cancelled** booking cannot be marked **completed**.
- A **completed** booking cannot be cancelled.
- Only **authenticated** users can manage services.
- **Customers can create bookings without authentication.**
- **Duplicate** bookings for the same service + date + time are rejected
  (enforced both in the service layer and by a unique DB index).

### Example: create a booking

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "customerPhone": "+94771234567",
    "serviceId": "<service-uuid>",
    "bookingDate": "2030-01-15",
    "bookingTime": "14:30",
    "notes": "Please prepare a quiet room."
  }'
```

---

## Assumptions Made

- **Reading services** (`GET /services`, `GET /services/:id`) is public so that
  customers can browse the catalogue before booking; **writes** require JWT.
- Creating a booking is **public** (per the requirements), but **managing**
  bookings (list, get, update status, cancel) requires authentication, since
  these are staff/admin operations.
- Bookings can only be made against **active** services (`isActive = true`).
- `duration` is expressed in **minutes**; `price` is a decimal with 2 places.
- `bookingDate` uses `YYYY-MM-DD` and `bookingTime` uses 24h `HH:mm`.
- A user account represents a staff/admin member; there is no separate
  role system (all authenticated users have the same permissions).

## Future Improvements

- Role-based access control (admin vs. staff) and per-owner service scoping.
- Availability/slot management based on service `duration` and opening hours.
- Email/SMS notifications on booking creation and status changes.
- Rate limiting on the public booking endpoint to prevent abuse.
- More comprehensive e2e test coverage and CI pipeline.
- Soft-deletes and audit logging for services and bookings.
