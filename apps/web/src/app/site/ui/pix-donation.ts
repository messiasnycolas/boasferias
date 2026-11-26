import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { pixCode } from '../domain/pix';

/** Messias Software's Pix key. The txid marks site donations in the bank statement. */
const PIX = {
  key: 'contato@messias.software',
  name: 'MESSIAS SOFTWARE',
  city: 'FLORIANOPOLIS',
  txid: 'BOASFERIAS',
};
const AMOUNTS = [500, 1000, 2000];
const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
});

/** "Pague um café": a Pix code to copy, and its QR code for paying from another screen. */
@Component({
  selector: 'app-pix-donation',
  templateUrl: './pix-donation.html',
  styleUrl: './pix-donation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixDonation {
  protected readonly open = signal(false);
  protected readonly amounts = AMOUNTS;
  /** Cents; null lets the payer type the amount in the bank app. */
  protected readonly amount = signal<number | null>(1000);
  protected readonly code = computed(() =>
    pixCode({ ...PIX, amountCents: this.amount() ?? undefined }),
  );
  /** The QR library, loaded the first time the panel opens; 'failed' when it could not load. */
  private readonly qrcode = signal<QrFactory | 'failed' | null>(null);
  protected readonly qrFailed = computed(() => this.qrcode() === 'failed');
  protected readonly qr = computed(() => {
    const factory = this.qrcode();
    return factory && factory !== 'failed' ? qrPath(factory, this.code()) : null;
  });
  protected readonly copied = signal<'yes' | 'failed' | null>(null);

  protected async toggle(): Promise<void> {
    this.open.update((open) => !open);
    if (!this.open() || this.qrcode() !== null) return;
    try {
      this.qrcode.set((await import('qrcode-generator')).default);
    } catch {
      this.qrcode.set('failed');
    }
  }

  protected choose(cents: number | null): void {
    this.amount.set(cents);
    // A failed copy keeps the code field, now with the new amount.
    if (this.copied() === 'yes') this.copied.set(null);
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set('yes');
    } catch {
      this.copied.set('failed');
    }
  }

  protected brl(cents: number): string {
    return BRL.format(cents / 100);
  }
}

type QrFactory = typeof import('qrcode-generator');

/** One SVG path for the dark modules, a rectangle per horizontal run. */
function qrPath(qrcode: QrFactory, text: string): { size: number; path: string } {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!qr.isDark(row, col)) continue;
      let run = 1;
      while (col + run < size && qr.isDark(row, col + run)) run++;
      path += `M${col} ${row}h${run}v1h-${run}z`;
      col += run;
    }
  }
  return { size, path };
}
