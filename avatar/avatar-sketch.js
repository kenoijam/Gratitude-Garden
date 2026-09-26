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
  var look = Object.assign({}, A.DEFAULT_LOOK);

  var $ = function (id) { return document.getElementById(id); };

  /* --------------------------------------------------------------- paint */
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
  /* NINE SHAPES, drawn on a real head in the skin and colour already chosen,
     because Fringe, Bob and Parted are three words for three brow lines and
     only a silhouette tells them apart. Nine fills a three column grid
     exactly, so there is no orphan tile at either width. */
  function buildHair() {
    var sh = $("avHairShape"); sh.innerHTML = "";
    A.SHAPES.forEach(function (n, i) {
      sh.appendChild(pic("hair", i, 46, n, look.hair === i, function () {
        look.hair = i; buildHair(); paint();
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
        function () { look.flower = id; buildFlower(); paint(); }));
    });
    /* THE TEST IS `=== "sprout"`, and it used to be `!== "ring"`. No species
       has ever been called `ring`, so the line fired on all eight and told
       somebody picking a rose that a rose has no ring of petals. */
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
    var row = $("avRow");
    var worn = A.SLOTS.filter(function (s) { return look[s]; })
      .map(function (s) { return A.WEAR[look[s]].name.toLowerCase(); });
    row.textContent = "skin " + look.skin + ", hair " + A.SHAPES[look.hair] +
      " in " + look.hairCol + ", " + look.flower + ", top hue " + look.top +
      ", wearing " + worn.join(", ");
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
    $("avNext").textContent = at === STEPS.length - 1 ? "start again" : "turn the page";
    if (STEPS[at].id === "flower") buildFlower();
    if (STEPS[at].id === "top") buildTop();
    if (STEPS[at].id === "wear") buildWear();
    if (STEPS[at].id === "done") buildDone();
    paint();
  }

  function boot() {
    buildSteps(); buildSkin(); buildHair(); buildFlower(); buildTop(); buildWear();
    $("avName").addEventListener("input", function () {
      look.name = this.value.trim(); paint();
    });
    $("avBack").addEventListener("click", function () {
      if (at > 0) { at--; show(); }
    });
    $("avNext").addEventListener("click", function () {
      if (at < STEPS.length - 1) { at++; }
      else { at = 0; look = Object.assign({}, A.DEFAULT_LOOK); $("avName").value = "";
             buildSkin(); buildHair(); buildFlower(); buildTop(); buildWear(); }
      show();
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
