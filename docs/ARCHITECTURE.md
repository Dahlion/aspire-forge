# Architecture

AspireForge is a monorepo containing a .NET Aspire-orchestrated backend, a React SPA frontend, and a Podman Compose infrastructure layer. It demonstrates OIDC-based authentication, EF Core data access, and Aspire service composition in a local development environment.

## Component Map

| Component | Technology | Port | Notes |
|---|---|---|---|
| `aspireforge-postgres` | PostgreSQL 16 | 5432 | Persistent via named volume `pgdata` |
| `aspireforge-redis` | Redis 7 | 6379 | Registered in API — not yet used by any endpoint; reserved for future caching |
| `aspireforge-keycloak` | Keycloak 26.0 | 8080 | Auto-imports realm from `docker/keycloak/realm-export.json`; depends on postgres healthy |
| `AspireForge.AppHost` | .NET Aspire | — | Orchestration host; references ApiService and exposes HTTP endpoints |
| `AspireForge.ApiService` | ASP.NET Core minimal API | 5236 | JWT validation, EF Core queries, CORS |
| `AspireForge.ServiceDefaults` | Shared library | — | OpenTelemetry (traces + metrics), health checks (`/health`, `/alive`), HTTP resilience |
| `web` | React 19, Vite 7 | 5173 | SPA; authenticates via keycloak-js, calls API with Bearer token |

## Authentication Flow

1. On app load, `keycloak-js` is initialized using the env vars `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM` (`aspireforge`), and `VITE_KEYCLOAK_CLIENT_ID` (`web`)
2. User clicks "Log in" — keycloak-js redirects to Keycloak's authorization endpoint
3. Keycloak authenticates the user and issues a JWT access token with the `api` audience claim
4. Before each API call, `keycloak.updateToken(30)` proactively refreshes the token if it has fewer than 30 seconds remaining
5. The JWT is attached as `Authorization: Bearer <token>` on every protected request
6. The API validates the token: issuer must be `http://localhost:8080/realms/aspireforge`, audience must include `api`
7. On session expiry, the `onTokenExpired` callback triggers a background refresh

## Keycloak Realm

- **Realm**: `aspireforge`
- **Clients**:
  - `web` — public client (no secret), used by the React SPA for interactive login
  - `api` — bearer-only client, used as the required audience claim the API validates
- **Default user**: `dev` / `dev`
- **Audience mapper**: the `api-audience` client scope adds `api` to the access token's `aud` claim

## Data Model

Single entity managed by EF Core (one migration: `20260208191544_InitialTodos`):

```csharp
public class TodoItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/hello` | Public | Smoke check — returns `{ message: "Hello from API" }` |
| GET | `/api/me` | Bearer | Returns authenticated user's name and all JWT claims |
| GET | `/api/todos` | Bearer | Returns all todos ordered by Id descending |
| POST | `/api/todos` | Bearer | Creates a todo; returns 201 with the created item |
| GET | `/health` | Public | Aspire health check endpoint |
| GET | `/alive` | Public | Aspire liveness endpoint |

> No update or delete endpoints exist yet.

## CORS

The API allows all methods and headers from `http://localhost:5173` with credentials. This is configured in `appsettings.json` under `Cors:AllowedOrigins` and applied via `app.UseCors("default")` before any endpoint mapping.

## Infrastructure Dependencies

Keycloak's `depends_on` in `docker-compose.yml` uses `condition: service_healthy` on postgres, ensuring the database is ready before Keycloak starts. Keycloak itself exposes a health check that the compose orchestrator waits on before marking it healthy.
