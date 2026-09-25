/* =========================================================================
   flower-kit.js  -  five primitives, five species, no model files

   THE SPIKE'S WHOLE ARGUMENT. Nothing here is a downloaded model: every
   species is the same handful of primitives assembled from a row of
   parameters, which is what lets a flower keep taking the hue the person
   chose, exactly as the 2D version does.

   The parameters that matter are the ones the web version already holds
   (petal count, hue, saturation, lightness) plus ONE new axis, PITCH: how
   far a petal leans from vertical. Pitch alone is what separates the
   tulip (closed, 8 degrees) from the daisy (flat, 78) from the lily
   (swept back past horizontal, 115). If these three do not read apart at
   garden distance, the kit is wrong, not the engine.

   Sizes are in metres and deliberately STYLISED rather than botanical:
   a real daisy beside a 1.5m avatar is a speck. These are knee to waist
   height, which is what the references do.
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";

/* ---------------------------------------------------------- primitives */

/* A petal, built as a strip of rows so it can be cupped and curled rather
   than being a flat card. Three vertices per row: left, middle, right, and
   the middle one is lifted to make the cup. */
export function petalGeometry({ len = 0.2, wid = 0.06, curl = 0.25, cup = 0.35,
                                tip = "round", thick = 0.2 }) {
  /* A PILLOW, NOT A SHEET. The petal was a single surface with no thickness,
     and a thin surface catches light as a thin surface however softly it is
     shaded: it can never read as clay. It is a closed lens now, thickest
     down its middle and tapering to a rounded rim all the way round, which
     is what the reference's tulip petals are.

     THE RIM IS ROUND BECAUSE OF THE PROFILE, not because of extra geometry.
     The thickness follows `sqrt(1 - (1 - e)^2)`, a semicircle in the
     distance from the edge, so it arrives at the boundary PERPENDICULAR.
     A linear taper would meet it at an angle and read as a knife edge, and
     rounding that off properly would have meant a separate rim strip.

     THICKNESS IS 0.2 OF THE WIDTH AND IT CANNOT GO MUCH ABOVE THAT. At 0.42
     it was measured against the reference's fat single petals and forgot the
     ringed blooms: a peony is forty three petals at about 0.05 apart, so
     inflating each by 0.04 filled every gap between them and the flower came
     out as a featureless ball. What reads as puffy on one big petal welds a
     ring of them into a sphere.

     Front and back meet exactly at the boundary, where the thickness is
     zero, so the shape closes with no seam to build. `weldSmooth` then
     averages the normals across the join and the rim shades as a curve. */
  const ROWS = 8, COLS = 4;
  /* TIPS ARE ROUND NOW, on every species. None of the references has a point
     on anything. The width profile is evaluated at 0.9 of the way along, so
     it still NARROWS toward the tip but stops before it reaches zero: the
     lily still recurves and the tulip is still a closed cup, they simply end
     in a soft cap rather than a spike. */
  const TIPCUT = 0.9;
  const widthAt = t => {
    const a = t * TIPCUT;
    if (tip === "point") return wid * Math.sin(Math.PI * Math.pow(a, 0.9)) * (1 - a * 0.55);
    if (tip === "notch") return wid * Math.sin(Math.PI * Math.pow(a, 0.6));
    return wid * Math.sin(Math.PI * Math.pow(a, 0.62));
  };

  const rows = [];
  for (let i = 0; i <= ROWS; i++) {
    const t = i / ROWS;
    const w = widthAt(t);
    const y = len * t;
    const z = curl * len * t * t;                 /* the backward bend */
    const row = [];
    for (let j = 0; j <= COLS; j++) {
      const u = (j / COLS) * 2 - 1;               /* -1 to 1 across the petal */
      const lift = -cup * w * (1 - u * u);        /* the cup, as a parabola */
      row.push(new THREE.Vector3(w * u, y, z + lift));
    }
    rows.push(row);
  }
  if (tip === "notch") {
    const last = rows[ROWS];
    for (let j = 0; j <= COLS; j++) {
      const u = (j / COLS) * 2 - 1;
      last[j].y -= len * 0.16 * Math.max(0, 1 - Math.abs(u) * 2.4);
      last[j].z += 0.01 * Math.max(0, 1 - Math.abs(u) * 2.4);
    }
  }

  const at = (i, j) => rows[Math.max(0, Math.min(ROWS, i))][Math.max(0, Math.min(COLS, j))];
  const T = wid * thick;
  const front = [], back = [];
  for (let i = 0; i <= ROWS; i++) {
    const fr = [], bk = [];
    for (let j = 0; j <= COLS; j++) {
      const du = new THREE.Vector3().subVectors(at(i, j + 1), at(i, j - 1));
      const dv = new THREE.Vector3().subVectors(at(i + 1, j), at(i - 1, j));
      const n = new THREE.Vector3().crossVectors(dv, du);
      if (n.lengthSq() < 1e-12) n.set(0, 0, 1); else n.normalize();
      /* how far inside the boundary this point sits, zero at every edge */
      const eu = 1 - Math.abs((j / COLS) * 2 - 1);
      const et = Math.min(i / ROWS, 1 - i / ROWS) * 2;
      const e = Math.max(0, Math.min(1, Math.min(eu, et)));
      const f = Math.sqrt(Math.max(0, 1 - (1 - e) * (1 - e)));
      const o = n.multiplyScalar(T * f);
      fr.push(at(i, j).clone().add(o));
      bk.push(at(i, j).clone().sub(o));
    }
    front.push(fr); back.push(bk);
  }

  /* DEEPER AT THE BASE, LIGHTER AT THE TIP, as a vertex colour rather than a
     second material. It is a MULTIPLIER over whatever hue the planter chose,
     so one gradient serves every colour and the hue slider still works. Every
     clay reference has this, and it is most of why they read as soft rather
     than printed: a flat petal has no throat. */
  const pos = [], col = [];
  const shade = v => {
    const t = Math.max(0, Math.min(1, v.y / Math.max(1e-6, len)));
    const k = 0.84 + t * 0.3;                 /* 0.84 at the base, 1.14 at the tip */
    col.push(k, k, k);
  };
  const pushQuad = (a1, b1, c1, d1) => {
    quad(pos, a1, b1, c1, d1);
    shade(a1); shade(b1); shade(c1);
    shade(a1); shade(c1); shade(d1);
  };
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      pushQuad(front[i][j], front[i][j + 1], front[i + 1][j + 1], front[i + 1][j]);
      pushQuad(back[i][j + 1], back[i][j], back[i + 1][j], back[i + 1][j + 1]);
    }
  }
  return fromPositions(pos, col);
}

