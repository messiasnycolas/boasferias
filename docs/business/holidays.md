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
| RJ | Carnaval Tuesday; 23 Apr São Jorge; Corpus Christi from 2026 | Leis 5.243/2008, 5.198/2008, 11.002/2025 (upheld by the STF, ADI 7898) |
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

The dataset is not verified: the page says so under the city ("vêm de uma base aberta; confira com sua
empresa"), and for a city with no data it asks the user to add the days in "Mais filtros".

### Capitals (checked Nov 2026)

Each capital's days are checked against city law, the city's yearly decree, or a court calendar
that cites the law, and replace the dataset's entry (`CAPITALS` in
`apps/web/src/app/calendar/domain/capital-holidays.ts`); the page shows no "base aberta"
hint for them. Good Friday is national in the app, and days that are already national or state
are not repeated. Corpus Christi is listed only where the city (or, in RJ, the state) declares it.

| Capital | Own days | Source |
|---|---|---|
| Rio Branco (AC) | 28 Dec Aniversário | Lei 330 (TJAC calendar) |
| Maceió (AL) | Corpus Christi; 27 Aug N. Sra. dos Prazeres; 8 Dec N. Sra. da Conceição | Lei 1.391/1967; Decreto 10.234/2025 |
| Macapá (AP) | 4 Feb Aniversário; Corpus Christi | Portaria SJAP-Diref 2/2025; Corpus Christi per the 2025 Valor/Demarest survey of capitals |
| Manaus (AM) | Carnaval Tuesday; Corpus Christi; 24 Oct Aniversário; 8 Dec N. Sra. da Conceição | Leis 448/1998, 970/2006, 496/1999; Lei Orgânica art. 437 (city decree of 31 Jan 2025) |
| Salvador (BA) | Corpus Christi; 24 Jun São João; 8 Dec N. Sra. da Conceição da Praia | Lei 1.997/1967 (Portaria SJBA-Diref 25/2025) |
| Fortaleza (CE) | 19 Mar São José; Corpus Christi; 15 Aug N. Sra. da Assunção | Lei 8.796/2003 |
| Brasília (DF) | none (no city tier; Corpus Christi is a ponto facultativo) | |
| Vitória (ES) | Corpus Christi; 8 Sep N. Sra. da Vitória | Lei 1.732/1967 (TJES Ato 176/2026) |
| Goiânia (GO) | 24 May N. Sra. Auxiliadora; Corpus Christi; 24 Oct Aniversário | Lei 100/1951 art. 3º (Corpus Christi); SJGO and TJGO calendars |
| São Luís (MA) | 29 Jun São Pedro; 8 Sep Aniversário; 8 Dec N. Sra. da Conceição | TJMA Resolução GP 131/2025; MPF-MA calendar 2026. Corpus Christi is a ponto facultativo |
| Cuiabá (MT) | 8 Apr Aniversário; Corpus Christi; 8 Dec N. Sra. da Conceição | Decreto 11.585/2025 |
| Campo Grande (MS) | 13 Jun Santo Antônio; 26 Aug Aniversário | Lei 3.901/2001; Decreto 16.469/2025 makes Corpus Christi a ponto facultativo |
| Belo Horizonte (MG) | Corpus Christi; 15 Aug Assunção; 8 Dec Imaculada Conceição | Lei 11.397/2022, Anexo V |
| Belém (PA) | Corpus Christi; 8 Dec N. Sra. da Conceição | Lei 6.306/1967 (Portaria SJPA-Diref 17/2025). 12 Jan is a ponto facultativo |
| João Pessoa (PB) | 24 Jun São João; 8 Dec N. Sra. da Conceição | Lei 13.768/2019 (MPF-PB calendar) |
| Curitiba (PR) | Corpus Christi; 8 Sep N. Sra. da Luz dos Pinhais | Lei 3.015/1967; Decreto 2.385/2025 |
| Recife (PE) | 24 Jun São João; 16 Jul N. Sra. do Carmo; 8 Dec N. Sra. da Conceição | Lei 9.777/1967 |
| Teresina (PI) | Corpus Christi; 16 Aug Aniversário; 8 Dec N. Sra. da Conceição | Lei 2.275/1994 (TRE-PI Portaria 479/2025); Corpus Christi per the Valor/Demarest survey |
| Rio de Janeiro (RJ) | 20 Jan São Sebastião | Lei 1.271/1988 |
| Natal (RN) | 6 Jan Santos Reis; Corpus Christi; 21 Nov N. Sra. da Apresentação | City holiday calendar (Prefeitura do Natal); TJRN |
| Porto Alegre (RS) | 2 Feb N. Sra. dos Navegantes; Corpus Christi | Lei 3.033/1967 (as amended by Lei 13.591/2023) |
| Porto Velho (RO) | 24 Jan Instalação; 24 May N. Sra. Auxiliadora; 2 Oct Criação do Município | Lei 190/1980 (TJRO and SJRO calendars) |
| Boa Vista (RR) | 20 Jan São Sebastião; Corpus Christi; 29 Jun São Pedro; 9 Jul Aniversário; 8 Dec N. Sra. da Conceição | Decreto 123/E/2025 |
| Florianópolis (SC) | 23 Mar Aniversário; Corpus Christi | Lei 832/1967 (as amended by Lei 8.046/2009) |
| São Paulo (SP) | 25 Jan Aniversário; Corpus Christi | Lei 14.485/2007, art. 10; Decreto 64.862/2025 |
| Aracaju (SE) | 17 Mar Aniversário; Corpus Christi; 24 Jun São João | Lei 3.805/2009 (TRE-SE calendars) |
| Palmas (TO) | 19 Mar São José; 20 May Aniversário | Lei 577/1996 (SJTO portaria) |

Left out: Fortaleza's 13 Apr 2026 (Lei 11.649/2026, the 300th anniversary, that year only) and
days only for public servants. Weakest sources: Corpus Christi in Macapá and Teresina rests on a
2025 survey, not a law text; recheck them each year.

