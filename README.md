# AspireForge

A full-stack reference application demonstrating cloud-native patterns: .NET 10 + Aspire, React 19, JWT auth via Keycloak, and PostgreSQL — all orchestrated locally with Podman.

## What's Included

| Layer | Technology |
|---|---|
| Backend framework | .NET 10, ASP.NET Core minimal API |
| Orchestration | .NET Aspire |
| Database | PostgreSQL 16 (EF Core, Code-First migrations) |
| Cache | Redis 7 (infrastructure only, reserved for future use) |
| Auth server | Keycloak 26.0 (OIDC/OAuth2) |
| Frontend | React 19, Vite 7, TypeScript 5.9 |
| UI components | HeroUI 2, Tailwind CSS 4 |
| Auth client | keycloak-js 26 |
| Runtime | Bun |
| Infra | Podman Compose |

## Prerequisites

- [Podman](https://podman.io/) with the `podman compose` plugin
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Bun](https://bun.sh/)

## Quick Start

```bash
# Install frontend dependencies (first time only)
cd src/frontend/web && bun install && cd ../../..

# Start everything: Podman infra + .NET Aspire backend + Vite frontend
bun run dev
```

## Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:5236 |
| Swagger | http://localhost:5236/swagger |
| Keycloak admin | http://localhost:8080 |

## Default Credentials

| | Username | Password |
|---|---|---|
| App login | `dev` | `dev` |
| Keycloak admin | `admin` | `admin` |

## Docs

- [Getting Started](docs/GETTING_STARTED.md) — full setup walkthrough, manual steps, environment config
- [Architecture](docs/ARCHITECTURE.md) — system design, auth flow, API reference, data model
- [Troubleshooting](docs/TROUBLESHOOTING.md) — common errors and fixes
