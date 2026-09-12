/* =========================================================================
   shared-garden-social.js  -  likes and comments on a shared garden flower

   The shared garden stays OPEN. Planting is still a typed name and a sentence,
   with no account and no Supabase call of any kind, exactly as it has always
   been. What needs an account is REACTING: a like has to be countable once per
   person, and a comment has to carry a name that belongs to somebody.

   Where a flower lives is therefore split, on purpose:

     p5.party   the living garden. The authority on what is planted today,
                and it resets at midnight with the room key.
     Supabase   a row per flower that somebody has reacted to, and the likes
                and comments hanging off it. This is what survives midnight.

   The Supabase row is created LAZILY, the first time a signed in person opens
   that bloom. Planting writes nothing, so an anonymous planter costs the
   database nothing and the open garden stays open. A bloom and its row are
   tied together by the day's room key plus the flower's own createdIndex,
   which p5.party already assigns and never reuses within a day.

   The sketch knows almost nothing about this. It calls GardenSocial.open(f)
   when a bloom is tapped, and that is the whole contract.
   ========================================================================= */
(function () {
  "use strict";

  var CFG = (typeof window.readSupabaseConfig === "function")
    ? window.readSupabaseConfig() : null;

  var sb = null;
  var me = null;          /* the signed in user, or null */
  var myProfile = null;   /* their row in profiles, once fetched */

  /* --------------------------------------------------------------- styles */
  /* Injected rather than added to shared-garden-style.css, the way the music
     engine does it, so the whole feature is one file that a page switches on
     with a single script tag. */
  var CSS =
    '#gs-panel{position:fixed;top:0;right:0;bottom:0;width:360px;max-width:100%;' +
      'z-index:500;background:snow;border-left:1px solid #d9ece9;' +
      'box-shadow:-8px 0 28px rgba(29,100,102,0.12);' +
      'font-family:Arial,Helvetica,sans-serif;color:#1d6466;' +
      'display:flex;flex-direction:column;' +
      'transform:translateX(102%);transition:transform .28s ease;}' +
    '#gs-panel[data-open="1"]{transform:none;}' +
    '@media (prefers-reduced-motion:reduce){#gs-panel{transition:none;}}' +
    /* A full height sheet on a phone would cover the garden it is about. */
    '@media (max-width:560px){#gs-panel{top:auto;left:0;width:auto;height:74vh;' +
      'border-left:none;border-top:1px solid #d9ece9;border-radius:18px 18px 0 0;' +
      'box-shadow:0 -8px 28px rgba(29,100,102,0.16);' +
      'transform:translateY(102%);}}' +

    '#gs-head{padding:20px 20px 14px;border-bottom:1px solid #eaf4f2;position:relative;}' +
    '#gs-close{position:absolute;top:12px;right:12px;width:30px;height:30px;' +
      'border-radius:50%;border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);' +
      'color:#1d6466;font-size:16px;line-height:1;cursor:pointer;padding:0;}' +
    '#gs-close:hover{background:#e1f7f7;}' +
    '.gs-species{display:flex;align-items:center;gap:9px;margin-bottom:10px;}' +
    '.gs-dot{width:16px;height:16px;border-radius:50%;flex:0 0 auto;' +
      'box-shadow:0 0 0 1px rgba(29,100,102,0.18);}' +
    '.gs-species b{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:17px;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#0f5132;}" +
    '.gs-species span{font-size:12.5px;color:#5a8f8d;}' +
    '#gs-word{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:20px;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;" +
      'color:#0f5132;line-height:1.38;margin:0 0 8px;padding-right:26px;}' +
    '#gs-planter{font-size:13px;color:#2c7a7b;margin:0;}' +

    '#gs-actions{display:flex;align-items:center;gap:10px;padding:14px 20px;' +
      'border-bottom:1px solid #eaf4f2;}' +
    '#gs-like{display:inline-flex;align-items:center;gap:7px;padding:8px 15px;' +
      'border-radius:50px;border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);' +
      'color:#1d6466;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;' +
      'transition:background .18s,transform .14s,border-color .18s;}' +
    '#gs-like:hover:not(:disabled){background:#e1f7f7;transform:translateY(-1px);}' +
    '#gs-like:disabled{cursor:not-allowed;opacity:.65;}' +
    '#gs-like[data-mine="1"]{background:#ffe3ec;border-color:#f3b9cd;color:#a6355c;}' +
    '#gs-like svg{width:16px;height:16px;display:block;}' +
    '#gs-likecount{font-size:13px;color:#5a8f8d;}' +

    '#gs-list{flex:1 1 auto;overflow-y:auto;padding:16px 20px;}' +
    '.gs-comment{display:flex;gap:10px;margin-bottom:15px;}' +
    '.gs-av{width:30px;height:30px;border-radius:50%;flex:0 0 auto;display:flex;' +
      'align-items:center;justify-content:center;font-size:13px;font-weight:700;' +
      'color:snow;background:#8fcfbe;}' +
    '.gs-cbody{min-width:0;}' +
    '.gs-cname{font-size:13px;font-weight:700;color:#0f5132;}' +
    '.gs-cwhen{font-size:11.5px;color:#8aa9a7;margin-left:6px;font-weight:400;}' +
    '.gs-ctext{font-size:14px;line-height:1.5;color:#2f6260;margin-top:2px;' +
      'overflow-wrap:anywhere;}' +
    '.gs-empty{font-size:13.5px;color:#8aa9a7;line-height:1.6;}' +

    '#gs-foot{padding:14px 20px 18px;border-top:1px solid #eaf4f2;}' +
    '#gs-foot textarea{width:100%;box-sizing:border-box;min-height:62px;resize:vertical;' +
      'padding:11px 13px;border:1.5px solid #d9ece9;border-radius:12px;' +
      'font-family:inherit;font-size:14px;color:#1d6466;background:#fdfefe;}' +
    '#gs-foot textarea:focus{outline:none;border-color:#7fcdcd;}' +
    '#gs-foot input{width:100%;box-sizing:border-box;padding:11px 13px;margin-bottom:9px;' +
      'border:1.5px solid #d9ece9;border-radius:12px;font-family:inherit;font-size:14px;' +
      'color:#1d6466;background:#fdfefe;}' +
    '#gs-foot input:focus{outline:none;border-color:#7fcdcd;}' +
    '.gs-btn{width:100%;margin-top:10px;padding:12px 16px;border:none;border-radius:12px;' +
      'background:mediumturquoise;color:snow;font-size:16px;font-weight:700;' +
      'font-family:inherit;cursor:pointer;transition:transform .15s,background .15s;}' +
    '.gs-btn:hover:not(:disabled){transform:scale(1.02);background:turquoise;}' +
    '.gs-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}' +
    '.gs-link{display:block;width:100%;margin-top:9px;background:none;border:none;' +
      'color:#2c7a7b;font-family:inherit;font-size:13px;text-decoration:underline;' +
      'cursor:pointer;padding:0;}' +
    '.gs-note{font-size:13px;color:#5a8f8d;line-height:1.5;margin:0 0 10px;}' +
    '.gs-err{font-size:13px;color:#b3261e;line-height:1.5;margin:9px 0 0;}' +
    '.gs-ok{font-size:13px;color:#2c7a7b;line-height:1.5;margin:9px 0 0;}' +
    '#gs-count{font-size:11.5px;color:#8aa9a7;text-align:right;margin-top:5px;}';

  var HEART =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 20.3 4.3 12.9a4.6 4.6 0 1 1 6.5-6.5l1.2 1.2 1.2-1.2a4.6 4.6 0 1 1 6.5 6.5z"/>' +
    '</svg>';

  var MAX_COMMENT = 280;

  /* ----------------------------------------------------------------- dom */
  var panel, elWord, elPlanter, elSpecies, elDot, elMeaning,
      elLike, elLikeCount, elList, elFoot;
  var openFlower = null;      /* the bloom the panel is about */
  var openPost = null;        /* its row in posts, once there is one */
  var busy = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    panel = el("div");
    panel.id = "gs-panel";
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");

    var head = el("div"); head.id = "gs-head";
    var close = el("button");
    close.innerHTML =
      '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M3 3l8 8M11 3l-8 8"/></svg>';
    close.id = "gs-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closePanel);

    elWord = el("p"); elWord.id = "gs-word";
    elPlanter = el("p"); elPlanter.id = "gs-planter";

    var sp = el("div", "gs-species");
    elDot = el("span", "gs-dot");
    elSpecies = el("b");
    elMeaning = el("span");
    sp.appendChild(elDot); sp.appendChild(elSpecies); sp.appendChild(elMeaning);

    head.appendChild(close);
    head.appendChild(elWord);
    head.appendChild(elPlanter);
    head.appendChild(sp);

    var actions = el("div"); actions.id = "gs-actions";
    elLike = el("button");
    elLike.id = "gs-like";
    elLike.type = "button";
    elLike.innerHTML = HEART + "<span>Like</span>";
    elLike.addEventListener("click", toggleLike);
    elLikeCount = el("span"); elLikeCount.id = "gs-likecount";
    actions.appendChild(elLike);
    actions.appendChild(elLikeCount);

    elList = el("div"); elList.id = "gs-list";
    elFoot = el("div"); elFoot.id = "gs-foot";

    panel.appendChild(head);
    panel.appendChild(actions);
    panel.appendChild(elList);
    panel.appendChild(elFoot);
    document.body.appendChild(panel);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.getAttribute("data-open") === "1") closePanel();
    });

    /* A tap anywhere else shuts it. `pointerdown` rather than `click`, so it
       closes as the finger lands rather than when it lifts, and the button
       itself is excluded or opening it would immediately close it again. */
    document.addEventListener("pointerdown", function (e) {
      if (panel.getAttribute("data-open") !== "1") return;
      if (panel.contains(e.target)) return;
      /* ONE exception: the garden canvas is this panel's own toggle, and
         the sketch already decides there, opening it on a bloom and
         closing it on empty ground. Closing here too would shut the panel
         a fraction before the sketch opened it for the bloom just tapped. */
      if (e.target && e.target.tagName === "CANVAS") return;
      closePanel();
    });
  }

  /* --------------------------------------------------------------- helpers */
  function nameOf(profile, userId) {
    if (profile && (profile.display_name || profile.username)) {
      return profile.display_name || profile.username;
    }
    /* Somebody who commented before they had a profile row. Better a stable
       stub than a blank line where a name should be. */
    return "Someone" + (userId ? " " + String(userId).slice(0, 4) : "");
  }

  function initial(name) {
    var c = (name || "?").trim().charAt(0);
    return c ? c.toUpperCase() : "?";
  }

  /* Whole days only. A garden that resets daily makes "3 days ago" the useful
     unit, and a clock time would be read as the time in the reader's own
     zone, which it is not. */
  function whenFrom(iso) {
    var then = Date.parse(iso);
    if (isNaN(then)) return "";
    var mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? " hour ago" : " hours ago");
    var days = Math.floor(hrs / 24);
    return days + (days === 1 ? " day ago" : " days ago");
  }


  function titleCase(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function hsl(f) {
    return "hsl(" + (f.hue || 0) + "," + (f.sat || 60) + "%," + (f.light || 65) + "%)";
  }

  /* --------------------------------------------------------------- backend */
  /* The sketch declares `roomKey` with `let` and `speciesList` with `const`,
     and neither of those lands on `window` in a classic script, so the sketch
     hands both over at the call site rather than this file reaching for
     globals that are not there. Reaching for them was the first attempt and
     it read every flower as belonging to "garden-unknown", which is one
     bucket for every day at once. */
  var ctxDay = "garden-unknown";
  var ctxMeaning = "";

  function dayKey() { return ctxDay; }

  /* Supabase answers a query against a column that does not exist with a 400
     and an error OBJECT, not a thrown exception, so a plain `res.data` read
     turns "you have not run the SQL yet" into "this flower has no comments".
     That is the single most likely thing to go wrong when somebody sets this
     up, so it is named once in the console and shown honestly in the panel
     rather than quietly looking empty. */
  var schemaMissing = false;

  function noteError(err) {
    if (!err) return false;
    var m = String(err.message || "");
    if (/column|schema cache|does not exist|relation/i.test(m)) {
      if (!schemaMissing) {
        schemaMissing = true;
        console.warn("[Gratitude Garden] Likes and comments are not set up yet. " +
          "Run the SQL in Step 6 of SUPABASE-SETUP.md. Supabase said: " + m);
      }
      return true;
    }
    return false;
  }

  function findPost(flower) {
    return sb.from("posts").select("*")
      .eq("kind", "shared_flower")
      .eq("day", dayKey())
      .eq("created_index", flower.createdIndex)
      .maybeSingle()
      .then(function (res) { noteError(res.error); return res; });
  }

  /* Created only when somebody signed in opens the bloom. An anonymous reader
     gets whatever already exists and nothing more, which is why an unvisited
     flower simply shows no comments rather than an error. */
  function ensurePost(flower) {
    return findPost(flower).then(function (res) {
      if (res.data) return res.data;
      if (!me) return null;
      return sb.from("posts").insert({
        kind: "shared_flower",
        day: dayKey(),
        created_index: flower.createdIndex,
        caption: flower.gratitude || "",
        planter: flower.word || "",
        species: flower.species || "daisy",
        hue: Math.round(flower.hue || 0),
        sat: Math.round(flower.sat || 60),
        light: Math.round(flower.light || 65),
        anchored_by: me.id
      }).select().maybeSingle().then(function (ins) {
        /* Two people can open the same bloom in the same second. The unique
           index is what stops the comments splitting across two rows, and
           losing that race is normal, not an error: read back the row the
           other person just made. */
        if (ins.error) {
          noteError(ins.error);
          return findPost(flower).then(function (r2) { return r2.data || null; });
        }
        return ins.data;
      });
    });
  }

  function loadReactions(post) {
    if (!post) return Promise.resolve({ likes: 0, mine: false, comments: [] });
    return Promise.all([
      sb.from("likes").select("user_id").eq("post_id", post.id),
      sb.from("comments").select("id,body,user_id,created_at")
        .eq("post_id", post.id).order("created_at", { ascending: true })
    ]).then(function (r) {
      var likes = (r[0].data || []);
      var comments = (r[1].data || []);
      var ids = {};
      comments.forEach(function (c) { if (c.user_id) ids[c.user_id] = 1; });
      var list = Object.keys(ids);
      /* One query for every commenter rather than an embedded join. The join
         would need a foreign key from comments straight to profiles, and this
         schema points at auth.users, so asking for it would be a guess about
         somebody else's database. */
      var profiles = list.length
        ? sb.from("profiles").select("id,username,display_name").in("id", list)
        : Promise.resolve({ data: [] });
      return Promise.resolve(profiles).then(function (pr) {
        var byId = {};
        (pr.data || []).forEach(function (p) { byId[p.id] = p; });
        return {
          likes: likes.length,
          mine: !!(me && likes.some(function (l) { return l.user_id === me.id; })),
          comments: comments.map(function (c) {
            return { id: c.id, body: c.body, when: c.created_at,
                     name: nameOf(byId[c.user_id], c.user_id) };
          })
        };
      });
    });
  }

  /* Profiles belong to garden-account.js, which is also what puts the
     username claim screen in front of somebody who has just signed up. This
     file only ever READS a name. */
  function ensureProfile() {
    var acc = window.GardenAccount;
    if (!acc || !acc.isLive()) return Promise.resolve(null);
    return acc.refresh().then(function () { myProfile = acc.profile(); return myProfile; });
  }

  /* ----------------------------------------------------------------- views */
  function renderHead(f) {
    elWord.textContent = f.gratitude || "";
    elPlanter.textContent = "Planted by " + (f.word || "someone");
    elDot.style.background = hsl(f);
    elSpecies.textContent = titleCase(f.species);
    elMeaning.textContent = ctxMeaning ? "\u00b7 " + ctxMeaning : "";
  }

  function renderReactions(data) {
    elLikeCount.textContent = data.likes === 1 ? "1 like" : data.likes + " likes";
    elLike.setAttribute("data-mine", data.mine ? "1" : "0");
    elLike.querySelector("span").textContent = data.mine ? "Liked" : "Like";
    elLike.disabled = !me || busy;
    elLike.title = me ? "" : "Sign in to like this flower";

    elList.innerHTML = "";
    if (!data.comments.length) {
      elList.appendChild(el("p", "gs-empty",
        me ? "No comments yet. Say something kind."
           : "No comments yet."));
      return;
    }
    data.comments.forEach(function (c) {
      var row = el("div", "gs-comment");
      var av = el("div", "gs-av", initial(c.name));
      var body = el("div", "gs-cbody");
      var nm = el("div", "gs-cname", c.name);
      var wh = el("span", "gs-cwhen", whenFrom(c.when));
      nm.appendChild(wh);
      body.appendChild(nm);
      body.appendChild(el("div", "gs-ctext", c.body));
      row.appendChild(av);
      row.appendChild(body);
      elList.appendChild(row);
    });
    elList.scrollTop = elList.scrollHeight;
  }

  function renderFoot() {
    elFoot.innerHTML = "";
    if (me) {
      var ta = el("textarea");
      ta.maxLength = MAX_COMMENT;
      ta.placeholder = "Leave a kind word";
      var count = el("div", null, "0/" + MAX_COMMENT);
      count.id = "gs-count";
      var send = el("button", "gs-btn", "Post comment");
      send.type = "button";
      send.disabled = true;
      ta.addEventListener("input", function () {
        count.textContent = ta.value.length + "/" + MAX_COMMENT;
        send.disabled = !ta.value.trim() || busy;
      });
      send.addEventListener("click", function () { postComment(ta.value, send); });
      elFoot.appendChild(ta);
      elFoot.appendChild(count);
      elFoot.appendChild(send);
      return;
    }
    signInForm();
  }

  /* The sign in form lives INSIDE the panel and appears only when somebody
     reaches for a like or a comment. A gate on the page itself was the other
     option and it was refused on purpose: the shared garden is the one place
     anyone can try in ten seconds, and asking for an account at the door
     would cost that to buy a feature most visitors never touch. */
  function signInForm(mode) {
    mode = mode || "in";
    elFoot.innerHTML = "";
    elFoot.appendChild(el("p", "gs-note",
      mode === "in"
        ? "Sign in to like this flower or leave a comment. Planting never needs an account."
        : "Create an account to like and comment. Planting never needs one."));

    var email = el("input"); email.type = "email"; email.placeholder = "Email";
    email.autocomplete = "email";
    var pass = el("input"); pass.type = "password";
    pass.placeholder = mode === "in" ? "Password" : "Password, at least 6 characters";
    pass.autocomplete = mode === "in" ? "current-password" : "new-password";

    var go = el("button", "gs-btn", mode === "in" ? "Sign in" : "Create account");
    go.type = "button";
    var swap = el("button", "gs-link",
      mode === "in" ? "New here? Create an account" : "Already have an account? Sign in");
    swap.type = "button";
    swap.addEventListener("click", function () { signInForm(mode === "in" ? "up" : "in"); });

    var msg = el("p", "gs-err");
    msg.style.display = "none";

    go.addEventListener("click", function () {
      var e = email.value.trim(), p = pass.value;
      if (!e || !p) { say(msg, "gs-err", "Both an email and a password are needed."); return; }
      go.disabled = true;
      go.textContent = mode === "in" ? "Signing in" : "Creating";
      var call = mode === "in"
        ? sb.auth.signInWithPassword({ email: e, password: p })
        : sb.auth.signUp({ email: e, password: p });
      call.then(function (res) {
        go.disabled = false;
        go.textContent = mode === "in" ? "Sign in" : "Create account";
        if (res.error) { say(msg, "gs-err", res.error.message); return; }
        /* With confirmation emails left on, signUp returns a user and NO
           session. Saying "check your email" is the only honest answer; the
           panel would otherwise sit there looking signed in and every write
           would be refused. */
        if (!res.data || !res.data.session) {
          say(msg, "gs-ok", "Check your email for a confirmation link, then come back and sign in.");
          return;
        }
        /* onAuthStateChange repaints the panel. */
      }).catch(function () {
        go.disabled = false;
        go.textContent = mode === "in" ? "Sign in" : "Create account";
        say(msg, "gs-err", "Could not reach the garden. Check your connection.");
      });
    });

    [email, pass].forEach(function (f) {
      f.addEventListener("keydown", function (ev) { if (ev.key === "Enter") go.click(); });
    });

    elFoot.appendChild(email);
    elFoot.appendChild(pass);
    elFoot.appendChild(go);
    elFoot.appendChild(swap);
    elFoot.appendChild(msg);
  }

  function say(node, cls, text) {
    node.className = cls;
    node.textContent = text;
    node.style.display = "";
  }

  /* ---------------------------------------------------------------- actions */
  function refresh() {
    if (!openFlower) return Promise.resolve();
    return ensurePost(openFlower).then(function (post) {
      openPost = post;
      if (schemaMissing) throw new Error("schema");
      return loadReactions(post);
    }).then(renderReactions)
      .catch(showLoadFailure);
  }

  function showLoadFailure() {
    elLike.disabled = true;
    elLikeCount.textContent = "";
    elList.innerHTML = "";
    elList.appendChild(el("p", "gs-empty", schemaMissing
      ? "Likes and comments are not switched on for this project yet. Step 6 of SUPABASE-SETUP.md has the one query that turns them on."
      : "Could not load the comments on this flower just now."));
  }

  function toggleLike() {
    if (!me || busy || !openFlower) return;
    busy = true;
    elLike.disabled = true;
    var wasMine = elLike.getAttribute("data-mine") === "1";
    ensurePost(openFlower).then(function (post) {
      openPost = post;
      if (!post) return null;
      return wasMine
        ? sb.from("likes").delete().eq("post_id", post.id).eq("user_id", me.id)
        : sb.from("likes").insert({ post_id: post.id, user_id: me.id });
    }).then(function () {
      busy = false;
      return refresh();
    }).catch(function () { busy = false; refresh(); });
  }

  function postComment(text, btn) {
    text = String(text || "").trim();
    if (!me || !text || busy || !openFlower) return;
    busy = true;
    btn.disabled = true;
    btn.textContent = "Posting";
    ensurePost(openFlower).then(function (post) {
      openPost = post;
      if (!post) throw new Error("no post");
      return sb.from("comments").insert({
        post_id: post.id, user_id: me.id, body: text.slice(0, MAX_COMMENT)
      });
    }).then(function () {
      busy = false;
      renderFoot();
      return refresh();
    }).catch(function () {
      busy = false;
      btn.disabled = false;
      btn.textContent = "Post comment";
    });
  }

  /* ------------------------------------------------------------------ open */
  function openPanel(flower, ctx) {
    if (!panel || !flower) return;
    if (ctx && ctx.day) ctxDay = ctx.day;
    ctxMeaning = (ctx && ctx.meaning) || "";
    openFlower = flower;
    openPost = null;
    renderHead(flower);
    elLikeCount.textContent = "";
    elLike.setAttribute("data-mine", "0");
    elLike.disabled = true;
    elList.innerHTML = "";
    elList.appendChild(el("p", "gs-empty", "Loading"));
    renderFoot();
    panel.setAttribute("data-open", "1");
    panel.setAttribute("aria-hidden", "false");
    refresh();
  }

  function closePanel() {
    if (!panel) return;
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");
    openFlower = null;
    openPost = null;
  }

  /* ------------------------------------------------------------------ boot */
  function ready() {
    build();

    sb.auth.onAuthStateChange(function (_evt, session) {
      me = (session && session.user) || null;
      myProfile = null;
      if (me) ensureProfile();
      if (openFlower) { renderFoot(); refresh(); }
    });

    sb.auth.getSession().then(function (res) {
      me = (res && res.data && res.data.session && res.data.session.user) || null;
      if (me) ensureProfile();
      if (openFlower) { renderFoot(); refresh(); }
    }).catch(function () {});
  }

  /* The whole feature is optional. With no project configured, or with the
     Supabase library missing, `open` does nothing and the garden behaves
     exactly as it did before any of this existed. */
  var live = false;
  if (CFG && window.supabase && window.supabase.createClient) {
    /* Borrowed from garden-account.js rather than made here, so this panel
       and the friends list are signed into the same session. */
    sb = (window.GardenAccount && window.GardenAccount.isLive())
      ? window.GardenAccount.client()
      : window.supabase.createClient(CFG.url, CFG.key);
    live = true;
    if (document.body) ready();
    else document.addEventListener("DOMContentLoaded", ready);
  } else if (!CFG) {
    console.warn("[Gratitude Garden] Likes and comments are off in the shared garden. " +
      "See the console line above, and SUPABASE-SETUP.md.");
  }

  window.GardenSocial = {
    open: function (f, ctx) { if (live) openPanel(f, ctx); },
    close: closePanel,
    isLive: function () { return live; },
    signedIn: function () { return !!me; }
  };
})();
