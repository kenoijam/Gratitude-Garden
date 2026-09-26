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

  /* THE HOOD IS THE SPECIES' OWN 2D DRAWING, sat behind the face, and that
     is the third answer to this and the one that holds. It was stylised
     petals for a while (a count, a half width and a tip number), which read
     as a RING OF SEPARATE BLOBS: the petal bases sat at radius 56 against a
     face of 44, so a bare twelve pixel ring showed between the flower and
     the head, and at eight petals nothing touched its neighbour either.

     Drawing the real bloom fixes all three faults at once and cannot drift
     from the product. `R` per species is chosen so the petal TIPS land at
     about 96 from the middle and everything the species keeps in its centre
     falls inside the face's own 44:

       daisy      16 petals, bases at 0.12R, gold centre at 0.20R
       sunflower  18 petals; its disc is 0.675R, so R is set to leave that
                  disc a three pixel rim round the face rather than the dark
                  collar it became at a larger radius
       rose       five rings of wide petals, lightening inward, centre 0.17R
       peony      ten outer alternating two lengths and two tones, six inner
       poppy      four deep petals on the axes and four brighter at 45, which
                  is what closes the gaps the four alone leave
       lily       six broad pointed tepals, throat at 0.39R

     `dy` is the peony's alone: its painted box is deliberately asymmetric,
     0.08R high, so it needs pushing down to sit centred on the face. */
  var HOOD = {
    daisy:     { mode: "hood",   R: 96, dy: 0 },
    sunflower: { mode: "hood",   R: 70, dy: 0 },
    rose:      { mode: "hood",   R: 95, dy: 0 },
    peony:     { mode: "hood",   R: 96, dy: 8 },
    poppy:     { mode: "hood",   R: 96, dy: 0 },
    lily:      { mode: "hood",   R: 89, dy: 0 },
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

  function hoodOf(id) { return HOOD[BLOOMS[id] ? id : "daisy"]; }
  function bloomOf(id) { return BLOOMS[id] || BLOOMS.daisy; }

  function drawHood(ctx, id) {
    var h = hoodOf(id), b = bloomOf(id);
    if (typeof window.drawSpeciesBloom !== "function") return;
    ctx.save();
    ctx.translate(FACE.x, FACE.y + h.dy);
    window.drawSpeciesBloom(ctx, id, h.R, b.hue, b.sat, b.light);
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
  /* THE ACCESSORIES ARE DRAWN TO READ ON THEIR OWN, not only in place. A
     tile shows the piece alone, so anything that leaned on the figure around
     it to be named turned into something else: the scarf was a bar with one
     tab hanging off it and read as a MALLET, and the satchel was a straight
     diagonal strap with a box at the end and read as a LADLE. Both are drawn
     with the details that name them now, which costs nothing on the gardener
     and is the whole of the tile. */
  function drawNeck(ctx, id, L) {
    var y = FACE.y + FACE.r - 4;
    if (id === "scarf") {
      var h = (L.top + 180) % 360;
      /* A BAND, A KNOT, AND TWO TAILS HANGING FROM THE MIDDLE. It took three
         goes. A band with one tab off the side was a MALLET; a band with both
         tails off the side was a coat HOOK; an outlined ring with the tails
         off it was a KEY. All three failed the same way, by hanging the ends
         off one edge, so the picture had a head and a handle. Centred under
         the knot it is symmetrical, and a symmetrical thing with fringe on
         the bottom of it is a scarf. */
      ctx.fillStyle = hsl(h, 40, 58);
      ctx.beginPath();
      ctx.moveTo(FACE.x - 35, y - 5);
      ctx.quadraticCurveTo(FACE.x, y + 9, FACE.x + 35, y - 5);
      ctx.lineTo(FACE.x + 35, y + 9);
      ctx.quadraticCurveTo(FACE.x, y + 23, FACE.x - 35, y + 9);
      ctx.closePath(); ctx.fill();
      var tail = [[-17, 46, 52], [2, 36, 62]];
      tail.forEach(function (t) {
        ctx.fillStyle = hsl(h, 40, t[2]);
        rr(ctx, FACE.x + t[0], y + 14, 15, t[1], 7);
        ctx.strokeStyle = hsl(h, 40, 44); ctx.lineWidth = 2.4; ctx.lineCap = "round";
        [0, 1, 2].forEach(function (i) {
          ctx.beginPath();
          ctx.moveTo(FACE.x + t[0] + 3 + i * 5, y + 12 + t[1]);
          ctx.lineTo(FACE.x + t[0] + 3 + i * 5, y + 19 + t[1]);
          ctx.stroke();
        });
      });
      ctx.fillStyle = hsl(h, 44, 52);
      rr(ctx, FACE.x - 15, y + 2, 30, 21, 9);
    }
    if (id === "satchel") {
      /* A CURVED STRAP AND A LARGE FLAPPED BAG. Straight and thin to a small
         box it was a LADLE: a straight handle ending in a bowl is the shape
         of a spoon, whatever colour it is. The curve and the flap and buckle
         are what put it back. */
      ctx.strokeStyle = "#a9794f"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(FACE.x - 26, y + 2);
      ctx.quadraticCurveTo(FACE.x - 6, y + 40, FACE.x + 24, y + 46);
      ctx.stroke();
      ctx.fillStyle = "#c08f5f"; rr(ctx, FACE.x + 6, y + 42, 48, 40, 10);
      ctx.fillStyle = "#a9794f";
      ctx.beginPath();
      ctx.moveTo(FACE.x + 6, y + 52);
      ctx.lineTo(FACE.x + 6, y + 48);
      ctx.quadraticCurveTo(FACE.x + 30, y + 40, FACE.x + 54, y + 48);
      ctx.lineTo(FACE.x + 54, y + 60);
      ctx.quadraticCurveTo(FACE.x + 30, y + 66, FACE.x + 6, y + 60);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#6f4c2e"; rr(ctx, FACE.x + 25, y + 57, 10, 10, 3);
    }
  }
  function drawBody(ctx, id, L) {
    if (id === "dungas") {
      /* TROUSERS WITH A BIB, NOT A BIB ALONE. Drawn as one rounded panel with
         two short straps it was the same picture as the apron in the tile
         beside it, which is the one thing a picker may not do. The leg split
         and the two buttoned braces are what tell them apart. */
      var den = hsl(214, 32, 46), dark = hsl(214, 32, 38);
      ctx.fillStyle = den;
      rr(ctx, BODY.x + 8, BODY.y + 52, 26, BODY.h - 52, 8);
      rr(ctx, BODY.x + 38, BODY.y + 52, 26, BODY.h - 52, 8);
      rr(ctx, BODY.x + 8, BODY.y + 50, 56, 26, 8);
      rr(ctx, BODY.x + 18, BODY.y + 24, 36, 32, 7);
      ctx.strokeStyle = den; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(BODY.x + 22, BODY.y + 26); ctx.lineTo(BODY.x + 16, BODY.y + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BODY.x + 50, BODY.y + 26); ctx.lineTo(BODY.x + 56, BODY.y + 2); ctx.stroke();
      ctx.fillStyle = "#e8d9a8";
      [[BODY.x + 22, BODY.y + 28], [BODY.x + 50, BODY.y + 28]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0], p[1], 3.4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BODY.x + 36, BODY.y + 76); ctx.lineTo(BODY.x + 36, BODY.y + BODY.h); ctx.stroke();
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
      /* a sole and a rounded toe, or two beige pills read as pebbles */
      ctx.fillStyle = "#e3c79c";
      rr(ctx, 94, y + 2, 26, 16, 8);
      rr(ctx, 120, y + 2, 26, 16, 8);
      ctx.fillStyle = "#b9955f";
      rr(ctx, 94, y + 14, 26, 8, 4);
      rr(ctx, 120, y + 14, 26, 8, 4);
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

  /* THREE MARKS AND THAT IS THE WHOLE BUDGET, which is the sticker set's own
     economy. The eyes sit BELOW the hairline or the fringe swallows them.
     It is its own function so a hair TILE can draw a real head rather than a
     coloured shape nobody can name. */
  function drawFace(ctx) {
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
  }

  /* ------------------------------------------------- the picker pictures
     A TILE DRAWS THE REAL THING, through the very routines that put it on the
     gardener, so the picture in the grid can never promise something else.
     Words alone were the fault: four rows reading Scarf, Satchel, None and
     Dungarees, Apron, None are eleven words and no pictures on a page whose
     whole subject is how somebody looks.

     EVERY ICON IS FITTED, NOT DRAWN TO A BOX. The piece is painted alone at
     figure size, its painted pixels are measured, and exactly that box is
     scaled into the tile. That is the bouquet's `fitThumb` rule and it is
     what makes a trowel, a pair of boots and a whole lavender spike read at
     one weight; sized by their boxes instead, the trowel is a speck beside a
     pair of dungarees. */
  var scratch = null;
  function pad() {
    if (!scratch) {
      scratch = document.createElement("canvas");
      scratch.width = W; scratch.height = H;
    }
    return scratch;
  }
  function paintedBox(cv) {
    var ctx = cv.getContext("2d");
    var d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, x, y, a;
    for (y = 0; y < cv.height; y++) {
      for (x = 0; x < cv.width; x++) {
        a = d[(y * cv.width + x) * 4 + 3];
        if (a > 10) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  /* one piece, alone, in the figure's own coordinates */
  function loose(ctx, kind, id, L) {
    if (kind === "flower") {
      var h = hoodOf(id), b = bloomOf(id);
      if (typeof window.drawSpeciesBloom !== "function") return;
      ctx.save();
      ctx.translate(FACE.x, FACE.y);
      window.drawSpeciesBloom(ctx, id, h.mode === "hood" ? 44 : 40, b.hue, b.sat, b.light);
      ctx.restore();
      return;
    }
    if (kind === "hair") {
      ctx.fillStyle = SKINS[L.skin] || SKINS[0];
      ctx.beginPath(); ctx.arc(FACE.x, FACE.y, FACE.r, 0, Math.PI * 2); ctx.fill();
      drawHair(ctx, { hair: id, hairCol: L.hairCol });
      drawFace(ctx);
      return;
    }
    if (kind === "top") {
      /* the BODY'S OWN SHAPE in that colour rather than a square of it, so
         the row reads as six jumpers and not six paint chips */
      ctx.fillStyle = hsl(id, 34, 52);
      rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
      ctx.fillStyle = SKINS[L.skin] || SKINS[0];
      ctx.beginPath(); ctx.arc(HAND.l.x, HAND.l.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(HAND.r.x, HAND.r.y, 14, 0, Math.PI * 2); ctx.fill();
      return;
    }
    var slot = WEAR[id] && WEAR[id].slot;
    if (slot === "neck") drawNeck(ctx, id, L);
    else if (slot === "body") drawBody(ctx, id, L);
    else if (slot === "feet") drawFeet(ctx, id, L);
    else if (slot === "hold") drawHold(ctx, id);
  }

  function blank(px) {
    var c = document.createElement("canvas");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(px * dpr); c.height = Math.round(px * dpr);
    c.style.width = px + "px"; c.style.height = px + "px";
    c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }

  function icon(kind, id, px, look) {
    var c = blank(px), ctx = c.getContext("2d");
    if (kind === "none") {
      /* nothing in this slot has nothing to draw, so it gets a mark rather
         than a picture: an empty ring, which is what an empty slot is */
      var m = px * 0.3;
      ctx.strokeStyle = "#bde0d6"; ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(px / 2, px / 2, m, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      return c;
    }
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = pad(), sx = s.getContext("2d");
    sx.setTransform(1, 0, 0, 1, 0, 0);
    sx.clearRect(0, 0, W, H);
    loose(sx, kind, id, L);
    var box = paintedBox(s);
    if (!box) return c;
    var k = (px * 0.88) / Math.max(box.w, box.h);
    ctx.drawImage(s, box.x, box.y, box.w, box.h,
                  (px - box.w * k) / 2, (px - box.h * k) / 2,
                  box.w * k, box.h * k);
    return c;
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

    drawFace(ctx);

    ctx.restore();
  }

  window.AvatarDraw = {
    paint: paint, SKINS: SKINS, HAIRS: HAIRS, SHAPES: SHAPES, TOPS: TOPS,
    WEAR: WEAR, SLOTS: SLOTS, BLOOMS: BLOOMS, HOOD: HOOD, icon: icon,
    SPECIES_ORDER: SPECIES_ORDER, DEFAULT_LOOK: DEFAULT_LOOK, W: W, H: H
  };
})();
