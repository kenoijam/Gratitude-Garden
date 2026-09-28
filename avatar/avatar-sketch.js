/* =========================================================================
   avatar-sketch.js  -  the studio, and the two screens either side of it

   THREE SCREENS, THE SAME SHAPE AS THE BOUQUET: a gallery to start from, one
   studio you live in, and a page that says the gardener is kept.

   IT WAS A SIX PAGE BOOK, and the book went because a gardener is SAVED now.
   The second visit is an EDIT, and an edit in a book means turning five pages
   to reach the shoes; a rail of tabs jumps straight there. It also leaves the
   project with ONE customiser pattern rather than two, which is the same
   argument that put `garden-music.js` at the root instead of in four copies.

   NOTHING WAS REWRITTEN TO DO IT. `buildStudio` MOVES the controls out of
   `#avSource` into the panes, exactly as `buildStudio` does in
   `bouquet-sketch.js`, so every grid keeps its id and its listeners and a
   control cannot drift from the thing that built it.
   ========================================================================= */
(function () {
  "use strict";
  var A = window.AvatarDraw;
  var G = window.GardenGardener;

  /* FIVE TABS, WHICH IS THE BOUQUET'S FIVE EXACTLY. Skin is its own tab
     rather than sharing with hair, and that is not symmetry for its own
     sake: together they were 8 skins, 6 fringes, 6 backs and 12 hair colours,
     32 tiles in one panel, which on a phone is a long scroll before you reach
     what you came for. */
  var TABS = [
    { id: "skin", label: "Skin", title: "Their skin",
      sub: "Eight tones, light to dark.",
      icon: '<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 0 0 16.4"/>' },
    { id: "hair", label: "Hair", title: "Their hair",
      sub: "A fringe and a back are two choices, so twelve tiles buy thirty-six looks.",
      icon: '<path d="M4.6 13.5C4.6 8 7.9 4.2 12 4.2s7.4 3.8 7.4 9.3"/><path d="M4.6 13.5V19M19.4 13.5V19"/><path d="M8.4 9.6c2.6 1.9 5.6 2.2 7.6.7"/>' },
    { id: "flower", label: "Flower", title: "The flower they wear",
      sub: "Six ring the face like a hood. The tulip and the lavender grow on a stem instead.",
      icon: '<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c-1.6-2.9-.9-5.6 0-6.6.9 1 1.6 3.7 0 6.6zM14.3 11.3c2.3-2.4 5.1-2.5 6.3-1.9-.5 1.3-2.7 3.1-6.3 1.9zM13.4 14.2c3.2.8 4.6 3.2 4.6 4.6-1.4.2-3.9-.9-4.6-4.6zM10.6 14.2c-.7 3.7-3.2 4.8-4.6 4.6 0-1.4 1.4-3.8 4.6-4.6zM9.7 11.3C6.1 12.5 3.9 10.7 3.4 9.4c1.2-.6 4-.5 6.3 1.9z"/>' },
    { id: "top", label: "Clothes", title: "What they wear",
      sub: "One outfit dresses the whole figure. Tap the one they have on to take it off.",
      icon: '<path d="M8.6 3.8 4 6.4l1.7 3.4 2-1V20h8.6V8.8l2 1L20 6.4l-4.6-2.6"/><path d="M8.6 3.8c0 1.9 1.5 2.9 3.4 2.9s3.4-1 3.4-2.9"/>' },
    { id: "wear", label: "Carrying", title: "What they carry",
      sub: "Over the shoulder, on the feet, in hand and on the face. Tap again to take one off.",
      icon: '<path d="M6.5 8.5h11l1 11.5h-13z"/><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"/>' }
  ];

  var tab = "skin";
  var screen = "gallery";
  var look = Object.assign({}, A.DEFAULT_LOOK);
  /* TOUCHED IS WHAT STOPS AN ACCOUNT ARRIVING MID-EDIT and overwriting the
     work. The session check is a network round trip, so somebody can have
     picked a flower before it resolves, and a gardener reverting under the
     hand choosing it would be the worst bug on the page. */
  var touched = false;

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* --------------------------------------------------------------- paint */
  function paint() {
    var c = $("avCanvas");
    if (!c) return;
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    A.paint(ctx, look, c.height, G && G.patNow ? G.patNow() : null);
    $("avShowName").textContent = look.name || "";
  }

  /* A PAT ON THE HEAD, and this is the one place on the project that needs a
     loop for it: the two gardens already redraw sixty times a second, so
     there `patNow()` is simply read on the next frame. Here nothing is
     moving, so a pat starts a loop and the loop stops itself the moment the
     pat is over. A permanent `requestAnimationFrame` on a still page is a
     cost for nothing, which is the rule the cursor trail already follows. */
  var patting = false;
  function patTick() {
    paint();
    if (G && G.patting()) { requestAnimationFrame(patTick); }
    else { patting = false; paint(); }
  }
  function patHead(e) {
    if (!G || !G.pat) return;
    /* THE HEAD, NOT THE WHOLE FIGURE. A pat on the boots is not a pat, and
       the canvas box is mostly clear margin either side of a narrow person. */
    var c = $("avCanvas"), b = c.getBoundingClientRect();
    var x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    if (x < 0.24 || x > 0.76 || y < 0.05 || y > 0.42) return;
    G.pat();
    if (!patting) { patting = true; requestAnimationFrame(patTick); }
  }

  /* --------------------------------------------------------------- tiles */
  function tile(on, inner, onPick) {
    var b = el("button", "av-tile" + (on ? " is-on" : ""));
    b.type = "button";
    b.appendChild(inner);
    b.addEventListener("click", onPick);
    return b;
  }
  function swatch(colour) {
    var d = el("span", "av-swatch");
    d.style.background = colour;
    return d;
  }
  function label(text) {
    var s = document.createElement("span");
    s.textContent = text;
    return s;
  }
  /* A PICTURE AND ITS NAME, drawn by the figure's own routines through
     `AvatarDraw.icon`, so a tile cannot show one thing and put another on the
     gardener. Colours stay as swatches: a swatch already IS a picture of a
     colour, and a face drawn eight times in eight skins says nothing a square
     of the skin does not. */
  function pic(kind, id, px, text, on, onPick) {
    var b = el("button", "av-tile" + (on ? " is-on" : ""));
    b.type = "button";
    b.appendChild(A.icon(kind, id, px, look));
    if (text) b.appendChild(label(text));
    b.addEventListener("click", onPick);
    return b;
  }

  function buildSkin() {
    var g = $("avSkin"); g.innerHTML = "";
    A.SKINS.forEach(function (c, i) {
      g.appendChild(tile(look.skin === i, swatch(c), function () {
        look.skin = i; buildSkin(); buildHair(); buildTop(); buildWear(); paint();
      }));
    });
  }
  /* THE FRINGE AND THE BACK ARE TWO ROWS, because they are two choices.
     Twelve tiles buy thirty-six looks where nine fixed styles bought nine. */
  function buildHair() {
    var fr = $("avHairShape"); fr.innerHTML = "";
    A.FRINGES.forEach(function (n, i) {
      fr.appendChild(pic("fringe", i, 44, n, look.fringe === i, function () {
        look.fringe = i; buildHair(); paint();
      }));
    });
    var bk = $("avHairBack"); bk.innerHTML = "";
    A.BACKS.forEach(function (n, i) {
      bk.appendChild(pic("back", i, 44, n, look.back === i, function () {
        look.back = i; buildHair(); paint();
      }));
    });
    var co = $("avHairCol"); co.innerHTML = "";
    A.HAIRS.forEach(function (c, i) {
      co.appendChild(tile(look.hairCol === i, swatch(c), function () {
        look.hairCol = i; buildHair(); paint();
      }));
    });
  }

  function buildFlower() {
    var g = $("avFlower"); g.innerHTML = "";
    A.SPECIES_ORDER.forEach(function (id) {
      g.appendChild(pic("flower", id, 48, A.BLOOMS[id].name, look.flower === id,
        function () {
          /* PICKING A SPECIES RESETS ALL THREE to that flower's own, so a
             new choice always arrives in the colour it was drawn for. The
             saturation has to go with the hue: left behind, a daisy drained
             to white would hand its white to the poppy picked after it. */
          look.flower = id;
          look.flowerHue = null; look.flowerSat = null; look.flowerLight = null;
          buildFlower(); paint();
        }));
    });
    $("avFlowerHue").value = look.flowerHue == null
      ? A.BLOOMS[look.flower].hue : look.flowerHue;
    /* HOW STRONG, WHICH IS THE ONLY WAY TO REACH WHITE. A hue slider alone
       cannot: white is an absence of saturation and no hue has one. At the
       bottom of this the bloom goes to a near white whatever species it is,
       which is what a daisy and a lily actually are. */
    $("avFlowerSat").value = look.flowerSat == null
      ? A.BLOOMS[look.flower].sat : look.flowerSat;
    /* THE TEST IS `=== "sprout"`. It was `!== "ring"`, and no species has ever
       been called `ring`, so the line fired on all eight and told somebody
       picking a rose that a rose has no ring of petals. */
    var h = A.HOOD[look.flower];
    $("avFlowerNote").textContent = (h && h.mode === "sprout")
      ? A.BLOOMS[look.flower].name + " has no ring of petals to sit inside, so it grows from the head instead."
      : "";
  }

  /* ONE PER SLOT, and picking the one already on takes it off, so a slot is
     never a trap. Small rows rather than one grid of everything, because a
     grid says "pick some of these" where the truth is "pick one of each". */
  function slotRows(host, slots) {
    host.innerHTML = "";
    slots.forEach(function (slot) {
      var lab = el("p", "av-label");
      lab.textContent = A.SLOT_LABEL[slot];
      host.appendChild(lab);
      var ids = Object.keys(A.WEAR).filter(function (id) { return A.WEAR[id].slot === slot; });
      /* ONE TILE PER ITEM, AND THE COLOURS ON A ROW OF THEIR OWN UNDERNEATH.
         It used to be one tile per item PER COLOUR, three Boots then three
         Clogs then three Wellies, which is a lovely row at three colours and
         an impossible one at ten: the feet slot alone would have been thirty
         tiles. The old note against a swatch row was that it put the colours
         a step away from the choice and hid them until something was picked,
         and both halves of that are answered here, since the row is always
         on screen and says in words what it is waiting for. */
      var row = el("div", "av-grid av-grid-wear av-grid-3");
      ids.forEach(function (id) { row.appendChild(variant(slot, id, null)); });
      host.appendChild(row);
      /* A SLOT WHOSE ITEMS CARRY NO COLOUR GETS NO ROW AT ALL, which is what
         is held and what is on the face: three watering cans in three greens
         is one choice printed three times. */
      if (ids.some(function (id) { return A.tintable(id); })) {
        host.appendChild(tintRow(slot));
      }
    });
  }
  /* THE COLOURS FOR WHATEVER IS ON IN THIS SLOT. With nothing on it is still
     drawn, greyed, saying what it is for: a control that appears out of
     nowhere the moment you pick something is a control nobody expects. */
  function tintRow(slot) {
    var worn = look[slot];
    var list = worn ? A.tintsFor(worn) : [];
    var wrap = el("div", "av-tints" + (list.length ? "" : " is-idle"));
    if (!list.length) {
      var hint = el("p", "av-note av-quiet");
      hint.textContent = "Pick one above to colour it.";
      wrap.appendChild(hint);
      return wrap;
    }
    var now = wornTint(slot, worn);
    list.forEach(function (ti) {
      var t = A.TINTS[ti];
      var b = el("button", "av-tint" + (now === ti ? " is-on" : ""));
      b.type = "button";
      b.title = t.name;
      b.setAttribute("aria-label", t.name);
      b.style.background = A.tone(t);
      b.addEventListener("click", function () {
        if (!look.tints) look.tints = {};
        look.tints[slot] = ti;
        buildWearables(); paint();
      });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function wornTint(slot, id) {
    return (look.tints && look.tints[slot] != null)
      ? look.tints[slot] : A.WEAR[id].tint;
  }
  /* A TILE DRAWS THE ITEM AND THE COLOUR IT IS ASKED FOR. The tint is stored
     per SLOT, so the caller pins the slot to the tile's own id; without that
     every tile in a row repainted itself in whatever the gardener was
     wearing and the row came out as three of one colour. */
  function variant(slot, id, ti) {
    var on = look[slot] === id && (ti == null || wornTint(slot, id) === ti);
    var shown = Object.assign({}, look, { tints: Object.assign({}, look.tints || {}) });
    /* A TILE THAT IS NOT WORN SHOWS THE COLOUR IT WOULD ARRIVE IN, which is
       the first of its own suggested three, rather than whatever the slot
       happens to be set to. Without this every tile in the row repainted
       itself in the worn garment's colour and the row came out as three of
       one colour, which is the fault the per-tile tint was added to fix. */
    if (ti != null) shown.tints[slot] = ti;
    else if (!on) delete shown.tints[slot];
    var b = el("button", "av-tile" + (on ? " is-on" : ""));
    b.type = "button";
    b.appendChild(A.icon("wear", id, 42, shown));
    b.appendChild(label(A.WEAR[id].name));
    b.addEventListener("click", function () {
      if (on) {
        look[slot] = null;
        if (look.tints) delete look.tints[slot];
      } else {
        look[slot] = id;
        if (!look.tints) look.tints = {};
        if (ti == null) delete look.tints[slot]; else look.tints[slot] = ti;
      }
      buildWearables(); paint();
    });
    return b;
  }

  /* THE BODY'S COLOUR IS THREE NUMBERS NOW, not one hue, so a tile is matched
     on all three. `look.top` is still the hue, which is what every gardener
     saved before this holds; `topS` and `topL` are absent on those and read
     back as the old constants. */
  function topOn(t) {
    return look.top === t.h
      && (look.topS == null ? A.TOP_S : look.topS) === t.s
      && (look.topL == null ? A.TOP_L : look.topL) === t.l;
  }
  function buildTop() {
    var g = $("avTop"); g.innerHTML = "";
    A.TOPS.forEach(function (t, i) {
      g.appendChild(pic("top", i, 54, "", topOn(t), function () {
        look.top = t.h; look.topS = t.s; look.topL = t.l;
        buildWearables(); paint();
      }));
    });
    slotRows($("avClothes"), A.STEP_SLOTS.top);
  }
  function buildWear() { slotRows($("avWear"), A.STEP_SLOTS.wear); }
  function buildWearables() { buildTop(); buildWear(); }
  function buildAll() {
    buildSkin(); buildHair(); buildFlower(); buildTop(); buildWear(); paint();
  }

  /* ------------------------------------------------------------- gallery */
  /* FIVE READY GARDENERS AND A BLANK SIXTH, three by two, which is the
     bouquet's template grid exactly. "Build your own" is IN the grid rather
     than a link under it, so starting from nothing is one of the six choices
     rather than the thing you fall back to. */
  function buildGallery() {
    var g = $("avGallery"); g.innerHTML = "";
    /* BUILD YOUR OWN IS FIRST, not the blank tile at the end. Last, it reads
       as what you fall back to when none of the five fit; first, it is simply
       the first of the six ways to start, which is what it actually is. */
    var own = el("button", "av-gal-tile av-gal-own",
      '<span class="av-gal-plus" aria-hidden="true">+</span>');
    own.type = "button";
    own.appendChild(label("Build your own"));
    own.addEventListener("click", function () { startFrom(null); });
    g.appendChild(own);
    A.TEMPLATES.forEach(function (t) {
      var b = el("button", "av-gal-tile");
      b.type = "button";
      var c = document.createElement("canvas");
      var px = 150, dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(px * dpr); c.height = Math.round(px * 1.2 * dpr);
      c.style.width = px + "px"; c.style.height = Math.round(px * 1.2) + "px";
      var x = c.getContext("2d");
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      A.paintAt(x, t.look, px / 2, px * 1.16, px * 1.26);
      b.appendChild(c);
      b.appendChild(label(t.name));
      b.addEventListener("click", function () { startFrom(t.id); });
      g.appendChild(b);
    });
  }

  function startFrom(id) {
    var t = id ? A.templateOf(id) : null;
    /* THE TINTS ARE COPIED, NOT WIPED. `{ tints: {} }` came last here, so a
       template naming a black boot or a cream apron had every one of those
       thrown away the instant it was chosen and arrived in the garment's own
       default colour instead. It is also copied rather than shared, or
       editing a gardener would write into the template everyone else starts
       from. */
    look = Object.assign({}, A.DEFAULT_LOOK, t ? t.look : {},
      { tints: Object.assign({}, t && t.look && t.look.tints) });
    touched = true;
    $("avName").value = look.name || "";
    buildAll();
    go("studio");
    showTab("skin");
  }

  /* --------------------------------------------------------------- studio */
  function buildStudio() {
    var page = $("avPage"), src = $("avSource");
    if (!page || !src || $("avStudio")) return;
    var sec = function (n) { return src.querySelector('.av-step[data-step="' + n + '"]'); };

    var studio = el("section", "av-screen av-studio");
    studio.id = "avStudio";
    studio.dataset.screen = "studio";
    studio.hidden = true;

    /* the rail */
    var rail = el("nav", "av-rail");
    rail.setAttribute("aria-label", "Parts of your gardener");
    rail.setAttribute("role", "tablist");
    TABS.forEach(function (t) {
      var b = el("button", "av-rail-tab",
        '<span class="av-rail-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        t.icon + '</svg></span><span class="av-rail-lb">' + t.label + '</span>');
      b.type = "button";
      b.dataset.tab = t.id;
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () { showTab(t.id); });
      rail.appendChild(b);
    });

    /* the stage: the figure, and the name beside it rather than on a page of
       its own, since one field never needed a screen */
    var stage = el("div", "av-studio-stage");
    stage.appendChild($("avStage"));
    var nameField = sec("begin").querySelector(".av-field");
    nameField.classList.add("av-stage-name");
    stage.appendChild(nameField);

    /* the options */
    var opts = el("aside", "av-options");
    var body = el("div", "av-opt-body");
    body.id = "avOptBody";
    var panes = {};
    TABS.forEach(function (t) {
      var p = el("div", "av-pane");
      p.dataset.pane = t.id;
      p.setAttribute("role", "tabpanel");
      var h = el("h2"); h.textContent = t.title;
      var s = el("p", "av-note"); s.textContent = t.sub;
      p.appendChild(h); p.appendChild(s);
      body.appendChild(p);
      panes[t.id] = p;
    });

    /* EVERY GRID IS MOVED, NEVER REBUILT. Each keeps its id, so `buildSkin`
       and the rest go on finding them exactly where they always looked. */
    panes.skin.appendChild($("avSkin"));
    panes.hair.appendChild(el("p", "av-label", "Fringe"));
    panes.hair.appendChild($("avHairShape"));
    panes.hair.appendChild(el("p", "av-label", "The rest of it"));
    panes.hair.appendChild($("avHairBack"));
    panes.hair.appendChild(el("p", "av-label", "Hair colour"));
    panes.hair.appendChild($("avHairCol"));

    panes.flower.appendChild($("avFlower"));
    panes.flower.appendChild(el("p", "av-label", "Its colour"));
    panes.flower.appendChild($("avFlowerHue"));
    panes.flower.appendChild($("avFlowerSat"));
    panes.flower.appendChild($("avFlowerNote"));

    panes.top.appendChild(el("p", "av-label", "Their colour"));
    panes.top.appendChild($("avTop"));
    panes.top.appendChild($("avClothes"));

    panes.wear.appendChild($("avWear"));

    /* the foot: arrows for a phone, and one button that keeps them */
    var foot = el("div", "av-foot");
    var arrow = function (dir, lab, path) {
      return '<button type="button" class="av-studio-arrow" data-dir="' + dir +
        '" aria-label="' + lab + '"><svg viewBox="0 0 20 20" width="18" height="18" ' +
        'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg></button>';
    };
    foot.innerHTML =
      arrow("prev", "Previous", "M12.5 4 6.5 10l6 6") +
      '<div class="av-sum"><strong>Your gardener</strong><span id="avSumLine"></span></div>' +
      arrow("next", "Next", "M7.5 4l6 6-6 6") +
      '<button type="button" class="av-btn av-keep" id="avKeep">Keep this gardener</button>';
    foot.addEventListener("click", function (e) {
      var b = e.target.closest(".av-studio-arrow");
      if (!b) return;
      var order = TABS.map(function (t) { return t.id; });
      var at = order.indexOf(tab);
      /* PREVIOUS ON THE FIRST TAB GOES BACK TO THE GALLERY, which is the only
         way there once you are in the studio. */
      if (b.dataset.dir === "prev") {
        if (at <= 0) { go("gallery"); return; }
        showTab(order[at - 1]);
      } else if (at < order.length - 1) {
        showTab(order[at + 1]);
      }
      $("avOptBody").scrollTop = 0;
    });
    foot.querySelector("#avKeep").addEventListener("click", keep);

    opts.appendChild(body);
    opts.appendChild(foot);
    studio.appendChild(rail);
    studio.appendChild(stage);
    studio.appendChild(opts);
    page.insertBefore(studio, src);

    /* the emptied sections go, like the bouquet's */
    src.remove();
  }

  function showTab(id) {
    tab = id;
    var st = $("avStudio");
    st.querySelectorAll(".av-rail-tab").forEach(function (b) {
      var on = b.dataset.tab === id;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    st.querySelectorAll(".av-pane").forEach(function (p) {
      p.hidden = p.dataset.pane !== id;
    });
    $("avOptBody").scrollTop = 0;
  }

  /* ------------------------------------------------------------- screens */
  function go(name) {
    screen = name;
    document.querySelectorAll(".av-screen").forEach(function (s) {
      s.hidden = s.dataset.screen !== name;
    });
    /* THE PAGE TITLE STANDS DOWN ON THE STUDIO. A 44px heading and its line
       over a screen-tall studio is 150px of the one thing the studio needs,
       which is height. Same rule as the bouquet hiding its progress dots. */
    document.documentElement.setAttribute("data-av", name);
    if (name === "studio") paint();
    if (name === "done") buildDone();
    window.scrollTo(0, 0);
  }

  function keep() {
    if (G) G.save(Object.assign({}, look));
    go("done");
  }

  function buildDone() {
    var c = $("avDoneArt"), px = 170;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(px * dpr); c.height = Math.round(px * 1.22 * dpr);
    c.style.width = px + "px"; c.style.height = Math.round(px * 1.22) + "px";
    var x = c.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, px, px * 1.22);
    A.paintAt(x, look, px / 2, px * 1.18, px * 1.28);

    var who = look.name ? look.name : "Your gardener";
    $("avDoneLine").textContent = who +
      " is kept. They stand in your personal garden, and beside your flower in the shared one.";
    var signedIn = window.GardenAccount && window.GardenAccount.user();
    $("avDraft").textContent = signedIn
      ? "Kept on your account, so they follow you between devices."
      : "Kept in this browser. Sign in from a garden and they follow you between devices.";
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    buildGallery();
    buildStudio();

    /* ONE LISTENER FOR EVERY PICK rather than a `touched = true` added to
       each of the ten builders and forgotten in the eleventh. */
    $("avStudio").addEventListener("click", function () { touched = true; }, true);

    $("avFlowerHue").addEventListener("input", function () {
      touched = true; look.flowerHue = +this.value; paint();
    });
    /* THE LIGHTNESS RIDES WITH THE SATURATION rather than being a third
       slider. Drained to nothing at the species' own lightness a bloom comes
       out GREY, which is not what anybody reaching for pale means; lifting it
       as the colour goes takes the same drag to a white flower instead. */
    $("avFlowerSat").addEventListener("input", function () {
      touched = true;
      var b = A.BLOOMS[look.flower], v = +this.value;
      look.flowerSat = v;
      look.flowerLight = Math.round(b.light + (1 - v / Math.max(1, b.sat)) * 22);
      paint();
    });
    $("avName").addEventListener("input", function () {
      touched = true; look.name = this.value.trim(); paint();
    });
    $("avCanvas").addEventListener("pointerdown", patHead);
    $("avEdit").addEventListener("click", function () { go("studio"); });
    $("avReset").addEventListener("click", function () {
      touched = true;
      look = Object.assign({}, A.DEFAULT_LOOK, { tints: {} });
      $("avName").value = "";
      buildAll();
      go("gallery");
    });

    if (G) {
      G.onChange(function (saved) {
        if (!saved || touched) return;
        look = Object.assign({}, A.DEFAULT_LOOK, saved);
        $("avName").value = look.name || "";
        buildAll();
      });
    }

    /* WHERE IT OPENS, and the order matters. A `?t=` from the landing page
       wins, since somebody pressed that gardener on purpose. Then `?start`,
       which is the landing band's button and means show me the choices.
       Otherwise a gardener already kept opens the STUDIO wearing them,
       because coming back is an edit. Only a first visit sees the gallery. */
    var q = new URLSearchParams(location.search);
    var t = q.get("t");
    if (t && A.templateOf(t)) { startFrom(t); return; }
    /* `?start` IS WHAT THE LANDING PAGE'S BUTTON CARRIES, and it exists
       because without it that button was a promise the page could not keep:
       it says come and choose, and for anybody who had already built a
       gardener it opened straight into the editor with the six choices
       nowhere on screen. It shows the gallery WITHOUT clearing anything, so
       walking back out of it leaves the saved gardener exactly as it was. */
    if (q.has("start")) {
      if (G && G.has()) {
        look = Object.assign({}, A.DEFAULT_LOOK, G.get());
        $("avName").value = look.name || "";
      }
      buildAll();
      go("gallery");
      return;
    }
    if (G && G.has()) {
      look = Object.assign({}, A.DEFAULT_LOOK, G.get());
      $("avName").value = look.name || "";
      buildAll();
      go("studio"); showTab("skin");
      return;
    }
    buildAll();
    go("gallery");
  }

  /* the bouquet's script is a classic one loaded before this, so its function
     declarations are already on window; the document may not be ready though,
     since this tag sits before the end of the body */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
