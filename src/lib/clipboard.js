/* Clipboard writes. Plain copies are trivial; the rich copy is the fiddly one
 * because it has to survive Apple Notes' HTML-to-RTF conversion. */

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[c]
    )
  );
}

function escapeCssString(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

export function copyPlain(text) {
  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
    return navigator.clipboard.writeText(text);
  }

  return legacyCopy(text);
}

/*
 * A single styled span is all Pages, Mail and Word need. The charset rides on
 * the blob's MIME type rather than a <meta> tag, so no document wrapper is
 * required to keep non-ASCII glyphs intact.
 */
export function buildRichHtml({
  text,
  hex,
  family,
  size
}) {
  let style =
    `color:${hex};`;

  if (family) {
    style +=
      `font-family:'${escapeCssString(family)}', sans-serif;`;
  }

  style +=
    `font-size:${size}px;white-space:pre-wrap;`;

  return (
    `<span style="${style}">` +
    `${escapeHtml(text)}` +
    `</span>`
  );
}

export function copyRich(options) {
  const html =
    buildRichHtml(options);

  const { text } =
    options;

  if (
    window.ClipboardItem &&
    navigator.clipboard &&
    navigator.clipboard.write
  ) {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob(
          [html],
          {
            type: 'text/html;charset=utf-8'
          }
        ),

        'text/plain': new Blob(
          [text],
          {
            type: 'text/plain;charset=utf-8'
          }
        )
      })
    ]).catch(() => (
      /*
       * Safari rejects async writes that lose the user gesture, and some
       * browsers refuse the text/html type outright.
       */
      legacyRichCopy(
        html,
        text
      )
    ));
  }

  return legacyRichCopy(
    html,
    text
  );
}

/*
 * Build literal HTML intended for Markdown apps such as Obsidian.
 *
 * IMPORTANT:
 * Uploaded background images are intentionally NOT included.
 *
 * If the user wants the background image, they can use Copy Image instead.
 */
export function buildObsidianHtml({
  text,
  color,
  family,
  size,

  width,
  height,

  padding = 0,
  radius = 0,

  background = {
    mode: 'transparent'
  },

  border = {
    width: 0
  },

  align = 'left',

  margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
}) {
  const w =
    Number.parseInt(width, 10);

  const h =
    Number.parseInt(height, 10);

  const bw =
    Number.parseInt(
      border?.width,
      10
    ) || 0;

  const p =
    Number.parseInt(
      padding,
      10
    ) || 0;

  const r =
    Number.parseInt(
      radius,
      10
    ) || 0;

  const mt =
    Number.parseInt(
      margin?.top,
      10
    ) || 0;

  const mr =
    Number.parseInt(
      margin?.right,
      10
    ) || 0;

  const mb =
    Number.parseInt(
      margin?.bottom,
      10
    ) || 0;

  const ml =
    Number.parseInt(
      margin?.left,
      10
    ) || 0;

  /*
   * OUTER CARD
   *
   * This contains the dimensions, padding, radius, solid background color
   * and border.
   *
   * Background images are deliberately excluded.
   */
  let outer =
    'box-sizing:border-box;' +
    'display:block;';

  if (
    Number.isFinite(w) &&
    w > 0
  ) {
    outer +=
      `width:${w}px;`;
  }

  if (
    Number.isFinite(h) &&
    h > 0
  ) {
    outer +=
      `height:${h}px;` +
      'overflow:hidden;';
  }

  outer +=
    `padding:${p}px;` +
    `border-radius:${r}px;`;

  /*
   * Only copy a background when it is a solid color.
   *
   * background.mode === "image" is intentionally ignored.
   */
  if (
    background?.mode === 'color' &&
    background.color
  ) {
    outer +=
      `background-color:${background.color};`;
  }

  if (bw > 0) {
    outer +=
      `border:${bw}px solid ` +
      `${border.color || 'rgba(0,0,0,1)'};`;
  }

  /*
   * INNER TEXT BLOCK
   *
   * Text margins are kept separate from card padding.
   */
  let inner =
    `margin:${mt}px ${mr}px ${mb}px ${ml}px;`;

  inner +=
    `color:${color};` +
    `font-size:${size}px;` +
    'line-height:1.3;' +
    `text-align:${align};` +
    'white-space:pre-wrap;' +
    'overflow-wrap:anywhere;';

  if (family) {
    inner +=
      `font-family:'${escapeCssString(family)}', sans-serif;`;
  }

  return (
    `<div style="${outer}">` +
      `<div style="${inner}">` +
        `${escapeHtml(text)}` +
      `</div>` +
    `</div>`
  );
}

/*
 * Copy the actual HTML SOURCE as plain text.
 *
 * This is intentional for Obsidian:
 *
 * clicking "Copy HTML" gives you:
 *
 * <div style="...">...</div>
 *
 * on the clipboard. When pasted into the Markdown source, Obsidian can render
 * that HTML while the note itself remains editable.
 */
export function copyHtml(options) {
  return copyPlain(
    buildObsidianHtml(options)
  );
}

function legacyCopy(text) {
  const ta =
    document.createElement('textarea');

  ta.value = text;
  ta.setAttribute(
    'readonly',
    ''
  );

  ta.style.position =
    'fixed';

  ta.style.opacity =
    '0';

  document.body.appendChild(ta);

  ta.select();

  const ok =
    document.execCommand('copy');

  document.body.removeChild(ta);

  return ok
    ? Promise.resolve()
    : Promise.reject(
        new Error('copy failed')
      );
}

function legacyRichCopy(
  html,
  text
) {
  const host =
    document.createElement('div');

  host.contentEditable =
    'true';

  host.innerHTML =
    html;

  host.style.position =
    'fixed';

  host.style.left =
    '-9999px';

  document.body.appendChild(host);

  const range =
    document.createRange();

  range.selectNodeContents(host);

  const sel =
    window.getSelection();

  sel.removeAllRanges();
  sel.addRange(range);

  const ok =
    document.execCommand('copy');

  sel.removeAllRanges();

  document.body.removeChild(host);

  return ok
    ? Promise.resolve()
    : legacyCopy(text);
}