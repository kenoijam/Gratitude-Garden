/* =========================================================================
   species.js  -  all eight, side by side, at both distances

   Built because the garden had been judged from one screenshot of the whole
   bed, which is how six changes landed at once without anybody seeing which
   of them hurt. Here each species stands on its own, at the distance the
   garden is actually read at AND close enough to see what it is made of,
   against the scene's own light.

   ONE renderer and one canvas, tiled with the scissor test, because sixteen
   canvases means sixteen WebGL contexts and browsers cap that around there.
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";
import { buildFlower, SPECIES3D } from "./flower-kit.js";
import { setupRenderer, skyEnvironment, warmLight } from "./world.js";

const ALL = ["daisy", "tulip", "lily", "sunflower", "lavender", "rose", "poppy", "peony"];
/* ?ids=poppy,rose narrows the sheet, because eight columns in one window is
   the right view for judging the SET and far too small for judging one bloom.
   Same page either way, so what is compared is the same render. */
const want = new URLSearchParams(location.search).get("ids");
const IDS = want ? want.split(",").map(x => x.trim()).filter(x => ALL.includes(x)) : ALL;
if (!IDS.length) IDS.push(...ALL);
/* the two that matter: what the garden shows, and what it is made of */
/* `aim` is what the camera looks at, as a fraction of the plant's own height:
   the whole plant from the ground for the far row, the BLOOM for the near one,
   since what a close up is for is seeing what the head is made of. */
const ROWS = [
  { name: "garden distance", h: 0.86, aim: 0.46 },
  { name: "close up",        h: 0.28, aim: 1.00 }
];

/* `preserveDrawingBuffer` so the sheet can be MEASURED and not only looked at.
   Without it the WebGL canvas reads back empty once the frame is composited,
   so a pixel sample reports nothing and it looks as though the render failed.
   This is a judging tool; the cost is a frame that is not discarded. */
const renderer = setupRenderer(new THREE.WebGLRenderer({
  antialias: true, preserveDrawingBuffer: true }));
renderer.setScissorTest(true);
document.getElementById("sheet").appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#eaf3ee");
scene.environment = skyEnvironment(renderer);
if ("environmentIntensity" in scene) scene.environmentIntensity = 1.05;
warmLight(scene);

/* a ground plane, so the shadow has something to land on and the flower is
   standing rather than floating. BIG: the species are spaced six apart, so a
   radius that only just covered the first few left the last two standing on
   the clear colour with no ground and no shadow. */
const floor = new THREE.Mesh(new THREE.CircleGeometry(400, 12),
  new THREE.MeshStandardMaterial({ color: new THREE.Color("#dcece0"), roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

/* spaced far apart so one camera can frame each without the neighbours */
const SPACING = 6;
IDS.forEach((id, i) => {
  const f = buildFlower(id, { seed: i * 13 + 4 });
  f.position.set(i * SPACING, 0, 0);
  /* THE KIT'S OWN SHADOW FLAGS STAND. Forcing receiveShadow on everything
     was the first thing written here and it made every bloom read as though
     it were in shade: a petal is a thin double sided sheet, so with receive
     on it shadows its own back face and the whole flower goes dark. The kit
     already sets cast on and receive off for exactly that reason, and the
     garden was right all along; only this sheet was wrong. */
  scene.add(f);
});

const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

/* the 2D strip: one plain canvas per column, at the device pixel ratio */
function draw2D(tileW, tileH, top) {
  const host = document.getElementById("twod");
  host.innerHTML = "";
  host.style.top = top + "px";
  host.style.height = tileH + "px";
  const has = typeof window.drawSpeciesBloom === "function";
  IDS.forEach((id, i) => {
    const c = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(tileW * dpr); c.height = Math.round(tileH * dpr);
    c.style.cssText = "left:" + (i * tileW) + "px;top:0;width:" + tileW +
                      "px;height:" + tileH + "px";
    host.appendChild(c);
    if (!has) return;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sp = SPECIES3D[id];
    ctx.save();
    ctx.translate(tileW / 2, tileH / 2);
    /* the species' OWN hue, saturation and lightness, so what differs
       between the rows is the shape and never the colour */
    window.drawSpeciesBloom(ctx, id, Math.min(tileW, tileH) * 0.36,
                            sp.hue, sp.sat, sp.light);
    ctx.restore();
  });
}

function draw() {
  const W = window.innerWidth, H = window.innerHeight;
  const TOP = 30;
  /* THREE rows now, and the renderer only owns the lower two. Its element is
     pinned to the bottom, so the 2D strip can be ordinary DOM canvases above
     it rather than something painted into the WebGL buffer. */
  const tileW = W / IDS.length, tileH = (H - TOP) / (ROWS.length + 1);
  draw2D(tileW, tileH, TOP);
  renderer.setSize(W, Math.round(tileH * ROWS.length));
  const labels = document.getElementById("labels");
  labels.innerHTML = "";

  const GLTOP = TOP + tileH;
  const label2 = document.createElement("div");
  label2.className = "row"; label2.style.top = (TOP + 5) + "px";
  label2.textContent = "the 2D drawing";
  document.getElementById("labels").appendChild(label2);

  ROWS.forEach((row, r) => {
    const y0 = GLTOP + r * tileH;
    const rl = document.createElement("div");
    rl.className = "row";
    rl.style.top = (y0 + 5) + "px";
    rl.textContent = row.name;
    labels.appendChild(rl);

    IDS.forEach((id, i) => {
      /* integer tiles. Fractional ones leave a hairline of the previous
         frame's clear colour down the edge of every column. */
      const x0 = Math.round(i * tileW), x1 = Math.round((i + 1) * tileW);
      const w = x1 - x0;
      /* three.js counts viewport y from the BOTTOM of ITS OWN canvas, which
         now starts at GLTOP rather than at the top of the window */
      const hh = Math.round(tileH);
      const gy = Math.round((H - GLTOP) - (y0 - GLTOP) - tileH);
      renderer.setViewport(x0, gy, w, hh);
      renderer.setScissor(x0, gy, w, hh);

      const asp = w / hh;
      cam.left = -row.h * asp; cam.right = row.h * asp;
      cam.top = row.h; cam.bottom = -row.h;
      /* the garden's own angle, about 42 degrees down */
      const sp = SPECIES3D[id];
      /* 0.9 is STEM_K, the kit's own stem multiplier, so the aim lands on the
         bloom rather than somewhere near it */
      const top = sp.stem * 0.9;
      const look = new THREE.Vector3(i * SPACING, top * row.aim, 0);
      cam.position.set(look.x + 4, look.y + 3.6, 4);
      cam.lookAt(look);
      cam.updateProjectionMatrix();
      renderer.render(scene, cam);

      if (r === 0) {
        const l = document.createElement("div");
        l.className = "lab";
        l.style.left = (x0 + tileW / 2) + "px";
        l.style.top = "9px";
        l.textContent = SPECIES3D[id].name;
        labels.appendChild(l);
      }
    });
  });
}

draw();
/* THE SHEET IS A MEASURING INSTRUMENT, so it hands out its own scene. This is
   how a lighting change is tried against the 2D drawing beside it without
   editing a file per experiment. Nothing in either scene reads this. */
window.__sheet = { scene, renderer, draw, THREE };
window.addEventListener("resize", draw);
/* redrawn on demand rather than every frame: nothing here moves */
window.addEventListener("keydown", e => { if (e.key === "r") location.reload(); });
