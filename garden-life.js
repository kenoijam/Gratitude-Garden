/* =========================================================================
   garden-life.js  -  the ambient life that moves in a garden scene

   Loaded by index.html, the personal garden and the shared garden. There is
   deliberately ONE copy, for the same reason garden-music.js is one copy:
   this project already pays for the same flower maths living in seven places
   and a second population of butterflies would drift within a session.

   It is written against a RAW CanvasRenderingContext2D and nothing else, no
   p5 and no DOM, which is what lets one file serve both kinds of page:

     index.html   c.getContext('2d')     raw Canvas 2D already
     both gardens drawingContext         p5's own 2D context, in p5 units

   p5 scales `drawingContext` by the pixel density itself, so drawing on it in
   p5 coordinates lands exactly where an `ellipse()` would. It does NOT carry
   p5's colorMode or angleMode, so everything here is CSS colour strings and
   radians, and every entry point brackets itself in save/restore so a sketch
   cannot inherit a stray transform or alpha.

   Three entry points, because the life belongs at different depths:

     GardenLife.sky(ctx, w, h, opts)     birds. After the clouds, under the hills.
     GardenLife.meadow(ctx, w, h, opts)  butterflies and motes. Over everything.
     GardenLife.drift(ctx, w, h, opts)   motes alone, for a whole PAGE rather
                                         than a scene. Held in PAGE coordinates
                                         and drawn one section at a time, so
                                         they scroll with the copy.

   Everything is placed in BANDS, [top, bottom] in the caller's own units.
   The default bands are derived from opts.horizon, which is all a garden has
   to pass, but a page can name any of them outright and the hero does: its
   flowers grow UPWARD out of a horizon at the bottom of the picture, where a
   garden's sit around and below its horizon, so a band derived from one
   lands in the wrong place on the other.

   The brief was "more lively, not overly crowded". That is a POPULATION
   decision, and it is the whole design: two or three butterflies, one loose
   skein of birds that crosses and then leaves the sky empty for a while, and
   a dozen faint motes. Everything is slow. A garden with twenty butterflies
   in it is an aquarium.
   ========================================================================= */
