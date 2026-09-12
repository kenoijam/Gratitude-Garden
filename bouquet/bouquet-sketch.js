/* Gratitude Garden — Bouquet Builder
   Flower rendering ported from personal-garden-sketch.js (p5.js) to vanilla Canvas2D
   so this page doesn't need to load the full p5 library. Shapes, proportions and
   petal math are kept identical to the original bloom drawings. */

/* ---------------------------------------------------------- data ---------------------------------------------------------- */

const SPECIES = [
  { id: "sunflower", name: "Sunflower", meaning: "Hope & resilience",
    blurb: "For someone who's your ray of light no matter what.",
    sat: 82, light: 56 },
  { id: "rose", name: "Rose", meaning: "Love & depth",
    blurb: "The classic symbol of deep love and devotion.",
    sat: 62, light: 52 },
  { id: "daisy", name: "Daisy", meaning: "Simplicity & lightness",
    blurb: "For pure, easy joy and playful innocence.",
    sat: 14, light: 82 },
  { id: "tulip", name: "Tulip", meaning: "Renewal & change",
    blurb: "A cheerful sign of new beginnings.",
    sat: 68, light: 62 },
  { id: "lily", name: "Lily", meaning: "Peace & restoration",
    blurb: "Wishing them peace, comfort, and rest.",
    sat: 30, light: 78 },
  { id: "sakura", name: "Sakura", meaning: "Reflection & presence",
    blurb: "A gentle reminder to cherish this moment together.",
    sat: 55, light: 80 },
  { id: "lotus", name: "Lotus", meaning: "Resilience & strength",
    blurb: "For someone who's weathered a lot and risen anyway.",
    sat: 52, light: 76 },
  { id: "lavender", name: "Lavender", meaning: "Calm & safety",
    blurb: "A little calm, wrapped up just for them.",
    sat: 42, light: 66 }
];
const SPECIES_MAP = Object.fromEntries(SPECIES.map(s => [s.id, s]));

const DEFAULT_HUE = 344;

const PALETTE = [
  { id: "blossom", hex: "#f4c6c6", name: "Blossom" },
  { id: "golden",  hex: "#fbe484", name: "Golden" },
  { id: "sky",     hex: "#b7e4e7", name: "Sky" },
  { id: "lilac",   hex: "#c8c0e0", name: "Lilac" },
  { id: "sage",    hex: "#a8d5ba", name: "Sage" },
  { id: "kraft",   hex: "#d9c3a3", name: "Kraft" },
  { id: "rose",    hex: "#e8b4bc", name: "Rose" },
  { id: "snow",    hex: "#fff9e3", name: "Snow" }
];

const MIN_FLOWERS = 3;

/* ---------------------------------------------------------- canvas flower port ---------------------------------------------------------- */

function hsla(h, s, l, a) { return `hsla(${h},${s}%,${l}%,${a === undefined ? 1 : a})`; }
function deg(d) { return (d * Math.PI) / 180; }
function ellipseC(ctx, x, y, w, h) { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.closePath(); ctx.fill(); }
function circleC(ctx, x, y, d) { ellipseC(ctx, x, y, d, d); }
function lerp(a, b, t) { return a + (b - a) * t; }

