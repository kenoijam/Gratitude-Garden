/* =========================================================================
   spike.js  -  the go / no go test for the 3D direction

   One plot, five species, an avatar for scale, an orthographic camera at a
   fixed isometric angle. It exists to answer ONE question before any more
   time goes into this: at the distance the game would actually be played
   at, does each species read as itself?

   The controls are the test, not decoration:
     distance     the same garden at three camera widths
     silhouette   every colour removed. The 2D version settled the
                  chrysanthemum this way, and colour hides a weak shape
     turn         four snap angles, since a fixed camera has to work from
                  all of them
     hue          the person picks the colour in this project, so a species
                  has to survive being the wrong colour
     replant      the web version's own growth timings, 3400ms rising and
                  1700ms opening, to see whether they still feel right in
                  space
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";
import { buildFlower, SPECIES3D } from "./flower-kit.js";
import { buildAvatar, KEEPSAKES, SLOTS, SKINS, HAIRS, SHAPES, keepsakeOf, DEFAULT_LOOK }
  from "./avatar-kit.js";

/* the bed holds the six that grow in soil. The sakura is a tree and the
   lotus grows on water, so neither is planted in a row with the rest. */
const ORDER = ["daisy", "tulip", "lily", "sunflower", "lavender", "rose"];

/* The web version's numbers, unchanged. */
const GROW_RISE = 3400;
const GROW_OPEN = 1700;
const growEase = t => 1 - Math.pow(1 - t, 3);
const smooth = t => t * t * (3 - 2 * t);

const VIEWS = { close: 2.0, garden: 7.8, wide: 13 };

const state = { view: "garden", turn: 0, silhouette: false, hueShift: 0, planted: 0, dress: false };

const scene = new THREE.Scene();
scene.background = new THREE.Color("#cfeef0");          /* the gardens' sky */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("stage").appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

/* Soft and warm, one key light and a sky fill. Nothing here needs a rig. */
scene.add(new THREE.HemisphereLight(0xdff6f4, 0x8fcfbe, 1.15));
const sun = new THREE.DirectionalLight(0xfff4d9, 1.55);
sun.position.set(3.4, 8.2, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 3;
sun.shadow.bias = -0.0006;
const sc = sun.shadow.camera;
sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 0.5; sc.far = 20;
scene.add(sun);

/* ---------------------------------------------------------- the plot */
const ground = new THREE.Group();
scene.add(ground);

const grass = new THREE.Mesh(
  new THREE.CircleGeometry(4.3, 44),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(112 / 360, 0.44, 0.71) })
);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
ground.add(grass);

const bed = new THREE.Mesh(
  /* deep enough to hold the specimens AND leave a free strip along the front.
   With the bed exactly full, choosing where to plant was a puzzle rather
   than a choice, which is the opposite of what this is testing. */
  new THREE.BoxGeometry(3.35, 0.14, 1.9),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(26 / 360, 0.33, 0.47), flatShading: true })
);
bed.position.y = 0.07;
bed.castShadow = true;
bed.receiveShadow = true;
bed.position.x = -0.4;
ground.add(bed);

/* A POND, because the lotus needed one. It is a test of the plot as much as
   of the flower: a garden made only of soil has one kind of place in it. */
/* one place, so the water, its bank, what may be planted in it and where the
   avatar may stand all read the same numbers */
const POND = { x: 2.6, z: 0.5, r: 1.16 };
const pond = new THREE.Mesh(
  new THREE.CircleGeometry(POND.r, 36),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(0.53, 0.44, 0.62) })
);
pond.rotation.x = -Math.PI / 2;
pond.position.set(POND.x, 0.015, POND.z);
pond.receiveShadow = true;
ground.add(pond);
/* a bank, so the water sits IN the ground rather than on it */
const bank = new THREE.Mesh(
  new THREE.RingGeometry(POND.r - 0.02, POND.r + 0.13, 36),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(0.09, 0.3, 0.5) })
);
bank.rotation.x = -Math.PI / 2;
bank.position.set(POND.x, 0.012, POND.z);
bank.receiveShadow = true;
ground.add(bank);

