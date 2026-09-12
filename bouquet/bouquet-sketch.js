/* Gratitude Garden, Build a Bouquet
   Vanilla JS + Canvas 2D. No build step, no dependencies.

   The whole illustration, flowers and wrapping paper alike, is painted on one
   canvas. That is deliberate: the paper has to sit both behind the flowers
   (back panel) and in front of their stems (front panels), which a CSS
   overlay can never do. The gap between the two front panels is a real hole
   in the paper, so the stems and the tucked blooms painted earlier stay
   visible through it. */

/* ---------------------------------------------------------- species ---------------------------------------------------------- */

const SPECIES = [
  { id: "sunflower", name: "Sunflower", meaning: "Hope and resilience",
    blurb: "For the person who keeps you going.", hue: 45,  sat: 82, light: 56 },
  { id: "rose", name: "Rose", meaning: "Love and depth",
    blurb: "For a love you want to say out loud.", hue: 344, sat: 62, light: 52 },
  { id: "daisy", name: "Daisy", meaning: "Simplicity and joy",
    blurb: "For simple days and light company.", hue: 52,  sat: 44, light: 70 },
  { id: "tulip", name: "Tulip", meaning: "Renewal and change",
    blurb: "For a new beginning worth marking.", hue: 350, sat: 68, light: 62 },
  { id: "lily", name: "Lily", meaning: "Peace and rest",
    blurb: "For someone who needs a calm week.", hue: 20,  sat: 40, light: 70 },
  { id: "sakura", name: "Sakura", meaning: "Reflection and presence",
    blurb: "For a moment you both want to keep.", hue: 335, sat: 58, light: 72 },
  { id: "lotus", name: "Lotus", meaning: "Strength and rising",
    blurb: "For someone who came through it all.", hue: 318, sat: 56, light: 70 },
  { id: "lavender", name: "Lavender", meaning: "Calm and safety",
    blurb: "For a little quiet at the end of it.", hue: 275, sat: 42, light: 66 }
];

/* HIDDEN species: fully drawn and fully renderable, but in no picker.

   The orchid and the pompom chrysanthemum were built as florist orderable
   stand ins for the lotus and the sakura, neither of which can actually be
   bought as a cut stem. That swap is NOT applied: the eight above are the
   original eight, and the florist set is meant to become its own separate
   thing for the real bouquet rather than a change to this one.

   They stay here, drawn in all seven sites, so that work is not lost and so
   the sync table in CLAUDE.md stays true. `SPECIES_MAP` resolves them and
   `drawSpeciesBloom` draws them, which also means a link that somehow names
   one still opens. To make them pickable, move the entries between this list
   and `SPECIES` above; nothing else has to change. */
const LEGACY_SPECIES = [
  { id: "chrysanth", name: "Chrysanthemum", meaning: "Reflection and presence",
    blurb: "For a moment you both want to keep.", hue: 335, sat: 58, light: 72 },
  { id: "orchid", name: "Orchid", meaning: "Grace and endurance",
    blurb: "For someone who held themselves together.", hue: 305, sat: 50, light: 68 }
];
/* SPECIES is what you can pick; ALL_SPECIES is what can be rendered. */
const ALL_SPECIES = SPECIES.concat(LEGACY_SPECIES);
const SPECIES_MAP = Object.fromEntries(ALL_SPECIES.map(s => [s.id, s]));

/* ---------------------------------------------------------- palettes ----------------------------------------------------------
   Stored as HSL so the canvas can derive fold / shadow / ribbon tones by
   arithmetic. These numbers are the single source of truth, and swatch colours
   are applied inline from them, so there are no colour classes in the CSS. */

/* Paper is a background for flowers, so a paper that is nearly as pale as the
   blooms in front of it does not read as paper at all: the bouquet turns into a
   flat sheet with some slightly different pale shapes on it. Sage, blush, polka
   dot, gingham and stripes all sat up in the 80s and 90s for lightness and did
   exactly that, so they were brought down until there is something behind the
   flowers. The two pale papers that remain, newspaper and brown paper, carry a
   dense printed pattern of their own and hold the bunch on that instead.
   Blush and polka dot were also the same pink to within four degrees of hue and
   two of lightness, one plain and one dotted, which is not two choices. Blush
   moved to a warm peach; polka dot keeps the pink.
   The ids are what a share link stores, so none of them change: only the names,
   the colours and the ink. Every link made before today still opens, with the
   deeper paper. */
const WRAPS = [
  { id: "butter",   name: "Butter",     h: 47,  s: 92, l: 76, pattern: "plain",
    ribbon: { h: 12,  s: 78, l: 68 } },
  { id: "blush",    name: "Peach",      h: 16,  s: 74, l: 64, pattern: "plain",
    ribbon: { h: 158, s: 34, l: 42 } },
  { id: "sage",     name: "Sage",       h: 146, s: 30, l: 50, pattern: "plain",
    ribbon: { h: 14,  s: 70, l: 68 } },
  { id: "cobalt",   name: "Cobalt",     h: 222, s: 58, l: 56, pattern: "plain",
    ribbon: { h: 45,  s: 88, l: 74 } },
  { id: "news",     name: "Newspaper",  h: 44,  s: 14, l: 88, pattern: "news",
    ribbon: { h: 355, s: 66, l: 56 } },
  { id: "kraft",    name: "Brown paper", h: 30, s: 42, l: 66, pattern: "kraft",
    ribbon: { h: 42,  s: 58, l: 89 } },
  { id: "dots",     name: "Polka dot",  h: 344, s: 56, l: 62, pattern: "dots",
    ribbon: { h: 350, s: 26, l: 96 } },
  { id: "picnic",   name: "Gingham",    h: 8,   s: 46, l: 80, pattern: "gingham",
    ink: { h: 4, s: 62, l: 44 }, ribbon: { h: 45,  s: 70, l: 88 } },
  { id: "stripe",   name: "Stripes",    h: 205, s: 40, l: 78, pattern: "stripe",
    ink: { h: 205, s: 54, l: 44 }, ribbon: { h: 14, s: 68, l: 66 } }
];
const WRAPS_MAP = Object.fromEntries(WRAPS.map(w => [w.id, w]));

/* Papers that existed before the patterned set replaced them. A link shared
   back then still names one of these, so it is mapped to the nearest paper
   still on offer rather than being rejected as unknown. */
const WRAP_ALIASES = { marigold: "butter", ivory: "butter", plum: "dots" };

/* ── Paper is a colour AND a pattern, picked separately ──
   The nine WRAPS above were nine fixed colour-plus-pattern pairs, and every one
   of them collided with several flowers: measured against the eight default
   hues the worst case ran from 1.02:1 to 1.27:1, and `dots` at hue 344 is the
   rose's hue exactly. No fixed set can fix that, because the sender also moves
   each species' hue with a slider. So the colour is the sender's now.

   A pattern carries its own SATURATION, which is what keeps newsprint grey and
   kraft muted whatever hue is chosen; the sender sets hue and lightness. `ink`
   and `ribbon` are derived rather than hand-picked: ink is the paper 35 steps
   darker and a little stronger, and the ribbon sits about opposite the paper so
   it always separates from it. The nine presets keep their hand-picked values,
   because a link made before this names one and has to open exactly as its
   sender saw it. */
/* Real bouquet materials, not gift wrap. Polka dot, gingham and stripes were
   patterns you would find on a birthday present; a florist works in kraft,
   tissue, cellophane, Korean wrap and linen. The three gift patterns are gone
   as textures, but **their ids live on** in `WRAPS` for old links, which is why
   `dots`, `gingham` and `stripe` still appear in `paintPattern`.
   Each texture carries its own saturation, which is what keeps newsprint grey
   and kraft muted at any hue the sender picks. Eight, so the grid runs four by
   two with no orphan tile. */
/* Six materials, three by two, and between them they cover the whole range a
   florist works in: nothing, print, crease, weave, film, grid. Korean wrap,
   tissue and deckle edge went because each was a subtler version of one of
   these and the row stopped being a choice.
   The `sat` here is only a FALLBACK for a link that names no saturation; a
   paper carries its own, since a neutral has to stay neutral whatever it is
   made of. **Do not delete the retired ids from `paintPattern`**: `dots`,
   `gingham`, `stripe`, `korean`, `tissue` and `deckle` are all still reachable
   from links or from `WRAPS`. */
const PATTERNS = [
  { id: "plain",  name: "Solid",      sat: 55 },
  { id: "news",   name: "Newspaper",  sat: 14 },
  { id: "kraft",  name: "Kraft",      sat: 42 },
  { id: "linen",  name: "Linen",      sat: 34 },
  { id: "grid",   name: "Grid",       sat: 30 },
  { id: "cello",  name: "Cellophane", sat: 22, sheer: 0.55 }
];
const PATTERNS_MAP = Object.fromEntries(PATTERNS.map(p => [p.id, p]));

/* ── Ready-made papers, chosen by measurement ──
   Free sliders lost the curated starting points the nine papers used to give,
   and a sender should not have to build a colour from nothing. These are nine
   again, three columns as the papers always were, but every one was checked
   against all eight species rather than picked by eye. The ratio in each
   comment is its worst bloom.

   Picking one only SETS THE SLIDERS. There is one system underneath, so a
   swatch is a starting point rather than a mode, and the sliders can take it
   anywhere from there.

   `kraft` is the exception and it is deliberate: a classic brown paper tan
   measures 1.04:1 against a lily and there is no tan that clears the set. It
   is here because brown paper is what a bouquet actually comes in, and the
   check line tells the truth per bouquet: fine behind roses and lotus, poor
   behind daisies and sunflowers. */
/* ── The papers a florist actually wraps in ──
   Twelve, four columns by three. Kraft first because it is the one most
   bouquets come in and it is what the flowers step previews.

   **Half of these fail the check and that is the point.** Cream, white, blush,
   sage, lavender and cellophane are pale by definition, and pale is exactly
   where these flowers live, so they cannot pass against a daisy however they
   are tuned. Darkening them until they clear would turn a blush pink into a
   dusty rose and the name would stop matching the swatch. They are real papers,
   the check line says which bouquets they suit, and a dark bouquet on cream is
   genuinely lovely. The ones that always work are the jewel tones, black and
   charcoal. */
const PAPERS = [
  /* `r` is the paper's own ribbon hue, hand-picked rather than derived. The
     ribbon used to be computed 165 degrees off the paper and follow the hue
     slider as it moved, which meant it slid around under the sender while they
     were choosing a colour. Now picking a paper sets the ribbon once and
     nothing moves it again except the ribbon slider. */
  /* Lightness 76, not 66. Going LIGHTER improved this one, which is the mid
     tone rule cutting the other way: at 66 kraft sat in the trap and cleared
     1 of 8, at 76 it clears 3. It still warns on a pale bouquet, which is the
     honest state of a real kraft wrap. */
  { id: "kraft",      name: "Kraft",      h: 28,  s: 38, l: 76, p: "kraft", r: 200 },  /* 1.02, clears 3 of 8, and the default */
  { id: "cream",      name: "Newsprint",  h: 210, s: 4,  l: 88, p: "news",  r: 350 },  /* 1.25, and pale on purpose */
  { id: "white",      name: "White",      h: 40,  s: 10, l: 97, p: "plain", r: 140 },
  /* This is the landing page bouquet's paper exactly, `butter` in `WRAPS`,
     ribbon hue and all, so the home page and the builder show one yellow
     rather than two. It fails against the sunflower, the daisy and the lily,
     which hue 47 always will. The id is the only PAPERS id that has ever
     changed; that is safe because a PAPERS id never reaches a link and the
     grid marks the current swatch by comparing h/s/l/p, not by id. */
  { id: "butter",     name: "Butter",     h: 47,  s: 92, l: 76, p: "plain", r: 12  },  /* 1.27, clears 5 of 8 */
  { id: "blush",      name: "Blush",      h: 350, s: 38, l: 88, p: "plain", r: 150 },
  { id: "sage",       name: "Sage",       h: 120, s: 18, l: 82, p: "linen", r: 20  },
  { id: "lavender",   name: "Lavender",   h: 270, s: 30, l: 86, p: "grid",  r: 45  },
  { id: "cellophane", name: "Cellophane", h: 190, s: 16, l: 90, p: "cello", r: 348 },  /* see through */
  { id: "burgundy",   name: "Burgundy",   h: 350, s: 45, l: 28, p: "plain", r: 38  },  /* always works */
  { id: "forest",     name: "Forest",     h: 150, s: 38, l: 26, p: "linen", r: 40  },  /* always works */
  { id: "navy",       name: "Navy",       h: 222, s: 45, l: 28, p: "grid",  r: 34  },  /* always works */
  { id: "charcoal",   name: "Black",      h: 215, s: 6,  l: 16, p: "plain", r: 18  }   /* always works */
];
/* The paper the step opens on. Butter at lightness 76 was the old default and
   it warns on sight for most bouquets: it is hue 47 against a daisy at hue 52,
   which is 5 degrees apart at 1.15:1. Sweeping every hue against all eight
   species, nothing between lightness 46 and 93 carries the whole set, and the
   only pale one that does is a near white mint at 94 which is the flat sheet
   problem the papers were darkened to avoid in the first place. This is the
   LIGHTEST paper that carries every species with real margin, 4.03:1. The
   sender can drag it anywhere; this is only where it starts. */
/* Kraft brown, the paper most bouquets are actually wrapped in, and what the
   flowers step previews while you pick. It measures 1.04 against a lily, so on
   a pale bouquet the check warns from the first screen. That is the honest
   state of a real kraft wrap and the sliders are one drag from fixing it. */
const WRAP_DEFAULT = { h: 28, s: 38, l: 76, p: "kraft", r: 200 };   /* Kraft, and it must track the PAPERS entry above */

/* The paper the renderer should use: a preset verbatim when an old link named
   one and the sender has not touched a control, otherwise built from the
   sender's own hue, lightness and pattern. */
/* A pattern's ink has to go the way there is ROOM. Fixed at 35 steps darker it
   vanished on a dark paper, which is most of them now that mid tones are out.
   Above 55 it goes down, below it goes up. */
function inkFor(h, sat, l) {
  const up = l <= 55;
  return { h, s: Math.min(72, sat + (up ? 6 : 15)),
           l: up ? Math.min(94, l + 42) : Math.max(16, l - 42) };
}
function currentWrap() {
  if (state.legacyWrap && WRAPS_MAP[state.legacyWrap]) return WRAPS_MAP[state.legacyWrap];
  return buildWrap(state.wrapH, state.wrapS, state.wrapL, state.wrapP, state.ribbonH);
}

/* The paper, built from five raw numbers. This used to be the body of
   `currentWrap` and was pulled out for the nine templates, which have to
   describe a paper without going through `state` to do it. Hand rolling
   that object at the call site got `pattern` and `ribbon` wrong on the
   first try, which is exactly the drift this prevents. */
function buildWrap(wrapH, wrapS, wrapL, wrapP, ribbonHue) {
  const pat = PATTERNS_MAP[wrapP] || PATTERNS_MAP.plain;
  const h = clamp(wrapH, 0, 360), l = clamp(wrapL, 20, 95);
  /* Saturation belongs to the PAPER, not to the material it is made of. Taken
     from the material it drove Sage to a vivid green and Cream to a beige,
     because linen and korean carry a saturation suited to a coloured sheet and
     a neutral paper has to be neutral whatever it is woven from. The material's
     own figure is only a fallback, for an old link that names no saturation. */
  const sat = clamp(wrapS == null ? pat.sat : wrapS, 0, 100);
  /* Set once, by the paper or by the sender, and it does not move on its own.
     It used to be derived from the paper hue and so slid around while the hue
     slider was being dragged, which made choosing a colour feel unsteady. */
  const rh = clamp(ribbonHue == null ? WRAP_DEFAULT.r : ribbonHue, 0, 360);
  return {
    id: pat.id, name: pat.name, h, s: sat, l, pattern: pat.id,
    ink: inkFor(h, sat, l),
    /* muted, not bright. At 72 it came out a hot coral or a hot green beside
       pastel blooms and pulled the eye off them. 46 keeps the hue that makes it
       separate from the paper and takes the shout out of it. */
    ribbon: { h: rh, s: 46, l: 72 }
  };
}

/* Whether a bloom reads against the paper, on BOTH counts. Luminance alone is
   not enough when two colours share a hue, and it is too strict when they do
   not: a red rose on a navy stripe measures 1.62 and reads perfectly, while the
   same 1.62 between two pinks is mud. So a bloom passes on a straight 2.0
   luminance ratio, or on 1.5 once it is more than 60 degrees of hue away. That
   is the same pairing the landing page's card colours were settled on. */
function blooomReads(ratio, dHue) {
  return ratio >= 2.0 || (ratio >= 1.5 && dHue >= 60);
}
function hueGap(a, b) { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); }

/* The bloom that sits worst against this paper. Returns null for an empty
   bouquet, otherwise { ratio, dHue, ok, species }. */
function wrapClash(wrap, list) {
  if (!list || !list.length) return null;
  const paper = hslLum(wrap.h, wrap.s, wrap.l);
  let worst = null;
  list.forEach(id => {
    const sp = SPECIES_MAP[id]; if (!sp) return;
    const h = hueFor(id);
    const L = hslLum(h, sp.sat, sp.light);
    const ratio = (Math.max(paper, L) + 0.05) / (Math.min(paper, L) + 0.05);
    const dHue = hueGap(wrap.h, h);
    const ok = blooomReads(ratio, dHue);
    /* the worst is the one furthest from passing, not simply the darkest */
    const slack = ok ? 99 : (dHue >= 60 ? ratio - 1.5 : ratio - 2.0);
    if (!worst || slack < worst.slack) worst = { ratio, dHue, ok, species: sp.name, slack };
  });
  return worst;
}
function hslLum(h, s, l) {
  h = ((h % 360) + 360) / 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const hue2 = t => { t = (t + 1) % 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p; };
  const f = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * f(hue2(h + 1/3)) + 0.7152 * f(hue2(h)) + 0.0722 * f(hue2(h - 1/3));
}
/* the least move in lightness that makes every bloom read, in whichever
   direction is nearer, so "adjust it" does not throw the sender's colour away */
function fixWrapLightness(wrap, list) {
  for (let d = 1; d <= 75; d++) {
    for (const l of [wrap.l + d, wrap.l - d]) {
      if (l < 20 || l > 95) continue;
      const c = wrapClash({ h: wrap.h, s: wrap.s, l }, list);
      if (!c || c.ok) return l;
    }
  }
  return wrap.l;
}
function resolveWrap(id) { return WRAPS_MAP[id] ? id : WRAP_ALIASES[id] || null; }

const CARDS = [
  { id: "shell", name: "Shell", h: 350, s: 60, l: 92 },
  { id: "cream", name: "Cream", h: 45,  s: 80, l: 92 },
  { id: "mist",  name: "Mist",  h: 182, s: 50, l: 90 },
  { id: "lilac", name: "Lilac", h: 265, s: 45, l: 91 },
  { id: "mint",  name: "Mint",  h: 145, s: 40, l: 90 },
  { id: "sand",  name: "Sand",  h: 35,  s: 45, l: 88 },
  { id: "rose",  name: "Rose",  h: 345, s: 55, l: 88 },
  { id: "snow",  name: "Snow",  h: 45,  s: 40, l: 97 }
];
const CARDS_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));

const BACKDROPS = [
  { id: "dawn",   name: "Dawn",   h: 350, s: 55, l1: 96, l2: 86 },
  { id: "sunlit", name: "Sunlit", h: 45,  s: 85, l1: 97, l2: 84 },
  { id: "sky",    name: "Sky",    h: 185, s: 55, l1: 96, l2: 82 },
  { id: "dusk",   name: "Dusk",   h: 265, s: 40, l1: 96, l2: 85 },
  { id: "meadow", name: "Meadow", h: 145, s: 38, l1: 96, l2: 84 },
  { id: "linen",  name: "Linen",  h: 33,  s: 45, l1: 96, l2: 85 },
  { id: "blush",  name: "Blush",  h: 340, s: 50, l1: 96, l2: 87 },
  { id: "cream",  name: "Cream",  h: 45,  s: 45, l1: 98, l2: 91 }
];
const BACKDROPS_MAP = Object.fromEntries(BACKDROPS.map(b => [b.id, b]));

