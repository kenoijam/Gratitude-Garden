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

   NOTHING here is p5. The gardens' own flower code lives inside their
   sketches, and the sketch is precisely what has not loaded yet at the moment
   this has to draw, so the bloom is a generic one drawn on a raw canvas. It
   is deliberately not any of the eight: a loader that showed a daisy would be
   promising a daisy.

   Two ways out, and both are needed:

     done()   a page calls it when it has something to show. The shared garden
              calls it once the room has resolved and the first frame is up.
     the CAP  it hides itself after LIMIT no matter what. A loader that can
              outlive its page is worse than no loader, because a failed
              connection would leave a flower spinning over nothing for ever.
   ========================================================================= */
(function () {
  "use strict";

  var MIN = 550;      /* ms. Below this it is a flash, which reads as a fault */
  var LIMIT = 9000;   /* ms. The cap: never hold the page longer than this */
  var FADE = 420;

  /* Skip it entirely for a return visit inside the same session. The wait is
     real the first time, when the fonts, the sketch and the room are all cold;
     walking back from the bouquet to the landing page is instant and a loader
     over an instant page is just a flicker. */
  var KEY = "gg_loaded";
  try { if (sessionStorage.getItem(KEY) === "1") return; } catch (e) {}

  var held = false, shown = 0, gone = false, el = null, raf = 0;

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

    var t0 = Date.now();
    function frame() {
      /* 0 to 1 over two and a half seconds, then round again. The cycle is
         long enough that a fast page shows only the first part of it, which
         is the stem going up: the beginning of something rather than a loop
         caught mid turn. */
      var p = still ? 1 : ((Date.now() - t0) % 2500) / 2500;
      draw(ctx, 132, p);
      if (!gone && !still) raf = requestAnimationFrame(frame);
    }
    frame();
  }

  /* One bloom, drawn in four overlapping stages so nothing pops into being:
     the stem to 0.42, the leaves from 0.22, the petals from 0.40 opening one
     after another, the eye from 0.70. */
  function draw(ctx, S, p) {
    ctx.clearRect(0, 0, S, S);
    var cx = S / 2, groundY = S * 0.94, headY = S * 0.40;

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
        ctx.fillStyle = i % 2 ? "hsl(206,62%,72%)" : "hsl(206,58%,66%)";
        ctx.beginPath();
        ctx.ellipse(0, -R * 0.62 * own, R * 0.34 * own, R * 0.62 * own, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }
      var eyeP = ease(clamp01((p - 0.70) / 0.24));
      if (eyeP > 0) {
        ctx.fillStyle = "hsl(206,58%,34%)";
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

  /* A minimum on screen, because a loader that flashes for 80ms reads as the
     page glitching rather than as the page loading. */
  function finish() {
    var waited = Date.now() - shown;
    if (waited >= MIN) hide();
    else setTimeout(hide, MIN - waited);
  }

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
