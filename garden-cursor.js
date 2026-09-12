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

   An ARROW at rest, in the project's own colours, and a FLOWER over anything
   you can press. It has been a leaf, then a bloom, then a bud that opened,
   and each of those had the same problem: a decorative shape at rest covers
   what you are aiming at and gives you no point to aim with. The arrow keeps
   the precision and it also earns the flower, which now means "this does
   something" rather than following the pointer everywhere regardless.

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
  var DEFAULT_HUE = 47;         /* butter, the same yellow the palette uses */

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

  /* THE ARROW, at rest. The project's dark teal with a cream edge, so it holds
     against the pale cream of most of the landing page AND against the dark
     teal bands, which no single flat colour does.

     It was a flower, and before that a leaf, and both were wrong for the same
     reason: a decorative shape at rest covers what you are trying to aim at
     and has no point to aim WITH. An arrow keeps the precision, and it makes
     the flower mean something, because the flower now appears only over
     things you can actually press rather than following you everywhere.

     The hotspot is the tip at 1,1. The 1.4 stroke puts the painted tip about
     0.3 outside that, which is under a pixel and below what anyone can aim
     to anyway. */
  function arrowArt() {
    return "<path d='M1 1 L1 17.6 L5.3 13.8 L8 19.6 L10.7 18.4 L8.1 12.7 L13.7 12.6 Z' fill='" +
      INK + "' stroke='%23fff9e3' stroke-width='1.4' stroke-linejoin='round'/>";
  }

  /* THE OPEN FLOWER, over anything clickable. Five broad petals standing apart
     round a clear eye, at the full colour, and it points with its centre.

     IT IS 32 PIXELS AND MUST NOT GROW. Windows refuses a custom cursor larger
     than 32 by 32 outright, and a refused cursor falls back to the plain
     system arrow, so anything bigger would silently lose the flower on every
     Windows machine. */
  function openArt(hue) {
    var skin = hsl(hue, 96, 72);
    var core = hsl((hue + 150) % 360, 40, 38);
    var out = "";
    for (var i = 0; i < 5; i++) {
      out += "<ellipse cx='0' cy='-7.3' rx='5.2' ry='6.1' fill='" + skin + "' stroke='" + INK +
             "' stroke-width='1.3' transform='rotate(" + (i * 72) + ")'/>";
    }
    return "<g transform='translate(16 16)'>" + out + "<circle r='3.5' fill='" + core +
      "'/></g>";
  }

  function calm() { return svg(22, arrowArt(), 1, 1) + "auto"; }
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

     All three still work exactly as before; they just show the arrow while
     you read them. The rule is that the flower marks a CONTROL, and a big
     box you happen to be able to click is not one. */
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
