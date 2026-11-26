/** A static Pix charge (BR Code, Banco Central's EMV QR layout): the same code works any number of times. */
export interface PixCharge {
  key: string;
  /** Up to 25 characters, ASCII. The payer's bank shows the account holder from the key anyway. */
  name: string;
  /** Up to 15 characters, ASCII. */
  city: string;
  /** Shows in the bank statement; up to 25 letters or digits. */
  txid: string;
  /** None: the payer types the amount. */
  amountCents?: number;
}

const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

/** Lengths count characters, so only plain ASCII keeps the code valid. */
function field(id: string, value: string): string {
  if (value.length > 99 || !PRINTABLE_ASCII.test(value)) throw new Error(`Invalid Pix field ${id}`);
  return id + String(value.length).padStart(2, '0') + value;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, start 0xFFFF), as 4 uppercase hex digits. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** The "Pix Copia e Cola" text, also what the QR code holds. */
export function pixCode(charge: PixCharge): string {
  const { name, city, txid, amountCents } = charge;
  if (name.length > 25 || city.length > 15 || !/^[A-Za-z0-9]{1,25}$/.test(txid))
    throw new Error('Invalid Pix charge');
  if (amountCents !== undefined && !(Number.isInteger(amountCents) && amountCents > 0))
    throw new Error('Invalid Pix amount');
  const amount =
    charge.amountCents === undefined ? '' : field('54', (charge.amountCents / 100).toFixed(2));
  const payload =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', charge.key)) +
    field('52', '0000') +
    field('53', '986') +
    amount +
    field('58', 'BR') +
    field('59', charge.name) +
    field('60', charge.city) +
    field('62', field('05', charge.txid)) +
    '6304';
  return payload + crc16(payload);
}
