/* Personal Gratitude Garden - Memory Journal */
/* ⚠️ TEST MODE: Multi-plant enabled, "Plant Another" button added */
const BASE_W = 1440;
const BASE_H = 900;
const isTouchDevice = /Mobi|Android|iPhone|iPad|iPod/.test(
  navigator.userAgent || ""
);

let step = "prompt1";
let dayRating = "";
let dayShaper = "";
let journalEntry = "";
let chosenSpecies = null;
let chosenHue = 280;
let flowers = [];
let swayOn = true;
let clouds = [];
let groundLevel;
let isSaving = false;
let flowerCounter = 0;
let gardenScale = 1;

let prompt1Wrap, prompt2Wrap, prompt3Wrap, flowerPreviewWrap, gardenWrap;
let continueBtn1, continueBtn2, continueBtn3;
let journalField;
let colorPickerSelect, plantBtn;
let saveBtn, tipsCard;
let previewGraphics;
let gardenName = "";

const STORAGE_KEY = "personal_gratitude_garden";

// Preset options
const dayRatingOptions = ["calm", "happy", "tired", "stressed", "anxious", "grateful", "hopeful", "loved"];
const dayShaperOptions = ["work/school", "relationships", "rest or energy", "a small joy", "an unexpected event", "nothing special"];

// Flower meanings, selection keywords, and supportive quotes
const flowerMeanings = {
  sunflower: {
    keywords: ["happy", "happiness", "joy", "joyful", "excited", "elated", "positive", "energized", "upbeat", "cheerful", "wonderful", "amazing", "thrilled", "delighted", "proud"],
    meaning: "hope & resilience",
    quote: "Even on the cloudiest days, you are still reaching toward the light. That counts for a lot."
  },
  rose: {
    keywords: ["love", "loved", "longing", "heartbreak", "vulnerable", "romantic", "miss", "missed", "hurt", "connection", "relationship", "grief", "loss", "heart", "caring"],
    meaning: "love & depth",
    quote: "Feeling deeply is a kind of courage. Your heart is open and that is a beautiful thing."
  },
  daisy: {
    keywords: ["calm", "content", "simple", "okay", "fine", "gentle", "quiet", "peaceful", "neutral", "ordinary", "steady", "balanced", "comfortable", "relaxed", "mellow"],
    meaning: "simplicity & lightness",
    quote: "There is real wisdom in finding beauty in the ordinary. Today was enough, and so are you."
  },
  tulip: {
    keywords: ["change", "new", "starting", "beginning", "moving", "fresh", "ready", "transition", "growing", "next chapter", "different", "renewing", "turning point", "opportunity", "stepping"],
    meaning: "renewal & change",
    quote: "Something new is taking root in you. Trust the direction you are growing in."
  },
  lily: {
    keywords: ["tired", "exhausted", "drained", "resting", "burned out", "burnt out", "heavy", "slow", "recovering", "weary", "fatigued", "sleepy", "needed rest", "low energy", "recharging"],
    meaning: "peace & restoration",
    quote: "Rest is not giving up. It is how you come back to yourself. You are allowed to slow down."
  },
  sakura: {
    keywords: ["grateful", "gratitude", "reflecting", "nostalgic", "memory", "memories", "appreciating", "thankful", "fleeting", "aware", "bittersweet", "cherish", "present", "noticing", "savoring"],
    meaning: "reflection & presence",
    quote: "You noticed something worth holding onto today. That kind of awareness is rare and beautiful."
  },
  lotus: {
    keywords: ["difficult", "struggling", "overwhelmed", "swamped", "pushing through", "accepting", "strong", "despite", "kept going", "still here", "persevering", "surviving", "managing", "enduring", "holding on"],
    meaning: "resilience & strength",
    quote: "You moved through something hard today. That quiet strength matters more than you know."
  },
  lavender: {
    keywords: ["anxious", "anxiety", "tense", "tension", "stressed", "stress", "nervous", "worried", "worrying", "uneasy", "panicking", "overwhelmed", "on edge", "unsettled", "restless"],
    meaning: "calm & safety",
    quote: "You made it through the noise today. Take a breath. You are safe, and you are okay."
  }
};

let hoveredFlower = null;

// Growth stages
const GROWTH_STAGES = {
  BUD: 0,
  STEM: 1,
  BLOOM: 2
};

let canvas;

function preload() {
  loadGarden();
}

function loadGarden() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      flowers = JSON.parse(saved);
      flowerCounter = flowers.length;
      // Loaded flowers are already fully grown — force BLOOM stage
      flowers.forEach(f => {
        f.growthStage = 2; // BLOOM
        f.growthStartTime = 0; // far in the past
      });
    } catch (e) {
      console.error("Failed to load garden:", e);
      flowers = [];
    }
  } else {
    flowers = [];
  }
  gardenName = localStorage.getItem(STORAGE_KEY + "_name") || "";
}

function saveGarden() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flowers));
  } catch (e) {
    console.error("Failed to save garden:", e);
  }
}

// Direct mapping from prompt selections to flower species
const ratingFlowerMap = {
  "calm":       "daisy",
  "happy":      "sunflower",
  "tired":      "lily",
  "stressed":   "lotus",
  "anxious":    "lavender",
  "grateful":   "sakura",
  "hopeful":    "tulip",
  "loved":      "rose"
};

const shaperFlowerMap = {
  "work/school":         "lotus",
  "relationships":       "rose",
  "rest or energy":      "lily",
  "a small joy":         "sakura",
  "an unexpected event": "tulip",
  "nothing special":     "daisy",
  "worries":             "lavender"
};

// Analyze text and choose appropriate flower
function chooseFlowerForMood(dayRating, dayShaper, journal) {
  const votes = {
    sunflower: 0, rose: 0, daisy: 0, tulip: 0,
    lily: 0, sakura: 0, lotus: 0, lavender: 0
  };

  const ratingFlower = ratingFlowerMap[dayRating];
  if (ratingFlower) votes[ratingFlower] += 4;

  const shaperFlower = shaperFlowerMap[dayShaper];
  if (shaperFlower) votes[shaperFlower] += 3;

  if (journal) {
    const jText = journal.toLowerCase();
    Object.keys(flowerMeanings).forEach(species => {
      flowerMeanings[species].keywords.forEach(keyword => {
        if (jText.includes(keyword)) votes[species] += 2;
      });
    });
  }

  let bestFlower = ratingFlower || "daisy";
  let bestScore = 0;
  Object.keys(votes).forEach(species => {
    if (votes[species] > bestScore) {
      bestScore = votes[species];
      bestFlower = species;
    }
  });

  return bestFlower;
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
  return { daisy: 45, tulip: 50, rose: 55, sunflower: 60, lily: 40, sakura: 40, lotus: 50, lavender: 55 }[sp] || 45;
}

