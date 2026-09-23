/* =========================================================================
   shared-scene.js  -  the shared garden, in 3D, FLOWERS ONLY

   The 2D shared garden is one room a day, keyed on the date, that anybody
   can plant one flower in with a typed name and a sentence. This asks what
   that becomes in a space rather than on a canvas.

   THERE ARE NO AVATARS HERE, and that is the design rather than a saving.
   The personal plot has one person in it who walks around; this has twenty
   strangers who were each here for a minute. Twenty avatars standing about
   in a field would be a lobby. What is left of somebody is their flower,
   which is exactly what the 2D page already says.

   Three things carry over unchanged, so the two versions cannot drift: the
   species kit, the growth timings in `growth.js`, and the rule that all
   text is HTML over the canvas.

   NOTHING HERE IS NETWORKED. The day below is seeded so a shared garden
   can be looked at while there is nobody to share it with. The real thing
   keeps the split the 2D page already has: the living room in p5.party,
   and likes and comments in Supabase.
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";
import { buildFlower, buildTree, SPECIES3D } from "./flower-kit.js";
import { growMs, growFlower } from "./growth.js";
import { dressScene } from "./world.js";

const state = { view: "garden", turn: 0, planted: false };
const VIEWS = { garden: 9.6, wide: 15 };

/* ---------------------------------------------------------- the day
   Fourteen people, in the order they arrived. Names and lines are made up
   for the spike; nothing here is anybody's. */
const DAY = [
  { at: "06:40", who: "Maya",   species: "daisy",     said: "The bus was early and nobody was on it." },
  { at: "07:15", who: "Tomas",  species: "sunflower", said: "My dad rang for no reason at all." },
  { at: "07:52", who: "Rin",    species: "lavender",  said: "Slept through the night for once." },
  { at: "08:30", who: "Adeola", species: "rose",      said: "Twelve years today, still laughing at the same joke." },
  { at: "09:05", who: "Jonas",  species: "tulip",     said: "First morning in the new flat." },
  { at: "10:20", who: "Priya",  species: "lily",      said: "A quiet hour before anyone needed me." },
  { at: "11:36", who: "Ines",   species: "sakura",    said: "Sat under a tree and did not look at my phone." },
  { at: "12:48", who: "Kofi",   species: "lotus",     said: "Got through the thing I had been dreading." },
  { at: "13:30", who: "Elif",   species: "daisy",     said: "Somebody held the door with their elbow." },
  { at: "14:55", who: "Luka",   species: "sunflower", said: "The tomatoes finally turned red." },
  { at: "16:10", who: "Nadia",  species: "lavender",  said: "Rain on the window and nowhere to be." },
  { at: "17:25", who: "Mei",    species: "rose",      said: "My sister sent a photo of the dog." },
  { at: "18:40", who: "Otto",   species: "lily",      said: "Cooked properly instead of standing at the fridge." },
  { at: "19:58", who: "Sam",    species: "tulip",     said: "Asked for help and it was fine." }
];

/* ---------------------------------------------------------- the scene */
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("stage").appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

/* the same light, sky, hills, ground and air as the personal plot. Two
   scenes in one project may not be two looks. */
const world = dressScene(scene, { radius: 4.9, seed: 21, island: 1.32 });

/* bare earth under the tree, which is what says the tree was here first and
   the rings were planted around it */
const bare = new THREE.Mesh(
  new THREE.CircleGeometry(0.95, 26),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(26 / 360, 0.3, 0.5) })
);
bare.rotation.x = -Math.PI / 2;
bare.position.y = 0.008;
bare.receiveShadow = true;
scene.add(bare);

/* ONE TREE, AND EVERYONE PLANTS AROUND IT. A field with no middle reads as
   a grid of strangers; a circle reads as people who turned up to the same
   place. It is the sakura, which is the species whose meaning is being
   present somewhere. */
const tree = buildTree();
tree.scale.setScalar(2.0);
scene.add(tree);

