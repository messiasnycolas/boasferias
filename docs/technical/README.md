# Technical

Angular app in `apps/web`, prerendered at build time to static HTML and served by Firebase Hosting. No API or database yet.

## Run

| Command       | What                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| `make setup`  | Once: Node from `apps/web/.nvmrc` (via nvm), `npm ci`, the Playwright image, the git hooks |
| `make run`    | Dev server with hot reload on http://localhost:4200 (Docker)                               |
| `make check`  | Fast loop: format, lint, unit tests                                                        |
| `make verify` | The full deploy gate: also `npm audit`, build, e2e, Lighthouse. Runs before every push     |

`make check` and `make verify` print one line per step; a failing step prints the tail of its log, kept in `apps/web/tmp/verify/<step>.log`. CI runs the same `make verify`.

| Step         | What                                                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`     | Prettier (`npm run format` in `apps/web` fixes)                                                                                                                 |
| `lint`       | ESLint (angular-eslint)                                                                                                                                         |
| `unit`       | Unit tests; coverage must be >= 95% on `domain/` and `application/` folders                                                                                     |
| `audit`      | `npm audit` of production dependencies, high severity and up; dev-tool advisories come through Dependabot                                                       |
| `build`      | Prerendered output in `dist/web/browser`                                                                                                                        |
| `e2e`        | Playwright + axe on the built page; main journey, states, 320 and 360 px, 44 px targets; layout rules (no sideways scroll, cut-off text or overlap) at 5 widths |
| `lighthouse` | Budgets from `lighthouserc.json`                                                                                                                                |

Locally, `e2e` and `lighthouse` run in Playwright's Docker image (WSL lacks Chrome's system libraries); CI installs Chromium natively. The pre-push gate runs only when the pushed commits touch what CI gates, and checks the working tree, so commit or stash other work first; skip it once with `git push --no-verify`.

City holidays live in `apps/web/public/holidays/<uf>.json`, generated from the pinned open dataset (ADR 0002): `npm run holidays:cities` (needs network) rewrites them; commit the result. The page fetches a state's file only when that state is chosen.

Search and AI tools read the prerendered HTML. `index.html` holds the defaults and the WebApplication JSON-LD; each page fills its own title, description, link preview and canonical URL with `setPageMeta` (`src/app/site/ui/page-meta.ts`), and adds FAQPage JSON-LD built from the same questions it shows. The home title names this year and the next (`homeTitle`), so it moves on the first deploy of a new year. Reading pages live in `src/app/site/` (guides, about, privacy, contact; one route each in `app.routes.ts`). A new page also goes in `public/sitemap.xml` and `public/llms.txt` (an e2e test checks both). `robots.txt` allows every crawler. Update "Atualizado em" (`FAQ_UPDATED`, `GUIDES_UPDATED`, `PRIVACY_UPDATED`) when a text or the law changes.

The planner runs in a Web Worker (`src/app/vacation/ui/planner.worker.ts`); the UI calls only `vacation/application`. Plans are computed in the background from page load (the holiday list needs them) but shown only after the first "Ver melhores datas" click; after that they update live as the form changes.

## Deploy

Push to `main` touching `apps/web/**`, `firebase.json`, `Makefile` or `scripts/**` runs `.github/workflows/web.yml`: `make verify`, then deploys to Firebase Hosting. Deploy runs only on pushes to `main`, never on pull requests. No credentials in the repo: GitHub Actions gets a short-lived token through Workload Identity Federation.

Rollback: revert the commit, or roll back the release in the Firebase console (Hosting > Release history).

### One-time setup

1. Create a Firebase project (Spark plan).
2. In Google Cloud Shell, run `deploy/setup-gcp.sh <project-id>`.
3. Run the three `gh variable set` commands it prints.