function drawTulip(ctx, R, hue, sat, light) {
  const Rt = R * 1.15;
  ctx.fillStyle = hsla(hue, sat, light, 0.95);
  ellipseC(ctx, 0, Rt * 0.25, Rt * 1.05, Rt * 1.1);
  ctx.beginPath();
  ctx.moveTo(-Rt * 0.52, Rt * 0.10);
  ctx.bezierCurveTo(-Rt * 0.52, -Rt * 0.10, -Rt * 0.40, -Rt * 0.40, -Rt * 0.22, -Rt * 0.60);
  ctx.lineTo(0, -Rt * 0.40);
  ctx.lineTo(Rt * 0.22, -Rt * 0.60);
  ctx.bezierCurveTo(Rt * 0.40, -Rt * 0.40, Rt * 0.52, -Rt * 0.10, Rt * 0.52, Rt * 0.10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = hsla(hue, sat * 0.8, light + 12, 0.4);
  ellipseC(ctx, 0, Rt * 0.05, Rt * 0.7, Rt * 0.9);
}

function drawRose(ctx, R, hue, sat, light) {
  ctx.save();
  function petal(rotation, distance, w, h, sMod, lMod) {
    ctx.save();
    ctx.rotate(deg(rotation));
    ctx.translate(0, -distance);
    ctx.fillStyle = hsla(hue, sat * sMod, light + lMod, 1);
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-w / 3.2, 5, -w / 1.4, -h / 3.5, -w / 4.5, -h * 0.75);
    ctx.bezierCurveTo(-w / 12, -h * 0.82, w / 12, -h * 0.82, w / 4.5, -h * 0.75);
    ctx.bezierCurveTo(w / 1.4, -h / 3.5, w / 3.2, 5, 0, 12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const scaleAmount = R / 70;
  ctx.scale(scaleAmount, scaleAmount);
  for (let i = 0; i < 8; i++) petal(i * 45, 35, 75, 44, 1.0, -10);
  for (let i = 0; i < 8; i++) petal(i * 45 + 22.5, 26, 65, 38, 0.95, -5);
  for (let i = 0; i < 6; i++) petal(i * 60 + 15, 18, 52, 32, 0.9, 0);
  for (let i = 0; i < 5; i++) petal(i * 72 + 20, 11, 40, 26, 0.85, 5);
  for (let i = 0; i < 5; i++) petal(i * 72 + 56, 6, 30, 22, 0.8, 10);
  ctx.fillStyle = hsla(hue, sat, light - 10, 1); circleC(ctx, 0, 0, 24);
  ctx.fillStyle = hsla(hue, sat * 0.95, light - 5, 1); circleC(ctx, 0, 0, 19);
  ctx.fillStyle = hsla(hue, sat * 0.9, light, 1); circleC(ctx, 0, 0, 14);
  ctx.fillStyle = hsla(hue, sat * 0.85, light + 5, 1); circleC(ctx, 0, 0, 9);
  ctx.fillStyle = hsla(hue, sat * 0.8, light + 10, 1); circleC(ctx, 0, 0, 5);
  ctx.restore();
}

function drawSunflower(ctx, R, hue, sat, light) {
  const petals = 18, w = R * 0.45, h = R * 1.25;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(deg(i * 20));
    ctx.fillStyle = hsla(hue, sat * 0.9, light + 12, 0.95);
    ellipseC(ctx, 0, -R * 0.72, w, h);
    ctx.restore();
  }
  ctx.fillStyle = hsla(28, 45, 42, 1); circleC(ctx, 0, 0, R * 1.35);
  ctx.fillStyle = hsla(23, 40, 58, 1); circleC(ctx, 0, 0, R * 1.05);
}

function drawSakura(ctx, R, hue, sat, light) {
  const Rb = R * 1.7;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate(deg(i * 72));
    ctx.fillStyle = hsla(hue, sat * 0.8, light + 15, 0.85);
    ctx.beginPath();
    ctx.moveTo(0, -Rb * 0.65);
    ctx.bezierCurveTo(Rb * 0.28, -Rb * 0.52, Rb * 0.40, -Rb * 0.20, Rb * 0.28, 0);
    ctx.bezierCurveTo(Rb * 0.18, Rb * 0.12, 0, Rb * 0.18, -Rb * 0.18, Rb * 0.12);
    ctx.bezierCurveTo(-Rb * 0.28, 0, -Rb * 0.40, -Rb * 0.20, -Rb * 0.28, -Rb * 0.52);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = hsla(hue, sat * 0.6, light - 5, 1);
  circleC(ctx, 0, 0, Rb * 0.24);
}

function drawLily(ctx, R, hue, sat, light) {
  const Rl = R * 1.08, petals = 6;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(deg(i * 60));
    ctx.fillStyle = hsla(hue, sat * 0.85, light + 8, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -Rl * 1.0);
    ctx.bezierCurveTo(Rl * 0.30, -Rl * 0.72, Rl * 0.42, -Rl * 0.30, Rl * 0.22, Rl * 0.04);
    ctx.bezierCurveTo(Rl * 0.12, Rl * 0.20, 0, Rl * 0.26, -Rl * 0.12, Rl * 0.20);
    ctx.bezierCurveTo(-Rl * 0.22, Rl * 0.04, -Rl * 0.42, -Rl * 0.30, -Rl * 0.30, -Rl * 0.72);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = hsla(hue, sat * 0.65, light - 5, 1); circleC(ctx, 0, 0, Rl * 0.36);
  ctx.fillStyle = hsla(hue, sat * 0.45, light + 10, 1); circleC(ctx, 0, 0, Rl * 0.20);
}

function drawDaisy(ctx, R, hue, sat, light) {
  const petals = 16, cfg = { w: 0.55, h: 1.10 };
  const Rd = R * 0.8, wBase = Rd * cfg.w, hBase = Rd * cfg.h;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(deg(i * (360 / petals)));
    ctx.fillStyle = hsla(hue, sat * 0.9, light + 10, 0.85);
    ellipseC(ctx, 0, -Rd * 0.7, wBase, hBase);
    ctx.restore();
  }
  ctx.fillStyle = hsla(50, 80, 70, 1); circleC(ctx, 0, 0, Rd * 0.5);
  ctx.fillStyle = hsla(45, 70, 75, 1); circleC(ctx, 0, 0, Rd * 0.35);
}

