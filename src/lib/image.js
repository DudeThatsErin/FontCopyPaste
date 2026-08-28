/* Renders styled text to a PNG. This is the only copy path that reproduces
 * color exactly everywhere -- including iPhone Notes, which drops pasted HTML
 * color -- at the cost of the result no longer being editable text. */

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

  ctx.drawImage(
    img,
    (w - dw) / 2,
    (h - dh) / 2,
    dw,
    dh
  );
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

function positiveInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function renderTextToCanvas({
  text,
  fontFamily,
  fontSize,
  color,

  // Optional explicit image dimensions.
  // null / blank keeps the original automatic sizing behavior.
  width = null,
  height = null,

  padding = 24,
  radius = 12,

  // Text alignment inside the available content area.
  align = 'left',

  // Additional space around the text itself.
  margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },

  background = { mode: 'transparent' },
  border = { width: 0 }
}) {
  const family = fontFamily
    ? `'${fontFamily}', sans-serif`
    : 'system-ui, sans-serif';

  const fontSpec = `${fontSize}px ${family}`;

  await ensureFont(fontSpec);

  const lines = String(text).split('\n');

  const measure = document
    .createElement('canvas')
    .getContext('2d');

  measure.font = fontSpec;

  const lineHeight = fontSize * LINE_HEIGHT;

  const textWidth = Math.max(
    ...lines.map((line) => measure.measureText(line).width),
    1
  );

  const textHeight = lineHeight * lines.length;

  const bw = Number(border.width) || 0;
  const p = Number(padding) || 0;

  const mt = Number(margin?.top) || 0;
  const mr = Number(margin?.right) || 0;
  const mb = Number(margin?.bottom) || 0;
  const ml = Number(margin?.left) || 0;

  /*
   * Automatic dimensions preserve the original behavior while also accounting
   * for the new per-side text margins.
   */
  const naturalWidth = Math.ceil(
    textWidth +
    p * 2 +
    bw * 2 +
    ml +
    mr
  );

  const naturalHeight = Math.ceil(
    textHeight +
    p * 2 +
    bw * 2 +
    mt +
    mb
  );

  /*
   * Explicit width / height override automatic sizing.
   *
   * Aspect-ratio locking is handled by the UI because the renderer only needs
   * to know the final requested dimensions.
   */
  const canvasWidth = positiveInt(width) || naturalWidth;
  const canvasHeight = positiveInt(height) || naturalHeight;

  const canvas = document.createElement('canvas');

  canvas.width = canvasWidth * SCALE;
  canvas.height = canvasHeight * SCALE;

  const ctx = canvas.getContext('2d');

  ctx.scale(SCALE, SCALE);

  /*
   * Clip everything to the rounded card so the background image/color follows
   * the same rounded corners as the border.
   */
  const half = bw / 2;

  roundRect(
    ctx,
    half,
    half,
    Math.max(0, canvasWidth - bw),
    Math.max(0, canvasHeight - bw),
    radius
  );

  ctx.save();
  ctx.clip();

  if (
    background.mode === 'color' &&
    background.color
  ) {
    ctx.fillStyle = background.color;
    ctx.fillRect(
      0,
      0,
      canvasWidth,
      canvasHeight
    );
  } else if (
    background.mode === 'image' &&
    background.image
  ) {
    drawCover(
      ctx,
      background.image,
      canvasWidth,
      canvasHeight
    );
  }

  ctx.restore();

  /*
   * Draw the border after the background so it stays crisp.
   */
  if (bw > 0) {
    roundRect(
      ctx,
      half,
      half,
      Math.max(0, canvasWidth - bw),
      Math.max(0, canvasHeight - bw),
      radius
    );

    ctx.lineWidth = bw;

    ctx.strokeStyle =
      border.color ||
      'rgba(0, 0, 0, 1)';

    ctx.stroke();
  }

  /*
   * Calculate the usable horizontal text region.
   *
   * Padding belongs to the card.
   * Margin belongs to the text.
   */
  const leftEdge =
    bw +
    p +
    ml;

  const rightEdge =
    canvasWidth -
    bw -
    p -
    mr;

  const contentWidth = Math.max(
    0,
    rightEdge - leftEdge
  );

  ctx.save();

  /*
   * Keep text from painting outside the rounded canvas when a manually chosen
   * width or height is smaller than the natural text size.
   */
  roundRect(
    ctx,
    half,
    half,
    Math.max(0, canvasWidth - bw),
    Math.max(0, canvasHeight - bw),
    radius
  );

  ctx.clip();

  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  ctx.textAlign =
    align === 'center'
      ? 'center'
      : align === 'right'
        ? 'right'
        : 'left';

  /*
   * Horizontal starting position depends on alignment.
   */
  let x = leftEdge;

  if (align === 'center') {
    x = leftEdge + contentWidth / 2;
  }

  if (align === 'right') {
    x = rightEdge;
  }

  lines.forEach((line, i) => {
    const y =
      bw +
      p +
      mt +
      lineHeight * (i + 0.5);

    ctx.fillText(
      line,
      x,
      y
    );
  });

  ctx.restore();

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (
        blob
          ? resolve(blob)
          : reject(new Error('encode failed'))
      ),
      'image/png'
    );
  });
}

export async function copyImage(options) {
  if (
    !(
      window.ClipboardItem &&
      navigator.clipboard &&
      navigator.clipboard.write
    )
  ) {
    throw new Error('unsupported');
  }

  /*
   * Safari only allows an async clipboard write if the ClipboardItem is
   * constructed synchronously from a promise -- awaiting the blob first loses
   * the user gesture and the write is rejected.
   */
  const blob = renderTextToCanvas(options)
    .then(canvasToBlob);

  return navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob
    })
  ]);
}

export async function downloadImage(
  options,
  filename = 'fonts-erinskidds.png'
) {
  const canvas =
    await renderTextToCanvas(options);

  const blob =
    await canvasToBlob(canvas);

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;
  a.download = filename;

  a.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

/*
 * Uploaded file -> decoded <img> for the canvas, plus the object URL so the
 * same picture can back the on-page rows via CSS.
 */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url =
      URL.createObjectURL(file);

    const img =
      new Image();

    img.onload = () => {
      resolve({
        img,
        url
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };

    img.src = url;
  });
}