/* =========================================================================
   avatar-draw.js  -  your gardener, drawn from a row of numbers

   A LOOK IS DATA, and that is the whole design rather than an implementation
   detail. `{name, skin, hair, hairCol, flower, top, shoulders, held}` is very
   nearly the shape `garden3d/avatar-kit.js` already builds a 3D avatar from,
   so one saved row renders as a flat drawing here and as a figure in the 3D
   exploration. A row of numbers survives being saved against an account and
   read back next year; a picture does not. **Change one of these lists and
   change the other.**

   THREE REFERENCES, AND EACH ONE ANSWERS A DIFFERENT QUESTION:
     the body      a flat vector people set: shoulders, arms, legs, shoes
     the face      a sticker set of round characters: dot eyes, blush, nothing
     the hood      "Fruits Kids", where a child's face sits inside the fruit

   THE FLOWER IS WORN AS A HOOD AND IT IS NOT A KEEPSAKE. Every gardener wears
   one and the species is part of the LOOK, chosen on its own step, which is
   what makes the figure part of the garden rather than a person standing in
   it. The head slot is therefore spoken for, so the three keepsakes that used
   to live there moved out: one keepsake per species still holds, four at the
   shoulders and four carried.

   THE HOOD IS THE REAL SPECIES, drawn by `drawSpeciesBloom` out of
   bouquet/bouquet-sketch.js at a large radius with the face laid over its
   middle. So a daisy hood really is sixteen daisy petals. `SPECIES` in that
   file is a `const` and does not reach `window`; only function declarations
   do, which is why the rows below are written out here.
   ========================================================================= */
