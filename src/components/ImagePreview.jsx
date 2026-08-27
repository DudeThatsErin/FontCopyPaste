import { useEffect, useRef, useState } from 'react';
import { renderTextToCanvas } from '../lib/image.js';

/* Live render of exactly what "Copy as image" will produce, so the background,
 * padding and border can be dialled in before copying. */
export default function ImagePreview({ options }) {
  const holder = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    renderTextToCanvas(options).then((canvas) => {
      if (cancelled || !holder.current) return;
      canvas.style.width = `${canvas.width / 2}px`;
      canvas.style.height = 'auto';
      canvas.style.maxWidth = '100%';
      holder.current.replaceChildren(canvas);
      setError('');
    }).catch(() => {
      if (!cancelled) setError('Couldn’t render that image.');
    });
    return () => { cancelled = true; };
  }, [options]);

  return (
    <div className="image-preview">
      <span className="preview-tag">Image export</span>
      <div className="image-preview-canvas checker" ref={holder} />
      {error && <p className="empty">{error}</p>}
    </div>
  );
}
