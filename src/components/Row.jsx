import { useEffect, useRef, useState } from 'react';
import { GoogleFonts } from '../google-fonts.js';
import { copyPlain, copyRich } from '../lib/clipboard.js';
import { copyImage, downloadImage } from '../lib/image.js';

/* Fetch a webfont only once the row scrolls into view — the catalog is a few
 * hundred families and eager loading would stall the page. */
function useLazyFont(family) {
  const ref = useRef(null);
  useEffect(() => {
    if (!family) return undefined;
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      GoogleFonts.load(family);
      return undefined;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        GoogleFonts.load(family);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '400px 0px' });
    obs.observe(node);
    return () => obs.disconnect();
  }, [family]);
  return ref;
}

/* Swaps a button's label to "Copied" for a beat after a successful copy. */
function useFlash() {
  const [flashed, setFlashed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = () => {
    setFlashed(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlashed(false), 1100);
  };
  return [flashed, flash];
}

export default function Row({
  item, rgba, opaqueHex, size, imageOptions,
  isPreviewing, isFav, onToggleFav, onPreview, onToast
}) {
  const isGoogle = item.kind === 'google';
  const sampleRef = useLazyFont(isGoogle ? item.family : null);
  const [textFlashed, flashText] = useFlash();
  const [imageFlashed, flashImage] = useFlash();
  const [richFlashed, flashRich] = useFlash();

  const imageArgs = () => ({
    ...imageOptions,
    text: item.output,
    fontFamily: isGoogle ? item.family : null
  });

  const handleText = () => {
    copyPlain(item.output).then(() => {
      flashText();
      onPreview(item);
      onToast(isGoogle ? 'Plain text copied (no font styling)' : 'Copied — paste anywhere');
    }, () => onToast('Copy blocked by browser'));
  };

  const handleImage = () => {
    onPreview(item);
    /* Make sure the @font-face exists before the canvas asks for it — a row
     * copied before it scrolled into view would otherwise render in the
     * fallback face. */
    if (isGoogle) GoogleFonts.load(item.family);
    copyImage(imageArgs()).then(() => {
      flashImage();
      onToast('Image copied — exact colors, paste into Notes');
    }, () => {
      /* Firefox and older Safari can't put a PNG on the clipboard at all, so
       * fall back to saving the file rather than failing outright. */
      downloadImage(imageArgs()).then(
        () => onToast('Clipboard images unsupported here — image downloaded'),
        () => onToast('Couldn’t create the image')
      );
    });
  };

  const handleRich = () => {
    copyRich({
      text: item.output,
      hex: opaqueHex,
      family: isGoogle ? item.family : null,
      size
    }).then(() => {
      flashRich();
      onPreview(item);
      onToast('Rich text copied — best in Pages, Mail, Word');
    }, () => onToast('Rich copy not supported here'));
  };

  return (
    <div className={`row${isPreviewing ? ' is-previewing' : ''}`} data-id={item.id}>
      <div className="row-main">
        <div className="row-name">
          {item.name}{isGoogle ? ' · Google Font' : ''}
          {isPreviewing && <span className="previewing-tag">previewing above</span>}
        </div>
        <div
          className="row-sample"
          ref={sampleRef}
          title="Tap to show this style in the preview at the top"
          onClick={() => onPreview(item)}
          style={{
            color: rgba,
            fontSize: `${size}px`,
            fontFamily: isGoogle ? `'${item.family}', sans-serif` : undefined
          }}
        >
          {item.output}
        </div>
      </div>
      <div className="row-actions">
        <button
          type="button"
          className={`act${textFlashed ? ' is-done' : ''}`}
          title="Plain styled Unicode text — works in Notes, Messages, anywhere"
          onClick={handleText}
        >
          {textFlashed ? 'Copied' : 'Copy text'}
        </button>
        <button
          type="button"
          className={`act act-primary${imageFlashed ? ' is-done' : ''}`}
          title="PNG with your exact colors — pastes into Notes on iPhone and Mac, but isn't editable text"
          onClick={handleImage}
        >
          {imageFlashed ? 'Copied' : 'Copy as image'}
        </button>
        <button
          type="button"
          className={`act${richFlashed ? ' is-done' : ''}`}
          title="Colored rich text — best for Pages, Mail and Word. Not supported by iPhone Notes."
          onClick={handleRich}
        >
          {richFlashed ? 'Copied' : 'Copy rich text'}
        </button>
        <button
          type="button"
          className={`heart${isFav ? ' is-on' : ''}`}
          aria-label="Save to favorites"
          onClick={() => onToggleFav(item.id)}
        >
          {isFav ? '♥' : '♡'}
        </button>
      </div>
    </div>
  );
}