/* THE AVATAR IS AN OUTER GROUP WITH A BUILT BODY INSIDE IT, and that split
   is load bearing: the walk, the bob and the crouch all move the outer group,
   so changing clothes mid stride cannot interrupt any of them. */
const avatar = new THREE.Group();
avatar.position.set(-1.05, 0, 1.55);
avatar.rotation.y = -0.5;
scene.add(avatar);

const look = { ...DEFAULT_LOOK };
let avatarBody = null;
function redress() {
  if (avatarBody) { avatar.remove(avatarBody); }
  avatarBody = buildAvatar(look);
  avatar.add(avatarBody);
  if (state.silhouette) setSilhouette(true);   /* a new body needs dressing twice */
}

/* ---------------------------------------------------------- the flowers */
const flowers = [];
function plantRow(z, hueOffsets) {
  ORDER.forEach((id, i) => {
    const sp = SPECIES3D[id];
    const hue = (sp.hue + (hueOffsets[i] || 0) + 360) % 360;
    const f = buildFlower(id, { hue });
    f.position.set(-1.8 + i * 0.55, 0.14, z);
    f.userData.baseHue = hue;
    f.userData.species = id;
    f.userData.born = -1;
    scene.add(f);
    flowers.push(f);
  });
}
/* the front row in each species' own colour, the back row shifted, because
   a species that only reads in its own hue does not really read */
plantRow(-0.12, [0, 0, 0, 0, 0, 0]);
plantRow(-0.64, [40, -55, 120, 190, -80, 150]);

/* the two that are not bed flowers, each standing where it belongs */
function plantOne(id, x, z, y = 0) {
  const sp = SPECIES3D[id];
  const f = buildFlower(id, { hue: sp.hue });
  f.position.set(x, y, z);
  f.userData.baseHue = sp.hue;
  f.userData.species = id;
  f.userData.born = -1;
  scene.add(f);
  flowers.push(f);
  return f;
}
plantOne("sakura", -2.15, -1.05);
plantOne("lotus", POND.x - 0.42, POND.z - 0.3, 0.02);

redress();

/* ---------------------------------------------------------- camera */
function frame() {
  /* THE WARDROBE BRINGS THE CAMERA TO THE AVATAR, which is what a customiser
     does: choosing a hat while the wearer is thirty pixels tall across the
     garden is choosing blind. The angle never changes, only the target and
     the width, so it is the same world seen closer rather than a second
     camera with its own rules. */
  const w = state.dress ? 2.9 : VIEWS[state.view];
  const a = window.innerWidth / window.innerHeight;
  camera.left = -w / 2; camera.right = w / 2;
  camera.top = w / (2 * a); camera.bottom = -w / (2 * a);
  const ang = Math.PI / 4 + state.turn * (Math.PI / 2);
  const d = 12;
  const t = state.dress
    ? new THREE.Vector3(avatar.position.x, 0.86, avatar.position.z)
    : new THREE.Vector3(0.3, 0.45, 0.1);
  /* the wardrobe also drops the camera's PITCH. The garden is read from
     above, where a head is mostly hair, and choosing a face from up there is
     choosing something you cannot see. */
  camera.position.set(t.x + Math.cos(ang) * d, t.y + d * (state.dress ? 0.34 : 0.82),
                      t.z + Math.sin(ang) * d);
  camera.lookAt(t);
  camera.updateProjectionMatrix();
}
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  frame();
}
window.addEventListener("resize", resize);
resize();