function defaultLight(sp) {
  return { daisy: 65, tulip: 60, rose: 55, sunflower: 65, lily: 70, sakura: 75, lotus: 70, lavender: 68 }[sp] || 65;
}

function getTodayDate() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  const year  = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function addFlower(dayRating, dayShaper, journal, species, hue) {
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

  const frontFlowers = flowers.filter(f => f.layer === "front");
  const midFlowers   = flowers.filter(f => f.layer === "mid");
  const backFlowers  = flowers.filter(f => f.layer === "back");

  const ROW_CAPACITY = 8;

  let chosenLayer, baseY, stemLen;

  let targetLayer, targetBaseY, minStem, maxStem;
  if (frontFlowers.length < ROW_CAPACITY) {
    const t = frontFlowers.length / ROW_CAPACITY;
    targetLayer = "front";
    targetBaseY = groundLevel;
    minStem = height * lerp(0.13, 0.19, t);
    maxStem = height * lerp(0.17, 0.23, t);
  } else if (midFlowers.length < ROW_CAPACITY) {
    const t = midFlowers.length / ROW_CAPACITY;
    targetLayer = "mid";
    targetBaseY = groundLevel - height * 0.10;
    minStem = height * lerp(0.17, 0.23, t);
    maxStem = height * lerp(0.21, 0.27, t);
  } else {
    const t = backFlowers.length / ROW_CAPACITY;
    targetLayer = "back";
    targetBaseY = groundLevel - height * 0.17;
    minStem = height * lerp(0.11, 0.17, t);
    maxStem = height * lerp(0.15, 0.21, t);
  }

  const maxAttempts = 80;
  let bestX = random(60, width - 60);
  let bestClearance = -1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateX = random(60, width - 60);
    const candidateStem = random(minStem, maxStem);
    const candidateBloomY = targetBaseY - candidateStem;

    let minDist = Infinity;
    for (const f of flowers) {
      const fx = f.xNorm != null ? f.xNorm * width : f.x;
      const fBaseY = f.baseY || groundLevel;
      const fStem = f.stemNorm != null ? f.stemNorm * height : f.stemLen;
      const fBloomY = fBaseY - fStem;
      const dx = candidateX - fx;
      const dy = candidateBloomY - fBloomY;
      const d = sqrt(dx * dx + dy * dy);
      const needed = (size + (f.sizeNorm != null ? f.sizeNorm * height : f.size)) * 1.1;
      if (d < needed) { minDist = 0; break; }
      if (d < minDist) minDist = d;
    }

    if (minDist > bestClearance) {
      bestClearance = minDist;
      bestX = candidateX;
      stemLen = candidateStem;
    }
    if (minDist > size * 2.5) break;
  }

  if (!stemLen) stemLen = random(minStem, maxStem);
  const x = bestX;
  chosenLayer = targetLayer;
  baseY = targetBaseY;

  let layer = chosenLayer;

  const petals = speciesPetalCount(species);

  const newFlower = {
    date: getTodayDate(),
    dayRating,
    dayShaper,
    journal,
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

    createdIndex: flowerCounter++,
    growthStage: GROWTH_STAGES.BUD,
    growthStartTime: millis(),
    plantedTime: Date.now()
  };

  flowers.push(newFlower);
  saveGarden();
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

function buildClouds(reset = false) {
  const n = 8;
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
    vertex(x, height * 0.64 + noise(x * 0.0025, 20.2) * 16);
  }
  vertex(width + 20, height);
  vertex(0, height);
  endShape(CLOSE);
}

function drawForegroundHill() {
  noStroke();
  fill("#7ec4b4");
  beginShape();
  for (let x = 0; x <= width + 20; x += 10) {
    const bump = noise(x * 0.002, 321.45) * height * 0.02;
    const y = height * 0.75 - bump;
    vertex(x, y);
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

  colorMode(RGB);
}

function drawPreviewFlower(pg, species, hue) {
  pg.push();
  pg.colorMode(pg.HSL, 360, 100, 100, 1);
  pg.angleMode(pg.DEGREES);
  pg.noStroke();

  const R = 40;
  const sat = defaultSat(species);
  const light = defaultLight(species);

  pg.translate(pg.width / 2, pg.height / 2 + 10);

  if (species === "lotus") {
    pg.translate(0, R * 0.8);
  } else if (species === "lavender") {
    pg.translate(0, R * 1.0);
  }

  if (species === "tulip") {
    drawTulipBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "rose") {
    drawRoseBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "sunflower") {
    drawSunflowerBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "sakura") {
    drawCherryBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "lily") {
    drawLilyBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "lotus") {
    drawLotusBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "lavender") {
    drawLavenderBloomOnGraphics(pg, R * 1.5, hue, sat, light);
  } else {
    drawDaisyBloomOnGraphics(pg, R, hue, sat, light);
  }

  pg.pop();
}

function drawTulipBloomOnGraphics(pg, R, hue, sat, light) {
  pg.noStroke();
  const Rt = R * 1.15;
  pg.fill(hue, sat, light, 0.95);
  pg.ellipse(0, Rt * 0.25, Rt * 1.05, Rt * 1.1);
  pg.beginShape();
  pg.vertex(-Rt * 0.52, Rt * 0.10);
  pg.bezierVertex(-Rt * 0.52, -Rt * 0.10, -Rt * 0.40, -Rt * 0.40, -Rt * 0.22, -Rt * 0.60);
  pg.vertex(0, -Rt * 0.40);
  pg.vertex(Rt * 0.22, -Rt * 0.60);
  pg.bezierVertex(Rt * 0.40, -Rt * 0.40, Rt * 0.52, -Rt * 0.10, Rt * 0.52, Rt * 0.10);
  pg.endShape(pg.CLOSE);
  pg.fill(hue, sat * 0.8, light + 12, 0.4);
  pg.ellipse(0, Rt * 0.05, Rt * 0.7, Rt * 0.9);
}

function drawRoseBloomOnGraphics(pg, R, hue, sat, light) {
  pg.push();
  function petal(rotation, distance, w, h, sMod, lMod) {
    pg.push();
    pg.rotate(rotation);
    pg.translate(0, -distance);
    pg.fill(hue, sat * sMod, light + lMod, 1);
    pg.beginShape();
    pg.vertex(0, 12);
    pg.bezierVertex(-w / 3.2, 5, -w / 1.4, -h / 3.5, -w / 4.5, -h * 0.75);
    pg.bezierVertex(-w / 12, -h * 0.82, w / 12, -h * 0.82, w / 4.5, -h * 0.75);
    pg.bezierVertex(w / 1.4, -h / 3.5, w / 3.2, 5, 0, 12);
    pg.endShape(pg.CLOSE);
    pg.pop();
  }
  const scaleAmount = R / 70;
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
}

function drawSunflowerBloomOnGraphics(pg, R, hue, sat, light) {
  pg.noStroke();
  const petals = 18;
  const w = R * 0.45;
  const h = R * 1.25;
  for (let i = 0; i < petals; i++) {
    pg.push();
    pg.rotate(i * 20);
    pg.fill(hue, sat * 0.9, light + 12, 0.95);
    pg.ellipse(0, -R * 0.72, w, h);
    pg.pop();
  }
  pg.fill(28, 45, 42);
  pg.circle(0, 0, R * 1.35);
  pg.fill(23, 40, 58);
  pg.circle(0, 0, R * 1.05);
}

function drawCherryBloomOnGraphics(pg, R, hue, sat, light) {
  pg.noStroke();
  const Rb = R * 1.7;
  for (let i = 0; i < 5; i++) {
    const angle = i * 72;
    pg.push();
    pg.rotate(angle);
    pg.fill(hue, sat * 0.8, light + 15, 0.85);
    pg.beginShape();
    pg.vertex(0, -Rb * 0.65);
    pg.bezierVertex(Rb * 0.28, -Rb * 0.52, Rb * 0.40, -Rb * 0.20, Rb * 0.28, 0);
    pg.bezierVertex(Rb * 0.18, Rb * 0.12, 0, Rb * 0.18, -Rb * 0.18, Rb * 0.12);
    pg.bezierVertex(-Rb * 0.28, 0, -Rb * 0.40, -Rb * 0.20, -Rb * 0.28, -Rb * 0.52);
    pg.endShape(pg.CLOSE);
    pg.pop();
  }
  pg.fill(hue, sat * 0.6, light - 5);
  pg.circle(0, 0, Rb * 0.24);
}

function drawLilyBloomOnGraphics(pg, R, hue, sat, light) {
  pg.noStroke();
  const Rl = R * 1.08;
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = i * 60;
    pg.push();
    pg.rotate(a);
    pg.fill(hue, sat * 0.85, light + 8, 0.9);
    pg.beginShape();
    pg.vertex(0, -Rl * 1.0);
    pg.bezierVertex(Rl * 0.30, -Rl * 0.72, Rl * 0.42, -Rl * 0.30, Rl * 0.22, Rl * 0.04);
    pg.bezierVertex(Rl * 0.12, Rl * 0.20, 0, Rl * 0.26, -Rl * 0.12, Rl * 0.20);
    pg.bezierVertex(-Rl * 0.22, Rl * 0.04, -Rl * 0.42, -Rl * 0.30, -Rl * 0.30, -Rl * 0.72);
    pg.endShape(pg.CLOSE);
    pg.pop();
  }
  pg.fill(hue, sat * 0.65, light - 5);
  pg.circle(0, 0, Rl * 0.36);
  pg.fill(hue, sat * 0.45, light + 10);
  pg.circle(0, 0, Rl * 0.20);
}