const DEFAULT_HUE = 344;

/* Foliage is a sender choice of its own. Each kind draws a different sprig
   and carries its own density, which is the real fix for a crowded bouquet:
   fern needs far fewer sprigs than eucalyptus to fill the same space. */
const FOLIAGE = [
  /* eucalyptus carries the largest leaves of the five, so the same sprig count
     that suits fern or baby's breath turns the middle of the bouquet solid
     green. Fewer stems, each still fully leafy. `collar` is cut harder than
     `sprigs` because the weave pass is the low central one. */
  { id: "eucalyptus", name: "Eucalyptus",    note: "Soft round leaves",
    sprigs: 5, collar: 4,  hue: 122, sat: 27, light: 52 },
  { id: "fern",       name: "Fern",          note: "Feathered fronds",
    sprigs: 6, collar: 5,  hue: 140, sat: 40, light: 30 },
  { id: "leaves",     name: "Leaves",        note: "Simple pointed leaves",
    sprigs: 6, collar: 6,  hue: 142, sat: 40, light: 36 },
  { id: "gyp",        name: "Baby's breath", note: "Tiny clustered buds",
    sprigs: 8, collar: 6,  hue: 100, sat: 22, light: 50 },
  { id: "wheat",      name: "Wheat",         note: "Slim golden stems",
    sprigs: 5, collar: 4,  hue: 44,  sat: 46, light: 58 },
  /* Berries are the only kind carrying a second colour. `hue`/`sat`/`light` is
     still the GREEN, because the shared stem stroke at the top of
     `foliageSprig` reads those three and a red stem would be nonsense; the
     fruit rides along as `accent`. Rendered at the low counts a cluster's
     visual weight suggested, the bouquet came out visibly emptier than the
     same one under eucalyptus, because the fruits are small and the spurs
     carry nothing else; they run with the rest of the set. */
  { id: "berries",    name: "Berries",       note: "Round red clusters",
    sprigs: 6, collar: 5,  hue: 132, sat: 34, light: 34,
    accent: { hue: 6, sat: 62, light: 46 } },
  /* Bear grass is blades and nothing else, so it is the one kind that skips
     the shared stem entirely: the stem IS the blade. It runs the highest
     count in the set because a single blade carries almost no visual weight,
     which is also what makes it good at filling gaps without hiding blooms. */
  { id: "beargrass",  name: "Bear grass",    note: "Thin arcing blades",
    sprigs: 8, collar: 7,  hue: 92,  sat: 32, light: 46 },
  { id: "none",       name: "None",          note: "Just the flowers",
    sprigs: 0, collar: 0,  hue: 140, sat: 30, light: 44 }
];
const FOLIAGE_MAP = Object.fromEntries(FOLIAGE.map(f => [f.id, f]));
const DEFAULT_FOLIAGE = "leaves";
const MAX_FOLIAGE = 2;

/* Up to two kinds can be chosen and they mix in the bouquet. Returns the real
   entries, with "none" and anything unknown dropped, so an empty array simply
   means no greenery. */
function currentFoliages() {
  const ids = Array.isArray(state.foliages) ? state.foliages : [];
  const out = [];
  ids.forEach(id => {
    const f = FOLIAGE_MAP[id];
    if (f && f.id !== "none" && !out.includes(f)) out.push(f);
  });
  return out.slice(0, MAX_FOLIAGE);
}

/* Colour is per species, not per bouquet: every rose shares one hue, every
   tulip another. Individual stems of the same species are then nudged a few
   degrees apart by their seed, so three roses read as three roses rather than
   one flat shape, without asking the sender to colour them one at a time. */
function hueFor(species) {
  const h = state.hues[species];
  return typeof h === "number" ? h : (SPECIES_MAP[species] ? SPECIES_MAP[species].hue : DEFAULT_HUE);
}
function stemHue(species, seed) {
  const h = hueFor(species) + (seededRand(seed + 21.3) - 0.5) * 13;
  return (h % 360 + 360) % 360;
}
/* Five is the floor because three stems leave the wrap looking empty however
   the foliage is tuned. Bouquets shared before that floor existed can hold
   fewer, and still render correctly: the renderer takes any count, and the
   minimum applies only to bouquets being built now. */
const MIN_FLOWERS = 5;
const MAX_FLOWERS = 12;

/* ---------------------------------------------------------- helpers ---------------------------------------------------------- */

function hsla(h, s, l, a) { return `hsla(${h},${s}%,${l}%,${a === undefined ? 1 : a})`; }
function deg(d) { return (d * Math.PI) / 180; }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function ellipseC(ctx, x, y, w, h) { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.closePath(); ctx.fill(); }
function circleC(ctx, x, y, d) { ellipseC(ctx, x, y, d, d); }

/* a tone derived from a palette entry: dl shifts lightness, ds saturation */
function tone(p, dl, ds, a) {
  return hsla(p.h, clamp(p.s + (ds || 0), 0, 100), clamp(p.l + (dl || 0), 0, 100), a);
}
function cssGradient(b) {
  return `linear-gradient(160deg, ${hsla(b.h, b.s, b.l1, 1)} 0%, ${hsla(b.h, b.s, b.l2, 1)} 100%)`;
}

/* deterministic pseudo-random, so a given bouquet keeps the same organic
   arrangement across re-renders. The recipient rebuilds it from the link
   and must see exactly what the sender saw */
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* quadratic bezier position / tangent */
function qPoint(p0, p1, p2, t) { const u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; }
function qTan(p0, p1, p2, t) { const u = 1 - t; return 2 * u * (p1 - p0) + 2 * t * (p2 - p1); }

/* ---------------------------------------------------------- blooms ----------------------------------------------------------
   Each species derives its whole look from ONE hue. Only saturation,
   lightness and alpha vary between petal layers. That is what keeps a
   bouquet reading as a single colour family at any slider position. */

function drawTulip(ctx, R, hue, sat, light) {
  const Rt = R * 1.15;
  ctx.fillStyle = hsla(hue, sat, light, 0.95);
  ellipseC(ctx, 0, Rt * 0.25, Rt * 1.05, Rt * 1.1);
  ctx.beginPath();
  ctx.moveTo(-Rt * 0.52, Rt * 0.10);
  ctx.bezierCurveTo(-Rt * 0.52, -Rt * 0.10, -Rt * 0.40, -Rt * 0.40, -Rt * 0.22, -Rt * 0.60);
  ctx.lineTo(0, -Rt * 0.40);
  ctx.lineTo(Rt * 0.22, -Rt * 0.60);
  ctx.bezierCurveTo(Rt * 0.40, -Rt * 0.40, Rt * 0.52, -Rt * 0.10, Rt * 0.52, Rt * 0.10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = hsla(hue, sat * 0.8, light + 12, 0.4);
  ellipseC(ctx, 0, Rt * 0.05, Rt * 0.7, Rt * 0.9);
}

function drawRose(ctx, R, hue, sat, light) {
  ctx.save();
  function petal(rotation, distance, w, h, sMod, lMod) {
    ctx.save();
    ctx.rotate(deg(rotation));
    ctx.translate(0, -distance);
    ctx.fillStyle = hsla(hue, sat * sMod, light + lMod, 1);
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-w / 3.2, 5, -w / 1.4, -h / 3.5, -w / 4.5, -h * 0.75);
    ctx.bezierCurveTo(-w / 12, -h * 0.82, w / 12, -h * 0.82, w / 4.5, -h * 0.75);
    ctx.bezierCurveTo(w / 1.4, -h / 3.5, w / 3.2, 5, 0, 12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const scaleAmount = R / 70;
  ctx.scale(scaleAmount, scaleAmount);
  for (let i = 0; i < 8; i++) petal(i * 45, 35, 75, 44, 1.0, -10);
  for (let i = 0; i < 8; i++) petal(i * 45 + 22.5, 26, 65, 38, 0.95, -5);
  for (let i = 0; i < 6; i++) petal(i * 60 + 15, 18, 52, 32, 0.9, 0);
  for (let i = 0; i < 5; i++) petal(i * 72 + 20, 11, 40, 26, 0.85, 5);
  for (let i = 0; i < 5; i++) petal(i * 72 + 56, 6, 30, 22, 0.8, 10);
  ctx.fillStyle = hsla(hue, sat, light - 10, 1); circleC(ctx, 0, 0, 24);
  ctx.fillStyle = hsla(hue, sat * 0.95, light - 5, 1); circleC(ctx, 0, 0, 19);
  ctx.fillStyle = hsla(hue, sat * 0.9, light, 1); circleC(ctx, 0, 0, 14);
  ctx.fillStyle = hsla(hue, sat * 0.85, light + 5, 1); circleC(ctx, 0, 0, 9);
  ctx.fillStyle = hsla(hue, sat * 0.8, light + 10, 1); circleC(ctx, 0, 0, 5);
  ctx.restore();
}

function drawSunflower(ctx, R, hue, sat, light) {
  const petals = 18, w = R * 0.45, h = R * 1.25;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(deg(i * 20));
    ctx.fillStyle = hsla(hue, sat * 0.9, light + 12, 0.95);
    ellipseC(ctx, 0, -R * 0.72, w, h);
    ctx.restore();
  }
  /* disc follows the bouquet hue rather than a fixed brown, so a full hue
     sweep stays coherent */
  ctx.fillStyle = hsla(hue, 52, clamp(light - 28, 12, 100), 1); circleC(ctx, 0, 0, R * 1.35);
  ctx.fillStyle = hsla(hue, 45, clamp(light - 14, 18, 100), 1); circleC(ctx, 0, 0, R * 1.05);
}

function drawSakura(ctx, R, hue, sat, light) {
  const Rb = R * 1.7;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate(deg(i * 72));
    ctx.fillStyle = hsla(hue, sat * 0.8, light + 15, 0.85);
    ctx.beginPath();
    ctx.moveTo(0, -Rb * 0.65);
    ctx.bezierCurveTo(Rb * 0.28, -Rb * 0.52, Rb * 0.40, -Rb * 0.20, Rb * 0.28, 0);
    ctx.bezierCurveTo(Rb * 0.18, Rb * 0.12, 0, Rb * 0.18, -Rb * 0.18, Rb * 0.12);
    ctx.bezierCurveTo(-Rb * 0.28, 0, -Rb * 0.40, -Rb * 0.20, -Rb * 0.28, -Rb * 0.52);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = hsla(hue, sat * 0.6, light - 5, 1);
  circleC(ctx, 0, 0, Rb * 0.24);
}

function drawLily(ctx, R, hue, sat, light) {
  const Rl = R * 1.08, petals = 6;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(deg(i * 60));
    ctx.fillStyle = hsla(hue, sat * 0.85, light + 8, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -Rl * 1.0);
    ctx.bezierCurveTo(Rl * 0.30, -Rl * 0.72, Rl * 0.42, -Rl * 0.30, Rl * 0.22, Rl * 0.04);
    ctx.bezierCurveTo(Rl * 0.12, Rl * 0.20, 0, Rl * 0.26, -Rl * 0.12, Rl * 0.20);
    ctx.bezierCurveTo(-Rl * 0.22, Rl * 0.04, -Rl * 0.42, -Rl * 0.30, -Rl * 0.30, -Rl * 0.72);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = hsla(hue, sat * 0.65, light - 5, 1); circleC(ctx, 0, 0, Rl * 0.36);
  ctx.fillStyle = hsla(hue, sat * 0.45, light + 10, 1); circleC(ctx, 0, 0, Rl * 0.20);
}

function drawDaisy(ctx, R, hue, sat, light) {
  const petals = 16;
  const Rd = R * 0.8, wBase = Rd * 0.55, hBase = Rd * 1.10;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(deg(i * (360 / petals)));
    ctx.fillStyle = hsla(hue, sat * 0.9, light + 10, 0.85);
    ellipseC(ctx, 0, -Rd * 0.7, wBase, hBase);
    ctx.restore();
  }
  /* centre keeps a warm weight but stays in the bouquet's hue family */
  ctx.fillStyle = hsla(hue, 58, clamp(light - 20, 30, 100), 1); circleC(ctx, 0, 0, Rd * 0.5);
  ctx.fillStyle = hsla(hue, 48, clamp(light - 10, 38, 100), 1); circleC(ctx, 0, 0, Rd * 0.35);
}

function drawLotus(ctx, R, hue, sat, light) {
  ctx.save();
  const col = hsla(hue, sat, light, 0.8);
  function petal(scX, scY, rot) {
    ctx.save();
    ctx.rotate(deg(rot));
    ctx.scale(scX, scY);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.5, R * -0.5, R * 0.5, R * -1.5, 0, R * -2);
    ctx.bezierCurveTo(-R * 0.5, R * -1.5, -R * 0.5, R * -0.5, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  petal(0.9, 1, 0);
  petal(0.9, 0.75, -50);
  petal(0.9, 0.75, 50);
  petal(0.9, 0.9, -30);
  petal(0.9, 0.9, 30);
  petal(0.9, 1, 0);
  ctx.restore();
}

/* Everything here scales with `hgt`. The petal width used to be a fixed 14
   regardless of the height passed in, so when bloom sizes came down the spike
   kept its old width and read as short and fat. The ratios below are the
   original numbers divided by the height they were drawn at. */
function drawLavender(ctx, hgt, hue, sat, light) {
  ctx.save();
  const levels = 8, spacing = (hgt / levels) * 1.15;
  const base = -hgt / 6;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const y = base - i * spacing;
    const pWidth = lerp(hgt * 0.234, hgt * 0.117, t);
    const pHeight = pWidth * 1.6;
    const xOffset = lerp(hgt * 0.117, hgt * 0.033, t);
    const baseLight = lerp(light - 10, light + 10, t);

    ctx.fillStyle = hsla(hue, sat, baseLight - 5, 0.9);
    ctx.save(); ctx.translate(-xOffset, y); ctx.rotate(deg(-40)); ellipseC(ctx, 0, 0, pWidth, pHeight); ctx.restore();

    ctx.fillStyle = hsla(hue, sat, baseLight - 2, 0.9);
    ctx.save(); ctx.translate(xOffset, y); ctx.rotate(deg(40)); ellipseC(ctx, 0, 0, pWidth, pHeight); ctx.restore();

    if (i < levels - 1) {
      ctx.fillStyle = hsla(hue, sat - 5, baseLight + 5, 0.8);
      ctx.save(); ctx.translate(0, y - spacing * 0.45); ellipseC(ctx, 0, 0, pWidth * 0.65, pHeight * 0.85); ctx.restore();
    }
    if (i === levels - 1) {
      ctx.fillStyle = hsla(hue, sat + 5, light + 15, 1);
      ellipseC(ctx, 0, y - hgt / 6, hgt * 0.1, hgt * 0.183);
    }
  }
  ctx.restore();
}

/* Phalaenopsis, face on. Three narrow sepals behind (one up, two down), two
   broad petals in front, and the lip at the bottom in a deeper tone. The lip
   is what makes it read as an orchid rather than a generic five petalled
   bloom, so it keeps real contrast against the rest of the flower. */