/* ---------------------------------------------------------- silhouette */
const DARK = new THREE.MeshBasicMaterial({ color: 0x13413f, side: THREE.DoubleSide });
const PALE = new THREE.MeshBasicMaterial({ color: 0xf3f8f4 });
function setSilhouette(on) {
  state.silhouette = on;
  scene.traverse(o => {
    if (!o.isMesh) return;
    if (on) {
      if (!o.userData._mat) o.userData._mat = o.material;
      o.material = (o === grass || o === bed || o === pond || o === bank) ? PALE : DARK;
    } else if (o.userData._mat) {
      o.material = o.userData._mat;
    }
  });
  scene.background = new THREE.Color(on ? "#f3f8f4" : "#cfeef0");
}

/* ---------------------------------------------------------- growth */
function replant() {
  const now = performance.now();
  flowers.forEach((f, i) => { f.userData.born = now + i * 220; });
}
function growth(now) {
  flowers.forEach(f => {
    const born = f.userData.born;
    const blooms = f.userData.blooms || [];
    const set = v => blooms.forEach(b => b.scale.setScalar(v));
    if (born < 0) { f.scale.set(1, 1, 1); set(1); return; }
    const e = now - born;
    if (e < 0) { f.scale.set(1, 0.001, 1); set(0.18); return; }
    const rise = growEase(Math.min(1, e / GROW_RISE));
    f.scale.set(1, Math.max(0.001, rise), 1);
    const o = (e - (GROW_RISE - GROW_OPEN)) / GROW_OPEN;
    set(0.18 + 0.82 * smooth(Math.min(1, Math.max(0, o))));
  });
}


/* =========================================================================
   THE LOOP: reflect, choose a spot, watch it grow

   The species test above answers "can you tell them apart". This answers the
   question that comes after it, which is whether PLANTING one feels calm.
   Three things make it a loop rather than a placement tool: the same three
   questions the web version asks, a spot the person picks in a world that
   has rules about where things grow, and an avatar that WALKS there.
   ========================================================================= */

/* The web version's own vote: the rating is worth 4, what shaped the day 3,
   and every keyword hit in the sentence 2. With only the two buttons the
   rating would always win and the second question would be decoration, so
   the sentence is what lets the other answers matter. */
const RATING_FLOWER = { 1: "lotus", 2: "lavender", 3: "sakura", 4: "daisy", 5: "sunflower" };
const SHAPER_FLOWER = { people: "rose", work: "lily", rest: "lavender", change: "tulip" };
const KEYWORDS = {
  sunflower: ["happy", "proud", "energy", "sun", "hope", "good news"],
  rose:      ["love", "family", "friend", "mum", "dad", "partner", "together"],
  daisy:     ["small", "simple", "coffee", "walk", "smile", "quiet joy"],
  tulip:     ["new", "change", "start", "moved", "first", "again"],
  lily:      ["rest", "sleep", "slow", "peace", "still"],
  lavender:  ["safe", "home", "warm", "breathe", "held"],
  sakura:    ["remember", "memory", "thinking", "past", "present", "noticed"],
  lotus:     ["hard", "through", "survived", "difficult", "strong", "kept going"]
};
function chooseSpecies(rating, shaper, note) {
  const votes = {};
  Object.keys(SPECIES3D).forEach(id => { votes[id] = 0; });
  votes[RATING_FLOWER[rating]] += 4;
  votes[SHAPER_FLOWER[shaper]] += 3;
  const text = (note || "").toLowerCase();
  if (text) {
    /* iterate the VOTES rather than the keyword table, the way the web
       version does, so a species that is not in play cannot be voted for */
    Object.keys(votes).forEach(id => {
      (KEYWORDS[id] || []).forEach(k => { if (text.includes(k)) votes[id] += 2; });
    });
  }
  return Object.keys(votes).reduce((a, b) => (votes[b] > votes[a] ? b : a));
}

/* ---------------------------------------------------------- where it may go
   A lotus needs the water and a tree needs room, so the plot has three kinds
   of place in it. This is the rule the 2D version had no way to express, and
   it is most of what makes the garden read as somewhere rather than as a
   canvas. */
