/* =========================================================================
   avatar-kit.js  -  who you are in the garden, and what reflecting gives you

   Built the same way the flowers are: primitives and a parameter row, no
   model files, so a look is DATA. That matters more here than it does for a
   flower, because a look has to be saved against an account, sent to a
   shared garden and read back years later, and a row of numbers survives
   that where a mesh does not.

   THE WARDROBE IS FILLED BY PLANTING, NOT BY A SHOP. Every keepsake is tied
   to one species: plant a daisy and you keep a daisy chain, plant a sunflower
   and you keep the sun hat. Nothing is bought, nothing is timed, and there is
   nothing to miss. That is the whole of "customisation tied to reflection":
   what you are wearing is a record of what you have noticed.
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";
import { buildBloom, stemGeometry, mergeGeometries, SPECIES3D } from "./flower-kit.js";

const flat = hex => new THREE.MeshLambertMaterial({ color: hex, flatShading: true });
const hsl = (h, s, l) => new THREE.MeshLambertMaterial({
  color: new THREE.Color().setHSL(h / 360, s / 100, l / 100), flatShading: true
});

/* Four of each, which is a choice rather than a gesture at one. A palette
   this size is read at a glance and every entry is distinct at the distance
   the garden is played at; sixteen browns are sixteen the same. */
export const SKINS = [0xf6e3cd, 0xe4bd95, 0xbb8354, 0x76492c];
export const HAIRS = [0x3a2a1e, 0x14131a, 0xa4642f, 0xd9c08a];
export const SHAPES = ["Short", "Bun", "Long"];

/* Each keepsake names the species that gives it and the slot it fills, so
   three can be worn at once and no two ever fight for the same place. */
export const KEEPSAKES = {
  chain: { slot: "head",      from: "daisy",     name: "Daisy chain", note: "Simplicity and joy, worn" },
  hat:   { slot: "head",      from: "sunflower", name: "Sun hat",     note: "For standing in the light" },
  clip:  { slot: "head",      from: "sakura",    name: "Blossom clip", note: "Two blossoms, kept" },
  scarf: { slot: "shoulders", from: "lavender",  name: "Soft scarf",  note: "Calm and safety, worn" },
  shawl: { slot: "shoulders", from: "rose",      name: "Rose shawl",  note: "Something warm at the collar" },
  posy:  { slot: "held",      from: "lily",      name: "Lily posy",   note: "Three, carried" },
  stem:  { slot: "held",      from: "tulip",     name: "One tulip",   note: "Carried, not planted" },
  cup:   { slot: "held",      from: "lotus",     name: "Lotus in hand", note: "Lifted out of the water" }
};
export const SLOTS = ["head", "shoulders", "held"];
export const keepsakeOf = species =>
  Object.keys(KEEPSAKES).find(k => KEEPSAKES[k].from === species) || null;

export const DEFAULT_LOOK = {
  skin: 0, hair: 0, hairCol: 0, top: 172,      /* the gardens' own teal */
  head: null, shoulders: null, held: null
};

/* ------------------------------------------------------------------ parts */
const HEAD_Y = 1.18, HEAD_R = 0.23;
const HAND = new THREE.Vector3(0.3, 0.63, 0.12);

function hair(style, mat) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(HEAD_R + 0.015, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
  cap.position.y = HEAD_Y + 0.01;
  g.add(cap);
  if (style === 1) {                                   /* a bun on the back */
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat);
    bun.position.set(0, HEAD_Y + 0.12, -0.19);
    g.add(bun);
  }
  if (style === 2) {                     /* long, a slab down the back */
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 3, 8), mat);
    back.position.set(0, HEAD_Y - 0.22, -0.11);
    back.scale.set(1, 1, 0.55);
    g.add(back);
  }
  return g;
}

