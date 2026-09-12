/* Gratitude Garden, accounts for the personal garden
   ------------------------------------------------------------------
   The sketch itself knows nothing about accounts. This file owns three
   things and hands the sketch a finished result:

     1. the Supabase client, if the project has been configured
     2. the sign in screen
     3. GardenStore, the one place the garden is read from and written to

   The sketch script is not in the HTML. It is injected by boot() below,
   only once there is a garden to draw, because p5 starts the moment it is
   parsed and its preload() cannot wait on a promise.

   With no keys pasted into /config.js this falls back to this
   browser's own storage and no sign in is asked for, so the garden keeps
   working exactly as it did before accounts existed. */

(function () {
  "use strict";

  /* The key check lives in /config.js, because the shared garden's likes and
     comments need exactly the same one and two copies of the rule that keeps
     a SECRET key out of a web page is one copy too many. */
  function readConfig() {
    if (typeof window.readSupabaseConfig !== "function") {
      console.warn("[Gratitude Garden] Accounts are OFF. config.js did not load, " +
        "so there is nothing to check. The garden is saving to this browser instead.");
      return null;
    }
    return window.readSupabaseConfig();
  }

  var CFG = readConfig();
  var URL_ = CFG && CFG.url, KEY = CFG && CFG.key;
  var CONFIGURED = !!CFG;

  var LOCAL_KEY = "personal_gratitude_garden";
  var sb = null;
  var current = { flowers: [], name: "", lastPlanted: "" };

  /* ---------------------------------------------------------------- store */

  var GardenStore = {
    signedIn: false,
    email: "",
    cloud: CONFIGURED,

    get: function () { return current; },

    save: function (flowers) {
      current.flowers = flowers;
      persist();
    },
    saveName: function (name) {
      current.name = name;
      persist();
    },
    markPlanted: function (dateStr) {
      current.lastPlanted = dateStr;
      persist();
    },
    lastPlanted: function () { return current.lastPlanted; },

    signOut: function () {
      if (sb) sb.auth.signOut().then(function () { location.reload(); });
    },

    /* Used once, on a first sign in where this browser already holds a garden
       and the account does not. Everything else about a local garden is left
       alone deliberately. */
    adoptLocal: function () {
      var local = readLocal();
      if (!local.flowers.length) return false;
      current.flowers = local.flowers;
      if (!current.name) current.name = local.name;
      current.lastPlanted = local.lastPlanted || "";
      persist();
      return true;
    },
    localCount: function () { return readLocal().flowers.length; }
  };
  window.GardenStore = GardenStore;

  var saveTimer = null;
  function persist() {
    /* debounced: planting writes the flowers, the date and sometimes the name
       in quick succession, and that is one row update, not three */
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (!CONFIGURED || !GardenStore.signedIn) {
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(current.flowers));
          localStorage.setItem(LOCAL_KEY + "_name", current.name || "");
          localStorage.setItem("gratitude_last_planted", current.lastPlanted || "");
        } catch (e) { console.error("Could not save the garden:", e); }
        return;
      }
      sb.auth.getUser().then(function (res) {
        var user = res.data && res.data.user;
        if (!user) return;
        sb.from("gardens").upsert({
          user_id: user.id,
          garden_name: current.name || "",
          flowers: current.flowers,
          last_planted: current.lastPlanted || "",
          updated_at: new Date().toISOString()
        }).then(function (r) {
          if (r.error) console.error("Could not save the garden:", r.error.message);
        });
      });
    }, 400);
  }

  /* ---------------------------------------------------------------- boot */

  function readLocal() {
    var out = { flowers: [], name: "", lastPlanted: "" };
    try {
      var raw = localStorage.getItem(LOCAL_KEY);
      out.flowers = raw ? safeParse(raw) : [];
      out.name = localStorage.getItem(LOCAL_KEY + "_name") || "";
      out.lastPlanted = localStorage.getItem("gratitude_last_planted") || "";
    } catch (e) {}
    return out;
  }

  function loadLocal() { current = readLocal(); }

  function safeParse(raw) {
    try { var v = JSON.parse(raw); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }

  function loadCloud(user) {
    return sb.from("gardens").select("*").eq("user_id", user.id).maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        var row = res.data;
        if (!row) {
          /* first sign in on this account. The garden starts empty; if this
             browser holds one, start() offers to carry it over rather than
             taking it silently. */
          current = { flowers: [], name: "", lastPlanted: "" };
          freshAccount = true;
          return;
        }
        freshAccount = false;
        current = {
          flowers: Array.isArray(row.flowers) ? row.flowers : [],
          name: row.garden_name || "",
          lastPlanted: row.last_planted || ""
        };
      })
      .then(seedNameFromUsername);
  }

  /* The garden's title starts as the username and stays editable afterwards.
     Only ever filled in when it is EMPTY: someone who has already named their
     garden something else must not have it renamed under them, and the two
     are separate things after this moment. The username is the fixed handle
     friends search for; the title is decoration. */
  function seedNameFromUsername() {
    if (current.name) return;
    var acc = window.GardenAccount;
    if (!acc || !acc.isLive()) return;
    var u = acc.username();
    if (u) { current.name = u; return; }
    /* The username may still be being claimed on the screen above this one,
       so take it when it arrives rather than giving up here. */
    acc.onChange(function (st) {
      if (current.name || !st.profile || !st.profile.username) return;
      current.name = st.profile.username;
      GardenStore.saveName(current.name);
      if (typeof window.applyGardenName === "function") {
        window.applyGardenName(current.name);
      }
    });
  }

  var freshAccount = false;

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    loaded();
    window.__gardenBoot = current;
    var tag = document.createElement("script");
    tag.src = "personal-garden-sketch.js";

    /* p5 in global mode starts itself from the window LOAD event, and only if
       `window.setup` already exists at that moment. This sketch is injected
       later than that on every path that matters: after the Supabase session
       check, which is a network round trip, or after someone clicks "use this
       browser only". By then load has long fired, p5 has looked for a setup,
       found none and done nothing, so the sketch defines setup and draw and
       nobody ever calls them. The page comes up blank.

       It only ever worked before because an unconfigured project made the
       session check synchronous, so boot ran during parse and beat the load
       event. Configuring Supabase is what exposed it.

       `frameCount` is the tell: p5 defines it the moment it instantiates, so
       undefined means it never started and starting it here is safe. */
    tag.onload = function () {
      if (typeof window.setup === "function" && typeof window.frameCount === "undefined") {
        new p5();
      }
    };
    document.head.appendChild(tag);
  }

  /* Everything below appends to document.body, and this module runs from the
     head. Whether body exists yet depends on how fast the session check
     resolves, which is a network race: on a warm cache it can win, and then
     the sign in screen throws and nobody can get in. */
  function clearOverlays() {
    var open = document.querySelectorAll(".gg-overlay");
    for (var i = 0; i < open.length; i++) open[i].remove();
  }

  function onReady(fn) {
    if (document.body) return fn();
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  /* This page decides what to show only after a session check has come back
     from the network, which is often after the window's load event, so the
     loader is asked to wait. It is released by whichever of the two arrives:
     the sign in gate, or the garden itself.

     The tag for this file sits AFTER garden-loader.js in the head, which is
     what makes the hold on the next line safe. Move it above and the hold
     silently does nothing. */
  if (window.GardenLoader) window.GardenLoader.hold();
  function loaded() { if (window.GardenLoader) window.GardenLoader.done(); }

  /* ---------------------------------------------------------------- gate */

  function gate() { onReady(function () { buildGate(); loaded(); }); }

  function buildGate() {
    clearOverlays();
    var wrap = document.createElement("div");
    wrap.id = "gg-auth";
    wrap.className = "gg-overlay";
    wrap.innerHTML =
      '<div class="gg-auth-card">' +
        '<h1>Your Gratitude Garden</h1>' +
        '<p class="gg-auth-sub">Sign in so your garden follows you between your phone and your laptop.</p>' +
        '<form id="gg-auth-form" autocomplete="on">' +
          '<label for="gg-email">Email</label>' +
          '<input id="gg-email" type="email" autocomplete="email" required />' +
          '<label for="gg-pass">Password</label>' +
          '<input id="gg-pass" type="password" autocomplete="current-password" minlength="6" required />' +
          '<p class="gg-auth-hint" id="gg-auth-hint">At least 6 characters.</p>' +
          '<p class="gg-auth-msg" id="gg-auth-msg" role="status"></p>' +
          '<button type="submit" class="gg-auth-btn" id="gg-auth-go">Sign in</button>' +
          '<button type="button" class="gg-auth-alt" id="gg-auth-swap">New here? Create an account</button>' +
          '<button type="button" class="gg-auth-link" id="gg-auth-forgot">Forgot your password?</button>' +
        '</form>' +
        /* Nobody should be locked out of a garden by a sign in screen. Without
           this the only way past the gate is an account, and the browser only
           mode the project has always had would be unreachable. */
        '<button type="button" class="gg-auth-skip" id="gg-auth-skip">Use this browser only, no account</button>' +
      '</div>';
    document.body.appendChild(wrap);

    var mode = "in";
    var msg = document.getElementById("gg-auth-msg");
    var go = document.getElementById("gg-auth-go");
    var swap = document.getElementById("gg-auth-swap");
    var pass = document.getElementById("gg-pass");

    var hint = document.getElementById("gg-auth-hint");
    var forgot = document.getElementById("gg-auth-forgot");
    var skip = document.getElementById("gg-auth-skip");
    var sub = wrap.querySelector(".gg-auth-sub");
    var emailEl = document.getElementById("gg-email");
    try { emailEl.focus(); } catch (e) {}

    function setMode(next) {
      mode = next;
      go.textContent = mode === "in" ? "Sign in" : "Create account";
      swap.textContent = mode === "in"
        ? "New here? Create an account"
        : "Already have a garden? Sign in";
      sub.textContent = mode === "in"
        ? "Sign in so your garden follows you between your phone and your laptop."
        : "One garden, on every device you sign in on.";
      hint.style.display = mode === "up" ? "block" : "none";
      forgot.style.display = mode === "in" ? "block" : "none";
      pass.setAttribute("autocomplete", mode === "in" ? "current-password" : "new-password");
      say("");
    }
    setMode("in");

    swap.addEventListener("click", function () { setMode(mode === "in" ? "up" : "in"); });

    /* Straight into the browser only mode the project has always had. It is
       not a second class path: the garden works exactly as it did before
       accounts existed, and the note in the tips card says where it is kept. */
    skip.addEventListener("click", function () {
      GardenStore.cloud = false;
      loadLocal();
      wrap.remove();
      boot();
    });

    forgot.addEventListener("click", function () {
      var email = emailEl.value.trim();
      if (!email) { emailEl.focus(); return say("Type your email above first, then press this again.", true); }
      forgot.disabled = true;
      say("Sending a reset link...");
      sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] })
        .then(function (res) {
          forgot.disabled = false;
          if (res.error) return say(readable(res.error.message), true);
          say("Check your email for a link to set a new password.");
        }, function (err) { forgot.disabled = false; say(readable(err && err.message), true); });
    });

    function say(text, bad) {
      msg.textContent = text;
      msg.className = "gg-auth-msg" + (bad ? " bad" : "");
    }

    /* Supabase passes the raw fetch failure through when the project cannot be
       reached at all, and "Failed to fetch" tells nobody anything. */
    function readable(text) {
      if (!text) return "Something went wrong.";
      if (/failed to fetch|networkerror|load failed/i.test(text)) {
        return "Could not reach the garden. Check your connection, and that the project URL in config.js is right.";
      }
      return text;
    }

    document.getElementById("gg-auth-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("gg-email").value.trim();
      var password = pass.value;
      go.disabled = true;
      say(mode === "in" ? "Signing in..." : "Creating your garden...");

      var call = mode === "in"
        ? sb.auth.signInWithPassword({ email: email, password: password })
        : sb.auth.signUp({ email: email, password: password });

      call.then(function (res) {
        if (res.error) { go.disabled = false; return say(readable(res.error.message), true); }
        if (!res.data.session) {
          /* sign up succeeded but email confirmation is switched on */
          go.disabled = false;
          return say("Check your email for a confirmation link, then sign in.", false);
        }
        start(res.data.session.user, wrap);
      }, function (err) {
        go.disabled = false;
        say(readable(err && err.message), true);
      });
    });
  }

  function start(user, gateEl) {
    GardenStore.signedIn = true;
    GardenStore.email = user.email || "";
    loadCloud(user).then(function () {
      if (gateEl) gateEl.remove();
      accountChip();
      /* A first sign in on a device that already has a garden in it. Taking it
         silently would be wrong, and ignoring it loses someone's flowers, so
         it is offered once and only once. */
      if (freshAccount && GardenStore.localCount() > 0) return offerLocal();
      boot();
    }, function (err) {
      console.error("Could not load the garden:", err.message || err);
      if (gateEl) {
        var m = document.getElementById("gg-auth-msg");
        if (m) { m.textContent = "Could not reach your garden. Check the table exists."; m.className = "gg-auth-msg bad"; }
        var b = document.getElementById("gg-auth-go");
        if (b) b.disabled = false;
      }
    });
  }

  /* ---------------------------------------------------------- signed in UI */

  /* Who is signed in, and the way out. `signOut` existed from the start and
     nothing ever called it, so a device could be signed in with no way to sign
     out or change account. Bottom left, since Home is top left, Save PNG is
     top right and the logo is bottom right. */
  function accountChip() { onReady(buildChip); }

  function buildChip() {
    if (document.getElementById("gg-account")) return;
    /* Skipped when garden-account.js is running, because that module's panel
       already shows the email and carries Sign out. Two places to sign out is
       one too many, and this one sat in the bottom right corner where the
       logo would reappear the moment the LOGO-01.png 404 is ever fixed. */
    if (window.GardenAccount && window.GardenAccount.isLive()) return;
    var el = document.createElement("div");
    el.id = "gg-account";
    el.innerHTML =
      '<span class="gg-account-who" title="' + esc(GardenStore.email) + '">' + esc(GardenStore.email) + '</span>' +
      '<button type="button" class="gg-account-out" id="gg-signout">Sign out</button>';
    document.body.appendChild(el);
    document.getElementById("gg-signout").addEventListener("click", function () {
      GardenStore.signOut();
    });
  }

  function esc(t) {
    return String(t || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ------------------------------------------------------- carrying a garden */

  function offerLocal() { onReady(buildOffer); }

  function buildOffer() {
    clearOverlays();
    var n = GardenStore.localCount();
    var wrap = document.createElement("div");
    wrap.id = "gg-offer";
    wrap.className = "gg-overlay";
    wrap.innerHTML =
      '<div class="gg-auth-card">' +
        '<h1>Keep the flowers already here?</h1>' +
        '<p class="gg-auth-sub">This browser has ' + n + ' flower' + (n === 1 ? "" : "s") +
          ' saved in it from before you signed in. Your account is empty. ' +
          'Move them across, or start the account fresh.</p>' +
        '<button type="button" class="gg-auth-btn" id="gg-keep">Move them to my account</button>' +
        '<button type="button" class="gg-auth-alt" id="gg-fresh">Start fresh</button>' +
      '</div>';
    document.body.appendChild(wrap);
    document.getElementById("gg-keep").addEventListener("click", function () {
      GardenStore.adoptLocal();
      wrap.remove();
      boot();
    });
    document.getElementById("gg-fresh").addEventListener("click", function () {
      wrap.remove();
      boot();
    });
  }

  /* --------------------------------------------------- setting a new password */

  /* Arriving back from the reset email. Supabase puts a recovery session in
     place and fires PASSWORD_RECOVERY; until a new password is set, the only
     thing to show is the form that sets it. */
  function recoveryForm() { onReady(buildRecovery); }

  function buildRecovery() {
    if (document.getElementById("gg-recover")) return;
    /* the ordinary session check may have raced ahead and put the gate up
       already; only one of these belongs on screen */
    clearOverlays();
    var wrap = document.createElement("div");
    wrap.id = "gg-auth-recovery";
    wrap.className = "gg-overlay";
    wrap.innerHTML =
      '<div class="gg-auth-card" id="gg-recover">' +
        '<h1>Set a new password</h1>' +
        '<p class="gg-auth-sub">Pick something you will remember. This signs you straight in.</p>' +
        '<form id="gg-rec-form">' +
          '<label for="gg-rec-pass">New password</label>' +
          '<input id="gg-rec-pass" type="password" autocomplete="new-password" minlength="6" required />' +
          '<p class="gg-auth-hint">At least 6 characters.</p>' +
          '<p class="gg-auth-msg" id="gg-rec-msg" role="status"></p>' +
          '<button type="submit" class="gg-auth-btn" id="gg-rec-go">Save it</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(wrap);
    var msg = document.getElementById("gg-rec-msg"), go = document.getElementById("gg-rec-go");
    document.getElementById("gg-rec-form").addEventListener("submit", function (e) {
      e.preventDefault();
      go.disabled = true;
      msg.className = "gg-auth-msg";
      msg.textContent = "Saving...";
      sb.auth.updateUser({ password: document.getElementById("gg-rec-pass").value })
        .then(function (res) {
          if (res.error) {
            go.disabled = false;
            msg.className = "gg-auth-msg bad";
            msg.textContent = res.error.message;
            return;
          }
          location.href = location.href.split("#")[0];
        }, function (err) {
          go.disabled = false;
          msg.className = "gg-auth-msg bad";
          msg.textContent = (err && err.message) || "Something went wrong.";
        });
    });
  }

  /* ---------------------------------------------------------------- go */

  if (!CONFIGURED) {
    loadLocal();
    boot();
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("The Supabase library did not load. Falling back to this browser's storage.");
    GardenStore.cloud = false;
    loadLocal();
    boot();
    return;
  }

  /* ONE client per page, made by garden-account.js and borrowed here. Two
     clients both watch the same stored session and both try to refresh it,
     and the account module needs the same session this gate signs into, or
     signing in on this page would leave the friends list logged out. */
  sb = (window.GardenAccount && window.GardenAccount.isLive())
    ? window.GardenAccount.client()
    : window.supabase.createClient(URL_, KEY);

  /* The reset link lands here with a recovery session. This fires before, or
     instead of, the ordinary session check below, so the flag stops the garden
     booting behind the form. */
  var recovering = /type=recovery/.test(location.hash || "");
  sb.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { recovering = true; recoveryForm(); }
  });

  sb.auth.getSession().then(function (res) {
    if (recovering) return recoveryForm();
    var session = res.data && res.data.session;
    if (session && session.user) start(session.user, null);
    else gate();
  });
})();
