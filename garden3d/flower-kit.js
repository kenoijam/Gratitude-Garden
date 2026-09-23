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
export function petalGeometry({ len = 0.2, wid = 0.06, curl = 0.25, cup = 0.35, tip = "round" }) {
  const ROWS = 6;
  const pos = [];
  const rows = [];
  for (let i = 0; i <= ROWS; i++) {
    const t = i / ROWS;
    /* how wide the petal is at this point along its length */
    let w;
    if (tip === "point")      w = wid * Math.sin(Math.PI * Math.pow(t, 0.9)) * (1 - t * 0.55);
    else if (tip === "notch") w = wid * Math.sin(Math.PI * Math.pow(t, 0.6));
    else                      w = wid * Math.sin(Math.PI * Math.pow(t, 0.62));
    const y = len * t;
    const z = curl * len * t * t;                 /* the backward bend */
    const lift = -cup * w;                        /* the cup across the petal */
    rows.push([
      new THREE.Vector3(-w, y, z),
      new THREE.Vector3(0, y, z + lift),
      new THREE.Vector3(w, y, z)
    ]);
  }
  /* a notched tip is the same shape with its last row split back down */
  if (tip === "notch") {
    const last = rows[ROWS];
    last[1].y -= len * 0.12;
    last[1].z += 0.01;
  }
  for (let i = 0; i < ROWS; i++) {
    const a = rows[i], b = rows[i + 1];
    quad(pos, a[0], a[1], b[1], b[0]);
    quad(pos, a[1], a[2], b[2], b[1]);
  }
  return fromPositions(pos);
}

/* A tapered, slightly bent stem. Five sides, because at this size nobody
   counts them and it keeps the flat shading crisp. */
export function stemGeometry({ height = 0.4, rBase = 0.012, rTop = 0.008, bend = 0.05, sides = 5 }) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bend * 0.6, height * 0.55, 0),
    new THREE.Vector3(bend, height, 0)
  );
  const STEPS = 7;
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
    const g = new THREE.OctahedronGeometry(s, 0);
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(
      Math.cos(a) * r, height * t, Math.sin(a) * r));
    parts.push(g);
  }
  return mergeGeometries(parts);
}

