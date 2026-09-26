/* =========================================================================
   avatar-draw.js  -  your gardener, drawn from a row of numbers

   A LOOK IS DATA: `{name, skin, hair, hairCol, flower, top, neck, body, feet,
   hold}`. A row of numbers survives being saved against an account and read
   back next year; a picture does not.

   FOUR REFERENCES, AND EACH ANSWERS A DIFFERENT QUESTION:
     the body      a flat vector people set, but SMALL under a large head
     the face      a sticker set: two dots, two cheeks, a mouth, nothing else
     the hood      a child's face inside a flower of five big rounded petals
     the sprout    two soft 3D characters whose flower GROWS out of the head

   THE PETALS ARE STYLISED, NOT THE SPECIES DRAWING, and that reverses an
   earlier decision on purpose. The hood used to be `drawSpeciesBloom` at a
   large radius, which could not drift from the product but could never look
   like the reference either: a daisy hood came out as sixteen narrow petals
   and the sunflower's brown disc ringed the face like a dark collar. The
   petal COUNT and the COLOUR still come from the species, so the eight stay
   apart; the shape is drawn for a hood.

   TWO OF THE EIGHT GROW INSTEAD OF BEING WORN. A tulip is a closed cup and
   lavender is a spike, so neither has a ring of petals to put a face inside.
   Worn on top they read as a chef's hat and a spiky crown, which is what the
   sprout characters fix: a plain cowl round the face and the flower on a
   short stem out of the crown. Those two ARE drawn by `drawSpeciesBloom`,
   since there they are a flower on a stem, which is exactly what that
   function draws.
   ========================================================================= */
