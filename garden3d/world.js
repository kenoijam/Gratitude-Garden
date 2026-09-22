/* =========================================================================
   world.js  -  the light, the sky, the ground and the life in it

   Everything here is shared by BOTH scenes, for the same reason `growth.js`
   is: two copies of a look drift within a session, and this project already
   knows what that costs.

   The brief was that the plot read as a place rather than as objects on a
   coloured background. Four things do that, and none of them is the flowers:
   the light is late afternoon rather than noon, the sky is graded and has
   hills in it, the ground is not one flat disc, and there is something alive
   in the air.
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";

/* one seeded generator, so a reload gives the same world rather than a new
   one. The 2D version makes the same choice for its butterflies. */
function rnd(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const hsl = (h, s, l) => new THREE.Color().setHSL(h / 360, s / 100, l / 100);

/* ------------------------------------------------------------------ sky */
export function skyTexture() {
  /* LATE AFTERNOON, so it is warm at the horizon and cool overhead. A flat
     pastel fill has no up in it, and a scene with no up reads as a sticker. */
  const c = document.createElement("canvas");
  c.width = 4; c.height = 128;
  const g = c.getContext("2d").createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0.00, "#a9dcec");
  g.addColorStop(0.45, "#cfeef0");
  g.addColorStop(0.78, "#eaf3e4");
  g.addColorStop(1.00, "#ffe6c2");
  const ctx = c.getContext("2d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------------------------------------------------------- light */
export function warmLight(scene) {
  /* A key light low and gold, a fill that is cool so the shadows go blue
     rather than grey, and a third weak light from behind to keep the far
     side of a bloom from going flat. Noon from straight above was what made
     the first version read as a diagram. */
  const hemi = new THREE.HemisphereLight(0xdcf0ff, 0xa8dfc8, 1.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe2b4, 1.55);
  sun.position.set(6.5, 5.2, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera,
    { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30 });
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0xbfe4ff, 0.3);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  return { sun, hemi, rim };
}

/* --------------------------------------------------------------- ground
   AN ISLAND, NOT A PLAIN, and that was the fix for the whole look. At this
   camera angle a ground plane that runs past the frame fills every pixel,
   so the graded sky was never on screen and the hills read as slabs lying on
   a lawn. A finite island has an EDGE, and past the edge is sky. It is also
   the reference the whole direction came from, which the first attempt had
   quietly dropped in favour of a field. */
export function buildGround(scene, { radius = 5, seed = 7 } = {}) {
  const group = new THREE.Group();
  scene.add(group);
  const r = rnd(seed);
  /* HOW BIG THE ISLAND IS decides whether its edge is ever on screen. At
     2.1 times the plot it was 18 units across against a frame that sees
     about 15, so it filled every pixel and the sky never appeared. */
  const R = radius * 1.7;

  /* THE PLOT ITSELF STAYS FLAT. Everything is planted on it at y 0, so a
     bumpy surface would leave flowers hanging in the air or buried; the
     undulation belongs to the land AROUND it. */
  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 56),
    /* the SAME tone as the land around it, or the plot reads as a lighter
       disc pasted onto a field. What marks the garden is what is planted on
       it, not a ring of different grass. */
    new THREE.MeshLambertMaterial({ color: hsl(119, 36, 72) })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  group.add(grass);

  /* the land it sits in, gently uneven, with its colour carried in the
     vertices so one mesh holds the whole variation */
  const farGeo = new THREE.CircleGeometry(R, 72);
  const pos = farGeo.attributes.position;
  const col = [];
  const base = hsl(119, 36, 72);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const d = Math.hypot(x, y);
    /* SHALLOW. Every facet the displacement tilts turns away from a low sun,
       so a landscape that looks gentle from above goes muddy at this angle. */
    const bump = Math.sin(x * 0.5 + seed) * Math.cos(y * 0.44 - seed) * 0.34
               + Math.sin(d * 0.55) * 0.18;
    const k = Math.min(1, Math.max(0, (d - radius) / (R - radius)));
    /* and it drops away at the rim, so the island rounds off rather than
       ending on a flat cut */
    pos.setZ(i, bump * k - 0.02 - Math.pow(k, 3) * 0.5);
    const c = base.clone().offsetHSL(0, 0, (r() - 0.5) * 0.04 - k * 0.015);
    col.push(c.r, c.g, c.b);
  }
  farGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  farGeo.computeVertexNormals();
  const far = new THREE.Mesh(farGeo,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  far.rotation.x = -Math.PI / 2;
  far.position.y = -0.03;
  far.receiveShadow = true;
  group.add(far);

  /* the soil the island is standing on, tapered so it reads as a piece of
     ground lifted out rather than as a cylinder */
  const side = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.72, 1.5, 48, 1, true),
    new THREE.MeshLambertMaterial({ color: hsl(27, 32, 44), flatShading: true,
                                    side: THREE.DoubleSide })
  );
  side.position.y = -1.28;
  group.add(side);
  const under = new THREE.Mesh(
    new THREE.CircleGeometry(R * 0.72, 36),
    new THREE.MeshLambertMaterial({ color: hsl(27, 28, 34) })
  );
  under.rotation.x = Math.PI / 2;
  under.position.y = -2.03;
  group.add(under);

  /* TUFTS, which are what stop the plot reading as painted lino. They are
     three flat blades each, scattered just outside the planting rings and
     merged into ONE mesh, so ninety of them cost one draw call. */
  const tri = [];
  for (let i = 0; i < 110; i++) {
    const a = r() * Math.PI * 2;
    const d = radius * (0.5 + r() * 0.62) + r() * 1.8;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    for (let b = 0; b < 3; b++) {
      const w = 0.02 + r() * 0.014, h = 0.07 + r() * 0.08;
      const lean = (r() - 0.5) * 0.5;
      const bx = x + (r() - 0.5) * 0.16, bz = z + (r() - 0.5) * 0.16;
      tri.push(bx - w, 0, bz, bx + w, 0, bz, bx + lean * h, h, bz + lean * h);
    }
  }
  const tuftGeo = new THREE.BufferGeometry();
  tuftGeo.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  tuftGeo.computeVertexNormals();
  const tufts = new THREE.Mesh(tuftGeo, new THREE.MeshLambertMaterial({
    color: hsl(122, 36, 62), side: THREE.DoubleSide, flatShading: true
  }));
  group.add(tufts);

  return { group, grass, far, tufts, R };
}

