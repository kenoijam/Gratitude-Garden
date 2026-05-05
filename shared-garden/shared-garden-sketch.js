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
let usernameField, usernameContinueBtn;
let colorPickerSelect, speciesButtons = {};
let saveBtn, tipsCard;

const GARDEN_KEY = "community_garden_daily";

const speciesList = [
{ id: "daisy", name: "Daisy" },
{ id: "tulip", name: "Tulip" },
{ id: "rose", name: "Rose" },
{ id: "sunflower", name: "Sunflower" },
{ id: "lily", name: "Lily" },
{ id: "sakura", name: "Sakura" },
{ id: "lotus", name: "Lotus" },
{ id: "lavender", name: "Lavender" },
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
sakura: 5
}[id] || 16;
}

function defaultSat(sp) {
return { daisy: 45, tulip: 50, rose: 55, sunflower: 60, lily: 40, sakura: 40 }[sp] || 45;
}

function defaultLight(sp) {
return { daisy: 65, tulip: 60, rose: 55, sunflower: 65, lily: 70, sakura: 75 }[sp] || 65;
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
const maxAttempts = 500;

for (const row of rows) {
let attempts = 0;
let foundSpot = false;

while (attempts < maxAttempts && !foundSpot) {
attempts++;

let candidateStemLen;
var stemScale = width < 720 ? 0.7 : 1;
if (row === "front") {
candidateStemLen = random(height * 0.16, height * 0.24) * stemScale;
} else if (row === "middle") {
candidateStemLen = random(height * 0.26, height * 0.36) * stemScale;
} else {
candidateStemLen = random(height * 0.32, height * 0.42) * stemScale;
}

const candidateX = random(50, width - 50);
const candidateBloomY = groundLevel - candidateStemLen;

foundSpot = true;

for (const f of flowers) {
const existingStemLen = (f.stemNorm != null ? f.stemNorm * height : f.stemLen);
const existingX       = (f.xNorm    != null ? f.xNorm    * width  : f.x);
const existingBloomY  = groundLevel - existingStemLen;

const dx = candidateX - existingX;
const dy = candidateBloomY - existingBloomY;
const distance = sqrt(dx * dx + dy * dy);
const requiredDistance = (size + f.size) * minFlowerDistanceFactor;
if (distance < requiredDistance) {
foundSpot = false;
break;
}
}

if (foundSpot) {
x = candidateX;
stemLen = candidateStemLen;
baseY = groundLevel;
chosenRow = row;
break;
}
}

if (foundSpot) break;
}

if (!x) {
x = random(50, width - 50);
stemLen = random(120, 200);
baseY = groundLevel;
chosenRow = "front";
}

if (chosenRow === "middle") {
baseY = groundLevel - height * 0.04;
} else if (chosenRow === "back") {
baseY = groundLevel - height * 0.08;
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
sakura:    { w: 0.75, h: 1.00 }
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
  // Sway is always on — no controls needed
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

function drawClouds() {
noStroke();
for (const c of clouds) {
c.x += c.speed;
if (c.x > width + 170) c.x = -170;

fill(255, 255, 255, 205);
const s = c.size;
circle(c.x, c.y, s);
circle(c.x + s * 0.4, c.y + s * 0.12, s * 0.75);
circle(c.x - s * 0.4, c.y + s * 0.12, s * 0.75);
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

function drawBloom(f) {
colorMode(HSL, 360, 100, 100, 1);
noStroke();

const R     = f.size;
const hue   = f.hue;
const sat   = f.sat;
const light = f.light;

if (f.species === "tulip") {
drawTulipBloom(R, hue, sat, light);
} else if (f.species === "rose") {
drawRoseBloom(R, hue, sat, light);
} else if (f.species === "sunflower") {
drawSunflowerBloom(R, hue, sat, light);
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

const outlineSat   = sat * 0.85;
const outlineLight = light - 20;

const o = 1 * scaleFactor;

fill(hue, outlineSat, outlineLight, 0.85);
text(displayWord, -o,  0);
text(displayWord,  o,  0);
text(displayWord,  0, -o);
text(displayWord,  0,  o);
text(displayWord, -o, -o);
text(displayWord,  o, -o);
text(displayWord, -o,  o);
text(displayWord,  o,  o);

fill(0, 0, 100);
text(displayWord, 0, 0);

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

// Bloomed stems — drawn BEFORE their hill so the hill hides the base
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

// Growing sprouts — drawn BEFORE their hill so the hill hides the base
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

// Blooms — drawn AFTER their hill so they float above the landscape
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

canvas = createCanvas(10, 10);
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
showStep("landing");
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

// Sparkles on top of everything
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

const arr = shared.flowers || [];
flowers = arr.map(f => ({
...f,
growthStage: GROWTH_STAGES.BLOOM,
growthStartTime: 0
}));

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
createElement("h1", "Gratitude Garden").addClass("gg-title").parent(card);
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
});

usernameContinueBtn = createButton("Continue to Flower Selection")
.addClass("gg-btn")
.parent(usernameCard);
usernameContinueBtn.mousePressed(() => {
if (!username.trim()) return;
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

const selectSub = createP("Pick a color and a flower style you like")
.addClass("gg-sub")
.parent(selectCard);
selectSub.style("margin", "4px 0 16px 0");
selectSub.style("text-align", "center");
selectSub.style("color", "#1f7460");

const colorRow = createDiv().parent(selectCard);
colorRow.id("color-section");
colorRow.style("width", "100%");
colorRow.style("display", "flex");
colorRow.style("justify-content", "center");
colorRow.style("margin", isNarrow ? "0 0 16px 0" : "2px 0 18px 0");

colorPickerSelect = createSlider(0, 360, chosenHue);
colorPickerSelect.parent(colorRow);
colorPickerSelect.addClass("gg-hue-slider");
colorPickerSelect.style("width", "100%");
colorPickerSelect.style("pointer-events", "auto");

const sliderEl = colorPickerSelect.elt;
sliderEl.style.background =
"linear-gradient(90deg,#f7a9a8,#f4e98c,#9be4a5,#8dd7f5,#c9a4f9,#f79ad3,#f7a9a8)";
sliderEl.style.borderRadius = "999px";

colorPickerSelect.input(() => {
chosenHue = colorPickerSelect.value();
drawSpeciesPreviews();
});

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
tile.mousePressed(() => {
chosenSpecies = sp.id;
addFlower(gratitudeText, username, chosenSpecies, chosenHue);
saveGarden();
showStep("garden");
});

speciesButtons[sp.id] = { tile, holder };
});
const backBtnSelect = createButton("Back")
.addClass("gg-back")
.parent(selectCard);
backBtnSelect.mousePressed(() => showStep("username"));
backBtnSelect.style("margin-top", "8px");

/* Garden */
gardenWrap = createDiv().id("garden-wrap").parent(root);
gardenWrap.style("pointer-events", "none");

saveBtn = createButton("Save PNG").id("save-btn").parent(gardenWrap);
saveBtn.style("display", "none");
saveBtn.style("pointer-events", "auto");
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
tipsCard = createDiv().id("tips-card").parent(gardenWrap);
tipsCard.style("pointer-events", "none");
createElement("h3", "Garden Tips").style("margin-bottom", "8px").parent(tipsCard);
const ul = createElement("ul").parent(tipsCard);
createElement("li", "Hover over / tap flowers to see gratitude messages").parent(ul);
createElement("li", "The garden resets everyday").parent(ul);
createElement("li", "Save PNG to download your garden").parent(ul);
createElement("li", "Come back tomorrow to plant a new flower").parent(ul);
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

landingWrap.style("display", s === "landing" ? "flex" : "none");
usernameWrap.style("display", s === "username" ? "flex" : "none");
selectWrap.style("display", s === "select" ? "flex" : "none");

gardenWrap.style("display", "block");

if (s === "garden") {
hoveredFlower = null;
}

if (canvas) {
canvas.elt.style.pointerEvents = (s === "garden") ? "auto" : "none";
}

const hasFlower = flowers && flowers.length > 0;

if (saveBtn) {
saveBtn.style("display", step === "garden" && hasFlower ? "block" : "none");
}
if (tipsCard) {
tipsCard.style("display", step === "garden" && hasFlower ? "block" : "none");
}

const logo = select("#gg-logo");
if (logo) {
logo.style("display", step === "garden" && hasFlower ? "block" : "none");
}

loop();
}