function drawOrchid(ctx, R, hue, sat, light) {
  const Ro = R * 1.28;
  /* one lobe, authored pointing up and rotated into place */
  function lobe(ang, len, wid, s, l, a, pinch) {
    ctx.save();
    ctx.rotate(deg(ang + 90));
    ctx.fillStyle = hsla(hue, s, l, a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * (pinch || 0.22), wid, -len * 0.82, 0, -len);
    ctx.bezierCurveTo(-wid, -len * 0.82, -wid, -len * (pinch || 0.22), 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  lobe(-90, Ro * 1.00, Ro * 0.31, sat * 0.72, light + 13, 0.92);
  lobe( 42, Ro * 0.94, Ro * 0.31, sat * 0.72, light + 13, 0.92);
  lobe(138, Ro * 0.94, Ro * 0.31, sat * 0.72, light + 13, 0.92);
  lobe(-40,  Ro * 0.95, Ro * 0.60, sat * 0.85, light + 19, 0.96, 0.30);
  lobe(-140, Ro * 0.95, Ro * 0.60, sat * 0.85, light + 19, 0.96, 0.30);
  lobe( 62, Ro * 0.44, Ro * 0.20, sat + 12, light - 8,  1);
  lobe(118, Ro * 0.44, Ro * 0.20, sat + 12, light - 8,  1);
  lobe( 90, Ro * 0.52, Ro * 0.26, sat + 18, light - 15, 1, 0.34);
  ctx.fillStyle = hsla(hue, sat * 0.35, light + 26, 1);
  ellipseC(ctx, 0, Ro * 0.05, Ro * 0.13, Ro * 0.19);
}

/* Pompom chrysanthemum: concentric rings of short rounded petals, lightening
   inward so it reads as a ball rather than a disc. It is drawn as a pompom
   and not as a single flat bloom for a specific reason: a chrysanthemum is in
   the same family as the daisy, and drawn simply the two tiles are the same
   picture twice. Measured, this reaches 1.17R against the daisy's 0.98R and
   the sunflower's 1.33R, so it sits inside the set without being scaled. */
function drawChrysanth(ctx, R, hue, sat, light) {
  const Rm = R * 1.12;
  const rings = [
    { n: 18, r: 0.92, pw: 0.23, ph: 0.32, dl: -9, a: 0.95 },
    { n: 16, r: 0.70, pw: 0.21, ph: 0.29, dl: -3, a: 1 },
    { n: 12, r: 0.49, pw: 0.19, ph: 0.26, dl:  4, a: 1 },
    { n: 8,  r: 0.27, pw: 0.17, ph: 0.23, dl: 10, a: 1 }
  ];
  rings.forEach(function (ring, ri) {
    for (let i = 0; i < ring.n; i++) {
      ctx.save();
      /* each ring is offset, or the petals line up into spokes */
      ctx.rotate(deg(i * (360 / ring.n) + ri * 11));
      ctx.fillStyle = hsla(hue, sat, light + ring.dl, ring.a);
      ellipseC(ctx, 0, -Rm * ring.r, Rm * ring.pw, Rm * ring.ph);
      ctx.restore();
    }
  });
  ctx.fillStyle = hsla(hue, sat * 0.6, light + 16, 1);
  circleC(ctx, 0, 0, Rm * 0.14);
}

function drawSpeciesBloom(ctx, species, R, hue, sat, light) {
  switch (species) {
    case "tulip": return drawTulip(ctx, R, hue, sat, light);
    case "rose": return drawRose(ctx, R, hue, sat, light);
    case "sunflower": return drawSunflower(ctx, R, hue, sat, light);
    case "sakura": return drawSakura(ctx, R, hue, sat, light);
    case "lily": return drawLily(ctx, R, hue, sat, light);
    case "lotus": return drawLotus(ctx, R, hue, sat, light);
    /* hidden from the picker, drawn anyway. See LEGACY_SPECIES. */
    case "chrysanth": return drawChrysanth(ctx, R, hue, sat, light);
    case "orchid": return drawOrchid(ctx, R, hue, sat, light);
    case "lavender": return drawLavender(ctx, R * 1.5, hue, sat, light);
    default: return drawDaisy(ctx, R, hue, sat, light);
  }
}

/* lotus and lavender draw upward from the origin rather than centred on it */
function bloomOriginNudge(species, scale) {
  if (species === "lotus") return 8 * scale;
  if (species === "lavender") return 12 * scale;
  return 0;
}

/* One sprig, drawn along a quadratic from base to tip so it curves like a cut
   stem rather than sticking out straight. Each kind decorates that curve
   differently; the curve itself is shared. */
function foliageSprig(ctx, kind, x0, y0, x1, y1, seed, alpha) {
  const f = FOLIAGE_MAP[kind] || FOLIAGE_MAP[DEFAULT_FOLIAGE];
  if (kind === "none") return;

  const cx = lerp(x0, x1, 0.45) + (seededRand(seed + 1.1) - 0.5) * 16;
  const cy = lerp(y0, y1, 0.55) - 14;
  const at = t => ({
    x: qPoint(x0, cx, x1, t), y: qPoint(y0, cy, y1, t),
    a: Math.atan2(qTan(y0, cy, y1, t), qTan(x0, cx, x1, t)) * 180 / Math.PI
  });

  /* How much a sprig carries follows how long it is. With a fixed count the
     long sprigs came out as bare wire with a couple of leaves stranded at the
     end, which is the one thing that never looks like a plant. */
  const span = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));

  if (kind !== "gyp" && kind !== "beargrass") {
    ctx.strokeStyle = hsla(f.hue, f.sat + 6, f.light - 12, alpha * 0.75);
    ctx.lineWidth = kind === "fern" ? 1.5 : 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  }

  if (kind === "eucalyptus") {
    const n = Math.max(4, Math.round(span / 26));
    for (let i = 0; i < n; i++) {
      const t = lerp(0.24, 1, n === 1 ? 1 : i / (n - 1));
      const p = at(t);
      const r = lerp(9, 4.5, i / Math.max(1, n - 1));
      const side = i % 2 ? 1 : -1;
      ctx.fillStyle = hsla(f.hue, f.sat, f.light + (i % 2 ? 4 : -3), alpha);
      ctx.save();
      ctx.translate(p.x + Math.cos(deg(p.a + side * 90)) * r * 0.5,
                    p.y + Math.sin(deg(p.a + side * 90)) * r * 0.5);
      ctx.rotate(deg(p.a + side * 40));
      ellipseC(ctx, 0, 0, r * 2.1, r * 1.75);
      ctx.restore();
    }
    return;
  }

  if (kind === "fern") {
    const n = Math.max(7, Math.round(span / 17));
    for (let i = 0; i < n; i++) {
      const t = lerp(0.14, 1, n === 1 ? 1 : i / (n - 1));
      const p = at(t);
      const len = lerp(11, 3.5, i / Math.max(1, n - 1));
      [-1, 1].forEach(side => {
        ctx.fillStyle = hsla(f.hue, f.sat, f.light + 8 + side * 3, alpha * 0.95);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(deg(p.a + side * 58));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.6, -len * 0.34, len, 0);
        ctx.quadraticCurveTo(len * 0.6, len * 0.34, 0, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      });
    }
    return;
  }

  if (kind === "gyp") {
    ctx.strokeStyle = hsla(f.hue, f.sat + 10, f.light - 22, alpha * 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
    const n = Math.max(5, Math.round(span / 22));
    for (let i = 0; i < n; i++) {
      const t = lerp(0.3, 1, n === 1 ? 1 : i / (n - 1));
      const p = at(t);
      const side = i % 2 ? 1 : -1;
      const spur = 6 + seededRand(seed + i * 2.3) * 7;
      const ex = p.x + Math.cos(deg(p.a + side * 62)) * spur;
      const ey = p.y + Math.sin(deg(p.a + side * 62)) * spur;
      ctx.strokeStyle = hsla(f.hue, f.sat + 10, f.light - 18, alpha * 0.45);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = hsla(44, 30, 97, alpha);
      circleC(ctx, ex, ey, 4.4);
      ctx.fillStyle = hsla(44, 24, 88, alpha * 0.8);
      circleC(ctx, ex - 1, ey + 1, 2);
    }
    return;
  }

  if (kind === "wheat") {
    /* paired grains up the last stretch of the stem, tapering to a point, with
       a whisker past the tip so it does not end as a blunt stick */
    const n = Math.max(5, Math.round(span / 15));
    for (let i = 0; i < n; i++) {
      const t = lerp(0.42, 1, n === 1 ? 1 : i / (n - 1));
      const p = at(t);
      const g = lerp(6.5, 3, i / Math.max(1, n - 1));
      [-1, 1].forEach(side => {
        ctx.fillStyle = hsla(f.hue, f.sat, f.light + (side > 0 ? 5 : -4), alpha);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(deg(p.a + side * 34));
        ellipseC(ctx, g * 0.5, 0, g * 2, g * 1.05);
        ctx.restore();
      });
    }
    const tip = at(1);
    ctx.strokeStyle = hsla(f.hue, f.sat - 10, f.light + 12, alpha * 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x + Math.cos(deg(tip.a)) * 9, tip.y + Math.sin(deg(tip.a)) * 9);
    ctx.stroke();
    return;
  }

  if (kind === "berries") {
    /* Hypericum. Three fruits to a cluster rather than one, since a single
       circle on a spur reads as a bead on a wire; the back two sit darker so
       the cluster is round rather than flat, and one highlight goes on the
       whole cluster instead of on each fruit. Two leaves low down keep the
       stem from being bare under the fruit. */
    const acc = f.accent || { hue: 6, sat: 62, light: 46 };
    const n = Math.max(3, Math.round(span / 30));
    for (let i = 0; i < n; i++) {
      const t = lerp(0.34, 1, n === 1 ? 1 : i / (n - 1));
      const p = at(t);
      const side = i % 2 ? 1 : -1;
      const spur = 4 + seededRand(seed + i * 2.9) * 5;
      const bx = p.x + Math.cos(deg(p.a + side * 66)) * spur;
      const by = p.y + Math.sin(deg(p.a + side * 66)) * spur;
      ctx.strokeStyle = hsla(f.hue, f.sat + 6, f.light - 12, alpha * 0.7);
      ctx.lineWidth = 1.1;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bx, by); ctx.stroke();
      const r = lerp(4.6, 3.2, i / Math.max(1, n - 1));
      [[-r * 0.8, r * 0.30, -7], [r * 0.85, r * 0.25, -5], [0, -r * 0.70, 5]].forEach(o => {
        ctx.fillStyle = hsla(acc.hue, acc.sat, acc.light + o[2], alpha);
        circleC(ctx, bx + o[0], by + o[1], r);
      });
      ctx.fillStyle = hsla(acc.hue, acc.sat - 16, acc.light + 24, alpha * 0.8);
      circleC(ctx, bx - r * 0.4, by - r * 1.0, r * 0.34);
    }
    [-1, 1].forEach((side, i) => {
      const p = at(0.20 + i * 0.09);
      drawLeaf(ctx, p.x, p.y, p.a + side * 46, 11 + seededRand(seed + i * 1.3) * 4,
               alpha * 0.9, [72, 118, 76]);
    });
    return;
  }

  if (kind === "beargrass") {
    /* Blades, not leaves, which is why this kind skips the shared stem above:
       there is no stem to hang anything on. Each blade is a filled taper, not
       a stroked line, or it reads as wire; the widths are at the blade's base
       and every one closes to a point. The bow is what stops three blades
       from a single origin looking like a drawn asterisk. */
    const blades = 3 + Math.round(seededRand(seed + 3.7) * 1.4);
    const base = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    for (let b = 0; b < blades; b++) {
      const spread = (b - (blades - 1) / 2) * 13;
      const a0 = base + spread;
      const len = span * (0.72 + seededRand(seed + b * 1.9) * 0.42);
      const ex = x0 + Math.cos(deg(a0)) * len;
      const ey = y0 + Math.sin(deg(a0)) * len;
      const bow = (seededRand(seed + b * 3.1) - 0.5) * 26 + spread * 1.1;
      const nx = Math.cos(deg(a0 + 90)), ny = Math.sin(deg(a0 + 90));
      const mx = lerp(x0, ex, 0.5) + nx * bow;
      const my = lerp(y0, ey, 0.5) + ny * bow;
      const wide = 1.7 + seededRand(seed + b * 4.3) * 0.9;
      ctx.fillStyle = hsla(f.hue, f.sat, f.light + (b % 2 ? 5 : -4), alpha * 0.92);
      ctx.beginPath();
      ctx.moveTo(x0 + nx * wide, y0 + ny * wide);
      ctx.quadraticCurveTo(mx + nx * wide * 0.5, my + ny * wide * 0.5, ex, ey);
      ctx.quadraticCurveTo(mx - nx * wide * 0.5, my - ny * wide * 0.5,
                           x0 - nx * wide, y0 - ny * wide);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  /* leaves: pointed blades up the stem, always one closing off the tip */
  const n = Math.max(2, Math.round(span / 34));
  for (let i = 0; i < n; i++) {
    const t = lerp(0.32, 1, n === 1 ? 1 : i / (n - 1));
    const p = at(t);
    const last = i === n - 1;
    const side = i % 2 ? 1 : -1;
    drawLeaf(ctx, p.x, p.y, p.a + (last ? 0 : side * 36),
             (last ? 18 : 15) + seededRand(seed + i * 1.7) * 6,
             alpha * (last ? 1 : 0.85), [86, 150, 96]);
  }
}

/* The leaf the gardens put on their flower stems, ported point for point from
   `drawLeafOnStem` in the personal garden sketch, midrib and all, so a stem
   here carries the same leaf it does there. `fill` is optional: the flowers'
   own leaves use the garden's green, while the foliage kinds pass their own
   colour so the greenery choice still reads distinctly. */
const GARDEN_LEAF = { fill: [120, 210, 90], vein: [70, 150, 85] };

function drawLeaf(ctx, x, y, angleDeg, len, alpha, fill) {
  const a = alpha === undefined ? 0.85 : alpha;
  const w = len, h = len * 0.45;
  const col = fill || GARDEN_LEAF.fill;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(deg(angleDeg));
  ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + a + ")";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w * 0.15, -h * 0.06, w * 0.40, -h * 0.30);
  ctx.quadraticCurveTo(w * 0.80, -h * 0.55, w, -h * 0.05);
  ctx.quadraticCurveTo(w * 0.82,  h * 0.22, w * 0.35, h * 0.16);
  ctx.quadraticCurveTo(w * 0.10,  h * 0.04, 0, 0);
  ctx.closePath();
  ctx.fill();
  if (!fill) {
    const v = GARDEN_LEAF.vein;
    ctx.strokeStyle = "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")";
    ctx.lineWidth = Math.max(0.8, len * 0.055);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.9, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------------------------------------------------- flower tile ---------------------------------------------------------- */

function renderFlowerTile(canvas, species, hue) {
  const meta = SPECIES_MAP[species];
  if (!meta) return;
  const dpr = window.devicePixelRatio || 1;
  const w = 100, h = 84;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  let extra = 0;
  if (species === "lotus") extra = 14;
  else if (species === "lavender") extra = 18;
  ctx.translate(w / 2, h / 2 + 6 + extra);
  drawSpeciesBloom(ctx, species, 30, hue, meta.sat, meta.light);
  ctx.restore();
}

function renderFoliageTile(canvas, kind) {
  const dpr = window.devicePixelRatio || 1;
  const w = 100, h = 84;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (kind === "none") {
    ctx.strokeStyle = hsla(178, 18, 62, 0.75);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2 - 10, h / 2 + 10); ctx.lineTo(w / 2 + 10, h / 2 - 10); ctx.stroke();
    return;
  }
  /* three sprigs, the same routine the bouquet uses, so the tile cannot drift
     away from what the sender actually gets */
  [-26, 0, 26].forEach((a, i) => {
    const len = i === 1 ? 58 : 48;
    foliageSprig(ctx, kind, w / 2, h - 6,
      w / 2 + Math.sin(deg(a)) * len, h - 6 - Math.cos(deg(a)) * len,
      hashSeed("tile-" + kind + "-" + i), 1);
  });
}

/* ---------------------------------------------------------- bouquet geometry ----------------------------------------------------------
   Everything below is expressed in a fixed virtual space of VW x VH units.
   renderBouquetCanvas scales that space to whatever width the canvas
   currently occupies, so the same numbers work at any size. */

const VW = 400, VH = 500;
const CX = VW / 2;          // 200
const Y_NECK = 366;         // where the paper is tied
const SB = { x: CX, y: 386 }; // stems converge below the neck, inside the wrap

const BANDS = {
  back:  { satMul: 0.82, lightOff: -8, alpha: 0.90, rMul: 0.88 },
  mid:   { satMul: 0.92, lightOff: -2, alpha: 0.95, rMul: 0.96 },
  front: { satMul: 1.00, lightOff:  4, alpha: 1.00, rMul: 1.04 }
};

/* round-robin across the distinct species so repeats never clump together.
   Deterministic for a given input array, which keeps share links stable. */
function fanOrder(list) {
  const groups = [];
  const seen = new Map();
  list.forEach(id => {
    if (!seen.has(id)) { const g = []; seen.set(id, g); groups.push(g); }
    seen.get(id).push(id);
  });
  const out = [];
  while (out.length < list.length) {
    for (const g of groups) if (g.length) out.push(g.pop());
  }
  return out;
}

/* how far below its origin a bloom actually paints. Lotus and lavender grow
   upward from the origin, so they hang far less than a centred bloom does */
function bloomReach(species, R) {
  if (species === "lavender") return 16;
  if (species === "lotus") return 13;
  return R;
}

function makeStem(species, seed, tipX, tipY, R, fill) {
  return { species, seed, tipX, tipY, R, fill };
}

/* the stem is derived from wherever the bloom ended up, so blooms can be
   placed for looks first and the stems then drawn to reach them */
function finishStem(s) {
  const dx = s.tipX - SB.x, dy = s.tipY - SB.y;
  const bend = (seededRand(s.seed + 6.4) - 0.5) * 26;
  s.ctrlX = SB.x + dx * 0.42 + bend;
  s.ctrlY = SB.y + dy * 0.58;
  /* the bloom follows the curve's actual tangent at the tip, not the straight
     base-to-tip line, damped so outer flowers lean without toppling */
  const tipAngle = Math.atan2(s.tipX - s.ctrlX, -(s.tipY - s.ctrlY)) * 180 / Math.PI;
  s.bloomAngle = tipAngle * 0.85 + (seededRand(s.seed + 9.7) - 0.5) * 8;
}

/* pushes overlapping blooms apart. A few cheap passes beat any amount of
   clever spacing maths, and it is what stops repeats of one species from
   reading as a single blob */
function relaxTips(stems) {
  for (let pass = 0; pass < 16; pass++) {
    let moved = false;
    for (let a = 0; a < stems.length; a++) {
      for (let b = a + 1; b < stems.length; b++) {
        const A = stems[a], B = stems[b];
        const dx = B.tipX - A.tipX, dy = B.tipY - A.tipY;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        /* real bunches are packed. Hold blooms a full radius apart and they
           read as a scattering of separate flowers with paper between them. */
        const min = (A.R + B.R) * 0.62;
        if (d < min) {
          const push = (min - d) / 2;
          const ux = dx / d, uy = dy / d;
          A.tipX -= ux * push; A.tipY -= uy * push;
          B.tipX += ux * push; B.tipY += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
}

/* Two rules, and only two. A bloom must sit inside the bouquet's envelope, so
   nothing pokes out past the sides of the wrap; and its centre must stay above
   the front paper's edge, so it is never mostly hidden behind the sleeve. The
   paper may still cut across its lower petals, which is exactly how a flower
   sitting down in the wrap should look. */
function settleTip(s) {
  const drawnR = s.R * 1.05;
  const half = envelopeHalf(s.tipY + bloomReach(s.species, drawnR)) - drawnR - 4;
  s.tipX = clamp(s.tipX, CX - Math.max(half, 0), CX + Math.max(half, 0));
  const maxY = frontTopAt(s.tipX) - 3;
  if (s.tipY > maxY) s.tipY = maxY;
  if (s.tipY < 52) s.tipY = 52;
}

/* Three tiers, not two. Splitting the stems into a dome and a low fill left a
   clear gap in the middle and read as two rows. Every stem now belongs to a
   back, middle or front tier: each tier sits lower, narrower and slightly
   larger than the one behind, and the middle one both fills the gap and gives
   the blooms something to overlap. */
const TIERS = [
  { key: "back",  dy:  0, spread: 1.00, rMul: 0.88, stagger:  0,   band: "back"  },
  { key: "mid",   dy: 46, spread: 0.84, rMul: 1.00, stagger: 0.5,  band: "mid"   },
  { key: "front", dy: 92, spread: 0.62, rMul: 1.10, stagger: 0,    band: "front" }
];

/* `list` IS the order the bunch is dealt in. It used to be re-fanned here on
   every render, which meant a stem's place was derived and could not be
   changed; now state.flowers is re-fanned once when a flower is added or
   removed, and left alone otherwise, so dragging one bloom onto another can
   simply swap two entries and have it stay swapped. Links made before this
   carry the sender's pick order rather than the fanned order, so decodeState
   fans those on the way in. */
function buildArrangement(list) {
  const order = list;
  const n = order.length;
  if (!n) return [];
  setNotchForCount(n);

  /* round robin into the tiers so repeats of one species never end up stacked
     in the same tier, and the back tier keeps at least as many as the front */
  const groups = [[], [], []];
  order.forEach((id, i) => groups[i % 3].push({ id, fanIndex: i }));

  /* A stem's place across the bunch normally comes from its position within
     its own tier, and a tier holding a single stem puts that stem at its
     midpoint. With four stems or fewer every tier holds exactly one, so all of
     them landed on the centre line and the bouquet came out as a vertical
     stack of overlapping blooms. Below that count the fan is measured across
     the whole bunch instead, and given more room to open out in, since the
     count based width is at its narrowest exactly when the stems most need to
     be told apart. A finished bouquet is at least MIN_FLOWERS, so this shows
     in the live preview while picking, and in share links made before that
     minimum existed. */
  const wholeBunchFan = n <= 4;
  const spreadX = wholeBunchFan ? 92 : Math.min(126, 34 + n * 11);
  const domeTop = n <= 6 ? 118 : n <= 9 ? 108 : 100;

  const stems = [];
  TIERS.forEach((tier, ti) => {
    const g = groups[ti];
    g.forEach((entry, i) => {
      const species = entry.id;
      const seed = hashSeed(species + "-" + ti + "-" + i);
      /* the stagger shifts alternate tiers by half a step so blooms sit in the
         gaps of the tier behind rather than lining up into columns */
      const u = wholeBunchFan
        ? (n === 1 ? 0.5 : entry.fanIndex / (n - 1))
        : g.length === 1 ? 0.5 : (i + tier.stagger) / Math.max(1, g.length - 1 + tier.stagger * 2);
      const off = (u - 0.5) * 2;
      const lift = (seededRand(seed + 15.7) - 0.5) * 26;
      const R = (31 + (seededRand(seed + 4.2) - 0.5) * 8) * tier.rMul;

      const st = makeStem(
        species, seed,
        CX + off * spreadX * tier.spread + (seededRand(seed + 1.3) - 0.5) * 18,
        domeTop + tier.dy + Math.pow(Math.abs(off), 1.7) * 26 + lift,
        R, tier.key === "front"
      );
      st.band = BANDS[tier.band];
      st.idx = entry.fanIndex;   /* which entry of `list` this bloom is */
      settleTip(st);
      stems.push(st);
    });
  });

  relaxTips(stems);
  stems.forEach(settleTip);
  stems.forEach(finishStem);

  /* painted back tier first, so the front of the bunch finishes on top */
  return stems.slice().sort((a, b) => a.tipY - b.tipY);
}

/* ---- paper patterns ----
   A pattern is painted inside a clip of the panel path, against the panel's
   own base tone, so one continuous sheet runs across the whole sleeve instead
   of restarting at every fold. Every value comes from a fixed number or a
   seeded random, so a share link always rebuilds the identical paper. */

function patternNews(ctx, wrap) {
  /* print used to be a fixed near black, which disappears on a dark sheet.
     inkFor sends it the way there is room. */
  const ink = inkFor(wrap.h, wrap.s, wrap.l);
  /* two columns with a gutter between them, which is the thing that reads as
     newsprint. A single block of even lines just looks like ruled paper. */
  const cols = [[14, 190], [210, 386]];
  let row = 0;
  for (let y = 146; y < VH; y += 7.6) {
    const a = seededRand(row * 1.7 + 0.3);
    row++;
    cols.forEach((col, ci) => {
      const [c0, c1] = col;
      const hb = seededRand(row * 3.1 + ci * 11.7);
      if (hb > 0.9) {                              /* a headline bar */
        ctx.fillStyle = hsla(ink.h, ink.s, ink.l, 0.55);
        ctx.fillRect(c0, y - 2.6, (c1 - c0) * (0.55 + hb * 0.4), 5);
        return;
      }
      ctx.fillStyle = hsla(ink.h, ink.s, ink.l, 0.34);
      let x = c0 + a * 6;
      while (x < c1) {
        const w = 10 + seededRand(x * 0.7 + row + ci) * 28;
        ctx.fillRect(x, y, Math.min(w, c1 - x), 2);
        x += w + 5;
      }
    });
  }
}

/* Crinkle: paper that has been screwed up and smoothed out again. It was a
   fibre speckle at 0.10 alpha in fixed browns, left from when this paper was
   always brown, and against a flat colour it was very nearly invisible: the
   honest answer to "what is the difference between Plain and this" was almost
   nothing. Creases read at a glance where a speckle does not.
   Each crease is a long shallow line with a lit side and a shadowed side, which
   is what a fold looks like, and both tones come from the paper so a blue sheet
   creases blue. Seeded, so a link rebuilds the same sheet. */
/* Korean wrap: a stiff waxy matte sheet. Almost nothing on it, which is the
   look, so it is a single soft diagonal sheen and two long shallow folds. */
function patternKorean(ctx, wrap) {
  const g = ctx.createLinearGradient(0, 0, VW, VH);
  g.addColorStop(0, hsla(wrap.h, wrap.s, Math.min(98, wrap.l + 9), 0.30));
  g.addColorStop(0.5, hsla(wrap.h, wrap.s, wrap.l, 0));
  g.addColorStop(1, hsla(wrap.h, wrap.s, Math.max(8, wrap.l - 9), 0.22));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  ctx.strokeStyle = hsla(wrap.h, wrap.s, Math.max(8, wrap.l - 14), 0.16);
  ctx.lineWidth = 1.6;
  [0.32, 0.68].forEach((f, i) => {
    const x = VW * f;
    ctx.beginPath(); ctx.moveTo(x, 120);
    ctx.quadraticCurveTo(x + (i ? 14 : -14), 300, x + (i ? 6 : -6), VH);
    ctx.stroke();
  });
}

/* Tissue: light, and it wrinkles in soft short arcs rather than long creases.
   Painted at low alpha in both directions so it reads as thin. */
function patternTissue(ctx, wrap) {
  const dark = hsla(wrap.h, wrap.s, Math.max(10, wrap.l - 14), 0.16);
  const lite = hsla(wrap.h, Math.max(6, wrap.s - 12), Math.min(99, wrap.l + 12), 0.30);
  for (let i = 0; i < 46; i++) {
    const x = seededRand(i * 1.7 + 3.1) * VW;
    const y = 120 + seededRand(i * 2.3 + 1.4) * (VH - 120);
    const len = 26 + seededRand(i * 0.8 + 6.2) * 54;
    const ang = (seededRand(i * 1.1 + 2.6) - 0.5) * 2.6;
    const bow = (seededRand(i * 2.9 + 4.4) - 0.5) * 26;
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    const mx = (x + x1) / 2 - Math.sin(ang) * bow, my = (y + y1) / 2 + Math.cos(ang) * bow;
    ctx.strokeStyle = i % 2 ? lite : dark;
    ctx.lineWidth = 0.9 + seededRand(i * 0.4) * 0.8;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
  }
}

/* Linen: a woven grid. Threads both ways at a low alpha, with the odd thicker
   slub, which is what separates woven from printed. */
function patternLinen(ctx, wrap) {
  const warp = hsla(wrap.h, wrap.s, Math.max(10, wrap.l - 11), 0.22);
  const weft = hsla(wrap.h, Math.max(6, wrap.s - 10), Math.min(99, wrap.l + 10), 0.20);
  ctx.strokeStyle = warp; ctx.lineWidth = 1;
  for (let x = 0; x < VW; x += 5) {
    ctx.globalAlpha = 0.6 + seededRand(x * 0.31) * 0.4;
    ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x, VH); ctx.stroke();
  }
  ctx.strokeStyle = weft;
  for (let y = 110; y < VH; y += 5) {
    ctx.globalAlpha = 0.6 + seededRand(y * 0.27) * 0.4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = hsla(wrap.h, wrap.s, Math.max(10, wrap.l - 16), 0.16);
  for (let i = 0; i < 40; i++) {
    const x = seededRand(i * 3.3 + 1.9) * VW;
    const y = 110 + seededRand(i * 1.6 + 5.5) * (VH - 110);
    ctx.fillRect(x, y, 3 + seededRand(i * 0.7) * 7, 1.6);
  }
}

/* Deckle edge: handmade paper. Flecks of pulp through the sheet, and a torn
   ragged line where a deckle edge would fall across it. */
function patternDeckle(ctx, wrap) {
  ctx.fillStyle = hsla(wrap.h, Math.max(6, wrap.s - 16), Math.min(99, wrap.l + 14), 0.26);
  for (let i = 0; i < 300; i++) {
    const x = seededRand(i * 1.13 + 0.7) * VW;
    const y = 115 + seededRand(i * 2.07 + 3.3) * (VH - 115);
    ctx.fillRect(x, y, 1 + seededRand(i * 0.6) * 2.2, 1 + seededRand(i * 0.9) * 1.6);
  }
  ctx.strokeStyle = hsla(wrap.h, wrap.s, Math.max(9, wrap.l - 15), 0.22);
  ctx.lineWidth = 1.5; ctx.lineCap = "round";
  [188, 322].forEach((y0, k) => {
    ctx.beginPath(); ctx.moveTo(0, y0);
    for (let x = 0; x <= VW; x += 9) {
      ctx.lineTo(x, y0 + (seededRand(x * 0.41 + k * 7.7) - 0.5) * 7);
    }
    ctx.stroke();
  });
}

/* Cellophane: film, not paper. The sheerness is handled by paintPanel, which
   drops the whole panel's alpha; this only adds the gloss that says plastic,
   two soft diagonal bands of white. */
/* Grid: the fine printed rule on Korean wrap paper, which is the signature of
   the minimalist bouquet look. A PRINT, not a weave, so it is deliberately far
   sparser than the linen it sits beside: 26px squares of a single thin line
   against linen's dense 5px threads. Read at a glance the two are a printed
   sheet and a woven one, which is the whole reason both are in the set. */
function patternGrid(ctx, wrap) {
  const ink = inkFor(wrap.h, wrap.s, wrap.l);
  ctx.strokeStyle = hsla(ink.h, ink.s, ink.l, 0.22);
  ctx.lineWidth = 1;
  for (let x = 12; x < VW; x += 26) {
    ctx.beginPath(); ctx.moveTo(x, 108); ctx.lineTo(x, VH); ctx.stroke();
  }
  for (let y = 116; y < VH; y += 26) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke();
  }
}

function patternCello(ctx, wrap) {
  [[0.16, 0.30], [0.58, 0.14]].forEach(([f, w]) => {
    const g = ctx.createLinearGradient(VW * f, 0, VW * (f + w), VH);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.42)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  });
}

function patternKraft(ctx, wrap) {
  /* Softer than it was. At 34 creases with a 20 step swing it read as crumpled
     foil rather than paper that has been folded; kraft is matte and its creases
     are gentle. Fewer of them, half the tonal move, and thinner lines. */
  const up = wrap.l <= 55;
  const dark = hsla(wrap.h, Math.min(60, wrap.s + 6), Math.max(12, wrap.l - 11), up ? 0.20 : 0.13);
  const lite = hsla(wrap.h, Math.max(8, wrap.s - 12), Math.min(98, wrap.l + 11), up ? 0.17 : 0.22);
  for (let i = 0; i < 20; i++) {
    /* a crease runs mostly one way but never straight, so it is drawn as a
       three point curve rather than a line */
    const x0 = seededRand(i * 1.31 + 2.2) * VW * 1.2 - VW * 0.1;
    const y0 = 120 + seededRand(i * 2.77 + 8.1) * (VH - 120);
    const ang = (seededRand(i * 0.71 + 5.3) - 0.5) * 2.2 + (i % 2 ? 1.15 : -1.15);
    const len = 70 + seededRand(i * 1.9 + 3.3) * 190;
    const bow = (seededRand(i * 3.1 + 0.9) - 0.5) * 34;
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    const mx = (x0 + x1) / 2 - Math.sin(ang) * bow, my = (y0 + y1) / 2 + Math.cos(ang) * bow;
    ctx.lineCap = "round";
    ctx.strokeStyle = dark; ctx.lineWidth = 0.8 + seededRand(i * 0.5) * 0.7;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    ctx.strokeStyle = lite; ctx.lineWidth = 0.7 + seededRand(i * 0.37) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x0 + 1.4, y0 + 1.2);
    ctx.quadraticCurveTo(mx + 1.4, my + 1.2, x1 + 1.4, y1 + 1.2);
    ctx.stroke();
  }
}

function patternDots(ctx, wrap) {
  /* the dots were a fixed near white, invisible on a pale sheet */
  const ink = inkFor(wrap.h, wrap.s, wrap.l);
  const sx = 27, sy = 25;
  let row = 0;
  for (let y = 140; y < VH + sy; y += sy) {
    const off = (row % 2) * sx * 0.5;
    for (let x = -12 + off; x < VW + 12; x += sx) {
      ctx.fillStyle = hsla(ink.h, ink.s, ink.l, 0.92);
      circleC(ctx, x, y, 7.4);
    }
    row++;
  }
}

function patternStripe(ctx, wrap) {
  const ink = wrap.ink || { h: 205, s: 48, l: 64 };
  const band = 15;
  ctx.fillStyle = hsla(ink.h, ink.s, ink.l, 0.78);
  for (let x = -band; x < VW + band; x += band * 2) ctx.fillRect(x, 0, band, VH);
  /* a hairline inside each gap, which is what stops wide stripes reading as
     flat blocks of colour */
  ctx.fillStyle = hsla(ink.h, ink.s, ink.l - 8, 0.3);
  for (let x = -band + band * 2 * 0.5; x < VW + band; x += band * 2) ctx.fillRect(x + band * 0.42, 0, 1.6, VH);
}

function patternGingham(ctx, wrap) {
  const ink = wrap.ink || { h: 4, s: 62, l: 58 };
  const band = 19;
  ctx.fillStyle = hsla(ink.h, ink.s, ink.l, 0.5);
  for (let x = -band; x < VW + band; x += band * 2) ctx.fillRect(x, 0, band, VH);
  for (let y = 132; y < VH + band; y += band * 2) ctx.fillRect(0, y, VW, band);
}

function paintPattern(ctx, wrap) {
  switch (wrap.pattern) {
    case "news":    return patternNews(ctx, wrap);
    case "kraft":   return patternKraft(ctx, wrap);
    case "linen":   return patternLinen(ctx, wrap);
    case "grid":    return patternGrid(ctx, wrap);
    case "cello":   return patternCello(ctx, wrap);
    /* retired as choices, still reachable from links and from WRAPS */
    case "korean":  return patternKorean(ctx, wrap);
    case "tissue":  return patternTissue(ctx, wrap);
    case "deckle":  return patternDeckle(ctx, wrap);
    case "dots":    return patternDots(ctx, wrap);
    case "gingham": return patternGingham(ctx, wrap);
    case "stripe":  return patternStripe(ctx, wrap);
    default:        return;
  }
}

/* Fills the path already built on ctx: base tone, then the pattern, then a
   translucent shade for folds. Shading the pattern as one layer is what keeps
   a printed sheet reading as continuous across a crease. */
function paintPanel(ctx, wrap, dl) {
  ctx.save();
  ctx.clip();
  /* Cellophane is the one wrap you see through. Everything green and every
     bloom is already painted by the time the paper goes on, which is the rule
     the whole composition rests on, so a sheer panel simply lets what is
     underneath show: no reordering, just an alpha on the sheet. The gloss in
     patternCello is painted at full strength on top of it. */
  const sheer = PATTERNS_MAP[wrap.pattern] && PATTERNS_MAP[wrap.pattern].sheer;
  if (sheer) ctx.globalAlpha = sheer;
  ctx.fillStyle = tone(wrap, dl, 0, 1);
  ctx.fillRect(0, 0, VW, VH);
  paintPattern(ctx, wrap);
  if (dl < 0) {
    ctx.fillStyle = hsla(wrap.h, 28, 22, Math.min(-dl, 18) / 105);
    ctx.fillRect(0, 0, VW, VH);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ---- wrapping paper ----
   One sheet, with pointed flaps and a deep front opening. Everything below is
   built from the same outer edge, so the sides of the front meet the back
   exactly. The front dips low so most of the bunch is visible, which means the
   blooms are painted BEFORE the front: the flap edges then cut across them the
   way real paper does, and nothing can sit on top of the wrapper looking stuck
   to it. */

/* The flap tips ARE the top outer corners, so the sleeve is at its widest up
   at the points and the front edge sweeps down from them into the opening.
   Tucking the tips inside a wider shoulder made the opening read as a slit cut
   between two separate flaps instead of one broad wrap. */
const CONE_TOP_HALF = 108, SHOULDER_Y = 176;
/* The single point of the sheet behind. High enough to clear the bunch, since
   level with the blooms it is simply hidden and the shape does not read, but
   sized with the bouquet: a tall point over three stems is a paper cone with a
   few flowers in it. Set by setNotchForCount along with the opening. */
let BACK_TIP_Y = 84;
/* The bunch is allowed to be wider than the paper ABOVE the shoulder, which is
   how a real bouquet sits: the flowers spread past the wrap once they clear
   it. Below the shoulder the sleeve is the limit, so nothing ever pokes out of
   the side of the paper itself. */
const BOUQUET_HALF = 142;
/* Base of the front opening, sized from the number of stems: a deep opening
   under three flowers is mostly bare paper, which is the opposite of the
   point. buildArrangement sets this itself, so the paper and the bloom
   placement can never be working from different values. */
let NOTCH_Y = 286;
let STEM_COUNT = 6;
function setNotchForCount(n) {
  STEM_COUNT = n;
  NOTCH_Y    = n >= 9 ? 292 : n >= 7 ? 286 : n >= 5 ? 274 : n >= 4 ? 268 : 248;
  BACK_TIP_Y = n >= 9 ? 78  : n >= 7 ? 84  : n >= 5 ? 92  : n >= 4 ? 96  : 110;
}
const CONE_BOT_Y = Y_NECK, CONE_BOT_HALF = 30;
/* the sides hold their width well down the sleeve before drawing in, which is
   what keeps the opening broad. A straight taper narrows it far too fast. */
const SIDE_CURVE = 2.2;

/* half width of the sleeve at a given height, the single source of truth for
   the silhouette. Anything that must stay inside the paper asks this. */
function coneHalfWidth(y) {
  if (y <= SHOULDER_Y) return CONE_TOP_HALF;
  if (y >= CONE_BOT_Y) return CONE_BOT_HALF;
  const t = (y - SHOULDER_Y) / (CONE_BOT_Y - SHOULDER_Y);
  return CONE_TOP_HALF + (CONE_BOT_HALF - CONE_TOP_HALF) * Math.pow(t, SIDE_CURVE);
}

/* The top edge of the FRONT of the wrap at a given x: up the flap, then down
   the sweep into the opening. A bloom whose centre is above this line shows;
   one below it is behind the paper. Kept in step with the drawn path by hand,
   so adjust both together. */
function frontTopAt(x) {
  const dx = Math.min(Math.abs(x - CX), CONE_TOP_HALF);
  return NOTCH_Y - Math.pow(dx / CONE_TOP_HALF, 0.9) * (NOTCH_Y - SHOULDER_Y);
}

/* how wide the bouquet may be at a given height. Above the paper the sleeve is
   still the widest thing in the picture, so the envelope simply carries the
   shoulder width upward: that is what keeps leaves and petals from poking out
   past the sides of the wrap. */
const ENVELOPE_BLEND = 18;
function envelopeHalf(y) {
  if (y <= SHOULDER_Y - ENVELOPE_BLEND) return BOUQUET_HALF;
  if (y >= SHOULDER_Y) return coneHalfWidth(y);
  /* eased across the shoulder, or blooms just above the paper snap outward */
  return lerp(BOUQUET_HALF, CONE_TOP_HALF,
              (y - (SHOULDER_Y - ENVELOPE_BLEND)) / ENVELOPE_BLEND);
}
function clipToEnvelope(ctx) {
  ctx.beginPath();
  ctx.moveTo(CX - BOUQUET_HALF, 0);
  ctx.lineTo(CX + BOUQUET_HALF, 0);
  ctx.lineTo(CX + BOUQUET_HALF, SHOULDER_Y - ENVELOPE_BLEND);
  ctx.lineTo(CX + CONE_TOP_HALF, SHOULDER_Y);
  ctx.quadraticCurveTo(CX + 106, 302, CX + CONE_BOT_HALF, CONE_BOT_Y);
  ctx.lineTo(CX - CONE_BOT_HALF, CONE_BOT_Y);
  ctx.quadraticCurveTo(CX - 106, 302, CX - CONE_TOP_HALF, SHOULDER_Y);
  ctx.lineTo(CX - BOUQUET_HALF, SHOULDER_Y - ENVELOPE_BLEND);
  ctx.closePath();
  ctx.clip();
}

/* the two sides, bowed very slightly outward: drawn straight the sleeve reads
   as a rigid funnel rather than a sheet of paper */
function coneRightSide(ctx) {
  ctx.quadraticCurveTo(CX + 106, 302, CX + CONE_BOT_HALF, CONE_BOT_Y);
}
function coneBottomAndLeftSide(ctx) {
  ctx.lineTo(CX - CONE_BOT_HALF, CONE_BOT_Y);
  ctx.quadraticCurveTo(CX - 106, 302, CX - CONE_TOP_HALF, SHOULDER_Y);
}

/* the sheet behind, seen through the opening. Its own points rise above the
   front flaps, which is what gives the wrap its several petal like corners. */
function paperBack(ctx, wrap) {
  ctx.beginPath();
  /* one point, at the centre. Each side sweeps up in a single curve to it, so
     the silhouette reads as one folded sheet rather than a row of corners. */
  ctx.moveTo(CX - CONE_TOP_HALF, SHOULDER_Y);
  ctx.quadraticCurveTo(CX - 84, 122, CX, BACK_TIP_Y);
  ctx.quadraticCurveTo(CX + 84, 122, CX + CONE_TOP_HALF, SHOULDER_Y);
  coneRightSide(ctx);
  coneBottomAndLeftSide(ctx);
  ctx.closePath();
  paintPanel(ctx, wrap, -26);
}

function coneFrontPath(ctx) {
  ctx.beginPath();
  /* a sharp point at each top corner, then a long sweep down into the opening */
  ctx.moveTo(CX - CONE_TOP_HALF, SHOULDER_Y);
  /* control tied to the notch, not a fixed height, or a shallow opening ends
     up with its control point above its own end point and the sweep inverts */
  ctx.quadraticCurveTo(CX - 54, NOTCH_Y - 42, CX, NOTCH_Y);
  ctx.quadraticCurveTo(CX + 54, NOTCH_Y - 42, CX + CONE_TOP_HALF, SHOULDER_Y);
  coneRightSide(ctx);
  coneBottomAndLeftSide(ctx);
  ctx.closePath();
}

function paperFront(ctx, wrap) {
  coneFrontPath(ctx);
  paintPanel(ctx, wrap, 0);

  /* One sheet folded round still has a near side and a far side. A soft shade
     over the right, clipped to the same path, rather than a second panel with
     its own outline. */
  ctx.save();
  coneFrontPath(ctx);
  ctx.clip();
  const g = ctx.createLinearGradient(CX - 20, 0, CX + CONE_TOP_HALF, 0);
  g.addColorStop(0, hsla(wrap.h, 26, 24, 0));
  g.addColorStop(1, hsla(wrap.h, 26, 24, 0.17));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);
  ctx.restore();

  /* the fold running down from the base of the opening to the tie */
  ctx.strokeStyle = tone(wrap, -18, 0, 0.28);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(CX + 2, NOTCH_Y + 4);
  ctx.quadraticCurveTo(CX + 6, 330, CX + 3, CONE_BOT_Y - 4);
  ctx.stroke();
}

/* the tail flares from the tie down to its hem, so anything crossing it has to
   ask how wide it is at that height rather than assume the neck width */
const TAIL_TOP_Y = CONE_BOT_Y - 8, TAIL_HEM_Y = 462, TAIL_HEM_HALF = 46;
function tailHalfWidth(y) {
  if (y <= TAIL_TOP_Y) return CONE_BOT_HALF;
  const t = clamp((y - TAIL_TOP_Y) / (TAIL_HEM_Y - TAIL_TOP_Y), 0, 1);
  return lerp(CONE_BOT_HALF, TAIL_HEM_HALF, t);
}

function paperTail(ctx, wrap) {
  ctx.beginPath();
  ctx.moveTo(CX - CONE_BOT_HALF, CONE_BOT_Y - 8);
  ctx.lineTo(CX - 46, 462);
  ctx.quadraticCurveTo(CX, 474, CX + 46, 462);
  ctx.lineTo(CX + CONE_BOT_HALF, CONE_BOT_Y - 8);
  ctx.closePath();
  paintPanel(ctx, wrap, -15);
}

/* A flat painted bow, no band behind it. The band was the thing that kept
   reading as a printed stripe across the paper: a real ribbon tied round a
   gathered sleeve mostly disappears behind the knot. Fill only, no outline,
   with the fold inside each loop shown as a darker shape rather than a line,
   and nothing symmetrical. */

function ribbonAndBow(ctx, wrap) {
  const r = wrap.ribbon || { h: 12, s: 78, l: 68 };
  const base = hsla(r.h, r.s, r.l, 1);
  const deep = hsla(r.h, clamp(r.s + 8, 0, 100), clamp(r.l - 16, 0, 100), 1);
  const lift = hsla(r.h, clamp(r.s - 4, 0, 100), clamp(r.l + 9, 0, 100), 1);

  /* the band runs from by-8 to by+16, so its centre is by+4. The bow is drawn
     around `by`, which left it sitting high on the band. */
  const bx = CX, by = 368;

  /* the bow is drawn at a fixed size and then scaled, so its proportions stay
     put while it is sized against the sleeve */
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(1.05, 1.05);
  ctx.translate(-bx, -by);

  /* The band crossing the paper, spanning it exactly. It used to be a fixed 30
     either side, but the sleeve is nearer 39 at that height, so the ribbon
     looked like it was sitting on the wrap rather than passing around it.
     Measured from the cone above and the flared tail below, plus a hair of
     overhang since a ribbon wraps around the paper, not flush to it. */
  const bandTop = by - 12, bandBot = by + 12, overhang = 1.5;
  const wTop = coneHalfWidth(bandTop) + overhang;
  const wBot = tailHalfWidth(bandBot) + overhang;
  ctx.fillStyle = deep;
  ctx.beginPath();
  ctx.moveTo(bx - wTop, bandTop + 1);
  ctx.quadraticCurveTo(bx, bandTop + 5, bx + wTop, bandTop);
  ctx.quadraticCurveTo(bx + (wTop + wBot) / 2, by + 5, bx + wBot, bandBot);
  ctx.quadraticCurveTo(bx, bandBot + 5, bx - wBot, bandBot + 1);
  ctx.quadraticCurveTo(bx - (wTop + wBot) / 2, by + 5, bx - wTop, bandTop + 1);
  ctx.closePath();
  ctx.fill();

  /* tails: they part at the knot and sweep away in opposite directions, each
     curving as it falls and one running longer than the other. Crossed tails
     read as a drawn symbol of a bow; parted ones read as ribbon. */
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(bx - 5, by + 3);
  ctx.quadraticCurveTo(bx - 20, by + 26, bx - 44, by + 54);
  ctx.quadraticCurveTo(bx - 34, by + 54, bx - 25, by + 47);
  ctx.quadraticCurveTo(bx - 12, by + 26, bx - 1, by + 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(bx + 5, by + 3);
  ctx.quadraticCurveTo(bx + 17, by + 22, bx + 34, by + 42);
  ctx.quadraticCurveTo(bx + 26, by + 43, bx + 19, by + 38);
  ctx.quadraticCurveTo(bx + 9, by + 22, bx + 1, by + 8);
  ctx.closePath();
  ctx.fill();

  /* Loops only, drawn smaller than the rest of the bow. At full size they ran
     about two and a half times the width of the gathered paper they are tied
     around, which is what made the bow read oversized; the tails and the band
     keep their length so the ribbon still has presence. */
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(0.75, 0.82);
  ctx.translate(-bx, -by);

  /* loops: long and flat, angled up and out, the left one larger. Generous,
     like the painted bow in the reference, rather than a tight little knot. */
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(bx - 5, by);
  ctx.bezierCurveTo(bx - 32, by - 38, bx - 78, by - 33, bx - 75, by - 11);
  ctx.bezierCurveTo(bx - 72, by + 9, bx - 29, by + 12, bx - 4, by + 5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(bx + 5, by);
  ctx.bezierCurveTo(bx + 29, by - 33, bx + 69, by - 28, bx + 66, by - 8);
  ctx.bezierCurveTo(bx + 63, by + 11, bx + 26, by + 13, bx + 4, by + 5);
  ctx.closePath();
  ctx.fill();

  /* the inside of each loop, where the ribbon turns back on itself */
  ctx.fillStyle = deep;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by + 1);
  ctx.quadraticCurveTo(bx - 30, by - 13, bx - 50, by - 14);
  ctx.quadraticCurveTo(bx - 37, by + 3, bx - 5, by + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 6, by + 1);
  ctx.quadraticCurveTo(bx + 28, by - 11, bx + 45, by - 10);
  ctx.quadraticCurveTo(bx + 34, by + 5, bx + 5, by + 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  /* knot, small and slightly off centre */
  ctx.fillStyle = lift;
  ctx.beginPath();
  ctx.moveTo(bx - 7, by - 6);
  ctx.quadraticCurveTo(bx + 1, by - 9, bx + 8, by - 5);
  ctx.quadraticCurveTo(bx + 9, by + 4, bx + 6, by + 9);
  ctx.quadraticCurveTo(bx - 1, by + 12, bx - 7, by + 8);
  ctx.quadraticCurveTo(bx - 9, by + 1, bx - 7, by - 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/* All greenery is drawn before the front of the wrap and clipped to the
   bouquet's envelope. Between them those two facts are what stop leaves
   straying outside the wrapper: anything below the paper edge is hidden by the
   paper, and anything wider than the sleeve is cut off by the clip. */
/* All greenery is drawn before the front of the wrap and clipped to the
   bouquet's envelope. Between them those two facts are what stop leaves
   straying outside the wrapper: anything below the paper edge is hidden by the
   paper, and anything wider than the sleeve is cut off by the clip.

   Two kinds can be chosen. Each then draws a smaller share of its usual
   density, so a pair reads as a fuller mix rather than simply twice as much
   foliage, and each is nudged round by a different angle so they interleave
   instead of tracing the same fan. */
function greenery(ctx) {
  const kinds = currentFoliages();
  if (!kinds.length) return;

  ctx.save();
  clipToEnvelope(ctx);

  const share = kinds.length > 1 ? 0.62 : 1;
  kinds.forEach((f, ki) => {
    const skew = ki === 0 ? -6 : 7;      /* so two kinds do not sit on top of each other */
    const tag = f.id + "-" + ki;

    /* A scattered backdrop of short sprigs across the whole bunch, laid down
       first so it sits behind the blooms and fills the gaps between them. The
       fan below all radiates from one point, so by the time it reaches the
       flowers it has spread too thin to fill anything: this is what actually
       stops the bouquet reading as empty. */
    const density = STEM_COUNT >= 9 ? 2 : STEM_COUNT >= 7 ? 1.8 : STEM_COUNT >= 5 ? 1.4 : STEM_COUNT >= 4 ? 1.1 : 0.7;
    const backCount = Math.max(1, Math.round(f.sprigs * density * share));
    for (let i = 0; i < backCount; i++) {
      const seed = hashSeed("back-" + tag + "-" + i);
      const x = CX + (seededRand(seed + 1.9) - 0.5) * 2 * (BOUQUET_HALF - 30);
      const y = 128 + seededRand(seed + 4.7) * 132;
      const ang = -90 + (seededRand(seed + 8.3) - 0.5) * 150;
      const len = 30 + seededRand(seed + 2.4) * 28;
      foliageSprig(ctx, f.id, x, y,
        x + Math.cos(deg(ang)) * len, y + Math.sin(deg(ang)) * len, seed, 0.7);
    }

    /* The fan rises from just under the opening rather than from the tie.
       Started down at the tie, almost all of every sprig falls behind the front
       of the wrap and the foliage choice stops being visible at all. It is also
       kept fairly upright: sprigs thrown wide land under the sweeping edge of
       the paper and are simply swallowed. */
    const ORIGIN_Y = 336;
    const sprigCount = Math.max(1, Math.round(f.sprigs * (STEM_COUNT >= 5 ? 1.7 : 1.1) * share));
    for (let i = 0; i < sprigCount; i++) {
      const seed = hashSeed("sprig-" + tag + "-" + i);
      const t = sprigCount === 1 ? 0.5 : i / (sprigCount - 1);
      const a = lerp(-44, 44, t) + skew + (seededRand(seed + 4.1) - 0.5) * 9;
      /* roughly every third sprig is a long one that breaks the top line above
         the flowers, the way cut foliage never comes trimmed to one height */
      const tall = i % 3 === 1;
      const scale = STEM_COUNT >= 7 ? 1 : STEM_COUNT >= 5 ? 0.94 : STEM_COUNT >= 4 ? 0.9 : 0.8;
      const len = ((tall ? 268 : 198) + (seededRand(seed) - 0.5) * 74) * scale;
      foliageSprig(ctx, f.id, CX, ORIGIN_Y,
        CX + Math.sin(deg(a)) * len, ORIGIN_Y - Math.cos(deg(a)) * len,
        seed, 0.92);
    }

    /* a scatter woven in low and central, where the opening is deepest and
       there is most visible room */
    const weaveCount = Math.max(1, Math.round(f.collar * (STEM_COUNT >= 5 ? 1.7 : 1.1) * share));
    for (let i = 0; i < weaveCount; i++) {
      const seed = hashSeed("weave-" + tag + "-" + i);
      const t = weaveCount === 1 ? 0 : (i / (weaveCount - 1)) * 2 - 1;
      const x = CX + t * 54 + (seededRand(seed) - 0.5) * 16;
      const y = 258 - Math.abs(t) * 34 + (seededRand(seed + 3.3) - 0.5) * 22;
      const ang = t * 40 - 34 + skew + (seededRand(seed + 5.1) - 0.5) * 24;
      const len = 30 + seededRand(seed + 7.2) * 14;
      foliageSprig(ctx, f.id, x, y,
        x + Math.cos(deg((t < 0 ? 180 - ang * 2 : 0) + ang)) * len,
        y + Math.sin(deg((t < 0 ? 180 - ang * 2 : 0) + ang)) * len,
        seed, 0.95);
    }
  });

  ctx.restore();
}

function drawStemAndLeaves(ctx, s) {
  ctx.strokeStyle = hsla(142, 34, 36, 0.92);
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(SB.x, SB.y);
  ctx.quadraticCurveTo(s.ctrlX, s.ctrlY, s.tipX, s.tipY);
  ctx.stroke();

  const side = seededRand(s.seed + 12.3) > 0.5 ? 1 : -1;
  const t = 0.55;
  const px = qPoint(SB.x, s.ctrlX, s.tipX, t);
  const py = qPoint(SB.y, s.ctrlY, s.tipY, t);
  const tx = qTan(SB.x, s.ctrlX, s.tipX, t);
  const ty = qTan(SB.y, s.ctrlY, s.tipY, t);
  drawLeaf(ctx, px, py, Math.atan2(ty, tx) * 180 / Math.PI + side * 55, 24, 0.9);
}

/* ---- the whole picture ---- */

function renderBouquetCanvas(canvas, list, wrapId) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || parseFloat(canvas.style.width) || 320;
  const cssH = cssW * (VH / VW);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = cssH + "px";

  const ctx = canvas.getContext("2d");
  const s = (cssW / VW) * dpr;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, VW, VH);

  /* an id from an old link or the landing page, or a paper built from the
     builder's own controls */
  const wrap = (wrapId && typeof wrapId === "object") ? wrapId
             : (WRAPS_MAP[wrapId] || WRAPS_MAP.butter);
  const stems = buildArrangement(list);   /* also sizes the opening */

  const paintBloom = st => {
    const meta = SPECIES_MAP[st.species];
    if (!meta) return;
    const b = st.band;
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.translate(st.tipX, st.tipY + bloomOriginNudge(st.species, 1));
    ctx.rotate(deg(st.bloomAngle));
    drawSpeciesBloom(ctx, st.species, st.R * b.rMul, stemHue(st.species, st.seed),
      clamp(meta.sat * b.satMul, 0, 100), clamp(meta.light + b.lightOff, 0, 100));
    ctx.restore();
  };

  /* Everything green and every bloom goes down BEFORE the front of the wrap.
     The paper then cuts across whatever sits low in the opening, which is both
     how a real bouquet looks and the reason nothing can end up perched on top
     of the sleeve or straying past its sides. */
  paperBack(ctx, wrap);
  greenery(ctx);
  ctx.save();
  clipToEnvelope(ctx);
  stems.forEach(st => drawStemAndLeaves(ctx, st));
  stems.forEach(paintBloom);
  ctx.restore();

  paperFront(ctx, wrap);
  paperTail(ctx, wrap);
  ribbonAndBow(ctx, wrap);

  /* Where every bloom ended up, in CSS pixels rather than virtual units, so a
     pointer position can be tested against it without redoing the scaling.
     Front of the list is the back of the bouquet, which is the order hit
     testing walks backwards through. */
  const toCss = cssW / VW;
  canvas._blooms = stems.map(st => ({
    species: st.species,
    idx: st.idx,
    x: st.tipX * toCss,
    y: (st.tipY + bloomOriginNudge(st.species, 1)) * toCss,
    r: st.R * st.band.rMul * toCss
  }));
  /* A canvas can opt out with data-no-tooltip. The landing page's examples do:
     they are illustrations of the thing, not a bouquet anyone is exploring, and
     a label following the cursor there is just noise. */
  if (!canvas.hasAttribute("data-no-tooltip")) attachBloomTooltip(canvas);
  if (canvas.hasAttribute("data-drag-swap")) attachBloomDrag(canvas);
}

/* ---------------------------------------------------------- rearranging ----------------------------------------------------------
   The arrangement decides where a stem goes, and until now that was the end of
   it: you could choose which flowers were in the bunch but not which one stood
   at the front. Dragging one bloom onto another trades their places, which is
   the whole of it, so the bunch keeps the shape the arrangement gave it and
   only the flowers move. A free drop was the other option and it fights the
   sender: every bloom is pulled back inside the paper and above the front
   edge, so a flower dropped low or wide visibly springs somewhere else.

   The swap is two entries of state.flowers, which is why buildArrangement no
   longer re-fans its input: a derived order cannot be edited. */

function attachBloomDrag(canvas) {
  if (canvas._dragReady) return;
  canvas._dragReady = true;
  /* the gesture is a drag, so the browser must not read it as a scroll */
  canvas.style.touchAction = "none";

  const at = e => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  /* Rings over the finished picture: the bloom in hand dashed, the one it
     would land on solid. Drawn straight onto the canvas rather than as an
     overlay element, since the blooms are recorded in CSS pixels already. */
  const mark = () => {
    if (canvas._dragFrom == null) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (canvas._blooms || []).forEach(b => {
      const isFrom = b.idx === canvas._dragFrom;
      const isOver = b.idx === canvas._dragOver;
      if (!isFrom && !isOver) return;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 3.5, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.setLineDash(isFrom && !isOver ? [4, 3] : []);
      ctx.strokeStyle = isFrom && !isOver ? "rgba(29,100,102,0.9)" : "rgba(255,255,255,0.95)";
      ctx.stroke();
    });
    ctx.restore();
  };

  const repaint = () => {
    renderBouquetCanvas(canvas, state.flowers, currentWrap());
    mark();
  };

  const end = () => {
    const had = canvas._dragFrom != null;
    canvas._dragFrom = null;
    canvas._dragOver = null;
    canvas.style.cursor = "";
    if (had) renderBouquetCanvas(canvas, state.flowers, currentWrap());
  };

  canvas.addEventListener("pointerdown", e => {
    const [px, py] = at(e);
    const b = bloomAt(canvas, px, py);
    if (!b) return;
    e.preventDefault();
    canvas._dragFrom = b.idx;
    canvas._dragOver = null;
    canvas.style.cursor = "grabbing";
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    repaint();
  });

  canvas.addEventListener("pointermove", e => {
    const [px, py] = at(e);
    const b = bloomAt(canvas, px, py);
    if (canvas._dragFrom == null) {
      canvas.style.cursor = b ? "grab" : "";
      return;
    }
    const over = b && b.idx !== canvas._dragFrom ? b.idx : null;
    if (over === canvas._dragOver) return;   /* only repaint when it changes */
    canvas._dragOver = over;
    repaint();
  });

  canvas.addEventListener("pointerup", e => {
    const from = canvas._dragFrom;
    if (from == null) return;
    const [px, py] = at(e);
    const b = bloomAt(canvas, px, py);
    if (b && b.idx !== from) {
      const t = state.flowers[from];
      state.flowers[from] = state.flowers[b.idx];
      state.flowers[b.idx] = t;
      canvas._dragFrom = null;
      canvas._dragOver = null;
      canvas.style.cursor = "";
      renderLivePreview();     /* every preview on the page, not just this one */
      return;
    }
    end();
  });

  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("lostpointercapture", end);
}

/* ---------------------------------------------------------- bloom tooltip ----------------------------------------------------------
   Hover a flower to read what it means, or tap it on a touch screen. The same
   handler serves both: pointer events report their own type, so one code path
   covers a mouse hovering and a finger tapping. */

function bloomAt(canvas, px, py) {
  const list = canvas._blooms || [];
  for (let i = list.length - 1; i >= 0; i--) {      /* frontmost bloom first */
    const b = list[i];
    const dx = px - b.x, dy = py - b.y;
    if (dx * dx + dy * dy <= b.r * b.r) return b;
  }
  return null;
}

function attachBloomTooltip(canvas) {
  if (canvas._tipReady) return;
  canvas._tipReady = true;

  const holder = canvas.parentElement;
  if (!holder) return;
  if (getComputedStyle(holder).position === "static") holder.style.position = "relative";

  const tip = document.createElement("div");
  tip.className = "bq-bloom-tip";
  tip.setAttribute("role", "status");
  holder.appendChild(tip);

  const hide = () => { tip.classList.remove("on"); canvas._tipFor = null; };

  const show = (b, px, py) => {
    const meta = SPECIES_MAP[b.species];
    if (!meta) return hide();
    tip.innerHTML = '<strong>' + meta.name + '</strong><span>' + meta.meaning + '</span>';
    tip.classList.add("on");
    /* keep it inside the holder rather than letting it run off the edge */
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const maxX = holder.clientWidth - w - 4;
    tip.style.left = Math.max(4, Math.min(px - w / 2, maxX)) + "px";
    tip.style.top = Math.max(4, py - b.r - h - 8) + "px";
    canvas._tipFor = b;
  };

  const at = e => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  canvas.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;          /* touch is handled on tap */
    const [px, py] = at(e);
    const b = bloomAt(canvas, px, py);
    canvas.style.cursor = b ? "pointer" : "";
    if (b) show(b, px, py); else hide();
  });

  canvas.addEventListener("pointerleave", hide);

  canvas.addEventListener("pointerdown", e => {
    const [px, py] = at(e);
    const b = bloomAt(canvas, px, py);
    if (!b) return hide();
    e.preventDefault();
    /* tapping the same bloom again dismisses it */
    if (canvas._tipFor && canvas._tipFor.species === b.species &&
        Math.abs(canvas._tipFor.x - b.x) < 0.5) return hide();
    show(b, px, py);
  });

  document.addEventListener("pointerdown", e => {
    if (e.target !== canvas) hide();
  });
}

/* Small preview of the paper for the wrap swatches. The pattern is drawn in
   the same virtual space as the bouquet and then sampled through a clip, so a
   swatch shows the paper at its true scale rather than a squashed version. */
function renderWrapSwatch(canvas, wrap) {
  const dpr = window.devicePixelRatio || 1;
  const w = 64, h = 64;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  ctx.fillStyle = tone(wrap, 0, 0, 1);
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(-CX + w / 2, -300 + h / 2);   /* sample the middle of the sheet */
  paintPattern(ctx, wrap);
  ctx.restore();

  /* a fold on the right, so the swatch still reads as paper */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.56, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(w * 0.66, h);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = hsla(wrap.h, 28, 22, 0.13);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  /* the ribbon this paper is paired with */
  const r = wrap.ribbon || { h: 12, s: 78, l: 68 };
  ctx.fillStyle = hsla(r.h, r.s, r.l, 1);
  ctx.fillRect(0, h * 0.63, w, h * 0.15);
  ctx.restore();
}

/* ---------------------------------------------------------- state ---------------------------------------------------------- */

const state = { flowers: [], hues: {}, foliages: [], legacyWrap: null,
  wrapH: WRAP_DEFAULT.h, wrapS: WRAP_DEFAULT.s, wrapL: WRAP_DEFAULT.l, wrapP: WRAP_DEFAULT.p, ribbonH: null,
  card: null, bg: null, to: "", msg: "", from: "" };
/* ====================================================================
   TWO TRACKS: a real bouquet, and a drawn one
   ====================================================================
   The builder used to be one linear wizard. It now forks at the very
   start into a PHYSICAL order, which ends with a florist delivering real
   flowers, and the DIGITAL bouquet, which is everything this page did
   before and still ends in a share link.

   They are kept as two step lists rather than one, because they have
   almost nothing in common: the physical track has no wrapping paper to
   choose, no backdrop and no share link, and the digital one has no
   address, no ongkir and nothing to pay. `STEPS` is whichever list is
   live, so `goToStep`, the progress bar and the resize handler all keep
   working against one array without knowing which track they are on.

   The mode chooser and the template gallery sit OUTSIDE both lists, so
   they carry no progress dot: they are not steps in making a bouquet,
   they are the questions that decide which bouquet you are making.
   ==================================================================== */

const TRACKS = {
  digital:  ["flowers", "foliage", "wrap", "card", "letter", "bg", "reveal"],
  physical: ["city", "pick", "note", "delivery", "pay", "done"]
};
const TRACK_LABELS = {
  digital:  ["Flowers", "Foliage", "Wrap", "Card", "Letter", "Backdrop", "Reveal"],
  physical: ["City", "Bouquet", "Card", "Delivery", "Payment", "Done"]
};
/* Screens with no progress bar. The reveal hides its own chrome anyway;
   these are the ones that are not part of a track at all. */
const CHROMELESS = ["mode", "template", "reveal"];

let track = "digital";
let STEPS = TRACKS.digital;
let currentStep = 0;

function setTrack(name) {
  track = name;
  STEPS = TRACKS[name];
  renderProgress();
}

/* The dots are built from the live track rather than written into the
   HTML, because the two tracks have different lengths and different
   names. Anything that hard codes seven dots breaks the moment the
   physical track is showing. */
function renderProgress() {
  const nav = document.getElementById("bqProgress");
  if (!nav) return;
  const labels = TRACK_LABELS[track] || [];
  nav.innerHTML = labels.map((label, i) =>
    (i ? '<div class="bq-step-line"></div>' : "") +
    '<div class="bq-step-dot" data-idx="' + i + '"><div class="circ">' + (i + 1) + "</div>" + label + "</div>"
  ).join("");
}

/* ---------------------------------------------------------- physical: the data ---------------------------------------------------------- */

/* Placeholder cities and ongkir. Real numbers would come from the
   florist's own courier rates; these exist so the flow can be walked end
   to end and so the total on the payment step is a real sum of two real
   figures rather than a made up one. */
const CITIES = [
  { id: "jakarta",    name: "Jakarta",    area: "DKI Jakarta",    ongkir: 25000, when: "Same day if ordered before 15:00" },
  { id: "bandung",    name: "Bandung",    area: "Jawa Barat",     ongkir: 30000, when: "Same day if ordered before 14:00" },
  { id: "yogyakarta", name: "Yogyakarta", area: "DI Yogyakarta",  ongkir: 30000, when: "Same day if ordered before 14:00" },
  { id: "surabaya",   name: "Surabaya",   area: "Jawa Timur",     ongkir: 35000, when: "Next day delivery" },
  { id: "denpasar",   name: "Denpasar",   area: "Bali",           ongkir: 40000, when: "Next day delivery" },
  { id: "medan",      name: "Medan",      area: "Sumatera Utara", ongkir: 45000, when: "Next day delivery" }
];
const CITIES_MAP = Object.fromEntries(CITIES.map(c => [c.id, c]));

/* Three placeholder florists per city. The nine bouquets below are
   attributed round robin to whichever city is chosen, so the catalogue
   always reads as local without needing nine entries per city. */
const FLORISTS = {
  jakarta:    ["Kembang Senayan", "Toko Bunga Menteng", "Flora Kemang"],
  bandung:    ["Rumah Bunga Dago", "Kembang Braga", "Flora Cihampelas"],
  yogyakarta: ["Toko Bunga Malioboro", "Kembang Prawirotaman", "Flora Kaliurang"],
  surabaya:   ["Toko Bunga Darmo", "Kembang Gubeng", "Flora Tunjungan"],
  denpasar:   ["Bunga Sanur", "Flora Ubud", "Kembang Seminyak"],
  medan:      ["Toko Bunga Polonia", "Kembang Setiabudi", "Flora Merdeka"]
};

/* Nine bouquets. `img` is null on every one, which is the placeholder
   switch: the tile draws a labelled photo frame while it is null, and
   renders a real photograph the moment a path is put there. That is the
   whole change needed when the florist sends their pictures, and it is
   why the frame is photo shaped rather than a drawn bouquet. */
const CATALOGUE = [
  { id: "b1", name: "Pagi Cerah",   blurb: "Sunflowers, wheat and eucalyptus",  price: 285000, tone: "#f0cf82", img: null },
  { id: "b2", name: "Kasih",        blurb: "Red roses with baby's breath",      price: 465000, tone: "#d79aa8", img: null },
  { id: "b3", name: "Selamat",      blurb: "Bright mixed tulips",               price: 395000, tone: "#e5a49b", img: null },
  { id: "b4", name: "Tenang",       blurb: "White lilies and eucalyptus",       price: 375000, tone: "#b7d2c8", img: null },
  { id: "b5", name: "Terima Kasih", blurb: "Daisies, sage and fern",            price: 245000, tone: "#d4dba9", img: null },
  { id: "b6", name: "Semangat",     blurb: "Sunflowers with red berries",       price: 325000, tone: "#ebc07e", img: null },
  { id: "b7", name: "Lembut",       blurb: "Pastel roses and gypsophila",       price: 410000, tone: "#e2bfcb", img: null },
  { id: "b8", name: "Damai",        blurb: "White lilies, fern and linen wrap", price: 360000, tone: "#c3cfd9", img: null },
  { id: "b9", name: "Ceria",        blurb: "Seasonal mixed blooms",             price: 275000, tone: "#ddc5d4", img: null }
];
const CATALOGUE_MAP = Object.fromEntries(CATALOGUE.map(b => [b.id, b]));

/* Indonesian payment methods, and all three are MOCKS. Nothing is sent
   anywhere, no money moves, and deliberately none of them asks for a card
   number: QRIS, virtual account and e-wallet are the three ways an
   Indonesian checkout actually works, and none of them needs one. */
const PAY_METHODS = [
  { id: "qris",    name: "QRIS",            note: "Scan with any bank or e-wallet app" },
  { id: "va",      name: "Virtual account", note: "Transfer from your banking app",
    options: ["BCA", "BNI", "Mandiri", "BRI", "Permata"] },
  { id: "ewallet", name: "E-wallet",        note: "Pay from a wallet balance",
    options: ["GoPay", "OVO", "DANA", "ShopeePay"] }
];

const phys = {
  city: null, bouquet: null, florist: null,
  to: "", msg: "", from: "",
  recipient: "", phone: "", address: "", date: "",
  method: null, option: null, ref: null, va: null
};

function rupiah(n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }

function physTotals() {
  const b = CATALOGUE_MAP[phys.bouquet];
  const c = CITIES_MAP[phys.city];
  const price = b ? b.price : 0;
  const ongkir = c ? c.ongkir : 0;
  return { price, ongkir, total: price + ongkir };
}

/* A reference, not a receipt. It is generated on this device and means
   nothing to anyone, which is the honest state of a mock order. */
function makeOrderRef() {
  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2)
    + String(d.getMonth() + 1).padStart(2, "0")
    + String(d.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 4; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return "GG-" + stamp + "-" + tail;
}

function makeVaNumber(bank) {
  /* Deliberately not a real bank prefix. 8808 is not issued to anyone, so
     this cannot be mistaken for an account that could receive money. */
  let n = "";
  for (let i = 0; i < 11; i++) n += Math.floor(Math.random() * 10);
  return "8808" + n;
}

/* ---------------------------------------------------------- physical: the steps ---------------------------------------------------------- */

function renderCityGrid() {
  const grid = document.getElementById("cityGrid");
  if (!grid) return;
  grid.innerHTML = "";
  CITIES.forEach(c => {
    const tile = document.createElement("div");
    tile.className = "bq-city-tile" + (phys.city === c.id ? " picked" : "");
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    tile.innerHTML =
      '<span class="bq-city-name"></span>' +
      '<span class="bq-city-area"></span>' +
      '<span class="bq-city-ongkir"></span>' +
      '<span class="bq-city-when"></span>';
    tile.querySelector(".bq-city-name").textContent = c.name;
    tile.querySelector(".bq-city-area").textContent = c.area;
    tile.querySelector(".bq-city-ongkir").textContent = "Ongkir " + rupiah(c.ongkir);
    tile.querySelector(".bq-city-when").textContent = c.when;
    const pick = () => {
      phys.city = c.id;
      renderCityGrid();
      document.getElementById("toPickBtn").disabled = false;
    };
    tile.addEventListener("click", pick);
    tile.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    grid.appendChild(tile);
  });
  const btn = document.getElementById("toPickBtn");
  if (btn) btn.disabled = !phys.city;
}

function renderCatalogue() {
  const grid = document.getElementById("bouquetGrid");
  if (!grid) return;
  const shops = FLORISTS[phys.city] || FLORISTS.jakarta;
  const city = CITIES_MAP[phys.city];
  const where = document.getElementById("pickWhere");
  if (where) where.textContent = city ? "Florists delivering in " + city.name : "";
  grid.innerHTML = "";
  CATALOGUE.forEach((b, i) => {
    const shop = shops[i % shops.length];
    const tile = document.createElement("div");
    tile.className = "bq-shop-tile" + (phys.bouquet === b.id ? " picked" : "");
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");

    /* The photo slot. While `img` is null this paints a labelled frame, so
       it reads as a place a picture goes rather than as a broken image. */
    const frame = document.createElement("div");
    frame.className = "bq-shop-photo";
    if (b.img) {
      const im = document.createElement("img");
      im.src = b.img;
      im.alt = b.name + " from " + shop;
      frame.appendChild(im);
    } else {
      frame.style.background = "linear-gradient(160deg, " + b.tone + " 0%, #fffdf2 100%)";
      frame.innerHTML =
        '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' +
        '<rect x="2.5" y="5" width="19" height="14.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<circle cx="8.5" cy="10" r="1.8" fill="currentColor"/>' +
        '<path d="M3.5 17.5 9 12.5l4 3.5 3.5-2.5 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</svg><span>Florist photo</span>";
    }
    tile.appendChild(frame);

    const body = document.createElement("div");
    body.className = "bq-shop-body";
    body.innerHTML =
      '<span class="bq-shop-name"></span>' +
      '<span class="bq-shop-blurb"></span>' +
      '<span class="bq-shop-from"></span>' +
      '<span class="bq-shop-price"></span>';
    body.querySelector(".bq-shop-name").textContent = b.name;
    body.querySelector(".bq-shop-blurb").textContent = b.blurb;
    body.querySelector(".bq-shop-from").textContent = shop;
    body.querySelector(".bq-shop-price").textContent = rupiah(b.price);
    tile.appendChild(body);

    const pick = () => {
      phys.bouquet = b.id;
      phys.florist = shop;
      renderCatalogue();
      document.getElementById("toNoteBtn").disabled = false;
    };
    tile.addEventListener("click", pick);
    tile.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    grid.appendChild(tile);
  });
  const btn = document.getElementById("toNoteBtn");
  if (btn) btn.disabled = !phys.bouquet;
}

function initPhysNote() {
  const to = document.getElementById("physTo");
  const msg = document.getElementById("physMsg");
  const from = document.getElementById("physFrom");
  const count = document.getElementById("physMsgCount");
  const btn = document.getElementById("toDeliveryBtn");
  if (!to) return;
  const sync = () => {
    phys.to = to.value.trim();
    phys.msg = msg.value;
    phys.from = from.value.trim();
    if (count) count.textContent = msg.value.length + "/300";
    /* The card preview is the same object the florist will hand write, so
       it updates as it is typed rather than at the end. */
    const pv = document.getElementById("physCardPreview");
    if (pv) {
      pv.querySelector("[data-pc-to]").textContent = phys.to || "you";
      pv.querySelector("[data-pc-msg]").textContent = phys.msg || "";
      pv.querySelector("[data-pc-from]").textContent = phys.from || "a friend";
    }
    if (btn) btn.disabled = !(phys.to && phys.msg.trim() && phys.from);
  };
  [to, msg, from].forEach(el => el.addEventListener("input", sync));
  sync();
}

function initPhysDelivery() {
  const ids = ["physRecipient", "physPhone", "physAddress", "physDate"];
  const btn = document.getElementById("toPayBtn");
  const els = ids.map(i => document.getElementById(i));
  if (els.some(e => !e)) return;
  const sync = () => {
    phys.recipient = els[0].value.trim();
    phys.phone = els[1].value.trim();
    phys.address = els[2].value.trim();
    phys.date = els[3].value;
    if (btn) btn.disabled = !(phys.recipient && phys.phone.length >= 8 && phys.address.length >= 10 && phys.date);
  };
  els.forEach(e => e.addEventListener("input", sync));
  els[3].addEventListener("change", sync);
  /* A florist cannot deliver into the past, so today is the floor. */
  const today = new Date();
  els[3].min = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  sync();
}

function refreshDeliveryStep() {
  const c = CITIES_MAP[phys.city];
  const line = document.getElementById("deliveryCity");
  if (line && c) line.textContent = c.name + ", " + c.area + ". " + c.when + ".";
}

/* A QR that decodes to nothing. It carries the three finder squares so it
   reads as a QRIS at a glance, and random modules everywhere else, which
   means a phone pointed at it will simply fail to find a code rather than
   being sent anywhere. It is seeded from the order so it does not
   reshuffle on every repaint. */
function drawMockQR(canvas, seedStr) {
  if (!canvas) return;
  const N = 29, dpr = window.devicePixelRatio || 1;
  const box = canvas.clientWidth || 180;
  canvas.width = Math.round(box * dpr);
  canvas.height = Math.round(box * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cell = box / N;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, box, box);

  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };

  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);

  ctx.fillStyle = "#15403f";
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inFinder(x, y)) continue;
      if (rnd() > 0.52) ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }
  const finder = (cx, cy) => {
    ctx.fillStyle = "#15403f";
    ctx.fillRect(cx * cell, cy * cell, cell * 7, cell * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect((cx + 1) * cell, (cy + 1) * cell, cell * 5, cell * 5);
    ctx.fillStyle = "#15403f";
    ctx.fillRect((cx + 2) * cell, (cy + 2) * cell, cell * 3, cell * 3);
  };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
}

