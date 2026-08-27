import { useRef } from 'react';
import { loadImageFile } from '../lib/image.js';

/* Controls that only affect the PNG export — the on-page preview and the text
 * copies ignore them. */
export default function ImageSettings({ settings, update, onToast }) {
  const fileRef = useRef(null);

  const pickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { onToast('That file isn’t an image'); return; }
    try {
      const { img, url } = await loadImageFile(file);
      update({ bgMode: 'image', bgImage: img, bgImageUrl: url, bgImageName: file.name });
      onToast('Background image set — it’s behind every style below');
    } catch {
      onToast('Couldn’t read that image');
    }
  };

  return (
    <details className="image-settings" open={settings.open}>
      <summary
        onClick={(e) => {
          /* Let React own the open state — the native toggle would race it. */
          e.preventDefault();
          update({ open: !settings.open });
        }}
      >
        Image export style
        <span className="summary-hint">background, padding, border</span>
      </summary>

      <div className="image-grid">
        <div className="control">
          <span className="field-label">Background</span>
          <div className="seg">
            {[['transparent', 'Transparent'], ['color', 'Color'], ['image', 'Image']].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`seg-btn${settings.bgMode === mode ? ' is-active' : ''}`}
                onClick={() => {
                  if (mode === 'image' && !settings.bgImage) { fileRef.current?.click(); return; }
                  update({ bgMode: mode });
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {settings.bgMode === 'color' && (
          <div className="control">
            <span className="field-label">Background color</span>
            <div className="color-row">
              <input
                type="color"
                aria-label="Background color"
                value={settings.bgColor}
                onChange={(e) => update({ bgColor: e.target.value })}
              />
              <div className="alpha-wrap">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  aria-label="Background opacity"
                  value={settings.bgAlpha}
                  onChange={(e) => update({ bgAlpha: e.target.value })}
                />
                <span className="alpha-value">{Math.round(parseFloat(settings.bgAlpha) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {settings.bgMode === 'image' && (
          <div className="control">
            <span className="field-label">Background image</span>
            <div className="color-row">
              <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>
                {settings.bgImage ? 'Replace image' : 'Choose image…'}
              </button>
              {settings.bgImage && (
                <>
                  <span className="file-name" title={settings.bgImageName}>{settings.bgImageName}</span>
                  <button
                    type="button"
                    className="ghost-btn danger"
                    onClick={() => update({
                      bgImage: null, bgImageUrl: '', bgImageName: '', bgMode: 'transparent'
                    })}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
        />

        <div className="control">
          <span className="field-label">Padding</span>
          <div className="color-row">
            <input
              type="range" min="0" max="80" step="1"
              aria-label="Image padding"
              value={settings.padding}
              onChange={(e) => update({ padding: e.target.value })}
            />
            <span className="alpha-value">{settings.padding}px</span>
          </div>
        </div>

        <div className="control">
          <span className="field-label">Corner radius</span>
          <div className="color-row">
            <input
              type="range" min="0" max="60" step="1"
              aria-label="Corner radius"
              value={settings.radius}
              onChange={(e) => update({ radius: e.target.value })}
            />
            <span className="alpha-value">{settings.radius}px</span>
          </div>
        </div>

        <div className="control">
          <span className="field-label">Border</span>
          <div className="color-row">
            <input
              type="range" min="0" max="24" step="1"
              aria-label="Border width"
              value={settings.borderWidth}
              onChange={(e) => update({ borderWidth: e.target.value })}
            />
            <span className="alpha-value">{settings.borderWidth}px</span>
            <input
              type="color"
              aria-label="Border color"
              value={settings.borderColor}
              onChange={(e) => update({ borderColor: e.target.value })}
            />
            <div className="alpha-wrap">
              <input
                type="range" min="0" max="1" step="0.01"
                aria-label="Border opacity"
                value={settings.borderAlpha}
                onChange={(e) => update({ borderAlpha: e.target.value })}
              />
              <span className="alpha-value">{Math.round(parseFloat(settings.borderAlpha) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
