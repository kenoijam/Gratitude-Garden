/* Gratitude Garden p5.js full version*/
const BASE_W = 1440;
const BASE_H = 900;
const isTouchDevice = /Mobi|Android|iPhone|iPad|iPod/.test(
navigator.userAgent || ""
);
let step = "landing";
let gratitudeText = "";
let username = "";
let chosenSpecies = null;
let chosenHue = 280;
let chosenHex = "#C07AF0"
let flowers = [];
let windOn = false;
let swayOn = true;
let clouds = [];
let groundLevel;
let isSaving = false;
let flowerCounter = 0;
let gardenScale = 1;

let landingWrap, usernameWrap, selectWrap, gardenWrap;
let gratitudeField, charCount, continueBtn;
let usernameField, usernameContinueBtn, usernameNote;
let colorPickerSelect, speciesButtons = {};
let saveBtn, tipsCard, dailyNote;

const GARDEN_KEY = "community_garden_daily";

/* The meanings are the personal garden's, word for word, since the two gardens
   draw the same eight species and a flower cannot stand for one thing on one
   page and something else on the other. Here you pick the species yourself, so
   the meaning has to be visible while you are choosing rather than afterwards. */
const speciesList = [
{ id: "daisy", name: "Daisy", meaning: "Simplicity and joy" },
{ id: "tulip", name: "Tulip", meaning: "Renewal & change" },
{ id: "rose", name: "Rose", meaning: "Love & depth" },
{ id: "sunflower", name: "Sunflower", meaning: "Hope & resilience" },
{ id: "lily", name: "Lily", meaning: "Peace & restoration" },
{ id: "sakura", name: "Sakura", meaning: "Reflection & presence" },
{ id: "lotus", name: "Lotus", meaning: "Strength & rising" },
/* Orchid and chrysanthemum are drawn by this sketch but deliberately absent
   from `speciesList`, so they appear in no picker. See CLAUDE.md. */
{ id: "lavender", name: "Lavender", meaning: "Calm & safety" },
];

let shared;
let roomKey;
let hoveredFlower = null;
let lastTapFlower = null;
let prevTouchCount = 0;

// Growth stages (matching personal garden)
const GROWTH_STAGES = {
  BUD: 0,
  STEM: 1,
  BLOOM: 2
};

// Track which flower index belongs to this user (local only)
let myLocalFlowerIndex = -1;

// ---------------------------- GENERAL HELPER FUNCTIONS ----------------------------

function preload() {
roomKey = "garden-" + todayStr();
partyConnect("wss://demoserver.p5party.org", "gratitude_garden");
shared = partyLoadShared(roomKey);
}

function speciesPetalCount(id) {
return {
daisy: 16,
tulip: 6,
rose: 8,
sunflower: 24,
lily: 12,
sakura: 5,
orchid: 5,
chrysanth: 18
}[id] || 16;
}

function defaultSat(sp) {
return { daisy: 45, tulip: 50, rose: 55, sunflower: 60, lily: 40, sakura: 40, lotus: 50, orchid: 50, chrysanth: 48 }[sp] || 45;
}

function defaultLight(sp) {
return { daisy: 65, tulip: 60, rose: 55, sunflower: 65, lily: 70, sakura: 75, lotus: 70, orchid: 68, chrysanth: 72 }[sp] || 65;
}

function addFlower(text, name, species, hue) {
  const word = name.trim().slice(0, 20);

  const flowerCount = flowers.length;
  let size;
  if (flowerCount < 10) {
    size = random(28, 36);
  } else if (flowerCount < 30) {
    size = random(24, 32);
  } else if (flowerCount < 60) {
    size = random(20, 28);
  } else {
    size = random(16, 24);
  }

  const groundLevel = height * 0.76;
  const rows = ["front", "middle", "back"];

  let x = 0;
  let stemLen = 160;
  let baseY = groundLevel;
  let chosenRow = "front";

  const minFlowerDistanceFactor = width < 720 ? 0.7 : 0.9;

  for (const row of rows) {
    let targetBaseY = groundLevel;
    let minStem, maxStem;
    var stemScale = width < 720 ? 0.7 : 1;

    if (row === "front") {
      minStem = height * 0.16 * stemScale;
      maxStem = height * 0.24 * stemScale;
    } else if (row === "middle") {
      targetBaseY = groundLevel - height * 0.04;
      minStem = height * 0.26 * stemScale;
      maxStem = height * 0.36 * stemScale;
    } else {
      targetBaseY = groundLevel - height * 0.08;
      minStem = height * 0.32 * stemScale;
      maxStem = height * 0.42 * stemScale;
    }

    const maxAttempts = 80;
    let bestX = random(50, width - 50);
    let bestClearance = -1;
    let bestStemLen = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateX = random(50, width - 50);
      const candidateStem = random(minStem, maxStem);
      const candidateBloomY = targetBaseY - candidateStem;

      let minDist = Infinity;
      for (const f of flowers) {
        const existingStemLen = (f.stemNorm != null ? f.stemNorm * height : f.stemLen);
        const existingX = (f.xNorm != null ? f.xNorm * width : f.x);
        const existingBloomY = groundLevel - existingStemLen;

        const dx = candidateX - existingX;
        const dy = candidateBloomY - existingBloomY;
        const d = sqrt(dx * dx + dy * dy);
        const needed = (size + f.size) * minFlowerDistanceFactor;
        if (d < needed) { minDist = 0; break; }
        if (d < minDist) minDist = d;
      }

      if (minDist > bestClearance) {
        bestClearance = minDist;
        bestX = candidateX;
        bestStemLen = candidateStem;
      }
      if (minDist > size * 2.5) break;
    }

    if (bestClearance > 0 && bestStemLen) {
      x = bestX;
      stemLen = bestStemLen;
      baseY = targetBaseY;
      chosenRow = row;
      break;
    }
  }

  if (!x) {
    x = random(50, width - 50);
    stemLen = random(120, 200);
    baseY = groundLevel;
    chosenRow = "front";
  }

  let layer;
  if (chosenRow === "front") layer = "front";
  else if (chosenRow === "middle") layer = "mid";
  else layer = "back";

  const petals = speciesPetalCount(species);

  const newFlower = {
    word,
    gratitude: text,
    species,
    x,
    baseY,
    layer,
    stemLen,
    size,

    xNorm: x / width,
    stemNorm: stemLen / BASE_H,
    sizeNorm: size / BASE_H,

    phase: random(360),
    petals,
    hue,
    sat: defaultSat(species),
    light: defaultLight(species),

    createdIndex: flowerCounter++
  };

  if (!shared.flowers) {
    shared.flowers = [];
  }

  shared.flowers.push(newFlower);

  const localFlower = { ...newFlower };
  localFlower.growthStage = GROWTH_STAGES.BUD;
  localFlower.growthStartTime = millis();
  localFlower.plantedTime = Date.now();
  localFlower.isMyFlower = true;
  flowers.push(localFlower);

  myLocalFlowerIndex = flowers.length - 1;

  updateResponsiveFlowerLayout();
}

function speciesShapeCfg(species) {
return ({
daisy:     { w: 0.55, h: 1.10 },
sunflower: { w: 0.45, h: 1.25 },
rose:      { w: 0.60, h: 1.05 },
lily:     { w: 0.70, h: 1.00 },
tulip:     { w: 0.80, h: 1.10 },
sakura:    { w: 0.75, h: 1.00 },
    orchid:    { w: 0.72, h: 1.00 },
    chrysanth: { w: 0.60, h: 1.10 }
}[species] || { w: 0.55, h: 1.10 });
}

function hexToHue(hex) {
const c = hex.replace("#", "");
const r = parseInt(c.slice(0, 2), 16) / 255;
const g = parseInt(c.slice(2, 4), 16) / 255;
const b = parseInt(c.slice(4, 6), 16) / 255;
const max = Math.max(r, g, b);
const min = Math.min(r, g, b);

let h;
if (max === min) h = 0;
else if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
else if (max === g) h = 60 * ((b - r) / (max - min)) + 120;
else h = 60 * ((r - g) / (max - min)) + 240;

return h;
}

/* --------------------- Overlay controls --------------------- */
function drawOverlayControls() {
  // Sway is always on, no controls needed
}

function findFlowerAt(px, py) {
if (!flowers || !flowers.length) return null;

let best = null;
let bestDist = Infinity;

for (const f of flowers) {
if (f.growthStage !== undefined && f.growthStage !== GROWTH_STAGES.BLOOM) continue;

const t = frameCount * 0.01 + f.phase * 0.001;

const swayNoise = swayOn
? map(noise(t), 0, 1, -1, 1) * 4
: 0;

const totalSway = swayNoise;

const flowerX = f.x + totalSway;
const flowerY = f.baseY - f.stemLen;

const d = dist(px, py, flowerX, flowerY);
if (d < f.size * 1.5 && d < bestDist) {
bestDist = d;
best = f;
}
}

return best;
}

function handleGardenPointer(px, py) {
if (step !== "garden") return;

const tapped = findFlowerAt(px, py);

if (!tapped) {
hoveredFlower = null;
} else if (hoveredFlower && hoveredFlower.createdIndex === tapped.createdIndex) {
hoveredFlower = null;
} else {
hoveredFlower = tapped;
}

/* Tapping a bloom opens its likes and comments. The hover tooltip is left
   exactly as it was, since it answers a different question: the tooltip is
   what the flower SAYS, at a glance, and the panel is what other people have
   said back. Tapping empty ground closes the panel, which is the gesture
   anyone would try first.

   `roomKey` and `speciesList` are handed over here because the sketch
   declares them with `let` and `const`, so neither is on `window` for the
   social module to find. */
if (window.GardenSocial) {
if (tapped) {
const sp = speciesList.find(x => x.id === tapped.species);
GardenSocial.open(tapped, { day: roomKey, meaning: sp ? sp.meaning : "" });
} else {
GardenSocial.close();
}
}
}

function checkHover(px = mouseX, py = mouseY) {
let best = null;
let bestDist = Infinity;

for (const f of flowers) {
if (f.growthStage !== undefined && f.growthStage !== GROWTH_STAGES.BLOOM) continue;

const t = frameCount * 0.01 + f.phase * 0.001;

const swayNoise = swayOn
? map(noise(t), 0, 1, -1, 1) * 4
: 0;

const totalSway = swayNoise;

const fx = f.x + totalSway;
const fy = f.baseY - f.stemLen;

const d = dist(px, py, fx, fy);
if (d < f.size * 1.5 && d < bestDist) {
bestDist = d;
best = f;
}
}

hoveredFlower = best;
}

function drawCheckbox(x, y, checked, label, boxSize = 22) {
stroke("#0f5132");
noFill();
rect(x, y, boxSize, boxSize, 6);

if (checked) {
noStroke();
fill(224, 242, 255, 140);
rect(x + 2, y + 2, boxSize - 4, boxSize - 4, 5);

stroke("#0f5132");
strokeWeight(1.4);
const cx = x + boxSize / 2;
const cy = y + boxSize / 2;
line(cx - boxSize * 0.25, cy,
cx - boxSize * 0.05, cy + boxSize * 0.22);
line(cx - boxSize * 0.05, cy + boxSize * 0.22,
cx + boxSize * 0.30, cy - boxSize * 0.18);
}

noStroke();
fill("#0f5132");
textAlign(LEFT, CENTER);
textSize(14);
text(label, x + boxSize + 8, y + boxSize / 2);
}

function hitBox(box, px = mouseX, py = mouseY){
return (
px >= box.x &&
px <= box.x + box.w &&
py >= box.y &&
py <= box.y + box.h
);
}

// ---------------------------- SCENERY HELPER FUNCTIONS ----------------------------

function buildClouds(reset = false) {
const n = 4;
if (reset) clouds = [];
for (let i = 0; i < n; i++) {
clouds[i] = clouds[i] || {};
clouds[i].x = reset ? random(-180, width + 180) : (clouds[i].x ?? random(-180, width + 180));
clouds[i].y = random(height * 0.10, height * 0.30);
clouds[i].speed = random(0.25, 0.6);
clouds[i].size = random(70, 120);
}
}

function drawSky() {
for (let y = 0; y < height; y++) {
const t = y / height;
const c = lerpColor(color("#cfeef0"), color("#f9ffff"), t);
stroke(c);
line(0, y, width, y);
}
}

