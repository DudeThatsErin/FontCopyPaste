/* unicode-fonts.js — Unicode "font" style engine.
 * Every style is a pure function: (text) => styledText.
 * These are real Unicode codepoints, so they survive copy/paste into
 * Apple Notes, iMessage, Instagram, etc. — no font install required.
 */
export const UnicodeFonts = (function () {
  'use strict';

  var U = String.fromCodePoint;
  var AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var az = 'abcdefghijklmnopqrstuvwxyz';
  var d09 = '0123456789';

  /* Build a lookup map from contiguous codepoint blocks + exceptions. */
  function block(opts) {
    var map = {};
    var i;
    if (opts.upper != null) for (i = 0; i < 26; i++) map[AZ[i]] = U(opts.upper + i);
    if (opts.lower != null) for (i = 0; i < 26; i++) map[az[i]] = U(opts.lower + i);
    if (opts.digits != null) for (i = 0; i < 10; i++) map[d09[i]] = U(opts.digits + i);
    if (opts.digits1 != null) { for (i = 1; i <= 9; i++) map[d09[i]] = U(opts.digits1 + i - 1); }
    if (opts.pairs) Object.keys(opts.pairs).forEach(function (k) { map[k] = opts.pairs[k]; });
    return map;
  }

  /* Apply a map grapheme-wise; unmapped characters pass through untouched. */
  function mapper(map, post) {
    return function (text) {
      var out = '';
      for (var ch of text) out += (map[ch] !== undefined ? map[ch] : ch);
      return post ? post(out) : out;
    };
  }

  /* Wrap each character with combining marks (strike, underline, etc.). */
  function combiner(marks) {
    return function (text) {
      var out = '';
      for (var ch of text) out += (ch === '\n' ? ch : ch + marks);
      return out;
    };
  }

  /* --- Math alphanumeric blocks (U+1D400 …) ------------------------------- */

  var M = {
    serifBold:        block({ upper: 0x1D400, lower: 0x1D41A, digits: 0x1D7CE }),
    serifItalic:      block({ upper: 0x1D434, lower: 0x1D44E, pairs: { h: 'ℎ' } }),
    serifBoldItalic:  block({ upper: 0x1D468, lower: 0x1D482, digits: 0x1D7CE }),
    sans:             block({ upper: 0x1D5A0, lower: 0x1D5BA, digits: 0x1D7E2 }),
    sansBold:         block({ upper: 0x1D5D4, lower: 0x1D5EE, digits: 0x1D7EC }),
    sansItalic:       block({ upper: 0x1D608, lower: 0x1D622, digits: 0x1D7E2 }),
    sansBoldItalic:   block({ upper: 0x1D63C, lower: 0x1D656, digits: 0x1D7EC }),
    mono:             block({ upper: 0x1D670, lower: 0x1D68A, digits: 0x1D7F6 }),
    script:           block({ upper: 0x1D49C, lower: 0x1D4B6, pairs: {
                        B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ',
                        L: 'ℒ', M: 'ℳ', R: 'ℛ',
                        e: 'ℯ', g: 'ℊ', o: 'ℴ' } }),
    scriptBold:       block({ upper: 0x1D4D0, lower: 0x1D4EA }),
    fraktur:          block({ upper: 0x1D504, lower: 0x1D51E, pairs: {
                        C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' } }),
    frakturBold:      block({ upper: 0x1D56C, lower: 0x1D586 }),
    doubleStruck:     block({ upper: 0x1D538, lower: 0x1D552, digits: 0x1D7D8, pairs: {
                        C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ',
                        Q: 'ℚ', R: 'ℝ', Z: 'ℤ' } })
  };

  /* --- Enclosed / decorated blocks --------------------------------------- */

  var circled = block({ upper: 0x24B6, lower: 0x24D0, digits1: 0x2460, pairs: { '0': '⓪' } });
  var circledNeg = block({ upper: 0x1F150, digits1: 0x278A, pairs: { '0': '⓿' } });
  (function () { for (var i = 0; i < 26; i++) circledNeg[az[i]] = U(0x1F150 + i); })();

  var squared = block({ upper: 0x1F130 });
  (function () { for (var i = 0; i < 26; i++) squared[az[i]] = U(0x1F130 + i); })();

  var squaredNeg = block({ upper: 0x1F170 });
  (function () { for (var i = 0; i < 26; i++) squaredNeg[az[i]] = U(0x1F170 + i); })();

  var parens = block({ upper: 0x1F110, lower: 0x249C, digits1: 0x2474 });

  var regional = block({ upper: 0x1F1E6 });
  (function () { for (var i = 0; i < 26; i++) regional[az[i]] = U(0x1F1E6 + i); })();

  var fullwidth = block({ upper: 0xFF21, lower: 0xFF41, digits: 0xFF10, pairs: {
    ' ': '　', '!': '！', '?': '？', '.': '．', ',': '，',
    ':': '：', ';': '；', "'": '＇', '"': '＂', '-': '－',
    '(': '（', ')': '）', '@': '＠', '#': '＃', '&': '＆',
    '$': '＄', '%': '％', '+': '＋', '=': '＝', '/': '／' } });

  /* --- Hand-built alphabets ---------------------------------------------- */

  var smallCaps = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ',
    g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ',
    m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'Q', r: 'ʀ',
    s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
    y: 'ʏ', z: 'ᴢ'
  };
  (function () { for (var i = 0; i < 26; i++) smallCaps[AZ[i]] = smallCaps[az[i]]; })();

  var superscript = {
    a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ',
    g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ',
    m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', q: 'ᑫ', r: 'ʳ',
    s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ',
    y: 'ʸ', z: 'ᶻ',
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
  };
  (function () { for (var i = 0; i < 26; i++) superscript[AZ[i]] = superscript[az[i]]; })();

  var subscript = {
    a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ',
    l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ',
    s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
  };
  (function () { for (var k in subscript) if (/[a-z]/.test(k)) subscript[k.toUpperCase()] = subscript[k]; })();

  var upsideDown = {
    a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ə', f: 'ɟ', g: 'ƃ',
    h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'ן', m: 'ɯ',
    n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n',
    v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
    A: '∀', B: '၁2', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ',
    G: '⅁', H: 'H', I: 'I', J: 'ſ', K: '⋊', L: '⅂', M: 'W',
    N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥',
    U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
    '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ',
    '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6',
    '.': '˙', ',': "'", "'": ',', '"': '„', '?': '¿', '!': '¡',
    '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
    '<': '>', '>': '<', '&': '⅋', '_': '‾', ';': '؛'
  };

  var mirrored = {
    a: 'ɑ', b: 'd', c: 'ɔ', d: 'b', e: 'ɘ', f: '߀', g: 'ᵷ',
    h: 'ӻ', i: 'i', j: 'ظ', k: 'ʞ', l: 'l', m: 'm', n: 'n',
    o: 'o', p: 'q', q: 'p', r: 'ɹ', s: 'ƨ', t: 'ʇ', u: 'u',
    v: 'v', w: 'w', x: 'x', y: 'ʎ', z: 'z',
    A: 'A', B: '၁2', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ',
    G: 'פ', H: 'H', I: 'I', J: 'ᒋ', K: 'ʞ', L: '⅃', M: 'M',
    N: 'N', O: 'O', P: 'Ԁ', Q: 'Q', R: 'Я', S: 'Ƨ', T: 'T',
    U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Ƹ',
    '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<'
  };

  function reverse(s) { return Array.from(s).reverse().join(''); }
  function flip(map) {
    var m = mapper(map);
    return function (text) {
      return text.split('\n').map(function (line) { return reverse(m(line)); }).join('\n');
    };
  }

  /* --- Zalgo -------------------------------------------------------------- */

  var ZALGO_UP = '̍̎̄̅̿̑̆̐͒͗͑̇̈̊͂̓̈́͊͋͌̃̂̌͐̀́̋̏̒̓̔̽̉ͣͤͥͦͧͨͩͪͫͬͭͮͯ̾͛';
  var ZALGO_MID = '̴̵̶̡̢̧̨̛̀́̕͘͏̸̷͜͟͢͝͞͠͡҉';
  var ZALGO_DOWN = '̖̗̘̙̜̝̞̟̠̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎͓͔͕͖͙͚̣ͅ';

  function pick(set) { return set[Math.floor(Math.random() * set.length)]; }
  function zalgo(intensity) {
    return function (text) {
      var out = '';
      for (var ch of text) {
        out += ch;
        if (ch === '\n' || ch === ' ') continue;
        for (var i = 0; i < intensity; i++) {
          out += pick(ZALGO_UP) + pick(ZALGO_MID) + pick(ZALGO_DOWN);
        }
      }
      return out;
    };
  }

  /* --- Decorative / layout styles ---------------------------------------- */

  function spaced(sep) {
    return function (text) {
      return text.split('\n').map(function (line) {
        return Array.from(line).join(sep);
      }).join('\n');
    };
  }

  function wrapEach(open, close) {
    return function (text) {
      var out = '';
      for (var ch of text) out += (ch === '\n' || ch === ' ') ? ch : open + ch + close;
      return out;
    };
  }

  function surround(pre, post) {
    return function (text) {
      return text.split('\n').map(function (l) { return l ? pre + l + post : l; }).join('\n');
    };
  }

  function alternate(fnA, fnB) {
    return function (text) {
      var out = '', n = 0;
      for (var ch of text) {
        out += (/[a-zA-Z]/.test(ch) ? (n++ % 2 === 0 ? fnA(ch) : fnB(ch)) : ch);
      }
      return out;
    };
  }

  function caseMap(mode) {
    return function (text) {
      if (mode === 'upper') return text.toUpperCase();
      if (mode === 'lower') return text.toLowerCase();
      if (mode === 'title') return text.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      var n = 0;
      return Array.from(text).map(function (ch) {
        if (!/[a-zA-Z]/.test(ch)) return ch;
        return (n++ % 2 === 0) ? ch.toLowerCase() : ch.toUpperCase();
      }).join('');
    };
  }

  var leet = mapper({
    a: '4', A: '4', e: '3', E: '3', i: '1', I: '1', o: '0', O: '0',
    s: '5', S: '5', t: '7', T: '7', b: '8', B: '8', g: '9', G: '9', l: '|', L: '|'
  });

  var greekish = mapper({
    a: 'α', b: 'β', c: 'ς', d: 'δ', e: 'ε', f: 'φ',
    g: 'γ', h: 'η', i: 'ι', j: 'ξ', k: 'κ', l: 'λ',
    m: 'μ', n: 'η', o: 'σ', p: 'π', q: 'φ', r: 'ρ',
    s: 'σ', t: 'τ', u: 'υ', v: 'ν', w: 'ω', x: 'χ',
    y: 'ψ', z: 'ζ',
    A: 'Δ', B: 'Β', C: 'Χ', D: 'Δ', E: 'Σ', F: 'Φ',
    G: 'Γ', H: 'Η', I: 'Ι', J: 'ξ', K: 'Κ', L: 'Λ',
    M: 'Μ', N: 'Π', O: 'Θ', P: 'Ρ', Q: 'Ω', R: 'Я',
    S: 'Σ', T: 'Τ', U: 'Υ', V: 'ν', W: 'Ω', X: 'Ξ',
    Y: 'Ψ', Z: 'Ζ'
  });

  var cyrillicish = mapper({
    a: 'а', b: 'в', c: 'с', d: 'д', e: 'е', f: 'Ѳ',
    g: 'г', h: 'н', i: 'и', j: 'ј', k: 'к', l: 'л',
    m: 'м', n: 'и', o: 'о', p: 'р', q: 'ѻ', r: 'ѓ',
    s: 'ѕ', t: 'т', u: 'ц', v: 'ѵ', w: 'ш', x: 'х',
    y: 'у', z: 'ʐ',
    A: 'Д', B: 'Б', C: 'С', D: 'Ѱ', E: 'Е', F: 'Ф',
    G: 'Г', H: 'Н', I: 'И', J: 'Ј', K: 'К', L: 'Л',
    M: 'М', N: 'И', O: 'О', P: 'Р', Q: 'Щ', R: 'Я',
    S: 'Ѕ', T: 'Т', U: 'Ц', V: 'Ѵ', W: 'Ш', X: 'Ж',
    Y: 'Ч', Z: 'З'
  });

  var runicMap = {
    a: 'ᚨ', b: 'ᛒ', c: 'ᚳ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ',
    g: 'ᚷ', h: 'ᚻ', i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ',
    m: 'ᛗ', n: 'ᚾ', o: 'ᛟ', p: 'ᛈ', q: 'ᛩ', r: 'ᚱ',
    s: 'ᛋ', t: 'ᛏ', u: 'ᚢ', v: 'ᚡ', w: 'ᚹ', x: 'ᛉ',
    y: 'ᚣ', z: 'ᛉ'
  };
  (function () { for (var i = 0; i < 26; i++) runicMap[AZ[i]] = runicMap[az[i]]; })();
  var runic = mapper(runicMap);

  /* --- Style registry ---------------------------------------------------- */
  /* id: stable key used for favorites; name: label; fn: transform. */

  var STYLES = [
    /* Bold & italic families */
    ['serif-bold',        'Bold (serif)',            mapper(M.serifBold), 'Bold & Italic'],
    ['serif-italic',      'Italic (serif)',          mapper(M.serifItalic), 'Bold & Italic'],
    ['serif-bold-italic', 'Bold Italic (serif)',     mapper(M.serifBoldItalic), 'Bold & Italic'],
    ['sans-bold',         'Bold (sans)',             mapper(M.sansBold), 'Bold & Italic'],
    ['sans-italic',       'Italic (sans)',           mapper(M.sansItalic), 'Bold & Italic'],
    ['sans-bold-italic',  'Bold Italic (sans)',      mapper(M.sansBoldItalic), 'Bold & Italic'],
    ['sans-plain',        'Sans-serif',              mapper(M.sans), 'Bold & Italic'],

    /* Script & blackletter */
    ['script',            'Cursive / Script',        mapper(M.script), 'Script & Gothic'],
    ['script-bold',       'Bold Cursive',            mapper(M.scriptBold), 'Script & Gothic'],
    ['fraktur',           'Gothic / Fraktur',        mapper(M.fraktur), 'Script & Gothic'],
    ['fraktur-bold',      'Bold Gothic',             mapper(M.frakturBold), 'Script & Gothic'],
    ['double-struck',     'Double-struck (outline)', mapper(M.doubleStruck), 'Script & Gothic'],
    ['mono',              'Monospace / Typewriter',  mapper(M.mono), 'Script & Gothic'],

    /* Caps & size */
    ['small-caps',        'Sᴍᴀʟʟ Cᴀᴘs',              mapper(smallCaps), 'Caps & Size'],
    ['superscript',       'Superscript (tiny high)', mapper(superscript), 'Caps & Size'],
    ['subscript',         'Subscript (tiny low)',    mapper(subscript), 'Caps & Size'],
    ['fullwidth',         'Full-width (vaporwave)',  mapper(fullwidth), 'Caps & Size'],
    ['upper',             'ALL CAPS',                caseMap('upper'), 'Caps & Size'],
    ['lower',             'all lowercase',           caseMap('lower'), 'Caps & Size'],
    ['title',             'Title Case',              caseMap('title'), 'Caps & Size'],
    ['alternating',       'aLtErNaTiNg CaSe',        caseMap('alt'), 'Caps & Size'],

    /* Enclosed */
    ['circled',           'Circled',                 mapper(circled), 'Enclosed'],
    ['circled-neg',       'Circled (filled)',        mapper(circledNeg), 'Enclosed'],
    ['squared',           'Squared',                 mapper(squared), 'Enclosed'],
    ['squared-neg',       'Squared (filled)',        mapper(squaredNeg), 'Enclosed'],
    ['parens',            'Parenthesized',           mapper(parens), 'Enclosed'],
    ['regional',          'Flag tiles',              mapper(regional), 'Enclosed'],

    /* Lines through / around text */
    ['strike',            'Strikethrough',           combiner('̶'), 'Lines & Marks'],
    ['strike-short',      'Short strike',            combiner('̵'), 'Lines & Marks'],
    ['underline',         'Underline',               combiner('̲'), 'Lines & Marks'],
    ['double-underline',  'Double underline',        combiner('̳'), 'Lines & Marks'],
    ['overline',          'Overline',                combiner('̅'), 'Lines & Marks'],
    ['slash',             'Slashed',                 combiner('̸'), 'Lines & Marks'],
    ['tilde-strike',      'Tilde strike',            combiner('̴'), 'Lines & Marks'],
    ['dotted-above',      'Dotted above',            combiner('̇'), 'Lines & Marks'],
    ['double-dot',        'Umlaut above',            combiner('̈'), 'Lines & Marks'],
    ['hearts-above',      'Ring above',              combiner('̊'), 'Lines & Marks'],
    ['stars-below',       'Dot below',               combiner('̣'), 'Lines & Marks'],
    ['arrow-above',       'Arrow above',             combiner('⃗'), 'Lines & Marks'],
    ['enclosed-keycap',   'Screaming (enclosing)',   combiner('⃝'), 'Lines & Marks'],

    /* Flipped */
    ['upside-down',       'uʌopǝspᴉ uʍop', flip(upsideDown), 'Flipped'],
    ['mirrored',          'bɘɿoɿɿiM',                flip(mirrored), 'Flipped'],
    ['reversed',          'Reversed order',          function (t) {
      return t.split('\n').map(reverse).join('\n');
    }, 'Flipped'],

    /* Spacing & decoration */
    ['spaced',            'S p a c e d  o u t',      spaced(' '), 'Spacing & Decor'],
    ['wide-spaced',       'W i d e r',               spaced(' '), 'Spacing & Decor'],
    ['dot-separated',     'D·o·t·s',  spaced('·'), 'Spacing & Decor'],
    ['dash-separated',    'D-a-s-h-e-s',             spaced('-'), 'Spacing & Decor'],
    ['star-separated',    'S☆t☆a☆r',  spaced('☆'), 'Spacing & Decor'],
    ['heart-separated',   'H♡e♡a♡r',  spaced('♡'), 'Spacing & Decor'],
    ['sparkle-wrap',      '✧ Sparkle wrap ✧', surround('✧ ·˖· ', ' ·˖· ✧'), 'Spacing & Decor'],
    ['star-wrap',         '✧⸝ Star wrap ⸝✧', surround('˚₊˚‧٩ᖕ٪‧˚₊˚ ', ' ˚₊˚‧٩ᖕ٪‧˚₊˚'), 'Spacing & Decor'],
    ['flower-wrap',       '✿ Flower wrap ✿', surround('✿❀ ', ' ❀✿'), 'Spacing & Decor'],
    ['bracket-wrap',      '【 Bracket wrap 】', surround('【 ', ' 】'), 'Spacing & Decor'],
    ['wave-wrap',        '⸺ Wave wrap ⸺', surround('〰ヾ ', ' ヾ〰'), 'Spacing & Decor'],
    ['cloud-wrap',        '☁ Cloud wrap ☁', surround('☁️˚ ', ' ˚☁️'), 'Spacing & Decor'],
    ['tilde-wrap',        '〜 Tilde wrap 〜', surround('❀～ ', ' ～❀'), 'Spacing & Decor'],
    ['arrow-wrap',        '➤ Arrow wrap',       surround('➤ ', ' ◄'), 'Spacing & Decor'],
    ['quote-wrap',        'Smart quotes',            surround('“', '”'), 'Spacing & Decor'],
    ['brackets-each',     '[E][a][c][h]',            wrapEach('[', ']'), 'Spacing & Decor'],
    ['parens-each',       '(E)(a)(c)(h)',            wrapEach('(', ')'), 'Spacing & Decor'],
    ['angle-each',        '《E》《a》', wrapEach('《', '》'), 'Spacing & Decor'],

    /* Alt scripts & glitch */
    ['greekish',          'Greek look-alike',        greekish, 'Look-alikes'],
    ['cyrillicish',       'Cyrillic look-alike',     cyrillicish, 'Look-alikes'],
    ['runic',             'Runic',                   runic, 'Look-alikes'],
    ['leet',              'L337 5p34k',              leet, 'Look-alikes'],
    ['mixed-script-serif','Mixed script + serif',    alternate(mapper(M.script), mapper(M.serifBold)), 'Look-alikes'],
    ['mixed-caps-bold',   'Mixed small caps + bold', alternate(mapper(smallCaps), mapper(M.sansBold)), 'Look-alikes'],
    ['zalgo-light',       'Glitch (light)',          zalgo(1), 'Look-alikes'],
    ['zalgo-medium',      'Glitch (medium)',         zalgo(3), 'Look-alikes'],
    ['zalgo-heavy',       'Glitch (heavy)',          zalgo(6), 'Look-alikes']
  ];

  return {
    styles: STYLES.map(function (s) {
      return { id: s[0], name: s[1], apply: s[2], group: s[3] };
    })
  };
})();
