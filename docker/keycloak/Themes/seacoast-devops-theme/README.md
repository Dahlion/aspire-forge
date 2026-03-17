# Seacoast DevOps Keycloak theme

Location
- docker/keycloak/Themes/seacoast-devops-theme

Purpose
- Provides a custom Keycloak `login` theme (templates, CSS, resources, messages).

How to enable
1. Ensure the `infra/docker-compose.yml` mounts the themes folder (it now includes `../docker/keycloak/Themes:/opt/keycloak/themes:ro`).
2. Confirm the realm export (`docker/keycloak/realm-export.json`) includes the theme fields. Example fields were added:
   - `loginTheme`, `accountTheme`, `adminTheme`, `emailTheme` set to `seacoast-devops-theme`.
3. Restart the infra so Keycloak picks up the mounted theme and re-imports the realm.

Commands (from repo root `src`):

```bash
# stop infra (if running)
bun run infra:down

# start infra (Keycloak will mount themes on startup)
bun run infra:up
```

Notes
- Theme folder name must match the name used in the realm export (`seacoast-devops-theme`).
- Keycloak v26 expects themes under `/opt/keycloak/themes` inside the container.
- If Keycloak is already running, remove the Keycloak container before restarting so the new volume is attached.