export function stemGeometry({ height = 0.4, rBase = 0.012, rTop = 0.008, bend = 0.05, sides = 9 }) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bend * 0.6, height * 0.55, 0),
    new THREE.Vector3(bend, height, 0)
  );
  const STEPS = 9;
  const rings = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const c = curve.getPoint(t);
    const r = rBase + (rTop - rBase) * t;
    const ring = [];
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      ring.push(new THREE.Vector3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r));
    }
    rings.push(ring);
  }
  const pos = [];
  for (let i = 0; i < STEPS; i++) {
    for (let s = 0; s < sides; s++) {
      const n = (s + 1) % sides;
      quad(pos, rings[i][s], rings[i][n], rings[i + 1][n], rings[i + 1][s]);
    }
  }
  return fromPositions(pos);
}

/* The lavender's spike: a column of small buds, thinning toward the top.
   Merged into one geometry, since a hundred loose meshes per plant is how
   a cosy garden turns into a slideshow. */
export function spikeGeometry({ buds = 26, height = 0.34, radius = 0.035, budSize = 0.026, seed = 1 }) {
  const rnd = mulberry(seed);
  const parts = [];
  for (let i = 0; i < buds; i++) {
    const t = i / (buds - 1);
    const a = t * Math.PI * 6.5 + rnd() * 0.6;
    const r = radius * (1 - t * 0.75);
    const s = budSize * (1 - t * 0.45);
    /* round buds: an octahedron is eight flat faces and read as a crystal */
    const g = new THREE.SphereGeometry(s, 7, 5);
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(
      Math.cos(a) * r, height * t, Math.sin(a) * r));
    parts.push(g);
  }
  return mergeGeometries(parts);
}

/* A flower centre, and the lily's stamens use it too at a smaller size. */
/* A SOFT DOME, NOT A DRUM. This was a cylinder, so the flower's centre met
   its own side at a right angle and caught a hard line round the whole rim,
   which on a daisy sits in the middle of the picture. A squashed sphere has
   no edge anywhere and reads as the soft button the references have.
   The `h` it is given is the full height, so the sphere is scaled to half of
   it and the bottom half is buried in the petals. */
export function discGeometry({ r = 0.05, h = 0.02, seg = 20 }) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1));
  g.scale(1, Math.max(0.12, h / r), 1);
  return g;
}

/* ---------------------------------------------------------- the species */

/* Every field here already exists in the web version except `pitch`.
   The hues are the ones `SPECIES` carries in bouquet-sketch.js, so a
   flower is the same colour in both versions. */
