/* =========================================================================
   garden-cursor.js  -  the chrome every page shares and no page owns

   Two things live here, and they are together because both are needed on all
   four pages and neither belongs to any one of them: the cursor, and the
   little label that appears under an icon when you hover it. Putting either
   in a page's own stylesheet is how the cursor ended up on one page of four
   in the first place.

   The label is CENTRED under its button. It used to be anchored to a corner,
   which pointed it at the gap between two icons rather than at the one it
   belonged to, and the music button carried a `title` as well, so hovering it
   produced the custom label and then the operating system's own on top.

   A SPARKLE at rest and the FAVICON'S OWN BLOOM over anything you can press.
   Both are the favicon's blue, hue 206, so the mark in the tab and the mark
   under the pointer are the same thing.

   It has been a leaf, a bloom, a bud that opened and an arrow. The three
   decorations all failed the same way: they covered what you were aiming at
   and gave you no point to aim with. A four pointed star does not, because
   it is mostly empty and its points meet at a definite centre, which is
   where the hotspot sits.

   The personal garden still retints the CLICKABLE bloom with the hue of the
   flower planted most recently; only its hue moves, the rings and the
   scallops are the favicon's whatever colour it is wearing.

   It is an inline SVG data URI, so no image file is added and the bloom can be
   RECOLOURED at runtime without touching a stylesheet.

   It used to live in bouquet-style.css and appear on one page of four, which
   made it the odd page out rather than a theme. It is injected from here now,
   and every page loads this file.

   In the personal garden the bloom takes the hue of the flower planted most
   recently, so the cursor is the last thing that grew rather than a fixed
   decoration. Everywhere else it is the project's own butter yellow.
   ========================================================================= */
