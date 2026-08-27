/* Color helpers shared by the preview, the rows and the clipboard. */

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

export function toRgba(hex, alpha) {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

/* Rich-text targets (Notes, Mail, Word) convert pasted HTML to RTF, which has
 * no alpha channel — a translucent rgba() is dropped and the paste lands
 * black. Flatten alpha against the destination background so the copy keeps a
 * visible color that matches what's on screen. */
export function toOpaqueHex(hex, alpha, theme) {
  const c = hexToRgb(hex);
  const bg = theme === 'dark' ? 0 : 255;
  const mix = (v) => {
    const n = Math.round(v * alpha + bg * (1 - alpha));
    return n.toString(16).padStart(2, '0');
  };
  return `#${mix(c.r)}${mix(c.g)}${mix(c.b)}`;
}
