# vacation

Ranks vacation plans for CLT and PJ workers.

- `domain/days-off.ts`: work week + holidays -> which days are worked.
- `domain/clt.ts`, `domain/pj.ts`: rules and every allowed period (candidate).
- `domain/planner.ts`: picks the best combination of candidates (dynamic programming, top-N per state).
- `application/suggest-plans.ts`: the only entry point for the UI; validates input, takes and returns ISO dates.

Measured (12-month window, best of 3, Node 24): CLT 30 days / 3 periods 88 ms; PJ 20 days / 3 periods 122 ms; PJ 30 days / 5 periods 448 ms. Run it off the main thread in the UI.

Glossary and rules: [docs/business/glossary.md](../../../../../docs/business/glossary.md), [docs/business/clt-vacation.md](../../../../../docs/business/clt-vacation.md).
