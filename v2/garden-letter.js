/* garden-letter.js  --  the note that is here the first time you are

   WHY A LETTER AT ALL. Every other thing on the landing page describes what
   this site DOES. None of them says why anybody made it, and that is the
   part that cannot be worked out from a screenshot: noticing one small thing
   a day changes how the rest of the day reads, and the whole site is one
   long argument for trying it. A line of body copy saying so would be read
   as marketing. A letter, signed, is read as somebody talking.

   ONE COPY, AT THE ROOT, like `garden-music.js`, `garden-cursor.js` and
   `garden-loader.js`. Only `index.html` loads it today, because the front
   door is the only place a first hello belongs, but it is written so another
   page could carry it with one tag rather than a second copy of the words.

   IT WAITS FOR THE LOADER. `garden-loader.js` puts a flower over the sky for
   up to nine seconds, and two cards stacked on a first visit is the thing
   this is meant to avoid rather than cause. `GardenLoader.showing()` is the
   only honest way to tell, since the loader hides on whichever of three
   things happens first.

   `localStorage`, NOT `sessionStorage`, and that is the difference between
   this and the music hint. The hint is about the music that is playing right
   now, so it comes back next visit; this is about meeting somebody once.

   AND THERE IS A WAY BACK TO IT. A letter you can never show again is a
   letter that cannot be demonstrated, read twice, or shown to the one person
   it was written for. The footer carries a link. */
