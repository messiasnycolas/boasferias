# vacation

Ranks vacation plans for CLT and PJ workers.

- `domain/days-off.ts`: work week + holidays -> which days are worked.
- `domain/clt.ts`, `domain/pj.ts`: rules and every allowed period (candidate).
- `domain/planner.ts`: picks the best combination of candidates (dynamic programming, top-N per state).
- `application/`: what the UI calls: `suggest-plans.ts` (validates, ranks, ISO dates in and out), `defaults.ts`, `plan-calendar.ts` (month grids of a plan).
- `ui/`: the page, the calendar view and the Web Worker that runs the planner.

Share image (`ui/share-image.ts`, loaded on the first "Compartilhar" click): draws the plan's numbers on `public/share/fundo.jpg`, a fixed 1080x1350 background (the site's card over a beach photo, [Pexels 30793026](https://www.pexels.com/photo/tropical-beach-with-palm-tree-under-blue-sky-30793026/), Pexels license: commercial use, no credit required). The stacked lines use Big Shoulders Display 900 (SIL OFL, `public/share/`), each line scaled to the same width; the rest is Figtree. Changing the card means re-rendering the background.

The page asks for 3 plans by default and 5 more per "Calcular mais" click, up to 20 (`MAX_LIMIT`).

Measured (12-month window, best of 3, Node 24, 10 → 20 plans): CLT 30 days / 3 periods 37 → 56 ms; PJ 20 days / 3 periods 28 → 59 ms; PJ 30 days / 5 periods 115 → 265 ms; PJ 30 days / 10 periods 217 → 501 ms.

Glossary and rules: [docs/business/glossary.md](../../../../../docs/business/glossary.md), [docs/business/clt-vacation.md](../../../../../docs/business/clt-vacation.md).