function drawLotus(ctx, R, hue, sat, light) {
  ctx.save();
  const col = hsla(hue, sat, light, 0.8);
  function petal(x, y, scX, scY, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(deg(rot));
    ctx.scale(scX, scY);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.5, R * -0.5, R * 0.5, R * -1.5, 0, R * -2);
    ctx.bezierCurveTo(-R * 0.5, R * -1.5, -R * 0.5, R * -0.5, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  petal(0, 0, 0.9, 1, 0);
  petal(0, 0, 0.9, 0.75, -50);
  petal(0, 0, 0.9, 0.75, 50);
  petal(0, 0, 0.9, 0.9, -30);
  petal(0, 0, 0.9, 0.9, 30);
  petal(0, 0, 0.9, 1, 0);
  ctx.restore();
}

function drawLavender(ctx, hgt, hue, sat, light) {
  ctx.save();
  const levels = 8, spacing = (hgt / levels) * 1.15;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const y = -10 - i * spacing;
    const pWidth = lerp(14, 7, t);
    const pHeight = pWidth * 1.6;
    const xOffset = lerp(7, 2, t);
    const baseLight = lerp(light - 10, light + 10, t);

    ctx.fillStyle = hsla(hue, sat, baseLight - 5, 0.9);
    ctx.save(); ctx.translate(-xOffset, y); ctx.rotate(deg(-40)); ellipseC(ctx, 0, 0, pWidth, pHeight); ctx.restore();

    ctx.fillStyle = hsla(hue, sat, baseLight - 2, 0.9);
    ctx.save(); ctx.translate(xOffset, y); ctx.rotate(deg(40)); ellipseC(ctx, 0, 0, pWidth, pHeight); ctx.restore();

    if (i < levels - 1) {
      ctx.fillStyle = hsla(hue, sat - 5, baseLight + 5, 0.8);
      ctx.save(); ctx.translate(0, y - spacing * 0.45); ellipseC(ctx, 0, 0, pWidth * 0.65, pHeight * 0.85); ctx.restore();
    }
    if (i === levels - 1) {
      ctx.fillStyle = hsla(hue, sat + 5, light + 15, 1);
      ellipseC(ctx, 0, y - 10, 6, 11);
    }
  }
  ctx.restore();
}

