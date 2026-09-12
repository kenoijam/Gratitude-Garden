/* =========================================================================
   garden-cursor.js  -  one cursor for the whole project

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
    tag.textContent = css(hue);
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