/* ---------------------------------------------------------------- hills */
export function buildHills(scene, { radius = 5, seed = 3 } = {}) {
  /* A RING of them ON THE ISLAND, not a backdrop, because the camera turns
     to four corners and a painted horizon would only work from one. They
     sit on the far half of the island, which is what gives the flat plot a
     skyline to stand against. */
  const r = rnd(seed);
  const R = radius * 1.7;
  const tones = [hsl(158, 30, 66), hsl(150, 27, 60), hsl(142, 25, 55)];
  const group = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + r() * 0.35;
    /* ON THE RIM, and SMALL. Big mounds at two thirds of the island turned
       the whole thing into a crater with a garden at the bottom of it. */
    const d = R * (0.97 + r() * 0.13);
    const h = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshLambertMaterial({ color: tones[i % 3], flatShading: true })
    );
    h.position.set(Math.cos(a) * d, -0.5 - r() * 0.25, Math.sin(a) * d);
    h.scale.set(0.95 + r() * 1.0, 0.6 + r() * 0.55, 0.95 + r() * 1.0);
    h.castShadow = true;
    h.receiveShadow = true;
    group.add(h);
  }
  scene.add(group);
  return group;
}

/* ----------------------------------------------------------------- life
   The 2D project has `garden-life.js` doing exactly this on a canvas, and
   its rules were learned the hard way, so they are kept: everything is
   slow, the populations are small, butterflies move on two sines of
   unrelated periods, their wings never shut completely, and the sky is
   empty most of the time. */
