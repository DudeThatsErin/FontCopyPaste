/* google-fonts.js — curated Google Fonts catalog.
 * Families are loaded lazily (one <link> per family, on first render) so the
 * page stays fast even with a few hundred options.
 */
export const GoogleFonts = (function () {
  'use strict';

  var FAMILIES = {
    'Handwriting & Script': [
      'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Caveat',
      'Sacramento', 'Parisienne', 'Allura', 'Alex Brush', 'Tangerine',
      'Kaushan Script', 'Cookie', 'Lobster', 'Lobster Two', 'Yellowtail',
      'Courgette', 'Shadows Into Light', 'Indie Flower', 'Patrick Hand',
      'Architects Daughter', 'Gloria Hallelujah', 'Handlee', 'Homemade Apple',
      'Marck Script', 'Nothing You Could Do', 'Reenie Beanie', 'Rock Salt',
      'Give You Glory', 'Just Another Hand', 'La Belle Aurore', 'Zeyada',
      'Mrs Saint Delafield', 'Petit Formal Script', 'Italianno', 'Pinyon Script',
      'Rouge Script', 'Herr Von Muellerhoff', 'Bilbo Swash Caps', 'Berkshire Swash',
      'Kalam', 'Amatic SC', 'Neucha', 'Schoolbell', 'Coming Soon',
      'Permanent Marker', 'Shadows Into Light Two', 'Bad Script', 'Playball',
      'Grand Hotel', 'Norican', 'Damion', 'Leckerli One', 'Niconne',
      'Sriracha', 'Charm', 'Charmonman', 'Mali', 'Molle', 'Meddon',
      'Ruthie', 'Ruge Boogie', 'Sofia', 'Stalemate', 'Mr De Haviland',
      'Redressed', 'Vibur', 'Waiting for the Sunrise', 'Yesteryear',
      'Beau Rivage', 'Ballet', 'Birthstone', 'Bonheur Royale', 'Cormorant SC',
      'Estonia', 'Fuggles', 'Grape Nuts', 'Island Moments', 'Lavishly Yours',
      'Mea Culpa', 'Moon Dance', 'Praise', 'Puppies Play', 'Qwitcher Grypen',
      'Sassy Frass', 'Style Script', 'Twinkle Star', 'Whisper', 'Water Brush'
    ],
    'Display & Decorative': [
      'Bebas Neue', 'Anton', 'Alfa Slab One', 'Righteous', 'Fredoka One',
      'Bungee', 'Bungee Shade', 'Bungee Inline', 'Monoton', 'Bowlby One',
      'Titan One', 'Passion One', 'Ultra', 'Bangers', 'Luckiest Guy',
      'Creepster', 'Nosifer', 'Eater', 'Butcherman', 'Metal Mania',
      'Rubik Moonrocks', 'Rubik Glitch', 'Rubik Puddles', 'Rubik Bubbles',
      'Rubik Beastly', 'Rubik Iso', 'Rubik Vinyl', 'Rubik Wet Paint',
      'Silkscreen', 'Press Start 2P', 'VT323', 'Orbitron', 'Audiowide',
      'Black Ops One', 'Faster One', 'Frijole', 'Graduate', 'Iceberg',
      'Kranky', 'Lacquer', 'Lemon', 'Limelight', 'Megrim',
      'Nabla', 'Bungee Spice', 'Codystar', 'Cinzel Decorative', 'Cormorant Unicase',
      'Fascinate', 'Fascinate Inline', 'Flavors', 'Freckle Face', 'Fugaz One',
      'Galada', 'Gorditas', 'Griffy', 'Gruppo', 'Hanalei',
      'Jolly Lodger', 'Kavoon', 'Knewave', 'Lakki Reddy', 'Londrina Shadow',
      'Londrina Sketch', 'McLaren', 'Miltonian Tattoo', 'Mogra', 'Nova Cut',
      'Nova Script', 'Ribeye', 'Ribeye Marrow', 'Rye', 'Sancreek',
      'Sarina', 'Shojumaru', 'Sigmar One', 'Smokum', 'Snowburst One',
      'Special Elite', 'Stardos Stencil', 'Trade Winds', 'Trochut', 'Unlock',
      'Vast Shadow', 'Wallpoet', 'Warnes', 'Wellfleet', 'Yatra One'
    ],
    'Serif': [
      'Playfair Display', 'Merriweather', 'Lora', 'Libre Baskerville',
      'PT Serif', 'Crimson Text', 'Cormorant Garamond', 'EB Garamond',
      'Bitter', 'Source Serif 4', 'Noto Serif', 'Domine', 'Arvo',
      'Rokkitt', 'Cardo', 'Neuton', 'Vollkorn', 'Alegreya', 'Spectral',
      'Frank Ruhl Libre', 'Zilla Slab', 'Josefin Slab', 'Old Standard TT',
      'Abril Fatface', 'Cinzel', 'Marcellus', 'Prata', 'Gilda Display',
      'Rufina', 'Bodoni Moda', 'DM Serif Display', 'DM Serif Text',
      'Cormorant', 'Sorts Mill Goudy', 'Crimson Pro', 'Faustina',
      'Literata', 'Newsreader', 'Petrona', 'Piazzolla', 'Fraunces',
      'Instrument Serif', 'Young Serif', 'Bricolage Grotesque'
    ],
    'Sans-serif': [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
      'Raleway', 'Nunito', 'Nunito Sans', 'Work Sans', 'Rubik',
      'Source Sans 3', 'Karla', 'Mulish', 'Manrope', 'DM Sans',
      'Outfit', 'Plus Jakarta Sans', 'Figtree', 'Sora', 'Urbanist',
      'Space Grotesk', 'Archivo', 'Barlow', 'Cabin', 'Catamaran',
      'Exo 2', 'Fira Sans', 'Heebo', 'Hind', 'IBM Plex Sans',
      'Josefin Sans', 'Jost', 'Kanit', 'Lexend', 'Libre Franklin',
      'Maven Pro', 'Noto Sans', 'Oswald', 'Overpass', 'Oxygen',
      'PT Sans', 'Prompt', 'Quicksand', 'Questrial', 'Signika',
      'Titillium Web', 'Ubuntu', 'Varela Round', 'Asap', 'Assistant',
      'Public Sans', 'Red Hat Display', 'Schibsted Grotesk', 'Onest',
      'Geologica', 'Wix Madefor Display', 'Instrument Sans'
    ],
    'Monospace': [
      'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono',
      'Space Mono', 'Roboto Mono', 'Inconsolata', 'Ubuntu Mono',
      'Cousine', 'Cutive Mono', 'Nanum Gothic Coding', 'Overpass Mono',
      'PT Mono', 'Share Tech Mono', 'Anonymous Pro', 'DM Mono',
      'Azeret Mono', 'Chivo Mono', 'Martian Mono', 'Red Hat Mono',
      'Spline Sans Mono', 'Syne Mono', 'Xanh Mono'
    ]
  };

  var loaded = Object.create(null);

  /* Families that ship no upright style need an explicit axis request. */
  var AXIS = { 'Molle': ':ital@1' };

  /* Inject a stylesheet for one family the first time it's needed. */
  function load(family) {
    if (loaded[family]) return;
    loaded[family] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(family).replace(/%20/g, '+') +
      (AXIS[family] || '') + '&display=swap';
    document.head.appendChild(link);
  }

  var all = [];
  Object.keys(FAMILIES).forEach(function (group) {
    FAMILIES[group].forEach(function (family) {
      all.push({ id: 'gf:' + family, name: family, family: family, group: group });
    });
  });

  return { groups: FAMILIES, all: all, load: load };
})();