function renderPayment() {
  const t = physTotals();
  const b = CATALOGUE_MAP[phys.bouquet];
  const c = CITIES_MAP[phys.city];
  const sum = document.getElementById("paySummary");
  if (sum) {
    sum.innerHTML =
      '<div class="bq-pay-row"><span class="k"></span><span class="v"></span></div>' +
      '<div class="bq-pay-row"><span class="k"></span><span class="v"></span></div>' +
      '<div class="bq-pay-row total"><span class="k">Total</span><span class="v"></span></div>';
    const rows = sum.querySelectorAll(".bq-pay-row");
    rows[0].querySelector(".k").textContent = b ? b.name + ", " + (phys.florist || "") : "Bouquet";
    rows[0].querySelector(".v").textContent = rupiah(t.price);
    rows[1].querySelector(".k").textContent = "Ongkir to " + (c ? c.name : "");
    rows[1].querySelector(".v").textContent = rupiah(t.ongkir);
    rows[2].querySelector(".v").textContent = rupiah(t.total);
  }

  const grid = document.getElementById("payMethods");
  if (grid) {
    grid.innerHTML = "";
    PAY_METHODS.forEach(m => {
      const tile = document.createElement("div");
      tile.className = "bq-pay-tile" + (phys.method === m.id ? " picked" : "");
      tile.setAttribute("role", "button");
      tile.setAttribute("tabindex", "0");
      tile.innerHTML = '<span class="bq-pay-name"></span><span class="bq-pay-note"></span>';
      tile.querySelector(".bq-pay-name").textContent = m.name;
      tile.querySelector(".bq-pay-note").textContent = m.note;
      const pick = () => {
        phys.method = m.id;
        phys.option = m.options ? m.options[0] : null;
        if (m.id === "va") phys.va = makeVaNumber(phys.option);
        renderPayment();
      };
      tile.addEventListener("click", pick);
      tile.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
      });
      grid.appendChild(tile);
    });
  }

  const panel = document.getElementById("payPanel");
  const btn = document.getElementById("payConfirmBtn");
  if (!panel) return;
  panel.innerHTML = "";
  if (!phys.method) {
    panel.classList.remove("on");
    if (btn) btn.disabled = true;
    return;
  }
  panel.classList.add("on");
  if (btn) btn.disabled = false;

  const m = PAY_METHODS.find(x => x.id === phys.method);
  if (m.options) {
    const row = document.createElement("div");
    row.className = "bq-pay-options";
    m.options.forEach(o => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "bq-pay-chip" + (phys.option === o ? " picked" : "");
      chip.textContent = o;
      chip.addEventListener("click", () => {
        phys.option = o;
        if (phys.method === "va") phys.va = makeVaNumber(o);
        renderPayment();
      });
      row.appendChild(chip);
    });
    panel.appendChild(row);
  }

  if (phys.method === "qris") {
    const wrap = document.createElement("div");
    wrap.className = "bq-qris";
    wrap.innerHTML = '<canvas class="bq-qris-canvas"></canvas><p class="bq-pay-hint"></p>';
    wrap.querySelector(".bq-pay-hint").textContent =
      "Scan to pay " + rupiah(physTotals().total) + ". This is a demo code and cannot be scanned.";
    panel.appendChild(wrap);
    drawMockQR(wrap.querySelector(".bq-qris-canvas"), (phys.bouquet || "") + (phys.city || "") + "qris");
  } else if (phys.method === "va") {
    const wrap = document.createElement("div");
    wrap.className = "bq-va";
    wrap.innerHTML =
      '<span class="bq-va-bank"></span><span class="bq-va-number"></span><p class="bq-pay-hint"></p>';
    wrap.querySelector(".bq-va-bank").textContent = phys.option + " virtual account";
    wrap.querySelector(".bq-va-number").textContent = (phys.va || "").replace(/(\d{4})(?=\d)/g, "$1 ");
    wrap.querySelector(".bq-pay-hint").textContent =
      "Transfer " + rupiah(physTotals().total) + " to this number. It is a demo number and receives nothing.";
    panel.appendChild(wrap);
  } else {
    const wrap = document.createElement("div");
    wrap.className = "bq-ewallet";
    wrap.innerHTML = '<span class="bq-ew-name"></span><p class="bq-pay-hint"></p>';
    wrap.querySelector(".bq-ew-name").textContent = phys.option;
    wrap.querySelector(".bq-pay-hint").textContent =
      "You would be sent to " + phys.option + " to approve " + rupiah(physTotals().total) + ". Nothing is sent in this demo.";
    panel.appendChild(wrap);
  }
}