/* A flower centre, and the lily's stamens use it too at a smaller size. */
export function discGeometry({ r = 0.05, h = 0.02, seg = 10 }) {
  return new THREE.CylinderGeometry(r * 0.92, r, h, seg);
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
  /* A TREE, and that is the whole point. As one blossom on a stem the
     sakura is a five petalled pink flower, which is a daisy in another
     colour. As a small tree it is the only thing in the garden with a
     canopy, it gives the plot vertical variety, and it is something you
     can sit under, which is what "reflection and presence" should be. */
  sakura: {
    /* A STEM FLOWER AGAIN, and the NOTCH is what makes that possible.
       It was a tree here, because one blossom on a stem lost the silhouette
       test against the daisy. The cleft tip is the actual signature of a
       cherry petal in botanical drawing, and five broad notched petals round
       a ring of stamens cannot be read as a daisy's twelve narrow ones.
       The tree is still in the scene, as SCENERY: see `buildTree`. */
    name: "Sakura", meaning: "Reflection and presence",
    hue: 335, sat: 58, light: 72,
    petals: 5, pitch: 66, petalLen: 0.125, petalWid: 0.088, curl: 0.18, cup: 0.3,
    tip: "notch",
    centre: { r: 0.022, h: 0.012, hue: 48, sat: 72, light: 58 },
    stamens: 8,
    stem: 0.42, leaves: true
  },
  /* ON WATER. Its meaning is rising out of something, so the pad it rises
     from is not decoration: it is the half of the picture that says it.
     The pads also make the lotus the one species that cannot be planted
     just anywhere, which is a rule the 2D version had no way to express. */
  lotus: {
    name: "Lotus", meaning: "Strength and rising",
    hue: 318, sat: 56, light: 70,

    rings: [
      { count: 6, pitch: 20, len: 0.17, wid: 0.066, curl: -0.15, cup: 0.5, light: 6 },
      { count: 7, pitch: 42, len: 0.185, wid: 0.072, curl: 0.05, cup: 0.45, light: 0 },
      { count: 8, pitch: 64, len: 0.2, wid: 0.078, curl: 0.2, cup: 0.4, light: -6 }
    ],
    tip: "point",
    /* ON A STEM, IN THE GRASS. It grew from its own pool of water, which was
       true to the plant and made it the one species that could not be
       planted with the others. The 2D version has always drawn it as a bloom
       on a stem in a meadow, and nobody has ever blinked at it. */
    stem: 0.44, leaves: true
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
export function buildFlower(id, { hue = null } = {}) {
  const sp = SPECIES3D[id];
  if (!sp) throw new Error("unknown species " + id);
  const H = hue == null ? sp.hue : hue;

  const group = new THREE.Group();
  group.name = id;

  const greenMat = flatMat(GREEN.h, GREEN.s, GREEN.l);
  /* Every petal material is registered here with its own lightness offset,
     so one hue slider can move a rose's five rings and keep the depth
     between them. The person picks a hue; the tones are the species'. */
  const tint = [];
  const tinted = (lightOff = 0) => {
    const m = flatMat(H, sp.sat, sp.light + lightOff);
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
    const rnd = mulberry(7);
    for (let i = 0; i < sp.stems; i++) {
      const a = (i / sp.stems) * Math.PI * 2 + rnd() * 0.5;
      const rad = 0.035 + rnd() * 0.03;
      const h = sp.stem * (0.78 + rnd() * 0.35);
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
    return group;
  }

  /* everything else: stems, leaves, and one bloom per head */
  const heads = sp.heads || 1;
  const rnd = mulberry(11);
  const greens = [];
  const blooms = [];

  for (let k = 0; k < heads; k++) {
    /* a clump fans out a little and every head stands at its own height,
       or three daisies read as one daisy drawn three times */
    const a = heads === 1 ? 0 : (k / heads) * Math.PI * 2 + 0.7;
    const off = heads === 1 ? 0 : 0.055 + rnd() * 0.03;
    const hx = Math.cos(a) * off, hz = Math.sin(a) * off;
    const h = sp.stem * (heads === 1 ? 1 : 0.74 + rnd() * 0.45);
    const bend = 0.035 + rnd() * 0.03;

    const st = stemGeometry({ height: h, bend });
    st.applyMatrix4(new THREE.Matrix4().makeTranslation(hx, 0, hz));
    greens.push(st);

    if (sp.leaves && k === 0) {
      for (const side of [-1, 1]) {
        const leaf = petalGeometry({ len: sp.stem * 0.42, wid: sp.stem * 0.12, curl: 0.3, cup: 0.25, tip: "point" });
        leaf.applyMatrix4(new THREE.Matrix4()
          .makeTranslation(hx, sp.stem * 0.3, hz)
          .multiply(new THREE.Matrix4().makeRotationY(side > 0 ? 0.6 : Math.PI - 0.6))
          .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(68))));
        greens.push(leaf);
      }
    }

    /* THE BLOOM IS ITS OWN GROUP so the opening animation can scale it, the
       way the 2D version scales a bloom out of its bud. */
    const bloom = new THREE.Group();
    bloom.position.set(hx + bend, h, hz);
    if (sp.tilt) bloom.rotation.x = THREE.MathUtils.degToRad(sp.tilt);

    dressBloom(bloom, sp, tinted, petalMat);
    group.add(bloom);
    blooms.push(bloom);
  }

  group.add(mesh(mergeGeometries(greens), greenMat));
  group.userData.blooms = blooms;
  return group;
}

/* THE BLOOM ITSELF, so that a flower in the garden and the same flower worn
   in somebody's hair are one piece of code. The avatar's keepsakes are built
   from this, which is the whole reason the kit exists: this project already
   pays for the same flower maths in seven places in the 2D version. */
function dressBloom(bloom, sp, tinted, petalMat) {
  if (sp.rings) {
    addRings(bloom, sp, tinted);
  } else {
    const petals = [];
    for (let i = 0; i < sp.petals; i++) {
      const g = petalGeometry({ len: sp.petalLen, wid: sp.petalWid, curl: sp.curl, cup: sp.cup, tip: sp.tip });
      g.applyMatrix4(new THREE.Matrix4()
        .makeRotationY((i / sp.petals) * Math.PI * 2)
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(sp.pitch))));
      petals.push(g);
    }
    bloom.add(mesh(mergeGeometries(petals), petalMat));
  }

  if (sp.centre) {
    const c = mesh(discGeometry({ r: sp.centre.r, h: sp.centre.h }),
                   flatMat(sp.centre.hue, sp.centre.sat, sp.centre.light));
    c.position.y = sp.centre.h * 0.5;
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
      const tipG = new THREE.OctahedronGeometry(0.011, 0);
      tipG.applyMatrix4(new THREE.Matrix4().makeTranslation(
        Math.cos(ang) * 0.028, 0.078, Math.sin(ang) * 0.028));
      sticks.push(tipG);
    }
    bloom.add(mesh(mergeGeometries(sticks), flatMat(42, 60, 52)));
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
    const m = flatMat(H, sp.sat, sp.light + lightOff);
    tint.push({ mat: m, sat: sp.sat, light: sp.light + lightOff });
    return m;
  };
  const bloom = new THREE.Group();
  /* every species is a bloom on a stem now, so a worn flower is simply that
     species' own bloom. This used to carry an override for the sakura, whose
     row described a tree. */
  dressBloom(bloom, sp, tinted, tinted(0));
  bloom.scale.setScalar(scale);
  bloom.userData.tint = tint;
  return bloom;
}

/* A bloom built as rings of petals, inner rings nearly closed and outer
   rings nearly flat. The rose and the lotus are the same routine with
   different numbers, which is the kit doing its job. */
function addRings(bloom, sp, tinted) {
  sp.rings.forEach((ring, ri) => {
    const geoms = [];
    for (let i = 0; i < ring.count; i++) {
      const g = petalGeometry({
        len: ring.len, wid: ring.wid, curl: ring.curl, cup: ring.cup,
        tip: sp.tip || "round"
      });
      /* every ring is turned half a step off the one inside it, so petals
         sit in the gaps rather than stacking into columns */
      const off = (ri % 2) * (Math.PI / ring.count);
      g.applyMatrix4(new THREE.Matrix4()
        .makeTranslation(0, ring.y || 0, 0)
        .multiply(new THREE.Matrix4().makeRotationY((i / ring.count) * Math.PI * 2 + off))
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(ring.pitch))));
      geoms.push(g);
    }
    bloom.add(mesh(mergeGeometries(geoms), tinted(ring.light || 0)));
  });
}

/* ---------------------------------------------------------- helpers */

function flatMat(h, s, l) {
  const m = new THREE.MeshLambertMaterial({ flatShading: true, side: THREE.DoubleSide });
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
function fromPositions(pos) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
/* `BufferGeometryUtils` lives in three's examples rather than the core, and
   the whole point of vendoring one file is not to chase a second one. */
export function mergeGeometries(list) {
  let n = 0;
  const flat = list.map(g => (g.index ? g.toNonIndexed() : g));
  flat.forEach(g => { n += g.attributes.position.count; });
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  let o = 0;
  flat.forEach(g => {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
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
