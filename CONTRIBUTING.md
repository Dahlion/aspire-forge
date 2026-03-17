# Contributing

## Development Setup

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the full local setup walkthrough.

## Project Structure

```
aspire-forge/
├── src/
│   ├── backend/
│   │   ├── AspireForge.ApiService/       # Minimal API, EF Core, JWT auth, CORS
│   │   ├── AspireForge.AppHost/          # .NET Aspire orchestration entry point
│   │   └── AspireForge.ServiceDefaults/  # Shared OpenTelemetry, health checks, resilience
│   └── frontend/
│       ├── web/                          # React 19 + Vite app (active)
│       ├── mobile/                       # Placeholder, not yet developed
│       └── shared/                       # Placeholder for shared types/logic
├── infra/                                # Podman Compose config + .env template
├── docker/
│   └── keycloak/                         # realm-export.json (auto-imported on container start)
├── docs/                                 # Project documentation
└── package.json                          # Root Bun scripts
```

## Adding a Backend Endpoint

All endpoints are defined in [src/backend/AspireForge.ApiService/Program.cs](src/backend/AspireForge.ApiService/Program.cs).

```csharp
// Public endpoint
app.MapGet("/api/example", () => Results.Ok(new { message = "hello" }));

// Protected endpoint (requires valid JWT with "api" audience)
app.MapGet("/api/example", () => Results.Ok(...)).RequireAuthorization();
```

## Database Migrations

Migrations target the PostgreSQL container — ensure infra is running (`bun run infra:up`) before applying.

```bash
# Create a new migration after changing a model
dotnet ef migrations add <MigrationName> --project src/backend/AspireForge.ApiService

# Apply pending migrations
dotnet ef database update --project src/backend/AspireForge.ApiService
```

## Frontend Development

```bash
# From repo root
bun run web:dev

# Or from the web package directory
cd src/frontend/web && bun run dev
```

The frontend uses **HeroUI 2** for components and **Tailwind CSS 4** (via the `@tailwindcss/vite` plugin — no separate config file needed).

## Keycloak Realm Changes

The realm is defined in [docker/keycloak/realm-export.json](docker/keycloak/realm-export.json). Keycloak imports it automatically on first start (when the realm doesn't already exist).

To apply changes:
1. Edit `docker/keycloak/realm-export.json`
2. Restart the infra: `bun run infra:down && bun run infra:up`
3. Log out and back in to get a fresh token

## Code Style

- **Frontend**: ESLint — run `bun run lint` from `src/frontend/web`
- **Backend**: Standard .NET conventions; no formatter is enforced currently