function drawDaisyBloomOnGraphics(pg, R, hue, sat, light) {
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

function drawLotusBloomOnGraphics(pg, R, hue, sat, light) {
  pg.push();
  pg.noStroke();
  let drawPetal = (x, y, scX, scY, rot, c) => {
    pg.push();
    pg.translate(x, y);
    pg.rotate(rot);
    pg.scale(scX, scY);
    pg.fill(c);
    pg.beginShape();
    pg.vertex(0, 0);
    pg.bezierVertex(R * 0.5, R * -0.5, R * 0.5, R * -1.5, 0, R * -2);
    pg.bezierVertex(-R * 0.5, R * -1.5, -R * 0.5, R * -0.5, 0, 0);
    pg.endShape(pg.CLOSE);
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

function drawLavenderBloomOnGraphics(pg, h, hue, sat, light) {
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

function drawNewestSparkles() {
  let newest = null;
  for (const f of flowers) {
    if (f.growthStage !== GROWTH_STAGES.BLOOM) continue;
    if (!newest || (f.createdIndex || 0) > (newest.createdIndex || 0)) newest = f;
  }
  if (!newest) return;

  const age = (Date.now() - (newest.plantedTime || Date.now())) / 1000;
  const maxAge = 60;
  if (age > maxAge) return;
  const alpha = map(age, maxAge * 0.6, maxAge, 1, 0, true);

  const t = frameCount * 0.01 + newest.phase * 0.001;
  const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;
  const cx = newest.x + swayNoise;
  const baseCy = newest.baseY - newest.stemLen;

  let cyOffset, orbitW, orbitH;
  if (newest.species === "lavender") {
    const h = newest.size * 1.5;
    cyOffset = -(10 + h * 0.5);
    orbitW   = newest.size * 0.75;
    orbitH   = h * 0.6;
  } else if (newest.species === "lotus") {
    cyOffset = -newest.size * 0.6;
    orbitW   = newest.size * 0.85;
    orbitH   = newest.size * 0.85;
  } else {
    cyOffset = 0;
    orbitW   = newest.size * 1.4;
    orbitH   = newest.size * 1.0;
  }

  const cy = baseCy + cyOffset;
  const R = newest.size;

  push();
  colorMode(HSL, 360, 100, 100, 1);

  const numParticles = 8;

  for (let i = 0; i < numParticles; i++) {
    const angle = (frameCount * 1.8 + i * (360 / numParticles)) % 360;
    const wobble = sin(frameCount * 3 + i * 47) * R * 0.1;
    const px = cx + cos(angle) * (orbitW + wobble);
    const py = cy + sin(angle) * (orbitH + wobble);

    const twinkle = map(sin(frameCount * 4 + i * 33), -1, 1, 2, 5);

    const sparkHue = (i % 2 === 0) ? newest.hue : (newest.hue + 40) % 360;
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

function drawAllDates() {
  for (const f of flowers) {
    if (f.growthStage !== GROWTH_STAGES.BLOOM) continue;
    const t = frameCount * 0.01 + f.phase * 0.001;
    const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;

    push();
    translate(f.x + swayNoise, f.baseY - f.stemLen);
    colorMode(HSL, 360, 100, 100, 1);

    const scaleFactor = (width < 720 ? gardenScale : 1);
    const labelSize = max(10, 13 * scaleFactor);
    const o = 1 * scaleFactor;
    const labelY = (f.species === "lotus") ? -f.size * 0.6
                 : (f.species === "lavender") ? -(10 + f.size * 0.75)
                 : 0;

    textAlign(CENTER, CENTER);
    textSize(labelSize);
    noStroke();

    const displayDate = f.date || "";
    const outlineSat   = f.sat * 0.85;
    const outlineLight = f.light - 20;

    fill(f.hue, outlineSat, outlineLight, 0.85);
    text(displayDate, -o, labelY);
    text(displayDate,  o, labelY);
    text(displayDate,  0, labelY - o);
    text(displayDate,  0, labelY + o);

    fill(0, 0, 100);
    text(displayDate, 0, labelY);

    colorMode(RGB);
    pop();
  }
}

function drawLeafOnStem(x0, y0, c1x, c1y, c2x, c2y, x3, y3, t, side, len) {
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
  const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;
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
  const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;
  const totalSway = swayNoise;

  push();
  translate(totalSway, -f.stemLen);
  drawBloom(f);
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

// Bloomed stems only — drawn BEFORE their hill so the hill hides the base
function drawFlowersStemsOnly(layerName) {
  const layer = getLayerSorted(layerName);
  for (const f of layer) {
    if (f.growthStage !== GROWTH_STAGES.BLOOM) continue;
    push();
    translate(f.x, f.baseY);
    drawFlowerStemAndLeaves(f);
    pop();
  }
}

// Growing sprouts — drawn AFTER their hill so they poke above it
function drawFlowersGrowingOnly(layerName) {
  const layer = getLayerSorted(layerName);
  for (const f of layer) {
    if (f.growthStage === GROWTH_STAGES.BLOOM) continue;
    push();
    translate(f.x, f.baseY);
    updateGrowthStage(f);
    drawFlowerWithGrowth(f);
    pop();
  }
}

// Blooms — drawn AFTER all hills so they float above the landscape
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

function updateGrowthStage(f) {
  const elapsed = millis() - f.growthStartTime;
  if (elapsed < 2000) f.growthStage = GROWTH_STAGES.BUD;
  else if (elapsed < 5000) f.growthStage = GROWTH_STAGES.STEM;
  else f.growthStage = GROWTH_STAGES.BLOOM;
}

// Bloomed stems only — drawn BEFORE their hill so the hill hides the base
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

// Growing sprouts — drawn AFTER their hill so they poke above it
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

// Blooms — drawn AFTER all hills so they float above the landscape
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

function getLayerSorted(layerName) {
  const layer = flowers.filter(f => f.layer === layerName);
  layer.sort((a, b) => {
    const aGrowing = a.growthStage !== GROWTH_STAGES.BLOOM ? 1 : 0;
    const bGrowing = b.growthStage !== GROWTH_STAGES.BLOOM ? 1 : 0;
    if (aGrowing !== bGrowing) return aGrowing - bGrowing;
    return (b.createdIndex || 0) - (a.createdIndex || 0);
  });
  return layer;
}

function checkHover(px = mouseX, py = mouseY) {
  let best = null;
  let bestDist = Infinity;

  for (const f of flowers) {
    const t = frameCount * 0.01 + f.phase * 0.001;
    const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;
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

function drawHoverTooltip() {
  if (!hoveredFlower) return;

  const f = hoveredFlower;
  const t = frameCount * 0.01 + f.phase * 0.001;
  const swayNoise = swayOn ? map(noise(t), 0, 1, -1, 1) * 4 : 0;
  
  const flowerX = f.x + swayNoise;
  const flowerY = f.baseY - f.stemLen;

  push();
  const boxPadding = 11;
  const lineHeight = 15;
  const maxWidth = 260;
  const innerWidth = maxWidth - boxPadding * 2;

  let lines = [];

  const flowerMeaning = flowerMeanings[f.species];
  if (flowerMeaning) {
    const speciesLabel = f.species.charAt(0).toUpperCase() + f.species.slice(1);
    const headerText = `${speciesLabel} — ${flowerMeaning.meaning}`;
    textSize(12);
    textStyle(BOLD);
    if (textWidth(headerText) > innerWidth) {
      const hWords = headerText.split(" ");
      let hLine = "";
      for (let word of hWords) {
        if (textWidth(hLine + word + " ") > innerWidth) {
          lines.push({ text: hLine.trim(), bold: true });
          hLine = word + " ";
        } else {
          hLine += word + " ";
        }
      }
      if (hLine.trim()) lines.push({ text: hLine.trim(), bold: true });
    } else {
      lines.push({ text: headerText, bold: true });
    }
    textStyle(NORMAL);
  }

  if (f.dayRating) {
    lines.push({ text: `Mood: ${f.dayRating}`, bold: false });
  }
  if (f.dayShaper) {
    lines.push({ text: `Shaped by: ${f.dayShaper}`, bold: false });
  }

  if (f.journal) {
    textSize(12);
    textStyle(NORMAL);

    const prefix = "Entry: ";
    const words = f.journal.split(" ");
    let journalLines = [];
    let currentLine = "";
    let isFirst = true;

    for (let word of words) {
      const testPrefix = isFirst ? prefix : "";
      const testLine = currentLine + word + " ";
      if (textWidth(testPrefix + testLine) > innerWidth) {
        if (currentLine.trim()) {
          journalLines.push((isFirst ? prefix : "") + currentLine.trim());
          isFirst = false;
        }
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.trim()) {
      journalLines.push((isFirst ? prefix : "") + currentLine.trim());
    }

    journalLines.forEach(l => lines.push({ text: l, bold: false }));
  }

  lines.push({ text: "---", bold: false, divider: true });
  lines.push({ text: f.date || "", bold: false, muted: true });

  textSize(12);
  const boxWidth = maxWidth;
  const boxHeight = boxPadding * 2 + lines.length * lineHeight;

  let tooltipX = flowerX - boxWidth / 2;
  let tooltipY = flowerY - f.size * 1.5 - boxHeight - 5;

  tooltipX = constrain(tooltipX, 10, width - boxWidth - 10);
  tooltipY = constrain(tooltipY, 10, height - boxHeight - 10);

  fill(0, 0, 0, 30);
  noStroke();
  rect(tooltipX + 2, tooltipY + 3, boxWidth, boxHeight, 10);

  fill(255, 255, 255, 252);
  noStroke();
  rect(tooltipX, tooltipY, boxWidth, boxHeight, 10);

  textAlign(LEFT, TOP);
  let yPos = tooltipY + boxPadding;

  for (let entry of lines) {
    if (entry.divider) {
      stroke(210);
      strokeWeight(1);
      line(tooltipX + boxPadding, yPos + lineHeight * 0.5, tooltipX + boxWidth - boxPadding, yPos + lineHeight * 0.5);
      noStroke();
      yPos += lineHeight;
      continue;
    }
    textSize(12);
    if (entry.bold) {
      fill(30);
      textStyle(BOLD);
    } else if (entry.muted) {
      fill(140);
      textStyle(NORMAL);
    } else {
      fill(70);
      textStyle(NORMAL);
    }
    text(entry.text, tooltipX + boxPadding, yPos);
    yPos += lineHeight;
  }

  textStyle(NORMAL);
  pop();
}

function updateResponsiveFlowerLayout() {
  if (!flowers || !flowers.length) return;

  const groundY = height * 0.76;

  for (const f of flowers) {
    if (f.layer !== "front" && f.layer !== "mid" && f.layer !== "back") {
      f.layer = "front";
    }

    if (f.xNorm == null || f.xNorm <= 0 || f.xNorm > 1.2) {
      f.xNorm = (f.x || random(60, width - 60)) / width;
    }
    if (f.stemNorm == null) f.stemNorm = f.stemLen / BASE_H;
    if (f.sizeNorm == null) f.sizeNorm = f.size / BASE_H;

    f.x       = f.xNorm   * width;
    f.stemLen = f.stemNorm * height;
    f.size    = f.sizeNorm * height;

    if (f.layer === "mid") {
      f.baseY = groundY - height * 0.10;
    } else if (f.layer === "back") {
      f.baseY = groundY - height * 0.17;
    } else {
      f.baseY = groundY;
    }
  }

  for (const f of flowers) {
    if (f.stemNormOrig == null) f.stemNormOrig = f.stemNorm;
    if (f.sizeNormOrig == null) f.sizeNormOrig = f.sizeNorm;
  }

  for (const f of flowers) {
    f.stemLen = f.stemNormOrig * height;
    f.size    = f.sizeNormOrig * height;
  }

  const minAllowedY = height * 0.32;
  let highestBloomY = Infinity;
  for (const f of flowers) {
    const bloomY = f.baseY - f.stemLen - f.size;
    if (bloomY < highestBloomY) highestBloomY = bloomY;
  }

  if (highestBloomY < minAllowedY) {
    const scale = (groundY - minAllowedY) / (groundY - highestBloomY);
    for (const f of flowers) {
      f.stemLen = f.stemNormOrig * height * scale;
      f.size    = f.sizeNormOrig * height * scale;
      f.stemNorm = f.stemLen / height;
      f.sizeNorm = f.size    / height;
    }
  }
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

function resetPromptSelections() {
  dayRating = "";
  dayShaper = "";
  journalEntry = "";
  if (journalField) journalField.value("");

  const p1Buttons = prompt1Wrap && prompt1Wrap.elt.querySelectorAll("button");
  if (p1Buttons) p1Buttons.forEach(b => {
    b.style.background = "white";
    b.style.borderColor = "#bde0d6";
  });

  const p2Buttons = prompt2Wrap && prompt2Wrap.elt.querySelectorAll("button");
  if (p2Buttons) p2Buttons.forEach(b => {
    b.style.background = "white";
    b.style.borderColor = "#bde0d6";
  });
}

function buildUI() {
  const root = select("#ui-root");

  prompt1Wrap = createDiv().id("prompt1-wrap").parent(root).addClass("gg-wrap");
  prompt1Wrap.style("display", "flex");
  prompt1Wrap.style("flex-direction", "column");
  prompt1Wrap.style("align-items", "center");
  prompt1Wrap.style("justify-content", "center");
  prompt1Wrap.style("z-index", "100");
  prompt1Wrap.style("pointer-events", "auto");
  prompt1Wrap.style("gap", "0px");

  const titleDiv = createDiv().parent(prompt1Wrap);
  titleDiv.style("text-align", "center");
  titleDiv.style("pointer-events", "none");
  titleDiv.style("margin-bottom", "10px");
  titleDiv.style("margin-top", "-110px");
  createElement("h1", "Daily Reflection").addClass("gg-title").parent(titleDiv);

  const card1 = createDiv().addClass("gg-card").parent(prompt1Wrap);
  card1.style("max-width", "460px");
  card1.style("width", "460px");
  card1.style("box-sizing", "border-box");
  card1.style("padding", "24px 28px 20px 28px");
  createElement("h3", "How was your day?").style("text-align", "center").style("color", "#0f5132").style("font-size", "16px").style("font-weight", "700").style("margin", "0 0 16px 0").parent(card1);
  
  const btnGrid1 = createDiv().parent(card1);
  btnGrid1.style("display", "grid");
  btnGrid1.style("grid-template-columns", "repeat(2, 1fr)");
  btnGrid1.style("gap", "9px");
  btnGrid1.style("margin-bottom", "16px");

  dayRatingOptions.forEach(option => {
    const btn = createButton(option);
    btn.parent(btnGrid1);
    btn.style("padding", "11px");
    btn.style("border", "2px solid #bde0d6");
    btn.style("border-radius", "10px");
    btn.style("background", "white");
    btn.style("cursor", "pointer");
    btn.style("font-size", "14px");
    btn.style("transition", "all 0.15s");
    btn.style("pointer-events", "auto");
    btn.elt.addEventListener("mouseenter", () => {
      if (btn.elt.style.background !== 'rgb(224, 242, 241)') {
        btn.elt.style.transform = "scale(1.04)";
      }
    });
    btn.elt.addEventListener("mouseleave", () => {
      btn.elt.style.transform = "scale(1)";
    });

    btn.mousePressed(() => {
      dayRating = option;
      btnGrid1.elt.querySelectorAll('button').forEach(b => {
        b.style.background = 'white';
        b.style.borderColor = '#bde0d6';
      });
      btn.elt.style.background = '#e0f2f1';
      btn.elt.style.borderColor = '#26a69a';
      setTimeout(() => showStep("prompt2"), 180);
    });
  });

  continueBtn1 = createButton("Continue").parent(card1);
  continueBtn1.style("display", "none");
  continueBtn1.style("color", "white");
  continueBtn1.style("border", "none");
  continueBtn1.style("border-radius", "12px");
  continueBtn1.style("padding", "14px");
  continueBtn1.style("font-size", "15px");
  continueBtn1.style("font-weight", "600");
  continueBtn1.style("width", "100%");
  continueBtn1.style("cursor", "pointer");
  continueBtn1.style("margin-bottom", "8px");
  continueBtn1.style("pointer-events", "auto");
  continueBtn1.mousePressed(() => {
    if (!dayRating) return;
    showStep("prompt2");
  });

  prompt2Wrap = createDiv().id("prompt2-wrap").parent(root).addClass("gg-wrap");
  prompt2Wrap.style("z-index", "100");
  prompt2Wrap.style("pointer-events", "auto");

  const card2 = createDiv().addClass("gg-card").parent(prompt2Wrap);
  card2.style("max-width", "460px");
  card2.style("width", "460px");
  card2.style("box-sizing", "border-box");
  card2.style("padding", "24px 28px 20px 28px");
  createElement("h3", "What shaped your day?").style("text-align", "center").style("color", "#0f5132").style("font-size", "16px").style("font-weight", "700").style("margin", "0 0 16px 0").parent(card2);
  
  const btnGrid2 = createDiv().parent(card2);
  btnGrid2.style("display", "grid");
  btnGrid2.style("grid-template-columns", "repeat(2, 1fr)");
  btnGrid2.style("gap", "9px");
  btnGrid2.style("margin-bottom", "16px");

  dayShaperOptions.forEach(option => {
    const btn = createButton(option);
    btn.parent(btnGrid2);
    btn.style("padding", "11px");
    btn.style("border", "2px solid #bde0d6");
    btn.style("border-radius", "10px");
    btn.style("background", "white");
    btn.style("cursor", "pointer");
    btn.style("font-size", "14px");
    btn.style("transition", "all 0.15s");
    btn.style("pointer-events", "auto");
    btn.elt.addEventListener("mouseenter", () => {
      if (btn.elt.style.background !== 'rgb(224, 242, 241)') {
        btn.elt.style.transform = "scale(1.04)";
      }
    });
    btn.elt.addEventListener("mouseleave", () => {
      btn.elt.style.transform = "scale(1)";
    });

    btn.mousePressed(() => {
      dayShaper = option;
      btnGrid2.elt.querySelectorAll('button').forEach(b => {
        b.style.background = 'white';
        b.style.borderColor = '#bde0d6';
      });
      btn.elt.style.background = '#e0f2f1';
      btn.elt.style.borderColor = '#26a69a';
      setTimeout(() => showStep("prompt3"), 180);
    });
  });

  continueBtn2 = createButton("Continue").parent(card2);
  continueBtn2.style("display", "none");
  continueBtn2.style("color", "white");
  continueBtn2.style("border", "none");
  continueBtn2.style("border-radius", "12px");
  continueBtn2.style("padding", "14px");
  continueBtn2.style("font-size", "15px");
  continueBtn2.style("font-weight", "600");
  continueBtn2.style("width", "100%");
  continueBtn2.style("cursor", "pointer");
  continueBtn2.style("margin-bottom", "8px");
  continueBtn2.style("pointer-events", "auto");
  continueBtn2.mousePressed(() => {
    if (!dayShaper) return;
    showStep("prompt3");
  });

  const backBtn2 = createButton("Back").addClass("gg-back").parent(card2);
  backBtn2.elt.style.background = "#e0e0e0";
  backBtn2.elt.style.color = "#666";
  backBtn2.elt.style.border = "none";
  backBtn2.elt.style.borderRadius = "12px";
  backBtn2.elt.style.padding = "12px";
  backBtn2.elt.style.fontSize = "14px";
  backBtn2.elt.style.fontWeight = "500";
  backBtn2.elt.style.width = "100%";
  backBtn2.elt.style.cursor = "pointer";
  backBtn2.elt.style.pointerEvents = "auto";
  backBtn2.mousePressed(() => showStep("prompt1"));

  prompt3Wrap = createDiv().id("prompt3-wrap").parent(root).addClass("gg-wrap");
  prompt3Wrap.style("z-index", "100");
  prompt3Wrap.style("pointer-events", "auto");

  const card3 = createDiv().addClass("gg-card").parent(prompt3Wrap);
  card3.style("max-width", "460px");
  card3.style("width", "460px");
  card3.style("box-sizing", "border-box");
  card3.style("padding", "24px 28px 20px 28px");
  createElement("h3", "Anything else?").style("text-align", "center").style("color", "#0f5132").style("font-size", "16px").style("font-weight", "700").style("margin", "0 0 2px 0").parent(card3);
  createP("Optional — add more thoughts if you'd like").addClass("gg-sub").style("font-size", "13px").style("margin", "0 0 12px 0").style("text-align", "center").style("color", "#5a9e8e").parent(card3);
  
  journalField = createElement("textarea").parent(card3);
  journalField.attribute("maxlength", "500");
  journalField.attribute("placeholder", "Additional thoughts or reflections...");
  journalField.style("width", "100%");
  journalField.style("box-sizing", "border-box");
  journalField.style("border", "2px solid #bde0d6");
  journalField.style("border-radius", "12px");
  journalField.style("height", "150px");
  journalField.style("padding", "14px 16px");
  journalField.style("font-size", "14px");
  journalField.style("resize", "none");
  journalField.style("pointer-events", "auto");
  journalField.input(() => {
    journalEntry = journalField.elt.value;
  });

  continueBtn3 = createButton("See Your Flower").parent(card3);
  continueBtn3.style("background", "#4db6ac");
  continueBtn3.style("color", "white");
  continueBtn3.style("border", "none");
  continueBtn3.style("border-radius", "12px");
  continueBtn3.style("padding", "14px");
  continueBtn3.style("font-size", "15px");
  continueBtn3.style("font-weight", "600");
  continueBtn3.style("width", "100%");
  continueBtn3.style("cursor", "pointer");
  continueBtn3.style("margin-bottom", "8px");
  continueBtn3.style("pointer-events", "auto");
  continueBtn3.mousePressed(() => {
    chosenSpecies = chooseFlowerForMood(dayRating, dayShaper, journalEntry);
    chosenHue = random(0, 360);
    showStep("flowerPreview");
    updateFlowerPreview();
  });

  const backBtn3 = createButton("Back").parent(card3);
  backBtn3.style("background", "#e0e0e0");
  backBtn3.style("color", "#666");
  backBtn3.style("border", "none");
  backBtn3.style("border-radius", "12px");
  backBtn3.style("padding", "12px");
  backBtn3.style("font-size", "14px");
  backBtn3.style("font-weight", "500");
  backBtn3.style("width", "100%");
  backBtn3.style("cursor", "pointer");
  backBtn3.style("pointer-events", "auto");
  backBtn3.mousePressed(() => showStep("prompt2"));

  flowerPreviewWrap = createDiv().id("flower-preview-wrap").parent(root).addClass("gg-wrap");
  flowerPreviewWrap.style("z-index", "100");
  flowerPreviewWrap.style("pointer-events", "auto");

  const card4 = createDiv().addClass("gg-card").parent(flowerPreviewWrap);
  card4.style("max-width", "460px");
  card4.style("width", "460px");
  card4.style("box-sizing", "border-box");
  card4.style("padding", "24px 28px 20px 28px");
  createElement("h2", "Your Flower").style("text-align", "center").style("color", "#0f5132").style("font-size", "18px").style("font-weight", "700").style("margin", "0 0 4px 0").parent(card4);
  
  const flowerNameDiv = createDiv().id("flower-name").parent(card4);
  flowerNameDiv.style("text-align", "center");
  flowerNameDiv.style("font-size", "13px");
  flowerNameDiv.style("color", "#2c7a7b");
  flowerNameDiv.style("font-style", "italic");
  flowerNameDiv.style("margin-bottom", "10px");

  const previewHolder = createDiv().id("preview-holder").parent(card4);
  previewHolder.style("width", "160px");
  previewHolder.style("height", "160px");
  previewHolder.style("margin", "0 auto 10px auto");
  previewHolder.style("display", "flex");
  previewHolder.style("align-items", "center");
  previewHolder.style("justify-content", "center");

  const quoteDiv = createDiv().id("flower-quote").parent(card4);
  quoteDiv.style("text-align", "center");
  quoteDiv.style("font-size", "13px");
  quoteDiv.style("color", "#4a7c6f");
  quoteDiv.style("font-style", "italic");
  quoteDiv.style("margin", "0 0 14px 0");
  quoteDiv.style("line-height", "1.5");
  quoteDiv.style("padding", "0 8px");

  createP("Choose your flower color:").style("text-align", "center").style("font-size", "13px").style("font-weight", "600").style("color", "#0f5132").style("margin", "0 0 8px 0").parent(card4);

  colorPickerSelect = createSlider(0, 360, chosenHue);
  colorPickerSelect.parent(card4);
  colorPickerSelect.addClass("gg-hue-slider");
  colorPickerSelect.style("width", "100%");
  colorPickerSelect.style("pointer-events", "auto");
  colorPickerSelect.style("margin-bottom", "14px");

  const sliderEl = colorPickerSelect.elt;
  sliderEl.style.background =
    "linear-gradient(90deg,#f7a9a8,#f4e98c,#9be4a5,#8dd7f5,#c9a4f9,#f79ad3,#f7a9a8)";
  sliderEl.style.borderRadius = "999px";

  colorPickerSelect.input(() => {
    chosenHue = colorPickerSelect.value();
    updateFlowerPreview();
  });

  plantBtn = createButton("Plant in Garden").parent(card4);
  plantBtn.style("background", "#4db6ac");
  plantBtn.style("color", "white");
  plantBtn.style("border", "none");
  plantBtn.style("border-radius", "12px");
  plantBtn.style("padding", "14px");
  plantBtn.style("font-size", "15px");
  plantBtn.style("font-weight", "600");
  plantBtn.style("width", "100%");
  plantBtn.style("cursor", "pointer");
  plantBtn.style("margin-bottom", "8px");
  plantBtn.style("pointer-events", "auto");
  plantBtn.mousePressed(() => {
    addFlower(dayRating, dayShaper, journalEntry, chosenSpecies, chosenHue);
    flowers[flowers.length - 1].growthStartTime = millis();
    showStep("garden");
    dayRating = "";
    dayShaper = "";
    journalEntry = "";
    if (journalField) journalField.value("");
  });

  gardenWrap = createDiv().id("garden-wrap").parent(root);
  gardenWrap.style("pointer-events", "none");

  const plantAnotherBtn = createButton("+ Plant Another Flower").id("plant-another-btn").parent(gardenWrap);
  plantAnotherBtn.style("display", "none");
  plantAnotherBtn.style("pointer-events", "auto");
  plantAnotherBtn.style("position", "absolute");
  plantAnotherBtn.style("top", "28px");
  plantAnotherBtn.style("left", "50%");
  plantAnotherBtn.style("transform", "translateX(-50%)");
  plantAnotherBtn.style("background", "#2c7a7b");
  plantAnotherBtn.style("color", "white");
  plantAnotherBtn.style("border", "none");
  plantAnotherBtn.style("border-radius", "999px");
  plantAnotherBtn.style("padding", "12px 24px");
  plantAnotherBtn.style("font-size", "15px");
  plantAnotherBtn.style("font-weight", "600");
  plantAnotherBtn.style("cursor", "pointer");
  plantAnotherBtn.style("z-index", "30");
  plantAnotherBtn.style("box-shadow", "0 4px 14px rgba(0,0,0,0.18)");
  plantAnotherBtn.mousePressed(() => {
    resetPromptSelections();
    showStep("prompt1");
  });

  const clearBtn = createButton("Clear Garden").id("clear-garden-btn").parent(gardenWrap);
  clearBtn.style("display", "none");
  clearBtn.style("pointer-events", "auto");
  clearBtn.style("position", "absolute");
  clearBtn.style("top", "28px");
  clearBtn.style("right", "16px");
  clearBtn.style("background", "#e57373");
  clearBtn.style("color", "white");
  clearBtn.style("border", "none");
  clearBtn.style("border-radius", "999px");
  clearBtn.style("padding", "10px 18px");
  clearBtn.style("font-size", "13px");
  clearBtn.style("font-weight", "600");
  clearBtn.style("cursor", "pointer");
  clearBtn.style("z-index", "30");
  clearBtn.style("opacity", "0.85");
  clearBtn.mousePressed(() => {
    if (confirm("Clear all flowers and start fresh?")) {
      flowers = [];
      flowerCounter = 0;
      localStorage.removeItem(STORAGE_KEY);
      hoveredFlower = null;
      resetPromptSelections();
      showStep("prompt1");
    }
  });

  saveBtn = createButton("Save PNG").id("save-btn").parent(gardenWrap);
  saveBtn.style("display", "none");
  saveBtn.style("pointer-events", "auto");
  saveBtn.style("position", "absolute");
  saveBtn.style("top", "82px");
  saveBtn.style("right", "16px");
  saveBtn.style("background", "#e8f6f3");
  saveBtn.style("border", "1px solid #cfe5e1");
  saveBtn.style("color", "#0f5132");
  saveBtn.style("padding", "8px 14px");
  saveBtn.style("border-radius", "8px");
  saveBtn.style("font-size", "13px");
  saveBtn.style("font-weight", "500");
  saveBtn.style("cursor", "pointer");
  saveBtn.style("z-index", "30");
  saveBtn.mousePressed(() => {
    isSaving = true;
    setTimeout(() => {
      saveCanvas("my_gratitude_garden", "png");
      isSaving = false;
    }, 80);
  });

  tipsCard = createDiv().id("tips-card").parent(gardenWrap);
  tipsCard.style("pointer-events", "none");
  createElement("h3", "Garden Tips").parent(tipsCard);
  const ul = createElement("ul").parent(tipsCard);
  createElement("li", "Each flower reflects your mood today.").parent(ul);
  createElement("li", "Your newest flower will have sparkles around it.").parent(ul);
  createElement("li", "Your garden is saved on this device automatically.").parent(ul);
  createElement("li", "Click the name at the top to personalize your garden.").parent(ul);
  tipsCard.style("display", "none");

  const nameWrap = createDiv().id("name-wrap").parent(gardenWrap);
  nameWrap.style("display", "none");
  nameWrap.style("pointer-events", "auto");
  nameWrap.style("position", "absolute");
  nameWrap.style("top", "110px");
  nameWrap.style("left", "50%");
  nameWrap.style("transform", "translateX(-50%)");
  nameWrap.style("z-index", "30");
  nameWrap.style("align-items", "baseline");
  nameWrap.style("gap", "0px");
  nameWrap.style("white-space", "nowrap");

  const nameField = createElement("input").parent(nameWrap);
  nameField.attribute("type", "text");
  nameField.attribute("placeholder", "Your name");
  nameField.attribute("maxlength", "30");
  nameField.style("border", "none");
  nameField.style("border-bottom", "2px solid transparent");
  nameField.style("border-radius", "0");
  nameField.style("padding", "2px 4px");
  nameField.style("font-family", "'Inter', sans-serif");
  nameField.style("font-size", "15px");
  nameField.style("font-weight", "700");
  nameField.style("color", "#0f5132");
  nameField.style("background", "transparent");
  nameField.style("outline", "none");
  nameField.style("width", "80px");
  nameField.style("min-width", "40px");
  nameField.style("max-width", "200px");
  nameField.style("pointer-events", "auto");
  nameField.style("text-align", "right");
  nameField.style("cursor", "default");
  nameField.style("transition", "border-color 0.2s");

  const resizeNameField = () => {
    const tmp = document.createElement("span");
    tmp.style.cssText = "font-size:15px;font-weight:700;visibility:hidden;position:absolute;white-space:pre;";
    tmp.textContent = nameField.elt.value || nameField.elt.placeholder;
    document.body.appendChild(tmp);
    const w = Math.max(40, tmp.offsetWidth + 6);
    nameField.elt.style.width = w + "px";
    document.body.removeChild(tmp);
  };
  nameField.elt.addEventListener("input", resizeNameField);
  if (gardenName) setTimeout(resizeNameField, 50);

  nameField.elt.addEventListener("mouseenter", () => {
    nameField.elt.style.borderBottomColor = "#4db6ac";
    nameField.elt.style.cursor = "text";
  });
  nameField.elt.addEventListener("mouseleave", () => {
    if (document.activeElement !== nameField.elt) {
      nameField.elt.style.borderBottomColor = "transparent";
      nameField.elt.style.cursor = "default";
    }
  });
  nameField.elt.addEventListener("focus", () => {
    nameField.elt.style.borderBottomColor = "#4db6ac";
    nameField.elt.style.cursor = "text";
  });

  const nameSuffix = createSpan("'s Gratitude Garden").parent(nameWrap);
  nameSuffix.style("font-family", "'Inter', sans-serif");
  nameSuffix.style("font-size", "15px");
  nameSuffix.style("font-weight", "700");
  nameSuffix.style("color", "#0f5132");
  nameSuffix.style("pointer-events", "none");
  nameSuffix.style("text-shadow", "1px 1px 0 rgba(255,255,255,0.6)");

  if (gardenName) nameField.value(gardenName);

  const saveName = () => {
    gardenName = nameField.value().trim();
    localStorage.setItem(STORAGE_KEY + "_name", gardenName);
  };

  nameField.elt.addEventListener("blur", saveName);
  nameField.elt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { saveName(); nameField.elt.blur(); }
  });

  buildLogo();
}

function updateFlowerPreview() {
  const holder = select("#preview-holder");
  if (!holder) return;

  holder.elt.innerHTML = "";

  if (!previewGraphics) {
    previewGraphics = createGraphics(160, 160);
    previewGraphics.angleMode(DEGREES);
    previewGraphics.colorMode(HSL, 360, 100, 100, 1);
  }

  previewGraphics.clear();
  drawPreviewFlower(previewGraphics, chosenSpecies, chosenHue);

  const canvas = previewGraphics.canvas;
  if (canvas) {
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.objectFit = "contain";
    holder.elt.appendChild(canvas);
  }

  const data = flowerMeanings[chosenSpecies];
  if (data) {
    const speciesLabel = chosenSpecies.charAt(0).toUpperCase() + chosenSpecies.slice(1);

    const nameDiv = select("#flower-name");
    if (nameDiv) {
      nameDiv.html(`${speciesLabel} &mdash; ${data.meaning}`);
    }

    const quoteDiv = select("#flower-quote");
    if (quoteDiv) {
      quoteDiv.html(`"${data.quote}"`);
    }
  }
}

function showStep(s) {
  step = s;

  const showPrompt1 = s === "prompt1";
  const showPrompt2 = s === "prompt2";
  const showPrompt3 = s === "prompt3";
  const showFlower  = s === "flowerPreview";

  if (prompt1Wrap) {
    const el = prompt1Wrap.elt;
    el.style.display          = showPrompt1 ? "flex" : "none";
    el.style.flexDirection    = "column";
    el.style.alignItems       = "center";
    el.style.justifyContent   = "center";
  }
  if (prompt2Wrap) prompt2Wrap.elt.style.display = showPrompt2 ? "flex" : "none";
  if (prompt3Wrap) prompt3Wrap.elt.style.display = showPrompt3 ? "flex" : "none";
  if (flowerPreviewWrap) flowerPreviewWrap.elt.style.display = showFlower ? "flex" : "none";

  gardenWrap.style("display", "block");

  if (canvas) {
    canvas.elt.style.pointerEvents = (s === "garden") ? "auto" : "none";
  }

  const hasFlower = flowers && flowers.length > 0;

  if (saveBtn) {
    saveBtn.style("display", s === "garden" && hasFlower ? "block" : "none");
  }
  if (tipsCard) {
    tipsCard.style("display", s === "garden" && hasFlower ? "block" : "none");
  }

  const plantAnotherBtn = select("#plant-another-btn");
  if (plantAnotherBtn) {
    plantAnotherBtn.style("display", s === "garden" ? "block" : "none");
  }

  const clearBtn = select("#clear-garden-btn");
  if (clearBtn) {
    clearBtn.style("display", s === "garden" ? "block" : "none");
  }

  const nameWrap = select("#name-wrap");
  if (nameWrap) {
    nameWrap.style("display", s === "garden" ? "flex" : "none");
  }

  const logo = select("#gg-logo");
  if (logo) {
    logo.style("display", s === "garden" && hasFlower ? "block" : "none");
  }

  loop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  groundLevel = height * 0.76;
  buildClouds(true);
  updateResponsiveFlowerLayout();
}

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
    checkHover(mouseX, mouseY);
  });

  canvas.touchStarted(() => {
    if (step !== "garden") return;
    if (touches && touches.length > 0) {
      checkHover(touches[0].x, touches[0].y);
    }
    return false;
  });

  angleMode(DEGREES);
  noiseSeed(9999);
  buildClouds();
  
  groundLevel = height * 0.76;
  updateResponsiveFlowerLayout();

  if (flowers.length === 0) {
    showStep("prompt1");
  } else {
    showStep("garden");
  }
}

function draw() {
  background(240);
  drawSky();
  drawSunGradient();
  drawClouds();

  // Back row: all flowers behind the back hill
  drawFlowersStemsOnly("back");
  drawFlowersGrowingOnly("back");
  drawFlowersBloomsOnly("back");
  drawHillsBack();

  // Mid row: all flowers first, then hillsFront covers their base
  drawFlowersStemsOnly("mid");
  drawFlowersGrowingOnly("mid");
  drawFlowersBloomsOnly("mid");
  drawHillsFront();

  // Front row: all flowers first, then foregroundHill covers their base
  drawGround();
  drawFlowersStemsOnly("front");
  drawFlowersGrowingOnly("front");
  drawFlowersBloomsOnly("front");
  drawForegroundHill();
  drawAllDates();
  drawNewestSparkles();

  if (isSaving) {
    return;
  }

  if (step === "garden") {
    if (!isTouchDevice) {
      checkHover();
    }

    if (hoveredFlower) {
      drawHoverTooltip();
    }
  }
}