export const SPECIES3D = {
  /* A CLUMP OF THREE, and that is the silhouette test's doing. Drawn as one
     head on one stem the daisy and the sunflower are the same shape at
     garden distance: a ring of petals with a centre. Daisies grow in low
     clusters, so habit is what separates them, not petal count. */
  daisy: {
    name: "Daisy", meaning: "Simplicity and joy",
    hue: 52, sat: 44, light: 70,
    petals: 12, pitch: 78, petalLen: 0.13, petalWid: 0.044, curl: 0.18, cup: 0.3, tip: "round",
    centre: { r: 0.036, h: 0.02, hue: 48, sat: 70, light: 52 },
    stem: 0.3, heads: 3, leaves: true
  },
  tulip: {
    name: "Tulip", meaning: "Renewal and change",
    hue: 350, sat: 68, light: 62,
    petals: 6, pitch: 8, petalLen: 0.24, petalWid: 0.115, curl: -0.1, cup: 0.5, tip: "point",
    centre: null,
    stem: 0.52, leaves: true
  },
  lily: {
    name: "Lily", meaning: "Peace and rest",
    hue: 20, sat: 40, light: 70,
    /* 100, not 115. A lily recurves, but past about 105 with this much curl
       the petals hang below the stem tip and the whole flower reads as
       drooping, which is a dying flower rather than a restful one. */
    petals: 6, pitch: 100, petalLen: 0.2, petalWid: 0.078, curl: 0.34, cup: 0.42, tip: "point",
    centre: null, stamens: 6,
    stem: 0.46, leaves: true
  },
  /* Mostly DISC where the daisy is mostly petal, and the head NODS. A real
     sunflower hangs its head forward, and that tilt is the other half of
     telling the two apart in silhouette. It is also the hook for the
     behaviour idea: a head that turns to follow the sun. */
  sunflower: {
    name: "Sunflower", meaning: "Hope and resilience",
    hue: 45, sat: 82, light: 56,
    petals: 18, pitch: 72, petalLen: 0.16, petalWid: 0.058, curl: 0.22, cup: 0.28, tip: "point",
    centre: { r: 0.12, h: 0.05, hue: 28, sat: 45, light: 32 },
    stem: 1.02, tilt: 24, leaves: true
  },
  /* RINGS, not a ring. A rose is the one species whose petals are mostly
     hiding each other: pitch climbs from nearly closed at the middle to
     almost flat at the outside, and the cup is deep throughout, which is
     what gives the wrapped look. The two inner rings take a lighter tone
     and the two outer a darker one, so the ball has depth without needing
     a texture. */
  rose: {
    name: "Rose", meaning: "Love and depth",
    hue: 344, sat: 62, light: 52,
    rings: [
      /* each ring sits a little LOWER than the one inside it. Stacked at one
         height the climbing pitches read as a staircase of frills rather
         than as a ball, which is the first thing this got wrong. */
      /* A ROSE PETAL IS ALMOST AS WIDE AS IT IS LONG, and that is what makes
         the ball. Narrow petals at climbing pitches spiral upward into a
         cone of frills, which is a hollyhock. Wide ones overlap sideways. */
      { count: 4, pitch: 14, len: 0.062, wid: 0.072, curl: -0.3,  cup: 0.62, light: 8,  y: 0.03 },
      { count: 6, pitch: 34, len: 0.072, wid: 0.086, curl: -0.18, cup: 0.58, light: 4,  y: 0.022 },
      { count: 7, pitch: 52, len: 0.082, wid: 0.096, curl: -0.05, cup: 0.52, light: 0,  y: 0.012 },
      { count: 8, pitch: 70, len: 0.09,  wid: 0.104, curl: 0.12,  cup: 0.46, light: -5, y: 0.003 },
      /* the outer ring is pushed PAST flat, to 96, so the ball sits on a
         flange of splayed petals. In silhouette a plain ball of petals is
         a tulip bud drawn rounder; the flange is what tells them apart. */
      { count: 8, pitch: 94, len: 0.098, wid: 0.11,  curl: 0.3,   cup: 0.34, light: -9, y: -0.005 }
    ],
    stem: 0.52, heads: 2, leaves: true
  },
  /* A BOWL OF FEW BROAD PETALS ROUND A BLACK EYE, which is the whole of a
     poppy and is unlike anything else in the set. It replaced the sakura,
     which was a five petalled pink flower and therefore a daisy in another
     colour until a notched petal was invented to save it. The poppy needs no
     such rescue: six petals where the daisy has twelve, each nearly as wide
     as it is long, and a centre that goes almost black.

     THE EYE IS THE SPECIES. Every other centre here is gold or pale; this is
     the only dark one, so at garden distance the poppy is the flower with a
     hole in the middle. `stamenTone` exists for it: a poppy's stamens are a
     dense dark ring, and the kit's default gold would have filled that hole
     back in. */
  poppy: {
    name: "Poppy", meaning: "Memory and reflection",
    hue: 356, sat: 58, light: 58,
    /* A BOWL, NOT A PLATE. At pitch 48 six petals this wide overlapped into a
       continuous flat disc and the black eye had nowhere to sit; from the
       garden camera it read as a dinner plate on a stem. At 38 the petals
       stand as walls, which is what a poppy actually does and what makes it
       the only open CUP in a set of flat rings and recurves. */
    petals: 6, pitch: 38, petalLen: 0.165, petalWid: 0.12, curl: 0.14, cup: 0.68,
    tip: "round",
    /* THE EYE HAS TO BE BIG ENOUGH TO SEE FROM THE GARDEN CAMERA. At 0.042
       against petals of 0.16 it was a dot, and rendered close up the poppy
       read as a plain six petalled star with a slightly darker middle, which
       is the one thing it must not be. It is 0.058 and domed, so it catches
       its own shadow, and it goes darker still. */
    centre: { r: 0.07, h: 0.03, y: 0.022, hue: 356, sat: 30, light: 11 },
    stamens: 12, stamenTone: { hue: 352, sat: 24, light: 17 },
    /* tall and bare, the way a poppy carries its head well clear of the
       leaves. It is the tallest of the seven bed flowers after the sunflower */
    stem: 0.6, leaves: true
  },
  /* THE OTHER RINGED BLOOM, and it has to differ from the rose in HABIT as
     well as in size, or two balls of petals is one flower drawn twice.

     The rose is a tight spray of TWO small heads. The peony is ONE big loose
     dome: five rings against the rose's five but wider at every step, the
     outer two pushed past flat so it spreads into a flange rather than
     closing into a ball, and paler. Measured across the outermost ring it is
     about a third wider than the rose.

     It replaced the lotus, which was the same routine already, so this is one
     ringed species standing in for another and the kit needed nothing new. */
  peony: {
    name: "Peony", meaning: "Honour and strength",
    hue: 332, sat: 52, light: 70,
    rings: [
      { count: 5,  pitch: 18,  len: 0.07,  wid: 0.078, curl: -0.26, cup: 0.6,  light: 10, y: 0.03 },
      { count: 7,  pitch: 40,  len: 0.086, wid: 0.096, curl: -0.1,  cup: 0.55, light: 5,  y: 0.021 },
      { count: 9,  pitch: 62,  len: 0.1,   wid: 0.11,  curl: 0.08,  cup: 0.48, light: 0,  y: 0.011 },
      { count: 11, pitch: 86,  len: 0.115, wid: 0.12,  curl: 0.24,  cup: 0.4,  light: -5, y: 0.002 },
      { count: 11, pitch: 102, len: 0.122, wid: 0.115, curl: 0.34,  cup: 0.3,  light: -9, y: -0.007 }
    ],
    tip: "round",
    stem: 0.5, leaves: true
  },
  lavender: {
    name: "Lavender", meaning: "Calm and safety",
    hue: 275, sat: 42, light: 66,
    stems: 5, stem: 0.42, spike: { buds: 24, height: 0.3, radius: 0.032, budSize: 0.024 },
    leaves: false
  }
};

