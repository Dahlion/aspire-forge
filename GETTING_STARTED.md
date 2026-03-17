# AspireForge - Getting Started Guide

This guide will walk you through setting up and running the AspireForge application locally.

## Prerequisites

Ensure you have the following installed:
- **Docker Desktop** - Required to run PostgreSQL, Redis, and Keycloak
- **Bun** - JavaScript/TypeScript package manager and runtime
- **.NET 10** - Required for the backend API
- **Node.js** (optional) - Some tools may require it, but Bun is the primary runtime

## Quick Start

From the root directory of the project:

```bash
# 1. Start the full development stack (all-in-one)
bun run dev
```

This command uses `concurrently` to start:
- **INFRA**: Docker containers (PostgreSQL, Redis, Keycloak)
- **BACKEND**: .NET API service
- **WEB**: Vite development server for the React frontend

Wait for all services to be healthy before accessing the application.

## Detailed Setup (Manual Steps)

If you prefer to set up components individually or troubleshoot:

### 1. Install Frontend Dependencies

```bash
cd src/frontend/web
bun install
cd ../../../
```

### 2. Start Infrastructure

```bash
# Start docker containers
bun run infra:up

# Or stop them with:
bun run infra:down
```

This starts:
- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache (port 6379)
- **Keycloak** - Authentication server (port 8080)

### 3. Run Database Migrations

```bash
dotnet ef database update --project src/backend/AspireForge.ApiService
```

This applies Entity Framework migrations to initialize the database schema.

### 4. Start the Backend

```bash
bun run backend:dev
```

The API will be available at `http://localhost:5236`

### 5. Start the Frontend

```bash
bun run web:dev
```

The frontend will be available at `http://localhost:5173`

## Accessing the Application

### Frontend
- **URL**: http://localhost:5173
- **Purpose**: React-based web application for managing todos
- **Authentication**: Uses Keycloak (see below)

### Backend API
- **URL**: http://localhost:5236
- **Purpose**: .NET 10 API service
- **Authentication**: Bearer token from Keycloak
- **Docs**: Check `src/backend/AspireForge.ApiService/AspireForge.ApiService.http` for example requests

### Keycloak Admin Console
- **URL**: http://localhost:8080
- **Admin Username**: `admin`
- **Admin Password**: `admin`
- **Purpose**: Manage authentication, realms, users, and client scopes

## Authentication

### Default User Credentials
- **Username**: `dev`
- **Password**: `dev`
- **Realm**: `aspireforge`

Log in to the frontend using these credentials. Keycloak will issue a JWT token that includes the required `api` audience scope, allowing API calls to succeed.

### How Authentication Works

1. **Frontend** initiates login via Keycloak OAuth2/OpenID Connect
2. **Keycloak** authenticates the user and issues a JWT token
3. **Frontend** includes the JWT token in the `Authorization: Bearer <token>` header for API requests
4. **Backend API** validates the token and checks for the `api` audience claim
5. **Requests proceed** if the token is valid

## Troubleshooting

### Docker Connection Error
**Error**: `error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`

**Solution**: Start Docker Desktop. The application requires Docker to run the infrastructure services (Keycloak, PostgreSQL, Redis).

### 401 Unauthorized Errors
**Error**: `POST http://localhost:5236/api/todos 401 (Unauthorized)`

**Cause**: The JWT token is missing the required `api` audience scope.

**Solution**: 
1. Ensure the infrastructure has been restarted with the updated Keycloak realm
2. Stop and restart: `bun run infra:down` then `bun run infra:up`
3. Log out and log back in to get a fresh token with the correct audience

### Missing Dependencies
**Error**: `bun: command not found: vite` or similar

**Solution**: Install frontend dependencies:
```bash
cd src/frontend/web
bun install
cd ../../../
```

### Database Connection Issues
**Error**: Failed to connect to PostgreSQL

**Solution**: 
1. Ensure Docker containers are running: `bun run infra:up`
2. Check that PostgreSQL is healthy in Docker: `docker ps`
3. Run migrations: `dotnet ef database update --project src/backend/AspireForge.ApiService`

## Project Structure

```
aspire-forge/
├── src/
│   ├── backend/              # .NET 10 API service
│   │   ├── AspireForge.ApiService/
│   │   ├── AspireForge.AppHost/
│   │   └── AspireForge.ServiceDefaults/
│   └── frontend/
│       └── web/              # React + Vite frontend app
├── infra/                    # Infrastructure config (Docker, .env)
├── docker/                   # Docker build contexts and configs
│   └── keycloak/             # Keycloak realm export
├── docs/                     # Documentation
└── package.json              # Root scripts
```

## Available Commands

From the root directory:

```bash
# Run everything
bun run dev

# Infrastructure only
bun run infra:up
bun run infra:down

# Backend only
bun run backend:dev

# Frontend only
bun run web:dev

# Web app scripts (from src/frontend/web)
bun run build    # Production build
bun run lint     # Run ESLint
bun run preview  # Preview production build
```

## Environment Configuration

### Frontend (.env)
Located in `src/frontend/web/.env`:
```
VITE_API_BASE_URL=http://localhost:5236
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=aspireforge
VITE_KEYCLOAK_CLIENT_ID=web
```

### Backend (appsettings.json)
Located in `src/backend/AspireForge.ApiService/appsettings.json`:
```json
{
  "Auth": {
    "Authority": "http://localhost:8080/realms/aspireforge",
    "Audience": "api"
  },
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Port=5432;Database=appdb;Username=appuser;Password=apppassword",
    "Redis": "localhost:6379"
  }
}
```

### Infrastructure (.env)
Located in `infra/.env`:
```
POSTGRES_DB=appdb
POSTGRES_USER=appuser
POSTGRES_PASSWORD=apppassword
POSTGRES_PORT=5432

REDIS_PORT=6379

KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_PORT=8080
```

## Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **Database Migrations**: If you modify the data model, create a new migration with `dotnet ef migrations add <MigrationName> --project src/backend/AspireForge.ApiService`
- **Keycloak Realm Changes**: If you modify `docker/keycloak/realm-export.json`, restart the infrastructure for changes to take effect
- **View Logs**: Run `bun run dev` to see logs from all services simultaneously, or run them individually in separate terminals

## Next Steps

1. Start the application with `bun run dev`
2. Open http://localhost:5173 in your browser
3. Log in with `dev` / `dev`
4. Try creating a todo to test the full authentication and API flow
5. Explore the Keycloak admin console to understand the realm and client configuration

For more details, see the documentation in the `docs/` directory.