function renderReceipt() {
  const t = physTotals();
  const b = CATALOGUE_MAP[phys.bouquet];
  const c = CITIES_MAP[phys.city];
  if (!phys.ref) phys.ref = makeOrderRef();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("orderRef", phys.ref);
  set("orderBouquet", b ? b.name + ", " + (phys.florist || "") : "");
  set("orderTotal", rupiah(t.total));
  set("orderMethod", phys.method === "va" ? phys.option + " virtual account"
    : phys.method === "qris" ? "QRIS" : phys.option || "");
  set("orderTo", phys.recipient);
  set("orderWhere", phys.address + (c ? ", " + c.name : ""));
  set("orderWhen", phys.date);
  set("orderCard", phys.msg);
  set("orderCardTo", phys.to);
  set("orderCardFrom", phys.from);
}

/* ---------------------------------------------------------- digital: the nine templates ---------------------------------------------------------- */

/* A template is nothing but a preset of `state`, which is why it costs so
   little: every one of them renders through the same arrangement code as
   a hand built bouquet, so none of them can drift from what the builder
   can actually make. Picking one drops the sender at the letter step,
   since the words are the one thing a template cannot supply. */
const TEMPLATES = [
  { id: "t1", name: "Sunlit Thanks", blurb: "For someone who kept you going",
    s: { flowers: ["sunflower", "sunflower", "daisy", "tulip", "sunflower", "daisy"], foliages: ["wheat"],
         wrapH: 28, wrapS: 38, wrapL: 76, wrapP: "kraft", ribbonH: 200, card: "cream", bg: "sunlit" } },
  { id: "t2", name: "Quiet Comfort", blurb: "For a week that has been heavy",
    s: { flowers: ["lily", "lily", "lavender", "lavender", "daisy", "lily"], foliages: ["eucalyptus"],
         wrapH: 120, wrapS: 18, wrapL: 82, wrapP: "linen", ribbonH: 20, card: "mist", bg: "meadow" } },
  { id: "t3", name: "Love Letter", blurb: "For a love you want to say out loud",
    s: { flowers: ["rose", "rose", "rose", "rose", "lotus", "rose"], foliages: ["gyp"],
         wrapH: 350, wrapS: 45, wrapL: 28, wrapP: "plain", ribbonH: 38, card: "rose", bg: "dawn" } },
  { id: "t4", name: "New Beginnings", blurb: "For a fresh start worth marking",
    s: { flowers: ["tulip", "tulip", "daisy", "tulip", "daisy", "tulip"], foliages: ["fern"],
         wrapH: 40, wrapS: 10, wrapL: 97, wrapP: "plain", ribbonH: 140, card: "mint", bg: "sky" } },
  { id: "t5", name: "Get Well Soon", blurb: "For someone who needs a calm week",
    s: { flowers: ["daisy", "daisy", "lily", "daisy", "lily", "sunflower"], foliages: ["eucalyptus"],
         wrapH: 210, wrapS: 4, wrapL: 88, wrapP: "news", ribbonH: 350, card: "snow", bg: "linen" } },
  { id: "t6", name: "Congratulations", blurb: "For something they worked hard for",
    s: { flowers: ["sunflower", "tulip", "rose", "sunflower", "tulip", "rose", "daisy"], foliages: ["berries"],
         wrapH: 47, wrapS: 92, wrapL: 76, wrapP: "plain", ribbonH: 12, card: "sand", bg: "sunlit" } },
  { id: "t7", name: "Thinking of You", blurb: "For a moment you both want to keep",
    s: { flowers: ["sakura", "sakura", "lavender", "sakura", "lavender", "daisy"], foliages: ["beargrass"],
         wrapH: 350, wrapS: 38, wrapL: 88, wrapP: "plain", ribbonH: 150, card: "lilac", bg: "dusk" } },
  { id: "t8", name: "With Sympathy", blurb: "For when there is nothing to say",
    s: { flowers: ["lily", "lily", "lotus", "lily", "lotus", "sakura"], foliages: ["eucalyptus"],
         wrapH: 222, wrapS: 45, wrapL: 28, wrapP: "grid", ribbonH: 34, card: "snow", bg: "cream" } },
  { id: "t9", name: "Just Because", blurb: "For no reason at all",
    s: { flowers: ["rose", "tulip", "daisy", "sunflower", "lavender", "lily"], foliages: ["leaves"],
         wrapH: 150, wrapS: 38, wrapL: 26, wrapP: "linen", ribbonH: 40, card: "shell", bg: "blush" } }
];

