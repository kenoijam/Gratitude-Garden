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
    flagPhase(cache.phase);
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
    } catch (e) {}
  }

  var lastPhase = "";
  function flagPhase(p) {
    if (p === lastPhase) return;
    lastPhase = p;
    try {
      var r = document.documentElement;
      r.setAttribute("data-daylight", p);
      /* A SECOND, COARSER FLAG, because four of the six phases want light
         text and writing `[data-daylight='dusk'],[data-daylight='night']` on
         every rule is a list that will be forgotten the next time a phase is
         added. */
      r.setAttribute("data-dark", (p === "night" || p === "dusk") ? "1" : "0");
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
  (function () { var o = at(hourNow()); flagPhase(o.phase); paintVars(o); })();
})();
