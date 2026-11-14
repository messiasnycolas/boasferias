# Technical

Angular app in `apps/web`, prerendered at build time to static HTML and served by Firebase Hosting. No API or database yet.

## Run

```sh
docker compose up        # http://localhost:4200, hot reload
```

Without Docker: `cd apps/web && npm ci && npm start` (Node version in `apps/web/.nvmrc`).

## Test and check

From `apps/web`:

| Command | What |
|---|---|
| `npm test` | Unit tests; coverage must be >= 95% on `domain/` and `application/` folders |
| `npm run lint` | ESLint (angular-eslint) |
| `npm run format:check` | Prettier (`npm run format` fixes) |
| `npm run build` | Prerendered output in `dist/web/browser` |
| `npx @lhci/cli@0.16.1 autorun` | Lighthouse budgets from `lighthouserc.json` (needs Chrome; runs in CI) |

## Deploy

Push to `main` touching `apps/web/**` or `firebase.json` runs `.github/workflows/web.yml`: the gate above plus `npm audit`, then deploys to Firebase Hosting. To rerun without a commit: Actions > web > Run workflow on `main`. No credentials in the repo: GitHub Actions gets a short-lived token through Workload Identity Federation.

Rollback: revert the commit, or roll back the release in the Firebase console (Hosting > Release history).

### One-time setup

1. Create a Firebase project (Spark plan).
2. In Google Cloud Shell, run `deploy/setup-gcp.sh <project-id>`.
3. Run the three `gh variable set` commands it prints.