/* Rebuilds every control in the digital track from whatever `state` now
   holds. Only the functions that clear their own container are re-run;
   `initWrapStep` is NOT among them, because it binds the three sliders,
   which live outside the grid it clears, and calling it twice would bind
   them twice. `refreshWrapStep` is the safe half of it. */
function syncBuilderToState() {
  initFlowerGrid();
  initFoliageGrid();
  refreshWrapStep();
  initSwatchGrid("cardGrid", "card", CARDS, "toLetterBtn", "card");
  initSwatchGrid("bgGrid", "bg", BACKDROPS, "toRevealBtn", "bg");
  markSwatch("cardGrid", state.card, "toLetterBtn");
  markSwatch("bgGrid", state.bg, "toRevealBtn");
  const to = document.getElementById("letterTo");
  const msg = document.getElementById("letterMsg");
  const from = document.getElementById("letterFrom");
  if (to) to.value = state.to || "";
  if (msg) msg.value = state.msg || "";
  if (from) from.value = state.from || "";
  renderLivePreview();
  refreshNotePreviews(true);
}

/* `initSwatchGrid` builds its tiles with nothing marked, because it has no
   idea anything was chosen before it ran. After a template there is. */
function markSwatch(gridId, id, btnId) {
  const grid = document.getElementById(gridId);
  if (!grid || !id) return;
  const sw = grid.querySelector('.bq-swatch[data-id="' + id + '"]');
  /* The button is only unlocked once the swatch was actually found. Enabling
     it regardless would let a template naming a palette id that no longer
     exists walk the sender past a step with nothing chosen. */
  if (!sw) return;
  sw.classList.add("picked");
  const btn = btnId && document.getElementById(btnId);
  if (btn) btn.disabled = false;
}

