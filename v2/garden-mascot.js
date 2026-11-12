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
    foot:     "#e7bf43",  /* a THIRD step down. At bodyLow the feet were the same
                             colour as the body's own bottom shading and vanished
                             into it, which is the whole risk of depth by lightness:
                             two parts a step apart separate, two parts on the same
                             step are one part. */
    wing:     "#b7e4e7",  /* sky */
    wingLit:  "#dcf4f5",
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

  var POSES = {
    welcome: { face: eyesOpen()  + MOUTH.smile, wings: 1.00 },
    listen:  { face: eyesShut()  + MOUTH.smile, wings: 0.88 },
    hard:    { face: BROWS + eyesOpen() + MOUTH.worry, wings: 0.80 },
    planted: { face: eyesHappy() + MOUTH.beam,  wings: 1.08,
               extra: '<path d="' + starPath(38, 62, 9) + '" fill="' + C.pollen + '"/>' +
                      '<path d="' + starPath(163, 70, 7) + '" fill="' + C.wing + '"/>' },
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

    /* antennae first, so the head sits over where they root */
    s += '<path d="M88 78Q78 52 68 38" fill="none" stroke="' + C.stem +
         '" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<path d="M112 78Q122 52 132 38" fill="none" stroke="' + C.stem +
         '" stroke-width="3.2" stroke-linecap="round"/>';
    s += bloom(66, 33, 15, 0) + bloom(134, 33, 15, 36);

    /* wings, behind the body. Two a side, the upper the larger, each with one
       paler fill inside it rather than a highlight stroke. */
    s += '<g transform="translate(100 118) scale(' + w + ') translate(-100 -118)">';
    [[-1, 1], [1, 1]].forEach(function (m) {
      var k = m[0];
      /* FURTHER OUT AND BIGGER THAN THE FIRST ATTEMPT. At cx 100+-50 with rx 33
         the body (rx 51) covered most of each wing and they read as pale smudges
         either side rather than as wings. Pushed to +-58 with rx 37 the wing's
         outer edge reaches 95 against the body's 51, so two thirds of it is in
         clear air, which is what makes the silhouette a winged thing. */
      s += '<ellipse cx="' + (100 + k * 58) + '" cy="98" rx="37" ry="25" fill="' + C.wing +
           '" transform="rotate(' + (k * -17) + ' ' + (100 + k * 58) + ' 98)"/>';
      s += '<ellipse cx="' + (100 + k * 60) + '" cy="93" rx="21" ry="13" fill="' + C.wingLit +
           '" transform="rotate(' + (k * -17) + ' ' + (100 + k * 60) + ' 93)"/>';
      s += '<ellipse cx="' + (100 + k * 50) + '" cy="137" rx="26" ry="17" fill="' + C.wing +
           '" transform="rotate(' + (k * 13) + ' ' + (100 + k * 50) + ' 137)"/>';
      s += '<ellipse cx="' + (100 + k * 52) + '" cy="134" rx="14" ry="9" fill="' + C.wingLit +
           '" transform="rotate(' + (k * 13) + ' ' + (100 + k * 52) + ' 134)"/>';
    });
    s += '</g>';

    /* feet, under the body so the body hides where they join, the way the
       foreground hill buries a stem in both gardens */
    /* LOW ENOUGH TO BE SEEN. The body's lowest pixel is 117+49=166, so feet
       centred at 161 showed about two pixels of themselves. At 168 they clear
       it by nine, which is a foot rather than a bump. */
    s += '<ellipse cx="85" cy="168" rx="12" ry="7.5" fill="' + C.foot + '"/>';
    s += '<ellipse cx="115" cy="168" rx="12" ry="7.5" fill="' + C.foot + '"/>';

    /* the body, and its depth: one deeper butter low in it, clipped to the
       silhouette. No outline, no texture. */
    s += '<clipPath id="mclip-' + pose + '"><ellipse cx="100" cy="117" rx="51" ry="49"/></clipPath>';
    s += '<ellipse cx="100" cy="117" rx="51" ry="49" fill="' + C.body + '"/>';
    s += '<g clip-path="url(#mclip-' + pose + ')">' +
         '<ellipse cx="100" cy="186" rx="60" ry="42" fill="' + C.bodyLow + '"/></g>';

    s += '<ellipse cx="71" cy="127" rx="11" ry="7" fill="' + C.cheek + '"/>';
    s += '<ellipse cx="129" cy="127" rx="11" ry="7" fill="' + C.cheek + '"/>';
    s += p.face;
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
