/* =========================================================================
   garden-journal.js  -  the day by day HISTORY, for both gardens

   The panel is called History on screen. It was Journal, and that word was
   already taken: the personal garden asks for a journal ENTRY on the day it
   plants, so one word named both the thing you write and the record of every
   day you wrote one. The file keeps its name, since every page loads it by
   that name and renaming it would break four script tags for a word.

   A week strip: seven days across, with the flower planted that day drawn
   under each one. Tapping a day opens what was planted.

   The two gardens need very different things from it, and the difference is
   the whole design:

     personal   NOTHING new is stored. Every flower already carries its own
                date, mood, shaper and journal entry, and that array already
                syncs to the account, so the log is a view of data the garden
                has always had.
     shared     everything has to be written down, because p5.party's room is
                keyed by the date and the demo server does not keep a room
                once its day has passed. Checked: loading four past room keys
                returns objects with no `flowers` in them at all.

   So the shared side writes two things as a flower is planted: a row in
   garden_entries, which is yours alone and draws your icon in the strip, and
   a snapshot of the whole meadow in shared_days, which is public and is what
   a past day replays from.

   Neither needs an account to WORK. Without one, both fall back to this
   browser's own storage, which means the strip still fills in and only the
   whole-meadow replay is missing.
   ========================================================================= */
