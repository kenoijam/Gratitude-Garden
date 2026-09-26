/* =========================================================================
   avatar-draw.js  -  your gardener, drawn from a row of numbers

   A LOOK IS DATA, and that is the whole design rather than an implementation
   detail. `{skin, hair, hairCol, top, head, shoulders, held}` is exactly the
   shape `garden3d/avatar-kit.js` already builds a 3D avatar from, field for
   field, so one saved row renders as a flat drawing here and as a figure in
   the 3D exploration. A row of numbers survives being saved against an
   account, sent to a shared garden and read back next year; a picture does
   not.

   THE KEEPSAKE BLOOMS ARE NOT DRAWN HERE. This project already pays for the
   same flower maths in seven places, and a daisy chain is not an eighth: the
   page loads `bouquet/bouquet-sketch.js` and calls its own
   `drawSpeciesBloom(ctx, species, R, hue, sat, light)`, which takes a raw 2D
   context and needs no p5. So a flower on somebody's head cannot drift from
   the flower in their garden.

   `SPECIES` in that file is a `const` at the top level of a classic script,
   which does NOT land on `window`; only function declarations do. That is why
   the eight rows below are written out here rather than read from it, and it
   is the same trap the shared garden hit with `roomKey` and `speciesList`.
   ========================================================================= */