(function () {
  "use strict";

  var STYLE_ID = "gg-cursor-style";
  var INK = "%231d6466";        /* the outline, dark teal, url encoded */
  /* The favicon's own blue. It was 47, the palette's butter yellow, which is
     what the clickable bloom wore before this; with the resting sparkle now
     sampled off the tab icon, a yellow bloom beside it read as two unrelated
     marks. The personal garden still moves this, and only this. */
  var DEFAULT_HUE = 206;

  /* Five petals round a centre. Everything is a fraction of `reach`, which is
     how far the bloom paints from its own middle, so one function draws both
     sizes and the shape cannot drift between them. The hotspot is dead centre:
     a flower has no tip to point with, so the thing being pointed at sits
     under the middle of it.

     `fallback` is what the browser uses if it refuses the image, and it has to
     differ by state: `auto` at rest, `pointer` over a clickable, or a machine
     that will not draw a custom cursor loses the only signal it had. */
  function hsl(h, sa, l) { return encodeURIComponent("hsl(" + h + "," + sa + "%," + l + "%)"); }

  /* `hx`/`hy` is the hotspot, in the drawing's own coordinates, because the
     two states point with different parts of themselves: an arrow points with
     its tip, a flower has no tip and points with its middle. */
  function svg(box, body, hx, hy) {
    return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='" +
      box + "' height='" + box + "' viewBox='0 0 " + box + " " + box + "'>" + body +
      "</svg>\") " + hx + " " + hy + ", ";
  }

  /* THE FAVICON'S OWN BLOOM, and its colour.

     The tab icon is a scalloped bloom of concentric rings in a single blue.
     Sampled off `apple-touch-icon.png`, that blue is hue 206 at about 58
     percent saturation, running from 47 percent lightness on the outer ring
     up through 56 and 62 to a near white middle, with a dark eye. So the
     cursor is not "a blue flower", it is THAT flower: the thing in the tab
     and the thing under the pointer are one mark.

     206 also does something no other hue in the project can. Every colour on
     these pages is a teal, a cream or a pastel bloom, so a saturated blue is
     the one thing that is never mistaken for the page it is sitting on. */
  var FAV_H = 206;
  var FAV_S = 58;

  /* Six rings, scalloped rather than round, lightening inward. `wob` is how
     far the scallop swings; drawn as a plain circle this reads as a target
     rather than as a flower. */
  function ringBloom(hue, R) {
    var out = "";
    var steps = [
      { r: 1.00, l: 47 }, { r: 0.81, l: 53 }, { r: 0.63, l: 60 },
      { r: 0.46, l: 88 }, { r: 0.30, l: 62 }, { r: 0.15, l: 34 }
    ];
    for (var s = 0; s < steps.length; s++) {
      var rr = R * steps[s].r;
      var lobes = 11, wob = rr * 0.085, d = "";
      for (var k = 0; k <= 48; k++) {
        var a = k / 48 * 6.28318;
        var rad = rr + Math.sin(a * lobes) * wob;
        var x = (Math.cos(a) * rad).toFixed(2);
        var y = (Math.sin(a) * rad).toFixed(2);
        d += (k ? "L" : "M") + x + " " + y;
      }
      out += "<path d='" + d + "Z' fill='" + hsl(hue, FAV_S, steps[s].l) + "'/>";
    }
    return out;
  }

  /* THE SPARKLE, at rest. The gardens' own four pointed star, the one thrown
     around a flower the moment it is planted, in the favicon's blue.

     It replaced an arrow, which replaced a bud, a bloom and a leaf. What makes
     this one work where the earlier decorations did not is that a four pointed
     star has a definite CENTRE where its points meet, so there is still
     somewhere exact to aim, and it is mostly empty, so it does not cover the
     thing being aimed at. */
  function sparkleArt(hue) {
    var R = 7.6, inner = R * 0.3;
    var d = "";
    for (var i = 0; i < 8; i++) {
      var a = i * 0.7854;
      var rad = (i % 2 === 0) ? R : inner;
      d += (i ? "L" : "M") + (Math.cos(a) * rad).toFixed(2) + " " + (Math.sin(a) * rad).toFixed(2);
    }
    return "<g transform='translate(10 10)'><circle r='4.2' fill='" + hsl(hue, FAV_S, 62) +
      "' opacity='0.30'/><path d='" + d + "Z' fill='" + hsl(hue, FAV_S, 52) +
      "' stroke='" + hsl(hue, FAV_S, 34) + "' stroke-width='0.7' stroke-linejoin='round'/></g>";
  }

  /* IT IS 32 PIXELS AND MUST NOT GROW. Windows refuses a custom cursor larger
     than 32 by 32 outright, and a refused cursor falls back to the plain
     system arrow, so anything bigger would silently lose it on every Windows
     machine. */
  function openArt(hue) {
    return "<g transform='translate(16 16)'>" + ringBloom(hue, 15) + "</g>";
  }

  function calm() { return svg(20, sparkleArt(FAV_H), 10, 10) + "auto"; }
  function keen(hue) { return svg(32, openArt(hue), 16, 16) + "pointer"; }

  /* Every clickable thing takes the bloom, and the CLASSES are listed as well
     as the elements. That is not belt and braces: `.bq-btn-outline` is a class
     rule carrying `cursor: pointer`, which outranks a bare `button` selector,
     so the buttons kept the system pointer until they were named here.
     Anything new that sets its own `cursor: pointer` on a class has to be
     added to this list.

     What is NOT here matters as much. Three entries were taken out because
     they made the flower appear over things nobody would call a button:

       .garden-card-inner  the whole of each of the three cards, six hundred
                           pixels of title, paragraph and small print, when
                           the only thing to press is the button at its foot.
       .flower-tile        the whole of each guide tile, its name and its
                           meaning included.
       label[for]          a form label, which is clickable in the technical
                           sense and in no other.

     All three still work exactly as before; they just show the sparkle while
     you read them. The rule is that the bloom marks a thing that ANSWERS the
     pointer, and a big box you happen to be able to click is not one. `.wig`
     is in the list for the same rule read the other way: those words are not
     links, but they do answer. */
  var CLICKABLE = [
    "a", "button", "[role=\"button\"]", "summary",
    /* the bouquet builder */
    ".bq-btn", ".bq-btn-outline", ".bq-btn-ghost", ".bq-step-btn", ".bq-wrap-fix",
    ".bq-letter-close", ".bq-swatch", ".bq-flower-tile", ".bq-foliage-tile",
    ".bq-card-tag", ".bq-mode-tile", ".bq-template-tile", ".bq-city-tile",
    ".bq-shop-tile", ".bq-pay-tile", ".bq-pay-chip", ".bq-step-dot",
    /* the gardens, built by p5.dom with their own classes */
    ".gg-btn", ".gg-back", ".gg-tile", ".gg-card-btn",
    /* the landing page */
    ".btn-primary", ".btn-outline", ".btn-on-dark", ".btn-card-light",
    ".side-nav-item", ".card-fold-toggle",
    /* The wiggling words in the headings. They are not links, but they do
       answer when the pointer crosses them, and the bloom is what says so
       before you find out by accident. */
    ".wig",
    /* the panels this project adds */
    ".ga-mini", ".ga-btn", ".ga-link", ".ga-rename-link", ".gj-day", ".gj-arrow",
    ".gs-btn", ".gs-link"
  ].join(",\n");

  /* EVERY rule in here carries `!important`, and it is the fix for a real bug
     rather than a shortcut.

     This file is loaded from the head, so its style tag is the FIRST one in
     the document. Every module that builds a control of its own then appends
     a style tag AFTER it, and several of them set `cursor: pointer` on an ID:
     `#gj-btn`, `#gg-music-btn`, `#ga-friends-btn`, `#gj-close`. An id beats an
     element selector outright, and a later tag beats an earlier one at equal
     specificity, so the four round icons in the corner of every page kept the
     system arrow while everything around them drew a flower. `#save-btn` was
     worse: both gardens set its cursor INLINE, which nothing but `!important`
     can reach at all.

     Adding those ids to the list below would not have worked. Each selector in
     a list carries its own specificity, so `#gj-btn` there would only TIE with
     the module's own rule, and the module's tag comes later.

     The exceptions keep `!important` too, so they still win the way they
     always did: by being declared last, and by being more specific. */
  var IMP = " !important; }\n";

  function css(hue) {
    return "body { cursor: " + calm() + IMP +
      CLICKABLE + " { cursor: " + keen(hue) + IMP +
      /* Declared LAST so they win. A caret and a grab handle each say
         something true about the control, and a decorative cursor would throw
         that away. */
      "input, textarea, select, [contenteditable=\"true\"] { cursor: auto" + IMP +
      "input[type=\"range\"], .gg-hue-slider, .bq-light-slider { cursor: grab" + IMP +
      "input[type=\"range\"]:active, .gg-hue-slider:active, .bq-light-slider:active { cursor: grabbing" + IMP +
      "button:disabled, .ga-mini:disabled, .ga-btn:disabled, .gj-arrow:disabled, " +
      ".bq-btn:disabled, .bq-btn-outline:disabled, .bq-btn-ghost:disabled, " +
      ".bq-step-btn:disabled, .gj-day:disabled { cursor: not-allowed" + IMP +
      /* A touch screen has no cursor to draw, and a coarse pointer with a
         hover-less device gains nothing from this. */
      "@media (hover: none) { body, " + CLICKABLE + " { cursor: auto" + IMP + "}\n";
  }

  /* ------------------------------------------------------------- tooltips */
  /* A short label under any control carrying `data-tip`. The browser's own
     `title` already does this, but only after a long pause and in the
     operating system's styling, and the top right of every page is now a row
     of four unlabelled icons, which is exactly where a fast, legible answer
     to "what is this" is worth having.

     It is pure CSS off an attribute, so a module adds a tooltip by setting
     one attribute and nothing has to be built. */
  var TIP =
    "[data-tip]{position:relative;}" +
    /* CENTRED on the button, not hung off one corner. These are round icons in
       a row eight pixels apart, and a label anchored to an edge pointed at the
       gap between two of them rather than at the one it belongs to. */
    "[data-tip]::after{content:attr(data-tip);position:absolute;top:calc(100% + 9px);" +
      "left:50%;background:rgba(29,100,102,0.95);color:#fff9e3;" +
      "font-family:Arial,Helvetica,sans-serif;font-size:11.5px;font-weight:700;" +
      "line-height:1;letter-spacing:0.01em;padding:7px 10px;border-radius:7px;" +
      "white-space:nowrap;pointer-events:none;opacity:0;" +
      "transform:translateX(-50%) translateY(-3px);" +
      "z-index:400;box-shadow:0 3px 12px rgba(29,100,102,0.22);" +
      "transition:opacity .16s ease .22s,transform .16s ease .22s;}" +
    "[data-tip]:hover::after,[data-tip]:focus-visible::after{opacity:1;" +
      "transform:translateX(-50%);}" +
    /* Nothing to hover on a touch screen, and a label stuck open after a tap
       is worse than none. */
    "@media (hover:none){[data-tip]::after{display:none;}}" +
    "@media (prefers-reduced-motion:reduce){[data-tip]::after{transition:opacity .01s;}}";

  var tag = null;
  /* `apply` only ever moves the CLICKABLE bloom's hue. The resting sparkle
     stays the favicon's blue on every page, because it is the mark rather
     than the state: retinting it too would leave no fixed point at all. */
  function apply(hue) {
    if (!tag) {
      tag = document.getElementById(STYLE_ID);
      if (!tag) {
        tag = document.createElement("style");
        tag.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(tag);
      }
    }
    tag.textContent = css(hue) + TIP;
  }

  apply(DEFAULT_HUE);

  window.GardenCursor = {
    /* The personal garden calls this with the hue of its newest flower. Any
       page that never calls it keeps the butter yellow. */
    tint: function (hue) {
      var h = Number(hue);
      if (!isFinite(h)) return;
      apply(((h % 360) + 360) % 360);
    },
    reset: function () { apply(DEFAULT_HUE); }
  };
})();
