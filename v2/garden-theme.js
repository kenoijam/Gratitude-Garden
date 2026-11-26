/* ════════════════════════════════════════════════════════════════════════
   garden-theme.js  ·  LIGHT, DARK, AUTO

   ONE MODULE AT THE v2 ROOT, loaded by the landing page and both gardens,
   like `garden-music.js`, `garden-cursor.js` and `garden-daylight.js`. A
   copy per page is the thing this project already pays for seven times over
   in the flower maths, and a second copy of a three state toggle would drift
   within a session.

   IT OWNS NO COLOUR. Every palette belongs to `garden-daylight.js`, and
   "dark" there is not a theme bolted on: it is the keyframe at one in the
   morning, with its own navy sky, its moon, its stars, its dark teal section
   grounds and its cream ink, all of them already measured. So this file sets
   an HOUR and nothing downstream has to know a button exists: the gardens'
   `draw()` asks the clock every frame, the CSS variables are written on every
   recompute, and `data-dark` and `data-ink` flip on their own.

   THE STATE IS SHARED ACROSS ALL FOUR PAGES, under `gg_theme` in
   `localStorage`, for the same reason `gg_music_on` is: they are one origin,
   and a preference that reset on every navigation is not a preference.

   SLOT 3 OF THE CORNER ROW, `right: 108`, and it is the SAME SLOT ON EVERY
   PAGE. The row runs music 16, account 62, theme 108, history 154, camera
   200; the history button and the camera each moved along by one to make
   room, in `garden-journal.js` and in both gardens' stylesheet and sketch.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  if (window.GardenTheme) return;

  var ORDER = ["auto", "light", "dark"];
  var LABEL = {
    auto:  "Auto, following the clock",
    light: "Light",
    dark:  "Dark"
  };

  /* THE ICON HAS TO CARRY THE STATE ON ITS OWN, because the hover label is
     removed under `(hover: none)` and a three state cycle with no visible
     state is a button you press blind on a phone. Sun, moon, and for auto a
     disc that is sun on one side and moon on the other, which is the one
     shape that reads as "whichever it happens to be". Stroked at 1.5 on a 24
     box in `currentColor`, which is the four corner controls' own language
     rather than the solid fills the twelve species use. */
  var ICON = {
    light:
      '<circle cx="12" cy="12" r="4.1"/>' +
      '<path d="M12 2.6v2.4M12 19v2.4M21.4 12H19M5 12H2.6' +
      'M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7M18.6 18.6l-1.7-1.7M7.1 7.1L5.4 5.4"/>',
    dark:
      '<path d="M20.2 14.4A8.4 8.4 0 0 1 9.6 3.8a8.4 8.4 0 1 0 10.6 10.6z"/>' +
      '<path d="M17.4 4.1l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z"/>',
    /* ONE DISC, HALF OF IT FILLED, and three earlier shapes are why it is this
       plain. A sun with a crescent bitten out of one side came out as a
       lopsided blob at 18px; rays on one half and a crescent on the other was
       two ideas in a 24 unit box and read as a smudge. A circle whose right
       half is solid is the glyph every interface already uses for "follows
       the system", it is ONE shape rather than two, and at 18px the eye reads
       the straight edge down the middle before anything else. No rays: they
       would make it a sun, which is the LIGHT icon sitting next to it. */
    auto:
      '<circle cx="12" cy="12" r="8.4"/>' +
      '<path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill="currentColor" stroke="none"/>'
  };

  function svg(mode) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
           'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + ICON[mode] + '</svg>';
  }

  var btn = null;

  function paint(mode) {
    if (!btn) return;
    btn.innerHTML = svg(mode);
    btn.setAttribute("data-mode", mode);
    /* NO `title`. A `title` beside a `data-tip` means hovering produces the
       project's own label and then the operating system's on top of it, which
       is a rule the corner row already carries. */
    btn.setAttribute("data-tip", LABEL[mode]);
    btn.setAttribute("aria-label", "Appearance: " + LABEL[mode] + ". Press to change.");
  }

  function next() {
    var D = window.GardenDaylight;
    if (!D || !D.setMode) return;
    var i = ORDER.indexOf(D.mode());
    D.setMode(ORDER[(i + 1) % ORDER.length]);
  }

  function style() {
    var css =
      '#gg-theme{position:fixed;top:20px;right:108px;z-index:261;width:38px;height:38px;' +
      'border-radius:50%;border:1.5px solid var(--gg-ctl-line);background:var(--gg-ctl-bg);' +
      'color:var(--gg-ctl-ink);display:flex;align-items:center;justify-content:center;' +
      'padding:0;cursor:pointer;box-shadow:var(--gg-ctl-shadow);' +
      'transition:transform .18s ease,box-shadow .18s ease,background .3s ease,color .3s ease;}' +
      /* ON A DARK SKY THE BUTTON TURNS OVER WITH EVERYTHING ELSE. `data-dark`
         is the page's own flag, set by `garden-daylight.js` on `<html>`, so
         this cannot disagree with the grounds about what time it is. */
      /* ITS OWN DARK RULE IS GONE: `--gg-ctl-*` carries the turnover for the
         whole row now, and this button was the only one that had it. */
      ''+
      /* THE ROW'S OWN HOVER, a 1px lift and a deeper shadow, not a scale.
         This button alone grew by 1.06 where the other four lift. */
      '#gg-theme:hover{background:var(--gg-ctl-bg-hover);transform:translateY(-1px);' +
      'box-shadow:var(--gg-ctl-shadow-hover);}' +
      '#gg-theme:active{transform:scale(0.96);}' +
      /* A hover lift on a touch screen costs the FIRST TAP: Safari applies the
         hover rule instead of activating. Same rule the four stylesheets carry. */
      '@media (hover:none){#gg-theme:hover{transform:none;box-shadow:0 2px 10px rgba(29,100,102,0.12);}}' +
      '@media (max-width:768px){#gg-theme{top:16px;right:96px;width:34px;height:34px;}' +
      '#gg-theme svg{width:16px;height:16px;}}';
    var t = document.createElement("style");
    t.textContent = css;
    document.head.appendChild(t);
  }

  function build() {
    if (document.getElementById("gg-theme")) return;
    if (!window.GardenDaylight || !window.GardenDaylight.setMode) return;
    style();
    btn = document.createElement("button");
    btn.id = "gg-theme";
    btn.type = "button";
    btn.addEventListener("click", next);
    document.body.appendChild(btn);
    /* `onChange` fires immediately with the mode it already has, so this is
       the first paint as well as the subscription. */
    window.GardenDaylight.onChange(function (m) {
      paint(m);
      /* The hero's sun is a canvas on a 10 second poll rather than a per
         frame draw, which is a long time to sit on the wrong sun. */
      try { if (window._paintHeroSun) window._paintHeroSun(); } catch (e) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }

  window.GardenTheme = { build: build, cycle: next };
})();
