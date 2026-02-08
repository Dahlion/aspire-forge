
### `docs/ARCHITECTURE.md`
```md
# Architecture

## Components
- Keycloak: identity provider (OIDC)
- API (.NET): validates JWTs from Keycloak, exposes protected endpoints
- PostgreSQL: relational storage via EF Core
- Redis: caching / ephemeral data
- Web (React): uses keycloak-js to authenticate and call the API

## Auth flow
1. Web redirects to Keycloak for login
2. Web gets access token (JWT)
3. Web calls API with `Authorization: Bearer <token>`
4. API validates issuer (realm) and audience (`api`)
