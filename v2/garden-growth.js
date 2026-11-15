/* ═══════════════════════════════════════════════════════════════════════════
   garden-growth.js  ·  SCROLL AS GROWTH

   ONE STEM DOWN THE WHOLE LANDING PAGE, grown by the scroll. It starts at the
   top of the section under the hero and stops at the footer, putting out a
   leaf every so often and opening one flower at the end.

   ─────────────────────────────────────────────────────────── WHY IT EXISTS
   Strauss and Fuad-Luke's slow design principle **EVOLVE**: an artefact
   should reveal itself over time rather than arriving whole. Every section of
   this page is about a thing that takes time, the About grid says in so many
   words that your flower grows, and nothing on the page had ever grown. This
   is the one place where the page performs its own subject. The reference is
   jld2nd.dev, whose vine does the same, and the thing taken from it is the
   MECHANIC rather than the drawing: the stem here is the gardens' own stem
   green at the gardens' own weight, and the leaf is the hero meadow's leaf.

   ───────────────────────────── THE GROWTH IS A DASH OFFSET, NOT A REDRAW
   The stem is ONE path whose length the browser already knows, so revealing
   it is `stroke-dashoffset` and nothing is rebuilt as the page moves. The
   leaves are CSS transforms toggled by a class, so each one animates itself
   once and is never touched again. What runs on scroll is a single number.

   ─────────────────────────────────────────── IT IS MEASURED, NEVER WRITTEN
   The path's height IS the page's height between those two points, so it
   cannot be written by hand: it would be right at one window size and wrong
   at every other. It is rebuilt on a WIDTH change and on a document height
   change, never on a plain scroll, for the same reason the landing page's
   other painters are: iOS collapses its address bar as you scroll and that
   fires a resize.

   ────────────────────────────────── HIDDEN UNDER 1100px, LIKE THE SIDE NAV
   That is the width where the page's side padding drops to 2.5rem and the
   copy moves out into the gutters; above it there is 5rem of empty margin on
   each side and the stem has a lane of its own. Below it there is no lane,
   and a vine over a paragraph is the fault the side nav was removed for.

   ─────────────────────── REDUCED MOTION GETS THE WHOLE STEM, NOT NO STEM
   Grown to its full length with every leaf out and the flower open, which is
   the choice `garden-life.js` already makes: the picture is not what anybody
   opted out of, the movement is.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var W = 60;            /* the lane, in px and in user units: the SVG is 1:1 */
  var AMP = 10;          /* how far the stem wanders either side of the lane */
  var SPUR = 12;         /* how far a bloom sits off the stem */
  var NODE = 28;         /* a bloom's box, in CSS px */
  var ENDNODE = 40;      /* the last one, which is the biggest */
  var WAVE = 540;        /* one full sway, in px of page */
  var LEAF_EVERY = 235;  /* px of stem between one bloom and the next */
  var STEM = "hsl(140,52%,32%)";   /* both gardens' stem green, exactly */
  var LEAF = "rgb(120,210,90)";    /* the hero meadow's own leaf fill */
  var LEAF_DARK = "rgb(92,170,70)";
  /* ═══ WHAT GROWS ON IT IS FLOWERS, AND LEAVES WERE THE FIRST ANSWER
     A green stem putting out green leaves down the margin is a creeper, and
     a creeper is decoration: the author's word for it was weird, and the
     fault is that it was the one growing thing on this page that was not a
     flower, on a site whose whole argument is that what you noticed becomes
     one. Each node is a small bloom now, opening as the tip reaches it, so
     scrolling the page grows a garden down its own edge.

     THE HUES ARE THE COLOUR WHEEL'S OWN, the eight the flower guide's ring
     is built from, walked in order so no two neighbours on the stem are the
     same colour and the whole run reads as a set rather than as a handful.
     They are NOT `drawSpeciesBloom`: the eight species are drawn by code
     that lives in the sketches and onto a canvas, and a stem that waited on
     a renderer to finish growing would be the wrong trade for a 26px mark.
     This is the five petal bloom the letter and the cursor already draw,
     which is honest about being a drawing. */
  var RING_HUES = [350, 22, 48, 140, 190, 232, 272, 332];

  var CSS = [
    "#growth-rail{position:absolute;left:auto;right:12px;width:" + W + "px;",
    "z-index:4;pointer-events:none;}",
    /* z-index 4 is measured against what is on this page: every section's own
       content is 5, so the stem passes BEHIND the copy and the cards; the
       section backgrounds and their curves carry no z-index at all, so it
       passes OVER those, which is the whole point of a stem that crosses the
       joins. The page dust is 6, Hortus 240, the music button 260, the side
       nav 9000 and the letter 9500, so it is under all of them. */
    "#growth-rail svg{display:block;overflow:visible;}",
    /* NO TRANSITIONS. Every scale here is written per frame from the scroll
       position, so the growth runs backwards when the page does. */
    ".gr-leaf{transform:translate(var(--x),var(--y)) rotate(var(--a)) scale(var(--s,0));}",
    ".gr-budshape{transform:translate(var(--x),var(--y)) scale(var(--s,0));}",
    ".gr-bud-skin{fill:var(--bud,#8fbf72);}",
    /* The species canvases are absolute children of the RAIL, not of the
       SVG, so they are placed in px and scaled about their own middle. */
    ".gr-head{position:absolute;transform-origin:50% 50%;transform:scale(var(--s,0));}",
    /* The last flower still fades in, since nothing grows past it. */
    ".gr-bloom{transform:translate(var(--x),var(--y)) rotate(var(--a)) scale(0);",
    "opacity:0;transition:transform .6s cubic-bezier(.2,.9,.25,1),opacity .45s linear;}",
    ".gr-bloom.is-out{transform:translate(var(--x),var(--y)) rotate(var(--a)) scale(1);opacity:1;}",
    ".gr-bud{position:absolute;transform-origin:50% 50%;transform:scale(0);opacity:0;",
    "transition:transform .6s cubic-bezier(.2,.9,.25,1),opacity .45s linear;}",
    ".gr-bud.is-out{transform:scale(1);opacity:1;}",
    /* A CSS TRANSLATE IN px ON AN SVG CHILD IS IN USER UNITS, which is why
       the anchors are written straight in viewBox numbers with no
       conversion. Same note `garden-mascot.js` carries about its gaze. */
    "@media (max-width:1100px){#growth-rail{display:none;}}",
    "@media (prefers-reduced-motion:reduce){",
    ".gr-bloom,.gr-bud{transition:none;}}"
  ].join("");

  var rail, svg, stem, leaves = [], nodes = [], bloom = null;
  var railTop = 0, railH = 0, len = 0, built = false;
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function css() {
    var s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* The lane's own curve. A polyline every 8px rather than a bezier, because
     `getTotalLength` and `getPointAtLength` are what place the leaves and a
     dense polyline gives both to well under a pixel. */
  function pathFor(h) {
    var d = "", y;
    for (y = 0; y <= h; y += 8) {
      var x = W / 2 + AMP * Math.sin((y / WAVE) * Math.PI * 2);
      d += (y === 0 ? "M" : "L") + x.toFixed(2) + " " + y + " ";
    }
    var lx = W / 2 + AMP * Math.sin((h / WAVE) * Math.PI * 2);
    d += "L" + lx.toFixed(2) + " " + h;
    return d;
  }

  /* ─────────────────────────────── THE REAL EIGHT, DRAWN BY THE REAL CODE
     `window._bloomFns` and `window._fitBloom` are the landing page's own
     catalogue family, the one that paints the flower guide's tiles, and
     `window._ringSpecies` is the guide's own list of the eight with their
     palette. So a bloom on this vine is the SAME DRAWING as the bloom in
     the guide a screen further down, in the same colour, and the two cannot
     drift. The first version drew a generic five petal flower here and the
     author's note was to use the species we have.

     IT IS A CANVAS PER NODE, NOT SVG, BECAUSE THAT IS WHAT THOSE FUNCTIONS
     TAKE: they are raw Canvas 2D, `fn(ctx, cx, cy, R, hue, sat, light)`.
     Each one is a `position:absolute` child of the rail rather than a child
     of the SVG, placed at the spur's end in rail coordinates, which the SVG
     shares exactly because its viewBox is 1:1 with its pixel size.

     THERE IS STILL A FALLBACK. The catalogue family is defined in the third
     inline block at the foot of `index.html`; that runs before
     DOMContentLoaded, so it is there by boot, but a page that failed to
     parse it gets the plain five petal bloom rather than a bare stem. */
  function speciesList() {
    var R = window._ringSpecies;
    if (R && R.length) return R;
    return null;
  }

  function bloomCanvas(sp, px) {
    var fns = window._bloomFns, fit = window._fitBloom;
    if (!fns || !fit || !fns[sp.id]) return null;
    var c = document.createElement("canvas");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(px * dpr);
    c.height = Math.round(px * dpr);
    c.style.width = px + "px";
    c.style.height = px + "px";
    var ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* 0.86 of the box, which is what the guide's own tiles leave: a bloom
       drawn to the edge has no air around it and reads as cropped. */
    var f = fit(sp.id, px, px, 0.86, 0.86);
    fns[sp.id](ctx, f.cx, f.cy, f.R, sp.hue, sp.sat, sp.light);
    return c;
  }

  /* The spur and its one leaf stay in the SVG, because they are part of the
     stem: a flower head floating beside a stem reads as stuck on, and twelve
     pixels of green is the whole of what fixes that. */
  function spurArt(side) {
    var k = side;
    var ns = "http://www.w3.org/2000/svg";
    var g = document.createElementNS(ns, "g");
    var spur = document.createElementNS(ns, "path");
    spur.setAttribute("d", "M0 0 Q " + (7 * k) + " -2 " + (SPUR * k) + " -5");
    spur.setAttribute("fill", "none");
    spur.setAttribute("stroke", STEM);
    spur.setAttribute("stroke-width", "2");
    spur.setAttribute("stroke-linecap", "round");
    g.appendChild(spur);
    var leaf = document.createElementNS(ns, "path");
    leaf.setAttribute("d", "M" + (3 * k) + " -1 Q " + (9 * k) + " " + (6 * k) +
                           " " + (16 * k) + " " + (4 * k) +
                           " Q " + (9 * k) + " " + (2 * k) + " " + (3 * k) + " -1 Z");
    leaf.setAttribute("fill", LEAF_DARK);
    g.appendChild(leaf);
    return g;
  }

  /* ─────────────────────────── A BUD, AND IT IS THE GARDENS' OWN BUD
     `drawBudShape` in both sketches draws sepals, a teardrop body and a seam
     down it, and the note beside it says why: a sphere on a stem reads as a
     PIN, and the seam is what says the thing is closed and about to open
     rather than merely round. This is that shape in SVG, at the one size it
     is ever drawn here.

     THE SKIN RIPENS THE SHORT WAY ROUND THE WHEEL. The gardens take the bud
     from a green at hue 112 to the flower's own hue as it ripens, and they
     do NOT lerp: `lerpColor` walks every component in a straight line, so
     green to a rose at 350 goes through 231 and the bud comes out PURPLE on
     every warm flower. `shortHue` takes the shorter arc, 112 to 51 to 350,
     down through yellow green and orange, which is how a bud actually
     colours up. Same trap, same fix, written out here because this file
     cannot reach the sketches' copy. */
  function shortHue(from, to, t) {
    var d = ((to - from) % 360 + 540) % 360 - 180;
    return (from + d * t + 360) % 360;
  }

  function budArt(side) {
    var k = side, ns = "http://www.w3.org/2000/svg";
    var g = document.createElementNS(ns, "g");
    var body = document.createElementNS(ns, "path");
    /* A teardrop, point up, about 9 by 13. */
    body.setAttribute("d", "M0 -7 C 4.6 -4.2 5.2 1.6 3 4.6 C 1.4 6.6 -1.4 6.6 -3 4.6 C -5.2 1.6 -4.6 -4.2 0 -7 Z");
    body.setAttribute("class", "gr-bud-skin");
    g.appendChild(body);
    var seam = document.createElementNS(ns, "path");
    seam.setAttribute("d", "M0 -6 C 1.6 -3 1.8 1.4 0.6 4.4");
    seam.setAttribute("fill", "none");
    seam.setAttribute("stroke", "rgba(0,0,0,0.14)");
    seam.setAttribute("stroke-width", "0.9");
    seam.setAttribute("stroke-linecap", "round");
    g.appendChild(seam);
    /* Two sepals hugging the base, in the stem's own green. */
    var sep = document.createElementNS(ns, "path");
    sep.setAttribute("d", "M-3.4 3.2 C -5.2 5.6 -3.2 7.4 0 7.4 C 3.2 7.4 5.2 5.6 3.4 3.2 C 1.8 5.4 -1.8 5.4 -3.4 3.2 Z");
    sep.setAttribute("fill", STEM);
    g.appendChild(sep);
    g.setAttribute("transform", "translate(" + (SPUR * k) + ",-5)");
    return g;
  }

  function bloomNode() {
    /* THE FIVE PETAL BLOOM THIS PROJECT ALREADY DRAWS, the one the letter and
       the cursor carry, rather than one of the eight species: the eight are
       drawn by code that lives in the sketches, and the stem must not wait on
       a renderer to finish growing. It is honest about being a drawing. */
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    var i, a;
    for (i = 0; i < 5; i++) {
      a = (i * 72 - 90) * Math.PI / 180;
      var e = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      e.setAttribute("cx", (Math.cos(a) * 9).toFixed(2));
      e.setAttribute("cy", (Math.sin(a) * 9).toFixed(2));
      e.setAttribute("rx", "8.5"); e.setAttribute("ry", "6.2");
      e.setAttribute("transform", "rotate(" + (i * 72) + " " +
                     (Math.cos(a) * 9).toFixed(2) + " " + (Math.sin(a) * 9).toFixed(2) + ")");
      e.setAttribute("fill", "hsl(350,62%,76%)");
      g.appendChild(e);
    }
    var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", "5.4"); c.setAttribute("fill", "#fbe484");
    g.appendChild(c);
    return g;
  }

  function build() {
    var first = document.getElementById("wisdom");
    var foot = document.querySelector("footer");
    if (!rail || !first || !foot) return false;

    railTop = first.offsetTop;
    railH = Math.max(0, foot.offsetTop - railTop);
    if (railH < 400) return false;

    rail.style.top = railTop + "px";
    rail.style.height = railH + "px";
    rail.innerHTML = "";
    leaves = [];
    nodes = [];

    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", W);
    svg.setAttribute("height", railH);
    svg.setAttribute("viewBox", "0 0 " + W + " " + railH);
    svg.setAttribute("aria-hidden", "true");

    stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stem.setAttribute("d", pathFor(railH));
    stem.setAttribute("fill", "none");
    stem.setAttribute("stroke", STEM);
    stem.setAttribute("stroke-width", "3");
    stem.setAttribute("stroke-linecap", "round");
    svg.appendChild(stem);

    len = stem.getTotalLength();
    stem.style.strokeDasharray = len;
    stem.style.strokeDashoffset = len;

    /* A LEAF EVERY `LEAF_EVERY` OF STEM, alternating sides, each one turned
       by the stem's own direction where it joins. Placed at a fixed arc
       length rather than at a fraction, so a long page gets more leaves
       rather than the same leaves further apart, which is what a plant does.
       The first is held back from the top so the stem is plainly a stem
       before it is anything else. */
    var at = LEAF_EVERY * 0.75, side = 1, n = 0;
    while (at < len - 90 && n < 60) {
      var pt = stem.getPointAtLength(at);
      var pt2 = stem.getPointAtLength(Math.min(len, at + 10));
      /* The tangent, so a leaf leaves the stem rather than crossing it. */
      var tang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      /* The spur leaves the stem out and slightly UP, which is the angle
         every leaf in both gardens is drawn at: at a right angle to its
         stem it reads as a bracket. */
      var g = spurArt(side);
      g.setAttribute("class", "gr-leaf");
      var lean = tang + (side > 0 ? -58 : 58) + (side > 0 ? 0 : 180);
      g.style.setProperty("--x", pt.x.toFixed(2) + "px");
      g.style.setProperty("--y", pt.y.toFixed(2) + "px");
      g.style.setProperty("--a", lean.toFixed(1) + "deg");
      svg.appendChild(g);

      /* THE EIGHT IN ORDER, so no two neighbours are the same flower and a
         long page shows the whole set rather than a handful of favourites.
         A canvas rather than an SVG child, so it has to be placed in rail
         coordinates by hand; the SVG's viewBox is 1:1 with its pixels, so
         the point it reports IS the offset from the rail's top left. */
      var ring = speciesList();
      var sp = ring ? ring[n % ring.length] : null;
      var head = sp ? bloomCanvas(sp, NODE) : null;
      if (head) {
        head.className = "gr-head";
        head.style.left = (pt.x + SPUR * side - NODE / 2).toFixed(1) + "px";
        head.style.top  = (pt.y - 5 - NODE / 2).toFixed(1) + "px";
        rail.appendChild(head);
        /* THE BUD IT OPENS OUT OF, in the SVG with the spur, drawn BEFORE
           the bloom in the tree so the bloom comes out in front of it. The
           bloom does not replace the bud: through the opening the bloom
           scales up while the bud shrinks around it, so there is no frame
           where one picture swaps for another. Both gardens do exactly
           this, and a straight crossfade was the obvious alternative there
           too: it reads as two drawings dissolving rather than as one thing
           opening. */
        var bud = budArt(side);
        bud.setAttribute("class", "gr-budshape");
        bud.style.setProperty("--x", pt.x.toFixed(2) + "px");
        bud.style.setProperty("--y", pt.y.toFixed(2) + "px");
        svg.appendChild(bud);
        nodes.push({ spur: g, bud: bud, head: head, hue: sp.hue, sat: sp.sat,
                     light: sp.light, at: at });
      }
      at += LEAF_EVERY;
      side = -side;
      n++;
    }

    rail.appendChild(svg);

    /* THE LAST ONE IS THE BIGGEST, and it is a species as well. It sits on
       the tip of the stem rather than off a spur, which is what makes it
       read as the thing the whole stem was growing toward. */
    var end = stem.getPointAtLength(len);
    var ring = speciesList();
    bloom = ring ? bloomCanvas(ring[(n + 1) % ring.length], ENDNODE) : null;
    if (bloom) {
      bloom.className = "gr-bud gr-end";
      bloom.style.left = (end.x - ENDNODE / 2).toFixed(1) + "px";
      bloom.style.top  = (end.y - ENDNODE / 2 - 2).toFixed(1) + "px";
      rail.appendChild(bloom);
    } else {
      bloom = bloomNode();
      bloom.setAttribute("class", "gr-bloom");
      bloom.style.setProperty("--x", end.x.toFixed(2) + "px");
      bloom.style.setProperty("--y", end.y.toFixed(2) + "px");
      bloom.style.setProperty("--a", "0deg");
      svg.appendChild(bloom);
    }
    built = true;
    return true;
  }

  /* WHAT RUNS ON SCROLL IS ONE NUMBER. The tip is kept a little above the
     bottom of the window, at 0.78 of it, so the stem is growing AHEAD of the
     reader rather than arriving at the same moment they do. */
  /* ═══════════════════════ IT GROWS THE WAY A GARDEN FLOWER GROWS
     The first version faded each bloom up at full size, which made the vine
     the one thing on this site that APPEARS rather than grows, on a page
     whose whole argument is the opposite. Both gardens plant a flower in two
     movements, `GROW_RISE` then `GROW_OPEN`: the stem rises with a BUD on its
     tip, and the bud opens into the bloom while shrinking around it. The
     same two movements here, driven by the scroll instead of by a clock.

     THE PROPORTIONS ARE THE GARDENS' OWN. 3400ms of rise against 1700ms of
     opening is two thirds to one third, so `OPEN_AT` is 0.66: a node is a
     bud for the first two thirds of its window and opens through the last.
     `NODE_RUN` is how much stem that window is worth, in px, which is what
     scroll is measured in here.

     NO CSS TRANSITION ON ANY OF IT. A transition is a thing that plays at
     its own speed once it is triggered; this has to follow the scroll both
     ways, including backwards, which is what makes it read as the page
     growing the flower rather than as the flower noticing it has been
     scrolled past. Each value is written straight.

     THE BUD RIPENS AS IT GOES, green to the flower's own hue the short way
     round the wheel, which is `shortHue` above. */
  var NODE_RUN = 170;    /* px of stem one flower takes to grow */
  var OPEN_AT  = 0.66;   /* where the bud stops rising and starts opening */
  function ease(t) { return 1 - Math.pow(1 - t, 3); }       /* the rise */
  function smooth(t) { return t * t * (3 - 2 * t); }        /* the opening */

  var lastP = -1;
  function paintNode(nd, g) {
    if (g <= 0) {
      nd.bud.style.setProperty("--s", "0");
      nd.head.style.setProperty("--s", "0");
      nd.spur.style.setProperty("--s", "0");
      return;
    }
    /* The spur and its leaf unfold with the first half of the rise, the way
       a leaf comes out on the way up rather than arriving with the bloom. */
    nd.spur.style.setProperty("--s", smooth(Math.min(1, g / 0.5)).toFixed(3));

    if (g < OPEN_AT) {
      var r = ease(g / OPEN_AT);
      nd.bud.style.setProperty("--s", (0.25 + 0.75 * r).toFixed(3));
      nd.head.style.setProperty("--s", "0");
      var h = shortHue(112, nd.hue, r);
      nd.bud.style.setProperty("--bud",
        "hsl(" + h.toFixed(1) + "," + (28 + (nd.sat - 28) * r).toFixed(1) + "%," +
        (48 + (nd.light - 48) * r).toFixed(1) + "%)");
    } else {
      var o = smooth((g - OPEN_AT) / (1 - OPEN_AT));
      /* 0.18 to 1 is the gardens' own figure for the opening bloom. */
      nd.head.style.setProperty("--s", (0.18 + 0.82 * o).toFixed(3));
      nd.bud.style.setProperty("--s", (1 - o).toFixed(3));
    }
  }

  function tick() {
    if (!built) return;
    var p = (window.pageYOffset + window.innerHeight * 0.78 - railTop) / railH;
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    if (Math.abs(p - lastP) < 0.0008) return;
    lastP = p;
    var tip = p * len;
    stem.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
    for (var i = 0; i < nodes.length; i++) {
      var g = (tip - nodes[i].at) / NODE_RUN;
      paintNode(nodes[i], g < 0 ? 0 : (g > 1 ? 1 : g));
    }
    /* The last flower opens only once the stem has actually reached it. */
    if (bloom) bloom.classList.toggle("is-out", p > 0.985);
  }

  function full() {
    if (!built) return;
    stem.style.strokeDashoffset = "0";
    nodes.forEach(function (nd) { paintNode(nd, 1); });
    if (bloom) bloom.classList.add("is-out");
  }

  var raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; tick(); });
  }

  var lastW = 0, lastH = 0;
  function remeasure() {
    var w = window.innerWidth;
    var h = document.documentElement.scrollHeight;
    /* A WIDTH CHANGE OR A DOCUMENT THAT GREW, never a plain resize: iOS
       collapses its address bar as the page is scrolled and that fires one.
       The height is in it because the footer's two folds and the About
       scroller change how tall the page is without the window moving. */
    if (w === lastW && Math.abs(h - lastH) < 24) return;
    lastW = w; lastH = h;
    if (build()) { if (reduced) full(); else { lastP = -1; tick(); } }
  }

  function boot() {
    rail = document.getElementById("growth-rail");
    if (!rail) return;
    css();
    remeasure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    /* The fonts land after this runs and every section gets taller when they
       do, so the page is measured again once things have settled. */
    setTimeout(remeasure, 600);
    setTimeout(remeasure, 2200);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(remeasure).catch(function () {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