export function createLife(scene, { radius = 5, seed = 11 } = {}) {
  const r = rnd(seed);
  const group = new THREE.Group();
  scene.add(group);

  /* --- motes. A sparse drift of light, not a snowstorm. */
  const N = 70;
  const pts = [];
  const seeds = [];
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, d = r() * (radius + 3);
    pts.push(Math.cos(a) * d, r() * 3.2, Math.sin(a) * d);
    seeds.push(r());
  }
  const dot = document.createElement("canvas");
  dot.width = dot.height = 32;
  const dc = dot.getContext("2d");
  const grad = dc.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,252,235,1)");
  grad.addColorStop(0.4, "rgba(255,246,214,0.5)");
  grad.addColorStop(1, "rgba(255,246,214,0)");
  dc.fillStyle = grad;
  dc.fillRect(0, 0, 32, 32);
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    size: 0.11, map: new THREE.CanvasTexture(dot), transparent: true,
    depthWrite: false, opacity: 0.85, blending: THREE.AdditiveBlending
  }));
  group.add(motes);

  /* --- butterflies */
  const wingMat = new THREE.MeshLambertMaterial({
    color: hsl(42, 84, 74), side: THREE.DoubleSide, flatShading: true
  });
  const flies = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.quadraticCurveTo(0.16, 0.13, 0.2, -0.02);
    shape.quadraticCurveTo(0.14, -0.11, 0, 0);
    for (const side of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), wingMat.clone());
      w.material.color = hsl(40 + i * 14, 80, 72 + i * 4);
      w.scale.x = side;
      w.userData.side = side;
      b.add(w);
    }
    b.userData = {
      home: new THREE.Vector3((r() - 0.5) * radius * 1.5, 0.7 + r() * 0.8,
                              (r() - 0.5) * radius * 1.5),
      ax: 0.9 + r() * 0.6, az: 0.62 + r() * 0.5, ay: 0.3 + r() * 0.2,
      px: 7 + r() * 4, pz: 9 + r() * 5, py: 3.4 + r() * 2, off: r() * 10
    };
    group.add(b);
    flies.push(b);
  }

  /* --- birds, one skein that crosses and then leaves the sky alone */
  const birds = new THREE.Group();
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x4d6f70, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const v = new THREE.Shape();
    v.moveTo(-0.16, 0); v.lineTo(0, 0.07); v.lineTo(0.16, 0);
    v.lineTo(0, 0.02); v.lineTo(-0.16, 0);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(v), birdMat);
    m.position.set(-i * 0.42 - r() * 0.2, (r() - 0.5) * 0.5, i * 0.3 + r() * 0.2);
    m.rotation.x = -Math.PI / 2.4;
    birds.add(m);
  }
  birds.position.y = 6;
  group.add(birds);

  const CROSS = 30, GAP = 18;
  function update(nowMs) {
    const t = nowMs / 1000;
    /* motes rise slowly and wrap, and they are in WORLD space so they read
       as air in the garden rather than as dirt on the lens */
    const p = moteGeo.attributes.position;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      let y = p.getY(i) + (0.05 + s * 0.06) * 0.016;
      if (y > 3.4) y = 0.1;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * (0.2 + s * 0.2) + s * 9) * 0.0016);
    }
    p.needsUpdate = true;

    flies.forEach(b => {
      const u = b.userData;
      const x = u.home.x + Math.sin(t / u.px * 6 + u.off) * u.ax
                         + Math.sin(t / (u.px * 0.37) + u.off) * u.ax * 0.3;
      const z = u.home.z + Math.cos(t / u.pz * 6 + u.off) * u.az
                         + Math.sin(t / (u.pz * 0.41) + u.off) * u.az * 0.3;
      const y = u.home.y + Math.sin(t / u.py * 6 + u.off * 2) * u.ay;
      /* the heading comes from where it is ABOUT to be, so a turn reads as
         a turn rather than as a slide. Straight out of the 2D version. */
      const ax = u.home.x + Math.sin((t + 0.18) / u.px * 6 + u.off) * u.ax;
      const az = u.home.z + Math.cos((t + 0.18) / u.pz * 6 + u.off) * u.az;
      b.position.set(x, y, z);
      b.rotation.y = Math.atan2(ax - x, az - z);
      /* never fully shut: edge on for a frame and the butterfly vanishes */
      const open = 0.26 + 0.74 * (0.5 + 0.5 * Math.sin(t * 7 + u.off * 3));
      b.children.forEach(w => { w.rotation.y = w.userData.side * open * 1.1; });
    });

    const cycle = (t % (CROSS + GAP));
    birds.visible = cycle < CROSS;
    if (birds.visible) {
      const k = cycle / CROSS;
      birds.position.set(-18 + k * 36, 5.6 + Math.sin(k * Math.PI) * 0.9, -6 + k * 3);
      birds.children.forEach((m, i) => {
        m.rotation.z = Math.sin(t * 4 + i) * 0.3;
      });
    }
  }
  return { group, update };
}

/* One call sets up a whole scene's look, so the two pages cannot drift. */
export function dressScene(scene, opts = {}) {
  const sky = skyTexture();
  /* THE FOG STARTS BEYOND THE GARDEN. The camera stands sixteen units out,
     so a near plane of 16 put haze over the flowers themselves and washed
     the whole scene grey. It belongs on the rim and the hills only. */
  const fog = new THREE.Fog(0xe4f2ea, 23, 41);
  scene.background = sky;
  scene.fog = fog;
  const lights = warmLight(scene);
  const ground = buildGround(scene, opts);
  const hills = buildHills(scene, opts);
  const life = createLife(scene, opts);
  return { lights, ground, hills, life, sky, fog };
}
