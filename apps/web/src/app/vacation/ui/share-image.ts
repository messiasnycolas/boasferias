/**
 * The share image: a 1080x1350 JPEG of one plan. The background (beach photo, the card's palm head,
 * sand body and trunk foot with the address) is a fixed asset; this draws only the numbers on it.
 * Loaded on the first "Compartilhar" click, so the page itself does not grow.
 */
const WIDTH = 1080;
const HEIGHT = 1350;
const BACKGROUND = '/share/fundo.jpg';
/** Condensed display face, only for the stacked lines of the image. */
const DISPLAY = 'Big Shoulders Display';
const DISPLAY_URL = '/share/big-shoulders-display-900.woff2';
const TEXT = 'Figtree Variable';
/** The card body's free area in the background, in image pixels. */
const STACK = { top: 208, bottom: 1034, maxWidth: 828 };
const REST_BASELINE = 1118;
const LINE_GAP = 0.045;

interface Line {
  text: string;
  color: string;
}

/** "VOU CURTIR / 44 / DIAS DE / DESCANSO / partindo de 30 dias de férias" as a JPEG. */
export async function drawShareImage(total: number, rest: string): Promise<Blob> {
  const [background] = await Promise.all([loadImage(BACKGROUND), loadFonts()]);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(background, 0, 0);

  const token = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ink = token('--ink');
  drawStack(ctx, [
    { text: 'VOU CURTIR', color: ink },
    { text: String(total), color: token('--holiday') },
    { text: 'DIAS DE', color: ink },
    { text: 'DESCANSO', color: ink },
  ]);
  ctx.font = `500 42px "${TEXT}"`;
  ctx.fillStyle = token('--muted');
  ctx.fillText(`partindo de ${rest}`, WIDTH / 2, REST_BASELINE);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))),
      'image/jpeg',
      0.9,
    ),
  );
}

/** Every line scaled to the same width, so the stack reads as one block; as big as the card allows. */
function drawStack(ctx: CanvasRenderingContext2D, lines: Line[]): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 100px "${DISPLAY}"`;
  const shapes = lines.map(({ text }) => {
    const m = ctx.measureText(text);
    const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    return {
      ascent: m.actualBoundingBoxAscent / width,
      height: (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / width,
      size: 100 / width,
    };
  });
  const perWidth = shapes.reduce((sum, s) => sum + s.height, 0) + LINE_GAP * (lines.length - 1);
  const room = STACK.bottom - STACK.top;
  const width = Math.min(STACK.maxWidth, room / perWidth);
  let y = STACK.top + (room - width * perWidth) / 2;
  lines.forEach(({ text, color }, i) => {
    const shape = shapes[i];
    ctx.font = `900 ${shape.size * width}px "${DISPLAY}"`;
    ctx.fillStyle = color;
    ctx.fillText(text, WIDTH / 2, y + shape.ascent * width);
    y += (shape.height + LINE_GAP) * width;
  });
}

async function loadFonts(): Promise<void> {
  if (![...document.fonts].some((font) => font.family === DISPLAY)) {
    document.fonts.add(
      await new FontFace(DISPLAY, `url(${DISPLAY_URL})`, { weight: '900' }).load(),
    );
  }
  await document.fonts.load(`500 42px "${TEXT}"`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  return image.decode().then(() => image);
}
