/* =========================================================================
   avatar-sketch.js  -  the book, one step at a time

   A DRAFT. Nothing is saved and the gardener does not appear anywhere else
   yet; this exists to answer whether the flow feels right before deciding
   where they stand.
   ========================================================================= */
(function () {
  "use strict";
  var A = window.AvatarDraw;

  /* SIX, which is the reference's count, and every one is a real question.
     Skin and hair share a step so the FLOWER can have one of its own: it is
     part of the gardener rather than a keepsake, and with a hood on, hair is
     a fringe and little else. */
  var STEPS = [
    { id: "begin",  name: "Beginning" },
    { id: "skin",   name: "Gardener" },
    { id: "flower", name: "Flower" },
    { id: "top",    name: "Clothes" },
    { id: "wear",   name: "Carrying" },
    { id: "done",   name: "Done" }
  ];
  var at = 0;
  /* THE PAGE OPENS ON WHO YOU ALREADY ARE. `GardenGardener` hands back this
     browser's copy at once and an account's a moment later, so a first
     visitor gets the default and everybody else gets themselves. */
  var G = window.GardenGardener;
  var look = Object.assign({}, A.DEFAULT_LOOK, (G && G.get()) || {});
  /* TOUCHED IS WHAT STOPS AN ACCOUNT ARRIVING MID-EDIT AND OVERWRITING THE
     WORK. The session check is a network round trip, so somebody can have
     picked a flower before it resolves, and a gardener that reverted under
     the hand choosing it would be the worst bug on the page. */
  var touched = false;

  var $ = function (id) { return document.getElementById(id); };

  /* --------------------------------------------------------------- paint */
  function touch() { touched = true; }
  function paint() {
    var c = $("avCanvas");
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    A.paint(ctx, look, c.height);
    $("avShowName").textContent = look.name || "";
  }
  /* --------------------------------------------------------------- build */
  function buildSteps() {
    var ol = $("avSteps");
    ol.innerHTML = "";
    STEPS.forEach(function (s, i) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="av-step-dot">' + (i + 1) + '</span>' +
                     '<span class="av-step-name"></span>';
      li.querySelector(".av-step-name").textContent = s.name;
      ol.appendChild(li);
    });
  }
  function tile(on, inner, onPick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "av-tile" + (on ? " is-on" : "");
    b.appendChild(inner);
    b.addEventListener("click", onPick);
    return b;
  }
  function swatch(colour) {
    var d = document.createElement("span");
    d.className = "av-swatch";
    d.style.background = colour;
    return d;
  }
  function label(text) {
    var s = document.createElement("span");
    s.textContent = text;
    return s;
  }
  /* A PICTURE AND ITS NAME, and the picture is drawn by the figure's own
     routines through `AvatarDraw.icon`, so a tile cannot show one thing and
     put another on the gardener. Colours stay as swatches: a swatch already
     IS a picture of a colour, and a face drawn four times in four skins says
     nothing a square of the skin does not. */
  function pic(kind, id, px, text, on, onPick) {
    var box = document.createDocumentFragment();
    box.appendChild(A.icon(kind, id, px, look));
    if (text) box.appendChild(label(text));
    var b = document.createElement("button");
    b.type = "button";
    b.className = "av-tile" + (on ? " is-on" : "");
    b.appendChild(box);
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

  /* THE HOOD IS NOT GATED BY PLANTING and the keepsakes are, which is a
     deliberate split: the flower you wear is who your gardener IS, so it is
     free to choose, and a keepsake is something a day in the garden gave you. */
  function buildFlower() {
    var g = $("avFlower"); g.innerHTML = "";
    A.SPECIES_ORDER.forEach(function (id) {
      g.appendChild(pic("flower", id, 48, A.BLOOMS[id].name, look.flower === id,
        function () {
          /* PICKING A SPECIES RESETS THE HUE to that flower's own, so a new
             choice always arrives in the colour it was drawn for. */
          look.flower = id; look.flowerHue = null; buildFlower(); paint();
        }));
    });
    /* THE TEST IS `=== "sprout"`, and it used to be `!== "ring"`. No species
       has ever been called `ring`, so the line fired on all eight and told
       somebody picking a rose that a rose has no ring of petals. */
    $("avFlowerHue").value = look.flowerHue == null
      ? A.BLOOMS[look.flower].hue : look.flowerHue;
    var h = A.HOOD[look.flower];
    $("avFlowerNote").textContent = (h && h.mode === "sprout")
      ? A.BLOOMS[look.flower].name + " has no ring of petals to sit inside, so it grows from the head instead."
      : "";
  }

  /* ONE PER SLOT, and picking the one already on takes it off, so a slot is
     never a trap. The legs are the exception and carry no None, since bare
     legs is not something this figure offers. Small rows rather than one grid
     of everything, because a grid says "pick some of these" where the truth
     is "pick one of each". */
  function slotRows(host, slots) {
    host.innerHTML = "";
    slots.forEach(function (slot) {
      var lab = document.createElement("p");
      lab.className = "av-label";
      lab.textContent = A.SLOT_LABEL[slot];
      host.appendChild(lab);
      var ids = Object.keys(A.WEAR).filter(function (id) { return A.WEAR[id].slot === slot; });
      var row = document.createElement("div");
      /* THREE COLUMNS, so each item's three colours is exactly one row: three
         Boots, then three Clogs, then three Wellies. */
      row.className = "av-grid av-grid-wear av-grid-3";
      /* AN ITEM WITH NO COLOURS IS ONE TILE. What is held and what is on the
         face carry none: three watering cans in three greens is the same
         choice printed three times. */
      ids.forEach(function (id) {
        var tints = A.tintsFor(id);
        if (!tints.length) { row.appendChild(variant(slot, id, null)); return; }
        tints.forEach(function (ti) { row.appendChild(variant(slot, id, ti)); });
      });
      host.appendChild(row);
    });
  }
  /* EVERY COLOUR IS ITS OWN TILE: three Boots, then three Wellies. It was a
     swatch row under whichever item was chosen, which put the colours a step
     away from the choice and hid them until something was picked. */
  function wornTint(slot, id) {
    return (look.tints && look.tints[slot] != null)
      ? look.tints[slot] : A.WEAR[id].tint;
  }
  function variant(slot, id, ti) {
    var on = look[slot] === id && (ti == null || wornTint(slot, id) === ti);
    var shown = Object.assign({}, look, { tints: Object.assign({}, look.tints || {}) });
    if (ti != null) shown.tints[slot] = ti;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "av-tile" + (on ? " is-on" : "");
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

  /* THE CLOTHING IS ON THE CLOTHES STEP AND THE REST ON CARRYING, which is a
     rebalance rather than a rename: Carrying was four rows of tiles against a
     Clothes step holding one row of colours, and the new slots would have
     made that six against one. */
  function buildTop() {
    var g = $("avTop"); g.innerHTML = "";
    A.TOPS.forEach(function (h) {
      g.appendChild(pic("top", h, 54, "", look.top === h, function () {
        look.top = h; buildWearables(); paint();
      }));
    });
    slotRows($("avClothes"), A.STEP_SLOTS.top);
  }
  function buildWear() { slotRows($("avWear"), A.STEP_SLOTS.wear); }
  function buildWearables() { buildTop(); buildWear(); }

  function buildDone() {
    $("avDoneLine").textContent = look.name
      ? look.name + " is ready. They would stand in your personal garden, and beside your flower in the shared one."
      : "Ready. They would stand in your personal garden, and beside your flower in the shared one.";
    /* THE ROW OF RAW NUMBERS IS GONE. It printed "skin 1, Parted fringe and
       Wavy in 9, poppy at hue 205, top hue 210" at somebody who had just
       made a person, which is the inside of the thing rather than the thing.
       That a look IS a row of numbers is worth saying once, in words, and the
       quiet note under this already says it. */
  }

  /* ---------------------------------------------------------------- flow */
  function show() {
    document.querySelectorAll(".av-step").forEach(function (el) {
      el.hidden = el.dataset.step !== STEPS[at].id;
    });
    var lis = $("avSteps").children;
    for (var i = 0; i < lis.length; i++) {
      lis[i].classList.toggle("is-on", i === at);
      lis[i].classList.toggle("is-done", i < at);
    }
    $("avBack").disabled = at === 0;
    $("avNext").textContent = at === STEPS.length - 1 ? "keep this gardener" : "turn the page";
    $("avReset").hidden = at !== STEPS.length - 1;
    if (at !== STEPS.length - 1) $("avKeptLine").hidden = true;
    if (STEPS[at].id === "flower") buildFlower();
    if (STEPS[at].id === "top") buildTop();
    if (STEPS[at].id === "wear") buildWear();
    if (STEPS[at].id === "done") buildDone();
    paint();
  }

  /* KEEPING IT IS THE LAST PAGE'S JOB, and it says so rather than saying
     nothing. Without an account this is the browser; with one it is the
     account, and `GardenGardener` is the only thing that knows which. */
  function keep() {
    if (!G) return;
    G.save(Object.assign({}, look));
    var line = $("avKeptLine");
    line.hidden = false;
    line.textContent = window.GardenAccount && window.GardenAccount.user()
      ? "Kept on your account. They will follow you between devices."
      : "Kept in this browser. Sign in from a garden and they follow you between devices.";
  }

  function boot() {
    /* ONE LISTENER FOR EVERY PICK, rather than a `touched = true` added to
       each of the nine builders and forgotten in the tenth. */
    document.querySelector(".av-left").addEventListener("click", touch, true);
    $("avName").addEventListener("input", touch);

    if (G) {
      G.onChange(function (saved) {
        if (!saved || touched) return;
        look = Object.assign({}, A.DEFAULT_LOOK, saved);
        $("avName").value = look.name || "";
        buildSkin(); buildHair(); buildFlower(); buildTop(); buildWear(); paint();
      });
      $("avDraft").textContent = G.has()
        ? "Your gardener is kept. Nothing else on this page is."
        : "Nothing is kept until you reach the last page.";
    } else {
      $("avDraft").textContent = "A draft. Nothing here is saved yet.";
    }
    $("avReset").addEventListener("click", function () {
      at = 0; touched = true;
      look = Object.assign({}, A.DEFAULT_LOOK);
      $("avName").value = ""; $("avKeptLine").hidden = true;
      buildSkin(); buildHair(); buildFlower(); buildTop(); buildWear();
      show();
    });
    buildSteps(); buildSkin(); buildHair(); buildFlower(); buildTop(); buildWear();
    $("avFlowerHue").addEventListener("input", function () {
      look.flowerHue = +this.value; paint();
    });
    $("avName").addEventListener("input", function () {
      look.name = this.value.trim(); paint();
    });
    $("avBack").addEventListener("click", function () {
      if (at > 0) { at--; show(); }
    });
    $("avNext").addEventListener("click", function () {
      /* THE LAST PAGE KEEPS THE GARDENER, it does not throw them away. It
         used to reset the whole look, so the only thing the final button did
         was undo the six pages that led to it. */
      if (at < STEPS.length - 1) { at++; show(); }
      else keep();
    });
    show();
  }

  /* the bouquet's script is a classic one loaded before this, so its function
     declarations are already on window by now; the document may not be ready
     though, since this tag sits before the end of the body */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
