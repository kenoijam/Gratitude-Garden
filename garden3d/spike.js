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

const ORDER = ["daisy", "tulip", "lily", "sunflower", "lavender"];

/* The web version's numbers, unchanged. */
const GROW_RISE = 3400;
const GROW_OPEN = 1700;
const growEase = t => 1 - Math.pow(1 - t, 3);
const smooth = t => t * t * (3 - 2 * t);

const VIEWS = { close: 2.0, garden: 4.6, wide: 9.5 };

const state = { view: "garden", turn: 0, silhouette: false, hueShift: 0, planted: 0 };

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
  new THREE.CircleGeometry(3.6, 40),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(112 / 360, 0.44, 0.71) })
);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
ground.add(grass);

const bed = new THREE.Mesh(
  new THREE.BoxGeometry(2.95, 0.14, 1.35),
  new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(26 / 360, 0.33, 0.47), flatShading: true })
);
bed.position.y = 0.07;
bed.castShadow = true;
bed.receiveShadow = true;
ground.add(bed);

/* An avatar is here only to answer "how big is a flower". It is a stand in:
   the real one is the next question after this one. */
const avatar = new THREE.Group();
const skin = new THREE.MeshLambertMaterial({ color: 0xf6e3cd, flatShading: true });
const cloth = new THREE.MeshLambertMaterial({ color: 0x4a9b8e, flatShading: true });
const hair = new THREE.MeshLambertMaterial({ color: 0x4a3526, flatShading: true });
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 3, 8), cloth);
body.position.y = 0.62;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), skin);
head.position.y = 1.18;
const cap = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
cap.position.y = 1.19;
const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 3, 6), skin);
legs.position.y = 0.2;
[body, head, cap, legs].forEach(m => { m.castShadow = true; avatar.add(m); });
/* front left, clear of the panels and clear of the bed, so it is doing the
   one job it has: saying how tall a flower is */
avatar.position.set(-1.05, 0, 1.35);
avatar.rotation.y = -0.5;
scene.add(avatar);

/* ---------------------------------------------------------- the flowers */
const flowers = [];
function plantRow(z, hueOffsets) {
  ORDER.forEach((id, i) => {
    const sp = SPECIES3D[id];
    const hue = (sp.hue + (hueOffsets[i] || 0) + 360) % 360;
    const f = buildFlower(id, { hue });
    f.position.set(-1.1 + i * 0.55, 0.14, z);
    f.userData.baseHue = hue;
    f.userData.species = id;
    f.userData.born = -1;
    scene.add(f);
    flowers.push(f);
  });
}
/* the front row in each species' own colour, the back row shifted, because
   a species that only reads in its own hue does not really read */
plantRow(0.3, [0, 0, 0, 0, 0]);
plantRow(-0.32, [40, -55, 120, 190, -80]);

/* ---------------------------------------------------------- camera */
function frame() {
  const w = VIEWS[state.view];
  const a = window.innerWidth / window.innerHeight;
  camera.left = -w / 2; camera.right = w / 2;
  camera.top = w / (2 * a); camera.bottom = -w / (2 * a);
  const ang = Math.PI / 4 + state.turn * (Math.PI / 2);
  const d = 12;
  camera.position.set(Math.cos(ang) * d, d * 0.82, Math.sin(ang) * d);
  camera.lookAt(0, 0.3, 0);
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
      o.material = (o === grass || o === bed) ? PALE : DARK;
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

/* ---------------------------------------------------------- loop */
function tick(now) {
  growth(now);
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
    const sp = SPECIES3D[f.userData.species];
    const h = ((f.userData.baseHue + state.hueShift) % 360 + 360) % 360;
    f.userData.petalMat.color.setHSL(h / 360, sp.sat / 100, sp.light / 100);
  });
});
document.getElementById("replant").addEventListener("click", replant);
