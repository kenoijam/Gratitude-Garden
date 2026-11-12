/* ═══════════════════════════════════════════════════════════════════════════
   THE MASCOT WALKS DOWN THE PAGE WITH YOU, v2 only.
   (The mascot is a BUTTERFLY. `garden-mascot.js` draws it.)

   WHAT THIS REPLACED. The plan before it was to rewrite every section's copy
   so the page told one story as you scrolled. A character saying the line is
   the same idea with two things the rewrite could not have: somebody is
   SAYING it rather than the page describing itself, which is the whole
   argument the letter already rests on, and it leaves the sections' own words
   alone so the before and the after differ by a feature rather than by a
   hundred small edits nobody can point at in an interview.

   IT SAYS ONE THING PER SECTION AND THEN STOPS. A companion that talks while
   you read is the thing everybody closes. It speaks on arrival at a section,
   holds for long enough to be read, and goes quiet until the next one.

   THE FIRST LINE IS THE FERTILIZER OF THE DAY. Encouragement rather than a
   tip about gratitude, which is deliberate: the Wisdom section already gives
   advice about the practice, so advice was the one thing already covered.
   What nothing on this site says is the thing the perched gardeners were
   written for, that you are doing all right.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  if (!window.GardenMascot) return;        /* no drawing, no guide */

  var SEEN_KEY = "gg_guide_off";           /* sessionStorage: put away for this visit */
  var MET_KEY  = "gg_met_hortus";          /* localStorage: has it introduced itself */

  /* ────────────────────────────────────────────────────────────── THE NAME
     HORTUS, Latin for garden. It names the PLACE rather than the creature,
     which is why it beat the butterfly words: a mascot called Butterfly is a
     label, and this one is the garden itself come to meet you. It is also
     short, has no English homonym to trip over, and a tester can say it out
     loud in an interview without asking how.

     ONE CONSTANT, read everywhere, so renaming is this line. */
  var NAME = "Hortus";

  /* ═══════════════════════════════════════════════════ THE FERTILIZER OF THE DAY
     ╔═══════════════════════════════════════════════════════════════════════╗
     ║  KENISHA: THIS LIST IS YOURS TO FILL. Everything below works already; ║
     ║  it just needs your words in it.                                      ║
     ║                                                                       ║
     ║  One line a day, in order, rotating forever. Add as many as you like  ║
     ║  and the rotation gets longer on its own: with 30 in here a visitor   ║
     ║  sees a different one every day for a month.                          ║
     ║                                                                       ║
     ║  What works in this slot: encouragement, said to one person, short    ║
     ║  enough to read without stopping. "You are not alone!" is exactly the ║
     ║  shape. What does NOT belong here is advice about how to be grateful, ║
     ║  because the Wisdom section already does that and this would be the   ║
     ║  same thing said twice.                                               ║
     ║                                                                       ║
     ║  Keep each one under about 90 characters or the bubble grows past two ║
     ║  lines on a phone.                                                    ║
     ╚═══════════════════════════════════════════════════════════════════════╝ */
  var FERTILIZER = [
    /* PLACEHOLDERS. Three, so the rotation can be demonstrated. Replace them. */
    "You are not alone!",
    "Whatever today looked like, you showed up for it.",
    "Small things count. They are most of a life."
  ];

  /* The SAME line all day for everybody, and a different one tomorrow. Driven
     by the date rather than by a random pick, so two people comparing notes
     are comparing the same day, and so a reload is not a reroll. */
  function today() {
    var d = new Date();
    var days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return FERTILIZER[((days % FERTILIZER.length) + FERTILIZER.length) % FERTILIZER.length];
  }

  /* ════════════════════════════════════════════════════ WHAT IT SAYS AND WHERE
     Keyed on the section ids `index.html` already carries. A section that is
     not in here simply gets nothing said about it, which is how a section
     added later costs nothing.

     `hard` and `bye` are NOT used on this page on purpose. They belong where
     somebody is actually having a day: a hard day in the personal garden's
     writing step, and a goodbye when a flower has been planted. Spending them
     on a marketing section would leave nothing for the moments that need
     them. */
  var SAYS = {
    home:    { pose: "welcome", line: null },       /* null: the fertilizer goes here */
    about:   { pose: "listen",  line: "One small thing a day. That is the whole of it." },
    gardens: { pose: "welcome", line: "Two places to do it. Pick whichever suits today." },
    flowers: { pose: "planted", line: "Every flower here stands for something. Yours is chosen for you." },
    wisdom:  { pose: "listen",  line: "No streaks, no catching up. Miss a day and the garden waits." },
    start:   { pose: "planted", line: "Whatever you noticed today is enough. Go and plant it." }
  };

  var HOLD = 7000;        /* how long a line stays up before it goes quiet */
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────────────────────────────────────────────────────────────── the look */
  var CSS = [
    /* 240 is measured, not picked. Section content tops out at 5 and the page
       dust is at 6, so this clears the page; the music button is 260, the
       flower modal 300, the side nav 9000 and the letter 9500, so it goes
       under every one of those rather than over them. */
    "#gg-guide{position:fixed;right:18px;bottom:18px;z-index:240;",
    "display:flex;flex-direction:column;align-items:flex-end;gap:8px;",
    "pointer-events:none;}",
    "#gg-guide[hidden]{display:none !important;}",

    /* THE BUBBLE TAKES POINTER EVENTS BACK FOR ITSELF. The column is
       transparent to the pointer so it can never swallow a tap meant for the
       page underneath it, which is the rule `#daily-note` already follows in
       the shared garden. */
    ".gg-g-say{pointer-events:auto;position:relative;max-width:260px;",
    "background:#fffdf7;border-radius:14px;padding:12px 32px 12px 14px;",
    "box-shadow:0 10px 30px rgba(29,100,102,0.16);",
    "font-family:Arial,Helvetica,sans-serif;font-size:13.5px;line-height:1.5;",
    "color:#2f6260;opacity:0;transform:translateY(6px);",
    "transition:opacity .34s ease,transform .34s ease;}",
    ".gg-g-say[data-on='1']{opacity:1;transform:translateY(0);}",

    /* THE NOTCH IS TWO ROTATED SQUARES, not one. A single bordered square
       shows its own lower edges through the panel it is meant to be part of.
       Same fix the music hint and the gardener's bubble both carry. */
    ".gg-g-say::after{content:'';position:absolute;right:26px;bottom:-5px;",
    "width:12px;height:12px;background:#fffdf7;transform:rotate(45deg);",
    "border-radius:2px;}",

    ".gg-g-x{position:absolute;top:6px;right:6px;width:22px;height:22px;",
    "border:none;background:none;padding:0;color:#8fb6b0;font-size:15px;",
    "line-height:1;border-radius:50%;}",
    ".gg-g-x:hover{color:#1d6466;background:#eef7f4;}",

    ".gg-g-me{pointer-events:auto;border:none;background:none;padding:0;",
    "line-height:0;display:block;",
    "filter:drop-shadow(0 6px 14px rgba(29,100,102,0.18));",
    "transition:transform .3s cubic-bezier(.22,.9,.3,1);}",
    ".gg-g-me:hover{transform:translateY(-4px);}",
    ".gg-g-me svg{display:block;}",

    /* It arrives rather than appearing, once, and never again. */
    "#gg-guide{opacity:0;transform:translateY(14px);",
    "transition:opacity .5s ease,transform .5s ease;}",
    "#gg-guide[data-in='1']{opacity:1;transform:translateY(0);}",

    /* A PHONE HAS NO ROOM FOR A 92px COMPANION IN THE CORNER. It comes down to
       62 and the bubble is capped against the screen rather than a fixed
       width, so a long line wraps instead of running off. */
    "@media (max-width:768px){#gg-guide{right:12px;bottom:12px;gap:6px;}",
    ".gg-g-say{max-width:min(72vw,240px);font-size:12.5px;padding:10px 30px 10px 12px;}}",

    /* No cursor rule: `button` is already in garden-cursor.js's clickable
       list, and a rule here would lose to it anyway since every rule that
       file writes carries !important. */
    "@media (prefers-reduced-motion: reduce){",
    "#gg-guide,.gg-g-say,.gg-g-me{transition:none !important;}}"
  ].join("");

  /* ───────────────────────────────────────────────────────────────── the build */
  var root = null, bubble = null, me = null, holdT = 0, current = "";

  function met() {
    try { return localStorage.getItem(MET_KEY) === "1"; } catch (e) { return true; }
  }
  function meet() {
    try { localStorage.setItem(MET_KEY, "1"); } catch (e) {}
  }
  function off() {
    try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
  }
  function putAway() {
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
    if (root) root.hidden = true;
  }

  function build() {
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    root = document.createElement("div");
    root.id = "gg-guide";
    root.innerHTML =
      "<div class='gg-g-say' role='status' aria-live='polite'>" +
        "<button class='gg-g-x' type='button' aria-label='Hide " + NAME + "'>&#215;</button>" +
        "<span class='gg-g-text'></span>" +
      "</div>" +
      "<button class='gg-g-me' type='button' aria-label='" + NAME + ", say that again'></button>";
    document.body.appendChild(root);

    bubble = root.querySelector(".gg-g-say");
    me = root.querySelector(".gg-g-me");
    me.innerHTML = window.GardenMascot.svg("welcome", 92);

    root.querySelector(".gg-g-x").addEventListener("click", putAway);
    /* Tapping the mascot says the current section's line again. A companion
       you cannot ask to repeat itself is one you have to catch first time. */
    me.addEventListener("click", function () { if (current) say(current, true); });
  }

  var pose = "welcome";

  function setPose(p) {
    pose = p || pose;
    me.innerHTML = window.GardenMascot.svg(pose, window.innerWidth <= 768 ? 62 : 92);
  }

  /* A WIDTH CHANGE ONLY, never any resize. The size is chosen when the figure
     is drawn, so without this a phone turned on its side keeps whichever size
     it had when it last spoke. And it has to ignore height: iOS collapses its
     address bar as you scroll, which fires a resize, and redrawing the mascot
     for a scroll is work for a picture that has not changed. Same rule the
     landing page's own resize handler already follows. */
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    if (me) setPose(pose);
  });

  function say(id, again) {
    var e = SAYS[id];
    if (!e) return;
    current = id;
    var words = e.line === null ? today() : e.line;

    /* IT SAYS ITS NAME ONCE, EVER, AND THEN NEVER AGAIN. A character that
       introduces itself every visit is a character that has not remembered
       you, which is the opposite of what a companion is for. It rides on the
       FRONT of the day's line rather than taking a bubble of its own: two
       bubbles in a row the moment somebody arrives is the crowding the letter
       already waits to avoid.

       `localStorage`, not `sessionStorage`, for the same reason the letter
       uses it: meeting somebody is not a thing that happens again next week.
       The guide's own put-away flag stays in `sessionStorage`, because that
       IS about this visit. */
    if (e.line === null && !met()) { words = "Hello, I am " + NAME + ". " + words; meet(); }
    root.querySelector(".gg-g-text").textContent = words;
    setPose(e.pose);

    /* A FORCED REFLOW between hiding and showing, or the browser coalesces the
       two and a repeat of the same line does not animate at all. The wiggling
       words and the letter both carry this. */
    if (again) { bubble.removeAttribute("data-on"); void bubble.offsetWidth; }
    bubble.setAttribute("data-on", "1");

    clearTimeout(holdT);
    holdT = setTimeout(function () { bubble.removeAttribute("data-on"); }, HOLD);
  }

  /* THE LETTER COMES FIRST AND THIS WAITS FOR IT. Two things talking to
     somebody the moment they arrive is exactly what the letter was written to
     avoid rather than cause. The letter sits at z-index 9500 so it would win
     anyway; what matters is that the mascot is not talking underneath it.

     ASK THE MODULE, NEVER THE DOM, and that is a bug fixed rather than a
     preference. The first version looked for `#gg-letter` and on a first
     visit there is no such element yet: `garden-letter.js` builds it only
     once the loader has cleared, several hundred milliseconds after this
     runs. So it found nothing, concluded no letter was coming, and said its
     line underneath the one that then appeared. `pending()` is the state the
     DOM cannot report. */
  function letterBusy() {
    var L = window.GardenLetter;
    if (!L) return false;
    if (L.pending && L.pending()) return true;      /* one may still be on its way */
    return !!(L.showing && L.showing());            /* or one is up right now */
  }

  function watch() {
    if (!("IntersectionObserver" in window)) { say("home"); return; }
    var io = new IntersectionObserver(function (es) {
      /* Several sections can be intersecting at once on a fast scroll. The one
         that counts is whichever covers the MIDDLE of the screen, not whichever
         the callback happened to list first. */
      var mid = window.innerHeight / 2, pick = null;
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        var r = x.target.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) pick = x.target.id;
      });
      if (pick && pick !== current) say(pick);
    }, { threshold: [0, 0.25, 0.5] });

    Object.keys(SAYS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  function boot() {
    if (off()) return;
    build();
    /* The loader holds a flower over the sky for up to nine seconds and the
       letter may follow it, so this waits for a clear stage rather than
       arriving into one. Polled, because neither of those fires an event. */
    var tries = 0;
    (function wait() {
      var loading = window.GardenLoader && window.GardenLoader.showing &&
                    window.GardenLoader.showing();
      /* 200 tries at 150ms is a 30 second cap. It exists because a guide that
         can outlive its own wait is worse than one that arrives late: if
         anything it waits on never resolves, it comes anyway. */
      if ((loading || letterBusy()) && tries++ < 200) { setTimeout(wait, 150); return; }
      root.setAttribute("data-in", "1");
      say("home");
      watch();
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }

  window.GardenGuide = {
    say: say,
    putAway: putAway,
    fertilizer: today,
    name: NAME,
    reset: function () {
      try { sessionStorage.removeItem(SEEN_KEY); localStorage.removeItem(MET_KEY); } catch (e) {}
    }
  };
})();