function drawSunGradient() {
const sx = width * 0.85;
const sy = height * 0.18;

noStroke();
for (let r = 60; r > 0; r -= 8) {
const a = map(r, 60, 0, 0.15, 1);
fill(255, 220, 120, 255 * a);
circle(sx, sy, r * 2);
}

stroke(255, 210, 120, 120);
for (let i = 0; i < 12; i++) {
const a = i * 30;
const x1 = sx + cos(a) * 55;
const y1 = sy + sin(a) * 55;
const x2 = sx + cos(a) * 90;
const y2 = sy + sin(a) * 90;
line(x1, y1, x2, y2);
}
}

/* The hero's cloud, not three circles.
   index.html's hero draws a rounded bar with two circles sitting on it,
   asymmetric, and the gardens drew a symmetric trio, so the same page carried
   two different clouds. These are the hero's own proportions, averaged across
   its three sizes and taken relative to the bar's width W:

     bar     W wide, 0.269W tall, its top 0.19W down
     bump 1  0.433W across, at 0.138W from the left, flush with the top
     bump 2  0.314W across, at 0.456W from the left, 0.052W down

   `c.size` stays the centre circle diameter it always was, so the stored
   clouds do not change; W is 1.6 of it, which is the width the old trio
   spanned. The alpha is the hero's 0.9, not the old 205. */
function drawClouds() {
noStroke();
for (const c of clouds) {
c.x += c.speed;
if (c.x > width + 170) c.x = -170;

fill(255, 255, 255, 230);
const W = c.size * 1.6;
const x = c.x - W / 2, y = c.y - W * 0.22;
const bodyH = W * 0.269, b1 = W * 0.433, b2 = W * 0.314;
rect(x, y + W * 0.19, W, bodyH, bodyH / 2);
circle(x + W * 0.138 + b1 / 2, y + b1 / 2, b1);
circle(x + W * 0.456 + b2 / 2, y + W * 0.052 + b2 / 2, b2);
}
}

function drawForegroundHill() {
noStroke();

const baseY = height * 0.76;

const lift = 20;

fill("#7ec4b4");

beginShape();
for (let x = 0; x <= width + 20; x += 10) {
const bump = noise(x * 0.004, 321.45) * lift;
const y = baseY - bump;
vertex(x, y);
}
vertex(width + 20, height);
vertex(0, height);
endShape(CLOSE);

}

function drawHillsBack() {
noStroke();
fill("#a9d9cf");
beginShape();
for (let x = 0; x <= width + 20; x += 10) {
vertex(x, height * 0.56 + noise(x * 0.002, 0.1) * 52);
}
vertex(width + 20, height);
vertex(0, height);
endShape(CLOSE);

}

function drawHillsFront() {
noStroke();
fill("#8fcfbe");
beginShape();
for (let x = 0; x <= width + 20; x += 12) {
vertex(x, height * 0.66 + noise(x * 0.0025, 20.2) * 46);
}
vertex(width + 20, height);
vertex(0, height);
endShape(CLOSE);
}

function drawGround() {
noStroke();
const groundTop = height * 0.805;
fill('#dff0e8');
rect(0, groundTop, width + 20, height - groundTop);
}

// ---------------------------- FLOWER BLOOM/LEAF DRAWING FUNCTIONS ----------------------------

function drawTulipBloom(R, hue, sat, light) {
noStroke();
const Rt = R * 1.15;
fill(hue, sat, light, 0.95);

ellipse(0, Rt * 0.25, Rt * 1.05, Rt * 1.1);

beginShape();
vertex(-Rt * 0.52, Rt * 0.10);
bezierVertex(-Rt * 0.52, -Rt * 0.10,
-Rt * 0.40, -Rt * 0.40,
-Rt * 0.22, -Rt * 0.60);
vertex(0, -Rt * 0.40);
vertex(Rt * 0.22, -Rt * 0.60);
bezierVertex(Rt * 0.40, -Rt * 0.40,
Rt * 0.52, -Rt * 0.10,
Rt * 0.52, Rt * 0.10);
endShape(CLOSE);

fill(hue, sat * 0.8, light + 12, 0.4);
ellipse(0, Rt * 0.05, Rt * 0.7, Rt * 0.9);
}

function drawRoseBloom(R, hue, sat, light) {
push();
colorMode(HSL, 360, 100, 100, 1);
angleMode(DEGREES);
noStroke();

function petal(rotation, distance, w, h, sMod, lMod) {
push();
rotate(rotation);
translate(0, -distance);

fill(hue, sat * sMod, light + lMod, 1);

const width  = w;
const height = h;

beginShape();
vertex(0, 12);
bezierVertex(-width / 3.2, 5,
-width / 1.4, -height / 3.5,
-width / 4.5, -height * 0.75);
bezierVertex(-width / 12, -height * 0.82,
width / 12,  -height * 0.82,
width / 4.5, -height * 0.75);
bezierVertex(width / 1.4,  -height / 3.5,
width / 3.2,  5,
0,            12);
endShape(CLOSE);

pop();
}

const scaleAmount = R / 70;
push();
scale(scaleAmount, scaleAmount);

for (let i = 0; i < 8; i++) petal(i * 45, 35, 75, 44, 1.0, -10);
for (let i = 0; i < 8; i++) petal(i * 45 + 22.5, 26, 65, 38, 0.95, -5);
for (let i = 0; i < 6; i++) petal(i * 60 + 15, 18, 52, 32, 0.9, 0);
for (let i = 0; i < 5; i++) petal(i * 72 + 20, 11, 40, 26, 0.85, 5);
for (let i = 0; i < 5; i++) petal(i * 72 + 56, 6, 30, 22, 0.8, 10);

fill(hue, sat, light - 10); circle(0, 0, 24);
fill(hue, sat * 0.95, light - 5); circle(0, 0, 19);
fill(hue, sat * 0.9, light); circle(0, 0, 14);
fill(hue, sat * 0.85, light + 5); circle(0, 0, 9);
fill(hue, sat * 0.8, light + 10); circle(0, 0, 5);

pop();
pop();
}

function drawSunflowerBloom(R, hue, sat, light) {
noStroke();

const petals = 18;
const w = R * 0.45;
const h = R * 1.25;

for (let i = 0; i < petals; i++) {
push();
rotate(i * (360 / petals));
fill(hue, sat * 0.9, light + 12, 0.95);
ellipse(0, -R * 0.72, w, h);
pop();
}

fill(28, 45, 42);
circle(0, 0, R * 1.35);

fill(23, 40, 58);
circle(0, 0, R * 1.05);
}

function drawCherryBloom(R, hue, sat, light) {
noStroke();
const Rb = R * 1.7;

for (let i = 0; i < 5; i++) {
const angle = i * 72;
push();
rotate(angle);

fill(hue, sat * 0.8, light + 15, 0.85);
beginShape();
vertex(0, -Rb * 0.65);
bezierVertex(Rb * 0.28, -Rb * 0.52,
Rb * 0.40, -Rb * 0.20,
Rb * 0.28, 0);
bezierVertex(Rb * 0.18, Rb * 0.12,
0, Rb * 0.18,
-Rb * 0.18, Rb * 0.12);
bezierVertex(-Rb * 0.28, 0,
-Rb * 0.40, -Rb * 0.20,
-Rb * 0.28, -Rb * 0.52);
endShape(CLOSE);

pop();
}

fill(hue, sat * 0.6, light - 5);
circle(0, 0, Rb * 0.24);
}

function drawLilyBloom(R, hue, sat, light) {
noStroke();
const Rl = R * 1.08;
const petals = 6;

for (let i = 0; i < petals; i++) {
const a = i * 60;
push();
rotate(a);

fill(hue, sat * 0.85, light + 8, 0.9);
beginShape();
vertex(0, -Rl * 1.0);
bezierVertex(Rl * 0.30, -Rl * 0.72,
Rl * 0.42, -Rl * 0.30,
Rl * 0.22, Rl * 0.04);
bezierVertex(Rl * 0.12, Rl * 0.20,
0, Rl * 0.26,
-Rl * 0.12, Rl * 0.20);
bezierVertex(-Rl * 0.22, Rl * 0.04,
-Rl * 0.42, -Rl * 0.30,
-Rl * 0.30, -Rl * 0.72);
endShape(CLOSE);

pop();
}

fill(hue, sat * 0.65, light - 5);
circle(0, 0, Rl * 0.36);
fill(hue, sat * 0.45, light + 10);
circle(0, 0, Rl * 0.20);
}

function drawDaisyBloom(R, hue, sat, light) {
noStroke();

const petals = 16;
const cfg = speciesShapeCfg("daisy");
const Rd = R * 0.8;
const wBase = Rd * cfg.w;
const hBase = Rd * cfg.h;

for (let i = 0; i < petals; i++) {
const a = i * (360 / petals);
push();
rotate(a);

fill(hue, sat * 0.9, light + 10, 0.85);
ellipse(0, -Rd * 0.7, wBase, hBase);

pop();
}

fill(50, 80, 70);
circle(0, 0, Rd * 0.5);
fill(45, 70, 75);
circle(0, 0, Rd * 0.35);
}

// ===== LOTUS BLOOM =====
function drawLotusBloom(R, hue, sat, light) {
push();
noStroke();

let drawPetal = (x, y, scX, scY, rot, c) => {
push();
translate(x, y);
rotate(rot);
scale(scX, scY);
fill(c);
beginShape();
vertex(0, 0);
bezierVertex(R * 0.5, R * -0.5, R * 0.5, R * -1.5, 0, R * -2);
bezierVertex(-R * 0.5, R * -1.5, -R * 0.5, R * -0.5, 0, 0);
endShape(CLOSE);
pop();
};

let col = color(hue, sat, light, 0.8);

drawPetal(0, 0, 0.9, 1, 0, col);
drawPetal(0, 0, 0.9, 0.75, -50, col);
drawPetal(0, 0, 0.9, 0.75, 50, col);
drawPetal(0, 0, 0.9, 0.9, -30, col);
drawPetal(0, 0, 0.9, 0.9, 30, col);
drawPetal(0, 0, 0.9, 1, 0, col);
pop();
}

// ===== LAVENDER BLOOM =====
/* Phalaenopsis, face on. Three narrow sepals behind (one up, two down), two
   broad petals in front, and the lip at the bottom in a deeper tone. The lip is
   what makes it read as an orchid rather than a generic five petalled bloom.
   It is a CENTRED bloom, unlike the lotus it replaces, so it needs none of
   lotus's origin nudge or label offset. */
function drawOrchidBloom(R, hue, sat, light) {
noStroke();
const Ro = R * 1.28;
const lobe = (ang, len, wid, sa, li, al, pinch) => {
push();
rotate(ang + 90);
fill(hue, sa, li, al);
beginShape();
vertex(0, 0);
bezierVertex(wid, -len * (pinch || 0.22), wid, -len * 0.82, 0, -len);
bezierVertex(-wid, -len * 0.82, -wid, -len * (pinch || 0.22), 0, 0);
endShape(CLOSE);
pop();
};
lobe(-90, Ro * 1.00, Ro * 0.31, sat * 0.72, light + 13, 0.92);
lobe( 42, Ro * 0.94, Ro * 0.31, sat * 0.72, light + 13, 0.92);
lobe(138, Ro * 0.94, Ro * 0.31, sat * 0.72, light + 13, 0.92);
lobe(-40,  Ro * 0.95, Ro * 0.60, sat * 0.85, light + 19, 0.96, 0.30);
lobe(-140, Ro * 0.95, Ro * 0.60, sat * 0.85, light + 19, 0.96, 0.30);
lobe( 62, Ro * 0.44, Ro * 0.20, sat + 12, light - 8,  1);
lobe(118, Ro * 0.44, Ro * 0.20, sat + 12, light - 8,  1);
lobe( 90, Ro * 0.52, Ro * 0.26, sat + 18, light - 15, 1, 0.34);
fill(hue, sat * 0.35, light + 26, 1);
ellipse(0, Ro * 0.05, Ro * 0.13, Ro * 0.19);
}

/* Pompom chrysanthemum: concentric rings of short rounded petals, lightening
   inward so it reads as a ball rather than a disc. A chrysanthemum is in the
   same family as the daisy, so drawn as a single flat bloom the two tiles are
   the same picture twice; the pompom is what keeps them apart. */
