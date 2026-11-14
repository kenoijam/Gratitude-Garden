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
  var TOUR_KEY = "gg_tour_done";           /* localStorage: the first visit tour is over */

  /* ═══════════════════════════════ THE FIRST VISIT IS A TOUR, ONCE AND ONCE ONLY
     The ambient one line per section says something ABOUT each section as you
     happen to arrive at it, which is a companion keeping you company. It does
     not tell a first visitor how any of this works, and the letter cannot:
     the letter says why the project exists, which is the one thing that is
     not on the page, and loading it up with instructions would turn somebody
     talking into a manual.

     SO THE FIRST VISIT IS WALKED, and Hortus does the walking. It scrolls to
     each section in turn and says what that part is for, with one button to
     go on and one to leave. Six steps, which is every section the page has.

     IT WAITS FOR YOU RATHER THAN RUNNING ON A TIMER. A tour that advances
     itself is a slideshow you are chasing; this holds each line until the
     button is pressed, so reading it is the visitor's own pace.

     ONCE, EVER. `localStorage`, like the letter and the introduction, for the
     same reason: being shown round is not a thing that happens again next
     week. `GardenGuide.reset()` clears it along with the rest.

     IT IS SKIPPABLE AT EVERY STEP and the skip is a real button rather than
     the corner cross, because a tour nobody can get out of is the one thing
     worse than no tour.

     THE LINES SAY WHAT A PART IS FOR, never what the section already says in
     its own heading. "This is where you plant" is the tour's job; repeating
     "One practice, two places" at somebody who is looking at those words is
     not. */
  var TOUR = [
    { to: "home",    line: "Hi, I am Hortus! Give me a moment and I will show you round." },
    { to: "wisdom",  line: "I bring one line of encouragement a day. Pat me on this band to read today's." },
    { to: "about",   line: "The whole idea: notice one small thing, and plant it. That is all there is to do here." },
    { to: "gardens", line: "Here are the two places to plant it. One is yours alone, one is shared with everybody." },
    { to: "flowers", line: "Every flower stands for something, and the same eight grow in both gardens." },
    { to: "start",   line: "That is everything! Whatever you noticed today is enough. I will be here as you go." }
  ];

  /* ────────────────────────────────────────────────────────────── THE NAME
     HORTUS, Latin for garden. It names the PLACE rather than the creature,
     which is why it beat the butterfly words: a mascot called Butterfly is a
     label, and this one is the garden itself come to meet you. It is also
     short, has no English homonym to trip over, and a tester can say it out
     loud in an interview without asking how.

     ONE CONSTANT, read everywhere, so renaming is this line. */
  var NAME = "Hortus";

  /* ═══════════════════════════════════════════════ TWO MODES, ONE COMPANION
     `data-guide` on this file's own script tag, the way `garden-music.js` is
     handed a mood on its. "page" is the landing page, driven by scrolling
     past sections; "personal" and "shared" are the gardens, driven by the
     STEP the sketch is on.

     IT IS THE SAME FILE RATHER THAN A SECOND ONE because Hortus has to be one
     character: the name, the introduction, the pat, the gaze, the breathing
     and the bubble are all identical and a second copy of them would drift
     within a session, which is the fault this project pays for in seven
     places already. What differs between the modes is a TABLE OF LINES and
     what drives it, which is about thirty lines. */
  var TAG  = document.currentScript;
  var MODE = (TAG && TAG.getAttribute("data-guide")) || "page";
  var INGARDEN = MODE === "personal" || MODE === "shared";

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
    /* THIS USED TO BE `line: null`, WHICH MEANS "SAY THE DAY'S FERTILIZER",
       AND IT WAS REDUNDANT THE MOMENT THE BAND MOVED. It was written while
       the Fertilizer band sat fifth; the band is SECOND now, so Hortus said
       the day's line in the hero and the band printed the identical sentence
       one section later. The band owns the fertilizer, because a band cannot
       be dismissed, is not skipped on a second visit and is not off on a
       touch screen, which is the whole argument for putting it there. So the
       bubble says the thing a band cannot: hello.

       `line: null` STILL MEANS THE FERTILIZER and the branch in `say` is
       kept, so a section can be handed it again later without rewiring
       anything. Nothing on this page uses it now. */
    home:    { pose: "welcome",
               line: "So glad you came! Wander wherever you like, and I will keep you company.",
               spot: ["right", 150] },
    about:   { pose: "listen",  line: "One small thing a day. That is the whole of it.",
               spot: ["left", 40] },
    gardens: { pose: "welcome", line: "Two places to do it. Pick whichever suits today.",
               spot: ["right", 260] },
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
    wisdom:  { pose: "listen",  line: null, quiet: true, spot: ["right", 300] },
    /* ON THE RIGHT, WHERE IT USED TO BE ON THE LEFT, AND THAT IS THE CLAMP
       FORCING IT. See the note below on why every left spot is the same
       spot: `about`, `flowers` and `start` all asked for 40, 90 and 30 and
       all three were clamped to 12, so the last three steps of the tour
       landed on the identical pixel and the walk stopped reading as a walk.
       The closing card is 820 wide and centred, so the right lane beside it
       is empty; swept clean. */
    /* 220 AND NOT 40, AND THE FOOTER IS WHY. The closing section is only 575
       tall, so at the bottom of the page the FOOTER is already on screen
       under it: measured at 1440 by 900, the footer begins at y 575 and the
       Explore column's `<summary>` runs 715 to 745 across x 746 to 1325,
       which is squarely in the right lane. At 40 the bubble sat on it. The
       column has to keep its lower edge above 715, which is a `bottom` of at
       least 185; 220 leaves the tour's taller column, nav row and all, with
       35px to spare. */
    start:   { pose: "planted", line: "Whatever you noticed today is enough. Go and plant it.",
               spot: ["right", 220] }
  };

  /* ═════════════════ WHY THE HEIGHTS ARE ALL ON THE RIGHT, AND IT IS MEASURED
     The brief was that Hortus should not always sit at the bottom. On the
     RIGHT that is free: nothing is over there but the music and account
     buttons at the very top, so a spot can be anywhere down the window.

     ON THE LEFT IT IS NOT, AND NO VALUE WRITTEN HERE CAN CHANGE IT. The side
     nav is a column of 48px circles CENTRED vertically at `left: 14`, so on a
     900 tall window it runs roughly 300 to 600, and `moveTo` clamps any left
     spot to whatever leaves the figure clear of its last button. Measured at
     1440 by 900: `about` asked for 40, `flowers` for 90 and `start` for 30,
     and every one of the three came back at 12. That is why the three left
     steps of the tour were pixel identical.

     SO VARIETY LIVES ON THE RIGHT. The tour now reads centre, high right, low
     left, mid right, low left, low right, which travels; the left spots keep
     their written values because the clamp is what decides them anyway and a
     shorter window would let them through. */

  /* ─────────────────────────────────────── WHAT IT SAYS IN A GARDEN
     One line per screen, and the lines are DELIBERATELY NOT INSTRUCTIONS.
     Every one of these cards already says what to do in its own heading; a
     companion repeating it is a second voice saying the same thing. What
     these say is that whatever you put is allowed, which is the thing the
     cards cannot say about themselves without sounding anxious.

     THE GARDEN ITSELF IS HUSHED, in both. You came to look at it, and a
     character talking over the thing you came for is the one behaviour that
     would make anybody close it. */
  var GARDEN_SAYS = {
    personal: {
      fork:          { pose: "welcome", line: "Two ways in. Either is fine." },
      pick:          { pose: "welcome", line: "Which one feels like today?" },
      why:           { pose: "listen",  line: "No wrong answer here." },
      prompt1:       { pose: "listen",  line: "However it was, it counts." },
      /* Reached from two places now: before the flower on the write path,
         and after "why that one" on the flower path. The line has to make
         sense in both, so it says nothing about where it sits. */
      prompt2:       { pose: "listen",  line: "Just the biggest thing." },
      prompt3:       { pose: "listen",  line: "As much or as little as you like." },
      prompt4:       { pose: "listen",  line: "Even a small one helps." },
      flowerPreview: { pose: "planted", line: "There it is." },
      /* PRESENT, NOT GONE. See the note on `silent` in `say`. */
      garden:        { pose: "welcome", line: null, silent: true }
    },
    shared: {
      landing:       { pose: "welcome", line: "Everybody here planted one today." },
      username:      { pose: "listen",  line: "Any name you like." },
      select:        { pose: "welcome", line: "Which one feels like today?" },
      confirm:       { pose: "listen",  line: "Your colour, and whether your name goes on it." },
      garden:        { pose: "welcome", line: null, silent: true }
    }
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

    /* ══════════════════════════════════ STEP ONE OF THE TOUR IS CENTRE STAGE
       An introduction delivered from the bottom right corner is a notification.
       For the one step where Hortus is introducing ITSELF rather than pointing
       at something, the column goes to the middle of the screen and the figure
       grows by half, and then it flies off to the corner on Next, which is what
       makes the flight read as a character leaving rather than as a panel
       moving.

       IT IS `left:0;right:0` PLUS `align-items:center`, NEVER A TRANSFORM.
       The column is what the heart is positioned from, and a transformed
       ancestor would drag the heart along with it and become the containing
       block for anything fixed inside; this project has recorded that trap
       twice already. Stretching the column across the viewport and centring
       its children costs nothing and keeps the `left`/`right` transition, so
       the flight out still animates.

       NO VEIL. The letter already dims the page on a first visit and the tour
       starts the moment it closes, so a second dimmed card in a row would read
       as a stack of modals rather than as somebody saying hello. */
    /* THE COLUMN TURNS OVER ON THE STAGE: the figure on top and the bubble
       under it, which is the reverse of the corner. Two reasons, and the
       second is measured. The eye should land on Hortus first, since this is
       the one step that is about Hortus rather than about a section. And the
       hero has NO ROOM: its copy runs 173 to 417 and the meadow starts at
       590, so the clear band is 173px against a column of 328 and something
       is going to be covered whatever is done. Figure first puts the big
       cheerful thing across the headline and the bubble below it over the
       subtitle, where a pale panel of small text is the thing being covered
       rather than the thing doing the covering. */
    /* ═══════════════════════ THE INTRODUCTION HOLDS THE PAGE STILL
       A VEIL BEHIND IT, AND NO SCROLLING UNTIL NEXT OR SKIP. The first
       version had no veil, on the argument that the letter already dims the
       page on a first visit and a second dimmed card in a row reads as a
       stack of modals. That was weighed again and overruled by the author,
       and the fault it fixes is real: the introduction sat over a page that
       could be scrolled, so somebody could be half a screen away before
       Hortus had finished saying hello, with the figure following them down
       as a fixed element and the words in it no longer about anything.

       IT IS STEP ONE ONLY. Every step after it points AT a section and has
       to scroll to get there, so the lock is released the moment the tour
       moves on.

       `backdrop-filter` WITH A DARKER FALLBACK UNDERNEATH. Where the blur is
       unsupported the background colour alone still separates the figure
       from the page, so the veil never fails open; where it IS supported the
       page stays legible as a place rather than becoming a black sheet,
       which is the difference between an introduction and an error dialog. */
    ".gg-g-veil{position:fixed;inset:0;z-index:9400;",
    "background:rgba(16,42,48,0.44);",
    "-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);",
    "opacity:0;pointer-events:none;transition:opacity .45s ease;",
    "touch-action:none;}",
    ".gg-g-veil[data-on='1']{opacity:1;pointer-events:auto;}",
    "@supports not ((backdrop-filter:blur(2px)) or (-webkit-backdrop-filter:blur(2px))){",
    ".gg-g-veil{background:rgba(16,42,48,0.62);}}",
    /* OVER THE SIDE NAV AND THE MUSIC BUTTON, UNDER THE LETTER. The column
       normally sits at 240, which is under the music button at 260 and a
       long way under the side nav at 9000, so at its usual height the two
       controls would stand ON TOP of the veil and still be pressed: a rail
       of section links is exactly the escape this is meant to close. 9450
       clears both and stays under the letter's 9500, which must always win. */
    "#gg-guide[data-stage='1']{z-index:9450;}",
    "html.gg-locked, html.gg-locked body{overflow:hidden !important;",
    "overscroll-behavior:none;}",
    "@media (prefers-reduced-motion:reduce){.gg-g-veil{transition:none;}}",

    "#gg-guide[data-stage='1']{align-items:center;flex-direction:column-reverse;}",
    "#gg-guide[data-stage='1'] .gg-g-say{max-width:330px;text-align:center;",
    "padding:14px 30px 14px 30px;font-size:14.5px;}",
    /* THE NOTCH MOVES TO THE TOP WITH THE BUBBLE. It points UP at the figure
       now, and it is centred, so it meets the head rather than the air beside
       it, which is the fault the landing band's own gardener bubble records. */
    "#gg-guide[data-stage='1'] .gg-g-say::after{right:auto;bottom:auto;",
    "left:50%;margin-left:-6px;top:-5px;}",
    "#gg-guide[data-stage='1'] .gg-g-x{right:6px;left:auto;}",
    "#gg-guide[data-stage='1'] .gg-g-nav{justify-content:center;}",
    /* THE HEART STILL LEAVES THE CROWN, and with the column turned over the
       crown is at the TOP of it rather than 92px off the foot. Measured from
       the top instead, or a pat on the stage throws a heart out of the
       bubble's text. */
    "#gg-guide[data-stage='1'] .gg-g-heart{right:auto;left:50%;margin-left:-13px;",
    "bottom:auto;top:8px;}",
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

    /* THE TOUR'S TWO BUTTONS, and they exist only while one is running.
       `Next` is the project's own dark teal and `Skip` is a plain word, so
       there is one obvious thing to press and a way out that does not
       compete with it. */
    ".gg-g-nav{display:none;gap:10px;align-items:center;margin-top:10px;}",
    "#gg-guide[data-tour] .gg-g-nav{display:flex;}",
    ".gg-g-next{border:none;background:#1d6466;color:#fff9e3;border-radius:999px;",
    "padding:7px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;",
    "font-weight:700;cursor:pointer;transition:transform .15s,filter .15s;}",
    ".gg-g-next:hover{transform:scale(1.04);filter:brightness(1.12);}",
    ".gg-g-skip{border:none;background:none;color:#5c8d84;padding:4px 2px;",
    "font-family:Arial,Helvetica,sans-serif;font-size:12px;cursor:pointer;",
    "text-decoration:underline;}",
    ".gg-g-skip:hover{color:#1d6466;}",
    ".gg-g-step{margin-left:auto;font-size:11.5px;color:#9ab8b2;}",
    "@media (hover:none){.gg-g-next:hover{transform:none;}}",

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
    /* Over a host rather than over the column: centred on it and leaving
       from its upper third, which is where the head is in a 200 unit box. */
    ".gg-g-heart.is-here{right:auto;left:50%;margin-left:-13px;bottom:62%;}",
    "@media (max-width:768px){.gg-g-heart{right:26px;bottom:62px;width:20px;height:20px;}",
    ".gg-g-heart.is-here{margin-left:-10px;}}",

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
    ".gg-g-say{max-width:min(72vw,240px);font-size:12.5px;}",
    /* THE STAGE HAS TO BEAT THE PIN ABOVE, AND IT WINS ON SPECIFICITY RATHER
       THAN ON ORDER. Both carry `!important`, so the later rule does NOT
       automatically win; `#gg-guide[data-stage='1']` is one id and one
       attribute against a bare id, which is what settles it. The vertical
       placement is a flat 18vh here rather than the measured centring the
       laptop gets, because the column is most of a phone screen tall and
       there is nothing to centre it in. */
    "#gg-guide[data-stage='1']{left:12px !important;right:12px !important;",
    "bottom:16vh !important;align-items:center !important;",
    "flex-direction:column-reverse !important;}",
    "#gg-guide[data-stage='1'] .gg-g-say::after{bottom:auto !important;top:-5px;}",
    "#gg-guide[data-stage='1'] .gg-g-heart{bottom:auto;top:6px;}",
    "#gg-guide[data-stage='1'] .gg-g-say{max-width:min(86vw,300px) !important;",
    "padding:12px 26px !important;font-size:13.5px;}",
    "#gg-guide[data-stage='1'] .gg-g-say::after{right:auto !important;left:50% !important;",
    "margin-left:-6px;}",
    "#gg-guide[data-stage='1'] .gg-g-heart{right:auto;left:50%;margin-left:-10px;bottom:92px;}}",

    /* No cursor rule: `button` is already in garden-cursor.js's clickable
       list, and a rule here would lose to it anyway since every rule that
       file writes carries !important. */
    "@media (prefers-reduced-motion: reduce){",
    "#gg-guide,.gg-g-say,.gg-g-me{transition:none !important;}}"
  ].join("");

  /* ───────────────────────────────────────────────────────────────── the build */
  var root = null, bubble = null, me = null, veil = null, holdT = 0, current = "";
  var reactT = 0, introT = 0, introUp = false;
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
  /* ─────────────────────────────── A PAT ANYWHERE HORTUS IS DRAWN
     The band on the landing page draws its own figure, and the objection to
     making it pattable was that two tappable Hortuses is two characters.
     That objection DIED when the companion learned to hush itself on that
     band: there is only one of them on screen there now, so the one you can
     see is the one you can touch, which is the rule rather than the
     exception.

     IT IS THE SAME PAT, exported rather than written twice: the same wink,
     the same heart, the same 1100ms, so a pat is one gesture wherever it
     lands. The host supplies the figure and gets it back when the beat is
     over. */
  /* ONE RUB TEST, TWO FIGURES. The companion uses it and so does the
     Fertilizer band's own Hortus, exported rather than written twice, so
     rubbing a head means the same gesture wherever the head is. `fire` is
     whatever that figure does about it. */
  function rubToPat(el, fire) {
    if (!el || el.__ggRub) return;
    el.__ggRub = true;
    var rub = { dir: 0, flips: 0, at: 0, until: 0 };
    el.addEventListener("pointermove", function (e) {
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
        fire();
      }
    }, { passive: true });
  }

  function patHost(host, px, backTo) {
    if (!host || !window.GardenMascot) return;
    var cs = getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";
    host.innerHTML = window.GardenMascot.svg("pat", px);
    heart(host, true);
    setTimeout(function () {
      host.innerHTML = window.GardenMascot.svg(backTo || "welcome", px);
    }, 1100);
  }

  function heart(host, here) {
    var h = document.createElement("div");
    h.className = "gg-g-heart" + (here ? " is-here" : "");
    h.innerHTML =
      "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M12 21s-8-5.1-8-10.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 3.8C20 15.9 12 21 12 21z' fill='#f4a0ad'/></svg>";
    (host || root).appendChild(h);
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
      var e = entry(current);
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
    /* CLOSING THE BUBBLE MID TOUR ENDS THE TOUR, and ends it for good. The
       cross means "not now", and a tour that came back on the next visit to
       somebody who had already dismissed it is the nagging this project
       avoids everywhere else. */
    if (typeof tourAt === "number" && tourAt >= 0) {
      tourAt = -1;
      markTour();
      if (root) root.removeAttribute("data-tour");
    }
    /* THE CROSS MUST COME OFF THE STAGE TOO, AND FORGETTING IT BRICKED THE
       PAGE. This path does not go through `endTour`, so with the veil and
       the scroll lock added, pressing the corner cross during step one hid
       Hortus and left a blurred, unscrollable sheet over the site with
       nothing on it to dismiss it: the visitor's own "not now" locked them
       out of the page entirely. `stage(false)` is safe to call at any time
       and is hoisted, so it can sit above its own definition. */
    stage(false);
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
        "<div class='gg-g-nav'>" +
          "<button class='gg-g-next' type='button'>Next</button>" +
          "<button class='gg-g-skip' type='button'>Skip</button>" +
          "<span class='gg-g-step'></span>" +
        "</div>" +
      "</div>" +
      "<button class='gg-g-me' type='button' aria-label='" + NAME + ", say that again'></button>";
    document.body.appendChild(root);

    /* A SEPARATE ELEMENT ON THE BODY, not a child of the column. The column
       is a small box that moves around the screen and is what the heart is
       positioned from; a full screen backdrop inside it would be sized and
       placed by the same rules. It is also inert: a tap on it does NOT
       dismiss the tour, because the whole point is that the visitor makes a
       choice, and Skip is sitting right there to be made. */
    veil = document.createElement("div");
    veil.className = "gg-g-veil";
    veil.setAttribute("aria-hidden", "true");
    veil.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    document.body.appendChild(veil);

    bubble = root.querySelector(".gg-g-say");
    me = root.querySelector(".gg-g-me");
    me.innerHTML = window.GardenMascot.svg("welcome", 92);

    root.querySelector(".gg-g-x").addEventListener("click", putAway);
    root.querySelector(".gg-g-next").addEventListener("click", function () { tourGo(tourAt + 1); });
    root.querySelector(".gg-g-skip").addEventListener("click", function () { endTour(true); });

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
    rubToPat(me, react);

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
  /* ═══════════════════════════ IT STANDS BESIDE THE CARD, NOT IN THE CORNER
     In a garden every screen is one card in the middle of the scene, and a
     companion answering it from the bottom right corner is a long way from
     the thing it is answering: the words and the question they are about
     were at opposite ends of the window. Beside the card they read as one
     thing, which is what a companion is for.

     IT GOES TO THE RIGHT OF THE CARD AND THE COLUMN FLIPS LEFT, so the
     bubble opens AWAY from the card rather than over it. Right aligned, the
     bubble grows leftward from the figure and lands on the very card it is
     talking about.

     IT FALLS BACK TO THE CORNER whenever there is no room, which is a
     narrow window or a phone, and whenever no card is on screen, which is
     the garden itself. `data-perched` is what switches the stylesheet's own
     corner rule off; without it that rule carries `!important` and an inline
     position cannot win. */
  function unperch() {
    if (!root) return;
    root.removeAttribute("data-perched");
    root.style.left = ""; root.style.right = ""; root.style.bottom = "";
    root.setAttribute("data-side", "right");
  }

  function visibleCard() {
    var cards = document.querySelectorAll(".gg-card");
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      /* A card inside a hidden `.gg-wrap` measures zero, which is the whole
         test: no flag has to be kept in step with what the sketch displayed. */
      if (r.width > 80 && r.height > 80 && r.top < window.innerHeight && r.bottom > 0) return r;
    }
    return null;
  }

  /* MEASURED NOW AND AGAIN ON THE NEXT FRAME, which is a bug fixed rather
     than caution. `GardenGuide.step` is called from the sketch's own
     `showStep`, and whether the OLD card has been hidden and the new one
     laid out by then depends on the order of two lines in another file: the
     garden step kept the perch it had on the fork card, because at the
     moment it was asked that card was still on screen. */
  var placeT = [];
  function placeInGarden() {
    placeT.forEach(clearTimeout);
    placeT = [];
    var go = function () { if (!cardPerch()) unperch(); };
    go();
    requestAnimationFrame(go);
    /* AND TWICE MORE, LATE, because a card's WIDTH is not settled when it is
       shown: the picker builds eight preview canvases into its grid and the
       card grows under the figure that was just placed beside it. Measured
       before this: the picker's card ended 4px past the figure and the
       "why that one" card left a 56px gap, both because the perch was
       computed against the card as it was a frame earlier. */
    placeT.push(setTimeout(go, 140), setTimeout(go, 460));
  }

  function cardPerch() {
    if (!root) return false;
    if (window.innerWidth < 900) return false;        /* no lane beside the card */
    var c = visibleCard();
    if (!c) return false;
    var x = c.right + 26;
    /* 280 is the bubble's own cap plus its padding. If that does not fit, the
       bubble would be squeezed into a column of words, so the corner is the
       better answer. */
    if (x + 280 > window.innerWidth - 14) return false;
    root.setAttribute("data-perched", "1");
    root.setAttribute("data-side", "left");
    root.style.left = Math.round(x) + "px";
    root.style.right = "auto";
    /* STOOD ON THE CARD'S OWN FOOT, so the two line up along the bottom
       rather than the figure floating at some height of its own. */
    root.style.bottom = Math.max(16, Math.round(window.innerHeight - c.bottom)) + "px";
    return true;
  }

  function moveTo(spot) {
    /* A GARDEN IS ONE SCREEN AND ITS CORNERS ARE ALL SPOKEN FOR: Home top
       left, four round icons top right, the Garden Tips card bottom left and
       the account or friends button bottom right. So there is nowhere to fly
       TO, and the figure simply holds one place. It sits bottom right and is
       LIFTED clear of the friends button, which is 38px tall at bottom 20 and
       so owns everything up to 58. */
    if (INGARDEN) return;
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

  /* ONE PLACE DECIDES HOW BIG THE FIGURE IS, because three things ask:
     `setPose`, the resize handler and the stage. 140 AND 90, UP FROM 92 AND
     62: at the old size it weighed the same as the ambient butterflies
     `garden-life.js` flies across the hero, so it read as a third piece of
     scenery rather than as somebody talking to you. Half as large again is
     what separates a character from the life around it.

     ON THE STAGE IT IS HALF AS LARGE AGAIN ONCE MORE, 210 and 140. That step
     has to be big enough to read as a different moment rather than as the
     same figure having drifted into the middle. */
  function figPx() {
    var big = root && root.getAttribute("data-stage") === "1";
    if (window.innerWidth <= 768) return big ? 140 : 90;
    return big ? 210 : 140;
  }

  /* THE VEIL AND THE SCROLL LOCK MOVE TOGETHER, in one place, because a veil
     without the lock is a dimmed page you can still scroll behind and a lock
     without the veil is a page that has silently stopped working.

     `overflow:hidden` ON BOTH `html` AND `body`. On its own, html is enough
     in most browsers and is NOT enough in some mobile ones, where the body
     keeps its own scroller; `overscroll-behavior:none` is what stops the
     rubber band handing the gesture to the page behind. The veil also eats
     `touchmove` itself, since it covers the viewport and that is the gesture
     a finger actually makes.

     NOTHING IS SAVED AND RESTORED, and that is deliberate rather than
     missing: `tourGo(0)` scrolls to the top before the lock goes on, so
     there is no offset to preserve, and `position:fixed` on the body (the
     usual way to hold a scroll position) would make the column's own fixed
     positioning resolve against the body instead of the viewport. */
  function hold(on) {
    if (!veil) return;
    try {
      if (on) {
        veil.setAttribute("data-on", "1");
        document.documentElement.classList.add("gg-locked");
      } else {
        veil.removeAttribute("data-on");
        document.documentElement.classList.remove("gg-locked");
      }
    } catch (e) {}
  }

  function setPose(p) {
    pose = p || pose;
    me.innerHTML = window.GardenMascot.svg(pose, figPx());
    aimEyes();
  }

  /* ───────────────────────────────────────────── CENTRE STAGE, AND BACK OFF IT
     `stage(true)` stretches the column across the viewport so `align-items:
     center` can centre its children, then measures the column and puts its
     middle on the window's. It is measured rather than given a percentage
     because the column's height is the bubble's height plus the figure's and
     the bubble is however many lines the line wraps to.

     SLIGHTLY BELOW THE MIDDLE, at 0.42 of the free space rather than 0.5, and
     that is the hero deciding rather than taste. With the column turned over,
     the figure is its top half; at a true centre the figure sat across the
     headline's middle and the bubble across the subtitle. At 0.42 the
     headline is clear above the figure and the bubble lands in the band of
     sky between the copy and the meadow's hills. NOTE WHICH WAY THE FIGURE
     GOES: it is a `bottom`, so a LARGER fraction LIFTS the column. Written as
     0.46 first, which measured the column's middle at 473 against a window
     middle of 450, 23px the wrong way.

     THE PHONE OWNS ITS OWN VERTICAL, in the stylesheet, since its pin carries
     `!important` and there is nothing to centre a nearly screen tall column
     in anyway. */
  function stage(on) {
    if (!root) return;
    if (!on) {
      root.removeAttribute("data-stage");
      hold(false);
      return;
    }
    root.setAttribute("data-stage", "1");
    hold(true);
    /* The default side, so none of the `data-side='left'` overrides can fire
       underneath the centred ones. */
    root.setAttribute("data-side", "right");
    if (window.innerWidth <= 768) return;
    root.style.left = "0";
    root.style.right = "0";
    var h = root.offsetHeight || 420;
    root.style.bottom = Math.max(16, Math.round((window.innerHeight - h) * 0.42)) + "px";
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
      root.removeAttribute("data-perched");
      root.style.left = root.style.right = root.style.bottom = "";
    } else if (tourAt === 0) {
      /* STILL ON THE STAGE, so re-centre against the new window rather than
         sending it to the section's corner, which is what the branch below
         would do and what left it stranded off centre after a resize. */
      stage(true);
    } else if (INGARDEN) {
      /* A window dragged narrow has to give the perch up, or the figure
         stays at an x measured against a card that has since moved. */
      if (!cardPerch()) unperch();
    } else if (SAYS[current]) {
      moveTo(SAYS[current].spot);
    }
  });

  /* ONE TABLE LOOKUP for both modes, so everything below it (the hush, the
     pose, the introduction, the hold) is written once. */
  function entry(id) {
    return INGARDEN ? (GARDEN_SAYS[MODE] || {})[id] : SAYS[id];
  }

  /* ─────────────────────────── IT SAYS HELLO IN A BUBBLE OF ITS OWN, ONCE
     It used to ride on the FRONT of the first line it ever said, on the
     argument that two bubbles in a row the moment somebody arrives is the
     crowding the letter already waits to avoid. That was wrong about what it
     cost: glued to the front of the day's fertilizer, or of a garden card's
     line, the greeting read as a preamble to that line rather than as
     somebody arriving, and whoever it was addressed to was already reading
     the half after it. A hello is its own sentence.

     IT IS STILL SAID ONCE, EVER, and still site wide: a character that
     introduces itself every visit is one that has not remembered you.
     `gg_met_hortus` in `localStorage`, for the same reason the letter uses
     it. The put-away flag stays in `sessionStorage`, because that IS about
     this visit.

     MARKED ONLY ONCE IT HAS BEEN ON SCREEN LONG ENOUGH TO READ. Marking it
     at the moment it is composed loses it to any step immediately
     superseded, which the personal garden produces at boot every time.

     `INTRO_HOLD` IS SHORTER THAN `HOLD`, because the line after it is the
     one the screen is actually about and a greeting sitting there for seven
     seconds delays it. */
  var INTRO_HOLD = 4200;
  function meetFirst(e) {
    introUp = true;
    if (INGARDEN) placeInGarden();
    else moveTo(e && e.spot);
    root.removeAttribute("data-hushed");
    root.querySelector(".gg-g-text").textContent =
      "Hi, I am " + NAME + "! I will be your companion through the garden.";
    setPose("welcome");
    bubble.removeAttribute("data-on");
    void bubble.offsetWidth;
    bubble.setAttribute("data-on", "1");
    clearTimeout(introT);
    introT = setTimeout(meet, 2000);
    clearTimeout(holdT);
    holdT = setTimeout(function () {
      introUp = false;
      /* WHATEVER SCREEN IS ON NOW, not the one that was on when it arrived.
         `current` is kept up to date by every `say` that lands underneath
         the greeting, so the line that follows it is never stale. */
      meet();
      say(current, true);
    }, INTRO_HOLD);
  }

  /* ─────────────────────────────────────────────────── THE TOUR ITSELF
     `tourAt` is -1 when no tour is running, which is what every other part
     of this file tests: the observer, the hold timer and the greeting all
     stand down while it is a number. */
  var tourAt = -1;
  function tourDone() {
    try { return localStorage.getItem(TOUR_KEY) === "1"; } catch (e) { return true; }
  }
  function markTour() {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch (e) {}
  }

  function tourGo(i) {
    if (i >= TOUR.length) { endTour(false); return; }
    var stp = TOUR[i];
    tourAt = i;
    root.setAttribute("data-tour", "1");
    root.removeAttribute("data-hushed");

    /* THE PAGE COMES TO THE LINE. Scrolling the section into view is most of
       what makes this a tour rather than six sentences in a corner, and it
       is the page's own smooth behaviour doing it. */
    var sec = document.getElementById(stp.to);
    if (sec && i > 0) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    /* STEP ONE GOES TO THE TOP FIRST. It never scrolled, on the argument that
       its own section is already the top of the page; that is true on arrival
       and not true after the letter, which can be read for as long as
       somebody likes while they scroll. Locking the page wherever they
       happened to stop would freeze them halfway down a section with a
       greeting over it. */
    if (i === 0) window.scrollTo(0, 0);

    /* THE SPOT IS THE SECTION'S OWN, so the figure lands where it would have
       landed on an ordinary scroll past, and the tour does not invent a
       second idea of where Hortus lives. The Fertilizer band's `quiet` is
       IGNORED here: on the tour there is a line to say about that band, and
       the band's own figure is simply the thing being pointed at. */
    var e = SAYS[stp.to];
    /* STEP ONE IS THE INTRODUCTION AND IT STANDS IN THE MIDDLE. Every step
       after it points at a section, so it belongs beside that section; this
       one points at Hortus, so it belongs where you are looking. */
    var onStage = i === 0;
    stage(onStage);
    if (!onStage) moveTo(e && e.spot);
    setPose(i === TOUR.length - 1 ? "planted" : (e && e.pose) || "welcome");

    current = stp.to;
    root.querySelector(".gg-g-text").textContent = stp.line;
    root.querySelector(".gg-g-step").textContent = (i + 1) + " of " + TOUR.length;
    root.querySelector(".gg-g-next").textContent =
      i === TOUR.length - 1 ? "Let me in" : "Next";

    /* THE HEIGHT IS MEASURED AFTER THE WORDS AND THE POSE ARE IN, or the
       column is measured at whatever it was a moment ago and the centring is
       out by however much this line's wrapping differs from the last one's. */
    if (onStage) stage(true);

    bubble.removeAttribute("data-on");
    void bubble.offsetWidth;
    bubble.setAttribute("data-on", "1");
    /* NO HOLD TIMER. The line stays until the button is pressed, which is the
       whole difference between being shown round and being talked at. */
    clearTimeout(holdT);
  }

  function startTour() {
    meet();                    /* the first line introduces it, so it has met you */
    tourGo(0);
  }

  /* ENDING IS THE SAME WHETHER IT WAS WALKED OR SKIPPED, which is deliberate:
     somebody who skips has still been offered it, and offering it twice is
     the nagging this project avoids everywhere else. */
  function endTour(skipped) {
    tourAt = -1;
    markTour();
    /* OFF THE STAGE BEFORE THE AMBIENT COMPANION TAKES OVER, or somebody who
       skips on step one leaves a 210px Hortus standing in the middle of the
       page: `moveTo` writes `left`/`right`/`bottom` but nothing else clears
       the attribute, and `setPose` would go on reading the big size off it. */
    stage(false);
    root.removeAttribute("data-tour");
    bubble.removeAttribute("data-on");
    /* The ambient companion takes over from here, starting with whichever
       section is actually on screen rather than with the one the tour
       happened to stop on. */
    /* `watch()` fires its observer with whatever is already intersecting, so
       the first ambient line arrives on its own and re-saying one here would
       print the same sentence twice. */
    watch();
  }

  function say(id, again) {
    var e = entry(id);
    if (!e) return;
    /* THE TOUR OWNS THE BUBBLE WHILE IT IS RUNNING. The observer is not
       started until the tour ends, but a tap on the figure reaches `say`
       too, and that would drop somebody out of step three into an ambient
       line with no Next under it. */
    if (tourAt >= 0) return;
    current = id;

    /* THE GREETING OWNS THE BUBBLE WHILE IT IS UP, and a step arriving under
       it only changes what comes NEXT. That is what makes the introduction
       survivable: the personal garden calls `showStep` more than once while
       it boots, so anything that let a later line overwrite the bubble lost
       the greeting inside half a second. */
    if (introUp) return;

    /* Hushed sections hide the column outright rather than speaking. */
    if (e.quiet) { root.setAttribute("data-hushed", "1"); clearTimeout(holdT); return; }
    root.removeAttribute("data-hushed");

    /* THE GREETING IS CHECKED AFTER THE HUSH, or somebody whose first
       section is the Fertilizer band meets Hortus standing beside the band's
       own Hortus, which is the two-characters fault that hush exists for. It
       waits for a section that is actually its own. */
    if (!met()) { meetFirst(e); return; }

    /* ───────────────────────────────── SILENT IS NOT THE SAME AS HUSHED
       A garden is silent: you came to look at it and a companion talking
       over the thing you came for is the one behaviour that would make
       anybody close the page. It is NOT hidden, which is what `quiet` does
       and what this used to be. Hortus simply standing in the corner of the
       garden is the whole of what makes it a companion rather than a thing
       that helps you through a form and then vanishes at the end of it, and
       it is still there to be patted. `quiet` is kept for the Fertilizer
       band, where the band carries its own Hortus and two of the same
       character on one screen is two characters. */
    if (e.silent) {
      /* The garden itself has no card, so this always falls to the corner. */
      if (INGARDEN) placeInGarden(); else moveTo(e.spot);
      setPose(e.pose);
      bubble.removeAttribute("data-on");
      clearTimeout(holdT);
      return;
    }

    if (INGARDEN) placeInGarden(); else moveTo(e.spot);
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
    /* THE INTRODUCTION IS SITE WIDE, not page wide, and `gg_met_hortus` is
       one key for the whole project. Somebody who arrives straight at a
       garden has still never met it, so it introduces itself on the first
       line it ever says, wherever that is: the hero's greeting on the
       landing page, or whatever the first card says in a garden. */
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
    /* A garden has no sections to observe. The SKETCH drives it, by calling
       `GardenGuide.step(s)` from its own `showStep`, which is one line in
       each and cannot fall out of step with what is on screen the way
       polling a global would. */
    if (INGARDEN) return;
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
      /* IN A GARDEN IT ARRIVES SILENT and waits for the sketch's first
         `step()`. Saying something on boot would put a line up before the
         sketch has decided which screen the visitor is even on: somebody who
         has already planted today goes straight to the garden, which is a
         hushed screen, and a greeting there is a companion talking over the
         thing it just hushed itself for. */
      if (INGARDEN) return;
      /* THE TOUR REPLACES THE FIRST AMBIENT LINE, it does not follow it.
         Both would be Hortus speaking twice in four seconds, and the tour's
         own first step is the greeting. A visitor who has been round before
         gets exactly what they got before. */
      if (!tourDone() && document.getElementById("home")) { startTour(); return; }
      say("home");
      watch();
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }

  /* `data-guide` on the tag puts it in the garden's own corner. 84 clears the
     friends button (38px tall at bottom 20, so it owns up to 58) with 26 to
     spare; 72 and a smaller figure on a phone, where that button shrinks. */
  if (INGARDEN) {
    var gs = document.createElement("style");
    gs.textContent =
      /* THE CORNER IS THE FALLBACK NOW, NOT THE RULE. `:not([data-perched])`
         is what lets `cardPerch` place the figure beside a card with inline
         styles: an `!important` declaration beats an inline one, so an
         unscoped rule here would have quietly won every time and the figure
         would never have moved. */
      "#gg-guide:not([data-perched]){right:18px !important;left:auto !important;bottom:84px !important;}" +
      "@media (max-width:768px){#gg-guide:not([data-perched]){right:12px !important;bottom:72px !important;}}";
    document.head.appendChild(gs);
  }

  window.GardenGuide = {
    say: say,
    /* WHAT A GARDEN SKETCH CALLS, from its own `showStep`. An unknown step
       name hushes rather than throwing, so a step added to a sketch later
       simply gets no line until somebody writes one. */
    step: function (id) {
      if (!INGARDEN || !root) return;
      if (!entry(id)) {
        root.setAttribute("data-hushed", "1");
        current = id;
        return;
      }
      say(id);
    },
    mode: MODE,
    /* For anything that draws its own Hortus and wants it to answer. */
    patHost: patHost,
    rubToPat: rubToPat,
    putAway: putAway,
    fertilizer: today,
    name: NAME,
    reset: function () {
      try {
        sessionStorage.removeItem(SEEN_KEY);
        localStorage.removeItem(MET_KEY);
        localStorage.removeItem(TOUR_KEY);
      } catch (e) {}
    }
  };
})();