const GREEN = { h: 138, s: 38, l: 38 };

/* ---------------------------------------------------------- assembly */

/* One flower, as a Group of three meshes at most: green parts, petals,
   centre. Kept separate because each takes its own colour, and because
   each is what an InstancedMesh would instance later when a garden holds
   hundreds of these. */
export function buildFlower(id, { hue = null, seed = null } = {}) {
  const sp = SPECIES3D[id];
  if (!sp) throw new Error("unknown species " + id);
  const H = hue == null ? sp.hue : hue;

  const group = new THREE.Group();
  group.name = id;
  /* EVERY PLANT USED TO BE THE SAME PLANT. The two generators below were
     seeded 7 and 11, fixed, so a row of eight daisies was one daisy drawn
     eight times and a bed read as a rack rather than as something grown.
     `seed` is the caller's, so a reload still gives the same garden. */
  const sd = (seed == null ? 1 : seed) | 0;

  const greenMat = flatMat(GREEN.h, GREEN.s, GREEN.l, 0.78, true);
  /* Every petal material is registered here with its own lightness offset,
     so one hue slider can move a rose's five rings and keep the depth
     between them. The person picks a hue; the tones are the species'. */
  const tint = [];
  const tinted = (lightOff = 0) => {
    const m = flatMat(H, sp.sat, sp.light + lightOff, 0.55, true);
    tint.push({ mat: m, sat: sp.sat, light: sp.light + lightOff });
    return m;
  };
  const petalMat = tinted(0);
  group.userData.petalMat = petalMat;
  group.userData.greenMat = greenMat;
  group.userData.tint = tint;

  /* lavender is a clump of spikes rather than one bloom on one stem, which
     is what stops it reading as "a small purple flower" at distance */
  if (id === "lavender") {
    const stems = [], spikes = [];
    const rnd = mulberry(7 + sd * 13);
    for (let i = 0; i < sp.stems; i++) {
      const a = (i / sp.stems) * Math.PI * 2 + rnd() * 0.5;
      const rad = 0.035 + rnd() * 0.03;
      const h = sp.stem * STEM_K * (0.78 + rnd() * 0.35);
      const lean = 0.06 + rnd() * 0.05;
      const m = new THREE.Matrix4()
        .makeTranslation(Math.cos(a) * rad, 0, Math.sin(a) * rad)
        .multiply(new THREE.Matrix4().makeRotationY(a));
      const st = stemGeometry({ height: h, rBase: 0.009, rTop: 0.006, bend: lean });
      st.applyMatrix4(m);
      stems.push(st);
      const sk = spikeGeometry({ ...sp.spike, seed: i + 1 });
      sk.applyMatrix4(new THREE.Matrix4().makeTranslation(lean, h, 0).premultiply(m));
      spikes.push(sk);
    }
    const stemMesh = mesh(mergeGeometries(stems), greenMat);
    const budMesh = mesh(mergeGeometries(spikes), petalMat);
    group.add(stemMesh, budMesh);
    /* lavender has no bloom that opens: the spike simply rises */
    group.userData.blooms = [];
    return vary(group, id, sd);
  }

  /* everything else: stems, leaves, and one bloom per head */
  const heads = sp.heads || 1;
  const rnd = mulberry(11 + sd * 29);
  const greens = [];
  const blooms = [];

  for (let k = 0; k < heads; k++) {
    /* a clump fans out a little and every head stands at its own height,
       or three daisies read as one daisy drawn three times */
    const a = heads === 1 ? 0 : (k / heads) * Math.PI * 2 + 0.7;
    const off = heads === 1 ? 0 : 0.055 + rnd() * 0.03;
    const hx = Math.cos(a) * off, hz = Math.sin(a) * off;
    const h = sp.stem * STEM_K * (heads === 1 ? 1 : 0.74 + rnd() * 0.45);
    const bend = 0.035 + rnd() * 0.03;

    const st = stemGeometry({ height: h, bend });
    st.applyMatrix4(new THREE.Matrix4().makeTranslation(hx, 0, hz));
    greens.push(st);

    if (sp.leaves && k === 0) {
      /* THREE TO FIVE LEAVES, STAGGERED. It was exactly two, exactly
         opposite, at exactly the same height and the same angle, which read
         as a bracket rather than as foliage and was the most mechanical
         thing on the plant. They now sit at their own heights up the stem,
         at their own sizes, and are turned to their own side rather than
         paired, so no plant has a symmetry line through it.

         CAPPED at 0.17, because leaf size is a fraction of the STEM and the
         sunflower's is 1.02: proportionally honest, visually paddles. */
      const n = 3 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const up = 0.16 + (i / n) * 0.44 + rnd() * 0.07;
        const sz = 0.72 + rnd() * 0.5;
        const lLen = Math.min(sp.stem * 0.26, 0.17) * sz;
        const leaf = petalGeometry({ len: lLen, wid: lLen * 0.42,
                                     curl: 0.3, cup: 0.25, tip: "round", thick: 0.18 });
        /* the stem bends as it rises, so a leaf has to follow it or it hangs
           in the air beside one. The curve is quadratic, hence up squared. */
        leaf.applyMatrix4(new THREE.Matrix4()
          .makeTranslation(hx + bend * up * up, h * up, hz)
          .multiply(new THREE.Matrix4().makeRotationY(rnd() * Math.PI * 2))
          .multiply(new THREE.Matrix4().makeRotationX(
            THREE.MathUtils.degToRad(56 + rnd() * 26))));
        greens.push(leaf);
      }
    }

    /* A CALYX, the little green cup a bloom sits in. Without one the stem
       simply vanished into the petals and the head read as pushed on rather
       than grown. It is part of the GREENS rather than of the bloom, so it
       stays put while the bloom opens out of it, which is what a real one
       does. Sized from the bloom, not fixed, or the sunflower wears a daisy's. */
    const calR = (sp.rings ? sp.rings[sp.rings.length - 1].len
                           : sp.petalLen) * 0.42 + 0.012;
    const cal = new THREE.ConeGeometry(calR, calR * 1.15, 9);
    cal.rotateX(Math.PI);                        /* point down, mouth up */
    cal.translate(hx + bend, h - calR * 0.3, hz);
    greens.push(cal);

    /* THE BLOOM IS ITS OWN GROUP so the opening animation can scale it, the
       way the 2D version scales a bloom out of its bud. */
    const bloom = new THREE.Group();
    bloom.position.set(hx + bend, h, hz);
    if (sp.tilt) bloom.rotation.x = THREE.MathUtils.degToRad(sp.tilt);

    /* the scale goes on an INNER group: `growFlower` writes the whole of the
       outer scale every frame to open the bloom, so a size put there would
       be wiped on the first frame of growth. */
    const head = new THREE.Group();
    head.scale.setScalar(BLOOM_K);
    dressBloom(head, sp, tinted, petalMat, rnd);
    bloom.add(head);
    group.add(bloom);
    blooms.push(bloom);
  }

  group.add(mesh(mergeGeometries(greens), greenMat));
  group.userData.blooms = blooms;
  return vary(group, id, sd);
}

