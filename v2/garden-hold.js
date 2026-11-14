/* ═══════════════════════════════════════════════════════════════════════════
   garden-hold.js  ·  PLANTING IS AN ACT, NOT A TAP

   ONE COPY AT THE v2 ROOT, used by both gardens' Plant buttons, so the
   gesture that puts a flower in the ground is the same gesture in both
   places. A second copy would drift, which is the fault this project already
   pays for in seven places.

   ─────────────────────────────────────────────────────────── WHY IT EXISTS
   Norton, Mochon & Ariely's *The IKEA Effect: when labor leads to love*: the
   effort somebody puts into making a thing is itself what makes them value
   it. Planting was one tap on a button, which is the least laboured moment
   in a flow that had just asked three questions; the flower simply appeared.
   A press that has to be HELD is small, real labour at the exact moment the
   thing becomes yours.

   It is also Hallnas & Redstrom's *slowness of appearance*: the one gesture
   in the project that commits something should take a moment to happen,
   rather than being the quickest thing on the screen.

   ───────────────────────────────────────────── WHAT IT IS NOT: A TIME GATE
   900ms, which is about as long as a deliberate press and nowhere near long
   enough to be a chore. The point is to make the gesture FELT, not to make
   anybody wait. Longer was tried at 1600 and reads as the button being
   broken.

   ───────────────────────────────────────── THE KEYBOARD DOES NOT HOLD
   A keyboard press fires immediately. Holding Enter to activate a button is
   not a thing any keyboard user expects, it is not what the key repeat does,
   and a gesture that cannot be performed without a pointer is an
   accessibility regression rather than a design. The labour argument is
   about the pointer; the keyboard keeps the plain button it always had.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CSS = [
    /* THE FILL IS A `::after` ON THE BUTTON, and it has to be, because both
       gardens build these buttons with p5.dom and set every colour inline:
       a background written here would lose to the inline one. An overlay
       child wins by being a different element. */
    ".gg-hold{position:relative;overflow:hidden;isolation:isolate;}",
    ".gg-hold::after{content:'';position:absolute;inset:0;z-index:0;",
    "transform:scaleX(var(--hold,0));transform-origin:left center;",
    "background:rgba(255,255,255,0.28);pointer-events:none;",
    "transition:transform .12s linear;}",
    /* RELEASING SPRINGS BACK FASTER THAN IT FILLED. A fill that drains at
       the same rate it filled reads as an animation playing backwards; a
       quick snap reads as letting go of something. */
    ".gg-hold[data-releasing='1']::after{transition:transform .22s cubic-bezier(.3,0,.2,1);}",
    /* The label has to sit above the sweep. p5 writes the text as a bare
       child, so it is wrapped on arm(). */
    ".gg-hold .gg-hold-label{position:relative;z-index:1;}",
    ".gg-hold[data-held='1']{filter:brightness(1.04);}",
    /* A press that was too short says so, once, where the label is. */
    ".gg-hold[data-nudge='1'] .gg-hold-label{animation:ggHoldNudge .5s ease;}",
    "@keyframes ggHoldNudge{0%,100%{transform:translateX(0);}",
    "25%{transform:translateX(-2px);}75%{transform:translateX(2px);}}",
    "@media (prefers-reduced-motion:reduce){",
    ".gg-hold::after{transition:none;}",
    ".gg-hold[data-nudge='1'] .gg-hold-label{animation:none;}}"
  ].join("");

  var styled = false;
  function ensureCss() {
    if (styled) return;
    styled = true;
    var s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* `arm(el, fire, opts)` replaces whatever click handler the button had.
     The caller must NOT also bind `mousePressed`, or the flower is planted
     twice: p5's `mousePressed` is a `mousedown` listener, so it would fire
     at the START of the hold, which is the whole thing this prevents. */
  function arm(el, fire, opts) {
    if (!el || el.__ggHold) return;
    el.__ggHold = true;
    ensureCss();
    opts = opts || {};
    var MS    = opts.ms || 900;
    var READY = opts.label || el.textContent.trim() || "Hold to plant";
    var HELD  = opts.holding || "Keep holding";
    var SHORT = opts.tooShort || "Hold it a moment";

    el.classList.add("gg-hold");
    /* Wrap whatever text is there so the sweep can pass behind it. If the
       caller rewrites the label later it must go through `setLabel`. */
    var label = document.createElement("span");
    label.className = "gg-hold-label";
    label.textContent = READY;
    el.textContent = "";
    el.appendChild(label);

    var t0 = 0, raf = 0, done = false;

    function paint(v) { el.style.setProperty("--hold", v.toFixed(3)); }

    function stop(reset) {
      if (raf) cancelAnimationFrame(raf), raf = 0;
      el.removeAttribute("data-held");
      if (reset) {
        el.setAttribute("data-releasing", "1");
        paint(0);
        label.textContent = READY;
        setTimeout(function () { el.removeAttribute("data-releasing"); }, 240);
      }
    }

    function tick() {
      var v = Math.min(1, (performance.now() - t0) / MS);
      paint(v);
      if (v >= 1) {
        done = true;
        stop(false);
        paint(1);
        /* THE FILL IS LEFT FULL FOR A BEAT BEFORE THE SCREEN CHANGES, so the
           press is seen to have completed rather than the garden simply
           appearing mid gesture. */
        setTimeout(function () { fire(); paint(0); label.textContent = READY; }, 120);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function down(e) {
      if (el.disabled || done) return;
      /* A TOUCH POINTER MUST NOT ALSO SCROLL THE PAGE while it is holding a
         button, or the hold is cancelled by the scroll it started. */
      if (e.pointerType === "touch") e.preventDefault();
      el.setAttribute("data-held", "1");
      el.removeAttribute("data-releasing");
      label.textContent = HELD;
      t0 = performance.now();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    }

    function up() {
      if (done || !raf) { stop(false); return; }
      stop(true);
      /* NAME THE GESTURE RATHER THAN FAILING SILENTLY. A button that does
         nothing on a tap is a broken button; one that says what it wants is
         a button with a gesture. */
      label.textContent = SHORT;
      el.setAttribute("data-nudge", "1");
      setTimeout(function () {
        el.removeAttribute("data-nudge");
        if (!done) label.textContent = READY;
      }, 1100);
    }

    el.style.touchAction = "none";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", function () { if (raf && !done) up(); });

    /* THE KEYBOARD KEEPS A PLAIN BUTTON. `click` fires from Enter and Space
       and, on a pointer, only AFTER pointerup, so it has to ignore anything
       that came from a real pointer or every press would plant twice. */
    el.addEventListener("click", function (e) {
      if (e.detail !== 0) return;        /* detail 0 is a keyboard activation */
      if (el.disabled || done) return;
      done = true;
      fire();
    });

    return {
      setLabel: function (txt) { READY = txt; if (!raf) label.textContent = txt; },
      reset: function () { done = false; paint(0); label.textContent = READY; }
    };
  }

  window.GardenHold = { arm: arm };
})();