(function () {
  "use strict";

  /* THE GARDENS' palette, `defaultSat` 40 to 60 and `defaultLight` 55 to 75,
     not the bouquet's which reaches 82: a bouquet is a gift somebody chose a
     colour for and a garden is pastel. */
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

  /* FEW AND BIG, which is the reference's whole character: five petals, not
     sixteen. The count still separates the species (a lily has five broad
     ones, a sunflower ten narrower), and `w`/`h` are the petal's own half
     width and half length so a rose can be round and a lily pointed. */
  var HOOD = {
    daisy:     { mode: "hood", n: 8,  w: 25, h: 40, r: 56, tip: 0.75 },
    sunflower: { mode: "hood", n: 11, w: 20, h: 44, r: 56, tip: 0.6 },
    rose:      { mode: "hood", n: 6,  w: 34, h: 38, r: 52, tip: 1 },
    peony:     { mode: "hood", n: 7,  w: 31, h: 40, r: 54, tip: 0.95 },
    poppy:     { mode: "hood", n: 6,  w: 33, h: 40, r: 53, tip: 1 },
    lily:      { mode: "hood", n: 5,  w: 28, h: 46, r: 56, tip: 0.5 },
    tulip:     { mode: "sprout", stem: 30, R: 25, dy: 0 },
    lavender:  { mode: "sprout", stem: 16, R: 21, dy: 0 }
  };

  var SKINS  = ["#f6e3cd", "#e4bd95", "#bb8354", "#76492c"];
  var HAIRS  = ["#3a2a1e", "#14131a", "#a4642f", "#d9c08a"];
  var SHAPES = ["Fringe", "Bob", "Parted"];
  var TOPS   = [172, 210, 275, 332, 45, 18];

  /* ACCESSORIES, NOT KEEPSAKES. They are plain things you pick: nothing is
     earned, nothing is locked and nothing is tied to a species, because the
     flower on the head already carries the garden. One per slot, so two
     choices can never fight over the same place on the figure. */
  var WEAR = {
    scarf:  { slot: "neck", name: "Scarf" },
    satchel:{ slot: "neck", name: "Satchel" },
    dungas: { slot: "body", name: "Dungarees" },
    apron:  { slot: "body", name: "Apron" },
    boots:  { slot: "feet", name: "Boots" },
    clogs:  { slot: "feet", name: "Clogs" },
    can:    { slot: "hold", name: "Watering can" },
    trowel: { slot: "hold", name: "Trowel" }
  };
  var SLOTS = ["neck", "body", "feet", "hold"];

  var DEFAULT_LOOK = {
    name: "", skin: 0, hair: 0, hairCol: 0, flower: "daisy", top: 172,
    neck: null, body: null, feet: null, hold: null
  };

  /* ---------------------------------------------------------- geometry
     A LARGE HEAD ON A SMALL BODY, which is the reference's proportion and not
     the flat people set's: there the head is about a third of the figure, and
     here the hood alone is wider than the body is tall. */
  var W = 240, H = 360;
  var FACE = { x: 120, y: 118, r: 44 };
  /* THE HEAD SITS ON THE BODY, it does not hover over it. At `y: 188` the
     face's own bottom edge was 162 and the body began 26px below it, so the
     background showed between them and the figure read as a head balanced on
     a separate object. The body top now overlaps the chin, which is how every
     one of the references is built: there is no neck at all. */
  var BODY = { x: 84, y: 156, w: 72, h: 102, r: 26 };
  var HAND = { l: { x: 76, y: 206 }, r: { x: 164, y: 206 } };

  function hsl(h, s, l, a) {
    return "hsla(" + h + "," + s + "%," + l + "%," + (a == null ? 1 : a) + ")";
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }

  /* ONE PETAL, drawn from the centre outward: a rounded blob whose tip can be
     pulled to a point, so the same routine gives a rose's round petal and a
     lily's narrow one. `tip` 1 is fully round and 0.5 is a point. */
  function petal(ctx, w, h, tip) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w, -h * 0.18, -w * tip, -h * 0.86, 0, -h);
    ctx.bezierCurveTo(w * tip, -h * 0.86, w, -h * 0.18, 0, 0);
    ctx.closePath();
  }

  function hoodOf(id) { return HOOD[BLOOMS[id] ? id : "daisy"]; }

  function drawHood(ctx, id) {
    var h = hoodOf(id), b = BLOOMS[id] || BLOOMS.daisy;
    var fill = hsl(b.hue, b.sat, b.light);
    var edge = hsl(b.hue, Math.min(100, b.sat + 8), Math.max(12, b.light - 16));
    ctx.save();
    ctx.translate(FACE.x, FACE.y);
    for (var i = 0; i < h.n; i++) {
      ctx.save();
      ctx.rotate((i / h.n) * Math.PI * 2);
      ctx.translate(0, -h.r);
      petal(ctx, h.w, h.h, h.tip);
      ctx.fillStyle = fill; ctx.fill();
      /* the reference outlines every petal, which is what keeps a ring of
         one colour from reading as a single blob */
      ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* A PLAIN COWL AND A STEM, for the two that cannot be a hood. The cowl is
     what keeps all eight in one silhouette family; the flower on top is the
     real species, since on a stem that is exactly what `drawSpeciesBloom`
     draws. */
  function drawSprout(ctx, id, skin) {
    var h = hoodOf(id);
    /* the cowl HUGS the head rather than haloing it: at +12 it read as a pale
       disc floating behind the face */
    ctx.fillStyle = "#fdf6e6";
    ctx.beginPath(); ctx.arc(FACE.x, FACE.y, FACE.r + 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(FACE.x, FACE.y + FACE.r, FACE.r + 2, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    var top = FACE.y - FACE.r - 8;
    ctx.strokeStyle = "#5fae72"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(FACE.x, top + 6); ctx.lineTo(FACE.x, top - h.stem); ctx.stroke();
    /* two leaves on the stem, which is what makes it a sprout rather than a
       flower taped to a head */
    ctx.fillStyle = "#79c48a";
    [-1, 1].forEach(function (k) {
      ctx.save();
      ctx.translate(FACE.x, top - h.stem * 0.45);
      ctx.scale(k, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(15, -12, 22, 2);
      ctx.quadraticCurveTo(12, 9, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    var b = BLOOMS[id];
    if (typeof window.drawSpeciesBloom === "function") {
      ctx.save();
      ctx.translate(FACE.x, top - h.stem + h.dy);
      window.drawSpeciesBloom(ctx, id, h.R, b.hue, b.sat, b.light);
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------- the hair
     Inside the hood a fringe is nearly all of it, which is what the reference
     shows: a soft cap of colour over the brow and no more. Clipped to the
     face, so it can never spill over the petals behind it. */
  function drawHair(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0];
    var F = FACE;
    ctx.save();
    ctx.beginPath(); ctx.arc(F.x, F.y, F.r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = c;
    if (look.hair === 0) {                     /* a scalloped fringe */
      ctx.beginPath();
      ctx.moveTo(F.x - F.r, F.y + 2);
      ctx.lineTo(F.x - F.r, F.y - F.r);
      ctx.lineTo(F.x + F.r, F.y - F.r);
      ctx.lineTo(F.x + F.r, F.y + 2);
      var n = 4, step = (F.r * 2) / n;
      for (var i = n; i > 0; i--) {
        ctx.arc(F.x - F.r + step * (i - 0.5), F.y + 2, step / 2, 0, Math.PI, true);
      }
      ctx.closePath(); ctx.fill();
    } else if (look.hair === 1) {                /* a bob, down the sides */
      ctx.beginPath();
      ctx.moveTo(F.x - F.r, F.y + F.r);
      ctx.lineTo(F.x - F.r, F.y - F.r);
      ctx.lineTo(F.x + F.r, F.y - F.r);
      ctx.lineTo(F.x + F.r, F.y + F.r);
      ctx.lineTo(F.x + F.r - 13, F.y + F.r);
      ctx.quadraticCurveTo(F.x + F.r - 14, F.y - 6, F.x + 12, F.y - 12);
      ctx.quadraticCurveTo(F.x - F.r + 12, F.y - 8, F.x - F.r + 13, F.y + F.r);
      ctx.closePath(); ctx.fill();
    } else {                                       /* parted in the middle */
      ctx.beginPath();
      ctx.moveTo(F.x - F.r, F.y - 2);
      ctx.lineTo(F.x - F.r, F.y - F.r);
      ctx.lineTo(F.x + F.r, F.y - F.r);
      ctx.lineTo(F.x + F.r, F.y - 2);
      ctx.quadraticCurveTo(F.x + 16, F.y - 22, F.x, F.y - 14);
      ctx.quadraticCurveTo(F.x - 16, F.y - 22, F.x - F.r, F.y - 2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------ the accessories */
  function drawNeck(ctx, id, L) {
    var y = FACE.y + FACE.r - 4;
    if (id === "scarf") {
      ctx.fillStyle = hsl((L.top + 180) % 360, 40, 58);
      rr(ctx, FACE.x - 34, y, 68, 22, 11);
      ctx.fillStyle = hsl((L.top + 180) % 360, 40, 50);
      rr(ctx, FACE.x + 6, y + 16, 18, 40, 9);
    }
    if (id === "satchel") {
      ctx.strokeStyle = "#a9794f"; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(FACE.x - 22, y + 4); ctx.lineTo(FACE.x + 30, y + 58); ctx.stroke();
      ctx.fillStyle = "#c08f5f"; rr(ctx, FACE.x + 18, y + 52, 34, 28, 8);
      ctx.fillStyle = "#a9794f"; rr(ctx, FACE.x + 18, y + 52, 34, 10, 5);
    }
  }
  function drawBody(ctx, id, L) {
    if (id === "dungas") {
      ctx.fillStyle = hsl(214, 32, 46);
      rr(ctx, BODY.x + 10, BODY.y + 22, BODY.w - 20, BODY.h - 14, 10);
      ctx.strokeStyle = hsl(214, 32, 46); ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(BODY.x + 20, BODY.y + 24); ctx.lineTo(BODY.x + 24, BODY.y + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BODY.x + BODY.w - 20, BODY.y + 24); ctx.lineTo(BODY.x + BODY.w - 24, BODY.y + 4); ctx.stroke();
    }
    if (id === "apron") {
      ctx.fillStyle = "#f3e7cd";
      ctx.beginPath();
      ctx.moveTo(BODY.x + 16, BODY.y + 20);
      ctx.lineTo(BODY.x + BODY.w - 16, BODY.y + 20);
      ctx.lineTo(BODY.x + BODY.w - 8, BODY.y + BODY.h);
      ctx.lineTo(BODY.x + 8, BODY.y + BODY.h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e0cfa8"; rr(ctx, BODY.x + 16, BODY.y + 20, BODY.w - 32, 8, 4);
    }
  }
  function drawFeet(ctx, id, L) {
    var y = 288;
    if (id === "boots") {
      ctx.fillStyle = "#6b4a33";
      rr(ctx, 97, y - 10, 22, 32, 9);
      rr(ctx, 121, y - 10, 22, 32, 9);
      ctx.fillStyle = "#553a28";
      rr(ctx, 94, y + 12, 26, 12, 6);
      rr(ctx, 120, y + 12, 26, 12, 6);
    }
    if (id === "clogs") {
      ctx.fillStyle = "#d9b98a";
      rr(ctx, 94, y + 4, 26, 18, 8);
      rr(ctx, 120, y + 4, 26, 18, 8);
    }
  }
  function drawHold(ctx, id) {
    var hx = HAND.r.x + 12, hy = HAND.r.y + 4;
    if (id === "can") {
      ctx.fillStyle = "#7fb5b0"; rr(ctx, hx - 12, hy, 30, 26, 7);
      ctx.fillStyle = "#6aa09b";
      ctx.beginPath(); ctx.moveTo(hx + 16, hy + 6); ctx.lineTo(hx + 34, hy - 4);
      ctx.lineTo(hx + 34, hy + 2); ctx.lineTo(hx + 17, hy + 13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#6aa09b"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(hx + 3, hy - 1, 10, Math.PI, 0); ctx.stroke();
    }
    if (id === "trowel") {
      ctx.strokeStyle = "#a9794f"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 4); ctx.lineTo(hx - 4, hy + 16); ctx.stroke();
      ctx.fillStyle = "#b8bfc4";
      ctx.beginPath();
      ctx.moveTo(hx - 12, hy + 16); ctx.quadraticCurveTo(hx - 4, hy + 42, hx + 4, hy + 16);
      ctx.closePath(); ctx.fill();
    }
  }

  /* ---------------------------------------------------------- assembly */
  function paint(ctx, look, size) {
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = (size || 300) / H;
    ctx.save();
    ctx.scale(s, s);
    ctx.clearRect(0, 0, W, H);

    var skin = SKINS[L.skin] || SKINS[0];
    var cloth = hsl(L.top, 34, 52);
    var trouser = hsl(L.top, 20, 34);
    var shoe = hsl(L.top, 16, 22);
    var h = hoodOf(L.flower);

    if (h.mode === "hood") drawHood(ctx, L.flower);
    else drawSprout(ctx, L.flower, skin);

    /* THE LEGS ARE 25 APART, NOT 19, and that is the shoes' doing rather than
       the legs'. At 19 the two shoes were 26 wide on centres 19 apart, so they
       overlapped by 6 and the feet read as one dark block. The leg spacing is
       set by whatever has to stand on it. */
    ctx.fillStyle = trouser;
    rr(ctx, 100, 258, 15, 36, 7);
    rr(ctx, 125, 258, 15, 36, 7);
    if (!L.feet) {
      ctx.fillStyle = shoe;
      rr(ctx, 95, 288, 24, 18, 8);
      rr(ctx, 121, 288, 24, 18, 8);
    }

    ctx.fillStyle = cloth;
    rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
    if (L.body) drawBody(ctx, L.body, L);
    if (L.feet) drawFeet(ctx, L.feet, L);

    /* TWO SMALL HANDS AND NO ARMS, which is what the sprout characters do and
       what "arms behind the body" means here: a rounded hand at each side with
       the limb hidden. It also removes the stick arms, which read as twigs. */
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(HAND.l.x, HAND.l.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(HAND.r.x, HAND.r.y, 14, 0, Math.PI * 2); ctx.fill();
    if (L.hold) drawHold(ctx, L.hold);
    if (L.neck) drawNeck(ctx, L.neck, L);

    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(FACE.x, FACE.y, FACE.r, 0, Math.PI * 2); ctx.fill();
    drawHair(ctx, L);

    /* THREE MARKS AND THAT IS THE WHOLE BUDGET, which is the sticker set's own
       economy. The eyes sit BELOW the hairline or the fringe swallows them. */
    ctx.fillStyle = "rgba(233,137,147,0.45)";
    ctx.beginPath(); ctx.ellipse(FACE.x - 28, FACE.y + 15, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(FACE.x + 28, FACE.y + 15, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2f2a";
    ctx.beginPath(); ctx.ellipse(FACE.x - 14, FACE.y + 5, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(FACE.x + 14, FACE.y + 5, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3a2f2a"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(FACE.x - 6, FACE.y + 20);
    ctx.quadraticCurveTo(FACE.x, FACE.y + 26, FACE.x + 6, FACE.y + 20);
    ctx.stroke();

    ctx.restore();
  }

  window.AvatarDraw = {
    paint: paint, SKINS: SKINS, HAIRS: HAIRS, SHAPES: SHAPES, TOPS: TOPS,
    WEAR: WEAR, SLOTS: SLOTS, BLOOMS: BLOOMS, HOOD: HOOD,
    SPECIES_ORDER: SPECIES_ORDER, DEFAULT_LOOK: DEFAULT_LOOK, W: W, H: H
  };
})();