/* NO TWO PLANTS STAND THE SAME WAY, and the size has to go on an INNER group
   rather than on the one that is returned. `growFlower` writes the whole of
   the outer scale every frame, `(1, up, 1)`, so a per plant scale put there
   would be wiped on the first frame of growth and the bed would snap back to
   uniform the moment anything grew. Turning it and leaning it are safe on the
   outer group, since growth never touches rotation.

   The amounts are small on purpose: a few degrees of lean and about seven
   percent of size. Enough that a row is not a row of copies, not so much that
   a garden looks windswept. */
function vary(body, id, sd) {
  const r = mulberry(sd * 977 + 31);
  const outer = new THREE.Group();
  outer.name = id;
  outer.add(body);
  outer.userData = body.userData;          /* by reference: growth reads this */
  outer.rotation.y = r() * Math.PI * 2;    /* which way it happens to face */
  const lean = 0.045 + r() * 0.055;
  const dir = r() * Math.PI * 2;
  outer.rotation.x = Math.cos(dir) * lean;
  outer.rotation.z = Math.sin(dir) * lean;
  body.scale.setScalar(0.93 + r() * 0.14);
  return outer;
}

/* THE BLOOM ITSELF, so that a flower in the garden and the same flower worn
   in somebody's hair are one piece of code. The avatar's keepsakes are built
   from this, which is the whole reason the kit exists: this project already
   pays for the same flower maths in seven places in the 2D version. */
