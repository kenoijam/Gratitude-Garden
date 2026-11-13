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

  /* THE GUARD MOVED DOWN TO `boot()`, and that is a real dependency rather
     than tidiness. The "Fertilizer of the day" band on the landing page reads
     `GardenGuide.fertilizer()` so the band and the bubble can never show
     different days, and returning here left that export unmade whenever the
     drawing was missing. The LIST does not need a mascot; only the figure
     does. */

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
  /* ─────────────────────────────────────── IT FLIES DOWN THE PAGE WITH YOU
     `spot` is [SIDE, BOTTOM]: which edge it rests against and how far up from
     the foot of the window, both in the VIEWPORT, since the element is fixed.

     IT ALTERNATES SIDES, which is what reads as flying down a page rather
     than as a badge in a corner changing its words. The heights vary with it
     so the path is not a straight zigzag.

     THE LEFT EDGE IS ONLY FREE LOW DOWN. The side nav is a vertical column of
     48px circles at `left: 14` above 1100px, CENTRED vertically, so its
     lowest button sits around the middle of the window and anything below
     about 200px from the foot is clear of it. Every left spot here is inside
     that, and every spot was swept with `document.elementFromPoint`. */
  var SAYS = {
    home:    { pose: "welcome", line: null,          /* null: the fertilizer goes here */
               spot: ["right", 18] },
    about:   { pose: "listen",  line: "One small thing a day. That is the whole of it.",
               spot: ["left", 40] },
    gardens: { pose: "welcome", line: "Two places to do it. Pick whichever suits today.",
               spot: ["right", 120] },
    flowers: { pose: "planted", line: "Every flower here stands for something. Yours is chosen for you.",
               spot: ["left", 90] },
    /* THE COMPANION STANDS DOWN ON THIS ONE, and that is a fault caught by
       looking rather than a nicety. The Fertilizer of the day band carries
       its OWN Hortus and its own line, so with the floating one up there were
       two of the same character on screen at once, a few hundred pixels
       apart, saying different things. Two Hortuses is two characters.

       `quiet` hides the column for the length of that section and shows it
       again on the next. It does NOT put it away: `putAway` is the visitor's
       decision and survives the visit, where this is the guide getting out of
       its own way. */
    wisdom:  { pose: "listen",  line: null, quiet: true, spot: ["right", 60] },
    start:   { pose: "planted", line: "Whatever you noticed today is enough. Go and plant it.",
               spot: ["left", 30] }
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
    /* ANCHORED BY BOTH EDGES AND MOVED WITH `left`/`right`, not a transform.
       A transform would be the smoother choice, except the column is also
       where the heart is positioned from and a transformed ancestor would
       drag it along; and `position:fixed` inside a transformed element is a
       trap this project has already recorded twice. The flight is long and
       eased, so the cheaper property is not noticeable. */
    "#gg-guide{position:fixed;right:18px;left:auto;bottom:18px;z-index:240;",
    "display:flex;flex-direction:column;align-items:flex-end;gap:8px;",
    "pointer-events:none;",
    "transition:right .9s cubic-bezier(.33,.9,.35,1),left .9s cubic-bezier(.33,.9,.35,1),",
    "bottom .9s cubic-bezier(.33,.9,.35,1),opacity .5s ease,transform .5s ease;}",

    /* ON THE LEFT THE WHOLE COLUMN FLIPS, bubble and notch together. A panel
       right aligned over a figure on the left points its notch at empty air,
       which is the fault the landing page's own gardener bubble records. */
    "#gg-guide[data-side='left']{align-items:flex-start;}",
    "#gg-guide[data-side='left'] .gg-g-say{padding:12px 14px 12px 32px;}",
    "#gg-guide[data-side='left'] .gg-g-say::after{right:auto;left:26px;}",
    "#gg-guide[data-side='left'] .gg-g-x{right:auto;left:6px;}",
    "#gg-guide[data-side='left'] .gg-g-heart{right:auto;left:38px;}",
    "#gg-guide[hidden]{display:none !important;}",
    /* Hushed is a FADE, not a display change: the column has to keep its box
       so the flight back in animates from where it stood rather than from
       nowhere. `pointer-events:none` is what stops an invisible Hortus
       swallowing a tap on the band behind it. */
    /* `!important` ON THE OPACITY, AND IT IS ORDER RATHER THAN SPECIFICITY.
       `#gg-guide[data-in='1']{opacity:1}` is declared further down this same
       string and carries the identical weight, one id and one attribute, so
       at equal specificity the LATER rule wins and this one did nothing: the
       flag was set, the measurement said hushed, and the figure was plainly
       still there at 100%. Sixth time this project has been caught by a rule
       written above the one it was meant to beat. */
    "#gg-guide[data-hushed='1']{opacity:0 !important;pointer-events:none;}",
    "#gg-guide[data-hushed='1'] *{pointer-events:none !important;}",

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
    "filter:drop-shadow(0 8px 18px rgba(29,100,102,0.20));",
    "transition:transform .3s cubic-bezier(.22,.9,.3,1);}",
    ".gg-g-me:hover{transform:translateY(-6px) scale(1.06);}",
    ".gg-g-me:active{transform:translateY(-2px) scale(0.98);}",
    ".gg-g-me svg{display:block;}",

    /* ─────────────────────────────────────────── IT IS ALIVE, NOT A STICKER
       NOTHING ON THIS PAGE IS STILL except a sticker, which is what a mascot
       that never moves reads as. The clouds drift, the hero flowers sway, the
       birds cross and the butterflies fly; a character pinned in the corner
       at a fixed pose was the one motionless thing on screen and it showed.

       ALL OF IT IS CSS ON HOOKS THE DRAWING PROVIDES, never a redraw. The
       figure is rebuilt as a string whenever the pose changes, so anything
       animated here would otherwise mean regenerating the whole SVG every
       frame.

       THE TWO PERIODS ARE DELIBERATELY COPRIME-ISH, 2.6s against 3.4s, so the
       flap and the breath drift against each other and never lock into one
       beat. That is the rule the hero's own flowers and the landing band's
       gardeners already follow: things that rise and fall together read as
       the page tilting rather than as several living things. */
    "@keyframes gmFlap{0%,100%{transform:scaleX(1);}50%{transform:scaleX(0.86);}}",
    "@keyframes gmBreathe{0%,100%{transform:translateY(0) scale(1);}",
    "50%{transform:translateY(-3px) scale(1.018);}}",

    /* `transform-box:view-box` is what makes `transform-origin` mean viewBox
       units here. Without it the origin is the element's own bounding box and
       the wings shear sideways instead of folding about the body. */
    ".gm-wings{transform-box:view-box;transform-origin:100px 118px;",
    "animation:gmFlap 2.6s ease-in-out infinite;}",
    ".gg-g-me svg{animation:gmBreathe 3.4s ease-in-out infinite;}",

    /* A CSS translate in px on an SVG child is in USER UNITS, so 2.6 here is
       2.6 viewBox units and needs no conversion. */
    ".gm-eyes{transition:transform .22s ease-out;}",

    /* THE HEART RISES OUT OF THE CROWN. Positioned from the FOOT of the
       column, because the mascot sits at the bottom of it and the bubble
       above can be any height; measured from the top it would start from
       wherever the words happened to end. */
    ".gg-g-heart{position:absolute;right:38px;bottom:92px;width:26px;height:26px;",
    "pointer-events:none;opacity:0;transform:translateY(0) scale(0.6);}",
    ".gg-g-heart svg{width:100%;height:100%;display:block;",
    "filter:drop-shadow(0 2px 4px rgba(29,100,102,0.18));}",
    ".gg-g-heart[data-rise='1']{animation:gmHeart 1.3s ease-out forwards;}",
    "@keyframes gmHeart{0%{opacity:0;transform:translateY(0) scale(0.6);}",
    "18%{opacity:1;transform:translateY(-10px) scale(1.05);}",
    "60%{opacity:1;transform:translateY(-34px) scale(1);}",
    "100%{opacity:0;transform:translateY(-58px) scale(0.9);}}",
    "@media (max-width:768px){.gg-g-heart{right:26px;bottom:62px;width:20px;height:20px;}}",

    "@media (prefers-reduced-motion:reduce){",
    ".gm-wings,.gg-g-me svg{animation:none !important;}",
    ".gg-g-heart[data-rise='1']{animation:none !important;opacity:1;transform:translateY(-30px);}",
    ".gm-eyes{transition:none !important;}}",

    /* It arrives rather than appearing, once, and never again. */
    "#gg-guide{opacity:0;transform:translateY(14px);",
    "transition:opacity .5s ease,transform .5s ease;}",
    "#gg-guide[data-in='1']{opacity:1;transform:translateY(0);}",

    /* A PHONE HAS NO ROOM FOR A 92px COMPANION IN THE CORNER. It comes down to
       62 and the bubble is capped against the screen rather than a fixed
       width, so a long line wraps instead of running off. */
    /* A PHONE HAS NO ROOM TO FLY. 375 wide with a 90px figure and a bubble
       beside it is the whole screen, so it stays in one corner and only the
       words change. The `!important` is against the inline left/right/bottom
       the flight writes. */
    "@media (max-width:768px){",
    "#gg-guide{right:12px !important;left:auto !important;bottom:12px !important;gap:6px;",
    "align-items:flex-end !important;}",
    "#gg-guide .gg-g-say{padding:10px 30px 10px 12px !important;}",
    "#gg-guide .gg-g-say::after{right:26px !important;left:auto !important;}",
    "#gg-guide .gg-g-x{right:6px !important;left:auto !important;}",
    ".gg-g-say{max-width:min(72vw,240px);font-size:12.5px;}}",

    /* No cursor rule: `button` is already in garden-cursor.js's clickable
       list, and a rule here would lose to it anyway since every rule that
       file writes carries !important. */
    "@media (prefers-reduced-motion: reduce){",
    "#gg-guide,.gg-g-say,.gg-g-me{transition:none !important;}}"
  ].join("");

  /* ───────────────────────────────────────────────────────────────── the build */
  var root = null, bubble = null, me = null, holdT = 0, current = "";
  var reactT = 0;
  var look = { x: 0, y: 0, live: false, lx: 0, ly: 0 };

  /* HOW FAR AN EYE MAY TRAVEL, in viewBox units. The eye is a circle of
     radius 5.4 sitting on a face about 100 units across, so 2.6 is about half
     an eye's width: enough to read as a glance and nowhere near enough to
     look like the eyes are sliding off. Pushed further it stops being a look
     and becomes a squint. */
  var GAZE = 2.6;

  function aimEyes() {
    if (!me) return;
    var g = me.querySelector(".gm-eyes");
    if (!g) return;
    var dx = 0, dy = 0;
    if (look.live) {
      var r = me.getBoundingClientRect();
      if (r.width) {
        var cx = r.left + r.width / 2;
        /* The eyes sit at y 112 of a 200 unit box, which is above the middle,
           so the gaze is measured from THERE rather than from the centre of
           the figure. Measured from the middle it looked down at everything. */
        var cy = r.top + r.height * (112 / 200);
        var vx = look.x - cx, vy = look.y - cy;
        var d = Math.sqrt(vx * vx + vy * vy) || 1;
        /* Normalised, then eased in over the first 260 pixels so a pointer
           right beside it does not slam the eyes to full deflection. */
        var k = Math.min(1, d / 260);
        dx = (vx / d) * GAZE * k;
        dy = (vy / d) * GAZE * k * 0.75;   /* less vertical: a face has less room up and down */
      }
    }
    if (Math.abs(dx - look.lx) < 0.1 && Math.abs(dy - look.ly) < 0.1) return;
    look.lx = dx; look.ly = dy;
    g.style.transform = "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px)";
  }

  /* ─────────────────────────────────────────────────────── A HEAD PAT
     THE GESTURE IS THE PROJECT'S OWN, NOT A NEW ONE. Both gardens and the
     avatar studio already answer a press on the gardener with `AvatarDraw`'s
     pat: one eye winks and a heart rises out of the crown. Hortus takes the
     same, so there is one grammar for "you touched me" rather than two.

     THE HEART IS A SEPARATE ELEMENT, NOT PART OF THE FIGURE, and that is what
     lets a second pat fire straight away. Inside the SVG it would be redrawn
     with the pose and its animation would restart from wherever the string
     rebuild happened to leave it; outside, the old one is simply thrown away
     and a new one begins.

     IT LEAVES THE TOP OF THE HEAD, never the middle of the face, because the
     antennae and their flowers are up there and anything rising from the face
     would be rising out of the flower. Same reasoning `AvatarDraw` records. */
  function heart() {
    var h = document.createElement("div");
    h.className = "gg-g-heart";
    h.innerHTML =
      "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M12 21s-8-5.1-8-10.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 3.8C20 15.9 12 21 12 21z' fill='#f4a0ad'/></svg>";
    root.appendChild(h);
    /* A forced reflow before the class, or the browser coalesces the two and
       it simply appears at the end of its own path. */
    void h.offsetWidth;
    h.setAttribute("data-rise", "1");
    setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 1300);
  }

  /* A BEAT OF DELIGHT, then back to whatever the section was saying. It is
     deliberately SHORTER than the bubble's own hold, so the face settles
     while the words are still readable rather than the two ending together
     and the whole thing going quiet at once. 1100ms is `AvatarDraw`'s own pat
     length, so a pat lasts the same here as it does on a gardener. */
  function react() {
    setPose("pat");
    heart();
    clearTimeout(reactT);
    reactT = setTimeout(function () {
      var e = SAYS[current];
      setPose(e ? e.pose : "welcome");
    }, 1100);
  }

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

    /* TAPPING IT DOES SOMETHING VISIBLE, which it did not before. It repeated
       the line, and if the bubble was already up that is a press with no
       answer at all, so the character read as inert. It now BEAMS and throws
       the project's own four pointed sparkle for a beat, which is the
       `planted` pose, and then goes back to whatever the section was. */
    me.addEventListener("click", function () {
      if (current) say(current, true);
      react();
    });

    /* ─────────────────────────────────────── RUBBING ITS HEAD PATS IT
       A TAP ALREADY PATS, and this is the gesture people actually make at a
       small round creature on a screen: the pointer goes back and forth over
       it. Counting DIRECTION CHANGES is what distinguishes a rub from simply
       crossing the figure on the way somewhere else, which a distance or a
       dwell test cannot: moving 300px straight across it is a lot of travel
       and not a rub, where three reversals in under a second is nothing else.

       THREE REVERSALS, NOT TWO. Two fire on an ordinary wobble of the hand
       while reading the bubble, which pats it at random; three needs intent.
       The count resets after 700ms of no reversal, so a slow browse never
       accumulates one over a minute.

       AND IT COOLS DOWN FOR THE LENGTH OF THE PAT, or a rub that carries on
       re-fires `react` every few frames and the wink never finishes. */
    var rub = { dir: 0, flips: 0, at: 0, until: 0 };
    me.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var now = Date.now();
      if (now < rub.until) return;
      if (now - rub.at > 700) rub.flips = 0;
      var d = e.movementX > 1 ? 1 : (e.movementX < -1 ? -1 : 0);
      if (!d) return;
      if (rub.dir && d !== rub.dir) { rub.flips++; rub.at = now; }
      rub.dir = d;
      if (rub.flips >= 3) {
        rub.flips = 0;
        rub.until = now + 1100;      /* the pat's own length */
        react();
      }
    }, { passive: true });

    /* IT WATCHES THE POINTER. One document level listener rather than one per
       element, passive so it can never hold up a scroll, and it only writes a
       transform when the eyes have actually moved by a tenth of a unit, so a
       pointer drifting across the page does not set a style sixty times a
       second for a picture that has not changed. */
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;   /* a finger is not a gaze */
      look.x = e.clientX; look.y = e.clientY; look.live = true;
      aimEyes();
    }, { passive: true });
    document.addEventListener("pointerleave", function () { look.live = false; aimEyes(); });
  }

  var pose = "welcome";

  /* ONE PLACE DECIDES WHERE IT IS. Writes the inline anchors and the side
     flag together, so the bubble and the notch can never disagree with the
     figure about which edge it is on. Under 768 it does nothing at all: the
     stylesheet pins it there with `!important` and a flight written on top
     would be dead inline style fighting a rule it cannot beat. */
  function moveTo(spot) {
    if (!root || !spot || window.innerWidth <= 768) return;
    var side = spot[0], up = spot[1];
    root.setAttribute("data-side", side);
    if (side === "left") {
      root.style.left = "18px"; root.style.right = "auto";
      /* THE LEFT EDGE IS THE SIDE NAV'S LANE AND THE CLEARANCE IS MEASURED,
         NOT GUESSED. That rail is a vertical column of 48px circles at
         `left: 14` above 1100px, CENTRED, so how far down the window its last
         button reaches depends on the window's own height: a hand tuned
         `bottom` that clears it at 900 sits on top of it at 1100. A sweep
         with `document.elementFromPoint` caught exactly that at the flower
         guide, where the figure landed on a `.side-nav-item`.

         So the requested height is CLAMPED to whatever leaves the figure's
         top below the rail's last button. If a spot cannot clear it at all,
         which can only happen in a very short window, it goes to the right
         instead rather than sitting on a control. */
      /* `offsetParent` IS NULL FOR A `position:fixed` ELEMENT, so the usual
         "is it on screen" test reports a visible side nav as hidden and the
         clamp below never fires. That is exactly what happened: the sweep
         still found the rail under the figure after this clamp was added.
         Measure the RECT and read `display` instead. */
      var nav = document.querySelector(".side-nav");
      var nr = nav && nav.getBoundingClientRect();
      if (nav && nr && nr.height > 0 && getComputedStyle(nav).display !== "none") {
        var nb = nr.bottom;
        var h = root.offsetHeight || 220;
        var maxUp = window.innerHeight - nb - 12 - h;
        if (maxUp < 0) {
          root.setAttribute("data-side", "right");
          root.style.right = "18px"; root.style.left = "auto";
        } else if (up > maxUp) {
          up = Math.max(12, maxUp);
        }
      }
    } else { root.style.right = "18px"; root.style.left = "auto"; }
    root.style.bottom = up + "px";
  }

  function setPose(p) {
    pose = p || pose;
    /* 140 AND 90, UP FROM 92 AND 62. At the old size it weighed the same as
       the ambient butterflies `garden-life.js` flies across the hero, so it
       read as a third piece of scenery rather than as somebody talking to
       you. Half as large again is what separates a character from the life
       around it. */
    me.innerHTML = window.GardenMascot.svg(pose, window.innerWidth <= 768 ? 90 : 140);
    aimEyes();
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
    /* `root` IS NULL WHENEVER THE GUIDE WAS NEVER BUILT, which is every visit
       where it has been put away for the session: `boot()` returns before
       `build()` and this listener is registered at module level, so it runs
       regardless. Without this guard a resize after dismissing it threw on
       `root.removeAttribute`. Found in the console on another page, because
       this pane's buffer survives navigation. */
    if (!root) return;
    if (me) setPose(pose);
    /* COMING BACK OVER 768 HAS TO PUT IT WHERE THE SECTION SAYS, and going
       under it has to CLEAR the inline anchors, or a left spot written on a
       laptop would sit in the phone rule's way as dead inline style. */
    if (window.innerWidth <= 768) {
      root.removeAttribute("data-side");
      root.style.left = root.style.right = root.style.bottom = "";
    } else if (SAYS[current]) {
      moveTo(SAYS[current].spot);
    }
  });

  function say(id, again) {
    var e = SAYS[id];
    if (!e) return;
    current = id;
    /* Hushed sections hide the column outright rather than speaking. */
    if (e.quiet) { root.setAttribute("data-hushed", "1"); clearTimeout(holdT); return; }
    root.removeAttribute("data-hushed");

    moveTo(e.spot);
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
    if (e.line === null && !met()) {
      words = "Hello, I am " + NAME + "! Your companion through the garden. " + words;
      meet();
    }
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
    if (!window.GardenMascot) return;      /* no drawing, no figure to build */
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
