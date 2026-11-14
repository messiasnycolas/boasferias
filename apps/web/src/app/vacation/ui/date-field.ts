import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { maskBrDate, parseBrDate, toBrDate } from './format';

/**
 * A date always shown as dd/mm/aaaa, whatever the phone's language (the native date input
 * follows it). Typing is masked; the calendar button opens the native picker hidden behind it.
 */
@Component({
  selector: 'app-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      [id]="inputId()"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="dd/mm/aaaa"
      maxlength="10"
      [value]="text()"
      (input)="typed($any($event.target))"
      (blur)="text.set(toBr(value()))"
    />
    <input
      #native
      class="native"
      type="date"
      tabindex="-1"
      aria-hidden="true"
      [value]="value()"
      (change)="picked($any($event.target).value)"
    />
    <button type="button" aria-label="Abrir calendário" (click)="openPicker()">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    </button>
  `,
  styleUrl: './date-field.css',
})
export class DateField {
  readonly inputId = input.required<string>();
  /** ISO date or "" (empty). */
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected readonly text = signal('');
  protected readonly toBr = toBrDate;
  private readonly native = viewChild.required<ElementRef<HTMLInputElement>>('native');

  constructor() {
    effect(() => this.text.set(toBrDate(this.value())));
  }

  protected typed(field: HTMLInputElement): void {
    const masked = maskBrDate(field.value);
    field.value = masked;
    this.text.set(masked);
    const iso = parseBrDate(masked);
    if (iso && iso !== this.value()) this.valueChange.emit(iso);
  }

  protected picked(iso: string): void {
    if (iso) this.valueChange.emit(iso);
  }

  protected openPicker(): void {
    const native = this.native().nativeElement;
    try {
      native.showPicker();
    } catch {
      native.focus(); // browsers without showPicker
    }
  }
}