/* ------------------------------------------------------- the keepsakes */
function chain(species) {                       /* a ring of small blooms */
  const g = new THREE.Group();
  /* ON the head, not IN it. At radius 0.2 the ring sat inside a head of
     0.23 plus its hair, so the daisies came out half buried and read as
     flowers dropped in a bush. */
  const R = HEAD_R + 0.025;
  const band = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 6, 20),
                              hsl(120, 34, 38));
  band.rotation.x = Math.PI / 2;
  g.add(band);
  for (let i = 0; i < 7; i++) {
    const b = buildBloom(species, { scale: 0.42 });
    const a = (i / 7) * Math.PI * 2;
    b.position.set(Math.cos(a) * R, 0.012, Math.sin(a) * R);
    b.rotation.y = -a;
    b.rotation.x = 1.15;                    /* facing outward, off the head */
    g.add(b);
  }
  g.position.y = HEAD_Y + 0.03;
  return g;
}
function hat(species) {
  const g = new THREE.Group();
  const straw = hsl(43, 48, 66);
  /* A BRIM IS MEASURED AGAINST THE HEAD, not against the idea of a sun hat.
     At 0.44 against a head of 0.23 it read as a mushroom from above, which
     is the only angle this game has, and it swallowed the shoulders with it. */
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.345, 0.02, 20), straw);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.235, 0.15, 16), straw);
  crown.position.y = 0.085;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.224, 0.045, 16), hsl(26, 30, 34));
  band.position.y = 0.03;
  g.add(brim, crown, band);
  const b = buildBloom(species, { scale: 0.5 });
  b.position.set(0.17, 0.045, 0.13);
  b.rotation.x = Math.PI / 2.1;
  g.add(b);
  g.position.y = HEAD_Y + 0.12;
  return g;
}
function clip(species) {
  const g = new THREE.Group();
  [0, 1].forEach(i => {
    const b = buildBloom(species, { scale: 0.42 - i * 0.08 });
    b.position.set(0.19, HEAD_Y + 0.08 - i * 0.11, 0.05 + i * 0.05);
    b.rotation.z = -Math.PI / 2.2;
    g.add(b);
  });
  return g;
}
function scarf(species) {
  const sp = SPECIES3D[species];
  const cloth = hsl(sp.hue, 34, 58);
  const g = new THREE.Group();
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.055, 6, 16), cloth);
  loop.rotation.x = Math.PI / 2;
  loop.scale.set(1, 1, 0.8);
  loop.position.y = 0.97;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.05), cloth);
  tail.position.set(0.06, 0.82, 0.16);
  tail.rotation.z = 0.12;
  g.add(loop, tail);
  return g;
}
function shawl(species) {
  const sp = SPECIES3D[species];
  const g = new THREE.Group();
  const cape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.32, 0.26, 14, 1, true), hsl(sp.hue, 30, 46));
  cape.material.side = THREE.DoubleSide;
  cape.position.y = 0.86;
  g.add(cape);
  const b = buildBloom(species, { scale: 0.38 });
  b.position.set(0.1, 0.99, 0.17);
  b.rotation.x = Math.PI / 2.4;
  g.add(b);
  return g;
}
function held(species, count) {
  const g = new THREE.Group();
  const stems = [];
  for (let i = 0; i < count; i++) {
    const st = stemGeometry({ height: 0.26, rBase: 0.008, rTop: 0.006, bend: 0.03 });
    st.applyMatrix4(new THREE.Matrix4().makeRotationZ((i - (count - 1) / 2) * 0.18));
    stems.push(st);
  }
  const bunch = new THREE.Mesh(mergeGeometries(stems), hsl(132, 38, 40));
  bunch.castShadow = true;
  g.add(bunch);
  for (let i = 0; i < count; i++) {
    const b = buildBloom(species, { scale: 0.46 });
    const lean = (i - (count - 1) / 2) * 0.18;
    b.position.set(Math.sin(lean) * 0.26, Math.cos(lean) * 0.26, 0);
    b.rotation.z = lean;
    g.add(b);
  }
  g.position.copy(HAND);
  g.rotation.z = -0.25;
  return g;
}
function cupped(species) {                /* a lotus carried on its own pad */
  const g = new THREE.Group();
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.125, 0.012, 12, 1, false, 0, Math.PI * 1.83),
    hsl(128, 32, 42));
  g.add(pad);
  const b = buildBloom(species, { scale: 0.5 });
  b.position.y = 0.02;
  g.add(b);
  g.position.copy(HAND);
  return g;
}
const BUILDERS = {
  chain: () => chain("daisy"),
  hat:   () => hat("sunflower"),
  clip:  () => clip("sakura"),
  scarf: () => scarf("lavender"),
  shawl: () => shawl("rose"),
  posy:  () => held("lily", 3),
  stem:  () => held("tulip", 1),
  cup:   () => cupped("lotus")
};

/* ------------------------------------------------------------- assembly */
export function buildAvatar(look = {}) {
  const L = { ...DEFAULT_LOOK, ...look };
  const g = new THREE.Group();
  const skin = flat(SKINS[L.skin] ?? SKINS[0]);
  const cloth = hsl(L.top, 38, 44);
  const shoe = hsl(L.top, 20, 28);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 3, 8), cloth);
  body.position.y = 0.62;
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 12, 10), skin);
  head.position.y = HEAD_Y;
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 3, 6), shoe);
  legs.position.y = 0.2;
  g.add(body, head, legs);

  /* ARMS, and they are here for the keepsakes rather than for the figure.
     Three of the eight are CARRIED, and a held flower with no hand under it
     floats beside the body like a bug.
     A SLEEVE AND A HAND, not one bare capsule: in the skin tone and set out
     at the shoulder they read as two pale blocks stuck to a jumper rather
     than as arms, which is what the first version did. */
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.24, 3, 6), cloth);
    arm.position.set(side * 0.2, 0.7, 0.02);
    arm.rotation.z = side * 0.13;
    g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin);
    hand.position.set(side * 0.26, 0.56, 0.04);
    g.add(hand);
  }

  /* EYES, and they are not decoration: with a blank head there is no telling
     which way the avatar is facing, so turning to face the camera in the
     wardrobe or turning toward a flower after planting says nothing at all. */
  const eye = flat(0x2a2320);
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), eye);
    e.position.set(side * 0.085, HEAD_Y - 0.012, HEAD_R - 0.026);
    e.scale.set(1, 1.15, 0.6);
    g.add(e);
  }

  g.add(hair(L.hair, flat(HAIRS[L.hairCol] ?? HAIRS[0])));
  SLOTS.forEach(slot => {
    const id = L[slot];
    if (id && BUILDERS[id]) g.add(BUILDERS[id]());
  });

  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.look = L;
  return g;
}
