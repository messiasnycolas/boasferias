# Holidays by place

The planner starts from the national holidays plus Good Friday and Corpus Christi (see
[clt-vacation.md](clt-vacation.md)). Choosing a state adds that state's holidays. Choosing a city
adds the city's, and from then on Corpus Christi counts only if the city has it (Good Friday stays:
it is a city holiday nearly everywhere).

## What counts as a state holiday

A day is listed only when a state law gives it to every worker. Left out:

- Days only for public servants (e.g. 28 Oct, Dia do Servidor; Goiás' holidays in Lei 20.756/2020,
  the servants' statute; Acre's Quinta-feira Santa).
- Pontos facultativos (optional days off), e.g. Acre's Revolução Acreana (6 Aug).
- Days a law moves to a Sunday (Santa Catarina).
- Days only third-party calendars list, with no law or official calendar behind them.

Yearly decrees that move a day (e.g. Tocantins moved 5 Oct 2026 to 9 Oct) are not followed: the
list uses the law's date, and users can remove or add days.

Lei 9.093/1995 lets a state set only its data magna; several states also hold religious or other
days by state law. They are listed because they are observed (state government and courts close).

## States (checked Nov 2026)

| UF | Holidays | Source |
| -- | -------- | ------ |
| AC | 20 Jan Dia do Católico (from 2016); 23 Jan Dia do Evangélico; 8 Mar Dia Internacional da Mulher; 15 Jun Aniversário do Acre; 5 Sep Dia da Amazônia; 17 Nov Tratado de Petrópolis | Leis 3.137/2016, 1.538/2004, 1.411/2001, 14/1964, 243/1968, 57/1965; TJAC 2026 calendar |
| AL | 24 Jun São João; 29 Jun São Pedro; 16 Sep Emancipação Política; 30 Nov Dia do Evangélico | Leis 5.508/1993, 5.509/1993; data magna; state 2026 calendar |
| AP | 19 Mar São José; 15 May Dia de Cabralzinho; 13 Sep Criação do Território | Lei 667/2002; Justiça Federal AP calendar; Constituição art. 355 |
| AM | 5 Sep Elevação a Província | Lei 25/1977 |
| BA | 2 Jul Independência da Bahia | Constituição art. 6º §3º |
| CE | 25 Mar Data Magna | Constituição art. 18 |
| DF | 30 Nov Dia do Evangélico | Lei distrital 963/1995 |
| ES | Nossa Senhora da Penha, Monday 8 days after Easter (from 2019) | Lei 11.010/2019 |
| GO | none (Lei 20.756/2020 covers state servants only) | |
| MA | 28 Jul Adesão à Independência | Lei 2.457/1964 |
| MT | none | |
| MS | 11 Oct Criação do Estado | Lei 10/1979 |
| MG | none (21 Apr is national) | |
| PA | 15 Aug Adesão à Independência | Lei 5.999/1996 |
| PB | 5 Aug Fundação da Paraíba | Lei 3.489/1967 |
| PR | none (19 Dec stopped being a holiday, Lei 18.384/2014) | |
| PE | 6 Mar Revolução Pernambucana (Lei 16.241/2017: the only state holiday; 24 Jun is Recife's) | Lei 13.835/2009 |
| PI | 19 Oct Dia do Piauí | Lei 176/1937 |
| RJ | Carnaval Tuesday; 23 Apr São Jorge | Leis 5.243/2008, 5.198/2008 |
| RN | 7 Aug Dia do RN; 3 Oct Mártires de Cunhaú e Uruaçu | Leis 7.831/2000, 8.913/2006 |
| RS | 20 Sep Revolução Farroupilha | Constituição art. 6º |
| RO | 4 Jan Criação do Estado; 18 Jun Dia do Evangélico | Leis 2.291/2010, 1.026/2001 |
| RR | 5 Oct Criação do Estado | Constituição art. 9º |
| SC | none on weekdays: 11 Aug and 25 Nov move to the next Sunday | Leis 12.906/2004, 10.306/1996 |
| SP | 9 Jul Revolução Constitucionalista | Lei 9.497/1997 |
| SE | 8 Jul Emancipação Política | Constituição art. 269 |
| TO | 8 Sep Nossa Senhora da Natividade; 5 Oct Criação do Estado (18 Mar left out: its law was changed) | Leis 627/1993, 98/1989 |

Not listed for lack of a law or official calendar: CE 19 Mar (Fortaleza's), AM and PA 8 Dec,
AP 25 Jul, PB 26 Jul, PI 13 Mar, MT 9 May.

### Acre moves its holidays

Lei 2.126/2009 (as amended by Lei 2.247/2009): a state holiday on Tuesday to Thursday is kept on
that week's Friday, except the state anniversary (15 Jun). Several in one week take consecutive
days ending on Friday, skipping days already off. 2026: Dia do Católico (Tue 20 Jan) on Thu 22,
since Dia do Evangélico holds Fri 23; Tratado de Petrópolis (Tue 17 Nov) on Thu 19, since Fri 20
is national.

## Cities

Source: the open dataset joaopbini/feriados-brasil (MIT), pinned in `apps/web/scripts/city-holidays.ts`
(ADR 0002). It lists dated holidays per year for about 3,840 of the 5,570 cities. A day becomes a
yearly rule when 2025 and 2026 both have it on the same date, or at the same distance from Easter
(about 96% of the entries); anything else is dropped. Its generic name "Feriado Municipal" is shown
as "Feriado municipal".

The dataset is not verified: the page says so under the city ("fonte comunitária; confira com sua
empresa"), and for a city with no data it asks the user to add the days in "Mais filtros".
