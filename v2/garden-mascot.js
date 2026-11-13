/* ═══════════════════════════════════════════════════════════════════════════
   THE MASCOT, drawn in code like everything else here.

   WHY IT IS NOT THE SKETCH, LINE FOR LINE. The sketches it comes from carry a
   heavy dark brown outline, a diagonal hatch over the body and the wings, and
   black dot eyes. Not one of those exists anywhere else in this project: the
   twelve flower species, the gardener and every icon are SOLID FILLS WITH NO
   STROKE, and they build depth by laying a second fill at a lower lightness
   over the first. The one stroked thing in the whole flower set is the
   orchid's horseshoe, and that is recorded as the exception it is. A mascot
   with a 3px brown keyline would be the only outlined object on the site and
   would read as clip art dropped onto it.

   WHAT SURVIVES FROM THE SKETCH IS EVERYTHING THAT MATTERS: the round butter
   body, the pale blue wings, the two antennae with a flower on each, the
   cheeks, and the five expressions.

   WHAT IT BORROWS FROM THE PROJECT INSTEAD:
   - the palette exactly, butter #fbe484, sky #b7e4e7, pink #f4c6c6 and dark
     teal #1d6466, which are the page's own tokens;
   - the STEM GREEN hsl(140,52%,32%) for the antennae rather than brown, which
     is the colour every stem in both gardens is drawn in;
   - the five petal bloom the letter and the cursor already draw, so the thing
     on its head is this project's flower and not a generic daisy;
   - the four pointed sparkle from `drawNewestSparkles`, inner corners at 0.35
     of the radius, which is the one sparkle this site has.

   ONE BODY, FIVE FACES. Only the face changes between poses, the way the
   flower kit keeps one drawing per species and varies the numbers. A second
   full drawing per expression is how five mascots drift into five characters.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var C = {
    body:    "#fbe484",   /* butter, the palette's --yellow */
    bodyLow:  "#f3d45f",  /* the same butter darker: the project's only depth trick */
    nose:     "#eda08f",  /* a soft coral, warmer than the cheek and darker than
                             both, so it is the one warm mark on the face */
    foot:     "#e7bf43",  /* a THIRD step down. At bodyLow the feet were the same
                             colour as the body's own bottom shading and vanished
                             into it, which is the whole risk of depth by lightness:
                             two parts a step apart separate, two parts on the same
                             step are one part. */
    wing:     "#b7e4e7",  /* sky */
    wingLit:  "#dcf4f5",
    /* THE EDGE AND THE SPOT ARE BORROWED FROM `garden-life.js`, which is the
       one other place this project draws a butterfly. Its ambient ones carry
       a thin darker keyline (`lineWidth` 0.09 of their own size) and ONE pale
       spot per wing, with the note that at that size a pattern is mud but a
       single lighter mark is what stops a wing reading as a flat petal. Both
       are true here too, and a mascot whose wings are built differently from
       the butterflies flying past it is the odd one out.

       THE BODY STAYS UNOUTLINED. The edge belongs to the WINGS, because that
       is where this project puts it; the flowers, the gardener and the body
       are solid fills with no stroke and stay that way. */
    wingEdge: "#6eb3b8",
    cheek:    "#f4c6c6",
    ink:      "#1d6466",  /* dark teal: what this project draws a line in */
    stem:     "#277c43",  /* hsl(140,52%,32%), both gardens' stem */
    petal:    "#f4c6c6",
    pollen:   "#fbe484",
    spark:    "#fff9e3"   /* cream */
  };

  /* The four pointed star, inner corners at 0.35 of the radius. Same geometry
     as the planting burst, so the mascot sparkles in the site's own way. */
  function starPath(cx, cy, r) {
    var d = "", i, rad, ang, x, y;
    for (i = 0; i < 8; i++) {
      rad = (i % 2 === 0) ? r : r * 0.35;
      ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
      x = cx + Math.cos(ang) * rad;
      y = cy + Math.sin(ang) * rad;
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d + "Z";
  }

  /* The letter's bloom: five petals 72 degrees apart about a centre. */
  function bloom(cx, cy, r, tilt) {
    var s = "", i, a;
    for (i = 0; i < 5; i++) {
      a = tilt + i * 72;
      s += '<ellipse cx="' + cx + '" cy="' + (cy - r * 0.56).toFixed(1) +
           '" rx="' + (r * 0.40).toFixed(1) + '" ry="' + (r * 0.56).toFixed(1) +
           '" fill="' + C.petal + '" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')"/>';
    }
    return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.30).toFixed(1) +
           '" fill="' + C.pollen + '"/>';
  }

  /* ---------------------------------------------------------------- the face
     Every pose is two eyes and a mouth over the same head, plus whatever that
     pose adds beside it. Written as data rather than as five drawings. */
  var EYE_L = 82, EYE_R = 118, EYE_Y = 112;

  function eyesOpen() {
    return '<circle cx="' + EYE_L + '" cy="' + EYE_Y + '" r="5.4" fill="' + C.ink + '"/>' +
           '<circle cx="' + EYE_R + '" cy="' + EYE_Y + '" r="5.4" fill="' + C.ink + '"/>';
  }
  function eyesShut() {           /* lids down: the lashes curve the same way a lid does */
    return arc(EYE_L - 7, EYE_Y, EYE_L + 7, EYE_Y, EYE_L, EYE_Y + 7) +
           arc(EYE_R - 7, EYE_Y, EYE_R + 7, EYE_Y, EYE_R, EYE_Y + 7);
  }
  function eyesHappy() {          /* arcs the other way up, which is a smile in the eyes */
    return arc(EYE_L - 7, EYE_Y + 2, EYE_L + 7, EYE_Y + 2, EYE_L, EYE_Y - 8) +
           arc(EYE_R - 7, EYE_Y + 2, EYE_R + 7, EYE_Y + 2, EYE_R, EYE_Y - 8);
  }
  function arc(x1, y1, x2, y2, qx, qy) {
    return '<path d="M' + x1 + ' ' + y1 + 'Q' + qx + ' ' + qy + ' ' + x2 + ' ' + y2 +
           '" fill="none" stroke="' + C.ink + '" stroke-width="2.8" stroke-linecap="round"/>';
  }

  /* A LITTLE ROUNDED TRIANGLE, POINT DOWN. It is drawn as a three point path
     STROKED IN ITS OWN FILL with a round join, which is what rounds the
     corners: a path with three quadratic curves would do the same and takes
     three times the numbers to say. 7 wide and 5.5 tall before the stroke,
     which lands it between two eyes 36 apart without touching either.

     IT POINTS UP. It pointed down first and read as a beak: a downward
     triangle on a round face is the one shape the eye finds a bird in. Point
     up it is a nose.

     THE ROUNDING IS THE STROKE WIDTH, so the path has to SHRINK as the stroke
     grows or the nose gets bigger rather than softer. At 3.4 the drawn
     triangle is 6.2 by 4.8 and the finished mark is about 9 by 8, which is
     the same overall size the 7 by 5.5 shape at 2.2 came to.

     IT SITS AT y 114 TO 119, lifted 3.7 from where it started. The eyes are
     at y 112, so the nose now begins just under the eye line rather than
     halfway to the chin: low down it read as floating above the mouth with
     the whole middle of the face empty above it. The mouth still starts at
     125, so the gap under the nose went from 2 to about 6, which is what
     reads as a face with a nose on it rather than a face with three marks
     stacked at the bottom. */
  var NOSE = '<path d="M100 114.4L96.9 119.2L103.1 119.2Z" fill="' + C.nose +
             '" stroke="' + C.nose + '" stroke-width="3.4" stroke-linejoin="round"/>';

  var MOUTH = {
    smile:  '<path d="M93 125Q100 132 107 125" fill="none" stroke="' + C.ink +
            '" stroke-width="2.6" stroke-linecap="round"/>',
    /* an open smile, filled, which is the one pose that is plainly delighted */
    beam:   '<path d="M91 124Q100 136 109 124Z" fill="' + C.ink + '"/>',
    /* not a frown. A small flat line with the faintest dip reads as concern;
       a drawn frown reads as sulking, which is the wrong thing to say to
       somebody having a hard day. */
    worry:  '<path d="M94 128Q100 125 106 128" fill="none" stroke="' + C.ink +
            '" stroke-width="2.6" stroke-linecap="round"/>',
    /* a small soft o, the sketch's own sleepy mouth */
    hush:   '<ellipse cx="100" cy="127" rx="3.4" ry="3.9" fill="none" stroke="' + C.ink +
            '" stroke-width="2.4"/>'
  };

  var BROWS =
    '<path d="M74 99Q80 95 87 98" fill="none" stroke="' + C.ink +
    '" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M113 98Q120 95 126 99" fill="none" stroke="' + C.ink +
    '" stroke-width="2.4" stroke-linecap="round"/>';

  /* THE PAT IS A WINK AND A HEART, AND IT IS NOT INVENTED HERE.
     `AvatarDraw.patFx` already decides what a pat looks like everywhere else
     in this project: one eye winks, the smile widens a little, and a heart
     rises out of the crown. The gardener takes it in both gardens and in the
     studio. A mascot that answered a pat some other way would be a second
     grammar for the same gesture.

     THE WINK IS AN ARC, NOT A DASH, which is that module's own note: a flat
     line reads as a closed eye on a sleeping face, where a shallow curve
     bending up is what a wink is. */
  /* NOTHING CALLS THIS ANY MORE: the pat closes both eyes. It is kept rather
     than deleted because the wink is the gardener's own pat face and a pose
     that ever needs one should use this arc rather than draw a second. */
  function eyeWink() {
    return '<circle cx="' + EYE_L + '" cy="' + EYE_Y + '" r="5.4" fill="' + C.ink + '"/>' +
           arc(EYE_R - 7, EYE_Y + 2, EYE_R + 7, EYE_Y + 2, EYE_R, EYE_Y - 8);
  }

  var POSES = {
    welcome: { face: eyesOpen()  + MOUTH.smile, wings: 1.00 },
    listen:  { face: eyesShut()  + MOUTH.smile, wings: 0.88 },
    hard:    { face: BROWS + eyesOpen() + MOUTH.worry, wings: 0.80 },
    planted: { face: eyesHappy() + MOUTH.beam,  wings: 1.08,
               extra: '<path d="' + starPath(38, 62, 9) + '" fill="' + C.pollen + '"/>' +
                      '<path d="' + starPath(163, 70, 7) + '" fill="' + C.wing + '"/>' },
    /* THE PAT CLOSES BOTH EYES AND BEAMS, which is where it parts company
       with `AvatarDraw.patFx` and the gardener's one-eyed wink. A wink is a
       thing done AT somebody, a shared joke; being patted is a thing that
       happens TO you, and the face for it is both eyes squeezed shut and a
       wide smile. On a round creature with two dot eyes a single wink also
       reads at a glance as one eye having gone missing.
       `eyesHappy` is the pair of upward arcs, not the flat line `eyesShut`
       draws, so this is a face enjoying itself rather than one asleep. The
       heart is released by the guide as a separate element, so it can be
       re-fired without the figure being redrawn around it. */
    pat:     { face: eyesHappy() + MOUTH.beam,  wings: 1.06 },
    bye:     { face: eyesShut()  + MOUTH.hush,  wings: 0.90,
               extra: '<text x="150" y="60" font-family="Fraunces,Georgia,serif" ' +
                      'font-size="20" font-style="italic" fill="' + C.wing + '">z</text>' }
  };

  /* ---------------------------------------------------------------- the body
     Drawn back to front, which is the gardens' own order: wings, then the
     body over them, then the shading, then the face. */
  function figure(pose) {
    var p = POSES[pose] || POSES.welcome;
    var w = p.wings;
    var s = "";

    /* ───────────────────────────────────────────────────────── THE WINGS
       IT IS A BUTTERFLY, NOT A BEE, AND THE WINGS ARE THE ONLY THING THAT
       SAYS SO. The first version drew four ellipses at `cy 98` and `cy 137`
       with the upper one's top edge at y 73 against a body whose own top is
       at 68, so no wing ever rose above the shoulder and both sat tight to
       the sides. That is a bee: small wings, low, held against the body. A
       butterfly's wings are LARGER THAN ITS BODY and the upper pair clears
       the shoulder, which is what the eye reads before it reads anything
       else.

       So they are paths rather than ellipses now. The upper wing sweeps up
       and out to a rounded outer corner at y 58, ten pixels above the top of
       the body, and reaches x 188 against the body's 151; the lower is
       smaller and tucked under it, which is the pairing every butterfly has
       and no bee does.

       DRAWN FIRST, before the antennae and the body, so both of those pass in
       front of them. Mirrored about x=100 by `translate(200,0) scale(-1,1)`
       rather than written out twice, or the two sides drift. */
    /* A BEZIER FALLS WELL SHORT OF ITS CONTROL POINTS, and the first pass at
       these paths forgot it: written to controls at x 188 they actually
       topped out near 180, so the wings came out SMALLER than the ellipses
       they replaced rather than larger. This project has now been caught by
       that three times, on the basket's handle, the hair's parting and here.
       **Aim a curve by the shape it draws, never by the numbers that steer
       it.** Measured on these: the upper reaches x 190 and y 42, against a
       body that reaches 151 and 68. */
    var UPPER = "M100 96C110 60 140 36 170 44C196 51 198 92 176 108" +
                "C160 120 126 120 100 110Z";
    var LOWER = "M100 114C126 116 162 128 168 152C172 174 146 182 128 168" +
                "C114 157 100 138 100 114Z";

    /* 2.6 against a 200 unit box is the same weight as the ambient
       butterfly's 0.09 against its own 1.0, scaled up. */
    var EDGE = ' stroke="' + C.wingEdge + '" stroke-width="2.6" stroke-linejoin="round"';

    function side() {
      return '<path d="' + UPPER + '" fill="' + C.wing + '"' + EDGE + '/>' +
             '<ellipse cx="157" cy="76" rx="24" ry="17" fill="' + C.wingLit +
             '" transform="rotate(-20 157 76)"/>' +
             /* ONE PALE SPOT PER WING, the ambient butterfly's own marking,
                at its alpha of 0.55. */
             '<ellipse cx="160" cy="72" rx="11" ry="14" fill="#ffffff" ' +
             'fill-opacity="0.55" transform="rotate(-20 160 72)"/>' +
             '<path d="' + LOWER + '" fill="' + C.wing + '"' + EDGE + '/>' +
             '<ellipse cx="140" cy="147" rx="15" ry="10" fill="' + C.wingLit +
             '" transform="rotate(28 140 147)"/>' +
             '<ellipse cx="142" cy="146" rx="7" ry="9" fill="#ffffff" ' +
             'fill-opacity="0.55" transform="rotate(28 142 146)"/>';
    }

    /* `gm-wings` AND `gm-eyes` EXIST FOR THE ANIMATION AND FOR NOTHING ELSE.
       The figure is rebuilt as a STRING whenever the pose changes, so anything
       that moves every frame cannot be redrawn here: it would mean
       regenerating the whole SVG sixty times a second. These two hooks let
       `garden-guide.js` drive the flap, the breath and the eyes from CSS
       instead, which costs nothing and survives a pose change. */
    s += '<g class="gm-wings" transform="translate(100 118) scale(' + w + ') translate(-100 -118)">' +
         side() +
         '<g transform="translate(200,0) scale(-1,1)">' + side() + '</g>' +
         '</g>';

    /* antennae, over the wings and under the head */
    s += '<path d="M88 78Q78 52 68 38" fill="none" stroke="' + C.stem +
         '" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<path d="M112 78Q122 52 132 38" fill="none" stroke="' + C.stem +
         '" stroke-width="3.2" stroke-linecap="round"/>';
    s += bloom(66, 33, 15, 0) + bloom(134, 33, 15, 36);

    /* feet, under the body so the body hides where they join, the way the
       foreground hill buries a stem in both gardens */
    /* LOW ENOUGH TO BE SEEN, AND THE EGG MOVED THEM. The body's lowest pixel
       was 166 as an ellipse and is 167 as an egg, so the feet went 168 to
       171: at 168 they would show four pixels of themselves, at 171 they
       clear it by about eleven, which is a foot rather than a bump. */
    s += '<ellipse cx="85" cy="171" rx="12" ry="7.5" fill="' + C.foot + '"/>';
    s += '<ellipse cx="115" cy="171" rx="12" ry="7.5" fill="' + C.foot + '"/>';

    /* ─────────────────────────────────────────────────── THE BODY IS AN EGG
       IT WAS A TRUE ELLIPSE AND THE SKETCH IS NOT. What the author drew is
       narrower at the top and heavier at the bottom, and a perfect ellipse is
       both rounder and blander than that: a disc has no direction, so the
       face floats in the middle of it with nothing to sit on. An egg gives
       the eyes a brow to be under and the cheeks a cheek to be on, and it is
       what makes the figure read as having a head rather than as being one.

       The widest point is at y 126, BELOW the middle, which is the whole of
       what makes it an egg rather than an ellipse rotated. Half width runs
       about 40 at eye level and 46 at the cheeks, against the old flat 51. */
    var BODY = "M100 68C126 68 143 96 146 126C149 152 128 167 100 167" +
               "C72 167 51 152 54 126C57 96 74 68 100 68Z";
    s += '<clipPath id="mclip-' + pose + '"><path d="' + BODY + '"/></clipPath>';
    s += '<path d="' + BODY + '" fill="' + C.body + '"/>';
    s += '<g clip-path="url(#mclip-' + pose + ')">' +
         '<ellipse cx="100" cy="186" rx="60" ry="42" fill="' + C.bodyLow + '"/></g>';

    /* TWO SMALL OVALS FOR HANDS, half in and half out of the silhouette. The
       body's half width at y 140 is about 44, so its edge is at 56 and 144
       and a hand centred at 54 and 146 sits across that line: wholly outside
       it reads as two beads floating beside the figure, wholly inside and it
       is a mark on the belly. Drawn AFTER the body so they are in front of
       it and BEFORE the face, and in `bodyLow` so they separate from the body
       by the one lightness step this project builds depth with. */
    s += '<ellipse cx="54" cy="140" rx="9.5" ry="7.5" fill="' + C.bodyLow +
         '" transform="rotate(-16 54 140)"/>';
    s += '<ellipse cx="146" cy="140" rx="9.5" ry="7.5" fill="' + C.bodyLow +
         '" transform="rotate(16 146 140)"/>';

    /* THE WHOLE FACE RIDES IN `gm-eyes`, CHEEKS AND NOSE INCLUDED, and that
       is a fix rather than tidiness. The gaze is a transform on this group,
       so with only the eyes inside it the eyes slid toward the pointer while
       the nose and the cheeks stayed where they were: at full deflection the
       nose sat off-centre under a pair of eyes that had moved, which reads
       as the face coming apart rather than as a glance. A face turns as one
       thing. The group's name is kept because the stylesheet and the guide
       both select it, and renaming it would be three edits for a word. */
    s += '<g class="gm-eyes">' +
         '<ellipse cx="71" cy="127" rx="11" ry="7" fill="' + C.cheek + '"/>' +
         '<ellipse cx="129" cy="127" rx="11" ry="7" fill="' + C.cheek + '"/>' +
         p.face + NOSE + '</g>';
    if (p.extra) s += p.extra;
    return s;
  }

  function svg(pose, px) {
    px = px || 160;
    return '<svg class="gm" width="' + px + '" height="' + px +
           '" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ' +
           'aria-hidden="true" focusable="false">' + figure(pose) + '</svg>';
  }

  window.GardenMascot = { svg: svg, poses: Object.keys(POSES), colours: C };
})();