(function () {
  "use strict";

  /* THE GARDENS' palette, `defaultSat` 40 to 60 and `defaultLight` 55 to 75,
     not the bouquet's `SPECIES` which reaches 82: a bouquet is a gift somebody
     chose a colour for and a garden is pastel. */
  var BLOOMS = {
    daisy:     { hue: 52,  sat: 45, light: 65, name: "Daisy" },
    tulip:     { hue: 350, sat: 50, light: 60, name: "Tulip" },
    rose:      { hue: 344, sat: 55, light: 55, name: "Rose" },
    sunflower: { hue: 45,  sat: 60, light: 65, name: "Sunflower" },
    lily:      { hue: 20,  sat: 40, light: 70, name: "Lily" },
    peony:     { hue: 332, sat: 52, light: 70, name: "Peony" },
    poppy:     { hue: 356, sat: 58, light: 58, name: "Poppy" },
    lavender:  { hue: 275, sat: 55, light: 68, name: "Lavender" }
  };
  var SPECIES_ORDER = ["daisy", "tulip", "rose", "sunflower",
                       "lily", "peony", "poppy", "lavender"];

  /* HOW WIDE A SPECIES PAINTS IS NOT THE SAME FOR ANY TWO OF THEM, so a hood
     cannot be one radius. As a multiple of R the set runs tulip 0.61 of a half
     width against the sunflower's 1.15, so one radius gives a sunflower that
     swallows the shoulders beside a tulip narrower than the face it is meant
     to frame. Each R below is solved so the painted hood comes out about 190
     across, which is the face at 92 with a petal's width either side.

     TWO OF THE EIGHT CANNOT BE A HOOD AT ALL, and pretending otherwise is how
     this would have gone wrong. A tulip is a closed cup and lavender is a
     spike: neither has a ring of petals to put a face in the middle of. They
     are worn on TOP instead, a tulip as a bonnet and lavender as a plume, and
     that is honest about what those two flowers are. */
  var HOOD = {
    daisy:     { mode: "ring", R: 99 },
    sunflower: { mode: "ring", R: 84 },
    poppy:     { mode: "ring", R: 106 },
    peony:     { mode: "ring", R: 99 },
    rose:      { mode: "ring", R: 96 },
    lily:      { mode: "ring", R: 108 },
    /* THE TULIP IS TURNED OVER. Drawn the right way up on a head it is three
       points sticking into the air and reads as a jester's crown; inverted,
       its cup becomes a bell with a scalloped edge, which is what a bonnet
       is. This is also the only honest way to wear a closed flower. */
    tulip:     { mode: "top",  R: 72, dy: -30, rot: Math.PI },
    /* LAVENDER IS THREE SPIKES FANNED, not one. A single spike on the crown
       reads as a party hat or a horn, which is the one thing it must not; a
       fan of three reads as a plume and as lavender, which grows in clumps
       anyway. It also grows UPWARD out of its origin, so the origin goes at
       the crown and the spikes rise from there rather than being centred. */
    lavender:  { mode: "fan", R: 38, dy: -34, spread: 0.46 }
  };

  /* Four of each, which is a choice rather than a gesture at one, and every
     entry is distinct at the size a garden draws a person. These are
     `garden3d/avatar-kit.js`'s SKINS and HAIRS exactly. */
  var SKINS  = ["#f6e3cd", "#e4bd95", "#bb8354", "#76492c"];
  var HAIRS  = ["#3a2a1e", "#14131a", "#a4642f", "#d9c08a"];
  var SHAPES = ["Fringe", "Tucked", "Long"];
  /* the top is a HUE, so it is one number in the saved row */
  var TOPS   = [172, 210, 275, 332, 45, 18];

  /* ONE KEEPSAKE PER SPECIES STILL HOLDS. The flower hood took the head, so
     the daisy chain, the poppy pin and the sun hat moved: four at the
     shoulders and four carried. */
  var KEEPSAKES = {
    chain: { slot: "shoulders", from: "daisy",     name: "Daisy garland", note: "Simplicity and joy, worn" },
    pin:   { slot: "shoulders", from: "poppy",     name: "Poppy pin",     note: "One, worn where it shows" },
    scarf: { slot: "shoulders", from: "lavender",  name: "Soft scarf",    note: "Calm and safety, worn" },
    shawl: { slot: "shoulders", from: "rose",      name: "Rose shawl",    note: "Something warm at the collar" },
    posy:  { slot: "held",      from: "lily",      name: "Lily posy",     note: "Three, carried" },
    stem:  { slot: "held",      from: "tulip",     name: "One tulip",     note: "Carried, not planted" },
    bunch: { slot: "held",      from: "peony",     name: "Peony posy",    note: "The fullest bloom, carried" },
    sun:   { slot: "held",      from: "sunflower", name: "One sunflower", note: "For standing in the light" }
  };
  var SLOTS = ["shoulders", "held"];

  var DEFAULT_LOOK = {
    name: "", skin: 0, hair: 0, hairCol: 0, flower: "daisy", top: 172,
    shoulders: null, held: null
  };

  /* ---------------------------------------------------------- geometry
     One coordinate system, 240 by 360, scaled at the end, so a caller only
     ever chooses how big it is. */
  var W = 240, H = 360;
  var FACE = { x: 120, y: 108, r: 46 };
  var BODY = { x: 74, y: 158, w: 92, h: 100, r: 20 };
  var HAND = { l: { x: 62, y: 248 }, r: { x: 178, y: 248 } };

  function hsl(h, s, l, a) {
    return "hsla(" + h + "," + s + "%," + l + "%," + (a == null ? 1 : a) + ")";
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }
  function bloom(ctx, species, x, y, R, rot) {
    var b = BLOOMS[species] || BLOOMS.daisy;
    if (typeof window.drawSpeciesBloom !== "function") {
      /* the page can render before the bouquet's script has parsed, and a
         missing flower must not take the whole gardener down with it */
      ctx.fillStyle = hsl(b.hue, b.sat, b.light);
      ctx.beginPath(); ctx.arc(x, y, R * 0.8, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(x, y); if (rot) ctx.rotate(rot);
    window.drawSpeciesBloom(ctx, species, R, b.hue, b.sat, b.light);
    ctx.restore();
  }

  /* ---------------------------------------------------------- the hood */
  function hoodBack(ctx, look) {
    var id = BLOOMS[look.flower] ? look.flower : "daisy";
    var h = HOOD[id];
    if (h.mode === "ring") { bloom(ctx, id, FACE.x, FACE.y, h.R); return; }
    if (h.mode === "fan") {
      [-1, 0, 1].forEach(function (k) {
        ctx.save();
        ctx.translate(FACE.x, FACE.y + h.dy);
        ctx.rotate(k * h.spread);
        bloom(ctx, id, 0, 0, k === 0 ? h.R : h.R * 0.8);
        ctx.restore();
      });
      return;
    }
    bloom(ctx, id, FACE.x, FACE.y + h.dy, h.R, h.rot || 0);
  }

  /* ---------------------------------------------------------- the hair
     With a hood on, hair is a FRINGE and little else, which is what the fruit
     kids show: enough to say whose head it is and no more. It is clipped to
     the face, so it can never spill over the petals behind it. */
  function hair(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0];
    ctx.save();
    ctx.beginPath();
    ctx.arc(FACE.x, FACE.y, FACE.r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = c;
    if (look.hair === 0) {                                     /* a fringe */
      ctx.beginPath();
      ctx.moveTo(FACE.x - FACE.r, FACE.y - 6);
      ctx.quadraticCurveTo(FACE.x - FACE.r + 4, FACE.y - FACE.r - 6,
                           FACE.x, FACE.y - FACE.r - 4);
      ctx.quadraticCurveTo(FACE.x + FACE.r - 4, FACE.y - FACE.r - 6,
                           FACE.x + FACE.r, FACE.y - 6);
      ctx.quadraticCurveTo(FACE.x + 14, FACE.y - 20, FACE.x - 8, FACE.y - 16);
      ctx.quadraticCurveTo(FACE.x - FACE.r + 8, FACE.y - 14, FACE.x - FACE.r, FACE.y - 6);
      ctx.closePath(); ctx.fill();
    } else if (look.hair === 1) {               /* tucked back, a thin band */
      ctx.beginPath();
      ctx.moveTo(FACE.x - FACE.r, FACE.y - 12);
      ctx.quadraticCurveTo(FACE.x, FACE.y - FACE.r - 8, FACE.x + FACE.r, FACE.y - 12);
      ctx.quadraticCurveTo(FACE.x, FACE.y - FACE.r + 12, FACE.x - FACE.r, FACE.y - 12);
      ctx.closePath(); ctx.fill();
    } else {                              /* long, down both sides of the face */
      ctx.beginPath();
      ctx.moveTo(FACE.x - FACE.r, FACE.y - 8);
      ctx.quadraticCurveTo(FACE.x, FACE.y - FACE.r - 8, FACE.x + FACE.r, FACE.y - 8);
      ctx.lineTo(FACE.x + FACE.r, FACE.y + FACE.r);
      ctx.lineTo(FACE.x + FACE.r - 15, FACE.y + FACE.r);
      ctx.quadraticCurveTo(FACE.x + FACE.r - 16, FACE.y - 10, FACE.x + 10, FACE.y - 16);
      ctx.quadraticCurveTo(FACE.x - FACE.r + 14, FACE.y - 12, FACE.x - FACE.r + 15, FACE.y + FACE.r);
      ctx.lineTo(FACE.x - FACE.r, FACE.y + FACE.r);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------- the keepsakes */
  function drawShoulders(ctx, id) {
    var y = FACE.y + FACE.r - 2;
    if (id === "chain") {
      /* a garland ROUND the collar, not on the head: the hood is there now */
      for (var i = 0; i < 5; i++) {
        var t = i / 4;
        var x = FACE.x - 44 + t * 88;
        bloom(ctx, "daisy", x, y + 10 + Math.sin(t * Math.PI) * 9, 12);
      }
    }
    if (id === "pin") bloom(ctx, "poppy", FACE.x + 32, y + 22, 15);
    if (id === "scarf") {
      var b = BLOOMS.lavender;
      ctx.fillStyle = hsl(b.hue, 34, 62);
      rr(ctx, FACE.x - 40, y - 2, 80, 26, 13);
      ctx.fillStyle = hsl(b.hue, 34, 54);
      rr(ctx, FACE.x + 4, y + 18, 22, 48, 11);
    }
    if (id === "shawl") {
      var r = BLOOMS.rose;
      ctx.fillStyle = hsl(r.hue, 34, 60);
      ctx.beginPath();
      ctx.moveTo(FACE.x - 54, y + 6);
      ctx.quadraticCurveTo(FACE.x, y - 10, FACE.x + 54, y + 6);
      ctx.lineTo(FACE.x + 42, y + 58);
      ctx.quadraticCurveTo(FACE.x, y + 72, FACE.x - 42, y + 58);
      ctx.closePath(); ctx.fill();
      bloom(ctx, "rose", FACE.x + 28, y + 16, 14);
    }
  }
  function drawHeld(ctx, id) {
    var spec = { posy: ["lily", 3], stem: ["tulip", 1],
                 bunch: ["peony", 3], sun: ["sunflower", 1] }[id];
    if (!spec) return;
    var species = spec[0], n = spec[1];
    var hx = HAND.r.x, hy = HAND.r.y;
    ctx.strokeStyle = "#3f8d5c"; ctx.lineWidth = 5; ctx.lineCap = "round";
    var i, lean;
    for (i = 0; i < n; i++) {
      lean = (i - (n - 1) / 2) * 0.32;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.lineTo(hx + Math.sin(lean) * 64, hy - Math.cos(lean) * 64);
      ctx.stroke();
    }
    for (i = 0; i < n; i++) {
      lean = (i - (n - 1) / 2) * 0.32;
      bloom(ctx, species, hx + Math.sin(lean) * 64, hy - Math.cos(lean) * 64,
            n === 1 ? 20 : 16);
    }
  }

  /* ---------------------------------------------------------- assembly */
  function paint(ctx, look, size) {
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = (size || 300) / H;
    ctx.save();
    ctx.scale(s, s);
    ctx.clearRect(0, 0, W, H);

    var skin  = SKINS[L.skin] || SKINS[0];
    var cloth = hsl(L.top, 34, 52);
    var sleeve = hsl(L.top, 34, 44);
    var trouser = hsl(L.top, 20, 34);
    var shoe = hsl(L.top, 16, 22);

    /* THE HOOD GOES FIRST, behind everything, so the face and the body are
       laid into it rather than over a flower sitting on a head. */
    hoodBack(ctx, L);

    ctx.fillStyle = trouser;
    rr(ctx, 96, 250, 22, 58, 8);
    rr(ctx, 122, 250, 22, 58, 8);
    ctx.fillStyle = shoe;
    rr(ctx, 88, 300, 34, 20, 9);
    rr(ctx, 118, 300, 34, 20, 9);

    ctx.fillStyle = cloth;
    rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);

    /* ARMS EXIST FOR THE KEEPSAKES, not for the figure: four of the eight are
       CARRIED, and a held posy with no hand under it floats beside the body
       like a bug.
       THE SLEEVE IS A SHADE DARKER THAN THE JUMPER. Drawn in the body's own
       colour it lies invisibly ON the body and the only thing that shows is a
       skin circle at each lower corner. */
    ctx.strokeStyle = sleeve; ctx.lineWidth = 23; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(84, 176); ctx.lineTo(HAND.l.x + 4, HAND.l.y - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(156, 176); ctx.lineTo(HAND.r.x - 4, HAND.r.y - 10); ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(HAND.l.x, HAND.l.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(HAND.r.x, HAND.r.y, 13, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(FACE.x, FACE.y, FACE.r, 0, Math.PI * 2); ctx.fill();
    hair(ctx, L);

    /* THE FACE IS THREE MARKS AND THAT IS THE WHOLE BUDGET, which is the
       sticker reference's own economy: two dots, two cheeks and a mouth.
       The eyes sit BELOW the hairline or the fringe swallows them. */
    ctx.fillStyle = "rgba(233,137,147,0.45)";
    ctx.beginPath(); ctx.ellipse(FACE.x - 30, FACE.y + 16, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(FACE.x + 30, FACE.y + 16, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2f2a";
    ctx.beginPath(); ctx.ellipse(FACE.x - 15, FACE.y + 5, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(FACE.x + 15, FACE.y + 5, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3a2f2a"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(FACE.x - 6, FACE.y + 21);
    ctx.quadraticCurveTo(FACE.x, FACE.y + 27, FACE.x + 6, FACE.y + 21);
    ctx.stroke();

    if (L.shoulders) drawShoulders(ctx, L.shoulders);
    if (L.held) drawHeld(ctx, L.held);

    ctx.restore();
  }

  window.AvatarDraw = {
    paint: paint, SKINS: SKINS, HAIRS: HAIRS, SHAPES: SHAPES, TOPS: TOPS,
    KEEPSAKES: KEEPSAKES, SLOTS: SLOTS, BLOOMS: BLOOMS, HOOD: HOOD,
    SPECIES_ORDER: SPECIES_ORDER, DEFAULT_LOOK: DEFAULT_LOOK, W: W, H: H
  };
})();
