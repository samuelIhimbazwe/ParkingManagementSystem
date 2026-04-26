# Parking management system

Full-stack app for parking lots, spaces, reservations, live occupancy, and role-based dashboards. The backend is **ASP.NET Core** with JWT auth, **Entity Framework Core**, and **SQL Server**. Two optional UIs live under `frontend/` (React + Vite) and `client/` (React + TypeScript + Vite).

---

## Clone the repository

```bash
git clone https://github.com/mahorobonheur/parking_management_system.git
cd parking_management_system
```

Use your fork or the real remote URL if it differs.

---

## Run with Docker (recommended for a full stack)

This starts **SQL Server 2022** and the **API** in containers. The first API start applies EF Core migrations and runs seed data.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2) with **Linux containers**
- On **Apple Silicon**, SQL Server runs via `platform: linux/amd64` (emulation); the first pull/start may be slower.

### 1. Optional environment file

From the repo root, you can copy the example file and edit values (passwords, JWT secret, ports):

```bash
copy .env.example .env
```

On Linux or macOS:

```bash
cp .env.example .env
```

If you skip this step, Compose uses the defaults documented inside `.env.example`.

### 2. Start the stack

```bash
docker compose up --build
```

Wait until the API is listening (SQL Server’s first-time health check can take **30–60 seconds**). Then leave this running, or use detached mode:

```bash
docker compose up --build -d
```

### 3. Confirm the API

By default the API is published on the host at **http://localhost:5000** (mapped to port `8080` in the container). Try:

```bash
curl http://localhost:5000/
```

You should see a small JSON status payload. The OpenAPI surface is under `/api/...` (for example `GET /api/Availability/live`).

### 4. After the API runs — set up a frontend (on your machine)

The UI is **not** included in the API image. Run one of the Vite apps locally and point it at the Docker API.

**Option A — `frontend/` (React)**

```bash
cd frontend
npm install
```

Create `frontend/.env.development` (or adjust an existing env file) so the browser calls the Docker API:

```env
VITE_API_URL=http://localhost:5000
```

Then:

```bash
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**). CORS in the API already allows `localhost:5173` / `5174`.

**Option B — `client/` (TypeScript)**

```bash
cd client
npm install
npm run dev
```

Use `client/.env` / `VITE_API_PROXY_TARGET` as needed so requests reach `http://localhost:5000` (see `client/vite.config.ts`).

### 5. Sign in (seeded users)

Seeded accounts are **not** shown on the login screen. After a successful `docker compose up`, use the **defaults from `appsettings.json`** (`SeedData` section) unless you overrode them with environment variables (`SeedData__AdminEmail`, etc.).

| Role      | Default email           | Default password |
|-----------|-------------------------|------------------|
| Admin     | `admin@parking.local`   | `Admin@123`      |
| Attendant | `manager@parking.local` | `Manager@123`    |

Change these for any shared or public deployment: use environment variables or user secrets, not committed files.

### Docker troubleshooting

- **Port 5000 in use**: set `API_HOST_PORT` in `.env` (for example `5001`) and use the same base URL in `VITE_API_URL`.
- **Port 1433 in use on the host**: set `SQL_HOST_PORT` in `.env` (default is `14333`).
- **JWT errors**: ensure `JWT_SECRET` in `.env` is at least **32 characters** (see `Options/JwtOptions.cs`).
- **SQL health check fails**: confirm `/opt/mssql-tools18/bin/sqlcmd` exists in the image; on very old Docker versions, try updating Docker Desktop.

Stop the stack:

```bash
docker compose down
```

---

## Run locally without Docker

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) matching the project (**.NET 10**)
- **SQL Server** or **LocalDB**
- [Node.js](https://nodejs.org/) **20+** for the frontends

### API

1. Set `ConnectionStrings:DefaultConnection` in `appsettings.json` (or [user secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)) for your SQL instance.

2. Run:

   ```bash
   dotnet run
   ```

   Typical URLs are **http://localhost:5000** and **https://localhost:7254** (`Properties/launchSettings.json`).

3. Migrations and seeding run automatically at startup (`Program.cs`).

### Frontends

See **step 4** in the Docker section; the same `npm install` / `npm run dev` flow applies, usually with the API on `http://localhost:5000`.

---

## Configuration notes

- **JWT**: Configure the `Jwt` section in `appsettings.json` or override with environment variables (`Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`, …). Use a long, random secret outside local development.
- **Seed users**: Configure the `SeedData` section in `appsettings.json` or override with `SeedData__AdminEmail`, `SeedData__AdminPassword`, etc.

---

## Useful commands

```bash
dotnet build
dotnet ef migrations add <MigrationName>
dotnet tool restore
```

---

## Project layout

| Path            | Purpose                                      |
|-----------------|----------------------------------------------|
| `Controllers/`  | REST API                                     |
| `Data/`         | DbContext, migrations, seed, bootstrap       |
| `Models/`       | Entities, DTOs, permissions                  |
| `Services/`     | JWT, audit, webhooks, SignalR broadcast       |
| `Hubs/`         | Real-time parking events                     |
| `Migrations/`   | EF Core SQL Server migrations                |
| `frontend/`     | React dashboard (JSX)                        |
| `client/`       | React + TypeScript client                    |
| `Dockerfile`    | API image                                    |
| `docker-compose.yml` | SQL Server + API stack                  |

---

## License

No license file is included; add one if you distribute or open-source the project.
