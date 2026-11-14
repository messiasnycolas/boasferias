import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WORK_WEEKS, defaultInput } from '../application/defaults';
import { planCalendar } from '../application/plan-calendar';
import { LIMITS, Mode, SuggestInput, SuggestResult } from '../application/suggest-plans';
import { ERROR_MESSAGES, formatDate, formatDay, formatRange, todayIso } from './format';
import { PlanMonths } from './plan-months';
import { PlannerClient } from './planner-client';

type WeekPreset = keyof typeof WORK_WEEKS | 'custom';

const RECOMPUTE_DELAY_MS = 250;
const PLANS_SHOWN = 3;
const WEEKDAY_CHIPS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

@Component({
  selector: 'app-planner-page',
  imports: [PlanMonths],
  templateUrl: './planner-page.html',
  styleUrl: './planner-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerPage {
  /** Compared by content, so a click that changes nothing does not recompute. */
  protected readonly form = signal<SuggestInput>(defaultInput('clt', todayIso()), {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
  protected readonly limits = computed(() => LIMITS[this.form().mode]);
  protected readonly loading = signal(false);
  protected readonly result = signal<SuggestResult | null>(null);
  private readonly resultInput = signal<SuggestInput | null>(null);
  protected readonly selected = signal(0);
  protected readonly customWeek = signal(false);
  protected readonly newDayOff = signal('');

  protected readonly weekChips = WEEKDAY_CHIPS;
  protected readonly weekNames = WEEKDAY_NAMES;
  protected readonly formatRange = formatRange;
  protected readonly formatDate = formatDate;
  protected readonly formatDay = formatDay;

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

  protected readonly showAll = signal(false);
  protected readonly visiblePlans = computed(() =>
    this.showAll() ? this.plans() : this.plans().slice(0, PLANS_SHOWN),
  );

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
  private readonly client = isPlatformBrowser(inject(PLATFORM_ID)) ? new PlannerClient() : null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
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

  protected patch(change: Partial<SuggestInput>): void {
    this.form.update((form) => ({ ...form, ...change }));
  }

  protected setMode(mode: Mode): void {
    if (mode === this.form().mode) return;
    const { workWeek, removedHolidays, extraDaysOff } = this.form();
    this.form.set({ ...defaultInput(mode, todayIso()), workWeek, removedHolidays, extraDaysOff });
  }

  protected step(field: 'days' | 'maxPeriods', delta: number): void {
    const [min, max] = field === 'days' ? this.limits().days : this.limits().periods;
    const value = Math.min(max, Math.max(min, this.form()[field] + delta));
    this.patch({ [field]: value });
  }

  protected typed(field: 'days' | 'maxPeriods', value: string): void {
    const number = Number(value);
    if (value !== '' && Number.isFinite(number)) this.patch({ [field]: number });
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

  protected addDayOff(): void {
    const date = this.newDayOff();
    if (date && !this.form().extraDaysOff.includes(date)) {
      this.patch({ extraDaysOff: [...this.form().extraDaysOff, date].sort() });
    }
    this.newDayOff.set('');
  }

  protected removeDayOff(date: string): void {
    this.patch({ extraDaysOff: this.form().extraDaysOff.filter((d) => d !== date) });
  }

  protected showResults(): void {
    clearTimeout(this.timer);
    this.compute(this.form());
    this.results()?.nativeElement.focus();
  }

  /** How many later plans tie with this one, counted only on the first of a tie group. */
  protected tiesAfter(index: number): number {
    const plans = this.plans();
    const score = plans[index].daysOff;
    if (index > 0 && plans[index - 1].daysOff === score) return 0;
    return plans.slice(index + 1).filter((p) => p.daysOff === score).length;
  }

  private async compute(input: SuggestInput): Promise<void> {
    if (!this.client) return;
    this.loading.set(true);
    const result = await this.client.run(input);
    if (input !== this.form()) return; // a newer input is on its way
    this.result.set(result);
    this.resultInput.set(input);
    this.selected.set(0);
    this.showAll.set(false);
    this.loading.set(false);
  }
}