/* ---------------------------------------------------------- the rings
   Radius, how many fit, and a half step turn so no two rings line up along
   the same spoke. A flower's slot is its PLACE IN THE DAY: the first person
   of the morning stands nearest the tree and the last stands at the edge. */
const RINGS = [
  { r: 1.7, n: 8, off: 0.25 },
  { r: 2.55, n: 12, off: 0.0 },
  { r: 3.42, n: 16, off: 0.13 },
  { r: 4.3, n: 20, off: 0.06 }
];
function slotFor(index) {
  let i = index;
  for (const ring of RINGS) {
    if (i < ring.n) {
      const a = ring.off + (i / ring.n) * Math.PI * 2;
      return { x: Math.cos(a) * ring.r, z: Math.sin(a) * ring.r, a };
    }
    i -= ring.n;
  }
  return { x: 0, z: 0, a: 0 };                   /* a full garden, 56 people */
}

const flowers = [];
/* EVERY SPECIES PLANTS THE SAME WAY. This held two exceptions: a sakura was
   a whole tree, so in a ring slot it swallowed its neighbours and had to be
   shrunk to a sapling, and a lotus could not stand on grass, so it brought a
   pool of water the size of its own slot. Both are ordinary stem flowers
   now, and the rule that everybody gets the same amount of room needs no
   special cases to enforce it. */
function plant(entry, index, born) {
  const sp = SPECIES3D[entry.species] || SPECIES3D.daisy;
  /* a few degrees either side of the species' own hue, so a garden holding
     four daisies does not read as one daisy printed four times */
  const hue = (sp.hue + ((index * 37) % 25) - 12 + 360) % 360;
  const spot = slotFor(index);
  const f = buildFlower(entry.species, { hue });
  f.position.set(spot.x, 0, spot.z);
  f.rotation.y = -spot.a;                 /* every bloom faces out of the ring */
  f.userData.entry = entry;
  f.userData.species = entry.species;      /* what the growth pace reads */
  f.userData.born = born;
  f.userData.index = index;
  scene.add(f);
  flowers.push(f);
  return f;
}
DAY.forEach((e, i) => {
  e.likes = 1 + ((i * 7) % 6);
  e.comments = (i * 3) % 4;
  plant(e, i, -1);
});

/* ---------------------------------------------------------- camera */
/* THE VIEW WIDENS AS THE DAY FILLS. The rings are planted outward in the
   order people arrived, so an empty morning is a small garden and a full
   evening is a wide one, and the camera saying so costs nothing. */
function fitted() {
  let r = 1.2;
  flowers.forEach(f => { r = Math.max(r, Math.hypot(f.position.x, f.position.z)); });
  return Math.max(8, Math.min(15, r * 2 + 2.8));
}
function frame() {
  const w = state.view === "garden" ? fitted() : VIEWS.wide;
  const a = window.innerWidth / window.innerHeight;
  camera.left = -w / 2; camera.right = w / 2;
  camera.top = w / (2 * a); camera.bottom = -w / (2 * a);
  const ang = Math.PI / 4 + state.turn * (Math.PI / 2);
  const d = 16;
  /* A LOWER PITCH than the first version's. Looking down at 30 degrees the
     ground fills the frame and there is no horizon in it; at 22 the far rim
     of the island and the sky behind it are both on screen, which is what
     the whole sky and hills pass was for. */
  /* the target is pushed AWAY from the camera, the same as the personal
     plot: a wide window is short in world units, so without it the far rim
     of the island and the sky sit just past the top edge */
  const back = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)).multiplyScalar(-w * 0.05);
  const t = new THREE.Vector3(back.x, 0.7, back.z);
  camera.position.set(t.x + Math.cos(ang) * d, t.y + d * 0.72, t.z + Math.sin(ang) * d);
  camera.lookAt(t);
  camera.updateProjectionMatrix();
}
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  frame();
}
window.addEventListener("resize", resize);
resize();

