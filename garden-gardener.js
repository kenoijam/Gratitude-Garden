/* =========================================================================
   garden-gardener.js  -  the one place a gardener is read and written

   ONE COPY, AT THE ROOT, like `garden-music.js`, `garden-life.js`,
   `garden-journal.js`, `garden-cursor.js` and `garden-account.js`. Four pages
   need to know who your gardener is and a second copy of the rule for
   reading one would drift exactly the way the flower maths already has in
   seven places.

   IT OWNS THE LOOK, NOT THE DRAWING. `avatar/avatar-draw.js` draws; this
   decides where the row of numbers lives and tells anybody who asks when it
   changes. The split matters because the drawing is 1100 lines that only the
   picker and the two gardens need, and this is forty that everything needs.

   WHERE A LOOK LIVES, and it is `GardenStore`'s rule exactly: the account if
   there is one, this browser if there is not, NEVER BOTH. Writing to both
   sounds safer and is not, because a stale browser copy would then shadow a
   newer account one the next time somebody signed in on an old laptop.

   IT IS THE `profiles` ROW rather than the garden row, and that is the whole
   reason a friend's gardener costs nothing: the shared garden has no garden
   row at all, and `garden-account.js` already selects profiles in two places
   to build the friends list, so adding one column there brings every
   friend's gardener back with the name it is drawn beside.
   ========================================================================= */
(function () {
  "use strict";

  /* CAPTURED AT PARSE TIME, because `document.currentScript` is only valid
     while this file is being parsed. It is how the module works out where
     the build page is from wherever it has been loaded: the root, a garden
     one level down, or anywhere else later. `garden-cursor.js` reads its own
     tag the same way for `data-trail`. */
  var SELF = (document.currentScript && document.currentScript.src) || "";

  var KEY = "gg_gardener";
  var look = null;              /* null means nobody has built one */
  var listeners = [];
  var saveTimer = null;
  var warned = false;

  function acct() { return window.GardenAccount; }
  function live() { var a = acct(); return !!(a && a.isLive && a.isLive() && a.user && a.user()); }

  function readLocal() {
    try {
      var raw = localStorage.getItem(KEY);
      var v = raw ? JSON.parse(raw) : null;
      return (v && typeof v === "object") ? v : null;
    } catch (e) { return null; }
  }
  function writeLocal(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); }
    catch (e) { console.error("Could not keep the gardener:", e); }
  }

  function fire() {
    listeners.forEach(function (fn) { try { fn(look); } catch (e) {} });
  }

  /* THE BROWSER'S COPY IS READ AT ONCE, so a page never has to wait on a
     network round trip before it can draw somebody. If an account turns up a
     moment later carrying a different gardener, that one wins and everything
     listening is told. */
  look = readLocal();

  if (acct() && acct().onChange) {
    acct().onChange(function (st) {
      if (!st || !st.profile) return;
      /* A MISSING COLUMN AND AN EMPTY ONE ARE DIFFERENT. `look` undefined
         means Step 9 of SUPABASE-SETUP.md has not been run, and the browser's
         copy should stand; `look` null means this account genuinely has no
         gardener yet, and it should also stand, since the alternative is
         wiping one somebody built here before they signed in. */
      if (st.profile.look) { look = st.profile.look; fire(); }
    });
  }

  function save(next) {
    look = next;
    fire();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (!live()) { writeLocal(look); return; }
      var a = acct(), sb = a.client(), me = a.user();
      sb.from("profiles").update({ look: look }).eq("id", me.id)
        .then(function (r) {
          /* SUPABASE ANSWERS A MISSING COLUMN WITH A 400 AND AN ERROR OBJECT
             rather than throwing, so without this the save silently does
             nothing and the gardener appears to vanish on the next reload.
             Said once, then the browser keeps it instead. */
          if (r && r.error) {
            if (!warned) {
              warned = true;
              console.warn("[Gratitude Garden] The gardener could not be saved to " +
                "the account (" + r.error.message + "). If that names the `look` " +
                "column, run Step 9 of SUPABASE-SETUP.md. Keeping it in this " +
                "browser instead.");
            }
            writeLocal(look);
          }
        });
    }, 400);
  }

  /* `h` IS THE FIGURE'S WHOLE BOX, NOT THE HEIGHT OF WHAT IS PAINTED, and
     that is deliberate. Painted height varies by species, since a tulip grows
     on a stem out of the crown and a daisy rings the face, so fitting the
     PAINTED box to one height would draw a tulip gardener with a smaller body
     than a daisy one. Scaling the box keeps every gardener the same person. */
  function paintAt(ctx, l, cx, footY, h) {
    var A = window.AvatarDraw;
    if (!A || !A.paintAt) return;
    A.paintAt(ctx, l || look, cx, footY, h);
  }

  /* A GARDENER IN A CIRCLE, for a list of names. It is the same figure the
     gardens stand, at the size an avatar bubble is, so a friend in the list
     and a friend in a garden are plainly the same person.
     `h` is 1.16 of the circle, which fills it without the flower clipping:
     the figure's own box carries clear margin at the top, so at 1.00 it
     floated in the middle of the bubble with a ring of background round it. */
  function bubble(l, px) {
    var c = document.createElement("canvas");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(px * dpr); c.height = Math.round(px * dpr);
    c.style.width = px + "px"; c.style.height = px + "px";
    var ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var A = window.AvatarDraw;
    if (A && A.paintAt) A.paintAt(ctx, l, px / 2, px * 0.99, px * 1.16);
    return c;
  }

  window.GardenGardener = {
    get: function () { return look; },
    has: function () { return !!look; },
    save: save,
    paintAt: paintAt,
    onChange: function (fn) {
      listeners.push(fn);
      try { fn(look); } catch (e) {}
    },
    bubble: bubble,
    /* the page where one is built, from wherever this was loaded */
    href: function () {
      return SELF ? SELF.replace(/[^/]*$/, "") + "avatar/avatar-index.html"
                  : "avatar/avatar-index.html";
    }
  };
})();
