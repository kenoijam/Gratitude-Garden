/* =========================================================================
   garden-loader.js  -  one flower opening while a page gets ready

   A full screen wash in the garden's own sky with a single bloom growing out
   of the ground: the stem rises, the leaves unfold, the petals open one after
   another, the centre fills in. Then it fades and the page is there.

   WHY IT EXISTS, and it is the shared garden that needed it. That page has to
   reach a websocket on somebody else's server and load a room before it can
   draw anything, and until it does there is a blank cream screen with no way
   of telling a slow connection from a broken page. The other three are quick,
   but a loader that appears on one page of four reads as that page being the
   broken one, so all four carry it.

   NOTHING here is p5, and that is still true: the gardens' flower code lives
   inside their sketches and needs a p5 instance that has not started yet.

   IT IS ONE OF THE REAL EIGHT WHERE IT CAN BE, AND THAT REVERSES THE OLD
   NOTE. The note read: "deliberately not any of the eight, because a loader
   showing a daisy would be promising a daisy." What answers that is RANDOM:
   a different species every visit plainly reads as "a flower" rather than as
   a promise of that one, and it is the garden's own drawing rather than a
   stand in for it. `window._bloomFns` and `window._ringSpecies` are the
   landing page's own catalogue family and its palette, which already take a
   raw 2D context, so no drawing is copied here.

   WHERE THEY ARE NOT THERE IT FALLS BACK, which today is both garden pages:
   their species families need a `p5.Graphics` and a running instance. The
   generic bloom is kept for exactly that, and it picks a fresh hue each
   visit so two loads still differ. **If the catalogue family is ever lifted
   out of `index.html` into a file of its own, loading it on the gardens is
   all this needs to show the real eight everywhere.**

   AND THE BLOOM FINISHES BEFORE THE PAGE ARRIVES. It used to LOOP every 2.5
   seconds and be cut off wherever it had got to, so the thing you watched
   was half a flower and then a page. `done()` now only marks the page ready;
   the loader leaves when the page is ready AND the bloom has opened. The cap
   still overrides both. The cost is honest and is paid once: a fast page is
   held for the length of one bloom, and `gg_loaded` means that is the first
   load of a session only.

   Two ways out, and both are needed:

     done()   a page calls it when it has something to show. The shared garden
              calls it once the room has resolved and the first frame is up.
     the CAP  it hides itself after LIMIT no matter what. A loader that can
              outlive its page is worse than no loader, because a failed
              connection would leave a flower spinning over nothing for ever.
   ========================================================================= */