function drawSpeciesBloom(ctx, species, R, hue, sat, light) {
  switch (species) {
    case "tulip": return drawTulip(ctx, R, hue, sat, light);
    case "rose": return drawRose(ctx, R, hue, sat, light);
    case "sunflower": return drawSunflower(ctx, R, hue, sat, light);
    case "sakura": return drawSakura(ctx, R, hue, sat, light);
    case "lily": return drawLily(ctx, R, hue, sat, light);
    case "lotus": return drawLotus(ctx, R, hue, sat, light);
    case "lavender": return drawLavender(ctx, R * 1.5, hue, sat, light);
    default: return drawDaisy(ctx, R, hue, sat, light);
  }
}

function renderFlowerTile(canvas, species, hue) {
  const meta = SPECIES_MAP[species];
  const dpr = window.devicePixelRatio || 1;
  const w = 100, h = 84;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  let extra = 0;
  if (species === "lotus") extra = 14;
  else if (species === "lavender") extra = 18;
  ctx.translate(w / 2, h / 2 + 6 + extra);
  drawSpeciesBloom(ctx, species, 30, hue, meta.sat, meta.light);
  ctx.restore();
}

function drawLeaf(ctx, x, y, angleDeg, len) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(deg(angleDeg));
  ctx.fillStyle = "hsla(140,32%,42%,0.85)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.3, -len * 0.25, len * 0.9, -len * 0.15, len, 0);
  ctx.bezierCurveTo(len * 0.9, len * 0.15, len * 0.3, len * 0.25, 0, 0);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* deterministic pseudo-random so a given flower selection keeps the same
   organic arrangement across re-renders (e.g. when only the hue changes) */
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) + 1;
}
function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function renderBouquetCanvas(canvas, speciesList, hue) {
  const dpr = window.devicePixelRatio || 1;
  const w = 320, h = 270;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const baseX = w / 2, baseY = h - 6;
  const n = speciesList.length;
  const maxAngle = Math.min(36, 15 + n * 4);

  // a couple of soft greenery sprigs behind, kept close so they don't crowd the blooms
  [-20, 20].forEach((a) => {
    const len = 92;
    const tipX = baseX + Math.sin(deg(a)) * len;
    const tipY = baseY - Math.cos(deg(a)) * len;
    ctx.strokeStyle = "hsla(140,28%,42%,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + Math.sin(deg(a)) * len * 0.5, baseY - len * 0.6, tipX, tipY);
    ctx.stroke();
    drawLeaf(ctx, tipX, tipY, a, 14);
  });

  // stems, fanned unevenly like real-cut flowers leaning outward from the bunch
  const positions = [];
  for (let i = 0; i < n; i++) {
    const species = speciesList[i];
    const seed = hashSeed(species + "-" + i);
    const t = n === 1 ? 0.5 : i / (n - 1);
    const baseAngle = lerp(-maxAngle, maxAngle, t);
    const angleJitter = (seededRand(seed) - 0.5) * 16;
    const angle = baseAngle + angleJitter;
    const lenJitter = (seededRand(seed + 3.1) - 0.5) * 26;
    const stemLen = 122 + (i % 3) * 10 + lenJitter;
    const bendJitter = (seededRand(seed + 6.4) - 0.5) * 0.35;

    const bx = baseX + Math.sin(deg(angle)) * stemLen;
    const by = baseY - Math.cos(deg(angle)) * stemLen;
    positions.push({ x: bx, y: by, angle, seed });

    const cx = baseX + Math.sin(deg(angle)) * stemLen * (0.5 + bendJitter);
    const cy = baseY - stemLen * (0.56 + bendJitter * 0.3);
    ctx.strokeStyle = "hsla(140,38%,32%,0.95)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(cx, cy, bx, by);
    ctx.stroke();
    if (i % 2 === 0) drawLeaf(ctx, baseX + Math.sin(deg(angle)) * stemLen * 0.5, baseY - stemLen * 0.42, angle - 22, 18);
  }

  // blooms drawn last, from the outside in so the centre flower reads on top;
  // each bloom leans to follow the direction of its own stem, like it grew that way
  const order = [...positions.keys()].sort((a, b) => Math.abs(positions[b].angle) - Math.abs(positions[a].angle));
  order.forEach((i) => {
    const species = speciesList[i];
    const meta = SPECIES_MAP[species];
    const pos = positions[i];
    let extra = 0;
    if (species === "lotus") extra = 8;
    else if (species === "lavender") extra = 12;
    const tiltJitter = (seededRand(pos.seed + 9.7) - 0.5) * 10;
    ctx.save();
    ctx.translate(pos.x, pos.y + extra);
    ctx.rotate(deg(pos.angle * 0.72 + tiltJitter));
    const R = 36 + (i % 3 === 0 ? 3 : 0);
    drawSpeciesBloom(ctx, species, R, hue, meta.sat, meta.light);
    ctx.restore();
  });
}

