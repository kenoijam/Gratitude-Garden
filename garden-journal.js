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
      note: String(entry.note || ""),
      photo: String(entry.photo || "")
    }, { onConflict: "user_id,garden,day" })
      .then(function () {})
      .catch(function () {});
  }

  /* ------------------------------------------------------------- photos */
  /* One picture a day, in a PRIVATE bucket under a folder named for the
     account, which is what the storage policy in Step 8 keys on: a path that
     does not start with your own id is refused by the database, not by this
     file. Step 8 also adds the `photo` column to `garden_entries`.

     A private bucket means the picture is fetched through a SIGNED URL rather
     than a public one, so a link copied out of the page stops working within
     the hour instead of being readable by anybody for ever. */
  var BUCKET = "entries";

  function uploadPhoto(day, file) {
    if (!live() || !uid() || !file || !day) return Promise.resolve("");
    /* The extension is kept so the browser gets the right type back. */
    var ext = (String(file.name || "").split(".").pop() || "jpg").toLowerCase();
    if (ext.length > 5 || !/^[a-z0-9]+$/.test(ext)) ext = "jpg";
    var path = uid() + "/" + day + "." + ext;
    return sb().storage.from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" })
      .then(function (res) { return res && res.error ? "" : path; })
      .catch(function () { return ""; });
  }

  /* Signed on demand and cached for the life of the panel, since the same day
     is often opened more than once while somebody is reading back. */
  var signed = {};
  function photoUrl(path) {
    if (!path || !live()) return Promise.resolve("");
    if (signed[path]) return Promise.resolve(signed[path]);
    return sb().storage.from(BUCKET).createSignedUrl(path, 3600)
      .then(function (res) {
        var u = (res && res.data && res.data.signedUrl) || "";
        if (u) signed[path] = u;
        return u;
      })
      .catch(function () { return ""; });
  }

  /* FULL SIZE, over everything. The panel is a 300px column and a photo in it
     is a thumbnail whatever the fit, so there has to be a way to actually
     look at the thing. Built and torn down per open rather than kept in the
     document, since a signed URL expires within the hour and a stale one left
     lying in the markup would be a broken picture waiting to happen. */
  var lightbox = null;
  function shotOpen() { return !!lightbox; }
  function closeShot() {
    if (!lightbox) return;
    var el = lightbox;
    lightbox = null;
    el.removeAttribute("data-in");
    document.removeEventListener("keydown", onShotKey);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
  }
  function onShotKey(e) { if (e.key === "Escape") closeShot(); }
  function openShot(url) {
    closeShot();
    var box = document.createElement("div");
    box.className = "gj-lightbox";
    var img = document.createElement("img");
    img.alt = "";
    img.src = url;
    var x = document.createElement("button");
    x.className = "gj-lb-close";
    x.type = "button";
    x.setAttribute("aria-label", "Close the photo");
    x.innerHTML = "&#10005;";
    box.appendChild(img);
    box.appendChild(x);
    /* A tap anywhere that is not the picture closes it, which is what every
       viewer does and is also the only target a thumb can find reliably. */
    box.addEventListener("click", function (e) { if (e.target !== img) closeShot(); });
    document.body.appendChild(box);
    lightbox = box;
    document.addEventListener("keydown", onShotKey);
    requestAnimationFrame(function () { box.setAttribute("data-in", "1"); });
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

    /* A BOOK IN THE MIDDLE, not a sheet down the side.

       It used to slide in from the left. Reaching it by tapping a flower is
       what changed that: a flower can be anywhere in the garden and the panel
       always arrived in the same corner, so the thing you asked about and the
       answer were nowhere near each other. Centred, the answer arrives where
       you are looking, and the garden dims behind it rather than being shoved
       aside. It is ONE reading view with two ways in, the icon and a flower,
       which is also what keeps it from being the same panel twice. */
    '#gj-veil{position:fixed;inset:0;z-index:535;background:rgba(12,58,54,0.34);' +
      'opacity:0;pointer-events:none;transition:opacity .24s ease;}' +
    '#gj-veil[data-open="1"]{opacity:1;pointer-events:auto;}' +
    '#gj-panel{position:fixed;left:50%;top:50%;z-index:540;' +
      'width:min(92vw,432px);' +
      /* ONE SIZE, ALWAYS. A floor was not enough: a day with a photo still
         came out 496 tall against 408 for a day with two lines, so turning a
         page changed the size of the thing being read and the book jumped
         under the hand turning it. It is a fixed height now and the page
         scrolls inside when there is more than fits, which is what a book
         does: the covers do not grow for a longer chapter.

         520 is what the tallest ordinary day needs, MEASURED rather than
         guessed: species and meaning, the two fields, a two line entry and
         the 128px photograph come to 322px of page, against 278 at the first
         attempt of 470, so the picture sat 23px under the fold and had to be
         scrolled to. Longer days than that do scroll, which is the point of
         a fixed height; a photograph on an ordinary day should not. */
      'height:min(86vh,520px);' +
      'background:snow;border-radius:16px;border:1px solid #d9ece9;' +
      'box-shadow:0 22px 60px rgba(29,100,102,0.30);' +
      'font-family:Arial,Helvetica,sans-serif;color:#1d6466;display:flex;flex-direction:column;' +
      'overflow:hidden;' +
      'transform:translate(-50%,-50%) scale(.94);opacity:0;pointer-events:none;' +
      'transition:transform .24s ease,opacity .24s ease;}' +
    '#gj-panel[data-open="1"]{transform:translate(-50%,-50%) scale(1);opacity:1;' +
      'pointer-events:auto;}' +
    '@media (prefers-reduced-motion:reduce){#gj-panel,#gj-veil{transition:none;}}' +

    /* THE SPINE. A band down the left with stitch marks on it, and every row
       inside the book is indented past it. It is a `::before` on the panel
       rather than a child, so nothing in the layout has to know about it and
       the scrolling body slides under it cleanly. */
    '#gj-panel::before{content:"";position:absolute;left:0;top:0;bottom:0;width:26px;' +
      'background:linear-gradient(90deg,#e7f3f0 0%,#f4faf8 62%,rgba(244,250,248,0) 100%);' +
      'border-right:1px solid #e3f0ed;pointer-events:none;z-index:2;}' +
    '#gj-panel::after{content:"";position:absolute;left:12px;top:26px;bottom:26px;width:0;' +
      'border-left:2px dashed #c6e2dc;pointer-events:none;z-index:3;}' +

    '#gj-head{padding:14px 14px 10px 38px;border-bottom:1px solid #eaf4f2;position:relative;' +
      'flex:0 0 auto;}' +
    /* The month is the one date the header spells out, so it carries the
       page's heading weight rather than the small grey label a panel title
       would have taken. */
    '.gj-month{font-family:Fraunces,Georgia,serif;font-size:17px;font-weight:600;' +
      "font-variation-settings:'SOFT' 50,'WONK' 0;color:#0f5132;letter-spacing:0;}" +
    '#gj-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;' +
      'border:1.5px solid #b7e4e7;background:rgba(255,249,227,0.92);color:#1d6466;cursor:pointer;' +
      'padding:0;display:flex;align-items:center;justify-content:center;z-index:4;}' +
    '#gj-close:hover{background:#e1f7f7;}' +
    '.gj-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;' +
      'padding-right:34px;}' +
    '.gj-arrow{width:28px;height:28px;border-radius:50%;border:1.5px solid #d9ece9;' +
      'background:none;color:#1d6466;cursor:pointer;padding:0;flex:0 0 auto;' +
      'display:flex;align-items:center;justify-content:center;}' +
    '.gj-arrow:hover:not(:disabled){background:#e1f7f7;}' +
    '.gj-arrow:disabled{opacity:.35;cursor:not-allowed;}' +

    '#gj-foot{flex:0 0 auto;border-top:1px solid #eaf4f2;background:#fbfefd;' +
      'padding:8px 12px 8px 38px;display:flex;align-items:center;' +
      'justify-content:space-between;gap:8px;}' +
    '.gj-turn-btn{display:flex;align-items:center;gap:6px;border:0;background:none;' +
      'font-family:inherit;font-size:12.5px;font-weight:700;color:#2c7a7b;' +
      'padding:7px 9px;border-radius:9px;cursor:pointer;}' +
    '.gj-turn-btn:hover:not(:disabled){background:#e9f7f5;}' +
    '.gj-turn-btn:disabled{opacity:.32;cursor:not-allowed;}' +
    '#gj-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:8px 0 0;}' +
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

    '#gj-body{flex:1 1 auto;overflow-y:auto;padding:14px 18px 18px 38px;}' +
    '.gj-species{font-size:14px;font-weight:700;color:#0f5132;margin:0 0 2px;}' +
    '.gj-meaning{font-size:13px;color:#5a8f8d;margin:0 0 12px;}' +
    '.gj-field{font-size:13.5px;color:#2f6260;line-height:1.55;margin:0 0 7px;}' +
    '.gj-field b{color:#0f5132;}' +
    /* CONTAIN, NOT COVER. A 4:3 box cropping to fill turned a portrait
       photo into a strip through its middle, which on a screenshot is
       most of the picture gone and no way to get it back. It letterboxes
       now, so whatever shape the photo is, all of it is there. */
    /* A STAMP, NOT THE PAGE. At a full width 4:3 frame the photo was 320px
       tall and the largest thing in the book by far, so a day with a picture
       and a day without were two different objects. It is 100px tall now and
       its WIDTH FOLLOWS ITS OWN SHAPE rather than the column: a portrait
       comes out about 56px wide and a landscape about 178, where a fixed
       wide box would have letterboxed a phone photo into a sliver with a
       field of empty ground either side of it. The whole picture is one tap
       away, so nothing is lost by keeping it small here. */
    /* A SQUARE, and `cover` rather than `contain` inside it. A square that
       letterboxes is a square with a picture floating in the middle of it,
       which is worse than either shape; a square that fills is a thumbnail,
       which is what this is. Cropping costs nothing here only because the
       whole picture is one tap away. */
    '.gj-shot{width:128px;height:128px;border-radius:10px;' +
      'overflow:hidden;background:#e4efed;margin:2px 0 4px;position:relative;' +
      'display:block;padding:0;border:0;}' +
    '.gj-shot img{width:100%;height:100%;object-fit:cover;display:block;}' +
    /* It is a real <button>, so a keyboard reaches it and the project's
       own cursor already treats it as something to press. */
    '.gj-shot:focus-visible{outline:2px solid #2c7a7b;outline-offset:2px;}' +
    /* A BADGE, not a worded chip. "Tap to open" does not fit across a 56px
       wide portrait stamp, and a label that is cut in half says less than no
       label at all. The button still carries the words in its aria-label. */
    '.gj-shot-hint{position:absolute;right:5px;bottom:5px;width:20px;height:20px;' +
      'border-radius:50%;background:rgba(15,81,50,0.66);color:#fff9e3;' +
      'display:flex;align-items:center;justify-content:center;pointer-events:none;}' +
    '.gj-shot-hint svg{width:12px;height:12px;display:block;}' +
    /* The full size view. Fixed and above everything the gardens carry:
       the music button is 260 and the panel itself 240. */
    '.gj-lightbox{position:fixed;inset:0;z-index:9500;display:flex;' +
      'align-items:center;justify-content:center;padding:26px;' +
      'background:rgba(10,48,44,0.82);opacity:0;transition:opacity .18s ease;}' +
    '.gj-lightbox[data-in="1"]{opacity:1;}' +
    '.gj-lightbox img{max-width:100%;max-height:100%;border-radius:12px;' +
      'box-shadow:0 18px 60px rgba(0,0,0,.42);display:block;}' +
    '.gj-lb-close{position:absolute;top:16px;right:16px;width:38px;height:38px;' +
      'border-radius:50%;border:0;background:rgba(255,249,227,0.92);color:#1d6466;' +
      'font-size:17px;line-height:1;display:flex;align-items:center;' +
      'justify-content:center;}' +
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
    '.gj-mine{border-left:2.5px solid #7fcdcd;padding-left:9px;margin-left:-11px;}' +

    /* LAST IN THE FILE ON PURPOSE. A later rule beats an earlier one at equal
       specificity, so a phone override written above the base declaration it
       overrides does nothing at all, silently. This block sat higher up first
       and did exactly that; the project has now hit that trap on four
       stylesheets. */
    '@media (max-width:560px){#gj-head{padding-left:34px;}' +
      '#gj-body{padding-left:34px;}#gj-foot{padding-left:30px;}' +
      '.gj-month{font-size:16px;}}';

  var BOOK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5z"/>' +
    '<path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H19"/></svg>';
  var CHEV_L = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2l5 5-5 5"/></svg>';
  var ZOOM_ICON = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="6" cy="6" r="4"/><path d="M9 9l3.5 3.5M4.4 6h3.2M6 4.4v3.2"/></svg>';
  var X_ICON = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* --------------------------------------------------------------- the panel */
  var cfg = null;               /* { garden, entries(), meaning(), paint() } */
  var panel, strip, body, navLabel, prevBtn, nextBtn, btn, veil, turnPrev, turnNext;
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

    /* THE CALENDAR IS THE HEADER. There is no date heading under it and no
       panel title above it: the strip already names the day, in the cell it
       highlights, and printing "Sunday, September 13" over a calendar with
       the 13th ringed is the same fact twice in one square inch. The month
       carries the part the strip cannot show. */
    var head = el("div"); head.id = "gj-head";
    var x = el("button"); x.id = "gj-close"; x.type = "button";
    x.setAttribute("aria-label", "Close");
    x.innerHTML = X_ICON;
    x.addEventListener("click", close);
    head.appendChild(x);

    var nav = el("div", "gj-nav");
    prevBtn = el("button", "gj-arrow"); prevBtn.type = "button";
    prevBtn.innerHTML = CHEV_L;
    prevBtn.setAttribute("aria-label", "Earlier week");
    prevBtn.addEventListener("click", function () { shiftWeek(-7); });
    nextBtn = el("button", "gj-arrow"); nextBtn.type = "button";
    nextBtn.innerHTML = CHEV_R;
    nextBtn.setAttribute("aria-label", "Later week");
    nextBtn.addEventListener("click", function () { shiftWeek(7); });
    navLabel = el("span", "gj-month");
    nav.appendChild(prevBtn); nav.appendChild(navLabel); nav.appendChild(nextBtn);
    strip = el("div"); strip.id = "gj-strip";
    head.appendChild(nav);
    head.appendChild(strip);

    body = el("div"); body.id = "gj-body";

    /* THE PAGE TURN, along the foot. These skip to the previous and next day
       that HAS an entry rather than stepping through the calendar, since a
       diary of one flower a day is mostly empty days and turning through
       those is turning through nothing. They are worded rather than bare
       chevrons because the header already has a pair, and two unlabelled
       pairs in one panel is a guess about which moves what. */
    var foot = el("div"); foot.id = "gj-foot";
    turnPrev = el("button", "gj-turn-btn"); turnPrev.type = "button";
    turnPrev.innerHTML = CHEV_L + "<span>Earlier entry</span>";
    turnPrev.addEventListener("click", function () { turnPage(-1); });
    turnNext = el("button", "gj-turn-btn"); turnNext.type = "button";
    turnNext.innerHTML = "<span>Later entry</span>" + CHEV_R;
    turnNext.addEventListener("click", function () { turnPage(1); });
    foot.appendChild(turnPrev);
    foot.appendChild(turnNext);

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    veil = el("div"); veil.id = "gj-veil";
    veil.setAttribute("data-open", "0");
    veil.addEventListener("click", close);
    document.body.appendChild(btn);
    document.body.appendChild(veil);
    document.body.appendChild(panel);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      /* The photo is on TOP of the book, so Escape belongs to it first. Both
         listeners fire otherwise and one press shut the lot. */
      if (shotOpen()) return;
      if (panel.getAttribute("data-open") === "1") close();
    });

    /* A tap anywhere else shuts it. `pointerdown` rather than `click`, so it
       closes as the finger lands rather than when it lifts, and the button
       itself is excluded or opening it would immediately close it again. */
    document.addEventListener("pointerdown", function (e) {
      if (panel.getAttribute("data-open") !== "1") return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      /* THE FULL SIZE PHOTO IS NOT "OUTSIDE". It is appended to the body
         rather than to the panel, because it has to sit above the veil, so
         this rule counted a tap on its dark surround as a tap away from the
         book and shut the book as well as the photo. One tap, two things
         closed, and the entry you were reading gone with it. */
      if (lightbox && lightbox.contains(e.target)) return;
      close();
    });
  }

  /* Which days actually hold something, oldest first. The page turn walks
     this rather than the calendar. */
  function entryDays() {
    return Object.keys(byDay).filter(function (d) { return !!byDay[d]; }).sort();
  }
  function turnPage(dir) {
    var days = entryDays();
    if (!days.length) return;
    var i = days.indexOf(chosen);
    var next;
    if (i === -1) {
      /* Standing on an empty day, so step to the nearest real one in that
         direction rather than refusing to move. */
      if (dir < 0) {
        next = null;
        for (var a = days.length - 1; a >= 0; a--) if (days[a] < chosen) { next = days[a]; break; }
      } else {
        next = null;
        for (var b = 0; b < days.length; b++) if (days[b] > chosen) { next = days[b]; break; }
      }
    } else {
      next = days[i + dir];
    }
    if (!next) return;
    chosen = next;
    weekStart = startOfWeek(new Date(
      Number(next.slice(0, 4)), Number(next.slice(5, 7)) - 1, Number(next.slice(8, 10))));
    drawStrip();
  }

  function shiftWeek(n) {
    weekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + n);
    drawStrip();
  }

  function open() {
    panel.setAttribute("data-open", "1");
    panel.setAttribute("aria-hidden", "false");
    veil.setAttribute("data-open", "1");
    refresh();
  }
  /* Open the book AT a day. This is what a tapped flower calls, and it is the
     whole reason the panel moved to the middle. */
  function openAt(day) {
    if (day) {
      chosen = day;
      weekStart = startOfWeek(new Date(
        Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))));
    }
    open();
  }
  function close() {
    /* The full size photo is appended to the body, not to the panel, so it
       would otherwise be left hanging over a closed panel. */
    closeShot();
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-hidden", "true");
    veil.setAttribute("data-open", "0");
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
    /* The month in FULL, since it is the only date the header spells out and
       an abbreviation saves nothing when it is the one word on the row. A
       week that straddles two months names both, or it would claim to be a
       September the second half of it is not in. */
    var mA = weekStart.toLocaleDateString(undefined, { month: "long" });
    var mB = endOfWeek.toLocaleDateString(undefined, { month: "long" });
    navLabel.textContent = (mA === mB) ? mA : (mA + " to " + mB);
    nextBtn.disabled = iso(endOfWeek) >= today();

    /* The page turn is greyed at the ends of what there is, so the book
       cannot be turned to a blank. */
    var days = entryDays();
    turnPrev.disabled = !days.some(function (d) { return d < chosen; });
    turnNext.disabled = !days.some(function (d) { return d > chosen; });

    drawDetail();
  }

  function drawDetail() {
    body.innerHTML = "";
    /* The date is the page's heading and lives in the head, between the two
       page turn arrows, so it is NOT repeated here. */
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
        /* THE ORDER IS THE ANSWERS IN THE ORDER THEY WERE ASKED FOR, then
           what was written, then the picture. The two one word facts read
           as labels on the day and belong with the species above them; the
           sentence is the day itself, so it wants a clear run rather than
           being wedged between a photograph and a pair of fields. */
        if (e.mood) body.appendChild(field("Mood", e.mood));
        if (e.shaper) body.appendChild(field("Shaped by", e.shaper));
        if (e.note) body.appendChild(el("p", "gj-quote", e.note));
        if (e.photo) {
          /* The frame goes in straight away at the right size and the picture
             arrives into it, so the page does not jump when the signed URL
             comes back. */
          var shot = document.createElement("button");
          shot.className = "gj-shot";
          shot.type = "button";
          shot.disabled = true;          /* nothing to open until it arrives */
          shot.setAttribute("aria-label", "Open the photo for this day");
          body.appendChild(shot);
          photoUrl(e.photo).then(function (u) {
            if (!u) { shot.remove(); return; }
            var img = document.createElement("img");
            img.alt = "";
            img.src = u;
            shot.appendChild(img);
            var hint = document.createElement("span");
            hint.className = "gj-shot-hint";
            hint.innerHTML = ZOOM_ICON;
            shot.appendChild(hint);
            shot.disabled = false;
            shot.addEventListener("click", function () { openShot(u); });
          });
        }
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
    uploadPhoto: uploadPhoto,
    photoUrl: photoUrl,
    snapshot: snapshot,
    today: today,
    iso: iso,
    fromUS: fromUS,
    open: function () { if (panel) open(); },
    /* `day` is YYYY-MM-DD. The personal garden hands this a flower's own
       date so the book opens on that page rather than on today. */
    openAt: function (day) { if (panel) openAt(day); },
    isOpen: function () { return !!panel && panel.getAttribute("data-open") === "1"; }
  };
})();
