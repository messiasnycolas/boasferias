# Vacation rules

What the calculator assumes, with sources. Verified 2026-11-14.

## CLT (Decreto-lei 5.452/1943)

| Rule                                                                                                                                          | Source                            |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 30 calendar days per 12 months; 24/18/12 with 6-14/15-23/24-32 unjustified absences (user enters the days available, minimum 5 after selling) | art. 130                          |
| Up to 3 periods; one >= 14 days, the others >= 5                                                                                              | art. 134 §1                       |
| No start in the 2 days before a holiday or the weekly paid rest day                                                                           | art. 134 §3                       |
| Written notice >= 30 days before the start                                                                                                    | art. 135                          |
| Employer chooses the dates: results are suggestions to negotiate                                                                              | art. 136                          |
| Sell 1/3 for cash (abono pecuniário); request up to 15 days before the acquisition period ends (not checked)                                  | art. 143                          |
| Every vacation day inside the concession period; days after it are paid double                                                                | art. 134, art. 137, TST Súmula 81 |

Days are calendar days: weekends and holidays inside a period count as vacation.

## Holidays

- National: 01-01, 04-21, 05-01, 09-07, 11-02, 11-15, 12-25 (Lei 662/1949, amended by Lei 10.607/2002); 10-12 (Lei 6.802/1980); 11-20 from 2024 (Lei 14.759/2023).
- Good Friday: religious holiday set by city law (Lei 9.093/1995, art. 2); a holiday in all target capitals.
- Corpus Christi: city or state holiday in SP, RJ, BH, Porto Alegre, Curitiba and Florianópolis; not in Recife.
- Carnaval: optional day off (ponto facultativo) everywhere except Tuesday in RJ (state law).
- State holidays: per state, with sources, in [holidays.md](holidays.md).

## Product decisions

- Target users: Rio, São Paulo, Belo Horizonte, Recife, Porto Alegre, Curitiba, Florianópolis.
- Default holidays: national + Good Friday + Corpus Christi, plus the state's once one is chosen ("Estado") and the city's once one is chosen ("Cidade", which also decides Corpus Christi); both remembered on the device. Users can remove any and add missing ones ("Adicionar feriado"): added days are holidays, so they block CLT starts in the 2 days before them and vacation may cover them.
- Days already scheduled ("Dias já marcados": licença paternidade or maternidade, dispensa por luto, days off agreed with the company): 1 to 10 entries, a day or a range each. They are leave, not holidays: CLT vacation may touch them on either side but never cover them (inside a PJ period they are free, like holidays), they join the block of days off, and they do not block CLT starts (art. 134 §3 names only holidays and the weekly rest).
- Banco de horas to place ("Saldo para encaixar", CLT only): 0 to 15 days, all spent. Workdays only. Free by default (the planner may split them, e.g. bridges next to holidays) or "Tirar todos seguidos" (one run). Credit may touch a vacation period, leave, a holiday or other credit (back-to-back credit days show as one row); two vacation periods still never touch. Placed together with the vacation, so a long leave next to a vacation can make a block of 150+ days.
- Work week: Mon-Fri, Mon-Sat or custom. Weekly rest is Sunday; if Sunday is worked, every non-work day counts as rest for the start rule.
- CLT spends calendar days; PJ spends workdays only (holidays and weekends inside a PJ period are free).
- Default start: CLT today + 30 (notice); PJ today + 7 (no legal notice, but a week to arrange the work).
- Dates are shown and typed as dd/mm/aaaa on every phone (the native picker follows the phone's language, so the page uses its own field).
- Periods: "up to N". CLT up to 3; PJ up to 10, because unlimited splits always degrade into single days next to weekends.
- Score: total consecutive days off (vacation and credit plus the non-work days touching them). Extra days = score minus days spent (vacation plus credit). Ties: earliest start. Plans with the same days off are shown once.
- A CLT plan often has to spend a weekend day at a period edge: with a Mon-Fri week and no holiday nearby, a waste-free period runs Monday to Friday (5, 12, 19, 26 days), and those cannot add up to 30. The UI shows these days as counted by the CLT.

## Later

- Cooldown between periods (some companies require 1 to 3 months).
- Shift work with rest days other than Sunday; domestic workers (LC 150/2015); collective vacations (art. 139).
