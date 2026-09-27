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
    /* THE PEONY IS 92, NOT 84, and it is the one species that needs its own
       figure for a reason that is written down: its painted box runs -1.00 to
       +0.84 of R, so at the same R as the others it stood 154 tall against
       their 168 and read as a smaller flower on the same head. 92 puts its
       span back on theirs; `dy` is 0.08 R, the amount its own drawing sits
       above its origin. */
    peony:     { mode: "hood",   R: 92, dy: 7 },
    poppy:     { mode: "hood",   R: 84, dy: 0 },
    lily:      { mode: "hood",   R: 78, dy: 0 },
    tulip:     { mode: "sprout", stem: 26, R: 22, dy: 0 },
    lavender:  { mode: "sprout", stem: 14, R: 19, dy: 0 }
  };

  /* EIGHT SKINS AS A RAMP, and the four that were here are IN it rather
     than in front of it. A swatch grid that is not a ramp reads as a random
     handful, so the four new ones are interleaved: the light end gains one
     above `#f6e3cd` and the rest fall between the old four. Both grids are
     `av-grid-4`, so eight and twelve fill two and three clean rows with no
     orphan tile at any width.
     THEY WERE REORDERED, WHICH IS ONLY SAFE BECAUSE NOTHING IS SAVED YET. A
     look stores `skin` and `hairCol` as INDICES into these lists, so once a
     gardener can be kept against an account neither list may ever be
     reordered again, only appended to. `DEFAULT_LOOK` moved with them so the
     figure a first visitor sees is unchanged. */
  var SKINS = ["#fbeedd", "#f6e3cd", "#eed0ae", "#e4bd95",
               "#cf9d6e", "#bb8354", "#96603a", "#76492c"];
  /* TWELVE HAIRS IN THREE ROWS, and the row break falls where the KIND
     changes: eight naturals, dark to light, then four that no head grows.
     The unreal four are last because a picker that opens on pink says the
     gardener is a toy, and they are worth having anyway: this is the one
     choice on the figure with no bearing on anything else, so it is the one
     place somebody can simply please themselves. */
  var HAIRS = ["#14131a", "#3a2a1e", "#7a5540", "#a4642f",
               "#b0412c", "#d9c08a", "#9c9aa2", "#efe7d6",
               "#e489b2", "#6fc6ae", "#a98ede", "#74aee2"];
  /* THE FRINGE AND THE BACK ARE TWO SEPARATE CHOICES. They were nine fixed
     styles, so a blunt fringe could only ever come with a bob and a side
     parting only ever with one long piece. Split, twelve tiles buy
     THIRTY-SIX combinations where nine used to buy nine, and the two halves
     are drawn in different places anyway: a fringe is clipped to the face,
     and a back falls out of the bonnet from the crown.
     BUNS AND A PONYTAIL STILL CANNOT EXIST, since both are defined by what
     sits above and outside the head, which is where the flower is. */
  var FRINGES = ["Blunt", "Parted", "Side part", "High", "Curly", "Choppy"];
  var BACKS = ["Tucked in", "Bob", "Long", "Wavy", "Braids", "Buns"];

  var TOPS = [172, 210, 275, 332, 45, 18];
  /* SIX COLOURS, AND EVERY GARMENT AND ACCESSORY PICKS FROM THEM. Each one
     carried a hard-coded colour before, so a gardener was a figure in their
     own hue with a fixed blue dungaree and a fixed brown boot stuck on. Each
     `WEAR` entry names the one it starts in, and `look.tints` overrides it
     per slot; picking a different item in that slot clears the override, so
     a new garment always arrives in the colour it was drawn for. */
  var TINTS = [
    { h: 214, s: 30, l: 48, name: "Denim" },
    { h: 42,  s: 34, l: 84, name: "Cream" },
    { h: 142, s: 22, l: 42, name: "Sage" },
    { h: 18,  s: 42, l: 50, name: "Clay" },
    { h: 322, s: 24, l: 56, name: "Plum" },
    { h: 44,  s: 52, l: 60, name: "Ochre" }
  ];

  /* CLOTHING IS ONE CHOICE, NOT A LAYER PLUS A LEG. It was "over the clothes"
     and "on the legs" as two slots, which let somebody build a cardigan with
     a skirt and shorts under an apron, and most of those combinations looked
     like an accident rather than an outfit. Each entry here dresses the WHOLE
     figure, and `bare` says whether the legs are skin below it. */
  var WEAR = {
    dungas:  { slot: "clothes", name: "Dungarees", bare: false, tint: 0, tints: [0, 2, 3] },
    apron:   { slot: "clothes", name: "Apron",     bare: false, tint: 1, tints: [1, 2, 4] },
    cardi:   { slot: "clothes", name: "Cardigan",  bare: false, tint: 2, tints: [2, 4, 5] },
    skirt:   { slot: "clothes", name: "Skirt",     bare: true,  tint: 4, tints: [4, 0, 2] },
    shorts:  { slot: "clothes", name: "Shorts",    bare: true,  tint: 0, tints: [0, 3, 2] },
    scarf:   { slot: "neck",  name: "Scarf",        tint: 3, tints: [3, 4, 2] },
    satchel: { slot: "neck",  name: "Satchel",      tint: 3, tints: [3, 0, 5] },
    boots:   { slot: "feet",  name: "Boots",        tint: 3, tints: [3, 0, 2] },
    clogs:   { slot: "feet",  name: "Clogs",        tint: 5, tints: [5, 3, 1] },
    wellies: { slot: "feet",  name: "Wellies",      tint: 2, tints: [2, 0, 4] },
    can:     { slot: "hold",  name: "Watering can", tint: 2 },
    trowel:  { slot: "hold",  name: "Trowel",       tint: 3 },
    basket:  { slot: "hold",  name: "Basket",       tint: 3 },
    specs:   { slot: "face",  name: "Glasses",      tint: 3 },
    shades:  { slot: "face",  name: "Sunglasses",   tint: 0 },
    freckles:{ slot: "face",  name: "Freckles",     tint: 3 }
  };
  var SLOTS = ["clothes", "neck", "feet", "hold", "face"];
  var STEP_SLOTS = { top: ["clothes"], wear: ["neck", "feet", "hold", "face"] };
  var SLOT_LABEL = {
    clothes: "What they wear", neck: "Over the shoulder",
    feet: "On the feet", hold: "In hand", face: "On the face"
  };
  /* THERE ARE NO None TILES ANY MORE. Every slot is three items in three
     colours, nine tiles in three clean rows, and tapping the one already
     chosen takes it off. `plain` went with them: an empty clothes slot IS the
     plain body, whose colour is the row of six directly above, so a Plain
     tile was that same choice printed twice. */
  var NO_NONE = {};

  /* FIVE READY GARDENERS, AND THEY LIVE HERE RATHER THAN ON EITHER PAGE that
     shows them. The landing page draws this row under the three garden cards
     and the build page opens on the same five as a gallery, so a look written
     in two files would be two rows that drift; `avatar-draw.js` is the one
     file both pages already load.
     THEY ARE UNLIKE EACH OTHER IN EVERY SLOT rather than one gardener in five
     colours. A row of one figure recoloured says the thing has a palette; a
     row of five different people says it can be built. Both SPROUT species
     are here, since a flower on a stem looks unlike the six that ring a face
     and a gallery that showed only rings would hide half the set. */
  var TEMPLATES = [
    { id: "wren",  name: "Wren",
      look: { skin: 1, fringe: 0, back: 2, hairCol: 1, flower: "daisy",
              top: 172, clothes: "dungas", feet: "boots", hold: "trowel" } },
    { id: "poppy", name: "Poppy",
      look: { skin: 5, fringe: 2, back: 4, hairCol: 4, flower: "poppy",
              top: 196, clothes: "apron", feet: "clogs", neck: "scarf",
              face: "freckles" } },
    { id: "sol",   name: "Sol",
      look: { skin: 3, fringe: 5, back: 0, hairCol: 9, flower: "tulip",
              top: 44,  clothes: "shorts", feet: "wellies", hold: "basket" } },
    { id: "ash",   name: "Ash",
      look: { skin: 7, fringe: 1, back: 5, hairCol: 7, flower: "peony",
              top: 280, clothes: "cardi", feet: "boots", neck: "satchel",
              face: "specs" } },
    { id: "fern",  name: "Fern",
      look: { skin: 2, fringe: 3, back: 3, hairCol: 10, flower: "lavender",
              top: 128, clothes: "skirt", feet: "clogs", hold: "can",
              face: "shades" } }
  ];
  function templateOf(id) {
    for (var i = 0; i < TEMPLATES.length; i++) {
      if (TEMPLATES[i].id === id) return TEMPLATES[i];
    }
    return null;
  }

  var DEFAULT_LOOK = {
    name: "", skin: 1, fringe: 0, back: 0, hairCol: 1,
    flower: "daisy", flowerHue: null, top: 172,
    clothes: null, neck: null, feet: null, hold: null, face: null,
    tints: {}
  };

  /* the colour an item is wearing: its own default unless this look has
     overridden that slot */
  function tintOf(L, slot) {
    var item = WEAR[L[slot]];
    if (!item || item.tint == null) return TINTS[0];
    var i = (L.tints && L.tints[slot] != null) ? L.tints[slot] : item.tint;
    return TINTS[i] || TINTS[item.tint];
  }
  function tone(T, dl, ds) {
    return hsl(T.h, Math.max(0, T.s + (ds || 0)),
               Math.max(8, Math.min(96, T.l + (dl || 0))));
  }
  function tintable(id) { return !!(WEAR[id] && WEAR[id].tints); }
  /* THE THREE COLOURS AN ITEM OFFERS. Three rather than the whole palette,
     because six denims of a dungaree is a paint chart and three is a choice;
     each item names the three that suit what it is. */
  function tintsFor(id) { return (WEAR[id] && WEAR[id].tints) || []; }

  /* ---------------------------------------------------------- geometry
     A LARGE HEAD ON A SMALL BODY, which is the reference's proportion. The
     figure was re-measured so the flower and the torso meet rather than
     overlap: the face sits at 120 and the flower reaches 204, and the body
     starts at 184 and runs to 272.
     THE HANDS ARE 113 FROM THE FACE'S MIDDLE against the flower's 84, so a
     held thing is never swallowed by a petal at any size. */
  var W = 240, H = 360;
  /* THE HEAD IS BUILT THE WAY THE HOOD REFERENCES ARE, in three rings from
     the outside in, and getting this wrong is what broke five rounds of hair.

       HEAD   the centre the bonnet and its opening are struck from
       CROWN  the solid shape of the bonnet, with the petals radiating off it
       OPEN   the FACE OPENING cut in that bonnet
       FACE   the skin, sat LOW in the opening, which leaves the rest of the
              opening for the hair to fill

     That last line is the whole trick. In every reference the hair is a solid
     mass filling the opening, and the face is a smaller oval sitting low
     inside it, so what is left over reads as a fringe across the brow and a
     piece down each cheek WITHOUT any of it having to be drawn as hair. Ours
     had no opening at all, only a circle of skin on a ring of petals, so hair
     could only ever be painted onto the face or onto the flower. */
  var HEAD = { x: 120, y: 120 };
  /* 58 BY 56, DOWN FROM 66 BY 63. At the larger size the daisy and the
     sunflower read as bonnets rather than as those species: the crown was
     covering two thirds of a bloom whose tips reach 84. */
  var CROWN = { rx: 58, ry: 56 };
  var OPEN = { rx: 55, ry: 53 };
  var FACE = { x: 120, y: 128, rx: 44, ry: 45, r: 44 };

  /* THE TORSO IS A BELL, not a rounded rectangle, and that is most of what
     made the figure read as boxy. It narrows to 58 at the shoulders and
     flares to 80 at the hips, which is the shape both soft-character
     references use; it also gives a skirt and a hem somewhere honest to
     start, and it stops the arms reading as stuck onto a box.
     THE TOP TUCKS UNDER THE CHIN at 162 against a face reaching 168, so
     there is no neck. There was one for a pass, and twenty pixels of it
     under an 88 pixel head was a giraffe. */
  var BODY = { cx: 120, top: 162, bottom: 260, topW: 58, botW: 80 };
  /* SHORT STUB ARMS, not two hands floating at the sides. They come off the
     shoulders in the clothing's own colour and end in a round hand, which is
     what gives a carried trowel something to belong to. */
  var ARM = { sx: 22, sy: 22, hx: 42, hy: 64, r: 13 };
  /* 30 APART because of the SHOES, not the legs: at 19 the two shoes were 26
     wide on centres 19 apart, so they overlapped and read as one dark block.
     They run UP INSIDE the body from 250 rather than starting at its hem, so
     the figure is one shape rather than two objects touching. */
  var LEG = { top: 250, bottom: 302, w: 16, lx: 97, rx: 127, foot: 294 };

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

  /* the bell's own outline, and the half width at any height along it, so a
     hem, a waistband or a cardigan panel can follow the shape rather than
     being a rectangle laid across it */
  function bodyPath(ctx) {
    var B = BODY, cx = B.cx, t = B.top, b = B.bottom;
    var tw = B.topW / 2, bw = B.botW / 2;
    ctx.beginPath();
    ctx.moveTo(cx - tw, t + 16);
    ctx.quadraticCurveTo(cx - tw + 1, t, cx - tw + 16, t);
    ctx.lineTo(cx + tw - 16, t);
    ctx.quadraticCurveTo(cx + tw - 1, t, cx + tw, t + 16);
    ctx.bezierCurveTo(cx + tw + 7, t + 52, cx + bw, b - 44, cx + bw, b - 20);
    ctx.quadraticCurveTo(cx + bw, b, cx + bw - 20, b);
    ctx.lineTo(cx - bw + 20, b);
    ctx.quadraticCurveTo(cx - bw, b, cx - bw, b - 20);
    ctx.bezierCurveTo(cx - bw, b - 44, cx - tw - 7, t + 52, cx - tw, t + 16);
    ctx.closePath();
  }
  function halfAt(y) {
    var B = BODY;
    var t = Math.max(0, Math.min(1, (y - B.top) / (B.bottom - B.top)));
    return (B.topW + (B.botW - B.topW) * t) / 2;
  }
  /* EVERY GARMENT ON THE TORSO IS DRAWN THROUGH THE BELL'S OWN CLIP, which is
     what keeps a bib or a panel inside the silhouette without any of them
     having to know the shape. The skirt is the one exception, since it flares
     past the hem on purpose. */
  function inBody(ctx, fn) {
    ctx.save(); bodyPath(ctx); ctx.clip(); fn(); ctx.restore();
  }

  function facePath(ctx) {
    ctx.beginPath();
    ctx.ellipse(FACE.x, FACE.y, FACE.rx, FACE.ry, 0, 0, Math.PI * 2);
  }
  function openPath(ctx) {
    ctx.beginPath();
    ctx.ellipse(HEAD.x, HEAD.y, OPEN.rx, OPEN.ry, 0, 0, Math.PI * 2);
  }

  function hoodOf(id) { return HOOD[BLOOMS[id] ? id : "daisy"]; }
  /* THE FLOWER TAKES A CHOSEN HUE, which is what every other part of this
     project already lets somebody do: the gardens' planter and the bouquet's
     sender both pick one. `flowerHue` null means the species' own. The
     saturation and lightness stay the species', so a re-coloured daisy is
     still a pastel daisy rather than whatever the slider lands on. */
  function bloomOf(id, L) {
    var b = BLOOMS[id] || BLOOMS.daisy;
    if (!L || L.flowerHue == null) return b;
    return { hue: L.flowerHue, sat: b.sat, light: b.light, name: b.name };
  }

  /* THE FLOWER IS A BONNET, NOT A RING OF PETALS, and the SOLID CROWN is
     what makes it one. The reference hood is ONE continuous soft shape with a
     face nestled in an opening; ours was separate petals with gaps between
     them. The crown closes those gaps and the petals become the ears and trim
     on it.
     THERE IS NO RIM ROUND THE OPENING. A deeper ring was drawn there for a
     round, meant to say the face was inside the bonnet rather than resting on
     it, and it read as a hoop drawn on the head. The hair's own edge does
     that job. */
  function drawHood(ctx, id, L) {
    var h = hoodOf(id), b = bloomOf(id, L);
    if (typeof window.drawSpeciesBloom !== "function") return;
    ctx.save();
    ctx.translate(HEAD.x, HEAD.y + h.dy);
    ctx.fillStyle = hsl(b.hue, b.sat, Math.max(14, b.light - 4));
    ctx.beginPath();
    ctx.ellipse(0, 0, CROWN.rx, CROWN.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    window.drawSpeciesBloom(ctx, id, h.R, b.hue, b.sat, b.light);
    ctx.fillStyle = hsl(b.hue, b.sat, Math.max(14, b.light - 4));
    ctx.beginPath();
    ctx.ellipse(0, 0, CROWN.rx - 3, CROWN.ry - 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* A STEM OUT OF THE CROWN, AND NOTHING ELSE. There was a cream cowl round
     the face as well, to keep all eight in one silhouette family; it covered
     the shoulders and the top of the torso came out cream, so the two sprout
     species were the only ones that did not leave the body intact. The
     reference characters have no cowl either. */
  function drawSprout(ctx, id, L) {
    var h = hoodOf(id);
    var top = HEAD.y - CROWN.ry + 4;
    ctx.strokeStyle = "#5fae72"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(HEAD.x, top + 16); ctx.lineTo(HEAD.x, top - h.stem); ctx.stroke();
    ctx.fillStyle = "#79c48a";
    [-1, 1].forEach(function (k) {
      ctx.save();
      ctx.translate(HEAD.x, top - h.stem * 0.45);
      ctx.scale(k, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(13, -11, 20, 2);
      ctx.quadraticCurveTo(11, 8, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    var b = bloomOf(id, L);
    if (typeof window.drawSpeciesBloom === "function") {
      ctx.save();
      ctx.translate(HEAD.x, top - h.stem + h.dy);
      window.drawSpeciesBloom(ctx, id, h.R, b.hue, b.sat, b.light);
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------- the hair
     THE MASS FILLS THE OPENING AND THE FACE IS CUT LOW INTO IT. That is the
     whole construction and it is taken straight off the hood references: the
     opening is filled solid with hair, the face oval is drawn on top of it
     sitting low, and what is left over IS the fringe across the brow and the
     piece down each cheek. None of that has to be drawn as hair, which is why
     every previous attempt came out boxy: they were drawing hair-shaped
     rectangles and lines into a space that had no edge of its own.

     ANYTHING LONGER THAN THE FACE GOES BEHIND THE FLOWER. `drawHairLong`
     paints before the bonnet, so a plait or a length is hidden by the crown
     and the petals and emerges at the bonnet's lower corners, which is
     exactly what the bear, the chick, the penguin and the cat all do. */
  var HAIR_LONG = {
    1: { to: 74 },                                      /* bob */
    2: { to: 104 },                                     /* long */
    /* WAVY IS 112, LONGER THAN LONG. The crown is the wider of the two
       shapes down to y 176, so a wave can only begin below that, and at 98
       there were only forty pixels of hair left to wave in: it came out as a
       second Long. */
    3: { to: 112, wave: true },                         /* wavy */
    4: { plait: true },                                 /* braids */
    5: { buns: true }                                   /* bunches */
  };

  /* A LENGTH IS WIDE WHERE IT LEAVES THE HEAD AND NARROWS TO A ROUNDED TIP.
     It used to be a straight-sided bar with a flat top and a squared end,
     which is exactly what "boxy" meant: Bob, Long and Wavy came out as two
     planks beside the head. The braids escaped it only because a stack of
     discs cannot be square. Drawn in a right-hand frame and mirrored, so the
     two sides cannot drift apart. */
  /* A LENGTH GROWS OUT OF THE CROWN, it does not stand beside the head. It
     was a shape struck at a fixed offset from the middle with a flat top, so
     however it was tapered it still read as a plank parked at the ear. It now
     starts as a POINT up at the scalp, swings out past the jaw and tapers to
     a rounded tip, which is the line hair actually falls in. Drawn in a
     right-hand frame around the head's own centre and mirrored, so the two
     sides cannot drift apart. */
  /* IT LEAVES THE HEAD AT THE HEAD'S WIDEST POINT, and that is what closed
     the dip. The path used to start at x 8 near the top and only reach 52 by
     the jaw, while the crown is 58 wide from about y 100 to y 140, so the
     silhouette ran: crown out to 58, crown curving back in, and the length
     picking up again at 52. The maximum of a shape narrowing and a shape
     widening has a MINIMUM where they cross, which is a notch about eight
     pixels deep at the ear, and no amount of tapering the length could have
     removed it. The first bezier is now a quarter of the crown's own ellipse
     (controls at 0.5523 of each radius, the usual circle approximation), so
     the hair runs out along the head and falls from there. */
  function lengthPath(ctx, len, wave) {
    var y0 = HEAD.y - CROWN.ry, end = HEAD.y + len, mid = (y0 + end) / 2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(32, y0, CROWN.rx, HEAD.y - 31, CROWN.rx, HEAD.y + 2);
    if (wave) {
      /* THE WAVES START BELOW THE CROWN. Down to y 176 the crown is still
         the wider of the two, so an inward swing up there would cut back into
         the head and put the notch straight back. Both swings are measured
         against the crown's own half width at that height: 55 against 49 at
         y 150, 53 against 41 at y 160. */
      ctx.bezierCurveTo(58, HEAD.y + 30, 46, HEAD.y + 56, 54, HEAD.y + 76);
      ctx.bezierCurveTo(60, HEAD.y + 92, 44, end - 18, 50, end - 8);
      ctx.quadraticCurveTo(44, end + 10, 32, end - 6);
      ctx.bezierCurveTo(38, end - 28, 22, mid + 8, 30, HEAD.y + 6);
      ctx.bezierCurveTo(32, HEAD.y - 20, 24, y0 + 12, 0, y0);
    } else {
      ctx.bezierCurveTo(58, HEAD.y + 36, 56, end - 32, 52, end - 14);
      ctx.quadraticCurveTo(47, end + 8, 35, end - 7);
      ctx.bezierCurveTo(30, HEAD.y + 24, 26, HEAD.y - 10, 0, y0);
    }
    ctx.closePath();
  }

  /* THE HEAD AND THE HAIR ARE ONE SHAPE. The crown is filled in the hair's
     own colour before anything else, so there is no seam where the top of the
     head stops being head and starts being hair: the lengths grow out of a
     solid mass rather than being hung on either side of one. It paints before
     the flower, so on the six ring species the bonnet covers all of it and
     nothing changes; on the tulip and the lavender, which wear their flower on
     a stem and have no bonnet, it IS the top of the head. */
  function drawCrown(ctx, look) {
    ctx.fillStyle = HAIRS[look.hairCol] || HAIRS[0];
    ctx.beginPath();
    ctx.ellipse(HEAD.x, HEAD.y, CROWN.rx, CROWN.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawHairLong(ctx, look) {
    var spec = HAIR_LONG[look.back];
    drawCrown(ctx, look);
    if (!spec) return;
    var c = HAIRS[look.hairCol] || HAIRS[0], d = shade(c, 0.8), i, k;
    for (k = -1; k <= 1; k += 2) {
      if (spec.buns) {
        /* BUNCHES LOW AT THE SIDES, not space buns on top. A bun above the
           head is exactly where the flower is, so a true pair would be
           entirely behind the bonnet and never seen; low and out at 81 from
           the middle against the petals' 84 they clear its edge, which is
           where the bear and the cat in the hood references wear theirs. */
        var bx = HEAD.x + k * 74, by = HEAD.y + 34;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(HEAD.x + k * 14, HEAD.y - 34);
        ctx.quadraticCurveTo(HEAD.x + k * 66, HEAD.y - 10, bx, by);
        ctx.quadraticCurveTo(HEAD.x + k * 40, HEAD.y + 6, HEAD.x + k * 8, HEAD.y - 30);
        ctx.closePath(); ctx.fill();
        disc(ctx, bx, by, 20);
        ctx.fillStyle = d; disc(ctx, bx, by, 10);
        continue;
      }
      ctx.save();
      ctx.translate(HEAD.x, 0); ctx.scale(k, 1);
      ctx.fillStyle = c;
      /* A PIGTAIL IS GATHERED AT THE TOP, so its upper section is the same
         curve as any other length, run only as far as the tie. Drawn as a
         rounded rectangle parked at the side it had a flat top and no root. */
      lengthPath(ctx, spec.plait ? 26 : spec.to, spec.wave);
      ctx.fill();
      ctx.restore();
      if (!spec.plait) continue;
      var tx = HEAD.x + k * 43;
      ctx.fillStyle = d; rr(ctx, tx - 10, HEAD.y + 22, 20, 9, 4);
      for (i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? d : c;
        disc(ctx, tx, HEAD.y + 38 + i * 15, 11 - i * 1.4);
      }
    }
    /* THE TWO LENGTHS MEET BEHIND, which is what makes a head of hair look
       full rather than like two strips hung at the ears. The join is painted
       before the flower and the body, so almost all of it is hidden and what
       shows is the hair in the gaps between the bonnet's edge and the
       shoulders, which is exactly where the back of somebody's hair is. */
    if (spec.to) {
      var end = HEAD.y + spec.to;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(HEAD.x - 52, end - 62);
      ctx.lineTo(HEAD.x + 52, end - 62);
      ctx.lineTo(HEAD.x + 50, end - 26);
      ctx.quadraticCurveTo(HEAD.x, end + 10, HEAD.x - 50, end - 26);
      ctx.closePath(); ctx.fill();
    }
  }

  /* THE MASS, clipped to the opening, and the face cut low into it by the
     caller. Only CROPPED differs: its mass stops above the ear line, so the
     opening shows bonnet at the sides rather than hair. */
  function drawHairMass(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0], i, a;
    ctx.save();
    openPath(ctx); ctx.clip();
    ctx.fillStyle = c;
    /* THE MASS IS SMOOTH FOR EVERY STYLE. Curly used to scallop it as well as
       the hairline, which made the whole top of the head lumpy under a bonnet
       that is already round; curly is a FRINGE and nothing else now. */
    if (look.fringe === 3) {
      ctx.beginPath();
      ctx.ellipse(HEAD.x, HEAD.y - 6, OPEN.rx - 5, OPEN.ry - 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(HEAD.x - OPEN.rx, HEAD.y - OPEN.ry, OPEN.rx * 2, OPEN.ry * 2);
    }
    ctx.restore();
  }

  /* THE HAIRLINE, clipped to the face, and it is the ONLY thing that differs
     between the nine once the mass is doing the framing. */
  function drawFringe(ctx, look) {
    var c = HAIRS[look.hairCol] || HAIRS[0], F = FACE, i;
    var TOP = F.y - F.ry - 6, L = F.x - F.rx, R = F.x + F.rx;
    ctx.save();
    facePath(ctx); ctx.clip();
    ctx.fillStyle = c;
    function brow(lowY) {
      ctx.beginPath();
      ctx.moveTo(L, lowY); ctx.lineTo(L, TOP); ctx.lineTo(R, TOP); ctx.lineTo(R, lowY);
    }
    if (look.fringe === 0) {
      /* BLUNT IS THE SOFT TWO-POINT SHAPE THAT USED TO BE CALLED WAVY. The
         two were within a few pixels of each other, so one of them had to
         become something else; this is the one kept. */
      brow(F.y - 6);
      ctx.quadraticCurveTo(F.x + 25, F.y - 3, F.x + 13, F.y - 20);
      ctx.quadraticCurveTo(F.x, F.y - 5, F.x - 15, F.y - 20);
      ctx.quadraticCurveTo(F.x - 27, F.y - 3, L, F.y - 6);
      ctx.closePath(); ctx.fill();
    } else if (look.fringe === 1) {
      /* A CENTRE PARTING, which means the hairline is HIGH in the middle and
         low at the temples. It was drawn the other way up, so it read as a
         fringe with a notch cut out of it rather than as a parting. */
      brow(F.y - 2);
      ctx.quadraticCurveTo(F.x + 22, F.y - 12, F.x + 2, F.y - 27);
      ctx.lineTo(F.x - 2, F.y - 27);
      ctx.quadraticCurveTo(F.x - 22, F.y - 12, L, F.y - 2);
      ctx.closePath(); ctx.fill();
    } else if (look.fringe === 2) {               /* a deep side parting */
      /* THE APEX IS NOT THE JUNCTION. The two curves met at `F.x - 2`, which
         looks central written down, but the second control sat at `F.x - 22`
         and `F.y - 31` and dragged the actual high point out to about ten
         pixels LEFT of it: the parting read as sitting off the side of the
         head rather than near the middle of it. Moving both right by ten puts
         the high point back at about `F.x - 2`, where the junction always
         claimed it was. The same trap as the basket's handle, which is that a
         quadratic passes nowhere near its control point. */
      brow(F.y - 6);
      ctx.quadraticCurveTo(F.x + 26, F.y - 15, F.x + 8, F.y - 24);
      ctx.quadraticCurveTo(F.x - 12, F.y - 31, L, F.y - 25);
      ctx.closePath(); ctx.fill();
    } else if (look.fringe === 3) {                      /* a high line */
      brow(F.y - 24);
      ctx.quadraticCurveTo(F.x + 28, F.y - 35, F.x, F.y - 36);
      ctx.quadraticCurveTo(F.x - 28, F.y - 35, L, F.y - 24);
      ctx.closePath(); ctx.fill();
    } else if (look.fringe === 4) {           /* curly, a bumpy hairline */
      brow(F.y - 18); ctx.closePath(); ctx.fill();
      for (i = 0; i < 6; i++) disc(ctx, L + 9 + i * 15, F.y - 18, i % 2 ? 12 : 9);
    } else {
      /* CHOPPY, four uneven points, which is what replaced the old blunt
         shape once the wavy one took that name. */
      ctx.beginPath();
      ctx.moveTo(L, F.y - 12);
      ctx.lineTo(L, TOP); ctx.lineTo(R, TOP); ctx.lineTo(R, F.y - 16);
      ctx.lineTo(F.x + 22, F.y - 2);
      ctx.lineTo(F.x + 13, F.y - 21);
      ctx.lineTo(F.x + 2, F.y - 5);
      ctx.lineTo(F.x - 9, F.y - 23);
      ctx.lineTo(F.x - 19, F.y - 4);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* TWO SMALL EARS at the sides of the opening. Every one of the hood
     references has them and they are most of why those heads read as heads
     rather than as discs; they sit OVER the hair, at the face's own edge. */
  function drawEars(ctx, skin) {
    var F = FACE;
    [-1, 1].forEach(function (k) {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(F.x + k * (F.rx - 1), F.y + 4, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade(skin, 0.86); ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(F.x + k * (F.rx - 1), F.y + 4, 4, -0.6, 2.4);
      ctx.stroke();
    });
  }

  /* ------------------------------------------------------ the clothing
     ONE OUTFIT DRESSES THE WHOLE FIGURE, and every piece of it is drawn
     through the bell's own clip so nothing can hang outside the silhouette.
     The skirt is the one exception, since it flares past the hem on purpose:
     BOTH IT AND THE SHORTS GROW OUT OF THE BODY'S OWN LINE rather than being
     laid across the hips, which is what made the old shorts read as a nappy. */
  /* THE TROUSERS DO NOT FOLLOW THE TOP. They were `hsl(L.top, 16, 38)`, so
     a blue top put the legs in a blue that is the Denim tint almost exactly,
     and a Denim welly then vanished into them: one colour from the hem to the
     sole. They are a stone grey now, which is what work trousers are. AT 5
     SATURATION NOTHING IN `TINTS` CAN BE MISTAKEN FOR THEM: the nearest is
     Clay at hue 18 and saturation 42. It was 9 and read faintly tan. */
  var TROUSER = hsl(34, 5, 47);
  function drawLegs(ctx, id, L, skin) {
    var w = WEAR[id] || { bare: false };
    ctx.fillStyle = w.bare ? skin : TROUSER;
    rr(ctx, LEG.lx, LEG.top, LEG.w, LEG.bottom - LEG.top, 8);
    rr(ctx, LEG.rx, LEG.top, LEG.w, LEG.bottom - LEG.top, 8);
  }

  /* a scalloped edge, for a hem that should read as frilled */
  function frill(ctx, x0, x1, y, n, colour) {
    var step = (x1 - x0) / n, i;
    ctx.fillStyle = colour;
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(x0 + step * (i + 0.5), y, step / 2, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillRect(x0, y - 4, x1 - x0, 5);
  }

  /* A COLLAR ON EVERY OUTFIT. Almost every garment in both references has
     one, and it is the cheapest thing there is for making a flat shape read
     as clothing: two small rounded flaps either side of the neck, in the
     cream the references all use. BUTTONS AND A POCKET go on the outfits
     that would otherwise have no detail at all. */
  function drawCollar(ctx, L) {
    var B = BODY, cx = B.cx, t = B.top;
    ctx.fillStyle = "#fdf6e6";
    [-1, 1].forEach(function (k) {
      ctx.beginPath();
      ctx.moveTo(cx, t - 1);
      ctx.quadraticCurveTo(cx + k * 20, t - 2, cx + k * 17, t + 7);
      ctx.quadraticCurveTo(cx + k * 12, t + 16, cx, t + 11);
      ctx.closePath(); ctx.fill();
    });
  }
  function drawTrim(ctx, L, pocket) {
    var B = BODY, cx = B.cx, t = B.top, b = B.bottom;
    ctx.fillStyle = "#fdf6e6";
    [0, 1].forEach(function (i) { disc(ctx, cx, t + 24 + i * 15, 3.4); });
    /* NO POCKET UNDER A SKIRT. It sits at b - 40, which is inside the skirt's
       own panel, so it came out printed on the front of it. */
    if (!pocket) return;
    ctx.fillStyle = hsl(L.top, 26, 48);
    rr(ctx, cx + 8, b - 40, 22, 17, 5);
  }

  function drawOver(ctx, id, L) {
    var B = BODY, cx = B.cx, t = B.top, b = B.bottom;
    var T = tintOf(L, "clothes");
    var main = tone(T), dark = tone(T, -13), pale = tone(T, 11, -6);
    if (id === "dungas") {
      inBody(ctx, function () {
        ctx.fillStyle = main;
        ctx.fillRect(cx - 50, t + 44, 100, b - t);
        rr(ctx, cx - 19, t + 18, 38, 30, 7);
        ctx.strokeStyle = main; ctx.lineWidth = 8; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx - 15, t + 22); ctx.lineTo(cx - 19, t + 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 15, t + 22); ctx.lineTo(cx + 19, t + 2); ctx.stroke();
        ctx.fillStyle = pale;
        disc(ctx, cx - 15, t + 24, 3.4);
        disc(ctx, cx + 15, t + 24, 3.4);
        ctx.strokeStyle = dark; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, b - 26); ctx.lineTo(cx, b); ctx.stroke();
      });
    }
    if (id === "apron") {
      inBody(ctx, function () {
        ctx.strokeStyle = main; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx - 12, t + 16); ctx.lineTo(cx - 17, t - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 12, t + 16); ctx.lineTo(cx + 17, t - 2); ctx.stroke();
        ctx.fillStyle = main;
        rr(ctx, cx - 16, t + 12, 32, 26, 5);
        ctx.beginPath();
        ctx.moveTo(cx - 22, t + 36); ctx.lineTo(cx + 22, t + 36);
        ctx.lineTo(cx + 36, b + 2); ctx.lineTo(cx - 36, b + 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = dark;
        ctx.fillRect(cx - 50, t + 34, 100, 10);
        rr(ctx, cx - 15, t + 58, 30, 20, 4);
        frill(ctx, cx - 38, cx + 38, b - 3, 5, dark);
        ctx.strokeStyle = dark; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, t + 58); ctx.lineTo(cx, t + 78); ctx.stroke();
      });
    }
    if (id === "cardi") {
      inBody(ctx, function () {
        ctx.fillStyle = main;
        ctx.fillRect(cx - 50, t, 37, b - t + 4);
        ctx.fillRect(cx + 13, t, 37, b - t + 4);
        ctx.fillStyle = dark;
        [1, -1].forEach(function (k) {
          ctx.beginPath();
          ctx.moveTo(cx + k * 13, t);
          ctx.lineTo(cx + k * 32, t);
          ctx.quadraticCurveTo(cx + k * 24, t + 22, cx + k * 11, t + 34);
          ctx.closePath(); ctx.fill();
        });
        ctx.fillStyle = pale;
        [0, 1, 2].forEach(function (i) { disc(ctx, cx - 9, t + 44 + i * 18, 3.6); });
      });
    }
    if (id === "skirt") {
      /* IT CONTINUES THE BELL'S OWN LINE, starting at the width the body
         already is where it begins and carrying that flare on past the hem.
         Started at a fixed width it was a triangle stuck to a torso. */
      var y0 = b - 36, w0 = halfAt(y0), bw = B.botW / 2;
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(cx - w0, y0);
      ctx.lineTo(cx + w0, y0);
      ctx.bezierCurveTo(cx + bw + 10, b - 8, cx + bw + 15, b + 8, cx + bw + 13, b + 18);
      ctx.quadraticCurveTo(cx, b + 27, cx - bw - 13, b + 18);
      ctx.bezierCurveTo(cx - bw - 15, b + 8, cx - bw - 10, b - 8, cx - w0, y0);
      ctx.closePath(); ctx.fill();
      /* A FRILLED HEM, which the pinafore in the doll reference has: six
         shallow scallops along the bottom in a deeper tone. */
      frill(ctx, cx - bw - 13, cx + bw + 13, b + 19, 6, dark);
    }
    if (!id || id === "skirt" || id === "shorts") drawTrim(ctx, L, id !== "skirt");
  }

  /* THE SHORTS ARE PAINTED BEFORE THE TORSO, which is what finally joins
     them to it: the body's own hem lies over their top and the two read as
     one shape with legs coming out. Drawn after the body they sat on it, and
     however far up they started the join was a line across the hips. */
  function drawUnder(ctx, id, L) {
    if (id !== "shorts") return;
    var b = BODY.bottom, T = tintOf(L, "clothes");
    ctx.fillStyle = tone(T);
    rr(ctx, LEG.lx - 7, b - 34, 30, 60, 11);
    rr(ctx, LEG.rx - 5, b - 34, 30, 60, 11);
    ctx.fillStyle = tone(T, -13);
    rr(ctx, LEG.lx - 8, b + 16, 32, 10, 5);
    rr(ctx, LEG.rx - 6, b + 16, 32, 10, 5);
  }

  /* ARMS: a stub sleeve off each shoulder ending in a round hand, drawn in
     whatever the sleeve's own colour is, which is the cardigan when one is
     worn and the top otherwise. `holding` puts a thumb across the handle of
     what is carried, so the grip is a thing you can see. */
  function sleeveTone(L) {
    return L.clothes === "cardi" ? tone(tintOf(L, "clothes")) : hsl(L.top, 26, 56);
  }
  function armPoints(k) {
    return {
      sx: BODY.cx + k * ARM.sx, sy: BODY.top + ARM.sy,
      hx: BODY.cx + k * ARM.hx, hy: BODY.top + ARM.hy
    };
  }
  /* THE SLEEVES ARE PAINTED BEFORE THE TORSO and the hands after it. Drawn
     last they went straight over the dungaree bib and its braces, which is
     the wrong way round: a garment goes on over a shoulder. Behind the body
     the joint is hidden, every garment sits on top of it, and the hands are
     outside the silhouette anyway so nothing covers them. */
  function drawSleeves(ctx, L) {
    ctx.strokeStyle = sleeveTone(L); ctx.lineWidth = 19; ctx.lineCap = "round";
    [-1, 1].forEach(function (k) {
      var a = armPoints(k);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(a.hx, a.hy - 6); ctx.stroke();
    });
  }
  function drawHands(ctx, skin, holding) {
    ctx.fillStyle = skin;
    [-1, 1].forEach(function (k) {
      var a = armPoints(k);
      disc(ctx, a.hx, a.hy, ARM.r);
    });
    if (holding) {
      var r = armPoints(1);
      ctx.fillStyle = shade(skin, 0.93);
      rr(ctx, r.hx - 12, r.hy - 4, 21, 9, 4.5);
    }
  }

  /* ------------------------------------------------------ the accessories
     THEY ARE DRAWN TO READ ON THEIR OWN, not only in place, because a tile
     shows the piece alone. Anything that leaned on the figure around it to be
     named turned into something else there: the scarf was a MALLET, then a
     hook, then a key; the satchel was a LADLE; the dungarees were the apron
     again; the trowel was a paintbrush. */
  function drawNeck(ctx, id, L) {
    var cx = BODY.cx, y = BODY.top + 2, T = tintOf(L, "neck");
    if (id === "scarf") {
      var h = T.h;
      /* A BAND, A KNOT, AND TWO TAILS HANGING FROM THE MIDDLE. Every failed
         version hung the ends off ONE edge, so the picture had a head and a
         handle. Centred under the knot it is symmetrical, and a symmetrical
         thing with fringe on the bottom of it is a scarf. */
      ctx.fillStyle = tone(T);
      ctx.beginPath();
      ctx.moveTo(cx - 32, y - 6);
      ctx.quadraticCurveTo(cx, y + 8, cx + 32, y - 6);
      ctx.lineTo(cx + 32, y + 8);
      ctx.quadraticCurveTo(cx, y + 22, cx - 32, y + 8);
      ctx.closePath(); ctx.fill();
      [[-15, 38, 52], [2, 28, 62]].forEach(function (t) {
        ctx.fillStyle = hsl(T.h, T.s, t[2] === 52 ? T.l - 6 : T.l + 4);
        rr(ctx, cx + t[0], y + 12, 14, t[1], 7);
        ctx.strokeStyle = tone(T, -14); ctx.lineWidth = 2.4; ctx.lineCap = "round";
        [0, 1, 2].forEach(function (i) {
          ctx.beginPath();
          ctx.moveTo(cx + t[0] + 3 + i * 4.5, y + 10 + t[1]);
          ctx.lineTo(cx + t[0] + 3 + i * 4.5, y + 17 + t[1]);
          ctx.stroke();
        });
      });
      ctx.fillStyle = tone(T, -6);
      rr(ctx, cx - 13, y + 1, 26, 18, 8);
    }
    if (id === "satchel") {
      /* ON THE LEFT HIP. It hung on the right, which is where the right hand
         and anything carried already are, so the bag came out behind the arm
         and a held trowel on top of it. */
      ctx.save(); ctx.translate(2 * cx, 0); ctx.scale(-1, 1);
      /* A CURVED STRAP AND A LARGE FLAPPED BAG. Straight and thin to a small
         box it was a LADLE: a straight handle ending in a bowl is a spoon,
         whatever colour it is. */
      ctx.strokeStyle = tone(T, -12); ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 24, y + 2);
      ctx.quadraticCurveTo(cx - 6, y + 36, cx + 20, y + 42);
      ctx.stroke();
      ctx.fillStyle = tone(T); rr(ctx, cx + 3, y + 38, 44, 36, 10);
      ctx.fillStyle = tone(T, -12);
      ctx.beginPath();
      ctx.moveTo(cx + 3, y + 48);
      ctx.lineTo(cx + 3, y + 44);
      ctx.quadraticCurveTo(cx + 25, y + 36, cx + 47, y + 44);
      ctx.lineTo(cx + 47, y + 56);
      ctx.quadraticCurveTo(cx + 25, y + 62, cx + 3, y + 56);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = tone(T, -24); rr(ctx, cx + 20, y + 53, 10, 10, 3);
      ctx.restore();
    }
  }

  /* A SHAFT HALVES ON BARE LEGS. With shorts on the leg is 52 pixels of skin
     and a welly's shaft is 54, so it swallowed the whole thing and the shorts
     appeared to sit straight on the boot. */
  function drawFeet(ctx, id, L) {
    var y = LEG.foot, T = tintOf(L, "feet");
    var wc = WEAR[L.clothes], k = (wc && wc.bare) ? 0.45 : 1;
    if (id === "boots") {
      /* A SHAFT, A CUFF, A FOOT AND A SOLE. Two blocks read as two blocks. */
      ctx.fillStyle = tone(T);
      rr(ctx, LEG.lx - 2, y - 26 * k, 20, 26 * k + 8, 7);
      rr(ctx, LEG.rx - 2, y - 26 * k, 20, 26 * k + 8, 7);
      ctx.fillStyle = tone(T, -12);
      rr(ctx, LEG.lx - 4, y - 26 * k - 4, 24, 11, 5);
      rr(ctx, LEG.rx - 4, y - 26 * k - 4, 24, 11, 5);
      ctx.fillStyle = tone(T);
      rr(ctx, LEG.lx - 8, y + 2, 30, 16, 7);
      rr(ctx, LEG.rx - 4, y + 2, 30, 16, 7);
      ctx.fillStyle = tone(T, -24);
      rr(ctx, LEG.lx - 9, y + 13, 32, 8, 4);
      rr(ctx, LEG.rx - 5, y + 13, 32, 8, 4);
    }
    if (id === "clogs") {
      /* A WOODEN SOLE AND A ROUNDED TOE. Two beige pills read as pebbles. */
      ctx.fillStyle = tone(T, -18);
      rr(ctx, LEG.lx - 9, y + 12, 32, 10, 4);
      rr(ctx, LEG.rx - 5, y + 12, 32, 10, 4);
      ctx.fillStyle = tone(T, 18, -10);
      rr(ctx, LEG.lx - 8, y - 2, 30, 18, 9);
      rr(ctx, LEG.rx - 4, y - 2, 30, 18, 9);
      ctx.fillStyle = tone(T, 4, -8);
      rr(ctx, LEG.lx - 8, y - 4, 16, 12, 6);
      rr(ctx, LEG.rx + 8, y - 4, 16, 12, 6);
    }
    if (id === "wellies") {
      /* TALL, and the height is the point: it is the one boot you can see
         from across a garden. The rolled top is what says rubber. */
      ctx.fillStyle = tone(T);
      rr(ctx, LEG.lx - 3, y - 46 * k, 22, 46 * k + 8, 9);
      rr(ctx, LEG.rx - 3, y - 46 * k, 22, 46 * k + 8, 9);
      ctx.fillStyle = tone(T, -11);
      rr(ctx, LEG.lx - 5, y - 46 * k - 4, 26, 12, 6);
      rr(ctx, LEG.rx - 5, y - 46 * k - 4, 26, 12, 6);
      ctx.fillStyle = tone(T);
      rr(ctx, LEG.lx - 9, y + 2, 31, 17, 8);
      rr(ctx, LEG.rx - 5, y + 2, 31, 17, 8);
      ctx.fillStyle = tone(T, -20);
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
  function grip() { var a = armPoints(1); return { x: a.hx, y: a.hy }; }
  function drawHold(ctx, id, L) {
    var g = grip(), x = g.x, y = g.y, T = tintOf(L, "hold");
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
    if (id === "basket") {
      /* A DEEP BASKET WITH AN ARCHED HANDLE THROUGH THE FIST. The trug that
         was cut was a shallow dark oval, and a wide flat curve reads as a
         HAMMOCK whatever is drawn round it. What names this one is DEPTH: a
         wall taller than the mouth is wide, a woven course across it, and a
         rim with the handle's feet disappearing under it.
         The arch's top sits just above the grip so the hand closes round it,
         which is the same rule the can and the trowel follow: a handle that
         does not pass through the fist floats beside the arm. */
      /* THE CONTROL POINT IS AT y - 70 TO PUT THE ARCH AT y - 21. A
         quadratic passes nowhere near its control: its top sits at a quarter,
         a half and a quarter of the three points, so a control at y - 22
         drew an arch topping out at y - 3, which is inside a fist of radius
         13 and therefore invisible. It was there and could not be seen. */
      ctx.strokeStyle = "#a9794f"; ctx.lineWidth = 7;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x - 20, y + 28);
      ctx.quadraticCurveTo(x, y - 70, x + 20, y + 28);
      ctx.stroke();
      ctx.fillStyle = "#c79a5f";
      ctx.beginPath();
      ctx.moveTo(x - 26, y + 20);
      ctx.lineTo(x + 26, y + 20);
      ctx.quadraticCurveTo(x + 24, y + 54, x + 14, y + 60);
      ctx.lineTo(x - 14, y + 60);
      ctx.quadraticCurveTo(x - 24, y + 54, x - 26, y + 20);
      ctx.closePath(); ctx.fill();
      /* the weave: three courses and the uprights between them, drawn inside
         the wall so the basket has something in it besides colour */
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "#a9794f"; ctx.lineWidth = 2.6;
      [31, 41, 51].forEach(function (dy) {
        ctx.beginPath();
        ctx.moveTo(x - 28, y + dy); ctx.lineTo(x + 28, y + dy); ctx.stroke();
      });
      ctx.lineWidth = 2.2;
      [-17, -6, 6, 17].forEach(function (dx) {
        ctx.beginPath();
        ctx.moveTo(x + dx, y + 24); ctx.lineTo(x + dx, y + 60); ctx.stroke();
      });
      ctx.restore();
      ctx.fillStyle = "#8a5f3c"; rr(ctx, x - 28, y + 15, 56, 11, 5.5);
    }
  }

  function drawFaceWear(ctx, id, L) {
    var F = FACE, y = F.y + 5, T = tintOf(L, "face");
    if (id === "freckles") {
      /* A SCATTER ACROSS THE NOSE AND BOTH CHEEKS, over the blush so they
         read as on the skin. The only one of the three that is not eyewear. */
      ctx.fillStyle = hsl(T.h, Math.min(60, T.s + 10), Math.max(28, T.l - 20), 0.55);
      /* THEY SIT BELOW THE EYE LINE. The eyes reach F.y + 11.5, so anything
         above that lands ON them, which is where the first set was. */
      /* SIX SMALL ONES ACROSS THE NOSE AND THE INNER CHEEK, not twelve
         spread to the edge of the face. They reached x plus or minus 28 at
         radius 2.1, which on a face of 44 is the whole width of it, and at
         that size a freckle reads as a spot. The lowest pair, out at y 25,
         went as well: that is level with the corners of the mouth, and a
         freckle beside a mouth reads as something on the chin.
         BELOW THE EYES AND CLEAR OF THE MOUTH: the eyes reach F.y + 11.5 and
         the mouth runs from F.y + 18 across x plus or minus 6, so the band
         sits at 13 to 24 and stays outside that. */
      [[-4, 13], [4, 13],
       [-21, 15], [-14, 19],
       [21, 15], [14, 19]].forEach(function (p) {
        disc(ctx, F.x + p[0], F.y + p[1], 1.4);
      });
      return;
    }
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
      var h = hoodOf(id), b = bloomOf(id, L);
      if (typeof window.drawSpeciesBloom !== "function") return;
      ctx.save();
      ctx.translate(FACE.x, FACE.y);
      window.drawSpeciesBloom(ctx, id, h.mode === "hood" ? 44 : 40, b.hue, b.sat, b.light);
      ctx.restore();
      return;
    }
    if (kind === "fringe" || kind === "back") {
      /* A FRINGE TILE SHOWS ITS FRINGE ON A TUCKED-IN HEAD and a back tile
         shows its back under a blunt fringe, so each tile is only ever about
         the one thing it changes. */
      var hk = kind === "fringe"
        ? { fringe: id, back: 0, hairCol: L.hairCol }
        : { fringe: 0, back: id, hairCol: L.hairCol };
      drawHairLong(ctx, hk);
      drawHairMass(ctx, hk);
      ctx.fillStyle = skin;
      facePath(ctx); ctx.fill();
      drawFringe(ctx, hk);
      drawEars(ctx, skin);
      drawFace(ctx);
      return;
    }
    if (kind === "top") {
      var lk = Object.assign({}, L, { top: id, clothes: null });
      drawSleeves(ctx, lk);
      ctx.fillStyle = hsl(id, 26, 56);
      bodyPath(ctx); ctx.fill();
      drawHands(ctx, skin, false);
      return;
    }
    var slot = WEAR[id] && WEAR[id].slot;
    /* A TILE SHOWS ITS OWN COLOUR, not the one the worn item is set to. The
       tint is stored per SLOT, so without this every tile in a row repainted
       itself in whatever the chosen garment had been changed to and the row
       came out as six of the same colour. */
    /* A TILE DRAWS THE ITEM AND THE COLOUR IT IS ASKED FOR, so the caller
       sets `tints[slot]` for the variant it wants and the tile paints exactly
       that. Without pinning the slot to `id` here, a tile drew whatever the
       gardener happened to be wearing. */
    if (slot) {
      var tk = Object.assign({}, L, { tints: Object.assign({}, L.tints || {}) });
      tk[slot] = id;
      L = tk;
    }
    if (slot === "clothes") {
      /* THE WHOLE LOWER FIGURE, so Plain is a picture too: a body and a pair
         of trousers is what "no outfit" looks like, and an empty tile is not. */
      var ck = Object.assign({}, L, { clothes: id });
      drawLegs(ctx, id, ck, skin);
      if (ck.feet) drawFeet(ctx, ck.feet, ck);
      drawUnder(ctx, id, ck);
      drawSleeves(ctx, ck);
      ctx.fillStyle = hsl(L.top, 26, 56);
      bodyPath(ctx); ctx.fill();
      drawOver(ctx, id, ck);
      drawCollar(ctx, ck);
      drawHands(ctx, skin, false);
      return;
    }
    if (slot === "neck") drawNeck(ctx, id, L);
    if (slot === "feet") drawFeet(ctx, id, L);
    if (slot === "hold") {
      /* ONE HAND, NOT TWO. Fitted, a pair spans eighty pixels of empty space
         with a can in the middle of it, so the tile came out as a small
         object between two pale dots. */
      var g = grip();
      drawHold(ctx, id, L);
      ctx.fillStyle = skin; disc(ctx, g.x, g.y, ARM.r);
      ctx.fillStyle = shade(skin, 0.93);
      rr(ctx, g.x - 12, g.y - 4, 21, 9, 4.5);
    }
    if (slot === "face") drawFaceWear(ctx, id, L);
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
  /* THE FIGURE, AT ITS NATURAL SIZE, IN THE CALLER'S OWN TRANSFORM. It does
     not scale and it does not clear, because the two callers want opposite
     things there: the picker owns its canvas and wants it wiped, and a garden
     wants somebody stood on ground that is already painted. */
  function paintFigure(ctx, L) {
    var skin = SKINS[L.skin] || SKINS[0];
    var h = hoodOf(L.flower);

    drawHairLong(ctx, L);
    if (h.mode === "hood") drawHood(ctx, L.flower, L);
    else drawSprout(ctx, L.flower, L);

    /* THE SHOES GO ON BEFORE THE SHORTS, so a boot's shaft passes behind the
       hem rather than over it: a trouser leg covers the top of a boot. */
    drawLegs(ctx, L.clothes, L, skin);
    if (L.feet) drawFeet(ctx, L.feet, L);
    else {
      ctx.fillStyle = hsl(L.top, 14, 26);
      rr(ctx, LEG.lx - 7, LEG.foot + 2, 28, 18, 8);
      rr(ctx, LEG.rx - 5, LEG.foot + 2, 28, 18, 8);
    }
    drawUnder(ctx, L.clothes, L);

    drawSleeves(ctx, L);
    ctx.fillStyle = hsl(L.top, 26, 56);
    bodyPath(ctx); ctx.fill();
    drawOver(ctx, L.clothes, L);
    drawCollar(ctx, L);
    if (L.neck) drawNeck(ctx, L.neck, L);
    if (L.hold) drawHold(ctx, L.hold, L);
    drawHands(ctx, skin, !!L.hold);

    drawHairMass(ctx, L);
    ctx.fillStyle = skin;
    facePath(ctx); ctx.fill();
    drawFringe(ctx, L);
    drawEars(ctx, skin);
    drawFace(ctx);
    if (L.face) drawFaceWear(ctx, L.face, L);
  }

  function paint(ctx, look, size) {
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = (size || 300) / H;
    ctx.save();
    ctx.scale(s, s);
    ctx.clearRect(0, 0, W, H);
    paintFigure(ctx, L);
    ctx.restore();
  }

  /* STANDING SOMEBODY ON GROUND SOMEBODY ELSE PAINTED. `cx` is where the
     middle of them goes and `footY` is where the SOLE lands, which is the
     only anchor a garden can use: a figure hung by its top edge would sink or
     float as the flower on its head changed height.
     `FOOT` is 316, the lowest pixel any shoe reaches: a plain shoe ends at
     `LEG.foot + 20` and a welly's sole at `LEG.foot + 22`, and taking the
     larger means a gardener in wellies stands on the ground rather than in
     it. It is a CONSTANT rather than a measured box, because measuring means
     reading back 86,000 pixels and this runs inside a sixty frame draw loop.
     `h` IS THE WHOLE BOX, NOT THE PAINTED HEIGHT, so every species comes out
     the same person: fitting what is painted to one height would give a tulip
     gardener, whose flower grows up on a stem, a smaller body than a daisy
     one, whose flower rings the face. */
  var FOOT = LEG.foot + 22;
  function paintAt(ctx, look, cx, footY, h) {
    var L = Object.assign({}, DEFAULT_LOOK, look || {});
    var s = (h || 120) / H;
    ctx.save();
    ctx.translate(cx - (W / 2) * s, footY - FOOT * s);
    ctx.scale(s, s);
    paintFigure(ctx, L);
    ctx.restore();
  }

  window.AvatarDraw = {
    paint: paint, paintAt: paintAt, icon: icon, SKINS: SKINS, HAIRS: HAIRS,
    FRINGES: FRINGES, BACKS: BACKS,
    TOPS: TOPS, WEAR: WEAR, SLOTS: SLOTS, STEP_SLOTS: STEP_SLOTS,
    SLOT_LABEL: SLOT_LABEL, NO_NONE: NO_NONE, BLOOMS: BLOOMS, HOOD: HOOD,
    TINTS: TINTS, tintable: tintable, tintsFor: tintsFor, tone: tone,
    TEMPLATES: TEMPLATES, templateOf: templateOf,
    SPECIES_ORDER: SPECIES_ORDER, DEFAULT_LOOK: DEFAULT_LOOK, W: W, H: H
  };
})();
