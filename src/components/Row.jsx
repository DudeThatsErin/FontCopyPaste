import { useEffect, useRef, useState } from 'react';
import { GoogleFonts } from '../google-fonts.js';
import { copyHtml, copyPlain, copyRich } from '../lib/clipboard.js';
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
  item, rgba, opaqueHex, size, imageOptions, htmlOptions, cardStyle, textLayoutStyle,
  isFav, onToggleFav, onToast
}) {
  const isGoogle = item.kind === 'google';
  const sampleRef = useLazyFont(isGoogle ? item.family : null);
  const [textFlashed, flashText] = useFlash();
  const [imageFlashed, flashImage] = useFlash();
  const [savedFlashed, flashSaved] = useFlash();
  const [richFlashed, flashRich] = useFlash();
  const [htmlFlashed, flashHtml] = useFlash();

  const imageArgs = () => {
    if (isGoogle) GoogleFonts.load(item.family);
    return { ...imageOptions, text: item.output, fontFamily: isGoogle ? item.family : null };
  };

  const htmlArgs = () => ({
    ...htmlOptions,
    text: item.output,
    family: isGoogle ? item.family : null
  });

  const fileName = `${item.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;

  const handleText = () => {
    copyPlain(item.output).then(() => {
      flashText();
      onToast(isGoogle ? 'Plain text copied (no font styling)' : 'Copied — paste anywhere');
    }, () => onToast('Copy blocked by browser'));
  };

  const handleImage = () => {
    copyImage(imageArgs()).then(() => {
      flashImage();
      onToast('Image copied — includes the background image');
    }, () => {
      downloadImage(imageArgs(), fileName).then(
        () => onToast('Clipboard images unsupported here — image downloaded'),
        () => onToast('Couldn’t create the image')
      );
    });
  };

  const handleDownload = () => {
    downloadImage(imageArgs(), fileName).then(
      () => { flashSaved(); onToast(`Saved ${fileName}`); },
      () => onToast('Couldn’t create the image')
    );
  };

  const handleRich = () => {
    copyRich({
      text: item.output,
      hex: opaqueHex,
      family: isGoogle ? item.family : null,
      size
    }).then(() => {
      flashRich();
      onToast('Rich text copied — best in Pages, Mail, Word');
    }, () => onToast('Rich copy not supported here'));
  };

  const handleHtml = () => {
    copyHtml(htmlArgs()).then(() => {
      flashHtml();
      onToast('HTML copied — paste into Obsidian');
    }, () => onToast('HTML copy blocked by browser'));
  };

  return (
    <div className="row" data-id={item.id}>
      <div className="row-main">
        <div className="row-name">{item.name}{isGoogle ? ' · Google Font' : ''}</div>
        <div className="sample-card" style={cardStyle}>
          <div className="sample-text-wrap" style={textLayoutStyle}>
            <div
              className="row-sample"
              ref={sampleRef}
              style={{
                color: rgba,
                fontSize: `${size}px`,
                fontFamily: isGoogle ? `'${item.family}', sans-serif` : undefined
              }}
            >
              {item.output}
            </div>
          </div>
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
          className={`act${htmlFlashed ? ' is-done' : ''}`}
          title="Copy literal HTML source for Obsidian. Background images are excluded."
          onClick={handleHtml}
        >
          {htmlFlashed ? 'Copied' : 'Copy HTML'}
        </button>
        <button
          type="button"
          className={`act act-primary${imageFlashed ? ' is-done' : ''}`}
          title="PNG with your exact colors and background image"
          onClick={handleImage}
        >
          {imageFlashed ? 'Copied' : 'Copy image'}
        </button>
        <button
          type="button"
          className={`act${savedFlashed ? ' is-done' : ''}`}
          title="Save this style as a PNG file"
          onClick={handleDownload}
        >
          {savedFlashed ? 'Saved' : 'Download PNG'}
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