const PLOT = {
  lotus:  { on: "pond",  gap: 0.55, stand: 1.25, y: 0.02, say: "A lotus opens on the water." },
  sakura: { on: "grass", gap: 1.30, stand: 0.95, y: 0,    say: "A sakura is a tree, so it needs open ground." },
  bed:    { on: "bed",   gap: 0.30, stand: 0.62, y: 0.14, say: "Pick a place in the bed." }
};
const plotFor = id => PLOT[id] || PLOT.bed;

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();

/* the ring under the pointer while a spot is being chosen */
const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.16, 0.2, 28),
  new THREE.MeshBasicMaterial({ color: 0x26a69a, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
);
marker.rotation.x = -Math.PI / 2;
marker.visible = false;
scene.add(marker);

const loop = { picking: false, species: null, spot: null, walk: null };

function surfaceAt(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects([bed, pond, grass], false)[0];
  if (!hit) return null;
  const on = hit.object === bed ? "bed" : hit.object === pond ? "pond" : "grass";
  return { on, point: hit.point };
}

/* A spot is refused for exactly two reasons: the wrong KIND of ground, and
   standing on something already growing. Both are said in words rather than
   left to a marker that simply will not turn green. */
function judge(spot, id) {
  if (!spot) return { ok: false, why: "" };
  const rule = plotFor(id);
  if (spot.on !== rule.on) return { ok: false, why: rule.say };
  if (rule.on === "pond" && Math.hypot(spot.point.x - POND.x, spot.point.z - POND.z) > POND.r - 0.34) {
    return { ok: false, why: "Out in the open water, clear of the bank." };
  }
  for (const f of flowers) {
    const d = Math.hypot(f.position.x - spot.point.x, f.position.z - spot.point.z);
    /* the AVERAGE of the two, not the larger. Taking the larger made a tree
       demand its own 1.3 from every daisy in the bed beside it, which left
       the open grass unplantable for the one species that has to go there. */
    const near = (rule.gap + plotFor(f.userData.species).gap) / 2;
    if (d < near) return { ok: false, why: "Too close to something already growing." };
  }
  return { ok: true, why: "Plant it here." };
}

function showHint(text) {
  const el = document.getElementById("hint");
  el.innerHTML = text ? text : "";
  el.classList.toggle("show", !!text);
}

function startPicking(id) {
  if (state.dress) setDressing(false);
  loop.picking = true;
  loop.species = id;
  marker.visible = false;
  const rule = plotFor(id);
  showHint("Choose a spot. <span>" + rule.say + " Escape to change your mind.</span>");
}
function stopPicking() {
  loop.picking = false;
  marker.visible = false;
  showHint("");
  document.getElementById("plant").disabled = false;
}

renderer.domElement.addEventListener("pointermove", ev => {
  if (!loop.picking) return;
  const spot = surfaceAt(ev);
  const v = judge(spot, loop.species);
  marker.visible = !!spot;
  if (!spot) return;
  const rule = plotFor(loop.species);
  marker.position.set(spot.point.x, (v.ok ? rule.y : spot.point.y) + 0.012, spot.point.z);
  marker.material.color.setHex(v.ok ? 0x26a69a : 0xb98d86);
  /* the ring is that species' own footprint, so the spacing rule is visible
     rather than only enforced: a tree asks for a lot more room than a daisy */
  marker.scale.setScalar(Math.max(1, rule.gap * 2.4));
});

renderer.domElement.addEventListener("click", ev => {
  if (!loop.picking) return;
  const spot = surfaceAt(ev);
  const v = judge(spot, loop.species);
  if (!v.ok) { showHint(v.why ? "<span>" + v.why + "</span>" : ""); return; }
  plantAt(loop.species, spot.point);
});
window.addEventListener("keydown", e => {
  if (e.key === "Escape" && loop.picking) stopPicking();
});

/* ---------------------------------------------------------- walk and plant */
const WALK_SPEED = 1.7;                 /* units a second, an unhurried pace */
function plantAt(id, point) {
  const rule = plotFor(id);
  const from = avatar.position.clone();
  const to = new THREE.Vector3(point.x, 0, point.z);
  /* stop SHORT of the spot and face it, or the avatar ends up standing in
     the flower it has just planted */
  /* and stop on the FAR side of it from the camera. Stopping short along the
     walking line put the avatar between the camera and the flower it had
     just planted, which hid the one thing the person was waiting to see. */
  const ang = Math.PI / 4 + state.turn * (Math.PI / 2);
  const toward = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)).normalize();
  const stand = to.clone().sub(toward.clone().multiplyScalar(rule.stand));
  if (stand.length() > 3.9) stand.setLength(3.9);         /* stay on the grass */
  /* and out of the water, which the far side of a lotus otherwise is */
  const fromPond = new THREE.Vector2(stand.x - POND.x, stand.z - POND.z);
  if (fromPond.length() < POND.r + 0.18) {
    fromPond.setLength(POND.r + 0.18);
    stand.set(POND.x + fromPond.x, 0, POND.z + fromPond.y);
  }
  const travel = Math.max(0.25, from.distanceTo(stand)) / WALK_SPEED;
  /* facing the flower, which from here is also facing the camera */
  const face = Math.atan2(toward.x, toward.z);

  const now = performance.now();
  const f = buildFlower(id, { hue: SPECIES3D[id].hue });
  f.position.set(point.x, rule.y, point.z);
  f.userData.baseHue = SPECIES3D[id].hue;
  f.userData.species = id;
  /* born in the FUTURE, so it waits in the ground until somebody is there to
     plant it. growth() already draws a flower whose moment has not come. */
  f.userData.born = now + travel * 1000;
  if (state.silhouette) f.traverse(o => { if (o.isMesh) { o.userData._mat = o.material; o.material = DARK; } });
  scene.add(f);
  flowers.push(f);

  loop.walk = { from, to: stand, face, t0: now, dur: travel * 1000 };
  /* the closing line, timed to the moment the bloom finishes opening. A loop
     with no end just stops, and this one is meant to feel finished. */
  loop.finish = { at: f.userData.born + GROW_RISE, id, said: false, kept: earn(id) };
  stopPicking();
  state.planted++;
}