(function () {
  "use strict";

  var CYCLE = 2400;   /* ms. One bloom, start to open. It no longer repeats. */
  var HOLD  = 240;    /* ms. A beat on the finished flower before it goes */
  var LIMIT = 9000;   /* ms. The cap: never hold the page longer than this */
  var FADE = 420;

  /* Skip it entirely for a return visit inside the same session. The wait is
     real the first time, when the fonts, the sketch and the room are all cold;
     walking back from the bouquet to the landing page is instant and a loader
     over an instant page is just a flicker. */
  var KEY = "gg_loaded";
  try { if (sessionStorage.getItem(KEY) === "1") return; } catch (e) {}

  var held = false, shown = 0, gone = false, el = null, raf = 0;
  /* Two independent facts, and the loader leaves only when both are true.
     `ready` is the page saying it has something to show; `bloomed` is this
     animation saying it has finished. */
  var ready = false, bloomed = false;
  /* The species for this visit, chosen once in `build` so a repaint cannot
     change the flower halfway through it opening. */
  var pick = null;

  var CSS =
    '#gg-load{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:18px;' +
      /* The gardens' own sky, top to bottom, so the loader is the page
         arriving rather than a panel in front of it. */
      'background:linear-gradient(180deg,#cfeef0 0%,#e8f8f6 58%,#f3fbf7 100%);' +
      'transition:opacity ' + FADE + 'ms ease;}' +
    '#gg-load[data-out="1"]{opacity:0;pointer-events:none;}' +
    '#gg-load canvas{display:block;width:132px;height:132px;}' +
    '#gg-load p{margin:0;font-family:Fraunces,Georgia,serif;font-size:17px;font-weight:600;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#2c7a7b;letter-spacing:0.01em;}" +
    /* Reduced motion gets the bloom fully open and still. The picture is not
       what was opted out of, the movement is. */
    '@media (prefers-reduced-motion:reduce){#gg-load canvas{opacity:1;}}';

  function build() {
    if (el || gone) return;
    var style = document.createElement("style");
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);

    el = document.createElement("div");
    el.id = "gg-load";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    var cv = document.createElement("canvas");
    var word = document.createElement("p");
    word.textContent = "Growing your garden";
    el.appendChild(cv);
    el.appendChild(word);
    document.body.appendChild(el);
    shown = Date.now();

    var still = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(132 * dpr);
    cv.height = Math.round(132 * dpr);
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ONE OF THE EIGHT IF THE PAGE HAS THEM. Chosen here rather than per
       frame, or the flower would change species while it was opening. */
    pick = choose();
    /* Measured once, beside the choice, for the same reason the choice is
       made here: a size that changed between frames would be the flower
       resizing while it opened. */
    if (pick) {
      var fit = fitBloom(pick, 132);
      if (fit) { pick.R = fit.R; pick.headY = fit.headY; }
    }

    var t0 = Date.now();
    function frame() {
      /* 0 to 1 ONCE, not round and round. Reduced motion gets the finished
         flower immediately, which is the choice `garden-life.js` already
         makes: the picture is not what anybody opted out of. */
      var p = still ? 1 : clamp01((Date.now() - t0) / CYCLE);
      draw(ctx, 132, p);
      if (p >= 1 && !bloomed) {
        bloomed = true;
        setTimeout(maybeGo, HOLD);
      }
      if (!gone && p < 1) raf = requestAnimationFrame(frame);
    }
    frame();
  }

  /* THE FALLBACK BLOOM'S HUE, ROLLED ONCE A VISIT. It was a fixed 206, the
     cursor's blue, which is right for a thing that is deliberately not a
     species and wrong once the point is that the flower differs each time.
     The palette's own range, so it cannot land on a colour this project
     does not use. */
  var FALLBACK_HUE = [206, 272, 350, 48, 190, 28, 232, 140][
    Math.floor(Math.random() * 8)];

  /* ONE OF THE EIGHT, IF THIS PAGE CARRIES THEM. `_bloomFns` is the landing
     page's catalogue family, keyed by species id and taking a raw 2D
     context; `_ringSpecies` is the flower guide's own list of the eight with
     the palette each is drawn in, which is what keeps a loader daisy the
     same yellow as the daisy in the guide a screen below it. Both are
     already exported for the scroll vine, so this costs no new surface.
     Either one missing and the generic bloom stands. */
  function choose() {
    try {
      var fns = window._bloomFns, ring = window._ringSpecies;
      if (!fns || !ring || !ring.length) return null;
      var pool = ring.filter(function (r) { return typeof fns[r.id] === "function"; });
      if (!pool.length) return null;
      var r = pool[Math.floor(Math.random() * pool.length)];
      return { fn: fns[r.id], hue: r.hue, sat: r.sat, light: r.light };
    } catch (e) { return null; }
  }


  /* ══════════════ THE LAVENDER WAS CLIPPED, AND IT IS THE ONLY ONE ══════
     Every species was drawn at a flat `R = S * 0.26` with its origin at a
     flat `headY = S * 0.40`, which assumes a bloom paints about as far
     above its origin as below it. Seven of the eight do. **The lavender
     grows entirely UPWARD out of its origin**, and measured on the
     catalogue's own drawing it reaches **2.13 R above and nothing below**,
     so at R 34.3 it wanted 73px of room above a head sitting 52.8px down a
     132px canvas: the top 20px of the spike was cut off. Measured on all
     eight, it was the only one that touched an edge.

     IT MEASURES RATHER THAN CARRYING A TABLE. `BLOOM_METRICS` on the
     landing page already records every painted box, but it is not exported
     and this file is loaded by pages that do not have it. Rendering the
     chosen bloom once, offscreen, costs one small `getImageData` during a
     screen that is already waiting, and it cannot go stale the way a
     second copy of those figures would.

     IT LOWERS THE HEAD BEFORE IT SHRINKS THE FLOWER. Simply capping R
     would have left the lavender two thirds the size of every other bloom.
     The head drops instead, down to 0.60 S, which gives the spike its room
     and leaves a shorter stem: that is what a lavender actually looks
     like. R only comes down if even the lowest head is not enough.
     **The seven that already fitted are untouched**, because their own
     `up` keeps the head at its original 0.40 S. */
  function fitBloom(p, S) {
    var REF = 40, M = 220, half = M / 2;
    var c = document.createElement("canvas");
    c.width = M; c.height = M;
    var x = c.getContext("2d");
    if (!x) return null;
    x.translate(half, half);
    try { p.fn(x, 0, 0, REF, p.hue, p.sat, p.light); } catch (e) { return null; }
    var d;
    /* A tainted or zero sized canvas throws; the generic bloom stands. */
    try { d = x.getImageData(0, 0, M, M).data; } catch (e) { return null; }

    var minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
    for (var py = 0; py < M; py++) {
      for (var px = 0; px < M; px++) {
        if (d[(py * M + px) * 4 + 3] > 8) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
    }
    if (maxX < 0) return null;

    /* How far it paints from its own origin, in multiples of R. */
    var up = (half - minY) / REF, down = (maxY - half) / REF;
    var left = (half - minX) / REF, right = (maxX - half) / REF;

    var PAD = 5, cx = S / 2;
    var R = S * 0.26, headY = S * 0.40;

    /* Room above: drop the head first, then shrink. */
    if (up > 0.01 && up * R > headY - PAD) {
      headY = Math.min(S * 0.60, PAD + up * R);
      if (up * R > headY - PAD) R = (headY - PAD) / up;
    }
    /* And it must not reach past the sides or the foot. */
    if (left  > 0.01) R = Math.min(R, (cx - PAD) / left);
    if (right > 0.01) R = Math.min(R, (S - PAD - cx) / right);
    if (down  > 0.01) R = Math.min(R, (S - PAD - headY) / down);

    return R > 0 ? { R: R, headY: headY } : null;
  }

  /* One bloom, drawn in four overlapping stages so nothing pops into being:
     the stem to 0.42, the leaves from 0.22, the petals from 0.40 opening one
     after another, the eye from 0.70. */
  function draw(ctx, S, p) {
    ctx.clearRect(0, 0, S, S);
    var cx = S / 2, groundY = S * 0.94;
    /* A tall bloom sits lower so its own top stays on the canvas. See
       `fitBloom`: seven of the eight keep the original 0.40. */
    var headY = (pick && pick.headY) || S * 0.40;

    var stemP = ease(clamp01(p / 0.42));
    var topY = groundY - (groundY - headY) * stemP;

    ctx.strokeStyle = "#3d7a60";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, groundY);
    /* A slight bend, so it is a stem rather than a rule. */
    ctx.quadraticCurveTo(cx - 4, (groundY + topY) / 2, cx, topY);
    ctx.stroke();

    var leafP = ease(clamp01((p - 0.22) / 0.34));
    if (leafP > 0) {
      leaf(ctx, cx, groundY - (groundY - headY) * 0.42, -1, leafP);
      leaf(ctx, cx, groundY - (groundY - headY) * 0.60, 1, leafP * 0.86);
    }

    var petalP = clamp01((p - 0.40) / 0.42);

    /* ONE OF THE REAL EIGHT, OPENING. The bloom scales 0.18 to 1 through the
       opening, which is `GROW_OPEN`'s own figure in both gardens, so a
       flower opens here at the proportions it opens at in the garden this
       is loading. The drawing is the landing page's catalogue family,
       called with a raw context exactly as the scroll vine calls it. */
    if (pick && petalP > 0) {
      var k = 0.18 + 0.82 * ease(petalP);
      ctx.save();
      ctx.translate(cx, topY);
      ctx.scale(k, k);
      try {
        pick.fn(ctx, 0, 0, pick.R || S * 0.26, pick.hue, pick.sat, pick.light);
      } catch (e) { /* a species that throws must not take the page down */ }
      ctx.restore();
      return;
    }

    if (petalP > 0) {
      var R = S * 0.21;
      ctx.save();
      ctx.translate(cx, topY);
      for (var i = 0; i < 6; i++) {
        /* Each petal starts a little after the one before, so they unfurl
           round the bloom rather than all swinging out together. */
        var own = ease(clamp01((petalP - i * 0.09) / 0.55));
        if (own <= 0) continue;
        ctx.save();
        ctx.rotate((i * 60 + 12) * Math.PI / 180);
        ctx.fillStyle = i % 2 ? "hsl(" + FALLBACK_HUE + ",62%,72%)"
                              : "hsl(" + FALLBACK_HUE + ",58%,66%)";
        ctx.beginPath();
        ctx.ellipse(0, -R * 0.62 * own, R * 0.34 * own, R * 0.62 * own, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }
      var eyeP = ease(clamp01((p - 0.70) / 0.24));
      if (eyeP > 0) {
        ctx.fillStyle = "hsl(" + FALLBACK_HUE + ",58%,34%)";
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.26 * eyeP, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function leaf(ctx, x, y, side, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(side * k, k);
    ctx.fillStyle = "#6aaa80";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(16, -9, 25, -2);
    ctx.quadraticCurveTo(15, 7, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { return 1 - Math.pow(1 - v, 3); }

  function hide() {
    if (gone) return;
    gone = true;
    if (raf) cancelAnimationFrame(raf);
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    if (!el) return;
    el.setAttribute("data-out", "1");
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, FADE + 60);
  }

  /* BOTH, OR NEITHER. The page being ready is not enough on its own any more,
     which is the whole of "have the animation full before entering": a loader
     cut off at 40 percent of a bloom shows half a flower and then a page, and
     the half flower is the bit somebody remembers. This also replaces the old
     550ms minimum, which existed so a fast page did not flash the loader for
     80ms: a finished bloom cannot flash. */
  function maybeGo() { if (ready && bloomed) hide(); }
  function finish() { ready = true; maybeGo(); }

  function boot() {
    build();
    /* The cap. Whatever a page promised, this comes down. */
    setTimeout(hide, LIMIT);
    /* A page that has not asked to hold gets out of the way as soon as the
       window says it is loaded. */
    if (document.readyState === "complete") { if (!held) finish(); }
    else window.addEventListener("load", function () { if (!held) finish(); });
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);

  window.GardenLoader = {
    /* Called from a page's own script, BEFORE load, to say it will decide for
       itself when there is something to show. */
    hold: function () { held = true; },
    done: finish,
    /* So a page can tell whether it is still up, rather than guessing. */
    showing: function () { return !gone; }
  };
})();
