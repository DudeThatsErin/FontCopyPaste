import { useRef } from 'react';
import { loadImageFile } from '../lib/image.js';

function positive(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

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

  const updateDimension = (key, raw) => {
    const value = raw.replace(/[^0-9]/g, '');
    const otherKey = key === 'outputWidth' ? 'outputHeight' : 'outputWidth';
    const current = positive(settings[key]);
    const other = positive(settings[otherKey]);
    const next = positive(value);

    if (settings.lockAspect && current && other && next) {
      const ratio = settings.outputWidth / settings.outputHeight;
      if (key === 'outputWidth') {
        update({ outputWidth: value, outputHeight: String(Math.max(1, Math.round(next / ratio))) });
      } else {
        update({ outputHeight: value, outputWidth: String(Math.max(1, Math.round(next * ratio))) });
      }
      return;
    }
    update({ [key]: value });
  };

  const marginField = (key, label) => (
    <label className="mini-field">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="1"
        value={settings[key]}
        onChange={(e) => update({ [key]: e.target.value })}
      />
    </label>
  );

  return (
    <details className="image-settings" open={settings.open}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          update({ open: !settings.open });
        }}
      >
        Image + HTML layout
        <span className="summary-hint">size, alignment, spacing, background</span>
      </summary>

      <div className="image-grid">
        <div className="control settings-block">
          <span className="field-label">Output size</span>
          <div className="dimension-row">
            <label className="mini-field dimension-field">
              <span>Width</span>
              <div className="unit-input">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Auto"
                  value={settings.outputWidth}
                  onChange={(e) => updateDimension('outputWidth', e.target.value)}
                />
                <span>px</span>
              </div>
            </label>
            <span className="dimension-x" aria-hidden="true">×</span>
            <label className="mini-field dimension-field">
              <span>Height</span>
              <div className="unit-input">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Auto"
                  value={settings.outputHeight}
                  onChange={(e) => updateDimension('outputHeight', e.target.value)}
                />
                <span>px</span>
              </div>
            </label>
          </div>
          <div className="setting-inline-row">
            <label className="check-label">
              <input
                type="checkbox"
                checked={settings.lockAspect}
                onChange={(e) => update({ lockAspect: e.target.checked })}
              />
              Keep aspect ratio
            </label>
            <button
              type="button"
              className="ghost-btn compact-btn"
              onClick={() => update({ outputWidth: '', outputHeight: '' })}
            >
              Auto size
            </button>
          </div>
          <p className="sub-hint">
            Leave either dimension blank for automatic sizing. When both dimensions are set,
            turn on aspect lock to keep their current ratio while editing either value.
          </p>
        </div>

        <div className="control settings-block">
          <span className="field-label">Text alignment</span>
          <div className="seg" role="group" aria-label="Text alignment">
            {[['left', 'Left'], ['center', 'Center'], ['right', 'Right']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`seg-btn${settings.textAlign === value ? ' is-active' : ''}`}
                onClick={() => update({ textAlign: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="control settings-block">
          <span className="field-label">Text margin</span>
          <div className="margin-grid">
            {marginField('marginTop', 'Top')}
            {marginField('marginRight', 'Right')}
            {marginField('marginBottom', 'Bottom')}
            {marginField('marginLeft', 'Left')}
          </div>
          <p className="sub-hint">Margin sits between the text and the card padding.</p>
        </div>

        <div className="control settings-block">
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
          <div className="control settings-block">
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
          <div className="control settings-block">
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
            <p className="sub-hint">Background images are included in PNG copies only, never in Copy HTML.</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
        />

        <div className="control settings-block">
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

        <div className="control settings-block">
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

        <div className="control settings-block">
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
