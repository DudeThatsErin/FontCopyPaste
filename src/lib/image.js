/* Renders styled text to a PNG. This is the only copy path that reproduces
 * color exactly everywhere — including iPhone Notes, which drops pasted HTML
 * color — at the cost of the result no longer being editable text. */

const SCALE = 2;          // render at 2x so the PNG stays crisp when scaled up
const LINE_HEIGHT = 1.3;

/* Safari <16.4 and older Chrome lack ctx.roundRect. */
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/* Scale-to-fill, so an uploaded backdrop covers the canvas without distorting. */
function drawCover(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/* A webfont that hasn't finished loading would render as a fallback face in
 * the PNG, silently producing the wrong image. */
async function ensureFont(fontSpec) {
  if (!document.fonts) return;
  try {
    await document.fonts.load(fontSpec);
    await document.fonts.ready;
  } catch {
    /* Font loading is best-effort; fall through to whatever is available. */
  }
}

export async function renderTextToCanvas({
  text,
  fontFamily,
  fontSize,
  color,
  padding = 24,
  radius = 12,
  background = { mode: 'transparent' },
  border = { width: 0 }
}) {
  const family = fontFamily ? `'${fontFamily}', sans-serif` : 'system-ui, sans-serif';
  const fontSpec = `${fontSize}px ${family}`;
  await ensureFont(fontSpec);

  const lines = String(text).split('\n');
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = fontSpec;

  const lineHeight = fontSize * LINE_HEIGHT;
  const textWidth = Math.max(...lines.map((l) => measure.measureText(l).width), 1);
  const textHeight = lineHeight * lines.length;

  const bw = border.width || 0;
  const width = Math.ceil(textWidth + padding * 2 + bw * 2);
  const height = Math.ceil(textHeight + padding * 2 + bw * 2);

  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  /* Clip everything to the rounded card so the backdrop and border agree. */
  const half = bw / 2;
  roundRect(ctx, half, half, width - bw, height - bw, radius);
  ctx.save();
  ctx.clip();

  if (background.mode === 'color' && background.color) {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, width, height);
  } else if (background.mode === 'image' && background.image) {
    drawCover(ctx, background.image, width, height);
  }
  ctx.restore();

  if (bw > 0) {
    ctx.lineWidth = bw;
    ctx.strokeStyle = border.color || 'rgba(0, 0, 0, 1)';
    ctx.stroke();
  }

  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillText(line, padding + bw, padding + bw + lineHeight * (i + 0.5));
  });

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/png');
  });
}

export async function copyImage(options) {
  if (!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)) {
    throw new Error('unsupported');
  }
  /* Safari only allows an async clipboard write if the ClipboardItem is
   * constructed synchronously from a promise — awaiting the blob first loses
   * the user gesture and the write is rejected. */
  const blob = renderTextToCanvas(options).then(canvasToBlob);
  return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export async function downloadImage(options, filename = 'fonts-erinskidds.png') {
  const blob = await canvasToBlob(await renderTextToCanvas(options));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Uploaded file -> decoded <img>, ready to draw onto the canvas. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}
