import { crc16, pixCode } from './pix';

const charge = { key: 'pix@example.com', name: 'LOJA EXEMPLO', city: 'CURITIBA', txid: 'SITE' };

describe('Pix code', () => {
  it('checks itself with CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1'); // the algorithm's published check value
    const code = pixCode(charge);
    expect(crc16(code.slice(0, -4))).toBe(code.slice(-4));
  });

  it('lays out the fields with their lengths, the amount only when set', () => {
    expect(pixCode(charge).slice(0, -4)).toBe(
      '000201' +
        '26370014br.gov.bcb.pix0115pix@example.com' +
        '52040000' +
        '5303986' +
        '5802BR' +
        '5912LOJA EXEMPLO' +
        '6008CURITIBA' +
        '62080504SITE' +
        '6304',
    );
    expect(pixCode({ ...charge, amountCents: 1000 })).toContain('5303986540510.005802BR');
  });

  it('refuses what would make an invalid code', () => {
    for (const bad of [
      { city: 'FLORIANÓPOLIS' },
      { name: 'A'.repeat(26) },
      { txid: 'SITE BOAS' },
      { amountCents: 0 },
      { amountCents: 10.5 },
    ])
      expect(() => pixCode({ ...charge, ...bad })).toThrow();
  });
});
