# vacation

Ranks vacation plans for CLT and PJ workers.

- `domain/days-off.ts`: work week + holidays -> which days are worked.
- `domain/clt.ts`, `domain/pj.ts`: rules and every allowed period (candidate).
- `domain/planner.ts`: picks the best combination of candidates (dynamic programming, top-N per state).
- `application/`: what the UI calls: `suggest-plans.ts` (validates, ranks, ISO dates in and out), `defaults.ts`, `plan-calendar.ts` (month grids of a plan).
- `ui/`: the page, the calendar view and the Web Worker that runs the planner.

Measured (12-month window, best of 3, Node 24): CLT 30 days / 3 periods 88 ms; PJ 20 days / 3 periods 122 ms; PJ 30 days / 5 periods 448 ms.

Glossary and rules: [docs/business/glossary.md](../../../../../docs/business/glossary.md), [docs/business/clt-vacation.md](../../../../../docs/business/clt-vacation.md).