/* NO TWO PETALS IN A RING ARE THE SAME. Every petal was one geometry stamped
   out at even angles, which is what made a bloom read as manufactured: the
   eye finds the repeat immediately. Ten percent of jitter on length, width,
   curl, pitch and angle is enough that it stops finding one, and small
   enough that the species is untouched, which matters because telling the
   eight apart is the question this whole spike exists to answer. */
const JIT = 0.1;
/* THE CUTE CARICATURE: a big head on a modest stem. A fifth larger and a
   tenth shorter is the standard move and what every clay reference does. It
   also helps the species read at garden distance, since the bloom is the
   part carrying the meaning and the stem is not. */
const BLOOM_K = 1.2, STEM_K = 0.9;
const jit = (rnd, v) => v * (1 + (rnd() - 0.5) * 2 * JIT);

function dressBloom(bloom, sp, tinted, petalMat, rnd) {
  if (sp.rings) {
    addRings(bloom, sp, tinted, rnd);
  } else {
    const petals = [];
    for (let i = 0; i < sp.petals; i++) {
      const g = petalGeometry({
        len: jit(rnd, sp.petalLen), wid: jit(rnd, sp.petalWid),
        curl: jit(rnd, sp.curl), cup: sp.cup, tip: sp.tip });
      const spin = (i / sp.petals) * Math.PI * 2 + (rnd() - 0.5) * (Math.PI * 2 / sp.petals) * JIT * 2;
      g.applyMatrix4(new THREE.Matrix4()
        .makeRotationY(spin)
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(jit(rnd, sp.pitch)))));
      petals.push(g);
    }
    bloom.add(mesh(mergeGeometries(petals), petalMat));
  }

  if (sp.centre) {
    const c = mesh(discGeometry({ r: sp.centre.r, h: sp.centre.h }),
                   flatMat(sp.centre.hue, sp.centre.sat, sp.centre.light));
    /* `y` lifts a centre clear of petals that cup up around it. The poppy
       needs it: at cup 0.6 its six broad petals rose past a disc sitting on
       the origin and swallowed the black eye that names the species. */
    c.position.y = sp.centre.h * 0.5 + (sp.centre.y || 0);
    bloom.add(c);
  }
  if (sp.stamens) {
    const sticks = [];
    for (let i = 0; i < sp.stamens; i++) {
      const ang = (i / sp.stamens) * Math.PI * 2;
      const stk = stemGeometry({ height: 0.075, rBase: 0.005, rTop: 0.004, bend: 0.02, sides: 4 });
      stk.applyMatrix4(new THREE.Matrix4().makeRotationY(ang)
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(14))));
      sticks.push(stk);
      const tipG = new THREE.SphereGeometry(0.011, 6, 5);
      tipG.applyMatrix4(new THREE.Matrix4().makeTranslation(
        Math.cos(ang) * 0.028, 0.078, Math.sin(ang) * 0.028));
      sticks.push(tipG);
    }
    /* gold unless the species says otherwise. The poppy's stamens are a dark
       ring and gold ones would have filled in the black eye that names it. */
    const st = sp.stamenTone || { hue: 42, sat: 60, light: 52 };
    bloom.add(mesh(mergeGeometries(sticks), flatMat(st.hue, st.sat, st.light)));
  }
}

