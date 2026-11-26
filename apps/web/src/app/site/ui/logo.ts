import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The sun in sunglasses. Sized by its host: 36-44 px, growing with the screen. */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 6v10M50 84v10M6 50h10M84 50h10M19 19l7 7M74 74l7 7M81 19l-7 7M26 74l-7 7"
        stroke="#f7b32b"
        stroke-width="7"
      />
      <circle cx="50" cy="50" r="27" fill="#f7b32b" stroke="none" />
      <path d="M27 44h46" stroke="#d7263d" stroke-width="4" />
      <path
        d="M29 44h17v6a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8z"
        fill="#14181d"
        stroke="#d7263d"
        stroke-width="3"
      />
      <path
        d="M54 44h17v6a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8z"
        fill="#14181d"
        stroke="#d7263d"
        stroke-width="3"
      />
      <path d="M38.3 63.6Q47.6 73 56.8 67.5" stroke="#14181d" stroke-width="4" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      flex: none;
      width: clamp(36px, 10vw, 44px);
      height: clamp(36px, 10vw, 44px);
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {}
