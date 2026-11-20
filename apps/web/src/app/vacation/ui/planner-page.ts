import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FAQS, FAQ_UPDATED, addFaqJsonLd } from './faq';
import { DEFAULT_LIMIT, WORK_WEEKS, defaultInput } from '../application/defaults';
import { CREDIT_MAX_DAYS } from '../domain/credit';
import { LeaveError, MAX_LEAVE_RUNS, expandLeave, groupLeave } from '../application/leave-days';
import { planCalendar } from '../application/plan-calendar';
import { parseIsoDate } from '../../calendar/domain/calendar-date';
import { Uf } from '../../calendar/domain/state-holidays';
import {
  HolidayView,
  LIMITS,
  MAX_LIMIT,
  Mode,
  SuggestInput,
  SuggestResult,
} from '../application/suggest-plans';
import {
  ERROR_MESSAGES,
  formatDate,
  formatDay,
  formatRange,
  planLetter,
  restFrom,
  tieNote,
  todayIso,
} from './format';
import { BackToTop } from './back-to-top';
import { CityField } from './city-field';
import { DateField } from './date-field';
import { PlanMonths } from './plan-months';
import { PlannerClient } from './planner-client';
import { STATE_OPTIONS, saveState, savedState } from './states';

type StepField = 'days' | 'maxPeriods' | 'creditDays';
type WeekPreset = keyof typeof WORK_WEEKS | 'custom';

const RECOMPUTE_DELAY_MS = 250;
const LEAVE_MESSAGES: Record<LeaveError, string> = {
  'invalid-date': 'Confira a data.',
  'end-before-start': 'O último dia vem antes do primeiro.',
  'too-long': 'Adicione até 60 dias por vez.',
};
const MORE_PLANS_STEP = 5;
const WEEKDAY_CHIPS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