/* A bloom on its own, with no stem and no plant under it. A tree and a water
   plant both answer this, because what is worn is the FLOWER, never the
   habit: a sakura clip is two blossoms, not a small tree on somebody's head. */
export function buildBloom(id, { hue = null, scale = 1 } = {}) {
  const sp = SPECIES3D[id];
  if (!sp) return new THREE.Group();
  const H = hue === null ? sp.hue : hue;
  const tint = [];
  const tinted = (lightOff = 0) => {
    const m = flatMat(H, sp.sat, sp.light + lightOff, 0.55, true);
    tint.push({ mat: m, sat: sp.sat, light: sp.light + lightOff });
    return m;
  };
  const bloom = new THREE.Group();
  /* every species is a bloom on a stem now, so a worn flower is simply that
     species' own bloom. This used to carry an override for the sakura, whose
     row described a tree. */
  dressBloom(bloom, sp, tinted, tinted(0), mulberry(5));
  bloom.scale.setScalar(scale);
  bloom.userData.tint = tint;
  return bloom;
}

/* A bloom built as rings of petals, inner rings nearly closed and outer
   rings nearly flat. The rose and the lotus are the same routine with
   different numbers, which is the kit doing its job. */
function addRings(bloom, sp, tinted, rnd) {
  sp.rings.forEach((ring, ri) => {
    const geoms = [];
    for (let i = 0; i < ring.count; i++) {
      const g = petalGeometry({
        len: jit(rnd, ring.len), wid: jit(rnd, ring.wid),
        curl: jit(rnd, ring.curl), cup: ring.cup,
        tip: sp.tip || "round"
      });
      /* every ring is turned half a step off the one inside it, so petals
         sit in the gaps rather than stacking into columns */
      const off = (ri % 2) * (Math.PI / ring.count) +
                  (rnd() - 0.5) * (Math.PI * 2 / ring.count) * JIT * 2;
      g.applyMatrix4(new THREE.Matrix4()
        .makeTranslation(0, ring.y || 0, 0)
        .multiply(new THREE.Matrix4().makeRotationY((i / ring.count) * Math.PI * 2 + off))
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(jit(rnd, ring.pitch)))));
      geoms.push(g);
    }
    bloom.add(mesh(mergeGeometries(geoms), tinted(ring.light || 0)));
  });
}

/* ---------------------------------------------------------- helpers */

/* `flatMat` keeps its name and no longer shades flat. Smooth normals plus a
   fairly high roughness is the Animal Crossing register: soft gradients over
   chunky forms, with no hard facet anywhere and no specular glint either. */
/* 0.55, not 0.82. A broad soft highlight rolling across a petal is a large
   part of what says the thing is solid: the references all have one. The
   green stays matter, since a shiny stem reads as plastic. */