/* ---------------------------------------------------------- the names
   HTML over the canvas, positioned by projecting the bloom's own world
   point. Painting them into the scene would mean a texture per name, in a
   font the page would have to load twice, unreadable to a screen reader,
   and fighting the camera for legibility at every distance. */
const labels = document.getElementById("labels");
const tags = new Map();
const tmp = new THREE.Vector3();

function topOf(f) {
  const b = (f.userData.blooms || [])[0];
  const v = new THREE.Vector3();
  (b || f).getWorldPosition(v);
  return v.setY(v.y + 0.16);
}
function showTag(f, mine) {
  let el = tags.get(f);
  if (!el) {
    el = document.createElement("div");
    el.className = "tag" + (mine ? " mine" : "");
    el.textContent = mine ? "You" : f.userData.entry.who;
    labels.appendChild(el);
    tags.set(f, el);
  }
  return el;
}
function dropTag(f) {
  const el = tags.get(f);
  if (el) { el.remove(); tags.delete(f); }
}
function placeTags() {
  const r = renderer.domElement.getBoundingClientRect();
  tags.forEach((el, f) => {
    tmp.copy(topOf(f)).project(camera);
    el.style.left = ((tmp.x * 0.5 + 0.5) * r.width) + "px";
    el.style.top = ((-tmp.y * 0.5 + 0.5) * r.height) + "px";
  });
}

/* ---------------------------------------------------------- pointing */
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let mine = null;

function flowerAt(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects(flowers, true)[0];
  if (!hit) return null;
  let o = hit.object;
  while (o && !o.userData.entry) o = o.parent;
  return o || null;
}
renderer.domElement.addEventListener("pointermove", ev => {
  const f = flowerAt(ev);
  if (f === hovered) return;
  /* your own tag never goes away, everyone else's is only there while the
     pointer is on them. Twenty names at once is a field of labels with a
     garden somewhere behind it. */
  if (hovered && hovered !== mine) dropTag(hovered);
  hovered = f;
  if (f && f !== mine) showTag(f, false);
  renderer.domElement.style.cursor = f ? "pointer" : "default";
});
renderer.domElement.addEventListener("click", ev => {
  const f = flowerAt(ev);
  if (f) openPeek(f); else closePeek();
});

/* ---------------------------------------------------------- what it said */
const peek = document.getElementById("peek");
let peeked = null;
function openPeek(f) {
  peeked = f;
  const e = f.userData.entry;
  const sp = SPECIES3D[e.species];
  peek.innerHTML = "";
  const h = document.createElement("h2");
  h.textContent = e.who;
  const when = document.createElement("p");
  when.className = "when";
  when.textContent = e.at + ", " + sp.name.toLowerCase() + ", " + sp.meaning.toLowerCase();
  const said = document.createElement("p");
  said.className = "said";
  said.textContent = "“" + e.said + "”";
  const social = document.createElement("div");
  social.className = "social";
  const like = document.createElement("button");
  const paintLike = () => {
    like.textContent = (e.liked ? "Liked " : "Like ") + e.likes;
    like.classList.toggle("liked", !!e.liked);
  };
  /* one like per person is a DATABASE rule in the web version, not a page
     rule, and it stays one there. This only shows what it would feel like. */
  like.addEventListener("click", () => {
    e.liked = !e.liked;
    e.likes += e.liked ? 1 : -1;
    paintLike();
  });
  paintLike();
  const talk = document.createElement("button");
  talk.textContent = e.comments ? e.comments + (e.comments === 1 ? " reply" : " replies") : "Reply";
  social.append(like, talk);
  peek.append(h, when, said, social);
  peek.classList.add("show");
  placePeek();
}
function closePeek() { peeked = null; peek.classList.remove("show"); }
function placePeek() {
  if (!peeked) return;
  const r = renderer.domElement.getBoundingClientRect();
  tmp.copy(topOf(peeked)).project(camera);
  const x = (tmp.x * 0.5 + 0.5) * r.width;
  const y = (-tmp.y * 0.5 + 0.5) * r.height;
  const w = peek.offsetWidth, h = peek.offsetHeight;

  /* BESIDE THE FLOWER, NOT OVER IT. Anchored above and clamped, the card
     came to rest on the title card in the corner; flipped below, it covered
     the very flower it was describing, which is worse. To the side it can
     do neither, and a bloom stays visible while its line is read. */
  /* on the side AWAY from the middle, since the tree and the early rings
     are what somebody is looking at and a card laid over them hides the
     garden to explain one flower in it */
  let left = x < window.innerWidth / 2 ? x - w - 28 : x + 28;
  if (left + w > window.innerWidth - 12) left = x - w - 28;
  if (left < 12) left = x + 28;
  left = Math.max(12, Math.min(window.innerWidth - w - 12, left));
  let top = Math.max(12, Math.min(window.innerHeight - h - 12, y - h / 2));

  /* and pushed clear of the title card if the flower is in that corner */
  const t = document.getElementById("title").getBoundingClientRect();
  if (left < t.right + 8 && left + w > t.left - 8 && top < t.bottom + 8) {
    top = Math.min(window.innerHeight - h - 12, t.bottom + 10);
  }
  peek.style.left = left + "px";
  peek.style.top = top + "px";
}