function applyTemplate(t) {
  Object.assign(state, {
    flowers: t.s.flowers.slice(), hues: {}, foliages: t.s.foliages.slice(), legacyWrap: null,
    wrapH: t.s.wrapH, wrapS: t.s.wrapS, wrapL: t.s.wrapL, wrapP: t.s.wrapP, ribbonH: t.s.ribbonH,
    card: t.s.card, bg: t.s.bg
  });
  syncBuilderToState();
}

function initTemplateStep() {
  const grid = document.getElementById("templateGrid");
  if (!grid) return;
  grid.innerHTML = "";
  TEMPLATES.forEach(t => {
    const tile = document.createElement("div");
    tile.className = "bq-template-tile";
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    const cv = document.createElement("canvas");
    cv.className = "bq-template-canvas";
    cv.setAttribute("data-no-tooltip", "");
    tile.appendChild(cv);
    const body = document.createElement("div");
    body.className = "bq-template-body";
    body.innerHTML = '<span class="bq-template-name"></span><span class="bq-template-blurb"></span>';
    body.querySelector(".bq-template-name").textContent = t.name;
    body.querySelector(".bq-template-blurb").textContent = t.blurb;
    tile.appendChild(body);
    const pick = () => {
      applyTemplate(t);
      /* Straight to the letter, which is the one thing no template can
         fill in. Every other step is already answered and reachable by
         walking back, so this is a shortcut rather than a lock. */
      goToStep("letter");
    };
    tile.addEventListener("click", pick);
    tile.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    grid.appendChild(tile);
    /* Drawn by the real renderer at the real size, so a template tile
       cannot promise a bouquet the builder would not produce. */
    renderBouquetCanvas(cv, t.s.flowers,
      buildWrap(t.s.wrapH, t.s.wrapS, t.s.wrapL, t.s.wrapP, t.s.ribbonH));
  });
}

function initModeStep() {
  const phy = document.getElementById("modePhysical");
  const dig = document.getElementById("modeDigital");
  if (phy) phy.addEventListener("click", () => { setTrack("physical"); goToStep("city"); });
  if (dig) dig.addEventListener("click", () => { setTrack("digital"); goToStep("template"); });
}


/* ---------------------------------------------------------- share link ---------------------------------------------------------- */

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function encodeState(s) {
  /* only hues that differ from the species default are sent, which keeps the
     link short for the common case where the sender changed nothing */
  const hs = {};
  Object.keys(s.hues).forEach(k => {
    const def = SPECIES_MAP[k] && SPECIES_MAP[k].hue;
    if (typeof s.hues[k] === "number" && s.hues[k] !== def) hs[k] = Math.round(s.hues[k]);
  });
  /* `a` says the flower list is already in arrangement order, dragged or not.
     Without it a link is from before dragging existed and holds the order the
     sender clicked the tiles in, which has to be fanned on the way back in. */
  /* `wh`, `wl` and `wp` are the paper the sender actually built. `w` is still
     written when an old link was opened and nothing was touched, so that
     bouquet keeps its hand-picked ribbon and ink rather than derived ones. */
  const compact = { f: s.flowers, a: 1, g: s.foliages, c: s.card, b: s.bg, t: s.to, m: s.msg, r: s.from };
  if (s.legacyWrap) compact.w = s.legacyWrap;
  else {
    compact.wh = Math.round(s.wrapH); compact.wl = Math.round(s.wrapL); compact.wp = s.wrapP;
    if (s.wrapS != null) compact.ws = Math.round(s.wrapS);
    /* only a ribbon the sender actually moved is sent; left alone it is derived */
    if (s.ribbonH != null) compact.wr = Math.round(s.ribbonH);
  }
  if (Object.keys(hs).length) compact.hs = hs;
  return b64encode(JSON.stringify(compact));
}
function decodeState(str) {
  const c = JSON.parse(b64decode(str));
  if (!Array.isArray(c.f) || c.f.length < 1) throw new Error("no flowers");
  if (!c.f.every(id => SPECIES_MAP[id])) throw new Error("unknown flower");
  /* Two shapes the paper has had. `wp` is a pattern with its own hue and
     lightness, which is what links carry now. `w` is one of the nine presets,
     which every link made before this carries, and it stays a preset so it
     renders with the exact ribbon and ink its sender saw. */
  let legacyWrap = null, wrapH = WRAP_DEFAULT.h, wrapL = WRAP_DEFAULT.l, wrapP = WRAP_DEFAULT.p;
  let wrapS = typeof c.ws === "number" ? clamp(c.ws, 0, 100) : null;
  let ribbonH = typeof c.wr === "number" ? clamp(c.wr, 0, 360) : null;
  if (c.wp && PATTERNS_MAP[c.wp]) {
    wrapP = c.wp;
    wrapH = clamp(typeof c.wh === "number" ? c.wh : WRAP_DEFAULT.h, 0, 360);
    wrapL = clamp(typeof c.wl === "number" ? c.wl : WRAP_DEFAULT.l, 20, 95);
  } else {
    legacyWrap = resolveWrap(c.w);
    if (!legacyWrap) throw new Error("unknown palette id");
    const w = WRAPS_MAP[legacyWrap];
    wrapH = w.h; wrapS = w.s; wrapL = w.l; wrapP = w.pattern;
  }
  if (!CARDS_MAP[c.c] || !BACKDROPS_MAP[c.b]) throw new Error("unknown palette id");
  /* links made before per-species colour carry one bouquet-wide hue in `h`.
     Spread it across every species so those links still open correctly. */
  const hues = {};
  if (typeof c.h === "number") {
    const legacy = clamp(c.h, 0, 360);
    ALL_SPECIES.forEach(sp => { hues[sp.id] = legacy; });   /* ALL, so a link naming a hidden species still gets its hue */
  }
  if (c.hs && typeof c.hs === "object") {
    Object.keys(c.hs).forEach(k => {
      if (SPECIES_MAP[k] && typeof c.hs[k] === "number") hues[k] = clamp(c.hs[k], 0, 360);
    });
  }
  const picked = c.f.slice(0, MAX_FLOWERS);
  return {
    flowers: c.a ? picked : fanOrder(picked),
    hues,
    /* `g` was a single id before two kinds could be chosen, and absent before
       foliage was a choice at all. Both older shapes still open. */
    foliages: (Array.isArray(c.g) ? c.g : [c.g])
      .filter(id => FOLIAGE_MAP[id])
      .slice(0, MAX_FOLIAGE)
      .concat(c.g === undefined ? [DEFAULT_FOLIAGE] : []),
    legacyWrap: legacyWrap, wrapH: wrapH, wrapS: wrapS, wrapL: wrapL, wrapP: wrapP, ribbonH: ribbonH,
    card: c.c, bg: c.b,
    to: String(c.t || ""), msg: String(c.m || ""), from: String(c.r || "")
  };
}
function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("b", encodeState(state));
  return url.toString();
}

/* ---------------------------------------------------------- step 1: flowers ---------------------------------------------------------- */

const CHECK_SVG = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 6.4 4.6 9 10 3.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function countOf(id) { return state.flowers.filter(f => f === id).length; }

function initFlowerGrid() {
  const grid = document.getElementById("flowerGrid");
  grid.innerHTML = "";
  SPECIES.forEach(sp => {
    const tile = document.createElement("div");
    tile.className = "bq-flower-tile";
    tile.dataset.species = sp.id;
    tile.innerHTML = `
      <span class="bq-count-badge" aria-hidden="true">0</span>
      <canvas></canvas>
      <span class="fname">${sp.name}</span>
      <span class="fmeaning">${sp.meaning}</span>
      <div class="bq-stepper">
        <button type="button" class="bq-step-btn" data-act="minus" aria-label="Remove one ${sp.name}">&minus;</button>
        <span class="bq-step-n">0</span>
        <button type="button" class="bq-step-btn" data-act="plus" aria-label="Add one ${sp.name}">+</button>
      </div>
      <label class="bq-tile-hue">
        <span class="bq-visually-hidden">${sp.name} colour</span>
        <input type="range" class="gg-hue-slider" min="0" max="360" value="${sp.hue}"
               aria-label="${sp.name} colour" />
      </label>
    `;
    tile.addEventListener("click", (e) => {
      if (e.target.closest(".bq-tile-hue")) return;
      const btn = e.target.closest(".bq-step-btn");
      if (btn) { e.stopPropagation(); changeFlower(sp.id, btn.dataset.act === "plus" ? 1 : -1); return; }
      changeFlower(sp.id, 1);
    });

    const slider = tile.querySelector(".bq-tile-hue input");
    slider.addEventListener("input", () => {
      state.hues[sp.id] = parseInt(slider.value, 10);
      renderFlowerTile(tile.querySelector("canvas"), sp.id, hueFor(sp.id));
      renderLivePreview();
    });
    slider.addEventListener("click", e => e.stopPropagation());

    grid.appendChild(tile);
    renderFlowerTile(tile.querySelector("canvas"), sp.id, hueFor(sp.id));
  });
  syncFlowerGrid();
}

function changeFlower(id, delta) {
  if (delta > 0) {
    if (state.flowers.length >= MAX_FLOWERS) return;
    state.flowers.push(id);
  } else {
    const idx = state.flowers.lastIndexOf(id);
    if (idx >= 0) state.flowers.splice(idx, 1);
  }
  /* the one place the fan is applied. Three roses picked in a row would
     otherwise be dealt into the bunch as three roses in a row. */
  state.flowers = fanOrder(state.flowers);
  syncFlowerGrid();
  renderLivePreview();
}

function syncFlowerGrid() {
  const total = state.flowers.length;
  document.querySelectorAll("#flowerGrid .bq-flower-tile").forEach(tile => {
    const n = countOf(tile.dataset.species);
    tile.classList.toggle("picked", n > 0);
    const hueWrap = tile.querySelector(".bq-tile-hue");
    if (hueWrap) hueWrap.classList.toggle("on", n > 0);
    tile.querySelector(".bq-step-n").textContent = n;
    const badge = tile.querySelector(".bq-count-badge");
    badge.textContent = n;
    badge.style.display = n > 0 ? "flex" : "none";
    tile.querySelector('[data-act="plus"]').disabled = total >= MAX_FLOWERS;
    tile.querySelector('[data-act="minus"]').disabled = n === 0;
  });

  const note = document.getElementById("selCount");
  const remaining = MIN_FLOWERS - total;
  note.textContent = remaining > 0
    ? `${total} picked, choose at least ${remaining} more`
    : total >= MAX_FLOWERS
      ? `${total} stems, that is a full bouquet`
      : `${total} stem${total === 1 ? "" : "s"} picked`;
  note.classList.toggle("ok", remaining <= 0);
  document.getElementById("toFoliageBtn").disabled = remaining > 0;
}

function refreshFlowerTiles() {
  document.querySelectorAll("#flowerGrid .bq-flower-tile").forEach(tile => {
    renderFlowerTile(tile.querySelector("canvas"), tile.dataset.species, hueFor(tile.dataset.species));
  });
}

/* the live preview is what makes the colour sliders meaningful. Without it the
   arrangement is never seen until the final step */
function renderLivePreview() {
  const has = state.flowers.length > 0;
  document.querySelectorAll(".bq-live-preview").forEach(canvas => {
    const holder = canvas.closest(".bq-preview-holder");
    const empty = holder ? holder.querySelector(".bq-preview-empty") : null;
    if (holder) holder.classList.toggle("has-flowers", has);
    if (empty) empty.style.display = has ? "none" : "block";
    canvas.style.display = has ? "block" : "none";
    if (has) renderBouquetCanvas(canvas, state.flowers, currentWrap());
  });
  document.querySelectorAll(".bq-drag-hint").forEach(h => h.classList.toggle("on", has));
}

function initFoliageGrid() {
  const grid = document.getElementById("foliageGrid");
  grid.innerHTML = "";
  FOLIAGE.forEach(f => {
    const tile = document.createElement("div");
    tile.className = "bq-flower-tile bq-foliage-tile";
    tile.dataset.foliage = f.id;
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    tile.innerHTML = `
      <canvas></canvas>
      <span class="fname">${f.name}</span>
      <span class="fblurb">${f.note}</span>
    `;
    const pick = () => {
      const chosen = Array.isArray(state.foliages) ? state.foliages.slice() : [];
      const at = chosen.indexOf(f.id);
      if (f.id === "none") {
        /* "none" is a statement, not an ingredient: it clears the rest */
        state.foliages = at >= 0 ? [] : ["none"];
      } else if (at >= 0) {
        chosen.splice(at, 1);
        state.foliages = chosen.filter(id => id !== "none");
      } else {
        const next = chosen.filter(id => id !== "none");
        /* a third pick pushes the oldest out, so the tiles never dead end */
        if (next.length >= MAX_FOLIAGE) next.shift();
        next.push(f.id);
        state.foliages = next;
      }
      syncFoliageGrid();
      renderLivePreview();
    };
    tile.addEventListener("click", pick);
    tile.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    grid.appendChild(tile);
    renderFoliageTile(tile.querySelector("canvas"), f.id);
  });
  syncFoliageGrid();
}

function syncFoliageGrid() {
  const chosen = Array.isArray(state.foliages) ? state.foliages : [];
  document.querySelectorAll("#foliageGrid .bq-foliage-tile").forEach(tile => {
    tile.classList.toggle("picked", chosen.includes(tile.dataset.foliage));
  });
  const note = document.getElementById("foliageCount");
  if (note) {
    const real = chosen.filter(id => id !== "none");
    note.textContent = chosen.includes("none")
      ? "No foliage, just the flowers"
      : real.length === 0 ? "Pick one, or two to mix them"
      : real.length === 1 ? "1 picked, add another to mix them"
      : "2 picked, the most you can mix";
  }
  const btn = document.getElementById("toWrapBtn");
  if (btn) btn.disabled = chosen.length === 0;
}

/* ---------------------------------------------------------- steps 2, 3, 5: swatches ---------------------------------------------------------- */

/* ── The wrapping paper step ──
   Two sliders and a pattern list, rather than nine fixed papers. The pattern
   tiles are drawn with the CURRENT hue and lightness, so a tile always shows
   the paper you would actually get, and the check line underneath measures the
   paper against the blooms in this bouquet: that measurement is the whole
   reason the colour is a control now. 2.0 is the bar, which is enough for a
   background to read as behind rather than beside the flowers.
   Continue is never disabled here: there is always a paper, since the sliders
   open on a value. */