function walk(now) {
  const w = loop.walk;
  if (!w) return;
  const t = Math.min(1, (now - w.t0) / w.dur);
  const e = smooth(t);
  avatar.position.lerpVectors(w.from, w.to, e);
  avatar.rotation.y = w.face;
  /* a small bob while moving and a crouch on arrival: without them the
     avatar slides like a chess piece and the planting has no moment in it */
  const moving = t < 1;
  avatar.position.y = moving ? Math.abs(Math.sin(t * w.dur / 90)) * 0.035 : 0;
  if (!moving) {
    const since = now - (w.t0 + w.dur);
    avatar.scale.y = since < 700 ? 1 - 0.1 * Math.sin((since / 700) * Math.PI) : 1;
    if (since > 700) { avatar.scale.y = 1; loop.walk = null; }
  }
}

/* ---------------------------------------------------------- loop */
function tick(now) {
  growth(now);
  walk(now);
  const fin = loop.finish;
  if (fin && !fin.said && now > fin.at) {
    fin.said = true;
    const sp = SPECIES3D[fin.id];
    showHint(sp.name + " planted. <span>" + sp.meaning +
      (fin.kept ? ". You kept the " + KEEPSAKES[fin.kept].name.toLowerCase() + "." : "") + "</span>");
    setTimeout(() => { if (!loop.picking) showHint(""); }, 4500);
  }
  /* the gardens' sway, kept small and per flower so the row does not lean
     as one piece */
  flowers.forEach((f, i) => {
    f.rotation.z = Math.sin(now / 1400 + i * 1.7) * 0.02;
  });
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------------------------------------------------------- the controls
   Plain HTML over the canvas, which is the architecture the real thing
   would use as well: never build a text field in WebGL. */
document.querySelectorAll("[data-view]").forEach(b => {
  b.addEventListener("click", () => {
    state.view = b.dataset.view;
    document.querySelectorAll("[data-view]").forEach(x => x.classList.toggle("on", x === b));
    frame();
  });
});
document.getElementById("turn").addEventListener("click", () => {
  state.turn = (state.turn + 1) % 4;
  frame();
});
const silBtn = document.getElementById("sil");
silBtn.addEventListener("click", () => {
  setSilhouette(!state.silhouette);
  silBtn.classList.toggle("on", state.silhouette);
  silBtn.textContent = state.silhouette ? "Colour" : "Silhouette";
});
document.getElementById("hue").addEventListener("input", e => {
  state.hueShift = Number(e.target.value);
  flowers.forEach(f => {
    const h = ((f.userData.baseHue + state.hueShift) % 360 + 360) % 360;
    /* every registered petal material moves together, each keeping its own
       lightness offset, which is what holds a rose's rings apart */
    (f.userData.tint || []).forEach(t => {
      t.mat.color.setHSL(h / 360, t.sat / 100, Math.min(96, Math.max(18, t.light)) / 100);
    });
  });
});
document.getElementById("replant").addEventListener("click", replant);

/* ---------------------------------------------------------- the reflection */
const answers = { rating: 0, shaper: "" };
const goBtn = document.getElementById("go");
document.querySelectorAll("#form .q[data-q]").forEach(q => {
  q.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      q.querySelectorAll("button").forEach(x => x.classList.toggle("pick", x === b));
      answers[q.dataset.q] = q.dataset.q === "rating" ? Number(b.dataset.v) : b.dataset.v;
      goBtn.disabled = !(answers.rating && answers.shaper);
    });
  });
});