/* ---------------------------------------------------------- planting */
const plantCard = document.getElementById("plant");
const hint = document.getElementById("hint");
const answers = { species: null };
const grid = document.getElementById("species");
Object.keys(SPECIES3D).forEach(id => {
  const sp = SPECIES3D[id];
  const b = document.createElement("button");
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.style.background = "hsl(" + sp.hue + " " + sp.sat + "% " + sp.light + "%)";
  const name = document.createElement("span");
  name.textContent = sp.name;
  b.append(dot, name);
  b.title = sp.meaning;
  b.addEventListener("click", () => {
    answers.species = id;
    grid.querySelectorAll("button").forEach(x => x.classList.toggle("pick", x === b));
    check();
  });
  grid.appendChild(b);
});
const who = document.getElementById("who");
const said = document.getElementById("said");
const go = document.getElementById("go");
function check() {
  go.disabled = !(who.value.trim() && said.value.trim() && answers.species);
}
who.addEventListener("input", check);
said.addEventListener("input", check);

document.getElementById("open").addEventListener("click", () => {
  plantCard.classList.add("show");
  closePeek();
  who.focus();
});
go.addEventListener("click", () => {
  const now = performance.now();
  const hh = new Date();
  const entry = {
    at: String(hh.getHours()).padStart(2, "0") + ":" + String(hh.getMinutes()).padStart(2, "0"),
    who: who.value.trim(), species: answers.species, said: said.value.trim(),
    likes: 0, comments: 0, mine: true
  };
  DAY.push(entry);
  mine = plant(entry, DAY.length - 1, now);
  showTag(mine, true);
  frame();                       /* a new outer ring may have just opened */
  plantCard.classList.remove("show");

  /* ONE A DAY, the same as the web version, and the button says so rather
     than disappearing: a control that vanishes reads as a fault. */
  state.planted = true;
  const open = document.getElementById("open");
  open.disabled = true;
  open.textContent = "You have planted today";

  hint.innerHTML = "Your flower is in. <span>It stands with the others until midnight.</span>";
  hint.classList.add("show");
  setTimeout(() => hint.classList.remove("show"), 5200);
  setTimeout(() => { if (mine) openPeek(mine); }, growMs(entry.species) + 150);
});

/* ---------------------------------------------------------- loop */
function tick(now) {
  flowers.forEach((f, i) => {
    growFlower(f, now);
    f.rotation.z = Math.sin(now / 1500 + i * 1.3) * 0.018;
  });
  world.life.update(now);
  placeTags();
  placePeek();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------------------------------------------------------- controls */
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
window.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  plantCard.classList.remove("show");
  closePeek();
});