/* ---------------------------------------------------------- state ---------------------------------------------------------- */

const state = { flowers: [], hue: DEFAULT_HUE, wrap: null, card: null, bg: null, to: "", msg: "", from: "" };
const STEPS = ["flowers", "wrap", "card", "letter", "bg", "reveal"];
let currentStep = 0;

/* ---------------------------------------------------------- share link encode/decode ---------------------------------------------------------- */

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function encodeState(s) {
  const compact = { f: s.flowers, h: s.hue, w: s.wrap, c: s.card, b: s.bg, t: s.to, m: s.msg, r: s.from };
  return b64encode(JSON.stringify(compact));
}
function decodeState(str) {
  const compact = JSON.parse(b64decode(str));
  return { flowers: compact.f, hue: typeof compact.h === "number" ? compact.h : DEFAULT_HUE, wrap: compact.w, card: compact.c, bg: compact.b, to: compact.t, msg: compact.m, from: compact.r };
}
function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("b", encodeState(state));
  return url.toString();
}

/* ---------------------------------------------------------- builder UI ---------------------------------------------------------- */

function initFlowerGrid() {
  const grid = document.getElementById("flowerGrid");
  grid.innerHTML = "";
  SPECIES.forEach(sp => {
    const tile = document.createElement("div");
    tile.className = "bq-flower-tile";
    tile.dataset.species = sp.id;
    tile.innerHTML = `
      <span class="bq-check">✓</span>
      <canvas></canvas>
      <span class="fname">${sp.name}</span>
      <span class="fmeaning">${sp.meaning}</span>
      <span class="fblurb">${sp.blurb}</span>
    `;
    tile.addEventListener("click", () => toggleFlower(sp.id, tile));
    grid.appendChild(tile);
    renderFlowerTile(tile.querySelector("canvas"), sp.id, state.hue);
  });
}

function refreshFlowerTiles() {
  document.querySelectorAll("#flowerGrid .bq-flower-tile").forEach(tile => {
    renderFlowerTile(tile.querySelector("canvas"), tile.dataset.species, state.hue);
  });
}

function initHueSlider() {
  const slider = document.getElementById("hueSlider");
  slider.value = state.hue;
  slider.addEventListener("input", () => {
    state.hue = parseInt(slider.value, 10);
    refreshFlowerTiles();
  });
}

function toggleFlower(id, tile) {
  const idx = state.flowers.indexOf(id);
  if (idx >= 0) { state.flowers.splice(idx, 1); tile.classList.remove("picked"); }
  else { state.flowers.push(id); tile.classList.add("picked"); }
  updateFlowerCount();
}

