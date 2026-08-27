import { useEffect, useRef, useState } from 'react';

const GROUPS = {
  Smileys: ['😀', '😂', '🥹', '😊', '😍', '🥰', '😎', '🤩', '🥳', '😇', '🤗', '🤔', '😴', '🙃', '😭', '🥺'],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '💗', '💕', '💘', '💝', '♥️', '💔', '❣️'],
  Nature: ['🌸', '🌺', '🌷', '🌹', '🌻', '🌼', '🍀', '🌿', '🌱', '🌴', '🦋', '🐝', '🌙', '⭐️', '✨', '🌈'],
  Party: ['🎉', '🎊', '🎈', '🎁', '🎀', '🍰', '🧁', '🍾', '🥂', '🎂', '🪩', '🎶', '🔥', '💫', '⚡️', '🌟'],
  Symbols: ['✅', '❌', '⚠️', '💯', '✔️', '➤', '★', '☆', '✿', '❀', '•', '·', '»', '«', '☀️', '☁️']
};

const NAMES = Object.keys(GROUPS);

/* Inserts at the caret rather than appending, so emoji can be placed mid-word. */
export default function EmojiPicker({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(NAMES[0]);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="emoji-wrap" ref={wrapRef}>
      <button
        type="button"
        className="ghost-btn"
        aria-expanded={open}
        title="Insert an emoji"
        onClick={() => setOpen((v) => !v)}
      >
        😀 Emoji
      </button>
      {open && (
        <div className="emoji-pop" role="dialog" aria-label="Emoji picker">
          <div className="emoji-tabs">
            {NAMES.map((n) => (
              <button
                key={n}
                type="button"
                className={`emoji-tab${group === n ? ' is-active' : ''}`}
                onClick={() => setGroup(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="emoji-grid">
            {GROUPS[group].map((e) => (
              <button
                key={e}
                type="button"
                className="emoji-cell"
                onClick={() => onInsert(e)}
                title={`Insert ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
          <p className="emoji-hint">
            Any emoji works — you can also paste or use your keyboard&rsquo;s emoji key.
          </p>
        </div>
      )}
    </div>
  );
}