function flatMat(h, s, l, rough = 0.55, vcol = false) {
  const m = new THREE.MeshStandardMaterial({
    roughness: rough, metalness: 0, side: THREE.DoubleSide, vertexColors: vcol });
  m.color.setHSL(h / 360, s / 100, l / 100);
  return m;
}
function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}
function quad(out, a, b, c, d) {
  out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  out.push(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
}
/* SMOOTH SHADING NEEDS WELDED VERTICES, and that is why turning `flatShading`
   off on its own changed almost nothing. Geometry built here is a soup of
   loose triangles, so `computeVertexNormals` has nothing to average: each
   triangle owns its three vertices and gets one flat normal, which is
   exactly what flat shading was doing anyway.

   Welding by position first gives every vertex its neighbours back, so the
   normal at a point becomes the average of every face meeting there and the
   surface reads as curved. The tolerance is 0.1mm in world units, which is
   far below anything modelled here and far above float noise. */
function weldSmooth(geo, tol = 1e-4) {
  const pos = geo.attributes.position.array;
  const src = geo.attributes.color ? geo.attributes.color.array : null;
  const n = pos.length / 3;
  const seen = new Map();
  const verts = [], cols = [];
  const index = new Array(n);
  const q = 1 / tol;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const key = Math.round(x * q) + "," + Math.round(y * q) + "," + Math.round(z * q);
    let id = seen.get(key);
    if (id === undefined) {
      id = verts.length / 3;
      seen.set(key, id);
      verts.push(x, y, z);
      /* a welded vertex takes the first colour seen at that point, which is
         safe here because the gradient is a function of POSITION: every copy
         of a shared vertex was given the same colour anyway */
      if (src) cols.push(src[i * 3], src[i * 3 + 1], src[i * 3 + 2]);
    }
    index[i] = id;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  if (src) out.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  out.setIndex(index);
  out.computeVertexNormals();
  return out;
}

function fromPositions(pos, col) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (col) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return weldSmooth(g);
}
/* `BufferGeometryUtils` lives in three's examples rather than the core, and
   the whole point of vendoring one file is not to chase a second one. */
export function mergeGeometries(list) {
  let n = 0;
  const flat = list.map(g => (g.index ? g.toNonIndexed() : g));
  flat.forEach(g => { n += g.attributes.position.count; });
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  /* ALWAYS a colour attribute, filled with white where a part has none, so a
     merged mesh can carry a gradient on some of its pieces and not others:
     a stem has no gradient, the leaf merged beside it does, and white is the
     identity under the multiply the material does. Without this the material
     could not declare `vertexColors` at all. */
  const col = new Float32Array(n * 3).fill(1);
  let o = 0;
  flat.forEach(g => {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return out;
}
/* Seeded, so a clump of lavender is the same clump on every reload. The
   web version seeds everything for the same reason. */
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* =========================================================================
   THE TREE IS SCENERY, NOT A SPECIES.

   It began as the sakura, because a blossom on a stem could not be told
   apart from a daisy. The notched petal solved that, so the species went
   back into the grass with the other seven and the tree stayed behind as
   what it always really was: the thing the garden is arranged around, and
   something to stand under. Nothing is planted as one.
   ========================================================================= */
export const TREE = { trunk: 0.7, branches: 5, blobs: 16, spread: 0.34, top: 0.42 };

export function buildTree({ hue = 335, sat = 58, light = 72, t = TREE } = {}) {
  const group = new THREE.Group();
  const tint = [];
  const tinted = (lightOff = 0) => {
    const m = flatMat(hue, sat, light + lightOff);
    tint.push({ mat: m, sat, light: light + lightOff });
    return m;
  };
  const rnd = mulberry(3);
  const bark = flatMat(24, 26, 40);
  const woods = [stemGeometry({ height: t.trunk, rBase: 0.055, rTop: 0.028, bend: 0.06, sides: 5 })];
  for (let i = 0; i < t.branches; i++) {
    const a = (i / t.branches) * Math.PI * 2 + rnd() * 0.4;
    const br = stemGeometry({ height: 0.3 + rnd() * 0.12, rBase: 0.022, rTop: 0.012, bend: 0.12, sides: 4 });
    br.applyMatrix4(new THREE.Matrix4()
      .makeTranslation(0.05, t.trunk * 0.78, 0)
      .multiply(new THREE.Matrix4().makeRotationY(a))
      .multiply(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(28 + rnd() * 14))));
    woods.push(br);
  }
  group.add(mesh(mergeGeometries(woods), bark));

  /* the canopy is a handful of overlapping blobs rather than one sphere:
     one sphere reads as a lollipop, and a lollipop is not a tree. Every blob
     is at the SAME detail, since mixing a detail 0 with a detail 1 put three
     hard crystals in a canopy of soft ones. */
  const canopy = new THREE.Group();
  canopy.position.y = t.trunk + t.top * 0.42;
  const pale = [], deep = [];
  for (let i = 0; i < t.blobs; i++) {
    const a = (i / t.blobs) * Math.PI * 2 + rnd();
    const rad = t.spread * (0.3 + rnd() * 0.78);
    const r = 0.095 + rnd() * 0.075;
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(
      Math.cos(a) * rad, (rnd() - 0.4) * t.top * 0.5, Math.sin(a) * rad));
    (i % 3 === 0 ? deep : pale).push(g);
  }
  canopy.add(mesh(mergeGeometries(pale), tinted(0)));
  canopy.add(mesh(mergeGeometries(deep), tinted(-9)));
  group.add(canopy);
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  group.userData.tint = tint;
  return group;
}