(function () {
  "use strict";

  /* THE GARDENS' palette, not the bouquet's. `defaultSat` runs 40 to 60 and
     `defaultLight` 55 to 75, where the bouquet's `SPECIES` reaches 82: a
     bouquet is a gift somebody chose a colour for, and a garden is pastel. */
  var BLOOMS = {
    daisy:     { hue: 52,  sat: 45, light: 65 },
    tulip:     { hue: 350, sat: 50, light: 60 },
    rose:      { hue: 344, sat: 55, light: 55 },
    sunflower: { hue: 45,  sat: 60, light: 65 },
    lily:      { hue: 20,  sat: 40, light: 70 },
    peony:     { hue: 332, sat: 52, light: 70 },
    poppy:     { hue: 356, sat: 58, light: 58 },
    lavender:  { hue: 275, sat: 55, light: 68 }
  };

  /* Four of each, which is a choice rather than a gesture at one. Every entry
     is distinct at the size this is read at; sixteen browns are sixteen the
     same. These are `garden3d/avatar-kit.js`'s SKINS and HAIRS exactly. */
  var SKINS  = ["#f6e3cd", "#e4bd95", "#bb8354", "#76492c"];
  var HAIRS  = ["#3a2a1e", "#14131a", "#a4642f", "#d9c08a"];
  var SHAPES = ["Short", "Bun", "Long"];
  /* the top is a HUE, so it is one number in the saved row and the same
     number the 3D kit reads */
  var TOPS   = [172, 210, 275, 332, 45, 18];

  var KEEPSAKES = {
    chain: { slot: "head",      from: "daisy",     name: "Daisy chain", note: "Simplicity and joy, worn" },
    hat:   { slot: "head",      from: "sunflower", name: "Sun hat",     note: "For standing in the light" },
    pin:   { slot: "head",      from: "poppy",     name: "Poppy pin",   note: "One, worn where it shows" },
    scarf: { slot: "shoulders", from: "lavender",  name: "Soft scarf",  note: "Calm and safety, worn" },
    shawl: { slot: "shoulders", from: "rose",      name: "Rose shawl",  note: "Something warm at the collar" },
    posy:  { slot: "held",      from: "lily",      name: "Lily posy",   note: "Three, carried" },
    stem:  { slot: "held",      from: "tulip",     name: "One tulip",   note: "Carried, not planted" },
    bunch: { slot: "held",      from: "peony",     name: "Peony posy",  note: "The fullest bloom, carried" }
  };
  var SLOTS = ["head", "shoulders", "held"];

  var DEFAULT_LOOK = {
    name: "", skin: 0, hair: 0, hairCol: 0, top: 172,
    head: null, shoulders: null, held: null
  };

  /* ---------------------------------------------------------- geometry
     Drawn in a fixed 240 by 360 space and scaled at the end, so every number
     below is a position in ONE coordinate system and a caller only ever
     chooses how big it is. */
  var W = 240, H = 360;
  var HEAD = { x: 120, y: 98, r: 58 };
  var BODY = { x: 66, y: 152, w: 108, h: 122, r: 48 };
  var HAND = { l: { x: 46, y: 252 }, r: { x: 194, y: 252 } };

  function hsl(h, s, l, a) {
    return "hsla(" + h + "," + s + "%," + l + "%," + (a == null ? 1 : a) + ")";
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
  function bloom(ctx, species, x, y, R) {
    var b = BLOOMS[species] || BLOOMS.daisy;
    if (typeof window.drawSpeciesBloom !== "function") {
      /* the page can render before the bouquet's script has parsed, and a
         missing flower must not take the whole gardener down with it */
      ctx.fillStyle = hsl(b.hue, b.sat, b.light);
      ctx.beginPath(); ctx.arc(x, y, R * 0.8, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    window.drawSpeciesBloom(ctx, species, R, b.hue, b.sat, b.light);
    ctx.restore();
  }

  /* ---------------------------------------------------------- the hair
     Two passes, because a face on figure has hair BEHIND its head as well as
     on top of it, and the two cannot be one path: the bun and the long fall
     have to be painted before the head or they sit on the face. */
  function hairBack(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0];
    ctx.fillStyle = c;
    if (look.hair === 1) {                                  /* a bun, behind */
      ctx.beginPath();
      ctx.arc(HEAD.x + 40, HEAD.y - 44, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.hair === 2) {                       /* long, a fall either side */
      roundRect(ctx, HEAD.x - HEAD.r - 6, HEAD.y - 20, 30, 150, 15);
      roundRect(ctx, HEAD.x + HEAD.r - 24, HEAD.y - 20, 30, 150, 15);
    }
  }
  function hairFront(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0];
    ctx.fillStyle = c;
    /* A CAP THAT SITS ON THE HEAD, not a circle behind it. It is the head's
       own circle clipped to its upper part plus a fringe that dips lower on
       one side, which is what stops a hairline reading as a drawn arc. */
    ctx.save();
    ctx.beginPath();
    ctx.arc(HEAD.x, HEAD.y, HEAD.r + 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(HEAD.x - HEAD.r - 4, HEAD.y + 10);
    ctx.quadraticCurveTo(HEAD.x - HEAD.r + 6, HEAD.y - HEAD.r - 12,
                         HEAD.x + 6, HEAD.y - HEAD.r - 10);
    ctx.quadraticCurveTo(HEAD.x + HEAD.r + 4, HEAD.y - HEAD.r + 4,
                         HEAD.x + HEAD.r + 6, HEAD.y - 2);
    /* the fringe, dipping across the brow */
    ctx.quadraticCurveTo(HEAD.x + 22, HEAD.y - 16, HEAD.x - 10, HEAD.y - 22);
    ctx.quadraticCurveTo(HEAD.x - HEAD.r + 6, HEAD.y - 24, HEAD.x - HEAD.r - 4, HEAD.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------- the keepsakes */
  function drawHeadPiece(ctx, id) {
    if (id === "chain") {
      /* A RING OF DAISIES ON the head, not in it. Set at the head's own
         radius they came out half buried and read as flowers dropped in a
         bush; they sit a little proud of it. */
      var R = HEAD.r + 4;
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI * 0.86 + (i / 4) * Math.PI * 0.72;
        bloom(ctx, "daisy", HEAD.x + Math.cos(a) * R, HEAD.y + Math.sin(a) * R, 13);
      }
    }
    if (id === "hat") {
      /* A BRIM IS MEASURED AGAINST THE HEAD. Drawn at what a sun hat
         actually is, it swallowed the shoulders and read as a mushroom. */
      ctx.fillStyle = "#e5c988";
      ctx.beginPath();
      ctx.ellipse(HEAD.x, HEAD.y - 40, HEAD.r + 26, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#edd79f";
      ctx.beginPath();
      ctx.ellipse(HEAD.x, HEAD.y - 56, 42, 26, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c8a468";
      roundRect(ctx, HEAD.x - 42, HEAD.y - 50, 84, 12, 6);
      bloom(ctx, "sunflower", HEAD.x + 34, HEAD.y - 46, 15);
    }
    if (id === "pin") bloom(ctx, "poppy", HEAD.x + 44, HEAD.y - 30, 17);
  }
  function drawShoulderPiece(ctx, id) {
    if (id === "scarf") {
      var b = BLOOMS.lavender;
      ctx.fillStyle = hsl(b.hue, 34, 62);
      roundRect(ctx, HEAD.x - 44, HEAD.y + HEAD.r - 12, 88, 30, 15);
      ctx.fillStyle = hsl(b.hue, 34, 55);
      roundRect(ctx, HEAD.x + 4, HEAD.y + HEAD.r + 12, 26, 56, 12);
    }
    if (id === "shawl") {
      var r = BLOOMS.rose;
      ctx.fillStyle = hsl(r.hue, 34, 60);
      ctx.beginPath();
      ctx.moveTo(HEAD.x - 58, HEAD.y + HEAD.r + 6);
      ctx.quadraticCurveTo(HEAD.x, HEAD.y + HEAD.r - 14, HEAD.x + 58, HEAD.y + HEAD.r + 6);
      ctx.lineTo(HEAD.x + 46, HEAD.y + HEAD.r + 64);
      ctx.quadraticCurveTo(HEAD.x, HEAD.y + HEAD.r + 80, HEAD.x - 46, HEAD.y + HEAD.r + 64);
      ctx.closePath();
      ctx.fill();
      bloom(ctx, "rose", HEAD.x + 30, HEAD.y + HEAD.r + 16, 15);
    }
  }
  function drawHeldPiece(ctx, id) {
    var spec = { posy: ["lily", 3], stem: ["tulip", 1], bunch: ["peony", 3] }[id];
    if (!spec) return;
    var species = spec[0], n = spec[1];
    var hx = HAND.r.x, hy = HAND.r.y;
    ctx.strokeStyle = "#3f8d5c";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (var i = 0; i < n; i++) {
      var lean = (i - (n - 1) / 2) * 0.34;
      var tx = hx + Math.sin(lean) * 62, ty = hy - Math.cos(lean) * 62;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 6);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    for (var j = 0; j < n; j++) {
      var l2 = (j - (n - 1) / 2) * 0.34;
      bloom(ctx, species, hx + Math.sin(l2) * 62, hy - Math.cos(l2) * 62, 17);
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
    var shoe  = hsl(L.top, 22, 32);

    hairBack(ctx, L);

    /* legs first, so the body's rounded foot sits over where they meet */
    ctx.fillStyle = shoe;
    roundRect(ctx, 88, 262, 28, 68, 14);
    roundRect(ctx, 124, 262, 28, 68, 14);

    ctx.fillStyle = cloth;
    roundRect(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);

    /* ARMS EXIST FOR THE KEEPSAKES, not for the figure: three of the eight
       are CARRIED, and a held posy with no hand under it floats beside the
       body like a bug.
       THE SLEEVE IS A SHADE DARKER THAN THE JUMPER, and that is the whole of
       what made the first version read as two hands stuck to a blob. Drawn in
       the body's own colour it lay invisibly ON the body, so the only thing
       that showed was a skin circle at each lower corner. Darker, and reaching
       clear of the body's edge, it is an arm. */
    ctx.strokeStyle = hsl(L.top, 34, 44);
    ctx.lineWidth = 25;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(84, 190); ctx.lineTo(HAND.l.x + 5, HAND.l.y - 9); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(156, 190); ctx.lineTo(HAND.r.x - 5, HAND.r.y - 9); ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(HAND.l.x, HAND.l.y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(HAND.r.x, HAND.r.y, 15, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(HEAD.x, HEAD.y, HEAD.r, 0, Math.PI * 2); ctx.fill();

    hairFront(ctx, L);

    /* THE FACE IS THREE MARKS AND THAT IS THE WHOLE BUDGET. The reference's
       friend is two dots and two cheeks; anything past that at this size is
       texture nobody can see. The eyes also have to sit BELOW the hairline or
       the cap swallows them. */
    ctx.fillStyle = "rgba(233,137,147,0.42)";
    ctx.beginPath(); ctx.ellipse(HEAD.x - 36, HEAD.y + 20, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(HEAD.x + 36, HEAD.y + 20, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2f2a";
    ctx.beginPath(); ctx.ellipse(HEAD.x - 19, HEAD.y + 8, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(HEAD.x + 19, HEAD.y + 8, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3a2f2a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(HEAD.x - 7, HEAD.y + 26);
    ctx.quadraticCurveTo(HEAD.x, HEAD.y + 32, HEAD.x + 7, HEAD.y + 26);
    ctx.stroke();

    /* shoulders, then head, then held: the order they overlap in */
    if (L.shoulders) drawShoulderPiece(ctx, L.shoulders);
    if (L.head) drawHeadPiece(ctx, L.head);
    if (L.held) drawHeldPiece(ctx, L.held);

    ctx.restore();
  }

  window.AvatarDraw = {
    paint: paint, SKINS: SKINS, HAIRS: HAIRS, SHAPES: SHAPES, TOPS: TOPS,
    KEEPSAKES: KEEPSAKES, SLOTS: SLOTS, BLOOMS: BLOOMS,
    DEFAULT_LOOK: DEFAULT_LOOK, W: W, H: H
  };
})();