function openReflect() {
  document.getElementById("form").style.display = "";
  document.getElementById("result").classList.remove("show");
  document.getElementById("reflect").classList.add("show");
  document.getElementById("plant").disabled = true;
}
function closeReflect() {
  document.getElementById("reflect").classList.remove("show");
}
document.getElementById("plant").addEventListener("click", openReflect);

goBtn.addEventListener("click", () => {
  const id = chooseSpecies(answers.rating, answers.shaper, document.getElementById("note").value);
  const sp = SPECIES3D[id];
  document.getElementById("rName").textContent = sp.name;
  document.getElementById("rMeaning").textContent = sp.meaning;
  document.getElementById("rDot").style.background =
    "hsl(" + sp.hue + " " + sp.sat + "% " + sp.light + "%)";
  document.getElementById("form").style.display = "none";
  document.getElementById("result").classList.add("show");
  loop.species = id;
});
document.getElementById("place").addEventListener("click", () => {
  closeReflect();
  startPicking(loop.species);
});

/* =========================================================================
   WHAT REFLECTING GIVES YOU

   The wardrobe is filled by PLANTING. Every keepsake belongs to one species,
   so the only way to get the sun hat is to have had a day that came out a
   sunflower. Nothing is bought and nothing expires, which is the difference
   between a reward and a record: at the end of a month the avatar is wearing
   an account of what the person noticed.
   ========================================================================= */
const earned = new Set();
function earn(species) {
  const k = keepsakeOf(species);
  if (!k || earned.has(k)) return null;
  earned.add(k);
  /* worn straight away IF that slot is empty, never over something chosen.
     A gift that silently takes off what you were wearing is not a gift. */
  const slot = KEEPSAKES[k].slot;
  if (!look[slot]) { look[slot] = k; redress(); }
  paintWardrobe();
  return k;
}

