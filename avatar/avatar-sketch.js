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
    { id: "keep",   name: "Keepsakes" },
    { id: "done",   name: "Done" }
  ];
  var at = 0;
  var look = Object.assign({}, A.DEFAULT_LOOK);
  /* a DRAFT control, and it says so on the tile. Nothing is planted in a
     fresh browser, so without it the keepsake step is eight locked tiles and
     there is nothing to judge. It is not part of the design. */
  var showAll = false;

  var $ = function (id) { return document.getElementById(id); };

  /* ------------------------------------------------- what has been planted
     The keepsakes are earned by PLANTING, which is the rule the 3D
     exploration settled on: nothing is bought, nothing is timed and nothing
     can be missed, so at the end of a month the gardener is wearing an
     account of what the person noticed. */
  function plantedSpecies() {
    var set = {};
    try {
      var raw = localStorage.getItem("personal_gratitude_garden");
      var arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) arr.forEach(function (f) { if (f && f.species) set[f.species] = true; });
    } catch (e) { /* a private window throws on read; an empty garden is the
                     honest answer, not a broken page */ }
    return set;
  }

  /* --------------------------------------------------------------- paint */
  function paint() {
    var c = $("avCanvas");
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    A.paint(ctx, look, c.height);
    $("avShowName").textContent = look.name || "";
  }
  function thumb(species, px) {
    var c = document.createElement("canvas");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = px * dpr; c.height = px * dpr;
    c.style.width = px + "px"; c.style.height = px + "px";
    var ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var b = A.BLOOMS[species];
    ctx.save();
    ctx.translate(px / 2, px / 2);
    if (typeof window.drawSpeciesBloom === "function") {
      window.drawSpeciesBloom(ctx, species, px * 0.34, b.hue, b.sat, b.light);
    }
    ctx.restore();
    return c;
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

  function buildSkin() {
    var g = $("avSkin"); g.innerHTML = "";
    A.SKINS.forEach(function (c, i) {
      g.appendChild(tile(look.skin === i, swatch(c), function () {
        look.skin = i; buildSkin(); paint();
      }));
    });
  }
  function buildHair() {
    var sh = $("avHairShape"); sh.innerHTML = "";
    A.SHAPES.forEach(function (n, i) {
      var box = document.createElement("span");
      box.appendChild(label(n));
      sh.appendChild(tile(look.hair === i, box, function () {
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
      var box = document.createElement("span");
      box.appendChild(thumb(id, 46));
      box.appendChild(label(A.BLOOMS[id].name));
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.alignItems = "center";
      box.style.gap = "6px";
      g.appendChild(tile(look.flower === id, box, function () {
        look.flower = id; buildFlower(); paint();
      }));
    });
    var h = A.HOOD[look.flower];
    $("avFlowerNote").textContent = (h && h.mode !== "ring")
      ? A.BLOOMS[look.flower].name + " has no ring of petals to sit inside, so it is worn on top."
      : "";
  }

  function buildTop() {
    var g = $("avTop"); g.innerHTML = "";
    A.TOPS.forEach(function (h) {
      g.appendChild(tile(look.top === h, swatch("hsl(" + h + ",34%,52%)"), function () {
        look.top = h; buildTop(); paint();
      }));
    });
  }
  function buildKeeps() {
    var g = $("avKeeps"); g.innerHTML = "";
    var planted = plantedSpecies();
    var locked = 0;
    Object.keys(A.KEEPSAKES).forEach(function (id) {
      var k = A.KEEPSAKES[id];
      var open = showAll || !!planted[k.from];
      if (!open) locked++;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "av-keep" + (look[k.slot] === id ? " is-on" : "");
      if (!open) b.disabled = true;
      b.appendChild(thumb(k.from, 40));
      var t = document.createElement("span");
      var strong = document.createElement("b");
      strong.textContent = k.name;
      var small = document.createElement("small");
      small.textContent = open ? k.note : "Plant a " + k.from + " to keep this";
      t.appendChild(strong); t.appendChild(small);
      b.appendChild(t);
      b.addEventListener("click", function () {
        /* TAPPING A WORN KEEPSAKE TAKES IT OFF, so a slot is never a trap. */
        look[k.slot] = (look[k.slot] === id) ? null : id;
        buildKeeps(); paint();
      });
      g.appendChild(b);
    });
    var note = $("avKeepNote");
    note.innerHTML = "";
    if (locked) {
      note.appendChild(document.createTextNode(
        locked + " still to come. They arrive as you plant. "));
      var a = document.createElement("button");
      a.type = "button";
      a.className = "av-keep-all";
      a.textContent = showAll ? "Lock them again" : "Show them all (draft control)";
      a.addEventListener("click", function () { showAll = !showAll; buildKeeps(); });
      note.appendChild(a);
    } else if (showAll) {
      note.textContent = "All eight shown. This is a draft control, not the design.";
    }
  }
  function buildDone() {
    $("avDoneLine").textContent = look.name
      ? look.name + " is ready. They would stand in your personal garden, and beside your flower in the shared one."
      : "Ready. They would stand in your personal garden, and beside your flower in the shared one.";
    var row = $("avRow");
    var worn = A.SLOTS.filter(function (s) { return look[s]; })
      .map(function (s) { return A.KEEPSAKES[look[s]].name; });
    row.textContent = "skin " + look.skin + ", hair " + A.SHAPES[look.hair] +
      " in " + look.hairCol + ", " + look.flower + ", top hue " + look.top +
      (worn.length ? ", wearing " + worn.join(" and ") : ", nothing worn yet");
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
    if (STEPS[at].id === "keep") buildKeeps();
    if (STEPS[at].id === "done") buildDone();
    paint();
  }

  function boot() {
    buildSteps(); buildSkin(); buildHair(); buildFlower(); buildTop();
    $("avName").addEventListener("input", function () {
      look.name = this.value.trim(); paint();
    });
    $("avBack").addEventListener("click", function () {
      if (at > 0) { at--; show(); }
    });
    $("avNext").addEventListener("click", function () {
      if (at < STEPS.length - 1) { at++; }
      else { at = 0; look = Object.assign({}, A.DEFAULT_LOOK); $("avName").value = "";
             buildSkin(); buildHair(); buildFlower(); buildTop(); }
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
