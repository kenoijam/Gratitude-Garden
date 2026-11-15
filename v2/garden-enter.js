/* ═══════════════════════════════════════════════════════════════════════════
   garden-enter.js  ·  ENTER GOES ON

   ONE COPY AT THE v2 ROOT, used by every text field in both gardens, so the
   key does the same thing wherever somebody is typing. Two copies of this
   would drift inside a session, which is the fault this project already pays
   for in seven places.

   ───────────────────────────────────────────────────────────── WHY IT EXISTS
   Every field in both gardens is a `<textarea>`, including the ones that
   want a word rather than a paragraph, so Enter put a newline in a box
   nobody wanted a newline in and the only way on was to reach for the mouse.
   A reflection flow whose whole argument is that it should not feel like a
   form was asking for a mouse at the end of every sentence.

   ──────────────────────────────── SHIFT+ENTER STILL MAKES A NEW LINE
   So a paragraph is still possible in the boxes that are for paragraphs, and
   the key that does the obvious thing is the unmodified one. This is the
   convention every chat box on the internet has taught, which is the whole
   reason it is safe to take.

   ────────────────────────────────────── IT ASKS, IT DOES NOT ASSUME
   `fire` is the step's OWN action, handed over at the call site, so the
   gating a card already does (an empty gratitude refuses, an unnamed flower
   refuses) is honoured without this knowing anything about it. A key that
   skipped a check the button enforces would be a second way through the
   flow with different rules.

   ──────────────────────────────── IT BLURS FIRST, AND ON A PHONE THAT IS
   THE POINT. The on screen keyboard covers the bottom third of the screen,
   so a card that changes underneath it leaves somebody reading the new card
   through a keyboard they then have to dismiss by hand.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* `el` may be a DOM node or a p5 element. */
  function node(el) { return (el && el.elt) ? el.elt : el; }

  function on(el, fire) {
    var n = node(el);
    if (!n || n.__ggEnter || typeof fire !== "function") return;
    n.__ggEnter = true;
    n.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      /* AN IME IS MID COMPOSITION, and Enter there is choosing a candidate
         rather than finishing a sentence. Indonesian does not need one;
         somebody typing in Chinese or Japanese on the same page does, and a
         key that jumped the card out from under them would be unusable. */
      if (e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      n.blur();
      fire();
    });
  }

  window.GardenEnter = { on: on };
})();