/* set by initWrapStep so goToStep can re-run the tiles and the check when the
   sender arrives, since the bouquet they are checking against was still being
   picked when this was first built */
let refreshWrapStep = () => {};

function initWrapStep() {
  const hue = document.getElementById("wrapHue");
  const light = document.getElementById("wrapLight");
  const ribbon = document.getElementById("ribbonHue");
  const papers = document.getElementById("paperGrid");
  const grid = document.getElementById("wrapGrid");
  const check = document.getElementById("wrapCheck");
  const next = document.getElementById("toCardBtn");
  if (!hue || !light || !grid) return;
  if (next) next.disabled = false;

  hue.value = state.wrapH;
  light.value = state.wrapL;
  /* the slider shows where the derived ribbon currently sits, so moving it
     starts from what is on screen rather than jumping */
  if (ribbon) ribbon.value = currentWrap().ribbon.h;

  function touched() {
    /* the sender has taken the paper over, so an old link's preset no longer
       decides what is drawn */
    state.legacyWrap = null;
  }

  function paintPapers() {
    if (!papers) return;
    papers.querySelectorAll(".bq-swatch").forEach(el => {
      const pp = PAPERS.find(x => x.id === el.dataset.id);
      renderWrapSwatch(el.querySelector("canvas"), {
        h: pp.h, s: pp.s, l: pp.l, pattern: pp.p, ink: inkFor(pp.h, pp.s, pp.l)
      });
      /* lit only while the sliders still sit exactly where it put them */
      el.classList.toggle("picked", !state.legacyWrap && state.wrapH === pp.h &&
        state.wrapS === pp.s && state.wrapL === pp.l && state.wrapP === pp.p);
    });
  }

  function paintTiles() {
    const w = currentWrap();
    grid.querySelectorAll(".bq-swatch-canvas").forEach(c => {
      const id = c.parentElement.dataset.id;
      renderWrapSwatch(c, {
        h: w.h, s: w.s, l: w.l, pattern: id, ink: inkFor(w.h, w.s, w.l)
      });
    });
    grid.querySelectorAll(".bq-swatch").forEach(el =>
      el.classList.toggle("picked", el.dataset.id === state.wrapP));
  }

  function paintCheck() {
    if (!check) return;
    const w = currentWrap();
    const r = wrapClash(w, state.flowers);
    if (r === null) { check.textContent = ""; check.className = "bq-wrap-check"; return; }
    if (r.ok) {
      check.className = "bq-wrap-check ok";
      check.textContent = "Your flowers stand out well against this paper.";
    } else {
      check.className = "bq-wrap-check warn";
      check.innerHTML = "Your " + r.species.toLowerCase() + " is close to this paper colour. " +
        '<button type="button" class="bq-wrap-fix" id="wrapFix">Adjust it for me</button>';
      const fix = document.getElementById("wrapFix");
      if (fix) fix.addEventListener("click", () => {
        touched();
        state.wrapL = fixWrapLightness(currentWrap(), state.flowers);
        light.value = state.wrapL;
        refresh();
      });
    }
  }

  function refresh() { paintPapers(); paintTiles(); paintCheck(); renderLivePreview(); }

  if (papers) {
    papers.innerHTML = "";
    PAPERS.forEach(pp => {
      const item = document.createElement("div");
      item.className = "bq-swatch-item";
      item.innerHTML = '<div class="bq-swatch" data-id="' + pp.id + '" role="button" tabindex="0" aria-label="' +
        pp.name + '"><canvas class="bq-swatch-canvas"></canvas><span class="bq-check">' + CHECK_SVG +
        '</span></div><div class="bq-swatch-label">' + pp.name + "</div>";
      const sw = item.querySelector(".bq-swatch");
      const pick = () => {
        touched();
        state.wrapH = pp.h; state.wrapS = pp.s; state.wrapL = pp.l; state.wrapP = pp.p;
        /* the paper brings its own ribbon; the slider below can still override it */
        state.ribbonH = pp.r;
        hue.value = pp.h; light.value = pp.l;
        if (ribbon) ribbon.value = currentWrap().ribbon.h;
        refresh();
      };
      sw.addEventListener("click", pick);
      sw.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
      });
      papers.appendChild(item);
    });
  }

  grid.innerHTML = "";
  PATTERNS.forEach(pat => {
    const item = document.createElement("div");
    item.className = "bq-swatch-item";
    item.innerHTML = '<div class="bq-swatch" data-id="' + pat.id + '" role="button" tabindex="0" aria-label="' +
      pat.name + '"><canvas class="bq-swatch-canvas"></canvas><span class="bq-check">' + CHECK_SVG +
      '</span></div><div class="bq-swatch-label">' + pat.name + "</div>";
    const sw = item.querySelector(".bq-swatch");
    const pick = () => { touched(); state.wrapP = pat.id; refresh(); };
    sw.addEventListener("click", pick);
    sw.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    grid.appendChild(item);
  });

  refreshWrapStep = () => {
    hue.value = state.wrapH; light.value = state.wrapL;
    if (ribbon) ribbon.value = currentWrap().ribbon.h;
    paintPapers(); paintTiles(); paintCheck();
  };
  hue.addEventListener("input", () => { touched(); state.wrapH = parseInt(hue.value, 10); refresh(); });
  light.addEventListener("input", () => { touched(); state.wrapL = parseInt(light.value, 10); refresh(); });
  if (ribbon) ribbon.addEventListener("input", () => {
    touched(); state.ribbonH = parseInt(ribbon.value, 10); refresh();
  });
  refresh();
}

function initSwatchGrid(gridId, stateKey, set, nextBtnId, kind) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  set.forEach(p => {
    const item = document.createElement("div");
    item.className = "bq-swatch-item";
    item.innerHTML = `<div class="bq-swatch" data-id="${p.id}" role="button" tabindex="0" aria-label="${p.name}"><span class="bq-check">${CHECK_SVG}</span></div><div class="bq-swatch-label">${p.name}</div>`;
    const sw = item.querySelector(".bq-swatch");

    if (kind === "wrap") {
      const c = document.createElement("canvas");
      c.className = "bq-swatch-canvas";
      sw.prepend(c);
      renderWrapSwatch(c, p);
    } else if (kind === "bg") {
      sw.style.background = cssGradient(p);
    } else {
      sw.style.background = hsla(p.h, p.s, p.l, 1);
    }

    const pick = () => {
      grid.querySelectorAll(".bq-swatch").forEach(el => el.classList.remove("picked"));
      sw.classList.add("picked");
      state[stateKey] = p.id;
      if (nextBtnId) document.getElementById(nextBtnId).disabled = false;
      if (stateKey === "wrap") renderLivePreview();
      if (stateKey === "card" || stateKey === "bg") refreshNotePreviews(true);
    };
    sw.addEventListener("click", pick);
    sw.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    grid.appendChild(item);
  });
}

/* ---------------------------------------------------------- navigation ---------------------------------------------------------- */

function goToStep(name) {
  currentStep = STEPS.indexOf(name);
  document.querySelectorAll("#bqBuilder .bq-step").forEach(el => el.classList.toggle("active", el.dataset.step === name));
  const isReveal = name === "reveal";
  document.getElementById("bqBuilder").style.display = isReveal ? "none" : "flex";
  /* CHROMELESS rather than "is this the reveal": the mode chooser and the
     template gallery are not steps in either track, so a progress bar over
     them would count a journey that has not started. */
  document.getElementById("bqProgress").style.display = CHROMELESS.includes(name) ? "none" : "flex";
  document.getElementById("bqWordmark").style.display = isReveal ? "none" : "flex";
  document.getElementById("bqRevealWrap").classList.toggle("active", isReveal);
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });

  /* Digital track */
  if (isReveal) renderFinal(false);
  else if (name === "wrap") { refreshWrapStep(); renderLivePreview(); }
  else if (name === "flowers" || name === "foliage") renderLivePreview();
  /* the note the last three steps preview is being built across all three of
     them, so each arrival has to pick up what the other two changed */
  else if (name === "card" || name === "letter" || name === "bg") refreshNotePreviews(true);
  /* The gallery paints nine real bouquets, and a canvas inside a step that
     is still `display: none` measures zero, so they are drawn on arrival
     rather than at boot. Same rule the note previews already follow. */
  else if (name === "template") initTemplateStep();

  /* Physical track */
  else if (name === "city") renderCityGrid();
  else if (name === "pick") renderCatalogue();
  else if (name === "delivery") refreshDeliveryStep();
  else if (name === "pay") renderPayment();
  else if (name === "done") renderReceipt();
}

function updateProgress() {
  document.querySelectorAll("#bqProgress .bq-step-dot").forEach(dot => {
    const idx = parseInt(dot.dataset.idx, 10);
    dot.classList.toggle("done", idx < currentStep);
    dot.classList.toggle("current", idx === currentStep);
  });
}

/* One updater for all three note previews. The card colour, letter and
   backdrop steps each hold their own copy, because they are three separate
   sections and a single node cannot sit in all of them, so this walks every
   `[data-note-preview]` on the page and brings it up to date.

   Each one is the reveal in miniature: the bouquet, the card tucked into it,
   on the backdrop. Only what the step is choosing changes, so the preview
   never stops being a preview of the same object. */
function refreshNotePreviews(repaintBouquet) {
  const card = CARDS_MAP[state.card] || CARDS_MAP.snow;
  const bg = BACKDROPS_MAP[state.bg] || BACKDROPS_MAP.cream;
  const wrap = currentWrap();
  document.querySelectorAll("[data-note-preview]").forEach(holder => {
    holder.style.background = cssGradient(bg);

    /* The bouquet is the same renderer the reveal uses, so it cannot drift.
       No tooltip is attached: these are illustrations of a choice being made,
       not a bouquet anyone is exploring, which is why the canvas carries
       `data-no-tooltip`.

       Only repainted when asked. Typing a letter fires this on every
       keystroke, and rebuilding an arrangement per character is real work for
       a picture that has not changed. The `clientWidth` test is the other
       half: a canvas on a `display: none` step measures 0 and the renderer
       falls back to a 320 wide bouquet, which then has the wrong height set on
       it when the step is finally shown. */
    const cv = holder.querySelector(".bq-note-bouquet");
    if (repaintBouquet && cv && cv.clientWidth > 0 && state.flowers.length) {
      renderBouquetCanvas(cv, state.flowers, wrap);
    }

    const tag = holder.querySelector(".bq-mini-tag");
    if (tag) tag.style.background = hsla(card.h, card.s, card.l, 1);

    const note = holder.querySelector(".bq-note");
    if (!note) return;
    note.style.background = hsla(card.h, card.s, card.l, 1);
    const to = holder.querySelector("[data-note-to]");
    const msg = holder.querySelector("[data-note-msg]");
    const from = holder.querySelector("[data-note-from]");
    if (to) to.textContent = state.to || "you";
    /* left genuinely empty rather than filled with a placeholder string, so
       the stylesheet's :empty rule can show the grey hint instead */
    if (msg) msg.textContent = state.msg || "";
    if (from) from.textContent = state.from || "a friend";
  });
}

function initLetterStep() {
  const toInput = document.getElementById("letterTo");
  const msgInput = document.getElementById("letterMsg");
  const fromInput = document.getElementById("letterFrom");
  const count = document.getElementById("msgCount");
  const btn = document.getElementById("toBgBtn");
  function sync() {
    state.to = toInput.value.trim();
    state.msg = msgInput.value.trim();
    state.from = fromInput.value.trim();
    count.textContent = `${msgInput.value.length}/600`;
    btn.disabled = !(state.to && state.msg);
    /* words and colours only: the bouquet behind them has not changed */
    refreshNotePreviews(false);
  }
  [toInput, msgInput, fromInput].forEach(el => el.addEventListener("input", sync));
  sync();
}

/* ---------------------------------------------------------- reveal ---------------------------------------------------------- */

let lastFocused = null;

function renderFinal(isRecipientView) {
  const revealWrap = document.getElementById("bqRevealWrap");
  const stage = document.getElementById("bqStage");
  const card = CARDS_MAP[state.card] || CARDS_MAP.snow;
  const bg = BACKDROPS_MAP[state.bg] || BACKDROPS_MAP.cream;

  revealWrap.classList.add("active");
  revealWrap.style.background = cssGradient(bg);

  const tagFace = document.querySelector("#bqCardTag .bq-card-face");
  tagFace.style.background = hsla(card.h, card.s, card.l, 1);
  const letterCard = document.getElementById("bqLetterCard");
  letterCard.style.background = hsla(card.h, card.s, card.l, 1);

  document.getElementById("cardTo").textContent = state.to || "you";
  document.getElementById("cardMsg").textContent = state.msg || "";
  document.getElementById("cardFrom").textContent = state.from || "a friend";

  document.getElementById("bqSharePanel").style.display = isRecipientView ? "none" : "flex";
  document.getElementById("bqBackNav").style.display = isRecipientView ? "none" : "flex";
  document.getElementById("bqRecipientCta").style.display = isRecipientView ? "block" : "none";
  document.getElementById("bqReadyHeading").textContent = isRecipientView ? "Someone made you a bouquet" : "Your bouquet is ready";
  document.getElementById("bqReadySub").textContent = isRecipientView
    ? "Hover a flower, or tap one, to see what it means. The little card holds your message."
    : "Tap the card to preview your note, then share the link.";

  /* Paint now, and again once layout has settled. The draw used to sit inside
     a requestAnimationFrame, which does not fire while the document is hidden:
     a recipient opening the link in a background tab, the usual case when a
     link is tapped from a chat app, got an empty stage. Nothing was painted,
     and the class that fades the canvas and the card in was never added
     either, so the whole reveal stayed invisible. The timeout is the path that
     always runs; the frame callback just sharpens it when the tab is visible. */
  drawFinalBouquet();
  requestAnimationFrame(drawFinalBouquet);
  setTimeout(() => {
    drawFinalBouquet();
    stage.classList.add("revealed");
  }, 60);
}

function drawFinalBouquet() {
  const canvas = document.getElementById("bouquetCanvas");
  if (canvas) renderBouquetCanvas(canvas, state.flowers, currentWrap());
}

function openLetter() {
  lastFocused = document.activeElement;
  const modal = document.getElementById("bqCardModal");
  modal.classList.add("open");
  document.getElementById("bqLetterClose").focus();
}
function closeLetter() {
  document.getElementById("bqCardModal").classList.remove("open");
  if (lastFocused) lastFocused.focus();
}

function initCardTagInteraction() {
  const tag = document.getElementById("bqCardTag");
  const modal = document.getElementById("bqCardModal");
  tag.addEventListener("click", openLetter);
  tag.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLetter(); } });
  document.getElementById("bqLetterClose").addEventListener("click", e => { e.stopPropagation(); closeLetter(); });
  modal.addEventListener("click", e => { if (e.target === modal) closeLetter(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) closeLetter(); });
}

/* ---------------------------------------------------------- share ---------------------------------------------------------- */

function initShareActions() {
  document.getElementById("copyLinkBtn").addEventListener("click", async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    const msg = document.getElementById("copiedMsg");
    msg.textContent = "Link copied";
    setTimeout(() => { msg.textContent = ""; }, 2200);
  });

  document.getElementById("waShareBtn").addEventListener("click", e => {
    e.preventDefault();
    const text = `I made you a little bouquet: ${buildShareUrl()}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
  });

  document.getElementById("emailShareBtn").addEventListener("click", e => {
    e.preventDefault();
    const body = `I made you a little bouquet. Open it here:\n\n${buildShareUrl()}`;
    window.location.href = `mailto:?subject=${encodeURIComponent("A bouquet for you")}&body=${encodeURIComponent(body)}`;
  });

  document.getElementById("startOverBtn").addEventListener("click", () => {
    window.location.href = window.location.pathname;
  });
}

/* Every button is looked up defensively, because the two tracks share this
   one function and only one track's markup is ever being walked. */
function onClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
}

function initNav() {
  /* the fork, and the way back to it */
  onClick("backToModeFromTemplate", () => goToStep("mode"));
  onClick("scratchBtn", () => { setTrack("digital"); goToStep("flowers"); });
  onClick("backToTemplate", () => goToStep("template"));

  /* physical track */
  onClick("backToModeFromCity", () => goToStep("mode"));
  onClick("toPickBtn", () => goToStep("pick"));
  onClick("backToCity", () => goToStep("city"));
  onClick("toNoteBtn", () => goToStep("note"));
  onClick("backToPick", () => goToStep("pick"));
  onClick("toDeliveryBtn", () => goToStep("delivery"));
  onClick("backToNote", () => goToStep("note"));
  onClick("toPayBtn", () => goToStep("pay"));
  onClick("backToDelivery", () => goToStep("delivery"));
  onClick("payConfirmBtn", () => { phys.ref = makeOrderRef(); goToStep("done"); });
  onClick("orderDigitalBtn", () => { setTrack("digital"); goToStep("template"); });

  document.getElementById("toFoliageBtn").addEventListener("click", () => goToStep("foliage"));
  document.getElementById("backToFlowersFromFoliage").addEventListener("click", () => goToStep("flowers"));
  document.getElementById("toWrapBtn").addEventListener("click", () => goToStep("wrap"));
  document.getElementById("backToFlowers").addEventListener("click", () => goToStep("foliage"));
  document.getElementById("toCardBtn").addEventListener("click", () => goToStep("card"));
  document.getElementById("backToWrap").addEventListener("click", () => goToStep("wrap"));
  document.getElementById("toLetterBtn").addEventListener("click", () => goToStep("letter"));
  document.getElementById("backToCard").addEventListener("click", () => goToStep("card"));
  document.getElementById("toBgBtn").addEventListener("click", () => goToStep("bg"));
  document.getElementById("backToLetter").addEventListener("click", () => goToStep("letter"));
  document.getElementById("toRevealBtn").addEventListener("click", () => goToStep("reveal"));
  document.getElementById("backToBg").addEventListener("click", () => goToStep("bg"));
}

/* ---------------------------------------------------------- boot ---------------------------------------------------------- */

function showLinkError() {
  document.getElementById("bqBuilder").style.display = "none";
  document.getElementById("bqProgress").style.display = "none";
  document.getElementById("bqWordmark").style.display = "none";
  document.getElementById("bqRevealWrap").classList.remove("active");
  document.getElementById("bqLinkError").style.display = "block";
}

let resizeTimer = null;
function initResize() {
  const rerender = () => {
    if (document.getElementById("bqRevealWrap").classList.contains("active")) {
      drawFinalBouquet();
    }
    if (STEPS[currentStep] === "flowers") renderLivePreview();
    if (["card", "letter", "bg"].includes(STEPS[currentStep])) refreshNotePreviews(true);
  };
  const debounced = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(rerender, 150); };
  window.addEventListener("resize", debounced);
  window.addEventListener("orientationchange", debounced);
  /* a tab that was hidden when the bouquet was built may have measured the
     canvas before it had a size, so redraw the moment it becomes visible */
  document.addEventListener("visibilitychange", () => { if (!document.hidden) rerender(); });
  window.addEventListener("pageshow", rerender);
}

function boot() {
  /* The landing page loads this file as well, to draw its illustration with
     the real renderer rather than keeping a ninth copy of the flower code.
     None of the builder exists there, so stop before touching any of it. */
  if (!document.getElementById("bqBuilder")) return;

  const encoded = new URLSearchParams(window.location.search).get("b");
  initCardTagInteraction();
  initResize();

  if (encoded) {
    try {
      Object.assign(state, decodeState(encoded));
      document.getElementById("bqBuilder").style.display = "none";
      document.getElementById("bqProgress").style.display = "none";
      document.getElementById("bqWordmark").style.display = "none";
      renderFinal(true);
    } catch (e) {
      showLinkError();
    }
    return;
  }

  initFlowerGrid();
  initFoliageGrid();
  initWrapStep();
  initSwatchGrid("cardGrid", "card", CARDS, "toLetterBtn", "card");
  initSwatchGrid("bgGrid", "bg", BACKDROPS, "toRevealBtn", "bg");
  initLetterStep();
  initModeStep();
  initPhysNote();
  initPhysDelivery();
  initNav();
  initShareActions();
  setTrack("digital");
  goToStep("mode");
}

document.addEventListener("DOMContentLoaded", boot);
