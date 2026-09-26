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
      ? A.BLOOMS[look.flower].name + " has no ring of petals to sit inside, so it grows from the head instead."
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
  /* ONE PER SLOT, and picking the one already on takes it off, so a slot is
     never a trap. Four small rows rather than one grid of eight, because a
     grid says "pick some of these" where the truth is "pick one of each". */
  function buildWear() {
    var g = $("avWear"); g.innerHTML = "";
    A.SLOTS.forEach(function (slot) {
      var lab = document.createElement("p");
      lab.className = "av-label";
      lab.textContent = { neck: "Over the shoulder", body: "Over the clothes",
                          feet: "On the feet", hold: "In hand" }[slot];
      g.appendChild(lab);
      var row = document.createElement("div");
      row.className = "av-grid av-grid-3";
      Object.keys(A.WEAR).forEach(function (id) {
        if (A.WEAR[id].slot !== slot) return;
        var box = document.createElement("span");
        box.appendChild(label(A.WEAR[id].name));
        row.appendChild(tile(look[slot] === id, box, function () {
          look[slot] = (look[slot] === id) ? null : id;
          buildWear(); paint();
        }));
      });
      var none = document.createElement("span");
      none.appendChild(label("None"));
      row.appendChild(tile(!look[slot], none, function () {
        look[slot] = null; buildWear(); paint();
      }));
      g.appendChild(row);
    });
  }

  function buildDone() {
    $("avDoneLine").textContent = look.name
      ? look.name + " is ready. They would stand in your personal garden, and beside your flower in the shared one."
      : "Ready. They would stand in your personal garden, and beside your flower in the shared one.";
    var row = $("avRow");
    var worn = A.SLOTS.filter(function (s) { return look[s]; })
      .map(function (s) { return A.WEAR[look[s]].name; });
    row.textContent = "skin " + look.skin + ", hair " + A.SHAPES[look.hair] +
      " in " + look.hairCol + ", " + look.flower + ", top hue " + look.top +
      (worn.length ? ", with " + worn.join(" and ") : ", nothing else");
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
