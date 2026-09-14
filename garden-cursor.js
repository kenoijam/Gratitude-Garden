/* =========================================================================
   garden-cursor.js  -  the chrome every page shares and no page owns

   Three things live here, and they are together because all three are needed
   on all four pages and none belongs to any one of them: the cursor, the
   little label that appears under an icon when you hover it, and the rule
   that gets those icons out of the way while a phone is scrolling. Putting either
   in a page's own stylesheet is how the cursor ended up on one page of four
   in the first place.

   The label is CENTRED under its button. It used to be anchored to a corner,
   which pointed it at the gap between two icons rather than at the one it
   belonged to, and the music button carried a `title` as well, so hovering it
   produced the custom label and then the operating system's own on top.

   A FLAT FIVE PETALLED FLOWER at rest, shrinking to a SPARKLE over anything
   you can press. Both in the favicon's blue, so the mark in the tab and the
   mark under the pointer are the same colour.

   It is not a rose and no longer tries to be. A rose was drawn here, with a
   spiral centre and three rounds of overlapping petals, and at thirty pixels
   it was a blue smudge that did not read as a rose anyway.

   That way round is deliberate and it is the reverse of where this started.
   A solid bloom over a control sits on top of the very thing being aimed at,
   at the moment its label is opening and wanting to be read. At rest there is
   nothing underneath to hide, so the rose can be large enough to read as a
   rose, and the sparkle that replaces it is small and mostly empty.

   The personal garden retints BOTH with the hue of the flower planted most
   recently. The rings, the scallops and the points are the favicon's whatever
   colour they are wearing.

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

  /* THE FAVICON'S OWN ROSE, and its colour.

     The tab icon is a rose of concentric scalloped rings in a single blue.
     Sampled off `apple-touch-icon.png`, that blue is hue 206 at about 58
     percent saturation, running from 47 percent lightness on the outer ring
     inward to a near white middle with a dark eye. So the cursor is not "a
     blue flower", it is THAT flower: the thing in the tab and the thing under
     the pointer are one mark.

     206 also does something no other hue in the project can. Every colour on
     these pages is a teal, a cream or a pastel bloom, so a saturated blue is
     the one thing that is never mistaken for the page it is sitting on. The
     saturation is pushed to 66 and the outer ring darkened to 42 against the
     icon's own 58 and 47, because an icon sits in a browser chrome of its own
     while this has to hold against six different section colours. */
  var FAV_H = 206;
  var FAV_S = 66;

  /* FIVE FLAT PETALS AND A CENTRE. That is the whole drawing.

     This started as the favicon's concentric rings, then became a rose: a
     spiral centre inside three rounds of overlapping cupped petals, eighteen
     shapes in all. Rendered at thirty pixels it was a blue smudge, and it did
     not read as a rose either, which is the honest verdict on detail at icon
     size. **A cursor can carry about six shapes. Anything past that is
     texture nobody can see and weight everybody pays.**

     So: one ring of five petals, one flat blue, one outline, one centre. It is
     what a flower looks like at this size, and it still reads at twenty, which
     is what the phone and the smaller of the two states need. */

  /* The double outline is what makes it work on ANY ground, and it is measured
     rather than belt and braces. Against the six colours these pages are made
     of, no single outline can do it: dark teal scores 1.00 against the dark
     teal band and 1.35 against the dark green card, and cream scores 1.00
     against cream and 1.06 against the pale blue. A near black line inside a
     cream halo always has one of the two separating: 13.2 on cream, 6.5 on
     dark teal. */
  var HALO = "%23fff9e3";
  var LINE = "%23102e34";

  function petals(R, out, stroke, width, fill) {
    for (var i = 0; i < 5; i++) {
      out.push("<ellipse cx='0' cy='" + (-R * 0.56).toFixed(2) + "' rx='" +
        (R * 0.40).toFixed(2) + "' ry='" + (R * 0.47).toFixed(2) + "' transform='rotate(" +
        (i * 72) + ")' fill='" + fill + "' stroke='" + stroke + "' stroke-width='" + width + "'/>");
    }
  }

  function flowerArt(hue, R) {
    var out = [];
    /* EVERY halo first, then every petal. Interleaved, a later petal's cream
       stroke lands on top of an earlier petal's fill and cuts a pale scar
       across the flower. */
    petals(R, out, HALO, R * 0.26, "none");
    out.push("<circle r='" + (R * 0.30).toFixed(2) + "' fill='none' stroke='" + HALO +
      "' stroke-width='" + (R * 0.26).toFixed(2) + "'/>");
    petals(R, out, LINE, R * 0.11, hsl(hue, FAV_S, 60));
    out.push("<circle r='" + (R * 0.26).toFixed(2) + "' fill='" + hsl(hue, FAV_S, 82) +
      "' stroke='" + LINE + "' stroke-width='" + (R * 0.11).toFixed(2) + "'/>");
    return out.join("");
  }

  /* Same double outline as the rose, for the same reason: this one has to
     hold on the dark teal band and the dark green card as well as on cream. */
  function sparkleArt(hue, R) {
    var inner = R * 0.30, d = "";
    for (var i = 0; i < 8; i++) {
      var a = i * 0.7854;
      var rad = (i % 2 === 0) ? R : inner;
      d += (i ? "L" : "M") + (Math.cos(a) * rad).toFixed(2) + " " + (Math.sin(a) * rad).toFixed(2);
    }
    return "<path d='" + d + "Z' fill='none' stroke='" + HALO +
      "' stroke-width='3.4' stroke-linejoin='round'/>" +
      "<path d='" + d + "Z' fill='" + hsl(hue, FAV_S, 54) +
      "' stroke='" + LINE + "' stroke-width='1' stroke-linejoin='round'/>";
  }

  /* THE ROSE IS AT REST AND THE SPARKLE IS ON A CONTROL, and that is the
     reverse of where it started.

     The bloom used to appear over anything clickable, which is the moment you
     least want a solid object under the pointer: it sat on top of the icon or
     the word being aimed at, exactly when its label was opening and wanting to
     be read. At rest there is nothing underneath to hide, so the rose can be
     the size it needs to be to read as a rose, and the sparkle over a control
     is small, mostly empty, and gets out of the way.

     The rose is 30 across; NOTHING HERE MAY EXCEED 32. Windows refuses a
     custom cursor larger than 32 by 32 outright and falls back to the plain
     system arrow, which would lose the mark entirely on every Windows
     machine. */
  function calm(hue) {
    return svg(30, "<g transform='translate(15 15)'>" + flowerArt(hue, 12.6) + "</g>", 15, 15) + "auto";
  }
  function keen(hue) {
    return svg(20, "<g transform='translate(10 10)'>" + sparkleArt(hue, 8.4) + "</g>", 10, 10) + "pointer";
  }

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
    return "body { cursor: " + calm(hue) + IMP +
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

  /* ------------------------------------------------- the tips card folds */
  /* Both gardens build a `#tips-card` in the bottom left corner: a heading and
     four or five lines. On a desktop it sits in empty grass. On a phone the
     garden is a strip and that card is a paragraph across the bottom third of
     it, so it folds to its own heading and opens on a tap.

     It lives here rather than in either sketch because both build the same
     card, and a copy in each would be a fifth place the same idea is written
     down in this project. */
  /* THE HOME BUTTON MATCHES THE ROW OF ICONS OPPOSITE IT. It was drawn on a
     16 unit grid at a stroke of 1.8 while every other icon uses a 24 unit
     grid at 2, so at the same 16px it came out a third heavier; and on a
     phone it was 39 by 35 at 20px down against their 34 by 34 at 16. The
     selector carries `html body a` so it outranks the phone rules in each
     page's own stylesheet, which set the same properties with
     `!important`, and the pages set it INLINE as well. */
  var HOME =
    /* Laptop: the pill keeps its word, but stands 38 tall like the icons and
       draws its house at their 18px, which is their 1.5px line exactly. */
    "html body a#back-to-home{height:38px !important;box-sizing:border-box !important;" +
      "padding-top:0 !important;padding-bottom:0 !important;}" +
    "html body a#back-to-home svg{width:18px !important;height:18px !important;}" +
    "@media (max-width: 768px){" +
      "html body a#back-to-home{top:16px !important;left:12px !important;" +
        "width:34px !important;height:34px !important;padding:0 !important;gap:0 !important;" +
        "box-sizing:border-box !important;border-radius:50% !important;" +
        "justify-content:center !important;font-size:0 !important;line-height:0 !important;}" +
      "html body a#back-to-home svg{width:16px !important;height:16px !important;}}";
  function swapHomeIcon() {
    var a = document.getElementById("back-to-home");
    var old = a && a.querySelector("svg");
    if (!old || old.getAttribute("data-gg-home")) return;
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", old.getAttribute("width") || "16");
    svg.setAttribute("height", old.getAttribute("height") || "16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("data-gg-home", "1");
    ["M3.5 10.6 12 3.6l8.5 7", "M5.8 9v10.2a1 1 0 0 0 1 1h3.4v-5.4a1 1 0 0 1 1-1h1.6a1 1 0 0 1 1 1v5.4h3.4a1 1 0 0 0 1-1V9"]
      .forEach(function (d) {
        var path = document.createElementNS(NS, "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
      });
    old.parentNode.replaceChild(svg, old);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", swapHomeIcon);
  else swapHomeIcon();

  var TIPS =
    "#tips-card h3{cursor:pointer;}" +
    "@media (max-width: 768px){" +
      /* `!important`, because the sketch sets `pointer-events: none` on this
         card INLINE and inline beats a plain rule. That one word is why the
         tips would not open: the heading never received the tap at all, and
         nothing about the fold was wrong. The heading also needs a cursor and
         a touch target of its own. */
      "#tips-card{pointer-events:auto !important;" +
        /* LIFTED CLEAR OF SAFARI'S BAR. On an iPhone the heading sat about
           20px above Safari's floating toolbar, and Safari claims taps that
           close to its bar to bring the toolbar up, so the page never saw
           them. The tap worked in every desktop emulation and not on the
           phone, which is the signature of exactly this. */
        "bottom:calc(64px + env(safe-area-inset-bottom, 0px)) !important;}" +
      "#tips-card h3{display:flex;align-items:center;gap:8px;cursor:pointer;pointer-events:auto !important;padding:6px 0;min-height:34px;}" +
      "#tips-card h3::after{content:'';width:8px;height:8px;flex:0 0 auto;" +
        "border-right:2px solid currentColor;border-bottom:2px solid currentColor;" +
        "transform:rotate(45deg) translate(-2px,-2px);opacity:.7;" +
        "transition:transform .2s ease;}" +
      "#tips-card[data-open=\"1\"] h3::after{transform:rotate(-135deg) translate(-3px,-3px);}" +
      "#tips-card ul{display:none;}" +
      "#tips-card[data-open=\"1\"] ul{display:block;}}";

  function wireTips() {
    var card = document.getElementById("tips-card");
    if (!card || card._folded) return;
    var head = card.querySelector("h3");
    if (!head) return;
    card._folded = true;
    card.setAttribute("data-open", "0");
    /* A BUTTON IN EVERYTHING BUT NAME. A plain heading is not something iOS
       treats as pressable, and on a phone where `cursor` is switched off it
       had nothing else to say so. The role and tabindex make it a control,
       and the toggle answers `touchend` directly as well as `click`, with
       the synthetic click after a touch ignored so one tap is one toggle. */
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-expanded", "false");
    var lastTouch = 0;
    function toggle() {
      var open = card.getAttribute("data-open") !== "1";
      card.setAttribute("data-open", open ? "1" : "0");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    }
    head.addEventListener("touchend", function (e) {
      lastTouch = Date.now();
      e.preventDefault();
      toggle();
    }, { passive: false });
    head.addEventListener("click", function () {
      if (Date.now() - lastTouch < 700) return;
      toggle();
    });
    head.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  }
  /* The gardens build their card from a p5 sketch that starts well after this
     file runs, so it is looked for a few times rather than once. */
  function watchTips() {
    var tries = 0;
    var t = setInterval(function () {
      wireTips();
      if (++tries > 40 || document.getElementById("tips-card")) clearInterval(t);
    }, 250);
  }
  if (document.body) watchTips();
  else document.addEventListener("DOMContentLoaded", watchTips);

  /* ------------------------------------------- the icons get out of the way */
  /* On a PHONE the four round icons are fixed over a page whose copy runs the
     full width, so a section title passes underneath them on the way past and
     is cut in half while it does. On a wide screen this never happens, because
     the content is narrower than the window and the corner is empty.

     Padding the copy away from them was the other option and it is worse: the
     overlap only exists for the second or two a title is level with them, and
     the fix would cost every phone screen 90px of width for ever.

     So they fade while the page is actually moving and come back 550ms after
     it stops. Scrolling is when you are reading the page rather than reaching
     for a control, which is exactly when they are not wanted. */
  var SCROLL_HIDE =
    "@media (max-width: 768px){" +
      "#gg-music,#ga-friends-btn,#gj-btn,#save-btn{" +
        "transition:opacity .2s ease,visibility 0s linear 0s;}" +
      "html[data-gg-scrolling=\"1\"] #gg-music," +
      "html[data-gg-scrolling=\"1\"] #ga-friends-btn," +
      "html[data-gg-scrolling=\"1\"] #gj-btn," +
      "html[data-gg-scrolling=\"1\"] #save-btn{" +
        "opacity:0;pointer-events:none;}}" +
    "@media (prefers-reduced-motion:reduce){" +
      "html[data-gg-scrolling=\"1\"] #gg-music," +
      "html[data-gg-scrolling=\"1\"] #ga-friends-btn," +
      "html[data-gg-scrolling=\"1\"] #gj-btn," +
      "html[data-gg-scrolling=\"1\"] #save-btn{transition:none;}}";

  var scrollTimer = null;
  function watchScroll() {
    var root = document.documentElement;
    window.addEventListener("scroll", function () {
      /* Only where the rule above can fire. A garden does not scroll at all,
         so this costs those pages nothing either way. */
      if (window.innerWidth > 768) return;
      root.setAttribute("data-gg-scrolling", "1");
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        root.removeAttribute("data-gg-scrolling");
      }, 550);
    }, { passive: true });
  }
  if (document.body) watchScroll();
  else document.addEventListener("DOMContentLoaded", watchScroll);

  var tag = null;
  /* Both states take the hue now. The rose is the one you actually look at,
     so in the personal garden it is the rose that should carry the colour of
     the flower planted most recently; leaving it fixed and tinting only the
     little sparkle would have put the personal touch on the half nobody
     studies. */
  function apply(hue) {
    if (!tag) {
      tag = document.getElementById(STYLE_ID);
      if (!tag) {
        tag = document.createElement("style");
        tag.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(tag);
      }
    }
    tag.textContent = css(hue) + TIP + SCROLL_HIDE + TIPS + HOME;
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
