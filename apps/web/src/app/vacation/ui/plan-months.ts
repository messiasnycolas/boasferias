import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CalendarDay, CalendarMonth } from '../application/plan-calendar';
import { formatDate, monthName } from './format';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const KIND_LABEL: Record<CalendarDay['kind'], string> = {
  vacation: 'férias',
  counted: 'férias contadas pela CLT',
  off: 'folga',
  none: '',
};

@Component({
  selector: 'app-plan-months',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="legend" [class.long]="hasCounted()">
      <li><i class="swatch vacation"></i>Férias</li>
      <li><i class="swatch off"></i>Folga</li>
      @if (hasCounted()) {
        <li><i class="swatch counted"></i>Contado como férias pela CLT</li>
      }
      <li><b class="holiday-mark">12</b>Feriado ou folga adicionada</li>
    </ul>
    <div class="months">
      @for (month of months(); track month.year * 100 + month.month) {
        <section class="month" [attr.aria-label]="name(month)">
          <h4>{{ name(month) }}</h4>
          <div class="grid" aria-hidden="true">
            @for (w of weekdays; track $index) {
              <span class="dow">{{ w }}</span>
            }
          </div>
          <ol class="grid">
            @for (day of month.days; track $index) {
              @if (day) {
                <li
                  class="day"
                  [class]="'day ' + day.kind"
                  [class.holiday]="day.holiday"
                  [class.cap-start]="capStart(month.days, $index)"
                  [class.cap-end]="capEnd(month.days, $index)"
                  [attr.aria-label]="label(day)"
                  [attr.title]="day.holiday"
                >
                  {{ day.day }}
                </li>
              } @else {
                <li class="pad" aria-hidden="true"></li>
              }
            }
          </ol>
        </section>
      }
    </div>
  `,
  styleUrl: './plan-months.css',
})
export class PlanMonths {
  readonly months = input.required<CalendarMonth[]>();
  protected readonly weekdays = WEEKDAYS;
  protected readonly name = (m: CalendarMonth) => monthName(m.year, m.month);

  protected hasCounted(): boolean {
    return this.months().some((m) => m.days.some((d) => d?.kind === 'counted'));
  }

  protected label(day: CalendarDay): string {
    const parts = [formatDate(day.iso), KIND_LABEL[day.kind], day.holiday ?? ''];
    return parts.filter(Boolean).join(', ');
  }

  /** Round the pill where a run of days off starts, or where a week row breaks it. */
  protected capStart(days: (CalendarDay | null)[], i: number): boolean {
    const day = days[i];
    const prev = days[i - 1];
    return !!day && day.kind !== 'none' && (day.weekday === 0 || !prev || prev.kind === 'none');
  }

  protected capEnd(days: (CalendarDay | null)[], i: number): boolean {
    const day = days[i];
    const next = days[i + 1];
    return !!day && day.kind !== 'none' && (day.weekday === 6 || !next || next.kind === 'none');
  }
}
