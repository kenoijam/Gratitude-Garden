/* =========================================================================
   avatar-draw.js  -  your gardener, drawn from a row of numbers

   A LOOK IS DATA: `{name, skin, hair, hairCol, flower, top, clothes, neck,
   feet, hold, face}`. A row of numbers survives being saved against an
   account and read back next year; a picture does not.

   FOUR REFERENCES, AND EACH ANSWERS A DIFFERENT QUESTION:
     the body      a flat vector people set, but SMALL under a large head
     the face      a sticker set: two dots, two cheeks, a mouth, nothing else
     the hood      a child's face inside a flower, and inside the flower a
                   fringe and a short piece down each cheek, nothing more
     the sprout    two soft 3D characters whose flower GROWS out of the head

   ONE LAYER RULE, AND THE PROPORTIONS EXIST TO MAKE IT POSSIBLE. Everything
   on the body is painted first, then the flower, then the face and its hair.
   NOTHING EVER PAINTS OVER THE FLOWER AND THE FLOWER NEVER HIDES A GARMENT.

   That rule was unreachable before, and the reason was geometry rather than
   ordering: the flower reached 96 from the face's middle while the torso
   began 38 above that, so FIFTY-EIGHT pixels of body sat inside the flower.
   Clothes on top made an apron look painted onto the petals; the flower on
   top swallowed the bib of every garment, which is the one part that names
   each of them. The figure is re-proportioned so the two barely meet: the
   flower ends at 194 and the body begins at 188, which is SIX pixels, and
   those six are behind the shoulders where a hood's collar belongs.
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

  /* THE HOOD IS THE SPECIES' OWN 2D DRAWING, sat behind the head. Stylised
     petals were tried twice and read as a ring of separate blobs both times;
     the real bloom already overlaps and already hides its own bases.

     EVERY `R` IS SET SO THE PETAL TIPS LAND AT 84 from the face's middle, and
     everything a species keeps in its CENTRE falls inside the face's own 44:

       daisy      16 petals, bases at 0.12R, gold centre at 0.20R
       sunflower  18 petals; its disc is 0.675R, and at this radius that is 42
                  against a face of 44, so the face covers it completely and
                  the dark collar that plagued every earlier attempt is gone
       rose       five rings of wide petals, lightening inward, centre 0.17R
       peony      ten outer alternating two lengths and two tones, six inner
       poppy      four deep petals on the axes and four brighter at 45
       lily       six broad pointed tepals, throat at 0.39R

     `dy` is the peony's alone: its painted box is deliberately asymmetric,
     0.08R high, so it needs pushing down to sit centred on the face. */
  var HOOD = {
    daisy:     { mode: "hood",   R: 84, dy: 0 },
    sunflower: { mode: "hood",   R: 62, dy: 0 },
    rose:      { mode: "hood",   R: 83, dy: 0 },
    peony:     { mode: "hood",   R: 84, dy: 7 },
    poppy:     { mode: "hood",   R: 84, dy: 0 },
    lily:      { mode: "hood",   R: 78, dy: 0 },
    tulip:     { mode: "sprout", stem: 26, R: 22, dy: 0 },
    lavender:  { mode: "sprout", stem: 14, R: 19, dy: 0 }
  };

  var SKINS = ["#f6e3cd", "#e4bd95", "#bb8354", "#76492c"];
  var HAIRS = ["#3a2a1e", "#14131a", "#a4642f", "#d9c08a"];
  /* NINE SHAPES, AND EVERY ONE OF THEM LIVES INSIDE THE FACE. The gardener is
     wearing a hood, so what is visible of their hair is the fringe and a
     piece down each cheek and nothing else, which is exactly what the hood
     reference shows. Hair used to be a mass drawn OVER the petals and it read
     as a flat dark patch stuck on the flower.
     TWO STYLES WENT because of that and it is worth saying which: BUNS and a
     PONYTAIL cannot exist here at all, since both are defined entirely by
     what sits outside the head. Braids survive because a plait can come down
     the cheek inside the opening. */
  var SHAPES = ["Fringe", "Parted", "Side part", "Bob", "Long",
                "Cropped", "Curly", "Wavy", "Braids"];
  var TOPS = [172, 210, 275, 332, 45, 18];

  /* CLOTHING IS ONE CHOICE, NOT A LAYER PLUS A LEG. It was "over the clothes"
     and "on the legs" as two slots, which let somebody build a cardigan with
     a skirt and shorts under an apron, and most of those combinations looked
     like an accident rather than an outfit. Each entry here dresses the WHOLE
     figure, and `bare` says whether the legs are skin below it. */
  var WEAR = {
    plain:   { slot: "clothes", name: "Plain",     bare: false },
    dungas:  { slot: "clothes", name: "Dungarees", bare: false },
    apron:   { slot: "clothes", name: "Apron",     bare: false },
    cardi:   { slot: "clothes", name: "Cardigan",  bare: false },
    skirt:   { slot: "clothes", name: "Skirt",     bare: true  },
    shorts:  { slot: "clothes", name: "Shorts",    bare: true  },
    scarf:   { slot: "neck",  name: "Scarf" },
    satchel: { slot: "neck",  name: "Satchel" },
    boots:   { slot: "feet",  name: "Boots" },
    clogs:   { slot: "feet",  name: "Clogs" },
    wellies: { slot: "feet",  name: "Wellies" },
    can:     { slot: "hold",  name: "Watering can" },
    trowel:  { slot: "hold",  name: "Trowel" },
    specs:   { slot: "face",  name: "Glasses" },
    shades:  { slot: "face",  name: "Sunglasses" }
  };
  var SLOTS = ["clothes", "neck", "feet", "hold", "face"];
  var STEP_SLOTS = { top: ["clothes"], wear: ["neck", "feet", "hold", "face"] };
  var SLOT_LABEL = {
    clothes: "What they wear", neck: "Over the shoulder",
    feet: "On the feet", hold: "In hand", face: "On the face"
  };
  /* Clothing carries no None, because Plain IS the none and a gardener with
     an empty clothes slot would have nothing on below the waist. */
  var NO_NONE = { clothes: true };

  var DEFAULT_LOOK = {
    name: "", skin: 0, hair: 0, hairCol: 0, flower: "daisy", top: 172,
    clothes: "plain", neck: null, feet: null, hold: null, face: null
  };

  /* ---------------------------------------------------------- geometry
     A LARGE HEAD ON A SMALL BODY, which is the reference's proportion. The
     figure was re-measured so the flower and the torso meet rather than
     overlap: the face sits at 120 and the flower reaches 204, and the body
     starts at 184 and runs to 272.
     THE HANDS ARE 117 FROM THE FACE'S MIDDLE against the flower's 84, so a
     held thing is never swallowed by a petal at any size. */
  var W = 240, H = 360;
  var FACE = { x: 120, y: 120, r: 44 };
  var BODY = { x: 84, y: 184, w: 72, h: 88, r: 24 };
  /* THE HANDS TUCK INTO THE BODY'S EDGE rather than sitting beside it. At 76
     and 164 against a body of 84 to 156 they overlapped by six pixels and
     read as two pale blobs floating at the sides; at ten they are part of
     the shape. */
  /* THE HANDS TUCK INTO THE BODY'S EDGE rather than sitting beside it. At 76
     and 164 against a body of 84 to 156 they overlapped it by six pixels and
     read as two pale blobs floating at the sides; at ten they are part of the
     silhouette. */
  var HAND = { l: { x: 80, y: 228 }, r: { x: 160, y: 228 } };
  /* 30 APART because of the SHOES, not the legs: at 19 the two shoes were 26
     wide on centres 19 apart, so they overlapped and read as one dark block.
     They run UP INSIDE the body from 260 rather than starting at its hem, so
     the figure is one shape rather than two objects touching. */
  var LEG = { top: 260, bottom: 308, w: 16, lx: 97, rx: 127, foot: 298 };
  /* A SHORT NECK, AND IT EXISTS FOR THE TWO SPROUT SPECIES. Separating the
     flower from the torso left twenty pixels between the chin at 164 and the
     shoulders at 184; for the six hoods that band is full of petals, but a
     tulip and a lavender have nothing down there, so their heads floated free
     of the body. It is drawn FIRST, so the head covers its top, the body
     covers its bottom and the petals cover all of it on the six that have
     them. Twenty visible pixels is a neck; the forty the first attempt left
     was a giraffe. */
  var NECK = { w: 30, top: 156, bottom: 192 };

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

  /* A STEM OUT OF THE CROWN, AND NOTHING ELSE. There was a cream cowl round
     the face as well, to keep all eight in one silhouette family; it covered
     the shoulders and the top of the torso came out cream, so the two sprout
     species were the only ones that did not leave the body intact. The
     reference characters have no cowl either. */
  function drawSprout(ctx, id) {
    var h = hoodOf(id);
    var top = FACE.y - FACE.r - 6;
    ctx.strokeStyle = "#5fae72"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(FACE.x, top + 14); ctx.lineTo(FACE.x, top - h.stem); ctx.stroke();
    ctx.fillStyle = "#79c48a";
    [-1, 1].forEach(function (k) {
      ctx.save();
      ctx.translate(FACE.x, top - h.stem * 0.45);
      ctx.scale(k, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(13, -11, 20, 2);
      ctx.quadraticCurveTo(11, 8, 0, 0);
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
     ALL OF IT IS CLIPPED TO THE FACE, so it can never sit on a petal. Each
     style is a mass across the brow plus a panel down each cheek; clipped to
     the circle those panels become crescents hugging the face, which is what
     hair looks like inside a hood. */
  function drawHair(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0], d = shade(c, 0.84), F = FACE, i;
    var TOP = F.y - F.r - 6, L = F.x - F.r, R = F.x + F.r;
    ctx.save();
    ctx.beginPath(); ctx.arc(F.x, F.y, F.r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = c;

    /* the crown down to a brow line, left open for the caller to close */
    function brow(lowY) {
      ctx.beginPath();
      ctx.moveTo(L, lowY); ctx.lineTo(L, TOP); ctx.lineTo(R, TOP); ctx.lineTo(R, lowY);
    }
    /* a panel down each side; the clip turns a rectangle into a crescent */
    function cheeks(w, toY) {
      ctx.fillRect(L, F.y - 30, w, toY - (F.y - 30));
      ctx.fillRect(R - w, F.y - 30, w, toY - (F.y - 30));
    }

    if (look.hair === 0) {                            /* a blunt fringe */
      brow(F.y + 2);
      var n = 5, step = (F.r * 2) / n;
      for (i = n; i > 0; i--) {
        ctx.arc(L + step * (i - 0.5), F.y + 2, step / 2, 0, Math.PI, true);
      }
      ctx.closePath(); ctx.fill();
      cheeks(11, F.y + 20);
    } else if (look.hair === 1) {                  /* parted in the middle */
      brow(F.y + 8);
      ctx.quadraticCurveTo(F.x + 26, F.y - 16, F.x + 4, F.y - 12);
      ctx.lineTo(F.x - 4, F.y - 12);
      ctx.quadraticCurveTo(F.x - 26, F.y - 16, L, F.y + 8);
      ctx.closePath(); ctx.fill();
      cheeks(11, F.y + 26);
    } else if (look.hair === 2) {              /* a deep side parting */
      brow(F.y + 6);
      ctx.quadraticCurveTo(F.x + 18, F.y - 4, F.x - 2, F.y - 14);
      ctx.quadraticCurveTo(F.x - 22, F.y - 22, L, F.y - 16);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(L, F.y - 30, 9, 40);
      ctx.fillRect(R - 15, F.y - 30, 15, 60);
    } else if (look.hair === 3) {         /* a bob, cheeks to the jaw */
      brow(F.y + 2); ctx.closePath(); ctx.fill();
      cheeks(17, F.y + F.r);
    } else if (look.hair === 4) {      /* long, no fringe, filling the sides */
      brow(F.y - 6);
      ctx.quadraticCurveTo(F.x, F.y - 22, L, F.y - 6);
      ctx.closePath(); ctx.fill();
      cheeks(21, F.y + F.r);
    } else if (look.hair === 5) {                 /* cropped, a high line */
      brow(F.y - 14);
      ctx.quadraticCurveTo(F.x + 28, F.y - 26, F.x, F.y - 27);
      ctx.quadraticCurveTo(F.x - 28, F.y - 26, L, F.y - 14);
      ctx.closePath(); ctx.fill();
      cheeks(7, F.y - 6);
    } else if (look.hair === 6) {                     /* curly, all bumps */
      brow(F.y - 6); ctx.closePath(); ctx.fill();
      for (i = 0; i < 6; i++) disc(ctx, L + 8 + i * 15, F.y - 6, i % 2 ? 13 : 10);
      for (i = 0; i < 4; i++) {
        disc(ctx, L + 8, F.y + 2 + i * 13, 11);
        disc(ctx, R - 8, F.y + 2 + i * 13, 11);
      }
    } else if (look.hair === 7) {                    /* wavy, a soft edge */
      brow(F.y + 6);
      ctx.quadraticCurveTo(F.x + 26, F.y + 10, F.x + 14, F.y - 8);
      ctx.quadraticCurveTo(F.x, F.y + 8, F.x - 16, F.y - 8);
      ctx.quadraticCurveTo(F.x - 28, F.y + 10, L, F.y + 6);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      [-1, 1].forEach(function (k) {
        var x = F.x + k * (F.r - 8);
        ctx.moveTo(x + k * 9, F.y - 10);
        ctx.quadraticCurveTo(x - k * 7, F.y + 6, x + k * 5, F.y + 22);
        ctx.quadraticCurveTo(x - k * 6, F.y + 36, x + k * 9, F.y + 48);
        ctx.lineTo(x + k * 22, F.y + 48);
        ctx.lineTo(x + k * 22, F.y - 10);
      });
      ctx.fill();
    } else {                                   /* braids down the cheeks */
      brow(F.y + 2);
      ctx.quadraticCurveTo(F.x + 24, F.y - 14, F.x + 3, F.y - 11);
      ctx.lineTo(F.x - 3, F.y - 11);
      ctx.quadraticCurveTo(F.x - 24, F.y - 14, L, F.y + 2);
      ctx.closePath(); ctx.fill();
      cheeks(10, F.y + 6);
      [-1, 1].forEach(function (k) {
        var x = F.x + k * (F.r - 8);
        ctx.fillStyle = d; rr(ctx, x - 8, F.y + 4, 16, 8, 4);
        for (i = 0; i < 3; i++) {
          ctx.fillStyle = i % 2 ? d : c;
          disc(ctx, x, F.y + 18 + i * 13, 10 - i * 1.4);
        }
      });
      ctx.fillStyle = c;
    }
    ctx.restore();
  }

  /* ------------------------------------------------------ the clothing
     ONE OUTFIT DRESSES THE WHOLE FIGURE. `legs` runs before the torso so the
     tops of the legs are buried and the figure is one shape; `over` runs
     after it and holds whatever lies on the chest or the hips. */
  function drawLegs(ctx, id, L, skin) {
    var w = WEAR[id] || WEAR.plain;
    ctx.fillStyle = w.bare ? skin : hsl(L.top, 20, 34);
    rr(ctx, LEG.lx, LEG.top, LEG.w, LEG.bottom - LEG.top, 8);
    rr(ctx, LEG.rx, LEG.top, LEG.w, LEG.bottom - LEG.top, 8);
  }

  function drawOver(ctx, id, L) {
    var B = BODY;
    if (id === "dungas") {
      /* TROUSERS WITH A BIB, NOT A BIB ALONE. One rounded panel with two
         short straps was the same picture as the apron beside it, and a
         picker may not show the same picture twice. The leg split and the two
         buttoned braces are what tell them apart. */
      var den = hsl(214, 32, 46), dark = hsl(214, 32, 37);
      ctx.fillStyle = den;
      rr(ctx, B.x + 8, B.y + 44, 26, B.h - 42, 8);
      rr(ctx, B.x + 38, B.y + 44, 26, B.h - 42, 8);
      rr(ctx, B.x + 8, B.y + 42, 56, 24, 8);
      rr(ctx, B.x + 18, B.y + 20, 36, 28, 7);
      ctx.strokeStyle = den; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(B.x + 22, B.y + 22); ctx.lineTo(B.x + 16, B.y + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(B.x + 50, B.y + 22); ctx.lineTo(B.x + 56, B.y + 2); ctx.stroke();
      ctx.fillStyle = "#e8d9a8";
      disc(ctx, B.x + 22, B.y + 24, 3.4);
      disc(ctx, B.x + 50, B.y + 24, 3.4);
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(B.x + 36, B.y + 66); ctx.lineTo(B.x + 36, B.y + B.h); ctx.stroke();
    }
    if (id === "apron") {
      /* A BIB, TWO NECK STRAPS, A WAIST TIE AND A POCKET. A plain trapezoid
         is a shape rather than a garment: the tie says it is fastened on and
         the pocket says it is worked in. */
      var pale = "#f7edd7", band = "#ded0a6";
      ctx.strokeStyle = pale; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(B.x + 26, B.y + 18); ctx.lineTo(B.x + 21, B.y + 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(B.x + 46, B.y + 18); ctx.lineTo(B.x + 51, B.y + 1); ctx.stroke();
      ctx.fillStyle = pale;
      rr(ctx, B.x + 21, B.y + 14, 30, 26, 5);
      ctx.beginPath();
      ctx.moveTo(B.x + 13, B.y + 38);
      ctx.lineTo(B.x + B.w - 13, B.y + 38);
      ctx.lineTo(B.x + B.w - 5, B.y + B.h + 2);
      ctx.lineTo(B.x + 5, B.y + B.h + 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = band;
      rr(ctx, B.x + 6, B.y + 36, B.w - 12, 10, 5);
      rr(ctx, B.x + 22, B.y + 58, 28, 20, 4);
      ctx.strokeStyle = band; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(B.x + 36, B.y + 58); ctx.lineTo(B.x + 36, B.y + 78); ctx.stroke();
    }
    if (id === "cardi") {
      /* OPEN DOWN THE MIDDLE, which is the whole of what a cardigan is. The
         gap showing the top underneath separates it from a jumper and the two
         lapels separate it from a waistcoat. */
      var w1 = hsl((L.top + 34) % 360, 26, 64), w2 = hsl((L.top + 34) % 360, 26, 53);
      ctx.fillStyle = w1;
      rr(ctx, B.x - 3, B.y + 4, 31, B.h - 2, 12);
      rr(ctx, B.x + B.w - 28, B.y + 4, 31, B.h - 2, 12);
      ctx.fillStyle = w2;
      [[1, B.x + 28], [-1, B.x + B.w - 28]].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s[1], B.y + 4);
        ctx.lineTo(s[1] - s[0] * 20, B.y + 4);
        ctx.quadraticCurveTo(s[1] - s[0] * 11, B.y + 24, s[1] - s[0] * 2, B.y + 34);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = "#f4ead0";
      [0, 1, 2].forEach(function (i) { disc(ctx, B.x + 25, B.y + 46 + i * 18, 3.6); });
    }
    if (id === "skirt") {
      ctx.fillStyle = hsl(L.top, 30, 42);
      ctx.beginPath();
      ctx.moveTo(B.x + 8, B.y + B.h - 28);
      ctx.lineTo(B.x + B.w - 8, B.y + B.h - 28);
      ctx.quadraticCurveTo(B.x + B.w + 10, B.y + B.h + 14, B.x + B.w + 4, B.y + B.h + 20);
      ctx.lineTo(B.x - 4, B.y + B.h + 20);
      ctx.quadraticCurveTo(B.x - 10, B.y + B.h + 14, B.x + 8, B.y + B.h - 28);
      ctx.closePath(); ctx.fill();
    }
    if (id === "shorts") {
      /* TWO SHORT LEGS WITH A HEM, not one band across the hips. Drawn as a
         single panel they read as underwear: the split up the middle and the
         turned cuff are what make the eye say trouser. */
      var s1 = hsl(L.top, 26, 38), s2 = hsl(L.top, 26, 29);
      ctx.fillStyle = s1;
      rr(ctx, B.x + 5, B.y + B.h - 26, B.w - 10, 28, 10);
      rr(ctx, LEG.lx - 5, B.y + B.h - 12, 26, 24, 9);
      rr(ctx, LEG.rx - 4, B.y + B.h - 12, 26, 24, 9);
      ctx.fillStyle = s2;
      rr(ctx, LEG.lx - 6, B.y + B.h + 4, 28, 9, 4);
      rr(ctx, LEG.rx - 5, B.y + B.h + 4, 28, 9, 4);
    }
  }

  /* ------------------------------------------------------ the accessories
     THEY ARE DRAWN TO READ ON THEIR OWN, not only in place, because a tile
     shows the piece alone. Anything that leaned on the figure around it to be
     named turned into something else there: the scarf was a MALLET, then a
     hook, then a key; the satchel was a LADLE; the dungarees were the apron
     again; the trowel was a paintbrush. */
  function drawNeck(ctx, id, L) {
    var y = BODY.y - 4;
    if (id === "scarf") {
      var h = (L.top + 180) % 360;
      /* A BAND, A KNOT, AND TWO TAILS HANGING FROM THE MIDDLE. Every failed
         version hung the ends off ONE edge, so the picture had a head and a
         handle. Centred under the knot it is symmetrical, and a symmetrical
         thing with fringe on the bottom of it is a scarf. */
      ctx.fillStyle = hsl(h, 40, 58);
      ctx.beginPath();
      ctx.moveTo(FACE.x - 34, y - 4);
      ctx.quadraticCurveTo(FACE.x, y + 10, FACE.x + 34, y - 4);
      ctx.lineTo(FACE.x + 34, y + 10);
      ctx.quadraticCurveTo(FACE.x, y + 24, FACE.x - 34, y + 10);
      ctx.closePath(); ctx.fill();
      [[-16, 40, 52], [2, 30, 62]].forEach(function (t) {
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
      rr(ctx, FACE.x - 14, y + 3, 28, 19, 8);
    }
    if (id === "satchel") {
      /* A CURVED STRAP AND A LARGE FLAPPED BAG. Straight and thin to a small
         box it was a LADLE: a straight handle ending in a bowl is a spoon,
         whatever colour it is. */
      ctx.strokeStyle = "#a9794f"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(FACE.x - 26, y + 4);
      ctx.quadraticCurveTo(FACE.x - 6, y + 38, FACE.x + 22, y + 44);
      ctx.stroke();
      ctx.fillStyle = "#c08f5f"; rr(ctx, FACE.x + 4, y + 40, 46, 38, 10);
      ctx.fillStyle = "#a9794f";
      ctx.beginPath();
      ctx.moveTo(FACE.x + 4, y + 50);
      ctx.lineTo(FACE.x + 4, y + 46);
      ctx.quadraticCurveTo(FACE.x + 27, y + 38, FACE.x + 50, y + 46);
      ctx.lineTo(FACE.x + 50, y + 58);
      ctx.quadraticCurveTo(FACE.x + 27, y + 64, FACE.x + 4, y + 58);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#6f4c2e"; rr(ctx, FACE.x + 22, y + 55, 10, 10, 3);
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
      rr(ctx, LEG.lx - 3, y - 46, 22, 54, 9);
      rr(ctx, LEG.rx - 3, y - 46, 22, 54, 9);
      ctx.fillStyle = "#3c6349";
      rr(ctx, LEG.lx - 5, y - 50, 26, 12, 6);
      rr(ctx, LEG.rx - 5, y - 50, 26, 12, 6);
      ctx.fillStyle = "#4e7f5e";
      rr(ctx, LEG.lx - 9, y + 2, 31, 17, 8);
      rr(ctx, LEG.rx - 5, y + 2, 31, 17, 8);
      ctx.fillStyle = "#2e4b38";
      rr(ctx, LEG.lx - 10, y + 14, 33, 8, 4);
      rr(ctx, LEG.rx - 6, y + 14, 33, 8, 4);
    }
  }

  /* WHAT IS CARRIED HANGS FROM THE FIST. Its handle runs vertically THROUGH
     the middle of the hand and the object hangs below, which is how a can and
     a trowel are actually carried and what stops them floating beside the arm
     the way they did when they were drawn off to one side. The order is the
     other half of it: the object is painted, then the palm over its handle,
     then a thumb across the handle, so the grip is a thing you can see. */
  var GRIP = { x: HAND.r.x, y: HAND.r.y };
  function drawHold(ctx, id) {
    var x = GRIP.x, y = GRIP.y;
    if (id === "can") {
      ctx.fillStyle = "#58908c"; rr(ctx, x - 6, y - 22, 12, 40, 5);
      ctx.fillStyle = "#7fb5b0"; rr(ctx, x - 19, y + 14, 38, 32, 9);
      ctx.fillStyle = "#6aa09b";
      ctx.beginPath();
      ctx.moveTo(x + 17, y + 22); ctx.lineTo(x + 38, y + 10);
      ctx.lineTo(x + 40, y + 17); ctx.lineTo(x + 18, y + 30);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#58908c";
      ctx.beginPath(); ctx.ellipse(x + 39, y + 13, 5, 8, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6aa09b"; rr(ctx, x - 19, y + 14, 38, 8, 4);
    }
    if (id === "trowel") {
      /* A FAT SHORT HANDLE AND A BROAD SCOOP. A narrow handle longer than its
         head reads as a PAINTBRUSH whatever the head is. */
      ctx.fillStyle = "#a9794f"; rr(ctx, x - 7, y - 24, 14, 40, 7);
      ctx.fillStyle = "#8a5f3c"; rr(ctx, x - 8, y - 26, 16, 11, 6);
      ctx.fillStyle = "#9aa2a8"; rr(ctx, x - 6, y + 13, 12, 9, 3);
      ctx.fillStyle = "#c3cad0";
      ctx.beginPath();
      ctx.moveTo(x - 13, y + 20);
      ctx.quadraticCurveTo(x - 16, y + 38, x, y + 51);
      ctx.quadraticCurveTo(x + 16, y + 38, x + 13, y + 20);
      ctx.quadraticCurveTo(x, y + 14, x - 13, y + 20);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#a2abb2"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x, y + 25); ctx.lineTo(x, y + 44); ctx.stroke();
    }
  }

  /* TWO SMALL HANDS AND NO ARMS, which is what the sprout characters do and
     what "arms behind the body" means here: a rounded hand at each side with
     the limb hidden. It also removes the stick arms, which read as twigs. */
  function drawHands(ctx, skin, holding) {
    ctx.fillStyle = skin;
    disc(ctx, HAND.l.x, HAND.l.y, 14);
    disc(ctx, HAND.r.x, HAND.r.y, 14);
    if (holding) {
      ctx.fillStyle = shade(skin, 0.93);
      rr(ctx, HAND.r.x - 13, HAND.r.y - 4, 22, 9, 4.5);
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
     economy. The eyes sit BELOW the hairline or the fringe swallows them. */
  function drawFace(ctx) {
    var F = FACE;
    ctx.fillStyle = "rgba(233,137,147,0.45)";
    ctx.beginPath(); ctx.ellipse(F.x - 28, F.y + 15, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(F.x + 28, F.y + 15, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2f2a";
    ctx.beginPath(); ctx.ellipse(F.x - 14, F.y + 5, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(F.x + 14, F.y + 5, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3a2f2a"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(F.x - 6, F.y + 20);
    ctx.quadraticCurveTo(F.x, F.y + 26, F.x + 6, F.y + 20);
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
      ctx.fillStyle = skin;
      disc(ctx, FACE.x, FACE.y, FACE.r);
      drawHair(ctx, { hair: id, hairCol: L.hairCol });
      drawFace(ctx);
      return;
    }
    if (kind === "top") {
      ctx.fillStyle = hsl(id, 34, 52);
      rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
      return;
    }
    var slot = WEAR[id] && WEAR[id].slot;
    if (slot === "clothes") {
      /* THE WHOLE LOWER FIGURE, so Plain is a picture too: a body and a pair
         of trousers is what "no outfit" looks like, and an empty tile is not. */
      drawLegs(ctx, id, L, skin);
      ctx.fillStyle = hsl(L.top, 34, 52);
      rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
      drawOver(ctx, id, L);
      return;
    }
    if (slot === "neck") drawNeck(ctx, id, L);
    if (slot === "feet") drawFeet(ctx, id);
    if (slot === "hold") {
      /* ONE HAND, NOT TWO. Fitted, a pair spans eighty pixels of empty space
         with a can in the middle of it, so the tile came out as a small
         object between two pale dots. */
      drawHold(ctx, id);
      ctx.fillStyle = skin; disc(ctx, HAND.r.x, HAND.r.y, 14);
      ctx.fillStyle = shade(skin, 0.93);
      rr(ctx, HAND.r.x - 13, HAND.r.y - 4, 22, 9, 4.5);
    }
    if (slot === "face") drawFaceWear(ctx, id);
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
     THE ORDER IS THE DESIGN, AND IT IS ONE RULE: the body and everything on
     it, then the flower, then the face and its hair. Nothing paints over the
     flower and the flower hides nothing, because the proportions above leave
     them six pixels of overlap instead of fifty-eight. */
  function paint(ctx, look, size) {
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = (size || 300) / H;
    ctx.save();
    ctx.scale(s, s);
    ctx.clearRect(0, 0, W, H);

    var skin = SKINS[L.skin] || SKINS[0];

    ctx.fillStyle = skin;
    rr(ctx, FACE.x - NECK.w / 2, NECK.top, NECK.w, NECK.bottom - NECK.top, 12);
    drawLegs(ctx, L.clothes, L, skin);
    if (L.feet) drawFeet(ctx, L.feet);
    else {
      ctx.fillStyle = hsl(L.top, 16, 22);
      rr(ctx, LEG.lx - 7, LEG.foot + 2, 28, 18, 8);
      rr(ctx, LEG.rx - 5, LEG.foot + 2, 28, 18, 8);
    }

    ctx.fillStyle = hsl(L.top, 34, 52);
    rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, BODY.r);
    drawOver(ctx, L.clothes, L);
    if (L.neck) drawNeck(ctx, L.neck, L);
    if (L.hold) drawHold(ctx, L.hold);
    drawHands(ctx, skin, !!L.hold);

    var h = hoodOf(L.flower);
    if (h.mode === "hood") drawHood(ctx, L.flower);
    else drawSprout(ctx, L.flower);

    ctx.fillStyle = skin;
    disc(ctx, FACE.x, FACE.y, FACE.r);
    drawHair(ctx, L);
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
