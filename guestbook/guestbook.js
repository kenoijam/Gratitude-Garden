/* =========================================================================
   guestbook.js  -  one line each from everybody who has been through

   WHAT IT IS. A page of cards: somebody's gardener, the four things they said
   about themselves, a line in their own words, and the date. Anybody may
   READ it without an account; SIGNING needs one, so a name belongs to
   somebody and one person leaves one entry, which they can come back and
   change.

   THE TABLE HOLDS ALMOST NOTHING, and that is the design. A row is the
   signer, their note and when. The name, the gardener and the four answers
   are read from `profiles`, which `garden-account.js` already selects in two
   places to build the friends list, so a card updates when somebody changes
   their gardener rather than being a snapshot going quietly stale.

   IT DEGRADES TO A LINE. With no Supabase project configured, or with Step 10
   not run, the page says so in words and nothing throws, which is the rule
   `shared-garden-social.js` already follows.
   ========================================================================= */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var listEl, stateEl, mineEl;
  var sb = null, me = null, myProfile = null;
  var rows = [], profiles = {};
  var NOTE_MAX = 220;

  function say(html) { if (stateEl) { stateEl.innerHTML = html; stateEl.hidden = !html; } }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else { fn(); }
  }

  /* ---------------------------------------------------------------- dates */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
  function when(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  /* --------------------------------------------------------------- a card
     THE FIGURE, THEN WHAT THEY SAID, THEN THEIR OWN WORDS, THEN THE DATE,
     which is the reference's order and also the order they matter in: the
     picture is who, the four answers are quick, and the line is the thing
     they actually wrote.
     A SIGNER WITH NO GARDENER GETS THEIR INITIAL. Drawing a stock figure for
     them would make every one of those people appear to have built the same
     person, which is the rule `avatarFor` in `garden-account.js` already
     follows for the friends list. */
  function card(row) {
    var p = profiles[row.user_id] || {};
    var look = p.look || null;
    var name = p.display_name || p.username || "Someone";

    var art = document.createElement("div");
    art.className = "gb-shot";
    var G = window.GardenGardener;
    if (look && G && G.bubble && window.AvatarDraw &&
        typeof window.drawSpeciesBloom === "function") {
      /* The same figure every other page stands, at the size this frame is,
         so somebody here and somebody in a garden are plainly one person. */
      var c = document.createElement("canvas");
      var px = 118, dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(px * dpr);
      c.height = Math.round(px * 1.26 * dpr);
      c.style.width = px + "px";
      c.style.height = Math.round(px * 1.26) + "px";
      var x = c.getContext("2d");
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      window.AvatarDraw.paintAt(x, look, px / 2, px * 1.24, px * 1.30);
      art.appendChild(c);
    } else {
      var i = document.createElement("div");
      i.className = "gb-initial";
      i.textContent = (name[0] || "?").toUpperCase();
      art.appendChild(i);
    }

    var body = document.createElement("div");
    var h = document.createElement("p");
    h.className = "gb-who";
    h.textContent = "more about " + name;
    body.appendChild(h);

    var about = (look && look.about) || {};
    var A = window.AvatarDraw;
    var facts = document.createElement("ul");
    facts.className = "gb-facts";
    (A ? A.ABOUT : []).forEach(function (q) {
      if (!about[q.key]) return;
      var li = document.createElement("li");
      var b = document.createElement("b");
      b.textContent = q.label.toLowerCase() + ": ";
      li.appendChild(b);
      li.appendChild(document.createTextNode(about[q.key]));
      facts.appendChild(li);
    });
    if (facts.children.length) body.appendChild(facts);

    /* THEIR LINE IS THE GUEST BOOK'S OWN, not the one in their gardener. The
       about-you note travels with the figure everywhere; this one was written
       for this page and for the people reading it. */
    if (row.note) {
      var n = document.createElement("p");
      n.className = "gb-note";
      n.textContent = row.note;
      body.appendChild(n);
    }
    var d = document.createElement("p");
    d.className = "gb-when";
    d.textContent = when(row.updated_at || row.created_at);
    body.appendChild(d);

    var wrap = document.createElement("article");
    wrap.className = "gb-card";
    wrap.appendChild(art);
    wrap.appendChild(body);
    return wrap;
  }

  /* `quiet` IS WHAT STOPS AN EMPTY LIST OVERWRITING A REAL ERROR. `load`
     says in words when the table is missing, and then `draw` ran with no
     rows and replaced that with "Nobody has signed it yet", so a project
     where Step 10 had simply not been run looked like a project where
     nobody had signed. An empty list and a failed query are different
     things and must not say the same sentence. */
  function draw(quiet) {
    listEl.innerHTML = "";
    if (!rows.length) {
      if (!quiet) say("Nobody has signed it yet. Yours would be the first.");
      return;
    }
    say("");
    rows.forEach(function (r) { listEl.appendChild(card(r)); });
  }

  /* --------------------------------------------------------------- my row */
  function mine() {
    for (var i = 0; i < rows.length; i++) {
      if (me && rows[i].user_id === me.id) return rows[i];
    }
    return null;
  }

  function buildMine() {
    mineEl.innerHTML = "";
    var acct = window.GardenAccount;
    var live = acct && acct.isLive && acct.isLive();
    if (!live) { mineEl.hidden = true; return; }
    mineEl.hidden = false;

    var h = document.createElement("h2");
    var note = document.createElement("p");

    if (!me) {
      h.textContent = "Sign the book";
      note.textContent = "An account keeps one entry to your name, so you can come back and change it.";
      mineEl.appendChild(h);
      mineEl.appendChild(note);
      var inBtn = document.createElement("button");
      inBtn.className = "gb-btn";
      inBtn.type = "button";
      inBtn.textContent = "Sign in";
      inBtn.addEventListener("click", function () {
        if (acct.openSignIn) acct.openSignIn();
      });
      mineEl.appendChild(inBtn);
      return;
    }
    /* NO USERNAME, NO ENTRY. A card with nothing under the picture is worse
       than no card, and the account module already owns the screen that
       claims one. */
    if (!myProfile || !myProfile.username) {
      h.textContent = "Choose a name first";
      note.textContent = "Your entry needs a name to sit under it.";
      mineEl.appendChild(h);
      mineEl.appendChild(note);
      var nameBtn = document.createElement("button");
      nameBtn.className = "gb-btn";
      nameBtn.type = "button";
      nameBtn.textContent = "Choose a username";
      nameBtn.addEventListener("click", function () {
        if (acct.openFriends) acct.openFriends();
      });
      mineEl.appendChild(nameBtn);
      return;
    }

    var row = mine();
    h.textContent = row ? "Your entry" : "Sign the book";
    note.textContent = row
      ? "Change it whenever you like. Your gardener and what you said about them come from the studio, so editing there changes this too."
      : "One line, in your own words. Your gardener and the things you said about them come along from the studio.";
    mineEl.appendChild(h);
    mineEl.appendChild(note);

    var ta = document.createElement("textarea");
    ta.rows = 3;
    ta.maxLength = NOTE_MAX;
    ta.placeholder = "Anything you want to leave behind.";
    ta.value = row ? (row.note || "") : "";
    ta.setAttribute("aria-label", "Your guest book entry");
    mineEl.appendChild(ta);

    var bar = document.createElement("div");
    bar.className = "gb-row";
    var save = document.createElement("button");
    save.className = "gb-btn";
    save.type = "button";
    save.textContent = row ? "Save" : "Sign it";
    bar.appendChild(save);

    if (row) {
      var del = document.createElement("button");
      del.className = "gb-plain";
      del.type = "button";
      del.textContent = "Take mine out";
      del.addEventListener("click", function () { remove(save, del); });
      bar.appendChild(del);
    }
    var count = document.createElement("span");
    count.className = "gb-count";
    var tally = function () { count.textContent = ta.value.length + "/" + NOTE_MAX; };
    tally();
    ta.addEventListener("input", tally);
    bar.appendChild(count);
    mineEl.appendChild(bar);

    save.addEventListener("click", function () { write(ta.value.trim(), save); });
  }

  /* ----------------------------------------------------------------- data
     SELECT `*`, NEVER A LIST OF COLUMNS. Supabase answers a query naming a
     column that does not exist with a 400 and an error OBJECT rather than
     throwing, so on a project where Step 10 has not been run, naming one
     would empty the result and take every entry down with it. A star selects
     whatever the table actually has. `loadProfile` has always done this. */
  function load() {
    return sb.from("guestbook").select("*")
      .order("updated_at", { ascending: false })
      .limit(120)
      .then(function (res) {
        if (res.error) {
          rows = [];
          /* A MESSAGE THAT SENDS SOMEBODY TO RUN SQL HAS TO BE RIGHT, because
             they will go and run it. Only a missing table says Step 10; a
             permission refusal is a different sentence, and the real message
             is always shown rather than a guess about it. */
          var m = String(res.error.message || "");
          if (/does not exist|schema cache/i.test(m)) {
            say("The guest book is not set up on this project yet. Step 10 of " +
                "SUPABASE-SETUP.md adds the table.<br><small>" + m + "</small>");
          } else {
            say("The guest book could not be opened.<br><small>" + m + "</small>");
          }
          return false;
        }
        rows = res.data || [];
        return true;
      })
      .catch(function () { rows = []; say("The guest book could not be opened."); return false; });
  }

  function loadProfiles() {
    var ids = [];
    rows.forEach(function (r) { if (ids.indexOf(r.user_id) < 0) ids.push(r.user_id); });
    if (!ids.length) return Promise.resolve();
    /* A SECOND QUERY, not an embedded join. A PostgREST join would need a
       foreign key from `guestbook` straight to `profiles`, and this schema
       points at `auth.users`, so asking for one would be a guess about
       somebody else's database. The comments panel already does it this way. */
    return sb.from("profiles").select("*").in("id", ids)
      .then(function (res) {
        (res && res.data ? res.data : []).forEach(function (p) { profiles[p.id] = p; });
      })
      .catch(function () {});
  }

  function write(text, btn) {
    if (!me) return;
    btn.disabled = true;
    btn.textContent = "Saving...";
    var now = new Date().toISOString();
    /* UPSERT ON `user_id`, which is the unique index. One person, one entry,
       enforced in the DATABASE rather than by this page, because anybody can
       edit this page in their own browser. */
    sb.from("guestbook")
      .upsert({ user_id: me.id, note: text, updated_at: now }, { onConflict: "user_id" })
      .then(function (res) {
        btn.disabled = false;
        if (res.error) {
          say("That did not save.<br><small>" + (res.error.message || "") + "</small>");
          btn.textContent = "Try again";
          return;
        }
        refresh();
      });
  }

  function remove(saveBtn, delBtn) {
    if (!me) return;
    delBtn.disabled = true;
    delBtn.textContent = "Taking it out...";
    sb.from("guestbook").delete().eq("user_id", me.id)
      .then(function () { refresh(); });
  }

  function refresh() {
    return load().then(function (ok) {
      if (!ok) { draw(true); buildMine(); return; }
      return loadProfiles().then(function () { draw(); buildMine(); });
    });
  }

  /* ----------------------------------------------------------------- boot */
  ready(function () {
    listEl = $("gbList"); stateEl = $("gbState"); mineEl = $("gbMine");
    var acct = window.GardenAccount;
    /* WITH NO PROJECT CONFIGURED THE WHOLE PAGE IS ONE LINE, rather than an
       empty list that looks broken. Everything else on this site works
       without an account; this one thing genuinely cannot. */
    if (!acct || !acct.isLive || !acct.isLive() || !acct.client) {
      say("The guest book needs an account, and this copy of the project has " +
          "no database set up. Everything else here works without one.");
      if (window.GardenLoader && GardenLoader.done) GardenLoader.done();
      return;
    }
    sb = acct.client();
    acct.onChange(function (st) {
      me = (st && st.user) || null;
      myProfile = (st && st.profile) || null;
      buildMine();
    });
    refresh().then(function () {
      if (window.GardenLoader && GardenLoader.done) GardenLoader.done();
    });
  });
})();