function drawChrysanthBloom(R, hue, sat, light) {
noStroke();
const Rm = R * 1.12;
const rings = [
{ n: 18, r: 0.92, pw: 0.23, ph: 0.32, dl: -9, a: 0.95 },
{ n: 16, r: 0.70, pw: 0.21, ph: 0.29, dl: -3, a: 1 },
{ n: 12, r: 0.49, pw: 0.19, ph: 0.26, dl:  4, a: 1 },
{ n: 8,  r: 0.27, pw: 0.17, ph: 0.23, dl: 10, a: 1 }
];
for (let ri = 0; ri < rings.length; ri++) {
const ring = rings[ri];
for (let i = 0; i < ring.n; i++) {
push();
/* each ring is offset, or the petals line up into spokes */
rotate(i * (360 / ring.n) + ri * 11);
fill(hue, sat, light + ring.dl, ring.a);
ellipse(0, -Rm * ring.r, Rm * ring.pw, Rm * ring.ph);
pop();
}
}
fill(hue, sat * 0.6, light + 16, 1);
circle(0, 0, Rm * 0.14);
}

function drawLavenderBloom(h, hue, sat, light) {
push();
noStroke();

let levels = 8;
let spacing = (h / levels) * 1.15;

for (let i = 0; i < levels; i++) {
let t = i / (levels - 1);

let y = -10 - i * spacing;

let pWidth = lerp(14, 7, t);
let pHeight = pWidth * 1.6;
let xOffset = lerp(7, 2, t);

let baseLight = lerp(light - 10, light + 10, t);

fill(hue, sat, baseLight - 5, 0.9);
push();
translate(-xOffset, y);
rotate(-40);
ellipse(0, 0, pWidth, pHeight);
pop();

fill(hue, sat, baseLight - 2, 0.9);
push();
translate(xOffset, y);
rotate(40);
ellipse(0, 0, pWidth, pHeight);
pop();

if (i < levels - 1) {
fill(hue, sat - 5, baseLight + 5, 0.8);
push();
translate(0, y - spacing * 0.45);
ellipse(0, 0, pWidth * 0.65, pHeight * 0.85);
pop();
}

if (i === levels - 1) {
fill(hue, sat + 5, light + 15);
ellipse(0, y - 10, 6, 11);
}
}

pop();
}

/* ONE soft shadow for the whole flower.

   The garden's ground runs #a9d9cf, #8fcfbe and #7ec4b4, all pale teals, and
   the planter picks the hue freely, so a pale teal or pale blue bloom sat on
   that ground at almost no contrast and disappeared into the grass. A shadow
   works whatever hue is chosen, where an outline or a floor on lightness
   would fight the choice the person just made.

   The first version set drawingContext.shadow* and let EVERY PETAL cast one.
   That reads as petal by petal shading rather than as a flower standing on
   grass, because a petal's shadow falls on the petals around it. Canvas has
   no way to shadow a group of shapes as one, and an exact silhouette would
   mean rendering the bloom to an offscreen buffer, which these sketches
   cannot do: the species functions draw through p5's globals, and the only
   parallel families that take a buffer are the PREVIEW ones, which are
   separate copies and would put a different flower's outline under the
   flower actually drawn.

   So it is one ellipse, per bloom, sized from each species' MEASURED painted
   extent. It is drawn far off canvas and brought back purely as its own
   shadow, which is what makes it a single soft shape with one alpha and no
   seams anywhere.

   BLOOM_BOX is [centre y, half width, half height] as multiples of R,
   measured by rendering each species alone and reading back its painted
   bounding box. Lotus and lavender grow UPWARD from an origin that
   bloomOriginNudge pushes down, which is why their centre y is negative and
   why a shadow centred on the origin would have sat below the flower.
*/
var BLOOM_BOX = {
  tulip:     [ 0.19, 0.70, 0.88],
  rose:      [ 0.05, 1.10, 1.10],
  sunflower: [ 0.05, 1.40, 1.43],
  sakura:    [ 0.00, 1.13, 1.13],
  lily:      [ 0.05, 1.00, 1.13],
  daisy:     [ 0.05, 1.08, 1.08],
  lotus:     [-0.92, 1.23, 1.09],
  lavender:  [-1.02, 0.48, 1.14],
  orchid:    [-0.15, 1.13, 1.13],
  chrysanth: [ 0.05, 1.27, 1.29]
};

/* A little smaller than the bloom, so the flower overhangs its own shadow
   rather than sitting inside a dark halo the same size as itself. */
var SHADOW_FIT = 0.90;