function updateFlowerCount() {
  const note = document.getElementById("selCount");
  const n = state.flowers.length;
  const remaining = MIN_FLOWERS - n;
  note.textContent = remaining > 0
    ? `${n} selected — pick at least ${remaining} more`
    : `${n} flower${n === 1 ? "" : "s"} selected`;
  note.classList.toggle("ok", remaining <= 0);
  document.getElementById("toWrapBtn").disabled = remaining > 0;
}

function initSwatchGrid(gridId, stateKey, classPrefix, nextBtnId) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  PALETTE.forEach(p => {
    const item = document.createElement("div");
    item.className = "bq-swatch-item";
    item.innerHTML = `<div class="bq-swatch ${classPrefix}-${p.id}" data-id="${p.id}"><span class="bq-check">✓</span></div><div class="bq-swatch-label">${p.name}</div>`;
    const swatchEl = item.querySelector(".bq-swatch");
    swatchEl.addEventListener("click", () => {
      grid.querySelectorAll(".bq-swatch").forEach(el => el.classList.remove("picked"));
      swatchEl.classList.add("picked");
      state[stateKey] = p.id;
      if (nextBtnId) document.getElementById(nextBtnId).disabled = false;
    });
    grid.appendChild(item);
  });
}

function goToStep(name) {
  currentStep = STEPS.indexOf(name);
  document.querySelectorAll("#bqBuilder .bq-step").forEach(el => el.classList.toggle("active", el.dataset.step === name));
  document.getElementById("bqBuilder").style.display = name === "reveal" ? "none" : "flex";
  document.getElementById("bqProgress").style.display = name === "reveal" ? "none" : "flex";
  document.getElementById("bqRevealWrap").classList.toggle("active", name === "reveal");
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "reveal") renderFinal(false);
}

function updateProgress() {
  document.querySelectorAll(".bq-step-dot").forEach((dot, i) => {
    dot.classList.toggle("done", i < currentStep);
    dot.classList.toggle("current", i === currentStep);
  });
}

function initLetterStep() {
  const toInput = document.getElementById("letterTo");
  const msgInput = document.getElementById("letterMsg");
  const fromInput = document.getElementById("letterFrom");
  const btn = document.getElementById("toBgBtn");
  const count = document.getElementById("msgCount");

  function sync() {
    state.to = toInput.value.trim();
    state.msg = msgInput.value.trim();
    state.from = fromInput.value.trim();
    count.textContent = `${msgInput.value.length}/600`;
    btn.disabled = !(state.to && state.msg);
  }
  [toInput, msgInput, fromInput].forEach(el => el.addEventListener("input", sync));
}

/* ---------------------------------------------------------- final reveal ---------------------------------------------------------- */

function renderFinal(isRecipientView) {
  const cone = document.getElementById("bqCone");
  const cardTag = document.getElementById("bqCardTag");
  const revealWrap = document.getElementById("bqRevealWrap");
  const stage = document.getElementById("bqStage");

  cone.className = "bq-wrap-cone wrap-" + state.wrap;
  cardTag.querySelector(".bq-card-front").className = "bq-card-face bq-card-front card-" + state.card;
  cardTag.querySelector(".bq-card-back").className = "bq-card-face bq-card-back card-" + state.card;
  revealWrap.className = "bg-" + state.bg;

  const canvas = document.getElementById("bouquetCanvas");
  renderBouquetCanvas(canvas, state.flowers, state.hue);

  document.getElementById("cardTo").textContent = state.to || "you";
  document.getElementById("cardMsg").textContent = state.msg || "";
  document.getElementById("cardFrom").textContent = state.from || "a friend";
  document.getElementById("bqLetterCard").className = "bq-letter-card card-" + state.card;

  document.getElementById("bqSharePanel").style.display = isRecipientView ? "none" : "flex";
  document.getElementById("bqBackNav").style.display = isRecipientView ? "none" : "flex";
  document.getElementById("bqRecipientCta").style.display = isRecipientView ? "block" : "none";
  document.getElementById("bqReadyHeading").textContent = isRecipientView ? "Someone made you a bouquet" : "Your bouquet is ready";
  document.getElementById("bqReadySub").textContent = isRecipientView
    ? "Tap the little card tucked in the wrap to read the message."
    : "Tap the card to preview your note, then share the link.";

  revealWrap.classList.add("active");
  requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("revealed")));
}

