# AspireForge

## What’s included
- Infra: PostgreSQL, Redis, Keycloak (Docker Compose)
- Backend: .NET 10 + Aspire AppHost + API Service
- Frontend: React + TypeScript + Bun + Keycloak
- CI: PR validation + main deployment workflow skeleton

## Prereqs
- Docker Desktop
- .NET SDK 10
- Bun
- Rider (recommended)

## Quickstart (local)
1) Start infra
```bash
cd infra
cp .env.template .env
docker compose --env-file .env up -d