(function () {
  "use strict";

  /* Anyone who has asked for reduced motion gets the scene POPULATED but
     FROZEN, rather than emptied. The butterflies are part of the picture; it
     is only their movement that was opted out of. The hero's sway makes the
     same choice, keeping its flowers and setting its amplitude to zero. */
  var reduced = !!(window.matchMedia &&
                   window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var T0 = (window.performance && performance.now) ? performance.now() : Date.now();
  function clock() {
    if (reduced) return 8.4;   /* a fixed moment, chosen so no wing is shut */
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    return (now - T0) / 1000;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* One deterministic pseudo-random per seed. Math.random would give a
     different meadow on every reload and, worse, a different one on every
     rebuild of the population after a resize. */
  function rnd(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* The whole module is sized off a 1440 wide logical scene, which is the
     gardens' BASE_W and the hero's logical width, so both pages land on the
     same figure with no page specific tuning. Clamped, or a phone draws
     butterflies too small to read as butterflies. */
  function unitFor(w, opts) {
    if (opts && opts.scale) return opts.scale;
    return clamp(w / 1440, 0.62, 1.25);
  }

  /* ---------------------------------------------------------------- state */
  /* One page is one scene, so the population is module level. It is rebuilt
     only when the scene's size changes enough to matter, since rebuilding on
     every pixel of a drag would restart every flight path mid air. */
  var pop = null;

  function build(w, h) {
    var nFly = w < 620 ? 1 : w < 1100 ? 2 : 3;
    var flies = [];
    var TINTS = [
      { wing: "hsl(45,88%,74%)",  edge: "hsl(36,62%,52%)" },   /* butter */
      { wing: "hsl(342,62%,82%)", edge: "hsl(340,45%,60%)" },  /* blossom */
      { wing: "hsl(268,48%,82%)", edge: "hsl(266,35%,58%)" }   /* lavender */
    ];
    for (var i = 0; i < nFly; i++) {
      var s = i + 1;
      /* Homes are spread across the width in equal slices with a jitter
         inside each, so two butterflies can never start life on top of one
         another however the random numbers fall. */
      var slice = 1 / nFly;
      /* Home anywhere across the band, then a vertical swing sized to THAT
         butterfly's own headroom: the two sines together reach 1.42 times the
         amplitude, so dividing the nearer edge by 1.42 is the largest swing
         that cannot leave the band. A flat amplitude range has to be sized
         for the worst home, which squeezed every home toward the middle and
         stood three butterflies in a row at one height. One near an edge now
         bobs less than one in the middle, which is also just true of a
         butterfly working a hedge. */
      var homeYf = 0.15 + rnd(s * 7.7) * 0.70;
      var headroom = Math.min(homeYf, 1 - homeYf) / 1.42;
      flies.push({
        tint: TINTS[i % TINTS.length],
        /* Held as FRACTIONS of the scene and of the band, never as pixels, so
           a band that moves, or a canvas that is resized, repositions the
           butterfly instead of restarting its flight. */
        homeXf: slice * (i + 0.5) + (rnd(s * 3.1) - 0.5) * slice * 0.5,
        /* A butterfly can never leave its band, and it is this arithmetic
           that stops it rather than a clamp: a clamp reads as a ceiling the
           butterfly is sliding along. Sideways it may leave the scene
           entirely, which is different and wanted. One that never goes
           anywhere is on a leash. */
        homeYf: homeYf,
        ax: 90 + rnd(s * 2.3) * 130,
        ayf: headroom * (0.45 + rnd(s * 5.9) * 0.55),
        wx: 0.16 + rnd(s * 11.3) * 0.10,
        wy: 0.31 + rnd(s * 13.7) * 0.17,
        px: rnd(s * 17.1) * 6.28,
        py: rnd(s * 19.9) * 6.28,
        flap: 7.6 + rnd(s * 23.3) * 2.8,
        size: 11 + rnd(s * 29.1) * 4
      });
    }

    /* The birds are ONE skein that crosses and then leaves. A sky with birds
       permanently in it stops being a sky with birds in it. The cycle is a
       long crossing and a longer absence, and `dir` flips each time so they
       do not always come from the same side. */
    /* Five, not three. A skein of three reads as three dots; five reads as a
       flock, and the hero is where anybody actually looks at them. Still a
       skein rather than a flock of twenty: the whole brief here is lively
       without being crowded. */
    var nBird = w < 620 ? 3 : 5;
    var birds = [];
    for (var b = 0; b < nBird; b++) {
      birds.push({
        lag: b * 0.052 + rnd(b * 31.7) * 0.014,   /* along the crossing */
        /* Minus one to plus one ACROSS the skein, resolved against the band
           at draw time. Held in pixels it was a fixed spread, and a page with
           a short sky, which the hero has, flew its lead bird out through the
           top of the canvas. Everything vertical here is a fraction of the
           band for that reason. */
        rise01: nBird < 2 ? 0 : (b / (nBird - 1)) * 2 - 1 + (rnd(b * 37.3) - 0.5) * 0.4,
        size: 7.4 + rnd(b * 41.9) * 3.2,
        flap: 5.1 + rnd(b * 43.1) * 1.4,
        phase: rnd(b * 47.3) * 6.28
      });
    }

    /* Motes are the planting sparkle's quiet cousin: the same idea of light
       in the air, at a fraction of the brightness, so the one that fires when
       a flower is planted still reads as an event. */
    var nMote = Math.round(clamp(w / 150, 6, 14));
    var motes = [];
    for (var m = 0; m < nMote; m++) {
      motes.push({
        x: rnd(m * 53.9) * w,
        y: rnd(m * 59.1) * 1,          /* 0..1 within the mote band */
        r: 1.1 + rnd(m * 61.3) * 1.5,
        drift: 5 + rnd(m * 67.7) * 11, /* pixels per second sideways */
        rise: 5 + rnd(m * 71.3) * 9,   /* pixels per second upward */
        tw: 0.5 + rnd(m * 73.9) * 0.7, /* twinkle rate */
        phase: rnd(m * 79.1) * 6.28,
        warm: rnd(m * 83.3) > 0.45
      });
    }

    return { w: w, h: h, flies: flies, birds: birds, motes: motes };
  }

  /* Rebuilt only on a real size change. Rebuilding on every pixel of a window
     drag would restart every flight path in mid air. */
  function ensure(w, h) {
    if (!pop || Math.abs(pop.w - w) > 40 || Math.abs(pop.h - h) > 40) pop = build(w, h);
    return pop;
  }

  function horizonOf(h, opts) {
    if (opts && typeof opts.horizon === "number") return opts.horizon;
    return h * 0.56;   /* the gardens' own back hill line */
  }

  /* The three bands. A caller may name any of them; otherwise they come off
     the horizon, which is the only figure a garden has to pass. */
  function bandFly(h, z, o) {
    return (o && o.fly) || [z * 0.86, z * 1.02 + (h - z) * 0.34];
  }
  function bandBird(h, z, o) {
    return (o && o.birds) || [z * 0.14, z * 0.46];
  }
  function bandMote(h, z, o) {
    return (o && o.motes) || [z * 0.94, h * 0.97];
  }

  /* --------------------------------------------------------------- birds */
  /* Two arcs and nothing else. A bird at this size is a silhouette, and any
     attempt at a body turns it into a smudge. The wing angle is what carries
     the flap, so the two arcs share one control point height. */
  function drawBird(ctx, x, y, size, lift, ink) {
    var half = size * 0.5;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, size * 0.16);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - size, y + half * 0.18);
    ctx.quadraticCurveTo(x - half, y - lift, x, y);
    ctx.quadraticCurveTo(x + half, y - lift, x + size, y + half * 0.18);
    ctx.stroke();
  }

  function sky(ctx, w, h, opts) {
    if (!ctx || w <= 0 || h <= 0) return;
    var horizon = horizonOf(h, opts);
    var P = ensure(w, h);
    var t = clock();
    var u = unitFor(w, opts);
    var band = bandBird(h, horizon, opts);

    /* A page may set its own rhythm. The gardens take the default, where the
       sky is empty more often than not; the hero shortens the gap, because a
       visitor reads the top of a page for a few seconds and then scrolls, so
       a flock that is away for twenty two of every fifty two seconds is one
       most people never see at all. */
    var CROSS = (opts && opts.cross) || 30;   /* seconds in the air */
    var GAP = (opts && typeof opts.gap === "number") ? opts.gap : 22;
    var CYCLE = CROSS + GAP;
    var at = t % CYCLE;
    if (at > CROSS) return;              /* the sky is empty on purpose */

    var pass = Math.floor(t / CYCLE);
    var dir = (pass % 2 === 0) ? 1 : -1;
    /* A new lane every crossing, inside the band, so the flock does not wear
       a groove in the sky. Pulled in at both ends to leave room for the rise
       and for the birds spread either side of the leader. */
    var lo = band[0], bh = Math.max(24, band[1] - band[0]);
    var lane = lo + (0.30 + rnd(pass * 89.3) * 0.40) * bh;

    ctx.save();
    for (var i = 0; i < P.birds.length; i++) {
      var b = P.birds[i];
      var p = at / CROSS - b.lag;
      if (p < -0.1 || p > 1.1) continue;
      var x = dir > 0 ? (-90 + p * (w + 180)) : (w + 90 - p * (w + 180));
      /* A shallow rise across the crossing plus a slow bob, so the skein is
         never a ruled line of dots. */
      var y = lane + b.rise01 * bh * 0.09
            - Math.sin(p * Math.PI) * bh * 0.13
            + Math.sin(t * 0.7 + b.phase) * bh * 0.02;
      var flap = Math.sin(t * b.flap + b.phase);
      var lift = (b.size * u) * (0.34 + 0.5 * (flap * 0.5 + 0.5));
      /* Faint, because they are far away. Anything darker reads as a bird
         painted on the sky rather than a bird in it. The hero asks for a
         little more, since its sky is a thin strip between the copy and the
         flowers and a bird there has far less room to be noticed in. */
      drawBird(ctx, x, y, b.size * u, lift, (opts && opts.ink) || "rgba(47,98,96,0.42)");
    }
    ctx.restore();
  }

  /* --------------------------------------------------- butterflies, motes */
  /* Local space has the nose at +x and the wings on both y sides, then the
     whole thing is rotated onto its heading. The flap scales the wings in y
     only, which is what a butterfly seen from above actually does, and it is
     also why the body must be drawn after them. */
  function drawButterfly(ctx, x, y, ang, size, open, tint) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(size, size);

    for (var s = -1; s <= 1; s += 2) {
      ctx.save();
      ctx.scale(1, s * open);

      ctx.fillStyle = tint.wing;
      ctx.strokeStyle = tint.edge;
      ctx.lineWidth = 0.09;
      ctx.lineJoin = "round";

      /* fore wing */
      ctx.beginPath();
      ctx.moveTo(0.16, -0.02);
      ctx.bezierCurveTo(0.62, -0.30, 0.72, -0.92, 0.24, -1.00);
      ctx.bezierCurveTo(0.02, -1.03, -0.10, -0.62, -0.04, -0.10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      /* hind wing, smaller and set back */
      ctx.beginPath();
      ctx.moveTo(-0.04, -0.06);
      ctx.bezierCurveTo(-0.34, -0.26, -0.62, -0.60, -0.44, -0.76);
      ctx.bezierCurveTo(-0.28, -0.88, -0.04, -0.52, 0.02, -0.14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      /* One spot per wing. At this size a pattern is mud, but a single
         lighter mark is what stops the wing reading as a flat petal. */
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.ellipse(0.26, -0.62, 0.12, 0.16, 0, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.restore();
    }

    ctx.fillStyle = "rgba(58,52,46,0.88)";
    ctx.beginPath();
    ctx.ellipse(-0.02, 0, 0.30, 0.085, 0, 0, 6.283);
    ctx.fill();

    /* Antennae. Two hairlines, and they are worth the four lines of code:
       without them the silhouette is symmetrical and reads as a bow. */
    ctx.strokeStyle = "rgba(58,52,46,0.7)";
    ctx.lineWidth = 0.045;
    ctx.beginPath();
    ctx.moveTo(0.22, -0.02); ctx.quadraticCurveTo(0.42, -0.14, 0.50, -0.24);
    ctx.moveTo(0.22, 0.02);  ctx.quadraticCurveTo(0.42, 0.14, 0.50, 0.24);
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------- sparkles */
  /* These are SPARKLES, the same four pointed star the gardens throw around a
     newly planted flower, not soft dots. Two stacked circles was the first
     version and it read as jitter rather than as light: a dot two pixels
     across, moving a third of a pixel per frame and pulsing its radius, is
     just antialiasing changing its mind. A star has a shape to recognise, so
     the eye reads it as one thing turning rather than as noise.

     The geometry is `drawNewestSparkles` exactly: four outer points with the
     inner corners at 0.35 of the radius, turning slowly. What differs is the
     SPEED. The garden's sparkle runs off frameCount at a rate that suits a
     burst lasting a few seconds; these hang around for as long as the page is
     open, so everything is slowed right down and driven by the clock instead,
     which also makes them frame rate independent.

     Two palettes, and that is not decoration. On a dark ground a sparkle is
     white and reads as light. On CREAM, which is most of the landing page,
     white is invisible: it has to go the other way and sit DARKER than the
     ground, so the pale tones become a warm gold and a soft teal, at a little
     more alpha to make up for the smaller contrast. */
  var MOTE = {
    light: { warm: ["rgb(250,222,150)", "rgb(240,192,84)"],
             cool: ["rgb(176,222,210)", "rgb(122,190,176)"], gain: 1.35 },
    dark:  { warm: ["rgb(255,236,170)", "rgb(255,249,222)"],
             cool: ["rgb(233,255,248)", "rgb(255,255,255)"], gain: 1.00 }
  };

  function star(ctx, r) {
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var out = i * Math.PI / 2;
      var inn = out + Math.PI / 4;
      if (i === 0) ctx.moveTo(Math.cos(out) * r, Math.sin(out) * r);
      else ctx.lineTo(Math.cos(out) * r, Math.sin(out) * r);
      ctx.lineTo(Math.cos(inn) * r * 0.35, Math.sin(inn) * r * 0.35);
    }
    ctx.closePath();
  }

  function paintMote(ctx, x, y, r, a, warm, onDark, spin) {
    var set = onDark ? MOTE.dark : MOTE.light;
    var pair = warm ? set.warm : set.cool;
    var al = clamp(a * set.gain, 0, 1);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin || 0);

    /* A soft halo under the star, which is what stops a hard little polygon
       looking pasted onto the page. */
    ctx.globalAlpha = al * 0.28;
    ctx.fillStyle = pair[0];
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, 6.283);
    ctx.fill();

    ctx.globalAlpha = al;
    ctx.fillStyle = pair[1];
    star(ctx, r);
    ctx.fill();
    ctx.restore();
  }

  /* The dust belongs to the SECTIONS, not to the window. Each band gets its
     own motes, held in page coordinates and drawn at `pageY - scrollY`, so
     scrolling carries them past exactly like the copy does. Held in viewport
     coordinates instead, which is what this was first, the same dozen motes
     hang in the same places however far the page is scrolled, and the whole
     effect reads as dirt on the screen rather than as air in a room.

     Only what is on screen is drawn, so a long page costs no more per frame
     than a short one. */
  var dust = null, dustSig = "", pageFlies = null;

  /* Butterflies for a whole page, held in page coordinates like the
     sparkles. Roughly one per section, each kept inside its own band, so a
     long page never has them all in one place and a short one is not empty.
     They are the same drawing and the same flight as a garden's, only placed
     against the page rather than against a scene.

     `flyAt` and `drawButterfly` are declared further down the file. That is
     fine and deliberate rather than an oversight: function declarations hoist
     within this module, and keeping the butterfly drawing beside the garden's
     own butterflies is worth more than source order. */
  function buildPageFlies(bands) {
    var TINTS = [
      { wing: "hsl(45,88%,74%)",  edge: "hsl(36,62%,52%)" },
      { wing: "hsl(342,62%,82%)", edge: "hsl(340,45%,60%)" },
      { wing: "hsl(268,48%,82%)", edge: "hsl(266,35%,58%)" }
    ];
    var out = [];
    for (var b = 0; b < bands.length; b++) {
      var bh = bands[b].bottom - bands[b].top;
      if (bh < 260) continue;                 /* too short to fly in */
      var sd = (b + 3) * 613;
      var homeYf = 0.18 + rnd(sd * 7.7) * 0.64;
      /* Out at the MARGINS, alternating sides, and with a swing tied to the
         page's width rather than a pixel count. A butterfly hovering over a
         paragraph is something the reader has to look past; one out at the
         edge is something they notice and then keep reading. The copy on the
         landing page sits in a centred block, so the outer sixth on each side
         is dependably empty. */
      var side = (b % 2 === 0) ? 1 : -1;
      out.push({
        band: b,
        tint: TINTS[b % TINTS.length],
        homeXf: side > 0 ? (0.05 + rnd(sd * 3.1) * 0.05)
                         : (0.90 + rnd(sd * 3.1) * 0.05),
        homeYf: homeYf,
        axf: 0.035 + rnd(sd * 2.3) * 0.035,
        /* The same headroom rule the gardens use: home plus the full swing of
           both sines still lands inside the band, so a butterfly can never
           wander out of the section it belongs to. */
        ayf: (Math.min(homeYf, 1 - homeYf) / 1.42) * (0.45 + rnd(sd * 5.9) * 0.55),
        wx: 0.14 + rnd(sd * 11.3) * 0.10,
        wy: 0.28 + rnd(sd * 13.7) * 0.16,
        px: rnd(sd * 17.1) * 6.28,
        py: rnd(sd * 19.9) * 6.28,
        flap: 7.4 + rnd(sd * 23.3) * 2.8,
        size: 10 + rnd(sd * 29.1) * 4
      });
    }
    return out;
  }

  function buildDust(w, bands) {
    var out = [];
    for (var b = 0; b < bands.length; b++) {
      var bh = Math.max(60, bands[b].bottom - bands[b].top);
      /* Per section rather than per page, so a short section is not skipped
         and a tall one is not left with a single mote rattling around it. */
      /* One per 95px of section, which works out at about nine on screen at
         a time whatever the section's height, since the canvas is one
         viewport tall. It was one per 62, roughly fourteen, and the brief
         after they came back was fewer than before rather than more. */
      var n = Math.round(clamp(bh / 95, 3, 16));
      for (var i = 0; i < n; i++) {
        var sd = (b + 1) * 977 + i * 31;
        out.push({
          band: b,
          fx: rnd(sd * 1.7),
          fy: rnd(sd * 2.3),
          r: 1.0 + rnd(sd * 3.1) * 1.9,
          /* Slow, but not so slow that a sparkle sits on one pixel pair for
             a second at a time, which is the other half of what looked like
             jitter: sub pixel movement under antialiasing. */
          drift: 7 + rnd(sd * 5.9) * 13,
          rise: 6 + rnd(sd * 7.3) * 11,
          tw: 0.5 + rnd(sd * 11.9) * 0.7,
          phase: rnd(sd * 13.7) * 6.28,
          warm: rnd(sd * 17.3) > 0.5
        });
      }
    }
    return out;
  }

  /* `opts.only` draws a single band and skips the rest.

     The landing page needs that because its sparkles have to sit UNDER the
     cards and the copy and OVER each section's background colour, and one
     fixed canvas cannot do that: a section paints its own background, so
     anything behind it is hidden and anything in front of it covers the
     content too. The only place that gap exists is inside the section, as an
     absolutely positioned child at z-index -1, which means one canvas per
     section and each one drawing only its own. Everything is still built from
     the FULL band list, so the population signature does not change from one
     canvas to the next and nothing is re-seeded per section. */
  function drift(ctx, w, h, opts) {
    if (!ctx || w <= 0 || h <= 0) return;
    var bands = (opts && opts.bands) || [];
    if (!bands.length) return;
    var only = (opts && typeof opts.only === "number") ? opts.only : -1;
    var scroll = (opts && opts.scrollY) || 0;
    var t = clock();
    var u = unitFor(w, opts);
    var wrapW = w + 60;

    /* Rebuilt only when the page's shape actually changes. Rebuilding on
       every scroll would re-seed every mote sixty times a second. */
    var sig = Math.round(w) + "|" + bands.map(function (b) {
      return Math.round(b.top) + "," + Math.round(b.bottom) + "," + (b.dark ? 1 : 0);
    }).join(";");
    if (sig !== dustSig) {
      dustSig = sig;
      dust = buildDust(w, bands);
      pageFlies = buildPageFlies(bands);
    }

    ctx.save();
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      if (only >= 0 && d.band !== only) continue;
      var band = bands[d.band];
      if (!band) continue;
      var bh = Math.max(60, band.bottom - band.top);
      var off = (d.fy * bh - t * d.rise) % bh;
      if (off < 0) off += bh;                  /* rising, wrapped in its own band */
      var y = band.top + off - scroll;
      if (y < -40 || y > h + 40) continue;     /* off screen, nothing to pay for */
      var x = (d.fx * wrapW + t * d.drift) % wrapW - 30;
      var tw = 0.5 + 0.5 * Math.sin(t * d.tw + d.phase);
      /* A shade larger than the gardens' own, because these sit on flat
         colour rather than among flowers and have nothing beside them to give
         a sense of scale. */
      paintMote(ctx, x, y, (2.4 + d.r * 1.1) * u * (0.92 + tw * 0.16),
                0.10 + tw * 0.30, d.warm, !!band.dark, t * 0.45 + d.phase);
    }

    /* Butterflies, drawn AFTER the sparkles so the one solid object on the
       canvas is never behind the specks of light. */
    for (var j = 0; j < pageFlies.length; j++) {
      var f = pageFlies[j];
      if (only >= 0 && f.band !== only) continue;
      var fb = bands[f.band];
      if (!fb) continue;
      var fh = Math.max(120, fb.bottom - fb.top);
      var home = [f.homeXf * w, fb.top + f.homeYf * fh - scroll];
      var ay = f.ayf * fh;
      f.ax = f.axf * w;
      var now = flyAt(f, t, home, ay);
      if (now[1] < -80 || now[1] > h + 80) continue;
      var soon = flyAt(f, t + 0.18, home, ay);
      var ang = Math.atan2(soon[1] - now[1], soon[0] - now[0]);
      var open = 0.26 + 0.74 * Math.abs(Math.sin(t * f.flap + f.px));
      drawButterfly(ctx, now[0], now[1], ang, f.size * u, open, f.tint);
    }

    ctx.restore();
  }

  /* Two sines of unrelated periods on each axis. One sine is an oval track
     and reads as a machine; two that do not divide into each other never
     quite repeat, which is the whole trick. */
  function flyAt(f, t, home, ay) {
    return [
      home[0] + Math.sin(t * f.wx + f.px) * f.ax
              + Math.sin(t * f.wx * 0.41 + f.px * 1.7) * f.ax * 0.34,
      home[1] + Math.sin(t * f.wy + f.py) * ay
              + Math.sin(t * f.wy * 0.57 + f.py * 1.3) * ay * 0.42
    ];
  }

  function meadow(ctx, w, h, opts) {
    if (!ctx || w <= 0 || h <= 0) return;
    var horizon = horizonOf(h, opts);
    var P = ensure(w, h);
    var t = clock();
    var u = unitFor(w, opts);

    ctx.save();

    /* ------------------------------------------------------------ motes */
    var mb = bandMote(h, horizon, opts);
    var top = mb[0];
    var band = Math.max(40, mb[1] - top);
    for (var m = 0; m < P.motes.length; m++) {
      var mo = P.motes[m];
      var mx = (mo.x + t * mo.drift) % (w + 60) - 30;
      /* Rising, and wrapped within the band rather than to the canvas, so a
         mote never appears out of the sky above the flowers. */
      var my = top + band - (((mo.y * band) + t * mo.rise) % band);
      var tw = 0.5 + 0.5 * Math.sin(t * mo.tw + mo.phase);
      /* A garden's ground is dark enough for the white palette, which is what
         these have always used. The size barely moves and the brightness does
         the twinkling: a radius that swings hard is what read as jitter. */
      paintMote(ctx, mx, my, (2.0 + mo.r * 0.9) * u * (0.92 + tw * 0.16),
                0.10 + tw * 0.30, mo.warm, true, t * 0.5 + mo.phase);
    }

    /* ------------------------------------------------------ butterflies */
    var fb = bandFly(h, horizon, opts);
    var fh = Math.max(30, fb[1] - fb[0]);
    for (var i = 0; i < P.flies.length; i++) {
      var f = P.flies[i];
      var home = [f.homeXf * w, fb[0] + f.homeYf * fh];
      var ay = f.ayf * fh;
      var now = flyAt(f, t, home, ay);
      /* The heading comes from where it is about to be, not from a stored
         angle, so the butterfly always faces its own path and a turn reads
         as a turn rather than as a slide. */
      var soon = flyAt(f, t + 0.18, home, ay);
      var dx = soon[0] - now[0], dy = soon[1] - now[1];
      var ang = Math.atan2(dy, dx);
      /* Wings shut at the top of the beat, and never fully: a butterfly with
         its wings edge on for a whole frame simply disappears. */
      var open = 0.26 + 0.74 * Math.abs(Math.sin(t * f.flap + f.px));
      drawButterfly(ctx, now[0], now[1], ang, f.size * u, open, f.tint);
    }

    ctx.restore();
  }

  window.GardenLife = { sky: sky, meadow: meadow, drift: drift, reduced: reduced };
})();
