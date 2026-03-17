# web — AspireForge Frontend

The web client for AspireForge. A React 19 SPA styled with HeroUI and Tailwind CSS 4, authenticating via Keycloak and calling the .NET API.

## Tech Stack

| | Version |
|---|---|
| React + React DOM | 19 |
| TypeScript | 5.9 |
| Vite | 7 |
| HeroUI (`@heroui/react`) | 2 |
| Tailwind CSS | 4 (via `@tailwindcss/vite`, no config file needed) |
| keycloak-js | 26 |
| Framer Motion | 12 (animation dependency for HeroUI) |
| Runtime / package manager | Bun |

## Key Source Files

| File | Purpose |
|---|---|
| `src/auth/keycloak.ts` | Keycloak instance, configured from env vars |
| `src/App.tsx` | Main component: auth state, todo list, API calls, token refresh |
| `src/main.tsx` | Entry point: Keycloak initialization, HeroUI provider setup |
| `src/hero.ts` | HeroUI theme/provider configuration |

## Environment Variables

Defined in `.env` (relative to this directory):

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5236` | Backend API base URL |
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | `aspireforge` | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | `web` | Keycloak public client ID |

## Scripts

Run from this directory (`src/frontend/web`) with `bun run <script>`, or from the repo root with `bun run web:dev`:

| Script | Description |
|---|---|
| `dev` | Start Vite dev server with hot reload |
| `build` | TypeScript check + production build |
| `lint` | Run ESLint |
| `preview` | Serve the production build locally |

## Token Handling

Before every API request, the app calls `keycloak.updateToken(30)` to proactively refresh the access token if it has fewer than 30 seconds remaining. The `onTokenExpired` callback handles background refresh when the token expires between requests. If the user's session itself has expired, `updateToken` throws — the user must log out and back in.
