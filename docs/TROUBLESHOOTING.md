# Troubleshooting

## Keycloak realm not imported
- Ensure docker/keycloak/realm-export.json exists
- Recreate container:
    - docker compose down
    - docker compose up -d

## 401 from API
- Confirm token audience is `api`
- Confirm API config:
    - Authority: http://localhost:8080/realms/yourapp
    - Audience: api

## CORS errors
- Verify API appsettings.json allows http://localhost:5173
- Ensure API uses `UseCors("default")` before endpoints
