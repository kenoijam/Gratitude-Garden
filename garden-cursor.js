/* =========================================================================
   garden-cursor.js  -  the chrome every page shares and no page owns

   Two things live here, and they are together because both are needed on all
   four pages and neither belongs to any one of them: the cursor, and the
   little label that appears under an icon when you hover it. Putting either
   in a page's own stylesheet is how the cursor ended up on one page of four
   in the first place.

   A leaf at rest, a bloom over anything clickable. Both are inline SVG data
   URIs, so no image file is added and the bloom can be RECOLOURED at runtime
   without touching a stylesheet.

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

  /* A leaf. The hotspot is its stem end at 3,3, so the thing being pointed at
     is under the tip rather than under the middle of the blade. */
  var LEAF =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' " +
    "viewBox='0 0 24 24'><path d='M3.2 2.6c9.2.6 15.6 5.6 16.4 14.6C10.4 17 3.8 11.8 3.2 2.6z' " +
    "fill='" + INK + "'/><path d='M4.4 4c5.4 2.6 9.8 6.6 12.6 11.4' stroke='%23fff9e3' " +
    "stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>\") 3 3, auto";

  /* Five petals round a centre, hotspot dead centre at 9,9. Built from a hue
     rather than a fixed colour so the personal garden can retint it. */
  function bloom(hue) {
    var petal = "hsl(" + hue + ",92%,76%)";
    var core = "hsl(" + ((hue + 150) % 360) + ",38%,42%)";
    var p = encodeURIComponent(petal);
    var c = encodeURIComponent(core);
    var out = "";
    for (var i = 0; i < 5; i++) {
      out += "<ellipse cx='0' cy='-5.4' rx='3.1' ry='4.6' fill='" + p + "' stroke='" + INK +
             "' stroke-width='1.1' transform='rotate(" + (i * 72) + ")'/>";
    }
    return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' " +
      "height='26' viewBox='0 0 26 26'><g transform='translate(9 9)'>" + out +
      "<circle r='2.6' fill='" + c + "'/></g></svg>\") 9 9, pointer";
  }

  /* Every clickable thing takes the bloom, and the CLASSES are listed as well
     as the elements. That is not belt and braces: `.bq-btn-outline` is a class
     rule carrying `cursor: pointer`, which outranks a bare `button` selector,
     so the buttons kept the system pointer until they were named here.
     Anything new that sets its own `cursor: pointer` on a class has to be
     added to this list. */
  var CLICKABLE = [
    "a", "button", "[role=\"button\"]", "summary", "label[for]",
    /* the bouquet builder */
    ".bq-btn", ".bq-btn-outline", ".bq-btn-ghost", ".bq-step-btn", ".bq-wrap-fix",
    ".bq-letter-close", ".bq-swatch", ".bq-flower-tile", ".bq-foliage-tile",
    ".bq-card-tag", ".bq-mode-tile", ".bq-template-tile", ".bq-city-tile",
    ".bq-shop-tile", ".bq-pay-tile", ".bq-pay-chip", ".bq-step-dot",
    /* the gardens, built by p5.dom with their own classes */
    ".gg-btn", ".gg-back", ".gg-tile", ".gg-card-btn",
    /* the landing page */
    ".btn-primary", ".btn-outline", ".btn-on-dark", ".btn-card-light",
    ".side-nav-item", ".flower-tile", ".garden-card-inner", ".card-fold-toggle",
    /* the panels this project adds */
    ".ga-mini", ".ga-btn", ".ga-link", ".ga-rename-link", ".gj-day", ".gj-arrow",
    ".gs-btn", ".gs-link"
  ].join(",\n");

  function css(hue) {
    return "body { cursor: " + LEAF + "; }\n" +
      CLICKABLE + " { cursor: " + bloom(hue) + "; }\n" +
      /* Declared LAST so they win. A caret and a grab handle each say
         something true about the control, and a decorative cursor would throw
         that away. */
      "input, textarea, select, [contenteditable=\"true\"] { cursor: auto; }\n" +
      "input[type=\"range\"], .gg-hue-slider, .bq-light-slider { cursor: grab; }\n" +
      "input[type=\"range\"]:active, .gg-hue-slider:active, .bq-light-slider:active { cursor: grabbing; }\n" +
      "button:disabled, .ga-mini:disabled, .ga-btn:disabled, .gj-arrow:disabled, " +
      ".bq-btn:disabled, .bq-btn-outline:disabled, .bq-btn-ghost:disabled, " +
      ".bq-step-btn:disabled, .gj-day:disabled { cursor: not-allowed; }\n" +
      /* A touch screen has no cursor to draw, and a coarse pointer with a
         hover-less device gains nothing from this. */
      "@media (hover: none) { body, " + CLICKABLE + " { cursor: auto; } }\n";
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
    "[data-tip]::after{content:attr(data-tip);position:absolute;top:calc(100% + 9px);" +
      "right:0;background:rgba(29,100,102,0.95);color:#fff9e3;" +
      "font-family:Arial,Helvetica,sans-serif;font-size:11.5px;font-weight:700;" +
      "line-height:1;letter-spacing:0.01em;padding:7px 10px;border-radius:7px;" +
      "white-space:nowrap;pointer-events:none;opacity:0;transform:translateY(-3px);" +
      "z-index:400;box-shadow:0 3px 12px rgba(29,100,102,0.22);" +
      "transition:opacity .16s ease .22s,transform .16s ease .22s;}" +
    "[data-tip]:hover::after,[data-tip]:focus-visible::after{opacity:1;transform:none;}" +
    /* The music button drops its volume panel into exactly the space below
       itself, so its label goes to the LEFT instead of colliding with it. */
    "[data-tip][data-tip-side=\"left\"]::after{top:50%;right:calc(100% + 9px);" +
      "transform:translateY(-50%) translateX(3px);}" +
    "[data-tip][data-tip-side=\"left\"]:hover::after," +
      "[data-tip][data-tip-side=\"left\"]:focus-visible::after{transform:translateY(-50%);}" +
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
