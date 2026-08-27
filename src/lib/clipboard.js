/* Clipboard writes. Plain copies are trivial; the rich copy is the fiddly one
 * because it has to survive Apple Notes' HTML-to-RTF conversion. */

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

export function copyPlain(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return legacyCopy(text);
}

/* A single styled span is all Pages, Mail and Word need. The charset rides on
 * the blob's MIME type rather than a <meta> tag, so no document wrapper is
 * required to keep non-ASCII glyphs intact. */
export function buildRichHtml({ text, hex, family, size }) {
  let style = `color:${hex};`;
  if (family) style += `font-family:'${family}', sans-serif;`;
  style += `font-size:${size}px;white-space:pre-wrap;`;
  return `<span style="${style}">${escapeHtml(text)}</span>`;
}

export function copyRich(options) {
  const html = buildRichHtml(options);
  const { text } = options;

  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    return navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html;charset=utf-8' }),
      'text/plain': new Blob([text], { type: 'text/plain;charset=utf-8' })
    })]).catch(() => (
      /* Safari rejects async writes that lose the user gesture, and some
       * browsers refuse the text/html type outright. */
      legacyRichCopy(html, text)
    ));
  }
  return legacyRichCopy(html, text);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
}

function legacyRichCopy(html, text) {
  const host = document.createElement('div');
  host.contentEditable = 'true';
  host.innerHTML = html;
  host.style.position = 'fixed';
  host.style.left = '-9999px';
  document.body.appendChild(host);
  const range = document.createRange();
  range.selectNodeContents(host);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  const ok = document.execCommand('copy');
  sel.removeAllRanges();
  document.body.removeChild(host);
  return ok ? Promise.resolve() : legacyCopy(text);
}