function bloomShadow(f, R) {
  var box = BLOOM_BOX[f.species] || BLOOM_BOX.daisy;
  var ctx = drawingContext;

  /* p5 scales drawingContext by the pixel density, but canvas shadow offsets
     and blur are NOT touched by the transform: they are device pixels. Both
     therefore have to be multiplied by the density by hand, or the shadow
     lands in the wrong place and comes out half as soft as asked for. */
  var dpr = (typeof pixelDensity === "function") ? pixelDensity() : 1;
  var FAR = 6000;                       /* far outside any canvas */

  /* CENTRED on the bloom, not dropped below it, and light. A shadow cast down
     and to the side says the light is low and hard, which is the wrong
     weather for a pastel garden: it read as a heavy smudge under every
     flower. Centred and soft it is a halo that separates the bloom from the
     grass and says nothing about the sun at all, which is what this needed to
     do in the first place. */
  ctx.save();
  ctx.shadowColor = "rgba(18,62,56,0.18)";
  ctx.shadowBlur = Math.max(6, R * 0.32) * dpr;
  ctx.shadowOffsetX = -FAR * dpr;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(FAR, box[0] * R, box[1] * R * SHADOW_FIT, box[2] * R * SHADOW_FIT,
              0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawBloom(f) {
colorMode(HSL, 360, 100, 100, 1);
noStroke();

const R     = f.size;
const hue   = f.hue;
const sat   = f.sat;
const light = f.light;
bloomShadow(f, R);

if (f.species === "tulip") {
drawTulipBloom(R, hue, sat, light);
} else if (f.species === "rose") {
drawRoseBloom(R, hue, sat, light);
} else if (f.species === "sunflower") {
drawSunflowerBloom(R, hue, sat, light);
} else if (f.species === "chrysanth") {
drawChrysanthBloom(R, hue, sat, light);
} else if (f.species === "orchid") {
drawOrchidBloom(R, hue, sat, light);
} else if (f.species === "sakura") {
drawCherryBloom(R, hue, sat, light);
} else if (f.species === "lily") {
drawLilyBloom(R, hue, sat, light);
} else if (f.species === "lotus"){
drawLotusBloom(R, hue, sat, light);
} else if (f.species === "lavender"){
drawLavenderBloom(R * 1.5, hue, sat, light);
} else {
drawDaisyBloom(R, hue, sat, light);
}

const scaleFactor = (width < 720 ? gardenScale : 1);
const labelSize = max(11, 16 * scaleFactor);

let label = f.word || "";
const maxChars = width < 720 ? 9 : 11;
let displayWord = label;

if (label.length > maxChars) {
displayWord = label.slice(0, maxChars - 1) + "…";
}

textAlign(CENTER, CENTER);
textSize(labelSize);
noStroke();

const labelY = (f.species === "lotus")    ? -f.size * 0.6
             : (f.species === "lavender") ? -(10 + f.size * 0.75)
             : 0;

const outlineSat   = sat * 0.85;
const outlineLight = light - 20;

const o = 1 * scaleFactor;

fill(hue, outlineSat, outlineLight, 0.85);
text(displayWord, -o,  labelY);
text(displayWord,  o,  labelY);
text(displayWord,  0,  labelY - o);
text(displayWord,  0,  labelY + o);
text(displayWord, -o,  labelY - o);
text(displayWord,  o,  labelY - o);
text(displayWord, -o,  labelY + o);
text(displayWord,  o,  labelY + o);

fill(0, 0, 100);
text(displayWord, 0, labelY);

colorMode(RGB);
}

function drawLeafOnStem(
x0, y0,
c1x, c1y,
c2x, c2y,
x3, y3,
t, side, len
) {
const px = bezierPoint(x0, c1x, c2x, x3, t);
const py = bezierPoint(y0, c1y, c2y, y3, t);
const tx = bezierTangent(x0, c1x, c2x, x3, t);
const ty = bezierTangent(y0, c1y, c2y, y3, t);

const stemAngle = atan2(ty, tx);

const flareDeg = 55;
const angle = stemAngle + side * flareDeg;

const scaleFactor = (width < 720 ? gardenScale : 1);

push();
translate(px, py);
rotate(angle);

const w = len * scaleFactor;
const h = len * 0.45 * scaleFactor;

noStroke();
fill(120, 210, 90);

beginShape();
vertex(0, 0);
quadraticVertex(w * 0.15, -h * 0.06,
w * 0.40, -h * 0.30);
quadraticVertex(w * 0.80, -h * 0.55,
w,        -h * 0.05);
quadraticVertex(w * 0.82,  h * 0.22,
w * 0.35,  h * 0.16);
quadraticVertex(w * 0.10,  h * 0.04,
0, 0);
endShape(CLOSE);

stroke(70, 150, 85);
strokeWeight(1.3 * scaleFactor);
line(0, 0, w * 0.9, 0);

pop();
}

function drawLeavesOnStem(x0, y0, c1x, c1y, c2x, c2y, x3, y3) {
const tAttach = 0.60;
const baseLen = 32;

const scaleFactor = (width < 720 ? gardenScale : 1);
const len = baseLen * scaleFactor;

drawLeafOnStem(x0, y0, c1x, c1y, c2x, c2y, x3, y3, tAttach, -1, len);
drawLeafOnStem(x0, y0, c1x, c1y, c2x, c2y, x3, y3, tAttach,  1, len);
}

function drawFlowerStemAndLeaves(f) {
const scaleFactor = (width < 720 ? gardenScale : 1);

const t = frameCount * 0.01 + f.phase * 0.001;

const swayNoise = swayOn
? map(noise(t), 0, 1, -1, 1) * 4
: 0;

const totalSway = swayNoise;

stroke(40, 120, 90);
strokeWeight(max(2, (f.size / 40) * 3) * scaleFactor);
noFill();

const c1x = 10;
const c1y = -f.stemLen * 0.4;
const c2x = -6;
const c2y = -f.stemLen * 0.7;
const x3  = totalSway;
const y3  = -f.stemLen;

bezier(0, 0, c1x, c1y, c2x, c2y, x3, y3);
drawLeavesOnStem(0, 0, c1x, c1y, c2x, c2y, x3, y3);
}

function drawFlowerBloom(f) {
const t = frameCount * 0.01 + f.phase * 0.001;

const swayNoise = swayOn
? map(noise(t), 0, 1, -1, 1) * 4
: 0;

const totalSway = swayNoise;

push();
translate(totalSway, -f.stemLen);
drawBloom(f);
pop();
}

// ---------------------------- GROWTH ANIMATION FUNCTIONS ----------------------------

function updateGrowthStage(f) {
if (f.growthStartTime === undefined || f.growthStartTime === 0) {
f.growthStage = GROWTH_STAGES.BLOOM;
return;
}
const elapsed = millis() - f.growthStartTime;
if (elapsed < 2000) f.growthStage = GROWTH_STAGES.BUD;
else if (elapsed < 5000) f.growthStage = GROWTH_STAGES.STEM;
else f.growthStage = GROWTH_STAGES.BLOOM;
}

function drawBud(f) {
push();
const scaleFactor = (width < 720 ? gardenScale : 1);
const budH = max(24, f.size * 0.65 * scaleFactor);

stroke(40, 120, 90);
strokeWeight(max(2, (f.size / 40) * 3) * scaleFactor);
line(0, 0, 0, -budH);

noStroke();
fill(120, 160, 80);
ellipse(0, -budH, f.size * 0.3 * scaleFactor, f.size * 0.4 * scaleFactor);

pop();
}

function drawGrowingStem(f, progress) {
push();
const scaleFactor = (width < 720 ? gardenScale : 1);
const currentStemLen = f.stemLen * progress;

stroke(40, 120, 90);
strokeWeight(max(2, (f.size / 40) * 3) * scaleFactor);
noFill();

const c1x = 10;
const c1y = -currentStemLen * 0.4;
const c2x = -6;
const c2y = -currentStemLen * 0.7;
const x3 = 0;
const y3 = -currentStemLen;

bezier(0, 0, c1x, c1y, c2x, c2y, x3, y3);

noStroke();
fill(100, 150, 70);
ellipse(x3, y3, f.size * 0.38 * scaleFactor, f.size * 0.48 * scaleFactor);

pop();
}

function drawFlowerWithGrowth(f) {
const elapsed = millis() - f.growthStartTime;
const budDuration = 2000;
const stemDuration = 3000;

if (elapsed < budDuration) {
drawBud(f);
} else if (elapsed < budDuration + stemDuration) {
const stemProgress = (elapsed - budDuration) / stemDuration;
drawGrowingStem(f, stemProgress);
} else {
drawFlowerStemAndLeaves(f);
}
}

// ---------------------------- SPARKLE FUNCTION ----------------------------

function drawNewestSparkles() {
let myFlower = null;
for (const f of flowers) {
if (!f.isMyFlower) continue;
if (f.growthStage !== GROWTH_STAGES.BLOOM) continue;
if (!myFlower || (f.createdIndex || 0) > (myFlower.createdIndex || 0)) {
myFlower = f;
}
}
if (!myFlower) return;

const age = (Date.now() - (myFlower.plantedTime || Date.now())) / 1000;
const maxAge = 60;
if (age > maxAge) return;
const alpha = map(age, maxAge * 0.6, maxAge, 1, 0, true);

const t = frameCount * 0.01 + myFlower.phase * 0.001;
const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;
const cx = myFlower.x + swayNoise;
const baseCy = myFlower.baseY - myFlower.stemLen;

let cyOffset, orbitW, orbitH;
if (myFlower.species === "lavender") {
const h = myFlower.size * 1.5;
cyOffset = -(10 + h * 0.5);
orbitW   = myFlower.size * 0.75;
orbitH   = h * 0.6;
} else if (myFlower.species === "lotus") {
cyOffset = -myFlower.size * 0.6;
orbitW   = myFlower.size * 0.85;
orbitH   = myFlower.size * 0.85;
} else {
cyOffset = 0;
orbitW   = myFlower.size * 1.4;
orbitH   = myFlower.size * 1.0;
}

const cy = baseCy + cyOffset;
const R = myFlower.size;

push();
colorMode(HSL, 360, 100, 100, 1);

const numParticles = 8;

for (let i = 0; i < numParticles; i++) {
const angle = (frameCount * 1.8 + i * (360 / numParticles)) % 360;
const wobble = sin(frameCount * 3 + i * 47) * R * 0.1;
const px = cx + cos(angle) * (orbitW + wobble);
const py = cy + sin(angle) * (orbitH + wobble);

const twinkle = map(sin(frameCount * 4 + i * 33), -1, 1, 2, 5);

const sparkHue = (i % 2 === 0) ? myFlower.hue : (myFlower.hue + 40) % 360;
const sparkLight = (i % 2 === 0) ? 95 : 80;

fill(sparkHue, 80, sparkLight, alpha);
noStroke();

push();
translate(px, py);
rotate(frameCount * 2 + i * 45);
beginShape();
for (let s = 0; s < 4; s++) {
const outerA = s * 90;
const innerA = outerA + 45;
vertex(cos(outerA) * twinkle, sin(outerA) * twinkle);
vertex(cos(innerA) * twinkle * 0.35, sin(innerA) * twinkle * 0.35);
}
endShape(CLOSE);
pop();
}

colorMode(RGB);
pop();
}

// ---------------------------- LAYER-SEPARATED DRAWING ----------------------------

function getLayerSorted(layerName) {
const layer = flowers.filter(f => f.layer === layerName);
layer.sort((a, b) => {
const aGrowing = (a.growthStage !== undefined && a.growthStage !== GROWTH_STAGES.BLOOM) ? 1 : 0;
const bGrowing = (b.growthStage !== undefined && b.growthStage !== GROWTH_STAGES.BLOOM) ? 1 : 0;
if (aGrowing !== bGrowing) return aGrowing - bGrowing;
const aBloomY = a.baseY - a.stemLen;
const bBloomY = b.baseY - b.stemLen;
return aBloomY - bBloomY;
});
return layer;
}

// Bloomed stems, drawn BEFORE their hill so the hill hides the base
function drawFlowersStemsOnly(layerName) {
const layer = getLayerSorted(layerName);
for (const f of layer) {
updateGrowthStage(f);
if (f.growthStage !== GROWTH_STAGES.BLOOM) continue;
push();
translate(f.x, f.baseY);
drawFlowerStemAndLeaves(f);
pop();
}
}

// Growing sprouts, drawn BEFORE their hill so the hill hides the base
function drawFlowersGrowingOnly(layerName) {
const layer = getLayerSorted(layerName);
for (const f of layer) {
updateGrowthStage(f);
if (f.growthStage === GROWTH_STAGES.BLOOM) continue;
push();
translate(f.x, f.baseY);
drawFlowerWithGrowth(f);
pop();
}
}

// Blooms, drawn AFTER their hill so they float above the landscape
function drawFlowersBloomsOnly(layerName) {
const layer = getLayerSorted(layerName);
for (const f of layer) {
if (f.growthStage !== GROWTH_STAGES.BLOOM) continue;
push();
translate(f.x, f.baseY);
drawFlowerBloom(f);
pop();
}
}

function drawHoverTooltip() {
if (!hoveredFlower || !hoveredFlower.gratitude) return;

const t = frameCount * 0.01 + hoveredFlower.phase * 0.001;
const swayNoise = swayOn
? map(noise(t), 0, 1, -1, 1) * 4
: 0;
const totalSway = swayNoise;

const flowerX = hoveredFlower.x + totalSway;
const flowerY = hoveredFlower.baseY - hoveredFlower.stemLen;

push();
textSize(14);
const boxPadding = 12;
const lineHeight = 18;
const maxWidth = 250;

const words = hoveredFlower.gratitude.split(" ");
let lines = [];
let currentLine = "";

for (let word of words) {
let testLine = currentLine + word + " ";
if (textWidth(testLine) > maxWidth - boxPadding * 2) {
lines.push(currentLine.trim());
currentLine = word + " ";
} else {
currentLine = testLine;
}
}
if (currentLine.trim().length > 0) lines.push(currentLine.trim());

const boxWidth = min(textWidth(hoveredFlower.gratitude) + boxPadding * 2, maxWidth);
const boxHeight = boxPadding * 2 + lines.length * lineHeight;

let tooltipX = flowerX - boxWidth / 2;
let tooltipY = flowerY - hoveredFlower.size * 1.5 - boxHeight - 5;

tooltipX = constrain(tooltipX, 10, width - boxWidth - 10);
tooltipY = constrain(tooltipY, 10, height - boxHeight - 10);

fill(255, 255, 255, 240);
noStroke();
rect(tooltipX, tooltipY, boxWidth, boxHeight, 8);

fill(0);
textAlign(LEFT, BOTTOM);
const startY = tooltipY + boxHeight - boxPadding;

for (let i = lines.length - 1; i >= 0; i--) {
const yPos = startY - (lines.length - 1 - i) * lineHeight;
text(lines[i], tooltipX + boxPadding, yPos);
}

pop();
}

// ---------------------------- SPECIES PREVIEW DRAWING FUNCTIONS ----------------------------
function drawPreviewStemAndLeaves(pg) {
const c1x = 5;
const c1y = -24;
const c2x = -3;
const c2y = -44;
const x3 = 0;
const y3 = -52;

const leafSlots = [
{ t: 0.4, side: -1 },
{ t: 0.7, side: 1 }
];

pg.colorMode(RGB, 255);

for (const slot of leafSlots) {
const { t, side } = slot;

const px = pg.bezierPoint(0, c1x, c2x, x3, t);
const py = pg.bezierPoint(0, c1y, c2y, y3, t);
const tx = pg.bezierTangent(0, c1x, c2x, x3, t);
const ty = pg.bezierTangent(0, c1y, c2y, y3, t);

const stemAngle = pg.atan2(ty, tx);
const flare = side * 35;
const outwardAngle = stemAngle + flare;
const aimUp = pg.lerp(outwardAngle, -80, 0.35);

pg.push();
pg.translate(px, py);
pg.rotate(aimUp);
if (side < 0) pg.scale(-1, 1);

const len = 20;
const baseOffset = 1;
const baseWidth = 1;

pg.noStroke();
pg.fill(120, 210, 90);

pg.beginShape();
pg.vertex(baseWidth, baseOffset);
pg.quadraticVertex(len * 0.10 + baseWidth, -len * 0.05 + baseOffset,
len * 0.30, -len * 0.35 + baseOffset);
pg.quadraticVertex(len * 0.10, -len * 0.80 + baseOffset,
0, -len + baseOffset);
pg.quadraticVertex(-len * 0.10, -len * 0.80 + baseOffset,
-len * 0.30, -len * 0.35 + baseOffset);
pg.quadraticVertex(-len * 0.10 -baseWidth, -len * 0.05 + baseOffset,
baseWidth, baseOffset);
pg.endShape(CLOSE);
pg.stroke(70, 150, 85);
pg.strokeWeight(1);
pg.line(0, baseOffset, 0, -len + baseOffset);

pg.pop();
}
}

function drawTulipPreview(pg, R, hue, sat, light) {
pg.noStroke();
const Rt = R * 1.15;
pg.fill(hue, sat, light, 0.95);
pg.ellipse(0, Rt * 0.25, Rt * 1.05, Rt * 1.1);
pg.beginShape();
pg.vertex(-Rt * 0.52, Rt * 0.10);
pg.bezierVertex(-Rt * 0.52, -Rt * 0.10,
-Rt * 0.40, -Rt * 0.40,
-Rt * 0.22, -Rt * 0.60);
pg.vertex(0, -Rt * 0.40);
pg.vertex(Rt * 0.22, -Rt * 0.60);
pg.bezierVertex(Rt * 0.40, -Rt * 0.40,
Rt * 0.52, -Rt * 0.10,
Rt * 0.52, Rt * 0.10);
pg.endShape(pg.CLOSE);
pg.fill(hue, sat * 0.8, light + 12, 0.4);
pg.ellipse(0, Rt * 0.05, Rt * 0.7, Rt * 0.9);
}

function drawRosePreview(pg, R, hue, sat, light) {
pg.push();
pg.colorMode(pg.HSL, 360, 100, 100, 1);
pg.angleMode(pg.DEGREES);
pg.noStroke();
function petal(rotation, distance, w, h, sMod, lMod) {
pg.push();
pg.rotate(rotation);
pg.translate(0, -distance);
pg.fill(hue, sat * sMod, light + lMod, 1);

const width  = w;
const height = h;

pg.beginShape();
pg.vertex(0, 12);
pg.bezierVertex(-width / 3.2, 5,
-width / 1.4, -height / 3.5,
-width / 4.5, -height * 0.75);
pg.bezierVertex(-width / 12, -height * 0.82,
width / 12,  -height * 0.82,
width / 4.5, -height * 0.75);
pg.bezierVertex(width / 1.4,  -height / 3.5,
width / 3.2,  5,
0,            12);
pg.endShape(pg.CLOSE);

pg.pop();
}

const scaleAmount = R / 70;
pg.push();
pg.scale(scaleAmount, scaleAmount);
for (let i = 0; i < 8; i++) petal(i * 45, 35, 75, 44, 1.0, -10);
for (let i = 0; i < 8; i++) petal(i * 45 + 22.5, 26, 65, 38, 0.95, -5);
for (let i = 0; i < 6; i++) petal(i * 60 + 15, 18, 52, 32, 0.9, 0);
for (let i = 0; i < 5; i++) petal(i * 72 + 20, 11, 40, 26, 0.85, 5);
for (let i = 0; i < 5; i++) petal(i * 72 + 56, 6, 30, 22, 0.8, 10);
pg.fill(hue, sat, light - 10); pg.circle(0, 0, 24);
pg.fill(hue, sat * 0.95, light - 5); pg.circle(0, 0, 19);
pg.fill(hue, sat * 0.9, light); pg.circle(0, 0, 14);
pg.fill(hue, sat * 0.85, light + 5); pg.circle(0, 0, 9);
pg.fill(hue, sat * 0.8, light + 10); pg.circle(0, 0, 5);
pg.pop();
pg.pop();
}

function drawSunflowerPreview(pg, R, hue, sat, light) {
pg.noStroke();
pg.colorMode(pg.HSL, 360, 100, 100, 1);
const petals = 18;
const w = R * 0.45;
const h = R * 1.25;
for (let i = 0; i < petals; i++) {
pg.push();
pg.rotate(i * 20);
pg.fill(hue, sat * 0.95, light + 6, 0.9);
pg.ellipse(0, -R * 0.7, w, h);

pg.pop();
}
pg.fill(28, 45, 42);
pg.circle(0, 0, R * 1.35);
pg.fill(23, 40, 58);
pg.circle(0, 0, R * 1.05);
pg.colorMode(pg.RGB);
}

function drawCherryBlossomPreview(pg, R, hue, sat, light) {
pg.noStroke();
const Rb = R * 1.7;
for (let i = 0; i < 5; i++) {
const angle = i * 72;
pg.push();
pg.rotate(angle);
pg.fill(hue, sat * 0.8, light + 15, 0.85);
pg.beginShape();
pg.vertex(0, -Rb * 0.65);
pg.bezierVertex(Rb * 0.28, -Rb * 0.52,
Rb * 0.40, -Rb * 0.20,
Rb * 0.28, 0);
pg.bezierVertex(Rb * 0.18, Rb * 0.12,
0, Rb * 0.18,
-Rb * 0.18, Rb * 0.12);
pg.bezierVertex(-Rb * 0.28, 0,
-Rb * 0.40, -Rb * 0.20,
-Rb * 0.28, -Rb * 0.52);
pg.endShape(pg.CLOSE);

pg.pop();
}
pg.fill(hue, sat * 0.6, light - 5);
pg.circle(0, 0, Rb * 0.24);
}

function drawLilyPreview(pg, R, hue, sat, light) {
pg.noStroke();
const Rl = R * 1.08;
const petals = 6;
for (let i = 0; i < petals; i++) {
const a = i * (360 / petals);
pg.push();
pg.rotate(a);
pg.fill(hue, sat * 0.85, light + 8, 0.9);
pg.beginShape();
pg.vertex(0, -Rl * 1.0);
pg.bezierVertex(Rl * 0.30, -Rl * 0.72,
Rl * 0.42, -Rl * 0.30,
Rl * 0.22, Rl * 0.04);
pg.bezierVertex(Rl * 0.12, Rl * 0.20,
0, Rl * 0.26,
-Rl * 0.12, Rl * 0.20);
pg.bezierVertex(-Rl * 0.22, Rl * 0.04,
-Rl * 0.42, -Rl * 0.30,
-Rl * 0.30, -Rl * 0.72);
pg.endShape(pg.CLOSE);

pg.pop();
}
pg.fill(hue, sat * 0.65, light - 5);
pg.circle(0, 0, Rl * 0.36);
pg.fill(hue, sat * 0.45, light + 10);
pg.circle(0, 0, Rl * 0.20);
}

function drawDaisyPreview(pg, R, hue, sat, light) {
pg.noStroke();
const petals = 16;
const cfg = speciesShapeCfg("daisy");
const Rd = R * 0.8;
const wBase = Rd * cfg.w;
const hBase = Rd * cfg.h;
for (let i = 0; i < petals; i++) {
const a = i * (360 / petals);
pg.push();
pg.rotate(a);
pg.fill(hue, sat * 0.9, light + 10, 0.85);
pg.ellipse(0, -Rd * 0.7, wBase, hBase);

pg.pop();
}

pg.fill(50, 80, 70);
pg.circle(0, 0, Rd * 0.5);
pg.fill(45, 70, 75);
pg.circle(0, 0, Rd * 0.35);
}

// ===== LOTUS PREVIEW =====
function drawLotusPreview(pg, R, hue, sat, light) {
pg.push();
pg.noStroke();
const Rd = R;

let drawPetal = (x, y, scX, scY, rot, c) => {
pg.push();
pg.translate(x, y);
pg.rotate(rot);
pg.scale(scX, scY);
pg.fill(c);
pg.beginShape();
pg.vertex(0, 0);
pg.bezierVertex(Rd * 0.5, Rd * -0.5, Rd * 0.5, Rd * -1.5, 0, Rd * -2);
pg.bezierVertex(-Rd * 0.5, Rd * -1.5, -Rd * 0.5, Rd * -0.5, 0, 0);
pg.endShape(CLOSE);
pg.pop();
};

let col = pg.color(hue, sat, light, 0.8);

drawPetal(0, 0, 0.9, 1, 0, col);
drawPetal(0, 0, 0.9, 0.75, -50, col);
drawPetal(0, 0, 0.9, 0.75, 50, col);
drawPetal(0, 0, 0.9, 0.9, -30, col);
drawPetal(0, 0, 0.9, 0.9, 30, col);
drawPetal(0, 0, 0.9, 1, 0, col);
pg.pop();
}

// ===== LAVENDER PREVIEW =====
function drawOrchidPreview(pg, R, hue, sat, light) {
pg.push();
pg.noStroke();
const Ro = R * 1.28;
const lobe = (ang, len, wid, sa, li, al, pinch) => {
pg.push();
pg.rotate(ang + 90);
pg.fill(hue, sa, li, al);
pg.beginShape();
pg.vertex(0, 0);
pg.bezierVertex(wid, -len * (pinch || 0.22), wid, -len * 0.82, 0, -len);
pg.bezierVertex(-wid, -len * 0.82, -wid, -len * (pinch || 0.22), 0, 0);
pg.endShape(pg.CLOSE);
pg.pop();
};
lobe(-90, Ro * 1.00, Ro * 0.31, sat * 0.72, light + 13, 0.92);
lobe( 42, Ro * 0.94, Ro * 0.31, sat * 0.72, light + 13, 0.92);
lobe(138, Ro * 0.94, Ro * 0.31, sat * 0.72, light + 13, 0.92);
lobe(-40,  Ro * 0.95, Ro * 0.60, sat * 0.85, light + 19, 0.96, 0.30);
lobe(-140, Ro * 0.95, Ro * 0.60, sat * 0.85, light + 19, 0.96, 0.30);
lobe( 62, Ro * 0.44, Ro * 0.20, sat + 12, light - 8,  1);
lobe(118, Ro * 0.44, Ro * 0.20, sat + 12, light - 8,  1);
lobe( 90, Ro * 0.52, Ro * 0.26, sat + 18, light - 15, 1, 0.34);
pg.fill(hue, sat * 0.35, light + 26, 1);
pg.ellipse(0, Ro * 0.05, Ro * 0.13, Ro * 0.19);
pg.pop();
}

function drawChrysanthPreview(pg, R, hue, sat, light) {
pg.push();
pg.noStroke();
const Rm = R * 1.12;
const rings = [
{ n: 18, r: 0.92, pw: 0.23, ph: 0.32, dl: -9, a: 0.95 },
{ n: 16, r: 0.70, pw: 0.21, ph: 0.29, dl: -3, a: 1 },
{ n: 12, r: 0.49, pw: 0.19, ph: 0.26, dl:  4, a: 1 },
{ n: 8,  r: 0.27, pw: 0.17, ph: 0.23, dl: 10, a: 1 }
];
for (let ri = 0; ri < rings.length; ri++) {
const ring = rings[ri];
for (let i = 0; i < ring.n; i++) {
pg.push();
pg.rotate(i * (360 / ring.n) + ri * 11);
pg.fill(hue, sat, light + ring.dl, ring.a);
pg.ellipse(0, -Rm * ring.r, Rm * ring.pw, Rm * ring.ph);
pg.pop();
}
}
pg.fill(hue, sat * 0.6, light + 16, 1);
pg.circle(0, 0, Rm * 0.14);
pg.pop();
}

function drawLavenderPreview(pg, h, hue, sat, light) {
pg.push();
pg.noStroke();

let levels = 8;
let spacing = (h / levels) * 1.15;

for (let i = 0; i < levels; i++) {
let t = i / (levels - 1);

let y = -10 - i * spacing;

let pWidth = pg.lerp(14, 7, t);
let pHeight = pWidth * 1.6;
let xOffset = pg.lerp(7, 2, t);
let baseLight = pg.lerp(light - 10, light + 10, t);

pg.fill(hue, sat, baseLight - 5, 0.9);
pg.push();
pg.translate(-xOffset, y);
pg.rotate(-40);
pg.ellipse(0, 0, pWidth, pHeight);
pg.pop();

pg.fill(hue, sat, baseLight - 2, 0.9);
pg.push();
pg.translate(xOffset, y);
pg.rotate(40);
pg.ellipse(0, 0, pWidth, pHeight);
pg.pop();

if (i < levels - 1) {
pg.fill(hue, sat - 5, baseLight + 5, 0.8);
pg.push();
pg.translate(0, y - spacing * 0.45);
pg.ellipse(0, 0, pWidth * 0.65, pHeight * 0.85);
pg.pop();
}

if (i === levels - 1) {
pg.fill(hue, sat + 5, light + 15);
pg.ellipse(0, y - 10, 6, 11);
}
}
pg.pop();
}

function drawPreviewBloom(pg, speciesId, hue) {
pg.push();
pg.colorMode(HSL, 360, 100, 100, 1);
pg.noStroke();
const baseR = 30;
const scaleMap = {
daisy: 0.95,
tulip: 1.00,
rose: 0.95,
sunflower: 0.80,
lily: 0.95,
sakura: 0.95,
lotus: 0.8,
orchid: 0.95,
chrysanth: 0.95,
lavender: 0.9
};
const scale = scaleMap[speciesId] || 1.0;
const R = baseR * scale;
const sat = defaultSat(speciesId);
const light = defaultLight(speciesId);

if (speciesId === "lotus") {
pg.translate(0, R * 0.8);
drawLotusPreview(pg, R, hue, sat, light);
} else if (speciesId === "lavender") {
  pg.translate(0, R * 1.2);
  drawLavenderPreview(pg, R * 1.5, hue, sat, light);
} else if (speciesId === "tulip") {
drawTulipPreview(pg, R, hue, sat, light);
} else if (speciesId === "rose") {
drawRosePreview(pg, R, hue, sat, light);
} else if (speciesId === "sunflower") {
drawSunflowerPreview(pg, R, hue, sat, light);
} else if (speciesId === "chrysanth") {
drawChrysanthPreview(pg, R, hue, sat, light);
} else if (speciesId === "orchid") {
drawOrchidPreview(pg, R, hue, sat, light);
} else if (speciesId === "sakura") {
drawCherryBlossomPreview(pg, R, hue, sat, light);
} else if (speciesId === "lily") {
drawLilyPreview(pg, R, hue, sat, light);
} else {
drawDaisyPreview(pg, R, hue, sat, light);
}

pg.colorMode(RGB);
pg.pop();
}

function drawSpeciesPreviews() {
const isNarrow = windowWidth <= 768;

speciesList.forEach(sp => {
const holder = speciesButtons[sp.id]?.holder;
if (!holder) return;

holder.elt.innerHTML = "";

const pgW = isNarrow ? 70 : 140;
const pgH = isNarrow ? 76 : 100;
const pg = createGraphics(pgW, pgH);

pg.angleMode(DEGREES);
pg.pixelDensity(1);
pg.colorMode(RGB, 255);
pg.clear();

pg.push();
const centerY = isNarrow ? pg.height * 0.52 : pg.height / 2;
pg.translate(pg.width / 2, centerY);
drawPreviewBloom(pg, sp.id, chosenHue);
pg.pop();

const canvas = pg.canvas;
if (canvas) {
canvas.style.display = "block";
canvas.style.width  = isNarrow ? "64px" : "120px";
canvas.style.height = isNarrow ? "52px" : "86px";
canvas.style.margin = "6px auto 4px auto";
canvas.style.pointerEvents = "none";
canvas.style.objectFit = "contain";
holder.elt.appendChild(canvas);
}
});
}

function updateConfirmPreview() {
  const meaningDiv = select("#confirm-meaning");
  if (meaningDiv) {
    const sp = speciesList.find(x => x.id === chosenSpecies);
    meaningDiv.html(sp ? sp.name + " : " + sp.meaning : "");
  }
  const holder = select("#confirm-preview");
  if (!holder) return;
  holder.elt.innerHTML = "";
  const pg = createGraphics(140, 140);
  pg.angleMode(DEGREES);
  pg.pixelDensity(1);
  pg.colorMode(RGB, 255);
  pg.clear();
  pg.push();
  pg.translate(pg.width / 2, pg.height / 2);
  drawPreviewBloom(pg, chosenSpecies, chosenHue);
  pg.pop();
  const canvas = pg.canvas;
  if (canvas) {
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.objectFit = "contain";
    holder.elt.appendChild(canvas);
  }
}

function rebalanceRowsForNarrowScreens() {
if (!flowers || !flowers.length) return;
if (width >= 720) return;

const baseMaxPerRow = 9;
const comfyTotal    = baseMaxPerRow * 3;

const total = flowers.length;

const ordered = [...flowers].sort((a, b) => {
const ai = (a.createdIndex !== undefined) ? a.createdIndex : 0;
const bi = (b.createdIndex !== undefined) ? b.createdIndex : 0;
return ai - bi;
});

let rowCapacity;
if (total <= comfyTotal) {
rowCapacity = baseMaxPerRow;
} else {
rowCapacity = Math.ceil(total / 3);
}

const frontLimit = Math.min(total, rowCapacity);
const midLimit   = Math.min(Math.max(total - frontLimit, 0), rowCapacity);

gardenScale = 1;
if (total > comfyTotal) {
gardenScale = comfyTotal / total;
gardenScale = constrain(gardenScale, 0.75, 1);
}

const baseBands = {
front: { min: 0.16, max: 0.24 },
mid:   { min: 0.22, max: 0.32 },
back:  { min: 0.28, max: 0.38 }
};

const stemCompress = map(gardenScale, 0.75, 1, 0.75, 1);

ordered.forEach((f, i) => {
let layer;
if (i < frontLimit) layer = "front";
else if (i < frontLimit + midLimit) layer = "mid";
else layer = "back";

f.layer = layer;

const b = baseBands[layer] || baseBands.front;
const band = {
min: b.min * stemCompress,
max: b.max * stemCompress
};

if (f.baseStemNorm == null) {
f.baseStemNorm = random(band.min, band.max);
}
if (f.stemJitter == null) {
f.stemJitter = random(-0.01, 0.01);
}

let stemNorm = f.baseStemNorm + f.stemJitter;
stemNorm = constrain(stemNorm, band.min, band.max);

f.stemNorm = stemNorm;
f.stemLen  = f.stemNorm * height;

if (f.baseSizeNorm == null) {
const defaultSizePx = f.size || (height * 0.045);
f.baseSizeNorm = defaultSizePx / height;
}

let sizeNorm = f.baseSizeNorm * map(gardenScale, 0.75, 1, 0.85, 1);
sizeNorm = max(sizeNorm, 0.026);

f.sizeNorm = sizeNorm;
f.size     = f.sizeNorm * height;
});
}

function spreadFlowersHorizontallyForNarrowScreens() {
if (!flowers || !flowers.length) return;
if (width >= 720) return;

const leftMargin = 40;
const rightMargin = 40;
const usable = max(40, width - leftMargin - rightMargin);

["front", "mid", "back"].forEach(layerName => {
const row = flowers.filter(f => f.layer === layerName);
const n = row.length;
if (n === 0) return;

row.sort((a, b) => {
const ai = (a.createdIndex !== undefined) ? a.createdIndex : a.x;
const bi = (b.createdIndex !== undefined) ? b.createdIndex : b.x;
return ai - bi;
});

for (let i = 0; i < n; i++) {
const t = (n === 1) ? 0.5 : i / (n - 1);
const targetX = leftMargin + t * usable;

row[i].x = targetX;
}

});
}

function updateResponsiveFlowerLayout() {
if (!flowers || !flowers.length) return;

const groundY = height * 0.76;

for (const f of flowers) {
if (f.layer !== "front" && f.layer !== "mid" && f.layer !== "back") {
f.layer = "front";
}

if (f.xNorm == null || f.xNorm <= 0 || f.xNorm > 1.2) {
f.xNorm = (f.x || random(50, width - 50)) / width;
}
if (f.stemNorm == null) f.stemNorm = f.stemLen / BASE_H;
if (f.sizeNorm == null) f.sizeNorm = f.size / BASE_H;

f.x       = f.xNorm * width;
f.stemLen = f.stemNorm * height;
f.size    = f.sizeNorm * height;

let baseY = groundY;

if (f.layer === "mid") {
baseY = groundY - height * 0.06;
} else if (f.layer === "back") {
baseY = groundY - height * 0.10;
}

f.baseY = baseY;
}
if (width < 720) {
  const maxStemForWidth = width * 0.45;
  if (f.stemLen > maxStemForWidth) {
    f.stemLen = maxStemForWidth;
  }
}

rebalanceRowsForNarrowScreens();
spreadFlowersHorizontallyForNarrowScreens();
}

function resizeGardenCanvas() {
resizeCanvas(windowWidth, windowHeight);

groundLevel = height * 0.76;
buildClouds(true);
updateResponsiveFlowerLayout();
}

// ----------------------------------------------------------------------------------------
let canvas;

function setup() {
buildUI();

canvas = createCanvas(windowWidth, windowHeight);
canvas.parent("garden-wrap");
canvas.style("pointer-events", "none");
canvas.style("position", "absolute");
canvas.style("top", "0");
canvas.style("left", "0");
canvas.style("z-index", "1");
canvas.mousePressed(() => {
if (step !== "garden") return;
handleGardenPointer(mouseX, mouseY);
});

canvas.touchStarted(() => {
if (step !== "garden") return;

if (touches && touches.length > 0) {
for (let i = 0; i < touches.length; i++) {
const t = touches[i];
handleGardenPointer(t.x, t.y);
}
}

return false;
});

angleMode(DEGREES);
noiseSeed(9999);

resizeGardenCanvas();

initDailyGarden();
/* Already planted today: straight into the garden. Asking somebody what they
   are grateful for, letting them type it, and only then telling them they
   have already answered is the wrong order to find that out in. The check
   here is the BROWSER marker, since `username` is still empty at boot and the
   name check has nothing to match against yet. */
showStep(sharedPlantedToday("") ? "garden" : "landing");

mountJournal();

/* The other way in: signed in on a second device, so there is no marker here
   but their name is in today's room. Only ever jumps while the landing step
   is still untouched, so nobody is pulled out of a sentence they are
   part way through writing. */
if (window.GardenAccount) {
GardenAccount.onChange(function () {
const u = GardenAccount.username && GardenAccount.username();
if (!u) return;
if (step === "landing" && !gratitudeText.trim() && sharedPlantedToday(u)) {
showStep("garden");
}
});
}
}

function draw() {
if (shared && shared.flowers && flowers.length !== shared.flowers.length) {
const oldMyFlower = (myLocalFlowerIndex >= 0 && myLocalFlowerIndex < flowers.length)
? flowers[myLocalFlowerIndex] : null;

flowers = shared.flowers.map(f => ({ ...f }));

for (let i = 0; i < flowers.length; i++) {
if (flowers[i].growthStage === undefined) {
flowers[i].growthStage = GROWTH_STAGES.BLOOM;
flowers[i].growthStartTime = 0;
}
}

if (oldMyFlower) {
for (let i = 0; i < flowers.length; i++) {
if (flowers[i].createdIndex === oldMyFlower.createdIndex &&
flowers[i].word === oldMyFlower.word) {
flowers[i].growthStage = oldMyFlower.growthStage;
flowers[i].growthStartTime = oldMyFlower.growthStartTime;
flowers[i].plantedTime = oldMyFlower.plantedTime;
flowers[i].isMyFlower = true;
myLocalFlowerIndex = i;
break;
}
}
}

updateResponsiveFlowerLayout();
}

background(240);
drawSky();
drawSunGradient();
drawClouds();
/* The birds go in with the clouds, so the hills paint over them at the
   horizon exactly as they paint over a distant cloud. `drawingContext` is
   p5's own 2D context, already scaled by the pixel density, so garden-life
   draws in p5 units without knowing it is inside a sketch. */
if (window.GardenLife) GardenLife.sky(drawingContext, width, height, { horizon: height * 0.56 });

// Back row: stems + growing BEFORE hill, blooms AFTER hill
drawFlowersStemsOnly("back");
drawFlowersGrowingOnly("back");
drawHillsBack();
drawFlowersBloomsOnly("back");

// Mid row: stems + growing BEFORE hill, blooms AFTER hill
drawFlowersStemsOnly("mid");
drawFlowersGrowingOnly("mid");
drawHillsFront();
drawFlowersBloomsOnly("mid");

// Front row: stems + growing BEFORE hill, blooms AFTER hill
drawGround();
drawFlowersStemsOnly("front");
drawFlowersGrowingOnly("front");
drawForegroundHill();
drawFlowersBloomsOnly("front");

maybeSnapshot();

// Sparkles on top of everything
/* The butterflies and the motes go on LAST, over the flowers and over the
   labels, because they are in the air in front of the garden. They stay
   under drawNewestSparkles so the burst that fires when a flower is planted
   is still the brightest thing on screen. */
if (window.GardenLife) GardenLife.meadow(drawingContext, width, height, { horizon: height * 0.56 });

drawNewestSparkles();

if (isSaving) {
drawSavedMessageBox();
return;
}

if (step === "garden") {
drawOverlayControls();

if (!isTouchDevice) {
checkHover();
}

if (hoveredFlower) {
drawHoverTooltip();
}
}
}

/* ONE FLOWER A DAY, the same rule the personal garden has always had.
   Without it one person can fill the meadow on their own, and a shared garden
   that is mostly one voice is not shared.

   Two checks, because neither is enough alone. The ROOM is the honest one:
   today's flowers are right there in `shared.flowers`, so a name that has
   already planted is visible to everybody and cannot be hidden by clearing
   anything. The BROWSER marker catches the same person typing a fresh name,
   which the room cannot see.

   Neither is airtight, and that is the accepted cost of a garden anyone can
   plant in without an account: somebody determined can clear their storage
   and type a new name. The alternative was to require an account to plant at
   all, which was considered and turned down, because being able to try this
   in ten seconds is the point of the page. */
const SHARED_DAY_KEY = "gg_shared_last_planted";

function sharedPlantedToday(name) {
  try {
    if (localStorage.getItem(SHARED_DAY_KEY) === roomKey) return "browser";
  } catch (e) {}

  const n = String(name || "").trim().toLowerCase();
  if (n && shared && Array.isArray(shared.flowers)) {
    for (let i = 0; i < shared.flowers.length; i++) {
      if (String(shared.flowers[i].word || "").trim().toLowerCase() === n) return "name";
    }
  }
  return null;
}

function markSharedPlanted() {
  try { localStorage.setItem(SHARED_DAY_KEY, roomKey); } catch (e) {}
}

/* Runs whenever the username step is shown or the name is typed, so somebody
   is told BEFORE they pick a flower rather than after. */
function refreshUsernameStep() {
  if (!usernameNote || !usernameContinueBtn) return;
  const why = sharedPlantedToday(username);
  if (!why) {
    usernameContinueBtn.html("Continue to Flower Selection");
    if (window.applyAccountUsername) window.applyAccountUsername();
    else usernameNote.html("");
    return;
  }
  usernameNote.html(why === "name"
    ? "That name has already planted today. The garden takes one flower a day from each person, and it starts fresh tomorrow."
    : "You have planted today. The garden takes one flower a day, and it starts fresh tomorrow.");
  usernameContinueBtn.html("See today's garden");
}

function todayStr() {
const d = new Date();
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");
return `${y}-${m}-${day}`;
}

function initDailyGarden() {
  if (partyIsHost()) {
    if (!shared.flowers) {
      partySetShared(shared, { flowers: [] });
    }
  }

  if (partyIsHost()) {
  shared.flowers = shared.flowers.filter(f => f.word !== "");
  flowers = shared.flowers.map(f => ({ ...f }));
}
  
  const arr = shared.flowers || [];
  // Make a local copy for this device only
  flowers = arr.map(f => ({ ...f }));

  updateResponsiveFlowerLayout();
}

function drawUserMessageForPNG(flower) {
if (!flower) return;

push();
textSize(18);
textAlign(CENTER, TOP);
noStroke();

const padding = 14;
const lineHeight = 22;
const maxWidth = 320;

const words = flower.gratitude.split(" ");
let lines = [];
let current = "";

for (let w of words) {
let test = current + w + " ";
if (textWidth(test) > maxWidth - padding * 2) {
lines.push(current.trim());
current = w + " ";
} else {
current = test;
}
}
if (current.trim().length > 0) lines.push(current.trim());

const boxW = maxWidth;
const boxH = padding * 2 + lines.length * lineHeight;

const x = width - boxW - 30;
const y = height - boxH - 140;

fill(255, 255, 255, 240);
rect(x, y, boxW, boxH, 10);

fill(0);
let ty = y + padding;
for (let line of lines) {
text(line, x + boxW / 2, ty);
ty += lineHeight;
}

pop();
}

function drawSavedMessageBox() {
const myFlower = getMyFlower();
if (!myFlower || !myFlower.gratitude) return;

const padding = 14;
const lineHeight = 20;

const maxBlockW = 440;
const blockW = min(width * 0.9, maxBlockW);

textSize(15);
const maxTextWidth = blockW - padding * 2;
const words = myFlower.gratitude.split(" ");
let lines = [];
let current = "";

for (let w of words) {
const test = current + w + " ";
if (textWidth(test) > maxTextWidth) {
lines.push(current.trim());
current = w + " ";
} else {
current = test;
}
}
if (current.trim().length > 0) lines.push(current.trim());
const titleH = 26;
const totalTextH = titleH + lines.length * lineHeight;

const centerX = width / 2;

const baseY = height * 0.78;

push();
colorMode(RGB);
textAlign(CENTER, TOP);
noStroke();

const label = `@${username.trim()}`;
fill(15, 81, 50);
textSize(18);
let y = baseY;
text(label, centerX, y);

y += titleH;
fill(40);
textSize(15);
for (let line of lines) {
text(line, centerX, y);
y += lineHeight;
}
pop();

const question = "What are you thankful for today?";
const invite   = "Come plant your own gratitude flower in the garden.";

push();
textAlign(CENTER, TOP);

const questionY = baseY + totalTextH + 16;

fill("#0f5132");
textSize(16);
text(question, centerX, questionY);

fill("#2f6f57");
textSize(14);
text(invite, centerX, questionY + 22);

pop();
}

function getMyFlower() {
if (!username || !flowers || !flowers.length) return null;
const myWord = username.trim().slice(0, 20);

for (let i = flowers.length - 1; i >= 0; i--) {
if (flowers[i].word === myWord) return flowers[i];
}
return null;
}

function saveGarden() {
}

function buildUI() {
const root = select("#ui-root");
const isNarrow = windowWidth <= 768;

/* Landing */
landingWrap = createDiv().id("landing-wrap").parent(root).addClass("gg-wrap");
landingWrap.style("display", "flex");
landingWrap.style("z-index", "100");
landingWrap.style("pointer-events", "auto");

const card = createDiv().addClass("gg-card").parent(landingWrap);
createElement("h1", "The Shared Garden").addClass("gg-title").parent(card);
createP("Type one thing you are grateful for, plant it, and see your flower bloom!")
.addClass("gg-sub")
.parent(card);

gratitudeField = createElement("textarea").parent(card);
gratitudeField.attribute("maxlength", "100");
gratitudeField.attribute("placeholder", "I am grateful for...");
gratitudeField.style("width", "100%");
gratitudeField.style("box-sizing", "border-box");
gratitudeField.style("border", "2px solid #bde0d6");
gratitudeField.style("border-radius", "12px");
gratitudeField.style("height", "110px");
gratitudeField.style("padding", "18px 16px 16px 16px");
gratitudeField.style("font-size", "16px");
gratitudeField.style("resize", "vertical");
gratitudeField.style("pointer-events", "auto");
gratitudeField.input(() => {
gratitudeText = gratitudeField.elt.value;
charCount.html(`${gratitudeText.length}/100`);
});

charCount = createP("0/100").style("text-align", "right").parent(card);
continueBtn = createButton("Continue to Username").addClass("gg-btn").parent(card);
continueBtn.mousePressed(() => {
if (!gratitudeText.trim()) return;
showStep("username");
});

/* Username */
usernameWrap = createDiv().id("username-wrap").parent(root).addClass("gg-wrap");
usernameWrap.style("z-index", "100");
usernameWrap.style("pointer-events", "auto");

const usernameCard = createDiv().addClass("gg-card").parent(usernameWrap);

createElement("h2", "Choose Your Username").addClass("gg-title").parent(usernameCard);
createP("Your chosen name will appear on your flower in the garden")
.addClass("gg-sub")
.parent(usernameCard);

usernameField = createElement("textarea").parent(usernameCard);
usernameField.attribute("maxlength", "20");
usernameField.attribute("placeholder", "Enter your name or nickname...");
usernameField.attribute("rows", "1");
usernameField.style("width", "100%");
usernameField.style("box-sizing", "border-box");
usernameField.style("border", "2px solid #bde0d6");
usernameField.style("border-radius", "12px");
usernameField.style("height", "110px");
usernameField.style("padding", "18px 16px 16px 16px");
usernameField.style("font-size", "16px");
usernameField.style("margin-bottom", "20px");
usernameField.style("resize", "none");
usernameField.style("pointer-events", "auto");
usernameField.input(() => {
username = usernameField.elt.value;
refreshUsernameStep();
});

usernameNote = createP("").parent(usernameCard);
usernameNote.style("font-size", "13px");
usernameNote.style("color", "#2c7a7b");
usernameNote.style("margin", "-12px 0 14px");
usernameNote.style("text-align", "left");

/* Signed in, the name is the account's and cannot be edited, so a flower in
   the meadow is traceable to a real account rather than to whoever typed that
   word today. Signed out, the free text box works exactly as it always has,
   which is what keeps the shared garden something anyone can try without an
   account. */
window.applyAccountUsername = function () {
if (!usernameField) return;
const acc = window.GardenAccount;
const u = (acc && acc.isLive() && acc.username()) || "";
if (u) {
username = u;
usernameField.elt.value = u;
usernameField.elt.readOnly = true;
usernameField.style("background", "#f1f8f7");
usernameField.style("color", "#5a8f8d");
usernameNote.html("Signed in as " + u + ", so your flower carries this name.");
if (typeof sharedPlantedToday === "function" && sharedPlantedToday(u)) refreshUsernameStep();
} else {
usernameField.elt.readOnly = false;
usernameField.style("background", "#ffffff");
usernameField.style("color", "#1d6466");
usernameNote.html("");
}
};
if (window.GardenAccount) GardenAccount.onChange(window.applyAccountUsername);
else window.applyAccountUsername();

usernameContinueBtn = createButton("Continue to Flower Selection")
.addClass("gg-btn")
.parent(usernameCard);
usernameContinueBtn.mousePressed(() => {
if (!username.trim()) return;
/* Already planted: this button shows the garden instead of the picker. */
if (sharedPlantedToday(username)) { showStep("garden"); return; }
showStep("select");
drawSpeciesPreviews();
});

const backBtn1 = createButton("Back").addClass("gg-back").parent(usernameCard);
backBtn1.mousePressed(() => showStep("landing"));

/* Select */
selectWrap = createDiv().id("select-wrap").parent(root).addClass("gg-wrap");
selectWrap.style("z-index", "100");
selectWrap.style("pointer-events", "auto");
selectWrap.style("padding", isNarrow ? "10px 8px 8px" : "20px 12px");
selectWrap.style("align-items", "center");

const selectCard = createDiv().addClass("gg-card").parent(selectWrap);
selectCard.style("box-sizing", "border-box");
selectCard.style("width", isNarrow ? "96vw" : "540px");
selectCard.style("max-width", isNarrow ? "540px" : "640px");
selectCard.style("display", "flex");
selectCard.style("flex-direction", "column");
selectCard.style("justify-content", "flex-start");
selectCard.style("max-height", isNarrow ? "calc(100dvh - 40px)" : "calc(100vh - 60px)");

if (isNarrow) {
selectCard.style("padding", "34px 22px 28px");
} else {
selectCard.style("padding", "26px 24px 18px");
}

const titleText = isNarrow ? "Choose Your\nFlower" : "Choose Your Flower";
const selectTitle = createElement("h2", titleText)
.addClass("gg-title")
.parent(selectCard);

selectTitle.style("text-align", "center");
if (isNarrow) {
selectTitle.style("font-size", "34px");
selectTitle.style("line-height", "1.2");
selectTitle.style("text-align", "center");
selectTitle.style("max-width", "320px");
selectTitle.style("margin", "0 auto 24px auto");
} else {
selectTitle.style("margin", "0 0 8px 0");
}

const selectSub = createP("Pick a flower and a color. Each one stands for something.")
.addClass("gg-sub")
.parent(selectCard);
selectSub.style("margin", "4px 0 16px 0");
selectSub.style("text-align", "center");
selectSub.style("color", "#1f7460");

const grid = createDiv().addClass("gg-grid").parent(selectCard);
grid.style("flex", "1 1 auto");
if (isNarrow) {
grid.style("gap", "10px");
grid.style("margin-top", "6px");
} else {
grid.style("margin-top", "12px");
}

speciesList.forEach(sp => {
const tile = createDiv().addClass("gg-tile").parent(grid);
tile.style("pointer-events", "auto");
tile.style("overflow", "visible");

const holder = createDiv().addClass("preview-holder").parent(tile);
holder.style("overflow", "visible");

if (isNarrow) {
tile.style("padding", "2px 2px 4px 2px");
tile.style("min-height", "76px");
holder.style("height", "34px");
holder.style("width", "70px");
} else {
holder.style("height", "100px");
holder.style("width", "140px");
}
holder.style("display", "flex");
holder.style("align-items", "center");
holder.style("justify-content", "center");

const nameSpan = createSpan(sp.name).parent(tile);
nameSpan.style("font-weight", "700");
nameSpan.style("margin-top", "4px");
nameSpan.style("text-align", "center");
nameSpan.style("width", "100%");
nameSpan.style("color", "#0f5132");
if (isNarrow) {
nameSpan.style("font-size", "14px");
}

const meaningSpan = createSpan(sp.meaning).addClass("gg-tile-meaning").parent(tile);
meaningSpan.style("text-align", "center");
meaningSpan.style("width", "100%");
meaningSpan.style("color", "#2c7a7b");
meaningSpan.style("line-height", "1.2");
meaningSpan.style("font-size", isNarrow ? "9px" : "11px");
tile.mousePressed(() => {
  chosenSpecies = sp.id;
  showStep("confirm");
});

speciesButtons[sp.id] = { tile, holder };
});
const backBtnSelect = createButton("Back")
.addClass("gg-back")
.parent(selectCard);
backBtnSelect.mousePressed(() => showStep("username"));
backBtnSelect.style("margin-top", "8px");

/* Confirm / Customize Color */
const confirmWrap = createDiv().id("confirm-wrap").parent(root).addClass("gg-wrap");
confirmWrap.style("z-index", "100");
confirmWrap.style("pointer-events", "auto");
confirmWrap.style("display", "none");
/* No wash over the viewport. At 85 percent opaque this hid the sky, hills and
   ground behind it, so the garden appeared to vanish the moment you reached
   the colour step. Every other step leaves the wrap transparent and lets its
   card stand on the scene, and the card carries its own background. */

const confirmCard = createDiv().addClass("gg-card").parent(confirmWrap);
confirmCard.style("box-sizing", "border-box");
confirmCard.style("width", isNarrow ? "96vw" : "420px");
confirmCard.style("max-width", "420px");
confirmCard.style("padding", "28px 24px");
confirmCard.style("text-align", "center");

createElement("h2", "Your Flower").addClass("gg-title").style("font-size", "28px").style("margin-bottom", "8px").parent(confirmCard);

/* The same line the personal garden puts under its heading, species then what
   it stands for, so the meaning is still in front of you at the colour step
   and not only back on the grid where you picked it. */
const confirmMeaning = createDiv().id("confirm-meaning").parent(confirmCard);
confirmMeaning.style("text-align", "center");
confirmMeaning.style("font-size", "13px");
confirmMeaning.style("color", "#2c7a7b");
confirmMeaning.style("font-style", "italic");
confirmMeaning.style("margin-bottom", "4px");

const confirmPreviewHolder = createDiv().id("confirm-preview").parent(confirmCard);
confirmPreviewHolder.style("width", "140px");
confirmPreviewHolder.style("height", "140px");
confirmPreviewHolder.style("margin", "12px auto");

const confirmColorLabel = createP("Choose your flower color:").parent(confirmCard);
confirmColorLabel.style("font-size", "14px");
confirmColorLabel.style("color", "#0f5132");
confirmColorLabel.style("margin", "12px 0 8px 0");

const confirmSlider = createSlider(0, 360, chosenHue);
confirmSlider.parent(confirmCard);
confirmSlider.addClass("gg-hue-slider");
confirmSlider.style("width", "100%");
confirmSlider.style("pointer-events", "auto");
confirmSlider.style("margin-bottom", "16px");
const confirmSliderEl = confirmSlider.elt;
confirmSliderEl.style.background = "linear-gradient(90deg,#f7a9a8,#f4e98c,#9be4a5,#8dd7f5,#c9a4f9,#f79ad3,#f7a9a8)";
confirmSliderEl.style.borderRadius = "999px";
confirmSlider.input(() => {
  chosenHue = confirmSlider.value();
  updateConfirmPreview();
});

const plantBtn = createButton("Plant in Garden").addClass("gg-btn").parent(confirmCard);
plantBtn.mousePressed(() => {
  /* Checked again here, not only at the username step. Somebody can sit on
     the picker while another tab plants, and the room is the authority. */
  if (sharedPlantedToday(username)) { showStep("garden"); return; }
  addFlower(gratitudeText, username, chosenSpecies, chosenHue);
  markSharedPlanted();
  saveGarden();
  if (window.GardenJournal) {
    GardenJournal.record("shared", {
      day: todayStr(),
      species: chosenSpecies,
      hue: Math.round(chosenHue),
      sat: Math.round(defaultSat(chosenSpecies)),
      light: Math.round(defaultLight(chosenSpecies)),
      word: username,
      note: gratitudeText
    });
  }
  showStep("garden");
});

const confirmBack = createButton("Back").addClass("gg-back").parent(confirmCard);
confirmBack.mousePressed(() => showStep("select"));

/* Garden */
gardenWrap = createDiv().id("garden-wrap").parent(root);
gardenWrap.style("pointer-events", "none");

saveBtn = createButton("").id("save-btn").parent(gardenWrap);
/* A camera, in slot 3 of the top right row of round icons: music at
   right 16, the account at 62, the journal at 108, this at 154. It was
   a labelled "Save PNG" pill, which made it the one control up there
   that was not an icon. */
saveBtn.html('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 8.5h3.2l1.4-2h7.8l1.4 2H21v10.5H3z"/><circle cx="12" cy="13.5" r="3.4"/></svg>');
/* No `title`: it would open the operating system's own tooltip on top of the
   project's hover label. `aria-label` is what a screen reader reads. */
saveBtn.attribute("aria-label", "Save a picture of your garden");
saveBtn.attribute("data-tip", "Save a picture");
saveBtn.style("display", "none");
saveBtn.style("pointer-events", "auto");
saveBtn.style("position", "fixed");
saveBtn.style("top", "20px");
saveBtn.style("right", "154px");
saveBtn.style("width", "38px");
saveBtn.style("height", "38px");
saveBtn.style("padding", "0");
saveBtn.style("border-radius", "50%");
saveBtn.style("align-items", "center");
saveBtn.style("justify-content", "center");
saveBtn.style("background", "rgba(255,249,227,0.92)");
saveBtn.style("border", "1.5px solid #b7e4e7");
saveBtn.style("color", "#1d6466");
saveBtn.style("box-shadow", "0 2px 10px rgba(29,100,102,0.14)");
saveBtn.style("cursor", "pointer");
saveBtn.style("z-index", "261");
saveBtn.mousePressed(() => {
const prevSway = swayOn;

swayOn = false;
isSaving = true;

setTimeout(() => {
saveCanvas("gratitude_garden", "png");
swayOn = prevSway;
isSaving = false;
}, 80);
});
/* The line that says the day is done, the same one the personal garden has
   carried all along. Without it, arriving straight in the garden with the
   planting steps gone says nothing about WHY they are gone, and the only
   reading left is that something failed. It is centred at the top, which on
   this page is empty: Home is top left and the four round icons are top
   right. */
dailyNote = createDiv("").id("daily-note").parent(gardenWrap);
dailyNote.style("display", "none");
dailyNote.style("position", "absolute");
/* 68, not 24. The four round icons are 38px tall at top 20, so they end at
   58, and a centred line wide enough to say this in one or two goes runs
   under them at any window width. Below them it can never collide, whatever
   the width, and the sky up there is empty either way. */
dailyNote.style("top", "68px");
dailyNote.style("left", "50%");
dailyNote.style("transform", "translateX(-50%)");
dailyNote.style("text-align", "center");
dailyNote.style("max-width", "min(88vw, 620px)");
dailyNote.style("z-index", "30");
dailyNote.style("pointer-events", "none");
dailyNote.style("font-family", "Arial, Helvetica, sans-serif");
dailyNote.style("font-size", "15px");
dailyNote.style("color", "#2c7a7b");
dailyNote.style("text-shadow", "1px 1px 0 rgba(255,255,255,0.6)");

tipsCard = createDiv().id("tips-card").parent(gardenWrap);
tipsCard.style("pointer-events", "none");
createElement("h3", "Garden Tips").style("margin-bottom", "8px").parent(tipsCard);
/* Four fragments, about five words each, and the brevity is the point: this
   card sits in the corner of a garden somebody is looking at, so it has to be
   read at a glance rather than studied. They were full sentences and ran to
   eleven words, which is a paragraph in that corner.

   What they SAY was rewritten too. Two of the originals had gone stale, since
   Save PNG is a camera in the row of icons now, and nothing anywhere said a
   flower can be liked, replied to, or looked back at by the day. */
const ul = createElement("ul").parent(tipsCard);
createElement("li", "Hover a flower for its message").parent(ul);
createElement("li", "Sign in to like or reply").parent(ul);
createElement("li", "One flower a day, resets nightly").parent(ul);
createElement("li", "Top right: music, friends, history, camera").parent(ul);
tipsCard.style("display", "none");

buildLogo();
}

function buildLogo() {
const logoImg = loadImage("LOGO-01.png", () => {

const logoDiv = createDiv();
logoDiv.id("gg-logo");
logoDiv.parent(gardenWrap);
logoDiv.style("display", "none");
logoDiv.style("position", "absolute");
logoDiv.style("width", "48px");
logoDiv.style("height", "48px");
logoDiv.style("bottom", "16px");
logoDiv.style("right", "16px");
logoDiv.style("cursor", "pointer");
logoDiv.style("z-index", "30");

let c = createImg("LOGO-01.png", "logo");
c.parent(logoDiv);
c.style("width", "100%");
c.style("height", "100%");
c.style("object-fit", "contain");
c.style("pointer-events", "none");

const tag = createDiv("linktree");
tag.parent(logoDiv);
tag.style("position", "absolute");
tag.style("bottom", "75px");
tag.style("left", "50%");
tag.style("transform", "translateX(-50%)");
tag.style("color", "#0f5132");
tag.style("font-size", "13px");
tag.style("font-weight", "500");
tag.style("pointer-events", "none");
tag.style("opacity", "0");
tag.style("transition", "opacity 0.2s ease");

logoDiv.mouseOver(() => tag.style("opacity", "1"));
logoDiv.mouseOut(() => tag.style("opacity", "0"));

logoDiv.mousePressed(() => {
window.open("https://linktr.ee/kenoijam", "_blank");
});
});
}

function showStep(s) {
  step = s;

  /* The garden is the backdrop for every step, not just the last one. This
     line was missing, so the CSS `display: none` on #garden-wrap stood at all
     times and the sky, hills and ground never appeared behind anything. The
     personal garden shows its wrap unconditionally for exactly this reason. */
  gardenWrap.style("display", "block");

  landingWrap.style("display", s === "landing" ? "flex" : "none");
  usernameWrap.style("display", s === "username" ? "flex" : "none");
  selectWrap.style("display", s === "select" ? "flex" : "none");
  select("#confirm-wrap").style("display", s === "confirm" ? "flex" : "none");
  
  if (s === "confirm") {
    updateConfirmPreview();
  }

  /* Re-checked on arrival, not only as the name is typed: the room fills up
     while somebody is still on the landing step, and a signed in name is
     filled in for them rather than typed at all. */
  if (s === "username") {
    refreshUsernameStep();
  }

if (s === "garden") {
hoveredFlower = null;
}

if (canvas) {
canvas.elt.style.pointerEvents = (s === "garden") ? "auto" : "none";
}

const hasFlower = flowers && flowers.length > 0;

if (saveBtn) {
saveBtn.style("display", step === "garden" && hasFlower ? "flex" : "none");
}
if (tipsCard) {
tipsCard.style("display", step === "garden" && hasFlower ? "block" : "none");
}
if (dailyNote) {
/* Only for somebody who has actually planted today. A visitor looking at the
   garden without having planted is being invited in, not told they are
   finished. */
const mine = !!sharedPlantedToday(username);
dailyNote.html(step === "garden" && mine
? "Your flower is planted. Enjoy today's garden, and come back tomorrow for another."
: "");
dailyNote.style("display", step === "garden" && mine ? "block" : "none");
}

const logo = select("#gg-logo");
if (logo) {
logo.style("display", step === "garden" && hasFlower ? "block" : "none");
}

loop();
}



/* -------------------------------------------------------------------------
   The journal

   Unlike the personal garden, this one has to WRITE things down. p5.party
   keys its room by the date and the demo server does not keep a room once
   its day has passed, so a past day has nothing to replay from unless it was
   recorded while it was happening. Checked: loading four past room keys
   returns objects with no `flowers` in them at all.

   Two writes: a row of your own in garden_entries, which draws your icon in
   the strip, and a snapshot of the whole meadow, which is what a past day
   actually shows. The snapshot is throttled, because the garden redraws sixty
   times a second and the room changes far less often than that.

   The icon is drawn by the preview family this sketch already owns, through a
   p5.Graphics whose canvas is blitted into the small DOM canvas the strip
   holds. An eighth copy of the flower maths would drift from the seven that
   already exist.
   ------------------------------------------------------------------------- */
let journalBuf = null;
let lastSnapshot = 0;

function paintJournalBloom(el, species, hue) {
if (!el || !el.width) return;
/* SQUARE, because the strip's slot is square and squashing a tall buffer
   into it would stretch every bloom sideways. */
if (!journalBuf) {
/* 76, and every step down to it was measured rather than chosen. This
   garden's preview draws at a fixed baseR of 30, so the buffer's size is
   the only thing deciding how much of the slot a bloom fills. Painted and
   read back, the bounding box of all eight species runs:

     buffer   tallest   shortest   clipped
       132     well under half                  a speck in a square
        96     69%       51%       none
        84     79%       58%       none
        76     87%       64%       none
        70     94%       70%       none
        64    100%       77%       sunflower, sakura and lavender

   76 is the last size where the widest species still has air around it.
   Below it the sunflower touches two edges and the lavender runs off the
   top, and an icon cut off at the edge of its slot reads as broken rather
   than as large. */
journalBuf = createGraphics(76, 76);
journalBuf.angleMode(DEGREES);
journalBuf.pixelDensity(2);
}
journalBuf.clear();
/* drawPreviewBloom draws around the ORIGIN and leaves the centring to its
   caller, which is why the icons first came out as a quarter of a flower in
   the top left corner. The picker translates before calling it; so does
   this. */
journalBuf.push();
journalBuf.translate(journalBuf.width / 2, journalBuf.height / 2);
drawPreviewBloom(journalBuf, species, hue);
journalBuf.pop();
const c = el.getContext("2d");
c.clearRect(0, 0, el.width, el.height);
c.drawImage(journalBuf.canvas, 0, 0, el.width, el.height);
}

/* The name today's flower was planted under. The typed one if this visit
   planted it, otherwise the account's username, which is what a signed in
   person always plants as. */
function myPlantedName() {
const typed = String(username || "").trim();
if (typed) return typed.toLowerCase();
const a = window.GardenAccount;
const n = a && a.username && a.username();
return n ? String(n).trim().toLowerCase() : "";
}

function mountJournal() {
if (!window.GardenJournal) return;
GardenJournal.mount({
garden: "shared",
/* The ROOM is the authority on what you planted today, and it is handed over
   here so that it OUTRANKS both this browser's note and the account's row:
   entries() is the most trusted of the three sources the strip merges.

   Without it the strip could only show what this browser happened to have
   written down, so planting on a phone and opening the history on a laptop,
   or planting at all before any of this was written, left today's slot empty
   or holding something stale. The flower standing in the meadow under your
   name is the one that was planted, whatever any note says. */
entries: function () {
const out = {};
const me = myPlantedName();
if (!me || !shared || !Array.isArray(shared.flowers)) return out;
const day = todayStr();
/* Backwards, so that if a name somehow appears twice the strip shows the
   most recent one rather than the first. */
for (let i = shared.flowers.length - 1; i >= 0; i--) {
const f = shared.flowers[i];
if (String(f.word || "").trim().toLowerCase() !== me) continue;
out[day] = {
day: day, species: f.species, hue: f.hue, sat: f.sat, light: f.light,
word: f.word, note: f.gratitude || ""
};
break;
}
return out;
},
meaning: function (sp) {
const found = speciesList.find(x => x.id === sp);
return found ? found.meaning : "";
},
paint: paintJournalBloom
});
}

/* Called from draw(). Cheap on every frame, but the write itself happens once
   a minute at most and only from somebody signed in. */
function maybeSnapshot() {
if (!window.GardenJournal) return;
if (!shared || !Array.isArray(shared.flowers) || !shared.flowers.length) return;
const now = Date.now();
if (now - lastSnapshot < 60000) return;
lastSnapshot = now;
GardenJournal.snapshot(todayStr(), shared.flowers);
}
