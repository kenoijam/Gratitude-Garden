/* ═══════════════════════════════════════════════════════════════════════════
   garden-daylight.js  ·  THE GARDEN KNOWS WHAT TIME IT IS

   ONE COPY AT THE v2 ROOT, like `garden-music.js`, `garden-life.js`,
   `garden-cursor.js` and the rest. Both gardens read it, so the sky can never
   be one colour on one page and another colour on the other. This project
   already pays for the same flower maths living in seven places; a second
   palette would drift inside a session.

   ─────────────────────────────────────────────────────────── WHY IT EXISTS
   Browning's *14 Patterns of Biophilic Design* lists **Connection with
   Natural Systems**, an awareness of natural process and of seasonal and
   temporal change, as one of its patterns, and it is the one pattern this
   project had NONE of. The garden was lit at the same hour for ever: you
   could plant at six in the morning or at midnight and the sun sat in the
   same place at the same brightness. A garden that does not know it is night
   is a picture of a garden.

   It also buys a little of Kaplan's **extent**, the sense that the place
   carries on being a place when you are not looking at it, which is the one
   component of Attention Restoration Theory the gardens were weakest on: a
   single unchanging screen has no extent at all.

   ──────────────────────────────────────────────── IT IS THE VISITOR'S CLOCK
   Local time, from their own device, never a server and never UTC. The whole
   point is that the garden agrees with the window they are sitting next to.
   `?clock=21` overrides it for a demo, which matters for an interview held at
   two in the afternoon; see `override()`.

   ────────────────────────────────────────── INTERPOLATED, NEVER STEPPED
   The phases below are KEYFRAMES on a 24 hour curve and every value is lerped
   between the two surrounding keys, so nothing ever jumps. A stepped palette
   would put a cliff at some arbitrary minute where the whole garden changed
   colour in one frame, which is the fault the hero's own `VIEW_W` had before
   it was derived rather than tiered.

   ─────────────────────── THE DAY KEYFRAME IS THE GARDEN'S EXISTING PALETTE
   `day` holds `#cfeef0`, `#f9ffff`, `#a9d9cf`, `#8fcfbe`, `#7ec4b4` and
   `#dff0e8` EXACTLY, which is what both sketches have always hard coded. So
   at midday the garden is the garden it has always been, to the byte, and
   every other hour reads as that same garden at a different time rather than
   as a recoloured one. **Change a garden colour and change it here too**, or
   noon will stop matching.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* Each key is an hour and a full palette. `h` is local hours as a float.
     The list must be sorted and must span 0 to 24, with the 0 and 24 entries
     identical, so midnight interpolates cleanly in both directions. */
  var NIGHT = {
    skyTop: "#13293f", skyBot: "#25495f",
    back:   "#1d4350", front: "#1b3b45", fore: "#17323a", ground: "#24474a",
    /* A MOON, NOT A DIM SUN: no rays, smaller, and very nearly white. A sun
       drawn faint at night reads as an overcast afternoon. */
    sunCore: [236, 243, 236], sunRay: [236, 243, 236],
    sunR: 24, sunX: 0.85, sunY: 0.19, sunAlpha: 0.95, rays: 0,
    stars: 1, fold: 1, dark: 1, tint: 1
  };
  var KEYS = [
    { h: 0,    p: NIGHT },
    { h: 4.6,  p: NIGHT },
    /* DAWN. Cool overhead and peach at the horizon, which is the way round a
       sunrise actually goes and the opposite of what looks right written
       down. The hills have not warmed up yet. */
    { h: 6.4,  p: { skyTop: "#9fc0d8", skyBot: "#ffd3bb",
                    back: "#8fb9b8", front: "#7cb0a6", fore: "#6ca79c",
                    ground: "#cfe2da",
                    sunCore: [255, 186, 130], sunRay: [255, 170, 120],
                    sunR: 44, sunX: 0.70, sunY: 0.35, sunAlpha: 0.85, rays: 1,
                    stars: 0.18, fold: 0.45, dark: 0.45, tint: 0.85 } },
    { h: 8.3,  p: { skyTop: "#c6e9ef", skyBot: "#fdfbf0",
                    back: "#a4d6cc", front: "#8bcbba", fore: "#7ac0b0",
                    ground: "#dcefe6",
                    sunCore: [255, 228, 150], sunRay: [255, 220, 150],
                    sunR: 54, sunX: 0.79, sunY: 0.25, sunAlpha: 1, rays: 1,
                    stars: 0, fold: 0.06, dark: 0.08, tint: 0.16 } },
    /* DAY. The garden's own palette, unchanged. */
    { h: 12,   p: { skyTop: "#cfeef0", skyBot: "#f9ffff",
                    back: "#a9d9cf", front: "#8fcfbe", fore: "#7ec4b4",
                    ground: "#dff0e8",
                    sunCore: [255, 220, 120], sunRay: [255, 210, 120],
                    sunR: 60, sunX: 0.85, sunY: 0.18, sunAlpha: 1, rays: 1,
                    stars: 0, fold: 0, dark: 0, tint: 0 } },
    { h: 16.4, p: { skyTop: "#cfeef0", skyBot: "#f9ffff",
                    back: "#a9d9cf", front: "#8fcfbe", fore: "#7ec4b4",
                    ground: "#dff0e8",
                    sunCore: [255, 215, 118], sunRay: [255, 205, 118],
                    sunR: 62, sunX: 0.89, sunY: 0.20, sunAlpha: 1, rays: 1,
                    stars: 0, fold: 0, dark: 0, tint: 0 } },
    /* GOLDEN. The biggest, warmest sun of the day and the one hour where the
       grass goes visibly yellow-green rather than teal. */
    { h: 18.2, p: { skyTop: "#a9cfe0", skyBot: "#ffd6a4",
                    back: "#b2cdba", front: "#9ac3a7", fore: "#87b799",
                    ground: "#e4ecd7",
                    sunCore: [255, 196, 96], sunRay: [255, 170, 80],
                    sunR: 74, sunX: 0.93, sunY: 0.29, sunAlpha: 1, rays: 1,
                    stars: 0, fold: 0.10, dark: 0.10, tint: 0.80 } },
    { h: 19.6, p: { skyTop: "#5f7196", skyBot: "#e2a08b",
                    back: "#6f8c97", front: "#5f8286", fore: "#527879",
                    ground: "#8faca2",
                    sunCore: [255, 150, 110], sunRay: [240, 120, 100],
                    sunR: 54, sunX: 0.96, sunY: 0.40, sunAlpha: 0.70, rays: 1,
                    stars: 0.35, fold: 0.62, dark: 0.62, tint: 0.95 } },
    { h: 21,   p: NIGHT },
    { h: 24,   p: NIGHT }
  ];

  /* ─────────────────────────────────────────────────────────── the maths */
  function hex2rgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16),
            parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(c) {
    return "#" + c.map(function (v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? "0" + s : s;
    }).join("");
  }
  function mix(a, b, t) { return a + (b - a) * t; }
  function mixRgb(a, b, t) { return [mix(a[0],b[0],t), mix(a[1],b[1],t), mix(a[2],b[2],t)]; }
  function mixHex(a, b, t) { return rgb2hex(mixRgb(hex2rgb(a), hex2rgb(b), t)); }

  /* ═══════════════════ WCAG CONTRAST, BECAUSE THE INK IS CHOSEN BY IT ═════
     The relative luminance formula and the ratio, in forty lines, so the
     module can answer "which of these two inks is readable on that" without
     anybody having to run an audit by hand afterwards. */
  function relLum(c) {
    var f = function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function contrast(a, b) {
    var x = relLum(a), y = relLum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  /* ═════════ THE INK ON THE SKY IS MEASURED, NOT TAKEN OFF THE HOUR ══════
     `data-dark` is the right switch for the page's flat SECTIONS, which can
     change colour, and it is the WRONG switch for text standing on a SKY,
     which cannot: a sky is the picture, so it has to go on sliding, and no
     flat ink is readable on all of it.

     THE TWO DISAGREED BADLY AND IT WAS MEASURED. At about 06:20 `dark` has
     just crossed 0.45, so the ink was already cream, while the dawn sky at
     the horizon is a pale peach `#fed2bb`. Cream on that is **1.27 to one**,
     which is not low contrast, it is text you cannot see. There were THIRTY
     ten minute windows a day under 4.5, morning and evening. The fault is
     that `dark` is how much LIGHT THERE IS and what text needs to know is
     how light the PIXEL BEHIND IT is, and at dawn those are opposites: the
     sun is barely up and the sky it is coming up through is nearly white.

     So the ink is whichever of the two measures better against the colours
     it is about to stand on, out of the same palette the canvas is painted
     from. Over the whole day that takes the worst case from 1.27 to 3.04 on
     the sky, and it flips the ink exactly TWICE, once each way, so nothing
     strobes at the crossover.

     ONE FLAG SERVES ALL THREE PLACES TEXT STANDS, and that was checked
     rather than assumed. Sampled every five minutes, the sky (the garden's
     name and the daily note), the ground (the Garden Tips card) and the
     hero want the SAME ink in 279 of 288 samples, and the nine that disagree
     sit at the crossover where both inks are marginal and the halo is doing
     the work anyway. A flag per region would be three things to keep in
     step for nine samples a day.

     THE DARK INK IS `#0f3b40`, WHICH IS THE NIGHT FOOTER'S OWN TEAL, and it
     is darker than the `#1d6466` the text used to be for a measured reason
     rather than a stylistic one: the garden's GROUND is a mid teal, and at
     `#1d6466` the Garden Tips card standing on it was under 4.5 for **63
     percent of the day**, a pre-existing failure nobody had measured
     because every earlier audit sampled the night sky. At `#0f3b40` that
     falls to 13 percent, and those remaining windows are what the halo in
     the two garden stylesheets is for. Nothing is invented: it is a colour
     this palette already carries.

     WHAT THE HALO IS NOT: the hard white `1px 1px 0` shadow this project
     deleted from both gardens, which fattened every letter on two sides and
     read as print that had not quite registered. This is a CENTRED, blurred
     halo in the opposite ink, which is the same reasoning the bloom shadow
     already carries ("centred and soft it is a halo that separates, and says
     nothing about the sun"). Its own edge against its ink is a fixed **11.58
     to one** at every hour, whatever the sky is doing, which is the thing
     that carries the minutes where neither flat ink clears 4.5. */
  var INK_LIGHT = "#fff9e3";    /* --cream */
  var INK_DARK  = "#0f3b40";    /* the night footer's teal */

  function inkFor(o) {
    var top = hex2rgb(o.skyTop), bot = hex2rgb(o.skyBot);
    /* The places DOM text actually stands: the sky's top third, where the
       garden's name and the daily note sit; the ground, where the tips card
       sits; and the hero's own two upper stops. */
    var spots = [top, mixRgb(top, bot, 0.33), hex2rgb(o.ground),
                 hex2rgb(o.fore), hex2rgb(o.front),
                 hex2rgb(o.hero0), mixRgb(hex2rgb(o.hero0), hex2rgb(o.hero1), 0.5)];
    var worst = function (ink) {
      var m = 99, i;
      for (i = 0; i < spots.length; i++) m = Math.min(m, contrast(ink, spots[i]));
      return m;
    };
    var wl = worst(hex2rgb(INK_LIGHT)), wd = worst(hex2rgb(INK_DARK));
    return { light: wl >= wd, worst: Math.max(wl, wd) };
  }

  /* ═════════ THE HALO IS ONLY AS STRONG AS THE HOUR MAKES IT NEED TO BE ══
     A halo held at full strength all day is a glow on a headline that did
     not need one: at noon the ink is already at 10 to one on its sky and
     the only thing a firm halo adds there is a soft edge on type that was
     perfectly crisp. Measured in the real garden across the day, the flat
     ink to sky ratio is 4.45 or better for all but about half an hour at
     dawn and half an hour at dusk, and it is only those two windows that
     need carrying.

     So the module hands out how badly it is needed rather than a fixed
     value. `haloK` is 0 wherever the flat ratio already clears AA and 1
     where it has fallen to 2, which is the worst the day reaches, and the
     stylesheets scale the halo's three alphas by it in a `calc()`. By day
     the letters are clean dark teal with the faintest edge; through dusk
     the edge firms up exactly as the sky closes on the ink; and the move
     between the two rides the same crossfade the colour does, so nothing
     steps.

     ITS FALLBACK IS 1, NOT 0. A page that fails to load this module gets
     the full halo rather than none, because the failure that matters is
     unreadable text and not a slightly soft headline. */
  function haloStrength(worst) {
    var k = (4.5 - worst) / 2.5;          /* 0 at AA, 1 at 2.0 to one */
    return Math.max(0, Math.min(1, k));
  }

  /* SMOOTHSTEP BETWEEN KEYS, not a straight line. A linear blend arrives at
     each keyframe with its full rate of change and leaves at the same rate,
     so the colour visibly "corners" at every key; eased, the palette settles
     into each hour and leaves it gently. Same reasoning as `leafEase` in both
     sketches, which is a smoothstep for the same reason. */
  function ease(t) { return t * t * (3 - 2 * t); }

  var HEXES  = ["skyTop", "skyBot", "back", "front", "fore", "ground"];
  var RGBS   = ["sunCore", "sunRay"];
  var NUMS   = ["sunR", "sunX", "sunY", "sunAlpha", "rays", "stars", "fold", "dark", "tint"];

  function at(hour) {
    hour = ((hour % 24) + 24) % 24;
    var i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1].h <= hour) i++;
    var a = KEYS[i], b = KEYS[i + 1];
    var span = b.h - a.h;
    var t = span <= 0 ? 0 : ease((hour - a.h) / span);
    var out = {};
    HEXES.forEach(function (k) { out[k] = mixHex(a.p[k], b.p[k], t); });
    RGBS.forEach(function (k)  { out[k] = mixRgb(a.p[k], b.p[k], t); });
    NUMS.forEach(function (k)  { out[k] = mix(a.p[k], b.p[k], t); });
    /* THE CLOUDS ARE DERIVED, NOT A KEYFRAME, because a cloud is only ever
       "white, pulled toward whatever the sky is doing". Left at a flat white
       they were the one daytime object left on a night sky and they read as
       pasted on, which is exactly how it looked. Pulled 74 percent of the way
       to the sky's own top colour at full dark they stay lighter than the sky
       behind them, so they are still legibly clouds, and they stop shouting. */
    out.cloud = mixHex("#ffffff", out.skyTop, 0.74 * out.dark);

    /* ════════════════ THE HERO'S OWN SKY, WHICH IS NOT THE GARDENS' SKY
       The landing page opens on `#b7e4e7 -> #e1f7f7 -> #fff9e3` and the
       gardens on `#cfeef0 -> #f9ffff`. Handing the hero the garden palette
       would change what it looks like AT NOON, and the rule this whole
       module is built on is that midday must be exactly what it has always
       been. So the hero's day colours are kept and PULLED toward the
       garden's palette by `tint`.

       `tint` IS NOT `dark`, AND THAT IS THE POINT. `dark` is how dark the
       hour is, and golden hour is barely dark at all (0.10) while being one
       of the most differently COLOURED hours there is. A hero blended by
       `dark` would have sat at 10 percent of a sunset. `tint` is how far
       the sky has moved from midday rather than how far the light has
       dropped: 0 at noon, 0.16 morning, 0.80 golden, 0.85 dawn, 0.95 dusk,
       1 night. */
    out.hero0 = mixHex("#b7e4e7", out.skyTop, out.tint);
    out.hero1 = mixHex("#e1f7f7", out.skyBot, out.tint);
    out.hero2 = mixHex("#fff9e3", out.ground, out.tint);

    /* ══════════════════ THE LANDING PAGE'S OWN TOKENS, DIMMED NOT DARKENED
       The five palette tokens in `styles.css` read these, with their own
       values as the fallback, so every section ground, every curve, every
       card and every badge follows the hour WITHOUT a second theme anybody
       has to proof read. A curve is painted in the colour of the section
       ABOVE it, so a token that did not move would leave a bright cream roll
       sitting on a dimmed section, which is exactly what `.wisdom::before`
       did: it is `var(--grass)`, the meadow's own foreground, and at ten at
       night it was still the one light green object on a dark page.

       A WARM DUSK, AND NOT A DARK MODE, AND THE REASON IS CONTRAST RATHER
       THAN TASTE. Cream could go to a mid tone on the way to dark, and a mid
       tone is the one place where NOTHING works: dark text fails on it and
       light text fails on it too, so every one of the ratios measured on this
       page would have to be measured again and some would have no answer.
       Dimming the paper instead can only ever IMPROVE a dark-on-light ratio,
       since the ink does not move and the ground gets darker, so the whole
       audit stays valid and the page still reads as the page. The dark teal
       band and the footer deepen with it and their cream text improves the
       same way.

       `dark` rather than `tint`, because this is about how much LIGHT there
       is in the room and not about what colour the sky has gone. */
    /* ═══════ THE PAGE'S FOUR GROUNDS: THE PROJECT'S OWN COLOURS, SWITCHED

       THE DAY SET is every ground light and every ink dark, which is the
       author's instruction: cream, pale blue, the meadow's pale green for
       the Fertilizer band, and a dark teal footer, because a dark foot is
       where a page ENDS and interrupts nothing. The band was the page's one
       dark section and is not any more; the cost is written down under
       `--band` in `styles.css`.

       THE NIGHT SET is the project's own dark teals and nothing invented:
       `#1d6466` IS `--darkteal`, the colour the band and the footer have
       worn since the beginning, and the other three are that same teal
       taken down in steps. Three earlier attempts each made a night colour
       up (a sandy mix, a dimmed khaki, the sky keyframe's navy) and each
       landed outside the palette. The alternation survives, since the four
       step down in order.

       ─────────── THEY SWITCH, THEY DO NOT CROSSFADE, AND THAT IS MEASURED
       Interpolating a ground from light to dark walks it through a MID TONE,
       and a mid tone is the one ground on which neither ink works: measured
       across the band's own two ends, every blend between 20 and 70 percent
       leaves BOTH the dark ink and the cream under 4.5, bottoming out at
       2.58 and 2.80. Since the text can only ever be one or the other, a
       continuously blended ground means a window every evening, about an
       hour wide, where the page cannot be read. A boolean has no such
       window: the ground and the ink change at the same instant and the
       1.2s CSS transition in `styles.css` is the only time either is in
       between, which is what every dark mode on the internet does.

       THE SKY AND THE GARDENS STILL SLIDE. This is only the page's flat
       sections, which carry text; a canvas sky carries none and interpolates
       exactly as before. */
    var nightOn = out.dark >= 0.45;
    out.paper     = nightOn ? "#1d6466" : "#fff9e3";
    out.paperCool = nightOn ? "#17565a" : "#e1f7f7";
    out.band      = nightOn ? "#134a4e" : "#dff0e8";
    out.foot      = nightOn ? "#0f3b40" : "#1d6466";
    out.night     = nightOn;

    /* THE COPY THAT STANDS ON THESE GROUNDS TURNS OVER IN `styles.css`,
       by name, under `html[data-dark='1']`. It cannot be done with a token:
       half of the body ink's uses sit on WHITE cards, which stay white at
       every hour, so a light ink would vanish on exactly those. */

    /* THE GRASS TOKEN IS THE MEADOW'S OWN FOREGROUND, handed over whole
       rather than dimmed separately, so the curve rolling out of the hero is
       the identical colour to the strip of ground it rolls off. */
    out.grass    = out.fore;

    /* THE INK FOR ANYTHING STANDING ON THE SKY OR THE GROUND, and the halo
       behind it, which is always the other one of the two. See
       `inkFor` above for why this is measured rather than taken off
       the hour. */
    var pick    = inkFor(out);
    out.inkLight = pick.light;
    out.inkWorst = pick.worst;
    out.haloK    = haloStrength(pick.worst);
    out.ink      = out.inkLight ? INK_LIGHT : INK_DARK;
    out.inkHalo  = out.inkLight ? INK_DARK  : INK_LIGHT;
    out.inkHaloRgb = hex2rgb(out.inkHalo).map(Math.round).join(", ");
    /* THE ACCENT IS THE EMPHASISED WORD IN THE HERO'S OWN TITLE, and both
       of its values are palette colours: the yellow on a dark ink, and the
       dark teal the title used to be on a light one, which keeps the em a
       step lighter than the ink around it either way. It used to be `--teal`
       at every hour, which is a colour this project has already had to take
       off three other pieces of text for failing AA. */
    out.inkAccent = out.inkLight ? "#fbe484" : "#1d6466";
    out.hour = hour;
    out.phase = hour < 5.4 || hour >= 20.4 ? "night"
              : hour < 7.4  ? "dawn"
              : hour < 11   ? "morning"
              : hour < 17.2 ? "day"
              : hour < 19   ? "golden" : "dusk";
    return out;
  }

  /* ───────────────────────────────────────── the clock, and the override
     `?clock=21` or `?clock=6.5` pins the hour for a demo. It is a QUERY
     STRING rather than a stored setting, for the same reason the hero drafts
     are: invisible to an ordinary visitor, and gone the moment the link is
     not used. `GardenDaylight.override(h)` does the same from the console,
     and `override(null)` hands it back to the real clock. */
  var forced = null;
  try {
    var q = new URLSearchParams(location.search).get("clock");
    if (q !== null && q !== "" && isFinite(parseFloat(q))) forced = parseFloat(q);
  } catch (e) {}

  function hourNow() {
    if (forced !== null) return forced;
    var d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  /* CACHED FOR A FEW SECONDS, because `draw()` asks sixty times a second and
     the sun does not move that fast. Twelve seconds of real time is under a
     thousandth of the shortest leg of the curve, so nothing is visibly
     stepped by it. */
  var cache = null, cacheAt = -1e9;
  function now() {
    var t = Date.now();
    if (cache && t - cacheAt < 12000 && forced === null) return cache;
    if (cache && forced !== null && cache.hour === forced) return cache;
    cache = at(hourNow());
    cacheAt = t;
    flagPhase(cache.phase, cache.night, cache.inkLight);
    paintVars(cache);
    return cache;
  }

  /* ───────────────────────────────── THE PHASE GOES ON `<html>` AS WELL
     Everything above is for the CANVAS, and a garden is not only canvas: the
     garden's name, the daily note and the tips card are DOM text standing
     directly on the sky, and dark teal on a dark night sky is a contrast
     failure rather than a mood. `data-daylight` lets each stylesheet say what
     those four should do after dark, which is the only honest way to have a
     night that is actually dark. */
  /* THE HERO'S THREE STOPS GO OUT AS CSS VARIABLES, since the hero's sky is
     a CSS gradient rather than a canvas. Written on every recompute, not
     only on a phase change, or the gradient would step between phases while
     the gardens' canvas slid smoothly. */
  function paintVars(o) {
    try {
      var st = document.documentElement.style;
      st.setProperty("--dl-hero0", o.hero0);
      st.setProperty("--dl-hero1", o.hero1);
      st.setProperty("--dl-hero2", o.hero2);
      st.setProperty("--dl-cloud", o.cloud);
      st.setProperty("--dl-dark", String(Math.round(o.dark * 1000) / 1000));
      st.setProperty("--dl-paper", o.paper);
      st.setProperty("--dl-paper-cool", o.paperCool);
      st.setProperty("--dl-band", o.band);
      st.setProperty("--dl-foot", o.foot);
      st.setProperty("--dl-grass", o.grass);
      /* THE INK AND ITS HALO GO OUT AS VARIABLES so the two garden
         stylesheets and the landing page all read ONE decision. The halo
         also goes out as a bare "r, g, b" triple, because the halo is used
         at three alphas and CSS cannot add an alpha to a hex held in a
         variable. Every rule that uses these carries the old hard coded
         value as its fallback, so a page that fails to load this module
         looks exactly as it always did. */
      st.setProperty("--dl-sky-ink", o.ink);
      st.setProperty("--dl-sky-halo", o.inkHalo);
      st.setProperty("--dl-sky-halo-rgb", o.inkHaloRgb);
      st.setProperty("--dl-sky-accent", o.inkAccent);
      st.setProperty("--dl-halo-k", String(Math.round(o.haloK * 100) / 100));
    } catch (e) {}
  }

  var lastPhase = "", lastDark = "", lastInk = "";
  function flagPhase(p, night, inkLight) {
    try {
      var r = document.documentElement;
      if (p !== lastPhase) { lastPhase = p; r.setAttribute("data-daylight", p); }
      /* ─────────────── `data-dark` IS THE SAME THRESHOLD THE GROUNDS USE
         It used to be the PHASE NAME, `night` or `dusk`, and that was wrong
         in a way worth recording: dusk begins at 19:00 and `dark` is only
         about 0.33 there, so the ink flipped to cream while the grounds were
         still two thirds light and the page spent the best part of an hour
         unreadable every evening. One number decides both now, so the ground
         and the ink can never disagree about what time it is.

         It stays a SEPARATE flag from `data-daylight` because what a rule
         usually wants to know is "is it dark", and spelling that out as a
         list of phase names on every rule is a list that gets forgotten the
         next time a phase is added. */
      var d = night ? "1" : "0";
      if (d !== lastDark) { lastDark = d; r.setAttribute("data-dark", d); }
      /* `data-ink` IS A THIRD FLAG AND IT IS NOT `data-dark`. The grounds
         switch on how dark the HOUR is, which is settled and measured; text
         on the sky switches on how light the SKY ITSELF is, and the two are
         not the same question. At dawn they are opposites. Rules that only
         need the colour should use `--dl-sky-ink`; this flag is for the few
         that have to switch something else with it, such as a border. */
      var k = inkLight ? "light" : "dark";
      if (k !== lastInk) { lastInk = k; r.setAttribute("data-ink", k); }
    } catch (e) {}
  }

  window.GardenDaylight = {
    now: now,
    at: at,
    hour: hourNow,
    override: function (h) { forced = (h === null || h === undefined) ? null : +h; cache = null; return now(); },
    /* Exposed so a sketch can ask without forcing a recompute. */
    phase: function () { return now().phase; }
  };

  /* Flag the phase as early as possible, so a stylesheet is not repainting
     the whole interface a beat after the page has already been seen. */
  (function () { var o = at(hourNow()); flagPhase(o.phase, o.night, o.inkLight); paintVars(o); })();
})();
