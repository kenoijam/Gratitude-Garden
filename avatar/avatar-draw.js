/* =========================================================================
   avatar-draw.js  -  your gardener, drawn from a row of numbers

   A LOOK IS DATA: `{name, skin, hair, hairCol, flower, top, neck, body, legs,
   feet, hold, face}`. A row of numbers survives being saved against an
   account and read back next year; a picture does not.

   FOUR REFERENCES, AND EACH ANSWERS A DIFFERENT QUESTION:
     the body      a flat vector people set, but SMALL under a large head
     the face      a sticker set: two dots, two cheeks, a mouth, nothing else
     the hood      a child's face inside a flower of five big rounded petals
     the sprout    two soft 3D characters whose flower GROWS out of the head

   THE HOOD IS THE SPECIES' OWN 2D DRAWING, sat behind the head and IN FRONT
   OF THE BODY, so its lower petals lie across the chest the way a real hood's
   collar does. It was stylised petals twice before that and read as a ring of
   separate blobs both times; the notes on `HOOD` below say why.

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

  /* THE HOOD IS THE SPECIES' OWN 2D DRAWING, and that is the third answer to
     this and the one that holds. Stylised petals read as a RING OF SEPARATE
     BLOBS and failed three ways at once: the bases sat at radius 56 against a
     face of 44, so a bare twelve pixel ring of background showed; at six to
     eight petals nothing touched its neighbour; and with only a count and a
     tip number to tell them apart a rose and a poppy were the same picture.

     `R` per species puts the petal TIPS near 96 from the middle and keeps
     everything the species holds in its CENTRE inside the face's own 44:

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
  /* NINE, and the order runs from the flattest to the loudest. Three fringes
     was not a choice: Fringe, Bob and Parted differ only along the brow, so
     at tile size they were one picture three times. The four that leave the
     face (Buns, Ponytail, Braids, and Curly's volume) are the ones actually
     told apart at a glance, and Cropped, Curly and Wavy are the texture
     answers for anybody who wants the hair inside the hood. */
  var SHAPES = ["Fringe", "Parted", "Bob", "Cropped", "Curly", "Wavy",
                "Buns", "Ponytail", "Braids"];
  var TOPS   = [172, 210, 275, 332, 45, 18];

  /* ACCESSORIES, NOT KEEPSAKES. They are plain things you pick: nothing is
     earned, nothing is locked and nothing is tied to a species, because the
     flower on the head already carries the garden. One per slot, so two
     choices can never fight over the same place on the figure. */
  var WEAR = {
    scarf:    { slot: "neck",  name: "Scarf" },
    satchel:  { slot: "neck",  name: "Satchel" },
    dungas:   { slot: "body",  name: "Dungarees" },
    apron:    { slot: "body",  name: "Apron" },
    cardi:    { slot: "body",  name: "Cardigan" },
    trousers: { slot: "legs",  name: "Trousers" },
    skirt:    { slot: "legs",  name: "Skirt" },
    shorts:   { slot: "legs",  name: "Shorts" },
    boots:    { slot: "feet",  name: "Boots" },
    clogs:    { slot: "feet",  name: "Clogs" },
    wellies:  { slot: "feet",  name: "Wellies" },
    can:      { slot: "hold",  name: "Watering can" },
    trowel:   { slot: "hold",  name: "Trowel" },
    specs:    { slot: "face",  name: "Glasses" },
    shades:   { slot: "face",  name: "Sunglasses" }
  };
  var SLOTS = ["neck", "body", "legs", "feet", "hold", "face"];
  /* WHICH STEP A SLOT BELONGS TO. The Carrying step was four rows of tiles
     against a Clothes step holding one row of colours, so the clothing went
     where its name already said it should. */
  var STEP_SLOTS = { top: ["body", "legs"], wear: ["neck", "feet", "hold", "face"] };
  var SLOT_LABEL = {
    neck: "Over the shoulder", body: "Over the clothes", legs: "On the legs",
    feet: "On the feet", hold: "In hand", face: "On the face"
  };
  /* LEGS HAS NO None, because bare legs is not a thing this figure offers and
     an empty legs slot would draw a gardener with nothing on below the waist. */
  var NO_NONE = { legs: true };

  var DEFAULT_LOOK = {
    name: "", skin: 0, hair: 0, hairCol: 0, flower: "daisy", top: 172,
    neck: null, body: null, legs: "trousers", feet: null,
    hold: null, face: null
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
  /* THE LEGS RUN UP INSIDE THE BODY, from 244 rather than from the body's own
     bottom edge at 258. Butted against it they were two separate objects
     touching; fourteen pixels of overlap, drawn BEFORE the body, is what
     makes the figure one shape. The feet are drawn before the body for the
     same reason, since a welly's shaft reaches above the hem.
     THEY ARE 30 APART because of the SHOES, not the legs: at 19 the two
     shoes were 26 wide on centres 19 apart, so they overlapped by 6 and the
     feet read as one dark block. */
  var LEG = { top: 244, bottom: 296, w: 16, lx: 97, rx: 127, foot: 286 };

  function hsl(h, s, l, a) {
    return "hsla(" + h + "," + s + "%," + l + "%," + (a == null ? 1 : a) + ")";
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    return "rgb(" + Math.round(((n >> 16) & 255) * k) + "," +
                    Math.round(((n >> 8) & 255) * k) + "," +
                    Math.round((n & 255) * k) + ")";
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }
  function disc(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
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
  /* A STEM OUT OF THE CROWN, AND NOTHING ELSE. There was a cream cowl round
     the face as well, to keep all eight in one silhouette family; once the
     flower moved in front of the body that cowl covered the shoulders and the
     whole top of the torso came out cream, so the two sprout species were the
     only ones that did not leave the body intact. The reference characters
     have no cowl either: the flower simply grows out of the head. */
  function drawSprout(ctx, id) {
    var h = hoodOf(id);
    var top = FACE.y - FACE.r - 8;
    ctx.strokeStyle = "#5fae72"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(FACE.x, top + 14); ctx.lineTo(FACE.x, top - h.stem); ctx.stroke();
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
     ONE SOLID MASS THAT FRAMES THE FACE, drawn WIDER than the head with the
     face painted over it, and a fringe inside the face on top of that. It
     used to be a shape clipped to the face circle, which is why nine styles
     still read as nine brow lines: a clipped fringe has no OUTLINE of its
     own, and an outline is the only thing that names a haircut at this size.
     Every style in the reference is one rounded mass wrapping the skull and
     ending at the jaw, so that is what the back pass draws now.

     IT IS DRAWN AFTER THE HOOD, over the petals, and that is right both ways.
     The petals reach 96 from the middle and would bury anything hair-shaped
     under them; and the flower is a hood BEHIND the head, so hair falls in
     FRONT of it, which is what the second reference shows with its bob coming
     out under the hood's edge. Three of the nine hang past the jaw and onto
     the flower's collar for exactly that reason. */
  var HAIR_R = FACE.r + 7;              /* seven proud of the face all round */

  function hairMass(ctx, style, F) {
    var R = HAIR_R, top = F.y - 6;
    ctx.beginPath();
    ctx.arc(F.x, top, R, Math.PI, 0);             /* the skull, left to right */
    if (style === 3) {                         /* cropped, above the ear line */
      ctx.quadraticCurveTo(F.x + R + 1, F.y - 2, F.x + R - 7, F.y + 2);
      ctx.lineTo(F.x - R + 7, F.y + 2);
      ctx.quadraticCurveTo(F.x - R - 1, F.y - 2, F.x - R, top);
    } else if (style === 1) {                  /* parted, tucked in at the jaw */
      ctx.quadraticCurveTo(F.x + R + 4, F.y + 22, F.x + R - 9, F.y + 42);
      ctx.quadraticCurveTo(F.x, F.y + 33, F.x - R + 9, F.y + 42);
      ctx.quadraticCurveTo(F.x - R - 4, F.y + 22, F.x - R, top);
    } else if (style === 2) {          /* a bob, flaring out to a flat jawline */
      ctx.quadraticCurveTo(F.x + R + 8, F.y + 20, F.x + R + 6, F.y + 46);
      ctx.quadraticCurveTo(F.x, F.y + 40, F.x - R - 6, F.y + 46);
      ctx.quadraticCurveTo(F.x - R - 8, F.y + 20, F.x - R, top);
    } else if (style === 5) {                     /* wavy, well past the jaw */
      ctx.quadraticCurveTo(F.x + R + 11, F.y + 26, F.x + R + 2, F.y + 52);
      ctx.quadraticCurveTo(F.x + R + 13, F.y + 68, F.x + R - 5, F.y + 80);
      ctx.quadraticCurveTo(F.x, F.y + 66, F.x - R + 5, F.y + 80);
      ctx.quadraticCurveTo(F.x - R - 13, F.y + 68, F.x - R - 2, F.y + 52);
      ctx.quadraticCurveTo(F.x - R - 11, F.y + 26, F.x - R, top);
    } else {                            /* everything else: to the ear line */
      ctx.quadraticCurveTo(F.x + R + 3, F.y + 10, F.x + R - 2, F.y + 24);
      ctx.quadraticCurveTo(F.x, F.y + 18, F.x - R + 2, F.y + 24);
      ctx.quadraticCurveTo(F.x - R - 3, F.y + 10, F.x - R, top);
    }
    ctx.closePath(); ctx.fill();
  }

  function drawHairBack(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0], d = shade(c, 0.8), F = FACE, i, a;
    ctx.fillStyle = c;
    if (look.hair === 4) {           /* curly, a mass of overlapping bumps */
      disc(ctx, F.x, F.y - 10, HAIR_R - 5);
      for (i = 0; i < 11; i++) {
        a = Math.PI * (0.92 + (i / 10) * 1.16);
        disc(ctx, F.x + Math.cos(a) * (HAIR_R - 4),
                  F.y - 4 + Math.sin(a) * (HAIR_R - 4), i % 2 ? 15 : 12);
      }
    } else {
      hairMass(ctx, look.hair, F);
    }
    if (look.hair === 6) {                                   /* two buns */
      [-1, 1].forEach(function (k) {
        ctx.fillStyle = c; disc(ctx, F.x + k * 36, F.y - F.r - 4, 18);
        ctx.fillStyle = d; disc(ctx, F.x + k * 36, F.y - F.r - 4, 9);
      });
      ctx.fillStyle = c;
    }
    if (look.hair === 7) {                      /* a ponytail off one side */
      ctx.beginPath();
      ctx.moveTo(F.x + 20, F.y - 34);
      ctx.quadraticCurveTo(F.x + 80, F.y - 28, F.x + 68, F.y + 30);
      ctx.quadraticCurveTo(F.x + 62, F.y + 58, F.x + 44, F.y + 53);
      ctx.quadraticCurveTo(F.x + 58, F.y + 18, F.x + 38, F.y - 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = d; rr(ctx, F.x + 28, F.y - 40, 21, 14, 6);
      ctx.fillStyle = c;
    }
    if (look.hair === 8) {                               /* two braids */
      [-1, 1].forEach(function (k) {
        ctx.fillStyle = d; rr(ctx, F.x + k * (HAIR_R - 5) - 9, F.y + 14, 18, 10, 5);
        for (i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? d : c;
          disc(ctx, F.x + k * (HAIR_R - 5), F.y + 32 + i * 16, 12 - i * 1.5);
        }
      });
      ctx.fillStyle = c;
    }
  }

  /* THE FRONT PASS IS THE BROW AND NOTHING ELSE, clipped to the face so it
     can never spill over the petals. The silhouette is the back pass's job
     now, so this only has to say where the hairline falls. */
  function drawHairFront(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0], F = FACE;
    var TOP = F.y - F.r - 8, i, n, step;
    ctx.save();
    ctx.beginPath(); ctx.arc(F.x, F.y, F.r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = c;

    function crown(lowY) {
      ctx.beginPath();
      ctx.moveTo(F.x - F.r, lowY);
      ctx.lineTo(F.x - F.r, TOP);
      ctx.lineTo(F.x + F.r, TOP);
      ctx.lineTo(F.x + F.r, lowY);
      return ctx;
    }

    if (look.hair === 0 || look.hair === 6 || look.hair === 7) {
      crown(F.y + 6);                                 /* a scalloped fringe */
      n = 5; step = (F.r * 2) / n;
      for (i = n; i > 0; i--) {
        ctx.arc(F.x - F.r + step * (i - 0.5), F.y + 6, step / 2, 0, Math.PI, true);
      }
      ctx.closePath(); ctx.fill();
    } else if (look.hair === 1 || look.hair === 8) {   /* a centre parting */
      crown(F.y + 8);
      ctx.quadraticCurveTo(F.x + 26, F.y - 18, F.x + 4, F.y - 11);
      ctx.lineTo(F.x - 4, F.y - 11);
      ctx.quadraticCurveTo(F.x - 26, F.y - 18, F.x - F.r, F.y + 8);
      ctx.closePath(); ctx.fill();
    } else if (look.hair === 2) {                   /* a curtain, dipped */
      crown(F.y + 4);
      ctx.quadraticCurveTo(F.x + 20, F.y + 2, F.x + 13, F.y - 12);
      ctx.quadraticCurveTo(F.x, F.y - 2, F.x - 13, F.y - 12);
      ctx.quadraticCurveTo(F.x - 20, F.y + 2, F.x - F.r, F.y + 4);
      ctx.closePath(); ctx.fill();
    } else if (look.hair === 3) {                /* cropped, a high hairline */
      crown(F.y - 10);
      ctx.quadraticCurveTo(F.x + 30, F.y - 22, F.x, F.y - 23);
      ctx.quadraticCurveTo(F.x - 30, F.y - 22, F.x - F.r, F.y - 10);
      ctx.closePath(); ctx.fill();
      /* NO TEMPLE TABS. Two darker rectangles at ear level were meant to read
         as sideburns and read as HEADPHONES, which is the loudest thing any
         of the nine ever did. Cropped is told apart by its high hairline and
         its tight mass, which is enough. */
    } else if (look.hair === 4) {                    /* curly, a bumpy edge */
      crown(F.y + 2); ctx.closePath(); ctx.fill();
      for (i = 0; i < 6; i++) disc(ctx, F.x - F.r + 8 + i * 15, F.y, i % 2 ? 13 : 10);
    } else {                                          /* wavy, a soft edge */
      crown(F.y + 10);
      ctx.quadraticCurveTo(F.x + 26, F.y + 14, F.x + 14, F.y - 6);
      ctx.quadraticCurveTo(F.x, F.y + 12, F.x - 16, F.y - 6);
      ctx.quadraticCurveTo(F.x - 28, F.y + 14, F.x - F.r, F.y + 10);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------ the accessories
     THEY ARE DRAWN TO READ ON THEIR OWN, not only in place, because a tile
     shows the piece alone. Anything that leaned on the figure around it to be
     named turned into something else there: the scarf was a MALLET, then a
     hook, then a key; the satchel was a LADLE; the dungarees were the apron
     again. What fixed each one is noted where it is drawn. */
  function drawNeck(ctx, id, L) {
    var y = FACE.y + FACE.r - 4;
    if (id === "scarf") {
      var h = (L.top + 180) % 360;
      /* A BAND, A KNOT, AND TWO TAILS HANGING FROM THE MIDDLE. Every failed
         version hung the ends off ONE edge, so the picture had a head and a
         handle. Centred under the knot it is symmetrical, and a symmetrical
         thing with fringe on the bottom of it is a scarf. */
      ctx.fillStyle = hsl(h, 40, 58);
      ctx.beginPath();
      ctx.moveTo(FACE.x - 35, y - 5);
      ctx.quadraticCurveTo(FACE.x, y + 9, FACE.x + 35, y - 5);
      ctx.lineTo(FACE.x + 35, y + 9);
      ctx.quadraticCurveTo(FACE.x, y + 23, FACE.x - 35, y + 9);
      ctx.closePath(); ctx.fill();
      [[-17, 46, 52], [2, 36, 62]].forEach(function (t) {
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
         of a spoon, whatever colour it is. */
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

  function drawBodyWear(ctx, id, L) {
    if (id === "dungas") {
      /* TROUSERS WITH A BIB, NOT A BIB ALONE. One rounded panel with two
         short straps was the same picture as the apron in the tile beside
         it, and a picker may not show the same picture twice. The leg split
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
        disc(ctx, p[0], p[1], 3.4);
      });
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BODY.x + 36, BODY.y + 76); ctx.lineTo(BODY.x + 36, BODY.y + BODY.h); ctx.stroke();
    }
    if (id === "apron") {
      /* A BIB, TWO NECK STRAPS, A WAIST TIE AND A POCKET. A plain trapezoid
         is a shape, not a garment: the tie is what says it is fastened on and
         the pocket is what says it is worked in. */
      var pale = "#f7edd7", band = "#ded0a6";
      ctx.strokeStyle = pale; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(BODY.x + 26, BODY.y + 22); ctx.lineTo(BODY.x + 20, BODY.y + 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BODY.x + 46, BODY.y + 22); ctx.lineTo(BODY.x + 52, BODY.y + 1); ctx.stroke();
      ctx.fillStyle = pale;
      rr(ctx, BODY.x + 21, BODY.y + 18, 30, 28, 5);
      ctx.beginPath();
      ctx.moveTo(BODY.x + 13, BODY.y + 44);
      ctx.lineTo(BODY.x + BODY.w - 13, BODY.y + 44);
      ctx.lineTo(BODY.x + BODY.w - 5, BODY.y + BODY.h + 2);
      ctx.lineTo(BODY.x + 5, BODY.y + BODY.h + 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = band;
      rr(ctx, BODY.x + 6, BODY.y + 42, BODY.w - 12, 10, 5);
      rr(ctx, BODY.x + 22, BODY.y + 68, 28, 20, 4);
      ctx.strokeStyle = band; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BODY.x + 36, BODY.y + 68); ctx.lineTo(BODY.x + 36, BODY.y + 88); ctx.stroke();
    }
    if (id === "cardi") {
      /* OPEN DOWN THE MIDDLE, which is the whole of what a cardigan is. The
         gap showing the top underneath is what separates it from a jumper,
         and the two lapels are what separate it from a waistcoat. */
      var w1 = hsl((L.top + 34) % 360, 26, 64), w2 = hsl((L.top + 34) % 360, 26, 54);
      ctx.fillStyle = w1;
      rr(ctx, BODY.x - 3, BODY.y + 4, 32, BODY.h - 2, 13);
      rr(ctx, BODY.x + BODY.w - 29, BODY.y + 4, 32, BODY.h - 2, 13);
      ctx.fillStyle = w2;
      [[1, BODY.x + 29], [-1, BODY.x + BODY.w - 29]].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s[1], BODY.y + 4);
        ctx.lineTo(s[1] - s[0] * 22, BODY.y + 4);
        ctx.quadraticCurveTo(s[1] - s[0] * 12, BODY.y + 28, s[1] - s[0] * 2, BODY.y + 40);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = "#f4ead0";
      [0, 1, 2].forEach(function (i) { disc(ctx, BODY.x + 26, BODY.y + 54 + i * 20, 3.6); });
    }
  }

  /* THE LEGS COME IN TWO PHASES: what is under the body, drawn before it so
     the tops are buried, and what lies over the hem. A skirt has to be the
     second or it is a triangle hidden inside the torso. */
  function drawLegsUnder(ctx, id, L, skin) {
    var bare = (id === "skirt" || id === "shorts");
    ctx.fillStyle = bare ? skin : hsl(L.top, 20, 34);
    rr(ctx, LEG.lx, LEG.top, LEG.w, LEG.bottom - LEG.top, 8);
    rr(ctx, LEG.rx, LEG.top, LEG.w, LEG.bottom - LEG.top, 8);
  }
  function drawLegsOver(ctx, id, L) {
    if (id === "skirt") {
      ctx.fillStyle = hsl(L.top, 30, 42);
      ctx.beginPath();
      ctx.moveTo(BODY.x + 8, BODY.y + BODY.h - 30);
      ctx.lineTo(BODY.x + BODY.w - 8, BODY.y + BODY.h - 30);
      ctx.quadraticCurveTo(BODY.x + BODY.w + 10, BODY.y + BODY.h + 16,
                           BODY.x + BODY.w + 4, BODY.y + BODY.h + 22);
      ctx.lineTo(BODY.x - 4, BODY.y + BODY.h + 22);
      ctx.quadraticCurveTo(BODY.x - 10, BODY.y + BODY.h + 16,
                           BODY.x + 8, BODY.y + BODY.h - 30);
      ctx.closePath(); ctx.fill();
    }
    if (id === "shorts") {
      /* TWO SHORT LEGS WITH A HEM, not one band across the hips. Drawn as a
         single panel they read as underwear: what makes the eye say trouser
         is the split up the middle and a turned cuff at the bottom of each
         leg. The bare shins under them come from `drawLegsUnder`. */
      var s1 = hsl(L.top, 26, 38), s2 = hsl(L.top, 26, 30);
      ctx.fillStyle = s1;
      rr(ctx, BODY.x + 5, BODY.y + BODY.h - 28, BODY.w - 10, 30, 10);
      rr(ctx, LEG.lx - 5, BODY.y + BODY.h - 12, 26, 26, 9);
      rr(ctx, LEG.rx - 4, BODY.y + BODY.h - 12, 26, 26, 9);
      ctx.fillStyle = s2;
      rr(ctx, LEG.lx - 6, BODY.y + BODY.h + 6, 28, 9, 4);
      rr(ctx, LEG.rx - 5, BODY.y + BODY.h + 6, 28, 9, 4);
    }
  }

  function drawFeet(ctx, id) {
    var y = LEG.foot;
    if (id === "boots") {
      /* A SHAFT, A CUFF, A FOOT AND A SOLE. Two blocks read as two blocks. */
      ctx.fillStyle = "#7a5438";
      rr(ctx, LEG.lx - 2, y - 26, 20, 34, 7);
      rr(ctx, LEG.rx - 2, y - 26, 20, 34, 7);
      ctx.fillStyle = "#5d3f28";
      rr(ctx, LEG.lx - 4, y - 30, 24, 11, 5);
      rr(ctx, LEG.rx - 4, y - 30, 24, 11, 5);
      ctx.fillStyle = "#7a5438";
      rr(ctx, LEG.lx - 8, y + 2, 30, 16, 7);
      rr(ctx, LEG.rx - 4, y + 2, 30, 16, 7);
      ctx.fillStyle = "#3f2c1d";
      rr(ctx, LEG.lx - 9, y + 13, 32, 8, 4);
      rr(ctx, LEG.rx - 5, y + 13, 32, 8, 4);
    }
    if (id === "clogs") {
      /* A WOODEN SOLE AND A ROUNDED TOE. Two beige pills read as pebbles. */
      ctx.fillStyle = "#9d7b46";
      rr(ctx, LEG.lx - 9, y + 12, 32, 10, 4);
      rr(ctx, LEG.rx - 5, y + 12, 32, 10, 4);
      ctx.fillStyle = "#e7cfa2";
      rr(ctx, LEG.lx - 8, y - 2, 30, 18, 9);
      rr(ctx, LEG.rx - 4, y - 2, 30, 18, 9);
      ctx.fillStyle = "#c9a870";
      rr(ctx, LEG.lx - 8, y - 4, 16, 12, 6);
      rr(ctx, LEG.rx + 8, y - 4, 16, 12, 6);
    }
    if (id === "wellies") {
      /* TALL, and the height is the point: it is the one boot you can see
         from across a garden. The rolled top is what says rubber. */
      ctx.fillStyle = "#4e7f5e";
      rr(ctx, LEG.lx - 3, y - 44, 22, 52, 9);
      rr(ctx, LEG.rx - 3, y - 44, 22, 52, 9);
      ctx.fillStyle = "#3c6349";
      rr(ctx, LEG.lx - 5, y - 48, 26, 12, 6);
      rr(ctx, LEG.rx - 5, y - 48, 26, 12, 6);
      ctx.fillStyle = "#4e7f5e";
      rr(ctx, LEG.lx - 9, y + 2, 31, 17, 8);
      rr(ctx, LEG.rx - 5, y + 2, 31, 17, 8);
      ctx.fillStyle = "#2e4b38";
      rr(ctx, LEG.lx - 10, y + 14, 33, 8, 4);
      rr(ctx, LEG.rx - 6, y + 14, 33, 8, 4);
    }
  }

  /* TWO SMALL HANDS AND NO ARMS, which is what the sprout characters do and
     what "arms behind the body" means here: a rounded hand at each side with
     the limb hidden. It also removes the stick arms, which read as twigs.
     There is no glove slot: at this size a glove is a hand in another colour,
     which is a choice nobody can see. */
  function drawHands(ctx, skin) {
    ctx.fillStyle = skin;
    disc(ctx, HAND.l.x, HAND.l.y, 14);
    disc(ctx, HAND.r.x, HAND.r.y, 14);
  }

  function drawHold(ctx, id) {
    var hx = HAND.r.x + 12, hy = HAND.r.y + 4;
    if (id === "can") {
      ctx.fillStyle = "#7fb5b0"; rr(ctx, hx - 12, hy, 30, 26, 7);
      ctx.fillStyle = "#6aa09b";
      ctx.beginPath(); ctx.moveTo(hx + 16, hy + 6); ctx.lineTo(hx + 34, hy - 4);
      ctx.lineTo(hx + 34, hy + 2); ctx.lineTo(hx + 17, hy + 13); ctx.closePath(); ctx.fill();
      /* the rose on the spout, which is what makes it a watering can rather
         than a jug */
      ctx.fillStyle = "#58908c";
      ctx.beginPath();
      ctx.ellipse(hx + 34, hy - 1, 4, 7, 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#6aa09b"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(hx + 3, hy - 1, 10, Math.PI, 0); ctx.stroke();
    }
    if (id === "trowel") {
      /* A FAT SHORT HANDLE AND A BROAD SCOOP. It was a thin stick with a grey
         head floating beside the fist, which is a PAINTBRUSH: a narrow
         handle longer than its head reads as one whatever the head is. The
         handle now passes THROUGH the hand, which is why the whole hold slot
         is painted before the hands rather than after, and the blade is wider
         than the handle with a crease down it so it reads as hollow. */
      var x = HAND.r.x + 3;
      ctx.fillStyle = "#a9794f"; rr(ctx, x - 7, hy - 24, 14, 36, 7);
      ctx.fillStyle = "#8a5f3c"; rr(ctx, x - 8, hy - 26, 16, 11, 6);
      ctx.fillStyle = "#9aa2a8"; rr(ctx, x - 6, hy + 9, 12, 9, 3);
      ctx.fillStyle = "#c3cad0";
      ctx.beginPath();
      ctx.moveTo(x - 13, hy + 16);
      ctx.quadraticCurveTo(x - 16, hy + 34, x, hy + 47);
      ctx.quadraticCurveTo(x + 16, hy + 34, x + 13, hy + 16);
      ctx.quadraticCurveTo(x, hy + 10, x - 13, hy + 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#a2abb2"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x, hy + 21); ctx.lineTo(x, hy + 40); ctx.stroke();
    }
  }

  function drawFaceWear(ctx, id) {
    var F = FACE, y = F.y + 5;
    if (id === "specs") {
      ctx.strokeStyle = "#4a3a30"; ctx.lineWidth = 3; ctx.lineJoin = "round";
      [-1, 1].forEach(function (k) {
        ctx.beginPath(); ctx.arc(F.x + k * 15, y, 12, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(F.x - 3, y - 1); ctx.lineTo(F.x + 3, y - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(F.x - 27, y - 3); ctx.lineTo(F.x - 40, y - 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(F.x + 27, y - 3); ctx.lineTo(F.x + 40, y - 7); ctx.stroke();
    }
    if (id === "shades") {
      ctx.fillStyle = "#2f3a3c";
      rr(ctx, F.x - 29, y - 11, 25, 21, 9);
      rr(ctx, F.x + 4, y - 11, 25, 21, 9);
      ctx.strokeStyle = "#2f3a3c"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(F.x - 5, y - 6); ctx.lineTo(F.x + 5, y - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(F.x - 29, y - 6); ctx.lineTo(F.x - 41, y - 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(F.x + 29, y - 6); ctx.lineTo(F.x + 41, y - 9); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      rr(ctx, F.x - 26, y - 8, 9, 7, 3);
      rr(ctx, F.x + 7, y - 8, 9, 7, 3);
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

     EVERY ICON IS FITTED, NOT DRAWN TO A BOX. The piece is painted alone at
     figure size, its painted pixels are measured, and exactly that box is
     scaled into the tile. That is the bouquet's `fitThumb` rule and it is
     what makes a trowel, a pair of boots and a whole lavender spike read at
     one weight. */
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
    var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, x, y;
    for (y = 0; y < cv.height; y++) {
      for (x = 0; x < cv.width; x++) {
        if (d[(y * cv.width + x) * 4 + 3] > 10) {
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
    var skin = SKINS[L.skin] || SKINS[0];
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
      var hl = { hair: id, hairCol: L.hairCol, skin: L.skin };
      drawHairBack(ctx, hl);
      ctx.fillStyle = skin;
      disc(ctx, FACE.x, FACE.y, FACE.r);
      drawHairFront(ctx, hl);
      drawFace(ctx);
      return;
    }
    if (kind === "top") {
      /* the BODY'S OWN SHAPE in that colour rather than a square of it, so
         the row reads as six jumpers and not six paint chips */
      ctx.fillStyle = hsl(id, 34, 52);
      rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
      drawHands(ctx, skin);
      return;
    }
    var slot = WEAR[id] && WEAR[id].slot;
    if (slot === "neck")  drawNeck(ctx, id, L);
    if (slot === "body")  drawBodyWear(ctx, id, L);
    if (slot === "legs")  { drawLegsUnder(ctx, id, L, skin); drawLegsOver(ctx, id, L); }
    if (slot === "feet")  drawFeet(ctx, id);
    if (slot === "hold")  drawHold(ctx, id);
    if (slot === "face")  drawFaceWear(ctx, id);
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
      ctx.strokeStyle = "#bde0d6"; ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(px / 2, px / 2, px * 0.3, 0, Math.PI * 2); ctx.stroke();
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

  /* ---------------------------------------------------------- assembly
     THE ORDER IS THE DESIGN. Reading down: everything below the waist first,
     so its tops are buried by the torso; then the torso and what is worn over
     it; then the arms; then THE HOOD, which comes over the shoulders rather
     than behind them; then the hair that leaves the face, over the petals,
     because a hood is behind a head and hair falls in front of a hood; then
     the face, its fringe, its three marks and anything on it. */
  function paint(ctx, look, size) {
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = (size || 300) / H;
    ctx.save();
    ctx.scale(s, s);
    ctx.clearRect(0, 0, W, H);

    var skin = SKINS[L.skin] || SKINS[0];

    drawLegsUnder(ctx, L.legs, L, skin);
    if (L.feet) drawFeet(ctx, L.feet);
    else {
      ctx.fillStyle = hsl(L.top, 16, 22);
      rr(ctx, LEG.lx - 7, LEG.foot + 2, 28, 18, 8);
      rr(ctx, LEG.rx - 5, LEG.foot + 2, 28, 18, 8);
    }

    ctx.fillStyle = hsl(L.top, 34, 52);
    rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
    drawLegsOver(ctx, L.legs, L);

    /* TWO SMALL HANDS AND NO ARMS, which is what the sprout characters do and
       what "arms behind the body" means here: a rounded hand at each side with
       the limb hidden. It also removes the stick arms, which read as twigs.
       They sit at 98 from the middle of the face against the hood's 96, so
       the flower reaches to just short of them and nothing has to be reordered
       to keep a held tool visible. WHAT IS HELD IS PAINTED FIRST, so a handle
       passes behind the fist and reads as gripped rather than as propped
       against it. */
    if (L.hold) drawHold(ctx, L.hold);
    drawHands(ctx, skin);

    /* THE FLOWER GOES OVER THE PLAIN BODY AND UNDER WHAT IS WORN OVER IT, and
       that middle position is the whole answer. Behind the body its lower
       petals were cut off at the shoulders and it read as a bloom propped
       behind somebody. In front of everything it buried them: the petals reach
       96 from the face, which is 58 of the body's 102 pixels, so the scarf
       vanished outright and the bib of every apron, dungaree and cardigan went
       with it, and a bib is the one part of each that names it. In between,
       the collar lies across the chest and an apron is still worn over the
       top, which is how an apron is worn anyway. */
    var h = hoodOf(L.flower);
    if (h.mode === "hood") drawHood(ctx, L.flower);
    else drawSprout(ctx, L.flower);

    if (L.body) drawBodyWear(ctx, L.body, L);
    if (L.neck) drawNeck(ctx, L.neck, L);

    drawHairBack(ctx, L);
    ctx.fillStyle = skin;
    disc(ctx, FACE.x, FACE.y, FACE.r);
    drawHairFront(ctx, L);
    drawFace(ctx);
    if (L.face) drawFaceWear(ctx, L.face);

    ctx.restore();
  }

  window.AvatarDraw = {
    paint: paint, icon: icon, SKINS: SKINS, HAIRS: HAIRS, SHAPES: SHAPES,
    TOPS: TOPS, WEAR: WEAR, SLOTS: SLOTS, STEP_SLOTS: STEP_SLOTS,
    SLOT_LABEL: SLOT_LABEL, NO_NONE: NO_NONE, BLOOMS: BLOOMS, HOOD: HOOD,
    SPECIES_ORDER: SPECIES_ORDER, DEFAULT_LOOK: DEFAULT_LOOK, W: W, H: H
  };
})();
