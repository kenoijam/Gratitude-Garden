/* =========================================================================
   garden-account.js  -  one account across the whole project

   Loaded by the personal garden and the shared garden. There is deliberately
   ONE copy, and it owns ONE Supabase client: two clients on a page both watch
   the same stored session and both try to refresh it, and the pages would
   also drift apart on what a signed in person is called.

   It owns four things:

     1. the client, the session, and the profile row
     2. the username, which is claimed ONCE and is how people find each other
     3. friends: search, request, accept, decline, remove
     4. the friends panel and the button that opens it

   What it deliberately does NOT own: the personal garden's sign in gate and
   its GardenStore, which stay in personal-garden-auth.js, and the shared
   garden's comment panel, which stays in shared-garden-social.js. Both of
   those call GardenAccount.client() rather than making a client of their own.

   A username is claimed on a screen of its own after the first sign in, not
   as a third field on the sign up form. The reason is the failure case: a
   username collision on a combined form comes back as an error after the
   account may already have been created, and the person is left looking at a
   form that half worked.
   ========================================================================= */
(function () {
  "use strict";

  var CFG = (typeof window.readSupabaseConfig === "function")
    ? window.readSupabaseConfig() : null;

  var sb = null;
  var live = false;
  var me = null;          /* the signed in user */
  var profile = null;     /* their row in profiles, or null if not claimed yet */
  var listeners = [];
  var claimOpen = false;

  var NAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

  function fire() {
    listeners.forEach(function (fn) {
      try { fn({ user: me, profile: profile }); } catch (e) {}
    });
  }

  /* ---------------------------------------------------------------- styles */
  var CSS =
    /* ---- the claim screen ---- */
    '#ga-claim{position:fixed;inset:0;z-index:620;display:flex;align-items:center;' +
      'justify-content:center;padding:24px;font-family:Arial,Helvetica,sans-serif;' +
      'background:' +
        'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' preserveAspectRatio=\'none\'><path d=\'M0,58 C15,52 32,60 50,56 C68,52 86,60 100,55 L100,100 L0,100 Z\' fill=\'%23a9d9cf\'/><path d=\'M0,66 C20,62 36,68 55,64 C74,60 88,67 100,64 L100,100 L0,100 Z\' fill=\'%238fcfbe\'/><path d=\'M0,76 C25,73 45,78 65,75 C80,73 92,77 100,75 L100,100 L0,100 Z\' fill=\'%237ec4b4\'/></svg>")' +
        ' center / 100% 100% no-repeat,' +
        'radial-gradient(circle 190px at 85% 18%, rgba(251,228,132,0.9) 0%, rgba(251,228,132,0.42) 34%, rgba(251,228,132,0) 100%),' +
        'linear-gradient(180deg,#cfeef0 0%,#f9ffff 100%);}' +
    '.ga-card{width:100%;max-width:400px;background:snow;border:1px solid #e6efed;' +
      'border-radius:16px;padding:26px 24px 22px;box-shadow:0 8px 28px rgba(0,0,0,0.06);' +
      'box-sizing:border-box;}' +
    '.ga-card h1{font-family:Fraunces,Georgia,serif;font-size:26px;font-weight:600;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#0f5132;margin:0 0 6px;text-align:center;}" +
    '.ga-sub{font-size:15px;color:#2c7a7b;line-height:1.5;margin:0 0 18px;text-align:center;}' +
    '.ga-card input{width:100%;box-sizing:border-box;padding:13px 15px;' +
      'border:1.5px solid #d9ece9;border-radius:12px;font-family:inherit;font-size:16px;' +
      'color:#1d6466;background:#fdfefe;}' +
    '.ga-card input:focus{outline:none;border-color:#7fcdcd;}' +
    '.ga-btn{width:100%;box-sizing:border-box;margin-top:16px;padding:14px 18px;border:none;' +
      'border-radius:12px;background:mediumturquoise;color:snow;font-size:18px;font-weight:700;' +
      'font-family:inherit;cursor:pointer;transition:transform .15s,background .15s;}' +
    '.ga-btn:hover:not(:disabled){transform:scale(1.03);background:turquoise;}' +
    '.ga-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}' +
    '.ga-msg{font-size:13px;line-height:1.5;margin:9px 0 0;min-height:1.5em;}' +
    '.ga-msg[data-tone="bad"]{color:#b3261e;}' +
    '.ga-msg[data-tone="good"]{color:#2c7a7b;}' +
    '.ga-msg[data-tone="idle"]{color:#8aa9a7;}' +

    /* ---- the friends button ---- */
    '#ga-friends-btn{position:fixed;right:14px;bottom:16px;z-index:210;' +
      'display:inline-flex;align-items:center;gap:7px;padding:7px 15px 7px 12px;' +
      'border-radius:50px;border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);' +
      'color:#1d6466;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;' +
      'cursor:pointer;box-shadow:0 2px 10px rgba(29,100,102,0.14);' +
      'transition:background .2s,transform .15s;}' +
    '#ga-friends-btn:hover{background:#e1f7f7;transform:translateY(-1px);}' +
    '#ga-friends-btn svg{width:15px;height:15px;display:block;}' +
    '#ga-friends-btn .ga-pip{display:none;min-width:17px;height:17px;border-radius:9px;' +
      'background:#e2557e;color:snow;font-size:11px;line-height:17px;text-align:center;padding:0 4px;}' +
    '#ga-friends-btn[data-pending="1"] .ga-pip{display:inline-block;}' +

    /* ---- the friends panel ---- */
    '#ga-panel{position:fixed;top:0;right:0;bottom:0;width:360px;max-width:100%;z-index:560;' +
      'background:snow;border-left:1px solid #d9ece9;box-shadow:-8px 0 28px rgba(29,100,102,0.12);' +
      'font-family:Arial,Helvetica,sans-serif;color:#1d6466;display:flex;flex-direction:column;' +
      'transform:translateX(102%);transition:transform .28s ease;}' +
    '#ga-panel[data-open="1"]{transform:none;}' +
    '@media (prefers-reduced-motion:reduce){#ga-panel{transition:none;}}' +
    '@media (max-width:560px){#ga-panel{top:auto;left:0;width:auto;height:76vh;border-left:none;' +
      'border-top:1px solid #d9ece9;border-radius:18px 18px 0 0;' +
      'box-shadow:0 -8px 28px rgba(29,100,102,0.16);transform:translateY(102%);}}' +
    '#ga-head{padding:20px 20px 14px;border-bottom:1px solid #eaf4f2;position:relative;}' +
    '#ga-head h2{font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:600;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#0f5132;margin:0 0 4px;}" +
    '#ga-whoami{font-size:13px;color:#2c7a7b;margin:0;}' +
    '.ga-rename-link{background:none;border:none;padding:0 0 0 6px;color:#2c7a7b;' +
      'font-family:inherit;font-size:13px;text-decoration:underline;cursor:pointer;}' +
    '#ga-rename{margin-top:12px;}' +
    '#ga-rename input{width:100%;box-sizing:border-box;padding:10px 12px;' +
      'border:1.5px solid #d9ece9;border-radius:12px;font-family:inherit;font-size:14px;' +
      'color:#1d6466;background:#fdfefe;}' +
    '#ga-rename input:focus{outline:none;border-color:#7fcdcd;}' +
    '#ga-rename .ga-act{margin-top:9px;justify-content:flex-end;}' +
    '#ga-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;' +
      'border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);color:#1d6466;' +
      'cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;}' +
    '#ga-close:hover{background:#e1f7f7;}' +
    '#ga-body{flex:1 1 auto;overflow-y:auto;padding:16px 20px 20px;}' +
    '.ga-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#8aa9a7;margin:18px 0 9px;}' +
    '.ga-h:first-child{margin-top:0;}' +
    '#ga-search{width:100%;box-sizing:border-box;padding:11px 13px;border:1.5px solid #d9ece9;' +
      'border-radius:12px;font-family:inherit;font-size:14px;color:#1d6466;background:#fdfefe;}' +
    '#ga-search:focus{outline:none;border-color:#7fcdcd;}' +
    '.ga-row{display:flex;align-items:center;gap:10px;padding:9px 0;' +
      'border-bottom:1px solid #f1f7f6;}' +
    '.ga-row:last-child{border-bottom:none;}' +
    '.ga-av{width:32px;height:32px;border-radius:50%;flex:0 0 auto;display:flex;' +
      'align-items:center;justify-content:center;font-size:14px;font-weight:700;' +
      'color:snow;background:#8fcfbe;}' +
    '.ga-who{flex:1 1 auto;min-width:0;}' +
    '.ga-who b{display:block;font-size:14px;color:#0f5132;overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap;}' +
    '.ga-who span{font-size:12px;color:#8aa9a7;}' +
    '.ga-act{flex:0 0 auto;display:flex;gap:6px;}' +
    '.ga-mini{padding:6px 12px;border-radius:50px;border:1.5px solid #b7e4e7;' +
      'background:rgba(255,249,227,0.92);color:#1d6466;font-family:inherit;font-size:12.5px;' +
      'font-weight:700;cursor:pointer;transition:background .18s;}' +
    '.ga-mini:hover:not(:disabled){background:#e1f7f7;}' +
    '.ga-mini:disabled{opacity:.55;cursor:not-allowed;}' +
    '.ga-mini[data-kind="go"]{background:mediumturquoise;border-color:mediumturquoise;color:snow;}' +
    '.ga-mini[data-kind="go"]:hover:not(:disabled){background:turquoise;border-color:turquoise;}' +
    '.ga-mini[data-kind="quiet"]{background:none;border-color:#e6efed;color:#8aa9a7;}' +
    '.ga-none{font-size:13.5px;color:#8aa9a7;line-height:1.6;margin:0;}';

  var FRIEND_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M15.5 20v-1.6a3.6 3.6 0 0 0-3.6-3.6H6.1A3.6 3.6 0 0 0 2.5 18.4V20"/>' +
    '<circle cx="9" cy="7.4" r="3.4"/><path d="M18 11.2h4M20 9.2v4"/></svg>';

  var X_ICON =
    '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8"/></svg>';

  /* ---------------------------------------------------------------- helpers */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function onReady(fn) {
    if (document.body) fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function initial(s) {
    var c = String(s || "?").trim().charAt(0);
    return c ? c.toUpperCase() : "?";
  }

  function shownName(p) {
    if (!p) return "";
    return p.display_name || p.username || "";
  }

  /* ---------------------------------------------------------------- profile */
  function loadProfile() {
    if (!me) { profile = null; return Promise.resolve(null); }
    return sb.from("profiles").select("*").eq("id", me.id).maybeSingle()
      .then(function (res) {
        profile = (res && res.data) || null;
        return profile;
      })
      .catch(function () { profile = null; return null; });
  }

  /* Availability is checked with ilike and no wildcards, which is an exact
     match that ignores case. The unique index in the database is on
     lower(username) for the same reason: Keni and keni are the same person as
     far as finding somebody is concerned, and allowing both is how people get
     impersonated. This check is a courtesy so the answer arrives before the
     button is pressed. The index is what actually enforces it. */
  function nameFree(name) {
    return sb.from("profiles").select("id").ilike("username", name).limit(1)
      .then(function (res) {
        if (res.error) return null;               /* cannot tell */
        return !(res.data && res.data.length);
      })
      .catch(function () { return null; });
  }

  /* ------------------------------------------------------------ claim screen */
  function openClaim() {
    if (claimOpen || !me || profile) return;
    claimOpen = true;

    var wrap = el("div"); wrap.id = "ga-claim";
    var card = el("div", "ga-card");
    var h = el("h1", null, "Choose your username");
    var sub = el("p", "ga-sub",
      "This is how friends find you, and it starts off your garden's name too. Letters, numbers and underscores, three to twenty characters.");

    var input = el("input");
    input.type = "text";
    input.maxLength = 20;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "username";

    var msg = el("p", "ga-msg");
    msg.setAttribute("data-tone", "idle");
    var go = el("button", "ga-btn", "Claim it");
    go.type = "button";
    go.disabled = true;

    var checkTimer = null, lastChecked = "";

    function setMsg(tone, text) {
      msg.setAttribute("data-tone", tone);
      msg.textContent = text;
    }

    function check() {
      var v = input.value.trim();
      if (!v) { go.disabled = true; setMsg("idle", ""); return; }
      if (!NAME_RE.test(v)) {
        go.disabled = true;
        setMsg("bad", "Three to twenty characters, letters, numbers and underscores only.");
        return;
      }
      setMsg("idle", "Checking");
      go.disabled = true;
      clearTimeout(checkTimer);
      /* Waits for a pause in typing. Firing per keystroke would ask the
         database about half typed names nobody is going to claim. */
      checkTimer = setTimeout(function () {
        lastChecked = v;
        nameFree(v).then(function (free) {
          if (input.value.trim() !== lastChecked) return;
          if (free === null) { setMsg("idle", ""); go.disabled = false; return; }
          if (free) { setMsg("good", v + " is free."); go.disabled = false; }
          else { setMsg("bad", v + " is taken. Try another."); go.disabled = true; }
        });
      }, 380);
    }

    input.addEventListener("input", check);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !go.disabled) go.click();
    });

    go.addEventListener("click", function () {
      var v = input.value.trim();
      if (!NAME_RE.test(v)) return;
      go.disabled = true;
      go.textContent = "Claiming";
      sb.from("profiles").insert({ id: me.id, username: v }).select().maybeSingle()
        .then(function (res) {
          go.textContent = "Claim it";
          if (res.error) {
            go.disabled = false;
            /* The unique index is the real check, and this is the race it
               catches: somebody claimed the name between the lookup and the
               button. */
            setMsg("bad", /duplicate|unique/i.test(res.error.message || "")
              ? "Somebody just took that one. Try another."
              : res.error.message);
            return;
          }
          profile = res.data;
          claimOpen = false;
          wrap.remove();
          fire();
          refreshPanel();
        })
        .catch(function () {
          go.disabled = false;
          go.textContent = "Claim it";
          setMsg("bad", "Could not reach the garden. Check your connection.");
        });
    });

    card.appendChild(h); card.appendChild(sub); card.appendChild(input);
    card.appendChild(msg); card.appendChild(go);
    wrap.appendChild(card);
    onReady(function () {
      document.body.appendChild(wrap);
      input.focus();
    });
  }

  /* ------------------------------------------------------------------ friends */
  /* Row level security already restricts every friendship row to the two
     people in it, so a plain select returns mine and nobody else's. The
     filter is not repeated here on purpose: writing it twice invites the two
     copies to disagree, and only the database's copy is enforced. */
  function loadFriends() {
    if (!me) return Promise.resolve({ friends: [], incoming: [], outgoing: [] });
    return sb.from("friendships").select("*").then(function (res) {
      if (res.error || !res.data) return { friends: [], incoming: [], outgoing: [] };
      var rows = res.data;
      var ids = {};
      rows.forEach(function (r) {
        ids[r.requester_id === me.id ? r.addressee_id : r.requester_id] = 1;
      });
      var list = Object.keys(ids);
      var who = list.length
        ? sb.from("profiles").select("id,username,display_name").in("id", list)
        : Promise.resolve({ data: [] });
      return Promise.resolve(who).then(function (pr) {
        var byId = {};
        (pr.data || []).forEach(function (p) { byId[p.id] = p; });
        var out = { friends: [], incoming: [], outgoing: [] };
        rows.forEach(function (r) {
          var otherId = r.requester_id === me.id ? r.addressee_id : r.requester_id;
          var item = { row: r.id, id: otherId, profile: byId[otherId] || null };
          if (r.status === "accepted") out.friends.push(item);
          else if (r.addressee_id === me.id) out.incoming.push(item);
          else out.outgoing.push(item);
        });
        return out;
      });
    }).catch(function () { return { friends: [], incoming: [], outgoing: [] }; });
  }

  function searchPeople(q) {
    q = String(q || "").trim();
    if (q.length < 2) return Promise.resolve([]);
    return sb.from("profiles").select("id,username,display_name")
      .ilike("username", "%" + q + "%").limit(8)
      .then(function (res) {
        return (res.data || []).filter(function (p) { return !me || p.id !== me.id; });
      })
      .catch(function () { return []; });
  }

  /* --------------------------------------------------------------- the panel */
  var panel, panelBody, panelWho, btn, searchInput, searchTimer;
  var state = { friends: [], incoming: [], outgoing: [] };

  function buildUI() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    btn = el("button");
    btn.id = "ga-friends-btn";
    btn.type = "button";
    btn.innerHTML = FRIEND_ICON + "<span>Friends</span><span class=\"ga-pip\"></span>";
    btn.addEventListener("click", function () {
      if (panel.getAttribute("data-open") === "1") closePanel(); else openPanel();
    });
    btn.style.display = "none";

    panel = el("div");
    panel.id = "ga-panel";
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");

    var head = el("div"); head.id = "ga-head";
    var close = el("button");
    close.id = "ga-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.innerHTML = X_ICON;
    close.addEventListener("click", closePanel);
    var h2 = el("h2", null, "Friends");
    panelWho = el("p"); panelWho.id = "ga-whoami";
    head.appendChild(close); head.appendChild(h2); head.appendChild(panelWho);

    panelBody = el("div"); panelBody.id = "ga-body";
    panel.appendChild(head);
    panel.appendChild(panelBody);

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.getAttribute("data-open") === "1") closePanel();
    });

    placeButton();
    setTimeout(placeButton, 1200);
  }

  /* The personal garden already puts its signed in chip in the bottom right
     corner, so on that page this sits above it rather than on top of it. The
     shared garden has nothing there. Checked again after a moment because the
     chip is built by another module whose session check may still be in
     flight. */
  function placeButton() {
    if (!btn) return;
    btn.style.bottom = document.getElementById("gg-account") ? "60px" : "16px";
  }

  function openPanel() {
    if (!panel) return;
    panel.setAttribute("data-open", "1");
    panel.setAttribute("aria-hidden", "false");
    refreshPanel();
  }

  function closePanel() {
    if (!panel) return;
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");
  }

  function personRow(item, actions) {
    var row = el("div", "ga-row");
    var name = shownName(item.profile) || "Someone";
    row.appendChild(el("div", "ga-av", initial(name)));
    var who = el("div", "ga-who");
    var b = el("b", null, name);
    who.appendChild(b);
    if (item.profile && item.profile.display_name && item.profile.username) {
      who.appendChild(el("span", null, item.profile.username));
    }
    row.appendChild(who);
    var act = el("div", "ga-act");
    actions.forEach(function (a) {
      var bt = el("button", "ga-mini", a.label);
      bt.type = "button";
      if (a.kind) bt.setAttribute("data-kind", a.kind);
      bt.addEventListener("click", function () {
        bt.disabled = true;
        a.run().then(refreshPanel).catch(function () { bt.disabled = false; });
      });
      act.appendChild(bt);
    });
    row.appendChild(act);
    return row;
  }

  /* Renaming has to go through the same uniqueness check as claiming, and it
     carries the display name along with it ONLY when that was never set to
     anything of its own. Somebody who has deliberately called themselves
     something else keeps it. */
  function openRename() {
    if (!profile || document.getElementById("ga-rename")) return;
    var box = el("div"); box.id = "ga-rename";
    var input = el("input");
    input.type = "text";
    input.maxLength = 20;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = profile.username || "";
    var msg = el("p", "ga-msg");
    msg.setAttribute("data-tone", "idle");
    var act = el("div", "ga-act");
    var save = el("button", "ga-mini", "Save");
    save.type = "button";
    save.setAttribute("data-kind", "go");
    save.disabled = true;
    var cancel = el("button", "ga-mini", "Cancel");
    cancel.type = "button";
    cancel.setAttribute("data-kind", "quiet");
    cancel.addEventListener("click", function () { box.remove(); });

    var timer = null, asked = "";
    input.addEventListener("input", function () {
      var v = input.value.trim();
      save.disabled = true;
      if (v === (profile.username || "")) { msg.setAttribute("data-tone", "idle"); msg.textContent = ""; return; }
      if (!NAME_RE.test(v)) {
        msg.setAttribute("data-tone", "bad");
        msg.textContent = "Three to twenty characters, letters, numbers and underscores only.";
        return;
      }
      msg.setAttribute("data-tone", "idle");
      msg.textContent = "Checking";
      clearTimeout(timer);
      timer = setTimeout(function () {
        asked = v;
        nameFree(v).then(function (free) {
          if (input.value.trim() !== asked) return;
          if (free === null) { msg.textContent = ""; save.disabled = false; return; }
          if (free) { msg.setAttribute("data-tone", "good"); msg.textContent = v + " is free."; save.disabled = false; }
          else { msg.setAttribute("data-tone", "bad"); msg.textContent = v + " is taken. Try another."; }
        });
      }, 380);
    });

    save.addEventListener("click", function () {
      var v = input.value.trim();
      if (!NAME_RE.test(v)) return;
      save.disabled = true;
      save.textContent = "Saving";
      var patch = { username: v };
      if (!profile.display_name || profile.display_name === profile.username) {
        patch.display_name = v;
      }
      sb.from("profiles").update(patch).eq("id", me.id).select().maybeSingle()
        .then(function (res) {
          save.textContent = "Save";
          if (res.error) {
            save.disabled = false;
            msg.setAttribute("data-tone", "bad");
            msg.textContent = /duplicate|unique/i.test(res.error.message || "")
              ? "Somebody just took that one. Try another."
              : res.error.message;
            return;
          }
          profile = res.data || profile;
          box.remove();
          fire();
          refreshPanel();
        })
        .catch(function () {
          save.disabled = false;
          save.textContent = "Save";
          msg.setAttribute("data-tone", "bad");
          msg.textContent = "Could not reach the garden.";
        });
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !save.disabled) save.click();
      if (e.key === "Escape") box.remove();
    });

    act.appendChild(cancel); act.appendChild(save);
    box.appendChild(input); box.appendChild(msg); box.appendChild(act);
    document.getElementById("ga-head").appendChild(box);
    input.focus();
    input.select();
  }

  function refreshPanel() {
    if (!panel) return;
    var old = document.getElementById("ga-rename");
    if (old) old.remove();
    panelWho.innerHTML = "";
    if (profile) {
      panelWho.appendChild(document.createTextNode("You are " + (profile.username || "")));
      var ch = el("button", "ga-rename-link", "Change");
      ch.type = "button";
      ch.addEventListener("click", openRename);
      panelWho.appendChild(ch);
    }

    if (!me) {
      panelBody.innerHTML = "";
      panelBody.appendChild(el("p", "ga-none",
        "Sign in to add friends. The gardens work without an account."));
      return;
    }
    if (!profile) {
      panelBody.innerHTML = "";
      panelBody.appendChild(el("p", "ga-none",
        "Choose a username first and friends can find you."));
      return;
    }

    loadFriends().then(function (data) {
      state = data;
      if (btn) btn.setAttribute("data-pending", data.incoming.length ? "1" : "0");
      var pip = btn && btn.querySelector(".ga-pip");
      if (pip) pip.textContent = data.incoming.length ? String(data.incoming.length) : "";

      panelBody.innerHTML = "";

      panelBody.appendChild(el("div", "ga-h", "Find someone"));
      searchInput = el("input");
      searchInput.id = "ga-search";
      searchInput.type = "text";
      searchInput.placeholder = "Search by username";
      searchInput.autocomplete = "off";
      panelBody.appendChild(searchInput);
      var results = el("div");
      panelBody.appendChild(results);

      searchInput.addEventListener("input", function () {
        clearTimeout(searchTimer);
        var q = searchInput.value;
        searchTimer = setTimeout(function () {
          if (q.trim().length < 2) { results.innerHTML = ""; return; }
          searchPeople(q).then(function (people) {
            results.innerHTML = "";
            var known = {};
            state.friends.concat(state.incoming, state.outgoing)
              .forEach(function (i) { known[i.id] = true; });
            var fresh = people.filter(function (p) { return !known[p.id]; });
            if (!fresh.length) {
              results.appendChild(el("p", "ga-none",
                people.length ? "Already on your list." : "Nobody by that name."));
              return;
            }
            fresh.forEach(function (p) {
              results.appendChild(personRow({ id: p.id, profile: p }, [
                { label: "Add", kind: "go", run: function () {
                    return sb.from("friendships").insert({
                      requester_id: me.id, addressee_id: p.id, status: "pending"
                    });
                  } }
              ]));
            });
          });
        }, 320);
      });

      if (data.incoming.length) {
        panelBody.appendChild(el("div", "ga-h", "Asked to be your friend"));
        data.incoming.forEach(function (i) {
          panelBody.appendChild(personRow(i, [
            { label: "Accept", kind: "go", run: function () {
                return sb.from("friendships").update({ status: "accepted" }).eq("id", i.row);
              } },
            { label: "Decline", kind: "quiet", run: function () {
                /* Declining deletes the row rather than marking it, so the
                   pair is free to ask again another day. The unique index is
                   on the pair, so a kept row would block that for good. */
                return sb.from("friendships").delete().eq("id", i.row);
              } }
          ]));
        });
      }

      panelBody.appendChild(el("div", "ga-h",
        "Friends" + (data.friends.length ? " (" + data.friends.length + ")" : "")));
      if (!data.friends.length) {
        panelBody.appendChild(el("p", "ga-none",
          "No friends yet. Search for somebody by their username."));
      } else {
        data.friends.forEach(function (i) {
          panelBody.appendChild(personRow(i, [
            { label: "Remove", kind: "quiet", run: function () {
                return sb.from("friendships").delete().eq("id", i.row);
              } }
          ]));
        });
      }

      if (data.outgoing.length) {
        panelBody.appendChild(el("div", "ga-h", "Waiting on a reply"));
        data.outgoing.forEach(function (i) {
          panelBody.appendChild(personRow(i, [
            { label: "Cancel", kind: "quiet", run: function () {
                return sb.from("friendships").delete().eq("id", i.row);
              } }
          ]));
        });
      }
    });
  }

  function showChrome() {
    if (!btn) return;
    btn.style.display = me ? "inline-flex" : "none";
    if (me) { placeButton(); refreshPanel(); }
    else closePanel();
  }

  /* -------------------------------------------------------------------- boot */
  function boot() {
    buildUI();

    sb.auth.onAuthStateChange(function (_evt, session) {
      me = (session && session.user) || null;
      loadProfile().then(function () {
        fire();
        showChrome();
        if (me && !profile) openClaim();
      });
    });

    sb.auth.getSession().then(function (res) {
      me = (res && res.data && res.data.session && res.data.session.user) || null;
      return loadProfile();
    }).then(function () {
      fire();
      showChrome();
      if (me && !profile) openClaim();
    }).catch(function () {});
  }

  if (CFG && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(CFG.url, CFG.key);
    live = true;
    onReady(boot);
  }

  window.GardenAccount = {
    isLive: function () { return live; },
    client: function () { return sb; },
    user: function () { return me; },
    profile: function () { return profile; },
    username: function () { return profile && profile.username ? profile.username : ""; },
    displayName: function () { return shownName(profile); },
    onChange: function (fn) {
      listeners.push(fn);
      /* Called straight away with whatever is known, so a caller does not
         have to handle "before the first event" as a separate case. */
      try { fn({ user: me, profile: profile }); } catch (e) {}
    },
    refresh: function () { return loadProfile().then(function () { fire(); showChrome(); }); },
    openFriends: openPanel
  };
})();