const wardrobe = document.getElementById("wardrobe");
function row(label) {
  const d = document.createElement("div");
  d.className = "q";
  d.innerHTML = "<b>" + label + "</b>";
  const opts = document.createElement("div");
  opts.className = "opts";
  d.appendChild(opts);
  return { d, opts };
}
function dot(colour, on, click) {
  const b = document.createElement("button");
  b.className = "swatch" + (on ? " pick" : "");
  b.style.background = colour;
  b.addEventListener("click", click);
  return b;
}
function paintWardrobe() {
  if (!wardrobe.classList.contains("show")) return;
  wardrobe.innerHTML = "";
  const h2 = document.createElement("h2");
  h2.textContent = "You";
  const sub = document.createElement("p");
  sub.className = "sub";
  sub.textContent = "Keepsakes come from planting. There is nothing to buy.";
  wardrobe.append(h2, sub);

  const skin = row("Skin");
  SKINS.forEach((c, i) => skin.opts.appendChild(
    dot("#" + c.toString(16).padStart(6, "0"), look.skin === i,
        () => { look.skin = i; redress(); paintWardrobe(); })));
  wardrobe.appendChild(skin.d);

  const hair = row("Hair");
  SHAPES.forEach((name, i) => {
    const b = document.createElement("button");
    b.textContent = name;
    if (look.hair === i) b.className = "pick";
    b.addEventListener("click", () => { look.hair = i; redress(); paintWardrobe(); });
    hair.opts.appendChild(b);
  });
  HAIRS.forEach((c, i) => hair.opts.appendChild(
    dot("#" + c.toString(16).padStart(6, "0"), look.hairCol === i,
        () => { look.hairCol = i; redress(); paintWardrobe(); })));
  wardrobe.appendChild(hair.d);

  const top = row("Clothes");
  const slider = document.createElement("input");
  slider.type = "range"; slider.min = 0; slider.max = 359; slider.value = look.top;
  slider.className = "wide";
  slider.addEventListener("input", e => { look.top = Number(e.target.value); redress(); });
  top.opts.appendChild(slider);
  wardrobe.appendChild(top.d);

  const keep = row("Keepsakes");
  keep.opts.className = "opts tiles";
  Object.keys(KEEPSAKES).forEach(id => {
    const k = KEEPSAKES[id];
    const have = earned.has(id);
    const worn = look[k.slot] === id;
    const b = document.createElement("button");
    b.className = "tile" + (worn ? " pick" : "") + (have ? "" : " locked");
    b.innerHTML = "<b>" + k.name + "</b><span>" +
      (have ? k.note : "Plant a " + SPECIES3D[k.from].name.toLowerCase()) + "</span>";
    b.disabled = !have;
    /* a worn keepsake takes itself off, so the slot is never a trap */
    b.addEventListener("click", () => {
      look[k.slot] = worn ? null : id;
      redress(); paintWardrobe();
    });
    keep.opts.appendChild(b);
  });
  wardrobe.appendChild(keep.d);

  /* a TEST control and it says so. The spike keeps nothing between reloads,
     so without this the wardrobe can only ever be seen by planting eight
     flowers again. It is not part of the design. */
  const all = document.createElement("button");
  all.className = "linky";
  all.textContent = "Unlock everything (testing only)";
  all.addEventListener("click", () => {
    Object.keys(KEEPSAKES).forEach(k => earned.add(k));
    paintWardrobe();
  });
  const done = document.createElement("button");
  done.id = "dressDone";
  done.textContent = "Done";
  done.addEventListener("click", () => setDressing(false));
  wardrobe.append(all, done);
}
function setDressing(on) {
  state.dress = on;
  wardrobe.classList.toggle("show", on);
  document.getElementById("dress").classList.toggle("on", on);
  /* turned to face the camera while being dressed, and left facing that way
     afterwards, since the next thing it does is walk somewhere anyway */
  if (on) {
    const ang = Math.PI / 4 + state.turn * (Math.PI / 2);
    avatar.rotation.y = Math.atan2(Math.cos(ang), Math.sin(ang));
    paintWardrobe();
  }
  frame();
}
document.getElementById("dress").addEventListener("click",
  () => setDressing(!state.dress));