(function () {
  "use strict";

  var LOCAL = "gg_journal";          /* { personal: {day: entry}, shared: {...} } */
  var DAY_MS = 86400000;
  var WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function acct() { return window.GardenAccount; }
  function live() { var a = acct(); return !!(a && a.isLive()); }
  function sb() { var a = acct(); return a && a.client(); }
  function uid() { var a = acct(); var u = a && a.user(); return u ? u.id : null; }

  /* ------------------------------------------------------------------ dates */
  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function today() { return iso(new Date()); }

  /* The personal garden stores MM/DD/YYYY on every flower, which is what its
     labels print. Everything in here works in YYYY-MM-DD so that days sort
     as strings, so that is the one conversion. */
  function fromUS(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || "").trim());
    if (!m) return "";
    return m[3] + "-" + m[1].padStart(2, "0") + "-" + m[2].padStart(2, "0");
  }
  function parseIso(s) {
    var p = String(s || "").split("-");
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }
  function prettyDay(s) {
    var d = parseIso(s);
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  }

  /* ----------------------------------------------------------------- store */
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function writeLocal(all) {
    try { localStorage.setItem(LOCAL, JSON.stringify(all)); } catch (e) {}
  }

  /* Written to BOTH every time. The browser copy is what makes the log work
     with no account at all; the account copy is what makes it follow somebody
     to another device. They are merged on read, account first. */
  function record(garden, entry) {
    if (!entry || !entry.day) return Promise.resolve();
    var all = readLocal();
    all[garden] = all[garden] || {};
    all[garden][entry.day] = entry;
    writeLocal(all);

    if (!live() || !uid()) return Promise.resolve();
    return sb().from("garden_entries").upsert({
      user_id: uid(),
      garden: garden,
      day: entry.day,
      species: entry.species || "daisy",
      hue: Math.round(entry.hue || 0),
      sat: Math.round(entry.sat || 60),
      light: Math.round(entry.light || 65),
      word: String(entry.word || ""),
      note: String(entry.note || "")
    }, { onConflict: "user_id,garden,day" })
      .then(function () {})
      .catch(function () {});
  }

  function cloudEntries(garden) {
    if (!live() || !uid()) return Promise.resolve({});
    return sb().from("garden_entries").select("*").eq("garden", garden)
      .then(function (res) {
        var byDay = {};
        (res.data || []).forEach(function (r) { byDay[r.day] = r; });
        return byDay;
      })
      .catch(function () { return {}; });
  }

  /* The whole meadow, kept only because the room it came from is gone by
     morning. Written by whoever is signed in and standing in the garden. */
  function snapshot(day, flowers) {
    if (!live() || !uid() || !day || !Array.isArray(flowers) || !flowers.length) {
      return Promise.resolve();
    }
    var slim = flowers.map(function (f) {
      return {
        word: String(f.word || ""), gratitude: String(f.gratitude || ""),
        species: f.species || "daisy", hue: Math.round(f.hue || 0),
        sat: Math.round(f.sat || 60), light: Math.round(f.light || 65)
      };
    });
    return sb().from("shared_days").upsert({
      day: day, flowers: slim, updated_by: uid(), updated_at: new Date().toISOString()
    }, { onConflict: "day" }).then(function () {}).catch(function () {});
  }

  function sharedDay(day) {
    if (!live()) return Promise.resolve(null);
    return sb().from("shared_days").select("flowers").eq("day", day).maybeSingle()
      .then(function (res) { return (res.data && res.data.flowers) || null; })
      .catch(function () { return null; });
  }

  /* ---------------------------------------------------------------- styles */
  var CSS =
    /* Slot 2 of the top right row of round icons: music at right 16, the
       account at 62, this at 108, Save PNG at 154. It used to be a labelled
       pill in the BOTTOM LEFT, which is where the Garden Tips card lives, so
       it sat straight on top of it. */
    '#gj-btn{position:fixed;top:20px;right:108px;z-index:261;' +
      'width:38px;height:38px;border-radius:50%;padding:0;' +
      'display:flex;align-items:center;justify-content:center;' +
      'border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);color:#1d6466;' +
      'cursor:pointer;box-shadow:0 2px 10px rgba(29,100,102,0.14);' +
      'transition:background .2s,transform .15s;}' +
    '#gj-btn:hover{background:#e1f7f7;transform:translateY(-1px);}' +
    '#gj-btn:focus-visible{outline:2px solid #1d6466;outline-offset:2px;}' +
    '#gj-btn svg{width:18px;height:18px;display:block;}' +
    '@media (max-width:768px){#gj-btn{top:16px;right:96px;width:34px;height:34px;}' +
      '#gj-btn svg{width:16px;height:16px;}}' +

    /* Opens from the LEFT, which is the side its button is on, and which also
       means it can never be confused with the friends panel on the right. */
    '#gj-panel{position:fixed;top:0;left:0;bottom:0;width:390px;max-width:100%;z-index:540;' +
      'background:snow;border-right:1px solid #d9ece9;box-shadow:8px 0 28px rgba(29,100,102,0.12);' +
      'font-family:Arial,Helvetica,sans-serif;color:#1d6466;display:flex;flex-direction:column;' +
      'transform:translateX(-102%);transition:transform .28s ease;}' +
    '#gj-panel[data-open="1"]{transform:none;}' +
    '@media (prefers-reduced-motion:reduce){#gj-panel{transition:none;}}' +
    '@media (max-width:560px){#gj-panel{top:auto;right:0;width:auto;height:78vh;' +
      'border-right:none;border-top:1px solid #d9ece9;border-radius:18px 18px 0 0;' +
      'box-shadow:0 -8px 28px rgba(29,100,102,0.16);transform:translateY(102%);}}' +

    '#gj-head{padding:18px 20px 14px;border-bottom:1px solid #eaf4f2;position:relative;}' +
    '#gj-head h2{font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:600;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#0f5132;margin:0 0 12px;}" +
    '#gj-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;' +
      'border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);color:#1d6466;cursor:pointer;' +
      'padding:0;display:flex;align-items:center;justify-content:center;}' +
    '#gj-close:hover{background:#e1f7f7;}' +
    '.gj-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;}' +
    '.gj-nav span{font-size:13px;color:#2c7a7b;font-weight:700;}' +
    '.gj-arrow{width:28px;height:28px;border-radius:50%;border:1.5px solid #d9ece9;' +
      'background:none;color:#1d6466;cursor:pointer;padding:0;' +
      'display:flex;align-items:center;justify-content:center;}' +
    '.gj-arrow:hover:not(:disabled){background:#e1f7f7;}' +
    '.gj-arrow:disabled{opacity:.35;cursor:not-allowed;}' +

    '#gj-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:14px 12px 12px;' +
      'border-bottom:1px solid #eaf4f2;}' +
    '.gj-day{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 1px 7px;' +
      'border:1.5px solid transparent;border-radius:12px;background:none;cursor:pointer;' +
      'font-family:inherit;}' +
    '.gj-day:hover{background:#f2faf9;}' +
    '.gj-day[data-on="1"]{border-color:#7fcdcd;background:#eefaf8;}' +
    '.gj-day[data-today="1"] .gj-num{color:#0f5132;font-weight:700;}' +
    '.gj-dow{font-size:10.5px;letter-spacing:.04em;color:#8aa9a7;text-transform:uppercase;}' +
    '.gj-num{font-size:12px;color:#5a8f8d;}' +
    '.gj-slot{width:38px;height:38px;display:flex;align-items:center;justify-content:center;}' +
    '.gj-slot canvas{width:38px;height:38px;display:block;}' +
    '.gj-empty-dot{width:9px;height:9px;border-radius:50%;background:#e6efed;}' +
    '.gj-day:disabled{cursor:default;}' +
    '.gj-day:disabled:hover{background:none;}' +

    '#gj-body{flex:1 1 auto;overflow-y:auto;padding:16px 20px 20px;}' +
    '.gj-date{font-family:Fraunces,Georgia,serif;font-size:17px;font-weight:600;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#0f5132;margin:0 0 10px;}" +
    '.gj-species{font-size:14px;font-weight:700;color:#0f5132;margin:0 0 2px;}' +
    '.gj-meaning{font-size:13px;color:#5a8f8d;margin:0 0 12px;}' +
    '.gj-field{font-size:13.5px;color:#2f6260;line-height:1.55;margin:0 0 7px;}' +
    '.gj-field b{color:#0f5132;}' +
    '.gj-quote{font-size:14px;color:#2f6260;line-height:1.6;margin:0 0 12px;' +
      'padding-left:11px;border-left:2.5px solid #bde0d6;overflow-wrap:anywhere;}' +
    '.gj-none{font-size:13.5px;color:#8aa9a7;line-height:1.6;margin:0;}' +
    '.gj-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#8aa9a7;margin:18px 0 9px;}' +
    '.gj-row{display:flex;align-items:flex-start;gap:10px;padding:8px 0;' +
      'border-bottom:1px solid #f1f7f6;}' +
    '.gj-row:last-child{border-bottom:none;}' +
    '.gj-row canvas{width:34px;height:34px;flex:0 0 auto;display:block;}' +
    '.gj-row .gj-who{min-width:0;}' +
    '.gj-row b{display:block;font-size:13px;color:#0f5132;}' +
    '.gj-row p{font-size:13px;color:#2f6260;line-height:1.5;margin:2px 0 0;' +
      'overflow-wrap:anywhere;}' +
    '.gj-mine{border-left:2.5px solid #7fcdcd;padding-left:9px;margin-left:-11px;}';

  var BOOK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5z"/>' +
    '<path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H19"/></svg>';
  var CHEV_L = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2l5 5-5 5"/></svg>';
  var X_ICON = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* --------------------------------------------------------------- the panel */
  var cfg = null;               /* { garden, entries(), meaning(), paint() } */
  var panel, strip, body, navLabel, prevBtn, nextBtn, btn;
  var weekStart = null;         /* Date of the Sunday shown */
  var chosen = null;            /* the day open below the strip */
  var byDay = {};               /* every day we know about */

  function startOfWeek(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - x.getDay());
    return x;
  }

  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    btn = el("button");
    btn.id = "gj-btn";
    btn.type = "button";
    btn.innerHTML = BOOK;
    /* "History", not "Journal". The personal garden already asks for a journal
       ENTRY on the day it plants, so one word was doing two jobs: the thing
       you write, and the record of every day you wrote one. There is
       deliberately no `title`, since the browser's own tooltip would arrive on
       top of the project's own hover label. */
    btn.setAttribute("aria-label", "History");
    btn.setAttribute("data-tip", "History");
    btn.addEventListener("click", function () {
      if (panel.getAttribute("data-open") === "1") close(); else open();
    });

    panel = el("div");
    panel.id = "gj-panel";
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");

    var head = el("div"); head.id = "gj-head";
    var x = el("button"); x.id = "gj-close"; x.type = "button";
    x.setAttribute("aria-label", "Close");
    x.innerHTML = X_ICON;
    x.addEventListener("click", close);
    head.appendChild(x);
    head.appendChild(el("h2", null, "History"));

    var nav = el("div", "gj-nav");
    prevBtn = el("button", "gj-arrow"); prevBtn.type = "button";
    prevBtn.innerHTML = CHEV_L;
    prevBtn.setAttribute("aria-label", "Earlier week");
    prevBtn.addEventListener("click", function () { shiftWeek(-7); });
    nextBtn = el("button", "gj-arrow"); nextBtn.type = "button";
    nextBtn.innerHTML = CHEV_R;
    nextBtn.setAttribute("aria-label", "Later week");
    nextBtn.addEventListener("click", function () { shiftWeek(7); });
    navLabel = el("span");
    nav.appendChild(prevBtn); nav.appendChild(navLabel); nav.appendChild(nextBtn);
    head.appendChild(nav);

    strip = el("div"); strip.id = "gj-strip";
    body = el("div"); body.id = "gj-body";

    panel.appendChild(head);
    panel.appendChild(strip);
    panel.appendChild(body);
    document.body.appendChild(btn);
    document.body.appendChild(panel);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.getAttribute("data-open") === "1") close();
    });

    /* A tap anywhere else shuts it. `pointerdown` rather than `click`, so it
       closes as the finger lands rather than when it lifts, and the button
       itself is excluded or opening it would immediately close it again. */
    document.addEventListener("pointerdown", function (e) {
      if (panel.getAttribute("data-open") !== "1") return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      close();
    });
  }

  function shiftWeek(n) {
    weekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + n);
    drawStrip();
  }

  function open() {
    panel.setAttribute("data-open", "1");
    panel.setAttribute("aria-hidden", "false");
    refresh();
  }
  function close() {
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");
  }

  function refresh() {
    var local = readLocal()[cfg.garden] || {};
    Promise.all([cfg.entries ? cfg.entries() : {}, cloudEntries(cfg.garden)])
      .then(function (r) {
        /* Three sources, merged in order of how much they can be trusted:
           the garden's own data first, then the account, then this browser. */
        byDay = {};
        Object.keys(local).forEach(function (d) { byDay[d] = local[d]; });
        Object.keys(r[1]).forEach(function (d) { byDay[d] = r[1][d]; });
        Object.keys(r[0] || {}).forEach(function (d) { byDay[d] = r[0][d]; });
        if (!weekStart) weekStart = startOfWeek(new Date());
        if (!chosen) chosen = today();
        drawStrip();
      });
  }

  function drawStrip() {
    strip.innerHTML = "";
    var t = today();
    for (var i = 0; i < 7; i++) {
      (function (i) {
        var d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        var key = iso(d);
        var entry = byDay[key];
        var cell = el("button", "gj-day");
        cell.type = "button";
        cell.setAttribute("data-on", key === chosen ? "1" : "0");
        cell.setAttribute("data-today", key === t ? "1" : "0");
        cell.appendChild(el("span", "gj-dow", WEEKDAY[d.getDay()]));
        var slot = el("span", "gj-slot");
        if (entry) {
          var cv = document.createElement("canvas");
          cv.width = 76; cv.height = 76;       /* twice the drawn size, for retina */
          slot.appendChild(cv);
          if (cfg.paint) cfg.paint(cv, entry.species, entry.hue);
        } else {
          slot.appendChild(el("span", "gj-empty-dot"));
        }
        cell.appendChild(slot);
        cell.appendChild(el("span", "gj-num", String(d.getDate())));
        /* A day in the future is not a blank page, it has not happened. */
        if (key > t) cell.disabled = true;
        cell.addEventListener("click", function () { chosen = key; drawStrip(); });
        strip.appendChild(cell);
      })(i);
    }

    var endOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    navLabel.textContent = weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
      " to " + endOfWeek.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    nextBtn.disabled = iso(endOfWeek) >= today();

    drawDetail();
  }

  function drawDetail() {
    body.innerHTML = "";
    body.appendChild(el("p", "gj-date", prettyDay(chosen)));
    var e = byDay[chosen];

    if (!e) {
      body.appendChild(el("p", "gj-none", chosen === today()
        ? "Nothing planted yet today."
        : "Nothing was planted that day."));
    } else {
      body.appendChild(el("p", "gj-species", titleCase(e.species)));
      var m = cfg.meaning ? cfg.meaning(e.species) : "";
      if (m) body.appendChild(el("p", "gj-meaning", m));

      if (cfg.garden === "personal") {
        if (e.note) body.appendChild(el("p", "gj-quote", e.note));
        if (e.mood) body.appendChild(field("Mood", e.mood));
        if (e.shaper) body.appendChild(field("Shaped by", e.shaper));
      } else {
        if (e.note) body.appendChild(el("p", "gj-quote", e.note));
        if (e.word) body.appendChild(field("Planted as", e.word));
      }
    }

    if (cfg.garden === "shared") drawMeadow(chosen);
  }

  function field(label, value) {
    var p = el("p", "gj-field");
    var b = el("b", null, label + ": ");
    p.appendChild(b);
    p.appendChild(document.createTextNode(String(value)));
    return p;
  }

  function titleCase(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* The whole meadow for a day, which is the thing the shared garden could
     not otherwise remember. */
  function drawMeadow(day) {
    var host = el("div");
    body.appendChild(host);
    host.appendChild(el("div", "gj-h", "The garden that day"));
    var loading = el("p", "gj-none", "Looking");
    host.appendChild(loading);

    sharedDay(day).then(function (flowers) {
      loading.remove();
      if (!flowers || !flowers.length) {
        host.appendChild(el("p", "gj-none", live()
          ? "No record of that day's garden. It is only kept from the day somebody signed in was standing in it."
          : "Sign in to see the whole garden from a past day."));
        return;
      }
      var mine = (byDay[day] && byDay[day].word) ? String(byDay[day].word).toLowerCase() : null;
      host.appendChild(el("div", "gj-h", flowers.length + (flowers.length === 1 ? " flower" : " flowers")));
      flowers.forEach(function (f) {
        var row = el("div", "gj-row");
        if (mine && String(f.word || "").toLowerCase() === mine) row.className += " gj-mine";
        var cv = document.createElement("canvas");
        cv.width = 68; cv.height = 68;
        row.appendChild(cv);
        if (cfg.paint) cfg.paint(cv, f.species, f.hue);
        var who = el("div", "gj-who");
        who.appendChild(el("b", null, f.word || "someone"));
        if (f.gratitude) who.appendChild(el("p", null, f.gratitude));
        row.appendChild(who);
        host.appendChild(row);
      });
    });
  }

  /* -------------------------------------------------------------------- api */
  function mount(options) {
    cfg = options || {};
    if (document.body) build();
    else document.addEventListener("DOMContentLoaded", build);
  }

  window.GardenJournal = {
    mount: mount,
    record: record,
    snapshot: snapshot,
    today: today,
    iso: iso,
    fromUS: fromUS,
    open: function () { if (panel) open(); }
  };
})();