@Component({
  selector: 'app-planner-page',
  imports: [BackToTop, CityField, DateField, PlanMonths],
  templateUrl: './planner-page.html',
  styleUrls: ['./planner-page.css', './switches.css', './location.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'onScroll()', '[class.revealed]': 'revealed()' },
})
export class PlannerPage {
  /** Compared by content, so a click that changes nothing does not recompute. */
  protected readonly form = signal<SuggestInput>(defaultInput('clt', todayIso()), {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
  protected readonly limits = computed(() => LIMITS[this.form().mode]);
  protected readonly loading = signal(false);
  /** Plans are computed in the background from the start, but shown only after the first click. */
  protected readonly revealed = signal(false);
  /** More than a screen down: the back-to-top ball shows. */
  protected readonly scrolledDown = signal(false);
  protected readonly result = signal<SuggestResult | null>(null);
  private readonly resultInput = signal<SuggestInput | null>(null);
  protected readonly selected = signal(0);
  /** Index of the plan whose share image is being made, and of the one that failed. */
  protected readonly sharing = signal<number | null>(null);
  protected readonly shareFailed = signal<number | null>(null);
  protected readonly customWeek = signal(false);
  /** "Dias já marcados": first day required, last day optional (a range). */
  protected readonly leaveStart = signal('');
  protected readonly leaveEnd = signal('');
  private readonly leave = computed(() =>
    this.leaveStart() ? expandLeave(this.leaveStart(), this.leaveEnd()) : null,
  );
  protected readonly leaveDays = computed(() => {
    const leave = this.leave();
    return leave?.ok ? leave.days : null;
  });
  protected readonly leaveError = computed(() => {
    const leave = this.leave();
    return leave && !leave.ok ? LEAVE_MESSAGES[leave.error] : null;
  });
  protected readonly leaveRuns = computed(() => groupLeave(this.form().leaveDays));
  /** At the cap, a day that extends or joins entries still fits. */
  protected readonly canAddLeave = computed(() => {
    const days = this.leaveDays();
    return !!days && groupLeave([...this.form().leaveDays, ...days]).length <= MAX_LEAVE_RUNS;
  });
  /** "Adicionar feriado": the day typed, ISO once complete. */
  protected readonly holidayDate = signal('');
  protected readonly canAddHoliday = computed(() => parseIsoDate(this.holidayDate()) !== null);
  protected readonly maxLeaveRuns = MAX_LEAVE_RUNS;
  protected readonly creditMax = CREDIT_MAX_DAYS;

  protected readonly weekChips = WEEKDAY_CHIPS;
  protected readonly weekNames = WEEKDAY_NAMES;
  protected readonly formatRange = formatRange;
  protected readonly formatDate = formatDate;
  protected readonly formatDay = formatDay;
  protected readonly states = STATE_OPTIONS;
  protected readonly planLetter = planLetter;

  protected readonly weekPreset = computed<WeekPreset>(() => {
    if (this.customWeek()) return 'custom';
    const week = this.form().workWeek.join();
    if (week === WORK_WEEKS['mon-fri'].join()) return 'mon-fri';
    if (week === WORK_WEEKS['mon-sat'].join()) return 'mon-sat';
    return 'custom';
  });

  protected readonly plans = computed(() => {
    const result = this.result();
    return result?.ok ? result.plans : [];
  });

  /** How many more plans "Calcular mais" asks for; 0 when at the cap or when no more exist. */
  protected readonly morePlans = computed(() => {
    const input = this.resultInput();
    if (!input || this.plans().length < input.limit) return 0;
    return Math.min(MORE_PLANS_STEP, MAX_LIMIT - input.limit);
  });

  protected readonly error = computed(() => {
    const result = this.result();
    return result && !result.ok ? ERROR_MESSAGES[result.error] : null;
  });

  protected readonly holidays = computed(() => {
    const result = this.result();
    return result?.ok ? result.holidays : [];
  });

  protected readonly months = computed(() => {
    const plan = this.plans()[this.selected()];
    const input = this.resultInput();
    return plan && input ? planCalendar(input, plan) : [];
  });

  /** CLT minus a sold third: taking 16+ of 20 strands the rest below the 5-day minimum. */
  protected readonly sellNote = computed(() => {
    const { mode, sellThird, days } = this.form();
    if (mode !== 'clt' || !sellThird) return null;
    const left = days - Math.floor(days / 3);
    return `Vendendo 1/3, sobram ${left} dias. Se um período passar de ${left - 5} dias, o resto fica com menos de 5 e não pode mais ser usado.`;
  });

  private readonly results = viewChild<ElementRef<HTMLElement>>('results');
  private readonly formTitle = viewChild.required<ElementRef<HTMLElement>>('formTitle');
  private readonly client = isPlatformBrowser(inject(PLATFORM_ID)) ? new PlannerClient() : null;
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private timer: ReturnType<typeof setTimeout> | undefined;
  protected readonly faqs = FAQS;
  protected readonly faqUpdated = FAQ_UPDATED;

  constructor() {
    addFaqJsonLd(inject(DOCUMENT));
    if (this.client) {
      const state = savedState();
      if (state) this.patch({ state });
    }
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.client?.stop();
    });
    effect(() => {
      const input = this.form();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.compute(input), RECOMPUTE_DELAY_MS);
    });
  }

  /** Any change other than asking for more plans starts again from the default count. */
  protected patch(change: Partial<SuggestInput>): void {
    this.form.update((form) => ({ ...form, limit: DEFAULT_LIMIT, ...change }));
  }

  /** aria-disabled, not disabled, while loading: keeps keyboard focus on the button. */
  protected calculateMore(): void {
    if (this.loading()) return;
    this.patch({ limit: this.form().limit + this.morePlans() });
  }

  protected setMode(mode: Mode): void {
    if (mode === this.form().mode) return;
    const { workWeek, state, city, removedHolidays, addedHolidays, leaveDays } = this.form();
    this.form.set({
      ...defaultInput(mode, todayIso()),
      workWeek,
      state,
      city,
      removedHolidays,
      addedHolidays,
      leaveDays,
    });
  }

  protected setState(value: string): void {
    const state = (value || null) as Uf | null;
    saveState(state);
    this.patch({ state, city: null });
  }

  protected step(field: StepField, delta: number): void {
    const [min, max] = this.range(field);
    const value = Math.min(max, Math.max(min, this.form()[field] + delta));
    this.patch({ [field]: value });
  }

  protected typed(field: StepField, value: string): void {
    const number = Number(value);
    if (value !== '' && Number.isFinite(number)) this.patch({ [field]: number });
  }

  private range(field: StepField): readonly [number, number] {
    if (field === 'creditDays') return [0, CREDIT_MAX_DAYS];
    return field === 'days' ? this.limits().days : this.limits().periods;
  }

  protected setWeek(preset: WeekPreset): void {
    this.customWeek.set(preset === 'custom');
    if (preset !== 'custom') this.patch({ workWeek: [...WORK_WEEKS[preset]] });
  }

  protected toggleWeekday(day: number): void {
    const week = this.form().workWeek;
    const next = week.includes(day) ? week.filter((d) => d !== day) : [...week, day].sort();
    this.patch({ workWeek: next });
  }

  protected toggleHoliday(date: string): void {
    const removed = this.form().removedHolidays;
    this.patch({
      removedHolidays: removed.includes(date)
        ? removed.filter((d) => d !== date)
        : [...removed, date],
    });
  }

  protected addHoliday(): void {
    const date = this.holidayDate();
    if (!this.canAddHoliday()) return;
    // Adding a removed default restores it; an added day that is a default changes nothing.
    const { removedHolidays, addedHolidays } = this.form();
    this.patch({
      removedHolidays: removedHolidays.filter((d) => d !== date),
      addedHolidays: [...new Set([...addedHolidays, date])].sort(),
    });
    this.holidayDate.set('');
  }

  protected holidayAction(h: HolidayView): string {
    if (h.added) return `Remover ${h.name} de ${this.formatDate(h.date)}`;
    return (this.form().removedHolidays.includes(h.date) ? 'Considerar ' : 'Remover ') + h.name;
  }

  protected removeAddedHoliday(date: string): void {
    this.patch({ addedHolidays: this.form().addedHolidays.filter((d) => d !== date) });
  }

  protected addLeave(): void {
    const days = this.leaveDays();
    if (!days || !this.canAddLeave()) return;
    const all = new Set([...this.form().leaveDays, ...days]);
    this.patch({ leaveDays: [...all].sort() });
    this.leaveStart.set('');
    this.leaveEnd.set('');
  }

  protected removeLeave(days: readonly string[]): void {
    this.patch({ leaveDays: this.form().leaveDays.filter((d) => !days.includes(d)) });
  }

  protected showResults(): void {
    if (this.resultInput() !== this.form()) {
      clearTimeout(this.timer);
      this.compute(this.form());
    }
    const focus = () => this.results()?.nativeElement.focus();
    const glide = () => {
      const results = this.results()?.nativeElement;
      results?.focus({ preventScroll: true });
      results?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    if (this.revealed() || reducedMotion()) {
      this.revealed.set(true);
      afterNextRender(focus, { injector: this.injector });
      return;
    }
    // Phones: the plans open under the form, nothing slides, so the page glides there at once.
    if (!document.startViewTransition || !sideBySide()) {
      this.revealed.set(true);
      afterNextRender(glide, { injector: this.injector });
      return;
    }
    // Desktop: the first reveal animates. The browser snapshots the page, Angular renders, then it
    // morphs.
    // The page holds still while it morphs; on desktop the form now scrolls inside itself and keeps
    // showing its end, where the button was clicked, so it slides without changing. Only then does
    // the page glide to the plans.
    const reveal = () =>
      new Promise<void>((rendered) => {
        this.revealed.set(true);
        afterNextRender(
          () => {
            const body = this.host.nativeElement.querySelector('.form > .card-body');
            if (body) body.scrollTop = body.scrollHeight;
            this.results()?.nativeElement.focus({ preventScroll: true });
            rendered();
          },
          { injector: this.injector },
        );
      });
    document.startViewTransition(reveal).finished.then(glide);
  }

  /** Opens a plan on the calendar and brings that calendar to the top of the screen. */
  protected openCalendar(index: number): void {
    this.selected.set(index);
    afterNextRender(
      () => {
        const plan = this.host.nativeElement.querySelectorAll('.plan').item(index);
        const calendar = plan?.querySelector('app-plan-months');
        calendar?.scrollIntoView({ block: 'start', behavior: smoothUnlessReduced() });
      },
      { injector: this.injector },
    );
  }

  /** Phones get the share sheet with the image only; elsewhere the image downloads. */
  protected async share(index: number): Promise<void> {
    const plan = this.plans()[index];
    const input = this.resultInput();
    if (!plan || !input || this.sharing() !== null) return;
    this.sharing.set(index);
    this.shareFailed.set(null);
    try {
      const { drawShareImage } = await import('./share-image');
      const blob = await drawShareImage(
        plan.daysOff,
        restFrom(input.mode, plan.daysSpent - plan.creditDays, plan.creditDays),
      );
      const name = `boas-ferias-plano-${planLetter(index).toLowerCase()}.jpg`;
      const file = new File([blob], name, { type: 'image/jpeg' });
      const phone = window.matchMedia('(pointer: coarse)').matches;
      if (phone && navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file] });
      else download(file);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') this.shareFailed.set(index);
    } finally {
      this.sharing.set(null);
    }
  }

  protected onScroll(): void {
    this.scrolledDown.set(window.scrollY > window.innerHeight);
  }

  /** Scrolls up and moves focus to the form, so keyboard users land there too. */
  protected backToTop(): void {
    window.scrollTo({ top: 0, behavior: smoothUnlessReduced() });
    this.formTitle().nativeElement.focus({ preventScroll: true });
  }

  /** "Empatado com os planos B e C", or null when no other shown plan has the same days off. */
  protected tiedWith(index: number): string | null {
    const plans = this.plans();
    const others = plans
      .map((plan, i) => (i !== index && plan.daysOff === plans[index].daysOff ? i : -1))
      .filter((i) => i >= 0);
    return others.length ? tieNote(others) : null;
  }

  private async compute(input: SuggestInput): Promise<void> {
    if (!this.client) return;
    this.loading.set(true);
    const result = await this.client.run(input);
    if (input !== this.form()) return; // a newer input is on its way
    const onlyMorePlans = sameExceptLimit(input, this.resultInput());
    this.result.set(result);
    this.resultInput.set(input);
    if (!onlyMorePlans) this.selected.set(0);
    this.loading.set(false);
  }
}

/** True when two inputs differ at most in how many plans they ask for. */
function sameExceptLimit(a: SuggestInput, b: SuggestInput | null): boolean {
  return !!b && JSON.stringify({ ...a, limit: 0 }) === JSON.stringify({ ...b, limit: 0 });
}

function download(file: File): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Form and plans side by side (the page's 960 px breakpoint). */
function sideBySide(): boolean {
  return window.matchMedia('(min-width: 960px)').matches;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function smoothUnlessReduced(): ScrollBehavior {
  return reducedMotion() ? 'auto' : 'smooth';
}
