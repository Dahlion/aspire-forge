# Troubleshooting

## Keycloak realm not imported

**Symptom**: Login redirects to Keycloak but the `aspireforge` realm doesn't exist.

**Cause**: The realm import only happens when the realm doesn't already exist. If the container started before `realm-export.json` was in place, or the file is missing, the realm won't be present.

**Fix**:
1. Verify `docker/keycloak/realm-export.json` exists
2. Recreate the infra: `bun run infra:down && bun run infra:up`

> Note: Keycloak skips the import if the realm already exists. If you edited `realm-export.json` and need changes applied, you must destroy and recreate the container.

---

## 401 Unauthorized from API

**Cause 1**: JWT is missing the `api` audience claim.

**Fix**: The realm's `api-audience` client scope adds the claim. Recreate infra (`bun run infra:down && bun run infra:up`), then log out and back in for a fresh token.

**Cause 2**: API `Auth:Authority` is misconfigured.

**Fix**: Confirm `src/backend/AspireForge.ApiService/appsettings.json` has:
```json
"Auth": {
  "Authority": "http://localhost:8080/realms/aspireforge",
  "Audience": "api"
}
```

**Cause 3**: Token has expired and the refresh silently failed.

**Fix**: Log out and log back in to establish a new session.

---

## CORS errors

**Symptom**: Browser console shows a CORS policy error on API requests.

**Fix**: Confirm `appsettings.json` includes:
```json
"Cors": {
  "AllowedOrigins": ["http://localhost:5173"]
}
```

The policy name is `"default"` and is applied via `app.UseCors("default")` in `Program.cs` before any endpoint mapping.

---

## Frontend not starting / `bun: command not found: vite`

**Cause**: Frontend dependencies haven't been installed.

**Fix**:
```bash
cd src/frontend/web && bun install
```

---

## Database connection failure

**Symptom**: API throws an error connecting to PostgreSQL on startup or on first request.

**Fix**:
1. Ensure Podman containers are running: `bun run infra:up`
2. Wait for `aspireforge-postgres` to be healthy: `podman ps`
3. Apply migrations: `dotnet ef database update --project src/backend/AspireForge.ApiService`

---

## Podman not found / `podman compose` not found

**Cause**: Podman or the compose plugin is not installed.

**Fix**: Install [Podman Desktop](https://podman-desktop.io/) (includes both) or the Podman CLI with the `podman-compose` plugin for your OS.

---

## Keycloak startup is slow

**Cause**: Expected. Keycloak depends on PostgreSQL being healthy before it starts. The compose healthcheck retries up to 30 times at 5-second intervals — up to ~2.5 minutes on first start or after volume deletion.

**Fix**: Wait. Check progress with `podman ps`.

---

## Token not refreshing silently

**Cause**: `keycloak.updateToken(30)` is called before every API request. If the user's session is truly expired (not just the access token), this call throws and the request is blocked.

**Fix**: Log out and log back in to establish a fresh session.