(function () {
  "use strict";

  var KEY = "gg_letter";
  var tag = document.currentScript;      /* valid only while this file parses */

  /* ------------------------------------------------------------- the words
     Kept here rather than in the markup so there is one copy of them and the
     footer's "read it again" opens the very same card. */
  /* THESE ARE THE AUTHOR'S OWN WORDS AND ONLY SHE MAY CHANGE THEM. The whole
     argument for a letter rather than a paragraph is that it is somebody
     talking rather than a page describing itself, and a letter edited by
     anybody else is a page describing itself again.

     SHORTENED ONCE, BY THE AUTHOR'S OWN INSTRUCTION, AND BY CUTTING RATHER
     THAN REWRITING. It ran to about 150 words over four paragraphs and now
     runs to about 85 over three: the comparison and the concrete list she
     wrote (waking up, good food, amazing people) are the heart of it and
     stayed; what went was the second half of the opening sentence and the
     longer description of the two gardens, which the page itself says again
     a screen further down. Her phrasing is otherwise untouched. */
  var LETTER = {
    hello: "Hello there!",
    lines: [
      "I used to compare myself with others all the time, wanting what I didn't have. Then I realized how much there was to appreciate in my own life: waking up every day, good food, amazing people.",
      "So I made Gratitude Garden, a space to reflect, appreciate and share. A little garden of your own to end your days with gratitude, and a shared one to see what other people are grateful for.",
      "Gratitude gets you a long way, and whatever you noticed today is enough!"
    ],
    sign: "Kenisha",
    go: "Come in"
  };

  /* --------------------------------------------------------------- the art
     Inline SVG rather than one of the eight. The eight are drawn by code
     that lives in the sketches, and the point of this card is that it is on
     screen before anything heavy has loaded; a letter that waits for a
     flower renderer is a letter nobody reads. It is also honest about being
     a drawing rather than claiming to be a species. */
  var BLOOM =
    '<svg class="gl-bloom" viewBox="0 0 120 120" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M60 74C60 62 57 54 60 42" stroke="#429288" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M58.6 66C50 68 44 63.5 43 57C50.6 56 56.8 59.4 58.6 66Z" fill="#b7e4e7" stroke="#429288" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M61.4 58C70 60 76 55.6 77 49C69.4 48 63.2 51.4 61.4 58Z" fill="#b7e4e7" stroke="#429288" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<g stroke="#429288" stroke-width="2.6" stroke-linejoin="round">' +
    '<ellipse cx="60" cy="24" rx="9.5" ry="13" fill="#fbe484"/>' +
    '<ellipse cx="60" cy="24" rx="9.5" ry="13" fill="#fbe484" transform="rotate(72 60 37)"/>' +
    '<ellipse cx="60" cy="24" rx="9.5" ry="13" fill="#fbe484" transform="rotate(144 60 37)"/>' +
    '<ellipse cx="60" cy="24" rx="9.5" ry="13" fill="#fbe484" transform="rotate(216 60 37)"/>' +
    '<ellipse cx="60" cy="24" rx="9.5" ry="13" fill="#fbe484" transform="rotate(288 60 37)"/>' +
    '</g>' +
    '<circle cx="60" cy="37" r="7" fill="#f4c6c6" stroke="#429288" stroke-width="2.6"/>' +
    '</svg>';

  /* -------------------------------------------------------------- the look
     EVERY RULE SITS ABOVE THE SIDE NAV. That rail is z-index 9000 and runs
     down the left of the page above 1100px, so at the flower modal's 300 or
     the music button's 260 it would paint straight through the card.

     THE CARD IS THE PROJECT'S OWN `.gg-card` TREATMENT, not a dialog: snow
     at radius 18 with the garden's shadow, a Fraunces heading and Arial body
     at the page's own sizes. A letter dressed as a system dialog reads as a
     consent banner, which is the one thing it must not read as. */
  var CSS = [
    "#gg-letter{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;",
    "justify-content:center;padding:24px 16px;overflow-y:auto;",
    "background:rgba(20,73,75,0.34);opacity:0;transition:opacity .42s ease;}",
    "#gg-letter[data-show='1']{opacity:1;}",
    "#gg-letter[hidden]{display:none !important;}",

    ".gl-card{position:relative;width:min(92vw,470px);background:#fffdf7;",
    "border-radius:18px;padding:26px 28px 22px;margin:auto;",
    "box-shadow:0 18px 48px rgba(29,100,102,0.22);text-align:center;",
    "transform:translateY(16px);transition:transform .52s cubic-bezier(.22,.9,.3,1);}",
    "#gg-letter[data-show='1'] .gl-card{transform:none;}",

    ".gl-bloom{width:68px;height:68px;display:block;margin:0 auto 10px;}",

    ".gl-hello{font-family:'Fraunces',Georgia,serif;font-weight:600;",
    "font-variation-settings:'SOFT' 50,'WONK' 0;font-size:26px;color:#1d6466;",
    "margin:0 0 14px;}",

    /* ONE HEADING AND ONE BODY, AND NOTHING ELSE. The card carried FOUR
       type treatments in about four hundred pixels: a 26px Fraunces
       greeting, 14.5px Arial paragraphs, a 17px Fraunces closing line and a
       21px Fraunces italic signature. Two fonts and four sizes on a card
       this small reads as four different voices rather than one person
       talking, which is the one thing a letter cannot afford.

       So: the greeting is the single heading, and EVERYTHING below it is one
       font at one size. The closing line keeps its weight by being the last
       thing said rather than by changing face, and the signature is the body
       in italic and the garden's teal, which is enough to read as a
       signature without being a third treatment. */
    ".gl-card p{font-family:Arial,Helvetica,sans-serif;font-size:15px;",
    "line-height:1.65;color:#2f6260;margin:0 0 13px;}",
    ".gl-card p:last-of-type{margin-bottom:18px;}",

    /* `gl-last` NO LONGER CHANGES THE FACE OR THE SIZE. The class is kept
       because `build()` still writes it and because the closing line may yet
       want a colour of its own; today it takes the deeper teal and nothing
       more. */
    ".gl-card p.gl-last{color:#1d6466;}",

    ".gl-sign{font-family:Arial,Helvetica,sans-serif;font-style:italic;",
    "font-size:15px;color:#429288;margin:0 0 18px;}",

    ".gl-go{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:16px;",
    "width:100%;min-height:48px;border:none;border-radius:999px;background:#26a69a;",
    "color:#fffdf7;transition:background .2s ease;}",
    ".gl-go:hover{background:#1d8e84;}",
    "@media (hover:none){.gl-go:hover{background:#26a69a;}}",

    /* The small way out at the corner. It is a second control doing the same
       thing as the button, which is right here: the button is an invitation
       and this is a dismissal, and somebody who wants the second should not
       have to accept the first. */
    ".gl-x{position:absolute;top:12px;right:12px;width:32px;height:32px;",
    "border:none;border-radius:50%;background:transparent;color:#5a9e8e;",
    "font-size:19px;line-height:1;}",
    ".gl-x:hover{background:#eef6f2;}",

    "@media (max-width:420px){.gl-card{padding:26px 20px 22px;}",
    ".gl-hello{font-size:22px;}}",

    /* The rise is the only motion here, so it is the only thing to opt out
       of; the card itself still arrives. */
    "@media (prefers-reduced-motion:reduce){#gg-letter,.gl-card{transition:none;}",
    ".gl-card{transform:none;}}"
  ].join("");

  var el, lastFocus;

  function seen() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return true; }
  }
  function mark() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }

  function style() {
    if (document.getElementById("gg-letter-css")) return;
    var s = document.createElement("style");
    s.id = "gg-letter-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function build() {
    style();
    el = document.createElement("div");
    el.id = "gg-letter";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "A note from the person who made this");
    el.hidden = true;

    var body = LETTER.lines.map(function (t, i) {
      return "<p" + (i === LETTER.lines.length - 1 ? " class='gl-last'" : "") + ">" + t + "</p>";
    }).join("");

    el.innerHTML =
      "<div class='gl-card'>" +
        "<button class='gl-x' type='button' aria-label='Close'>&#215;</button>" +
        BLOOM +
        "<h2 class='gl-hello'>" + LETTER.hello + "</h2>" +
        body +
        "<p class='gl-sign'>" + LETTER.sign + "</p>" +
        "<button class='gl-go' type='button'>" + LETTER.go + "</button>" +
      "</div>";

    /* A tap on the surround closes, a tap on the card does not. Both buttons
       close. The same four ways out the photo viewer already offers. */
    el.addEventListener("click", function (e) {
      if (e.target === el || e.target.classList.contains("gl-go") ||
          e.target.classList.contains("gl-x")) close();
    });
    document.body.appendChild(el);
  }

  function open() {
    if (!el) build();
    lastFocus = document.activeElement;
    el.hidden = false;
    /* A forced reflow between showing it and asking for the transition, or
       the browser coalesces the two and the card simply appears. The wiggling
       words need the identical trick. */
    void el.offsetWidth;
    el.setAttribute("data-show", "1");
    document.addEventListener("keydown", onKey);
    var go = el.querySelector(".gl-go");
    if (go) go.focus();
  }

  function close() {
    if (!el || el.hidden) return;
    mark();
    el.setAttribute("data-show", "0");
    document.removeEventListener("keydown", onKey);
    setTimeout(function () { if (el) el.hidden = true; }, 440);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  /* --------------------------------------------------------------- arrival
     Not before the loader has gone, and not before the page has drawn, so
     the first thing anybody sees is the garden with a note on it rather than
     a note on nothing. */
  function waitForLoader(then) {
    var tries = 0;
    (function tick() {
      var up = window.GardenLoader && window.GardenLoader.showing &&
               window.GardenLoader.showing();
      if (!up || ++tries > 90) { then(); return; }
      setTimeout(tick, 120);
    })();
  }

  /* ─────────────────────────────────────────── IS A LETTER STILL COMING?
     ANYTHING THAT ARRIVES AFTER THE LETTER HAS TO BE ABLE TO ASK, and before
     this it could not. The mascot guide in v2 looked for `#gg-letter` to
     decide whether to wait, and on a first visit there is no such element
     yet: this module builds it only once the loader has cleared, several
     hundred milliseconds later. So the guide saw no letter, concluded none
     was coming, and started talking underneath the one that then appeared.

     `settled` is false until boot has DECIDED, either way. That is the state
     the DOM cannot report, and it is why asking the element was never going
     to work. Same shape as `GardenLoader.showing()`, and for the same reason:
     there is no event to listen for. */
  var settled = false;

  function boot() {
    if (seen()) { settled = true; return; }
    waitForLoader(function () {
      setTimeout(function () { open(); settled = true; }, 340);
    });
  }

  if (tag && tag.getAttribute("data-letter") === "off") { settled = true; return; }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);

  /* `open` is exported so the footer's link can bring it back, and `reset`
     so it can be seen again from the console while it is being written. */
  window.GardenLetter = {
    open: open,
    close: close,
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    /* Is the card on screen right now. */
    showing: function () { return !!(el && !el.hidden); },
    /* Has this module finished deciding whether to show one. False means
       WAIT: a letter may still be on its way. */
    pending: function () { return !settled; }
  };
})();