function initCardTagInteraction() {
  const tag = document.getElementById("bqCardTag");
  const modal = document.getElementById("bqCardModal");
  tag.addEventListener("click", () => { modal.classList.add("open"); });
  document.getElementById("bqLetterClose").addEventListener("click", (e) => { e.stopPropagation(); modal.classList.remove("open"); });
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
}

/* ---------------------------------------------------------- share actions ---------------------------------------------------------- */

function initShareActions() {
  document.getElementById("copyLinkBtn").addEventListener("click", async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    const msg = document.getElementById("copiedMsg");
    msg.textContent = "Link copied!";
    setTimeout(() => { msg.textContent = ""; }, 2200);
  });

  document.getElementById("waShareBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const url = buildShareUrl();
    const text = `I made you a little bouquet 🌷 ${url}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  });

  document.getElementById("emailShareBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const url = buildShareUrl();
    const subject = "A bouquet for you";
    const body = `I made you a little bouquet — open it here:\n\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  document.getElementById("startOverBtn").addEventListener("click", () => {
    window.location.href = window.location.pathname;
  });
}

/* ---------------------------------------------------------- nav wiring ---------------------------------------------------------- */

function initNav() {
  document.getElementById("toWrapBtn").addEventListener("click", () => goToStep("wrap"));
  document.getElementById("backToFlowers").addEventListener("click", () => goToStep("flowers"));
  document.getElementById("toCardBtn").addEventListener("click", () => goToStep("card"));
  document.getElementById("backToWrap").addEventListener("click", () => goToStep("wrap"));
  document.getElementById("toLetterBtn").addEventListener("click", () => goToStep("letter"));
  document.getElementById("backToCard").addEventListener("click", () => goToStep("card"));
  document.getElementById("toBgBtn").addEventListener("click", () => goToStep("bg"));
  document.getElementById("backToLetter").addEventListener("click", () => goToStep("letter"));
  document.getElementById("toRevealBtn").addEventListener("click", () => goToStep("reveal"));
  document.getElementById("backToBg").addEventListener("click", () => goToStep("bg"));
}

/* ---------------------------------------------------------- boot ---------------------------------------------------------- */

function showLinkError() {
  document.getElementById("bqBuilder").style.display = "none";
  document.getElementById("bqProgress").style.display = "none";
  document.getElementById("bqLinkError").style.display = "block";
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("b");

  initCardTagInteraction();

  if (encoded) {
    try {
      const decoded = decodeState(encoded);
      if (!decoded.flowers || decoded.flowers.length < 1) throw new Error("empty");
      Object.assign(state, decoded);
      document.getElementById("bqBuilder").style.display = "none";
      document.getElementById("bqProgress").style.display = "none";
      document.getElementById("bqWordmark").style.display = "none";
      renderFinal(true);
    } catch (e) {
      showLinkError();
    }
    return;
  }

  // builder mode
  initFlowerGrid();
  initHueSlider();
  updateFlowerCount();
  initSwatchGrid("wrapGrid", "wrap", "wrap", "toCardBtn");
  initSwatchGrid("cardGrid", "card", "card", "toLetterBtn");
  initSwatchGrid("bgGrid", "bg", "bg", "toRevealBtn");
  initLetterStep();
  initNav();
  initShareActions();
  goToStep("flowers");
}

document.addEventListener("DOMContentLoaded", boot);
