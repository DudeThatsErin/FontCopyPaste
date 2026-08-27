import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UnicodeFonts } from './unicode-fonts.js';
import { GoogleFonts } from './google-fonts.js';
import { toOpaqueHex, toRgba } from './lib/color.js';
import { copyPlain } from './lib/clipboard.js';
import { copyImage, downloadImage } from './lib/image.js';
import { read, usePersistentState, write } from './lib/storage.js';
import ResultList from './components/ResultList.jsx';
import EmojiPicker from './components/EmojiPicker.jsx';
import ImageSettings from './components/ImageSettings.jsx';
import ImagePreview from './components/ImagePreview.jsx';

const TABS = [
  { id: 'unicode', label: 'Unicode fonts' },
  { id: 'google', label: 'Google Fonts' },
  { id: 'favorites', label: '♥ Favorites' }
];

const unicodeById = Object.fromEntries(UnicodeFonts.styles.map((s) => [s.id, s]));
const googleById = Object.fromEntries(GoogleFonts.all.map((f) => [f.id, f]));

function defaultTheme() {
  const saved = read('theme', null);
  if (saved) return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/* Debounce a fast-changing value (typing) so we don't re-transform a few
 * hundred styles on every keystroke. */
function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function App() {
  const [text, setText] = usePersistentState('text', 'Hello Erin');
  const [color, setColor] = usePersistentState('color', '#7c5cff');
  const [alpha, setAlpha] = usePersistentState('alpha', '1');
  const [size, setSize] = usePersistentState('size', '24');
  const [favorites, setFavorites] = usePersistentState('favorites', []);
  const [theme, setTheme] = usePersistentState('theme', defaultTheme());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('unicode');
  const [previewId, setPreviewId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  /* Image-export styling. The chosen background image is a decoded <img> held
   * in memory only — a data URL big enough to be a nice backdrop would blow
   * the localStorage quota. */
  const [imageStyle, setImageStyle] = useState(() => ({
    open: false,
    bgMode: read('bgMode', 'transparent'),
    bgColor: read('bgColor', '#ffffff'),
    bgAlpha: read('bgAlpha', '1'),
    padding: read('padding', '24'),
    radius: read('radius', '12'),
    borderWidth: read('borderWidth', '0'),
    borderColor: read('borderColor', '#7c5cff'),
    borderAlpha: read('borderAlpha', '1'),
    bgImage: null,
    bgImageName: ''
  }));

  /* `open` is transient and `bgImage` is a decoded <img>, so neither persists. */
  const updateImageStyle = useCallback((patch) => {
    setImageStyle((prev) => ({ ...prev, ...patch }));
    Object.entries(patch).forEach(([k, v]) => {
      if (k !== 'open' && k !== 'bgImage') write(k, v);
    });
  }, []);

  const textareaRef = useRef(null);

  const debouncedText = useDebounced(text, 140);
  const debouncedSearch = useDebounced(search, 120);

  const sourceText = debouncedText || 'Hello Erin';
  const rgba = toRgba(color, alpha);
  const opaqueHex = toOpaqueHex(color, parseFloat(alpha), theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toastTimer = useRef(null);
  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 1800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const resolve = useCallback((id) => {
    const s = unicodeById[id];
    if (s) return { id, name: s.name, kind: 'unicode', group: s.group, output: s.apply(sourceText) };
    const g = googleById[id];
    if (g) return { id, name: g.name, kind: 'google', group: g.group, family: g.family, output: sourceText };
    return null;
  }, [sourceText]);

  const matches = useCallback((name, group) => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return true;
    return `${name} ${group}`.toLowerCase().includes(q);
  }, [debouncedSearch]);

  const unicodeItems = useMemo(() => (
    UnicodeFonts.styles
      .filter((s) => matches(s.name, s.group))
      .map((s) => ({ id: s.id, name: s.name, kind: 'unicode', group: s.group, output: s.apply(sourceText) }))
  ), [sourceText, matches]);

  const googleItems = useMemo(() => (
    GoogleFonts.all
      .filter((f) => matches(f.name, f.group))
      .map((f) => ({ id: f.id, name: f.name, kind: 'google', group: f.group, family: f.family, output: sourceText }))
  ), [sourceText, matches]);

  const favoriteItems = useMemo(() => (
    favorites.map(resolve).filter(Boolean).filter((i) => matches(i.name, i.group))
  ), [favorites, resolve, matches]);

  const toggleFav = useCallback((id) => {
    const adding = !favorites.includes(id);
    setFavorites(adding ? [id, ...favorites] : favorites.filter((f) => f !== id));
    toast(adding ? 'Added to favorites' : 'Removed from favorites');
  }, [favorites, setFavorites, toast]);

  const preview = previewId ? resolve(previewId) : null;
  const previewText = preview ? preview.output : sourceText;
  const previewFamily = preview?.family || null;

  useEffect(() => {
    if (previewFamily) GoogleFonts.load(previewFamily);
  }, [previewFamily]);

  /* The PNG keeps the true rgba — canvas has a real alpha channel, unlike the
   * RTF conversion the rich-text path has to survive. */
  const imageOptions = useMemo(() => ({
    color: rgba,
    fontSize: parseInt(size, 10),
    padding: parseInt(imageStyle.padding, 10),
    radius: parseInt(imageStyle.radius, 10),
    background: {
      mode: imageStyle.bgMode,
      color: toRgba(imageStyle.bgColor, imageStyle.bgAlpha),
      image: imageStyle.bgImage
    },
    border: {
      width: parseInt(imageStyle.borderWidth, 10),
      color: toRgba(imageStyle.borderColor, imageStyle.borderAlpha)
    }
  }), [rgba, size, imageStyle]);

  const previewImageOptions = useMemo(() => ({
    ...imageOptions,
    text: previewText,
    fontFamily: previewFamily
  }), [imageOptions, previewText, previewFamily]);

  const insertEmoji = useCallback((emoji) => {
    const el = textareaRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }, [text, setText]);

  const rowProps = useCallback((item) => ({
    rgba,
    opaqueHex,
    size,
    imageOptions,
    isPreviewing: previewId === item.id,
    isFav: favorites.includes(item.id),
    onToggleFav: toggleFav,
    onPreview: (i) => setPreviewId(i.id),
    onToast: toast
  }), [rgba, opaqueHex, size, imageOptions, previewId, favorites, toggleFav, toast]);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">𝔉</span>
          <span className="brand-text">fonts<span className="brand-dim">.erinskidds.com</span></span>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            type="button"
            aria-label="Toggle light or dark mode"
            title="Toggle light / dark"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="panel input-panel">
          <div className="label-row">
            <label className="field-label" htmlFor="sourceText">Your text</label>
            <EmojiPicker onInsert={insertEmoji} />
          </div>
          <textarea
            id="sourceText"
            ref={textareaRef}
            rows="3"
            spellCheck="false"
            placeholder="Type something… 🌸"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="controls">
            <div className="control">
              <label className="field-label" htmlFor="colorPicker">Color</label>
              <div className="color-row">
                <input
                  type="color"
                  id="colorPicker"
                  aria-label="Font color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <div className="alpha-wrap">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    aria-label="Color opacity"
                    value={alpha}
                    onChange={(e) => setAlpha(e.target.value)}
                  />
                  <span className="alpha-value">{Math.round(parseFloat(alpha) * 100)}%</span>
                </div>
                <output className="rgba-readout">{rgba}</output>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => copyPlain(rgba).then(
                    () => toast(`Color copied: ${rgba}`),
                    () => toast('Copy blocked by browser')
                  )}
                >
                  Copy rgba
                </button>
              </div>
            </div>

            <div className="control">
              <label className="field-label" htmlFor="sizeSlider">Preview size</label>
              <div className="color-row">
                <input
                  type="range"
                  id="sizeSlider"
                  min="14"
                  max="56"
                  step="1"
                  aria-label="Preview font size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
                <span className="alpha-value">{size}px</span>
              </div>
            </div>

            <div className="control">
              <label className="field-label" htmlFor="search">Find a style by name</label>
              <input
                type="search"
                id="search"
                placeholder="e.g. cursive, bold, circled…"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <p className="sub-hint">
                Searches style <em>names</em>, not your text — to change the words, edit
                &ldquo;Your text&rdquo; above.
              </p>
            </div>
          </div>

          <ImageSettings settings={imageStyle} update={updateImageStyle} onToast={toast} />

          <div className="image-stage">
            <div className="image-stage-head">
              <div>
                <span className="preview-tag preview-tag-inline">Image preview</span>
                <p className="stage-title">
                  {preview
                    ? `${preview.name}${preview.kind === 'google' ? ' · Google Font' : ''}`
                    : 'Default text style'}
                </p>
              </div>
              <div className="image-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => copyImage(previewImageOptions).then(
                    () => toast('Image copied — exact colors, paste into Notes'),
                    () => downloadImage(previewImageOptions).then(
                      () => toast('Clipboard images unsupported here — image downloaded'),
                      () => toast('Couldn’t create the image')
                    )
                  )}
                >
                  Copy image
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => downloadImage(previewImageOptions).then(
                    () => toast('Image downloaded'),
                    () => toast('Couldn’t create the image')
                  )}
                >
                  Download PNG
                </button>
              </div>
            </div>
            <ImagePreview options={previewImageOptions} />
            <p className="sub-hint">
              These settings apply to <strong>every</strong> style below — tap any style&rsquo;s
              sample to preview it here, or just hit its <strong>Copy as image</strong> button
              to get that font with this exact styling.
            </p>
          </div>
        </section>

        <nav className="tabs" role="tablist">
          {TABS.map((t) => {
            const count = t.id === 'unicode' ? UnicodeFonts.styles.length
              : t.id === 'google' ? GoogleFonts.all.length
                : (favorites.length || '');
            return (
              <button
                key={t.id}
                className={`tab${tab === t.id ? ' is-active' : ''}`}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label} <span className="count">{count}</span>
              </button>
            );
          })}
        </nav>

        {tab === 'unicode' && (
          <section className="panel tab-panel is-active" role="tabpanel">
            <p className="note">
              These are Unicode characters, not fonts — so they keep their shape when you
              paste into <strong>Apple Notes</strong>, Messages, Instagram, anywhere.
            </p>
            <ul className="note note-list">
              <li><strong>Copy text</strong> — styled Unicode text; works in Notes.</li>
              <li><strong>Copy as image</strong> — preserves the exact colors in Notes, but isn&rsquo;t editable or searchable.</li>
              <li><strong>Copy rich text</strong> — best for Pages, Mail and Word; <em>not supported by iPhone Notes</em>.</li>
            </ul>
            <p className="sub-hint">
              Tap any sample below to show it in the preview at the top.
              {search && ` · Showing ${unicodeItems.length} of ${UnicodeFonts.styles.length} styles`}
            </p>
            <div className="results">
              <ResultList
                items={unicodeItems}
                emptyMessage="No style names match that search."
                rowProps={rowProps}
              />
            </div>
          </section>
        )}

        {tab === 'google' && (
          <section className="panel tab-panel is-active" role="tabpanel">
            <p className="note">
              Real fonts rendered live. A font is <em>styling</em>, not characters, so the
              typeface only survives a text paste in apps that have that font installed.
              <strong> Copy as image</strong> is the only option that reproduces the
              typeface and color exactly everywhere — including iPhone Notes.
            </p>
            <p className="sub-hint">
              Tap any sample below to show it in the preview at the top.
              {search && ` · Showing ${googleItems.length} of ${GoogleFonts.all.length} fonts`}
            </p>
            <div className="results results-google">
              <ResultList
                items={googleItems}
                emptyMessage="No font names match that search."
                rowProps={rowProps}
              />
            </div>
          </section>
        )}

        {tab === 'favorites' && (
          <section className="panel tab-panel is-active" role="tabpanel">
            <div className="fav-toolbar">
              <p className="note note-inline">Saved in this browser. Drag isn&rsquo;t needed — newest first.</p>
              <button
                className="ghost-btn danger"
                type="button"
                onClick={() => {
                  if (!favorites.length) { toast('Nothing to clear'); return; }
                  if (!confirm(`Remove all ${favorites.length} favorites?`)) return;
                  setFavorites([]);
                  toast('Favorites cleared');
                }}
              >
                Clear all
              </button>
            </div>
            <div className="results">
              <ResultList
                items={favoriteItems}
                grouped={false}
                emptyMessage={favorites.length
                  ? 'No favorites match that filter.'
                  : 'No favorites yet — tap ♡ on any style to save it here.'}
                rowProps={rowProps}
              />
            </div>
          </section>
        )}
      </main>

      <div className={`toast${toastMsg ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </>
  );
}
