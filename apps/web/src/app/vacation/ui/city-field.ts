import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { Uf } from '../../calendar/domain/state-holidays';
import { City, loadCities, saveCity, savedCity, searchCities } from './cities';

const MAX_OPTIONS = 8;

/**
 * "Cidade": a search over the chosen state's cities (an ARIA combobox). Picking one hands its
 * holidays to the page; the pick is remembered on this device.
 */
@Component({
  selector: 'app-city-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './city-field.css',
  template: `
    <label for="city">Cidade</label>
    <div class="combo">
      <input
        id="city"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        aria-controls="city-options"
        [attr.aria-expanded]="open()"
        [attr.aria-activedescendant]="open() && active() >= 0 ? 'city-' + active() : null"
        [placeholder]="cities() ? 'Busque a sua' : 'Carregando…'"
        [disabled]="!cities()"
        [value]="query()"
        (input)="typed($any($event.target).value)"
        (keydown)="key($event)"
        (blur)="closeList()"
      />
      @if (chosen()) {
        <button type="button" class="clear" aria-label="Limpar cidade" (click)="choose(null)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
        </button>
      }
      <ul id="city-options" role="listbox" aria-label="Cidades" [hidden]="!open()">
        @for (city of matches(); track city.id) {
          <!-- Combobox pattern: focus stays in the input, the keyboard moves through options there. -->
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
          <li
            role="option"
            [id]="'city-' + $index"
            [attr.aria-selected]="$index === active()"
            (mousedown)="$event.preventDefault()"
            (click)="choose(city)"
          >
            {{ city.name }}
          </li>
        }
      </ul>
    </div>
    @if (failed()) {
      <p class="hint error" role="alert">
        Não foi possível carregar as cidades. Os feriados do estado continuam valendo.
      </p>
    } @else if (chosen(); as city) {
      <!-- A verified city (a capital) needs no hint, even with no city days (Brasília). -->
      @if (!city.verified) {
        @if (!city.rules.length) {
          <p class="hint">
            Não temos os feriados desta cidade. Adicione-os em "Feriados no período".
          </p>
        } @else {
          <p class="hint">Feriados da cidade de fonte comunitária; confira com sua empresa.</p>
        }
      }
    }
  `,
})
export class CityField {
  readonly state = input.required<Uf>();
  readonly cityChange = output<City | null>();

  protected readonly cities = signal<City[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly chosen = signal<City | null>(null);
  protected readonly query = signal('');
  protected readonly active = signal(-1);
  private readonly listed = signal(false);

  protected readonly matches = computed(() =>
    searchCities(this.cities() ?? [], this.query(), MAX_OPTIONS),
  );
  protected readonly open = computed(() => this.listed() && this.matches().length > 0);

  constructor() {
    // A new state: load its cities, keep the remembered one if it is there, else start empty.
    effect(() => {
      const uf = this.state();
      this.cities.set(null);
      this.failed.set(false);
      loadCities(uf).then(
        (cities) => {
          if (uf !== this.state()) return;
          this.cities.set(cities);
          const saved = savedCity();
          this.choose(cities.find((city) => city.id === saved) ?? null);
        },
        () => {
          if (uf !== this.state()) return;
          this.failed.set(true);
          this.choose(null);
        },
      );
    });
  }

  protected typed(text: string): void {
    this.query.set(text);
    this.active.set(-1);
    this.listed.set(true);
    if (this.chosen()) this.choose(null, text);
  }

  protected key(event: KeyboardEvent): void {
    const count = this.matches().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.listed.set(true);
      if (!count) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.active.set((this.active() + step + count) % count);
    } else if (event.key === 'Enter' && this.open()) {
      event.preventDefault();
      const city = this.matches()[Math.max(this.active(), 0)];
      if (city) this.choose(city);
    } else if (event.key === 'Escape') {
      this.closeList();
    }
  }

  protected closeList(): void {
    this.listed.set(false);
    this.active.set(-1);
  }

  /** Picks a city (or none), tells the page, and remembers it. */
  protected choose(city: City | null, text = city?.name ?? ''): void {
    this.chosen.set(city);
    this.query.set(text);
    this.closeList();
    saveCity(city?.id ?? null);
    this.cityChange.emit(city);
  }
}
