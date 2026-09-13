/* Personal Gratitude Garden - Memory Journal */
/* One flower a day. The daily gate below is the whole point of the garden:
   it is a practice you come back to, not something to fill in one sitting. */
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
let logoDiv;
let nameSuffixEl = null;
let fitTitle = () => {};

/* The garden's own title. It was 15px Arial against a 21px serif "Garden Tips"
   in the corner, so the loudest heading on the page was a side note. 26px is
   the size a heading inside a card takes across this project, and it is the
   serif every other page puts its headings in. The note under it takes 15px,
   the 0.58 ratio the bouquet's steps use under their own 26px heading. */
const NAME_FONT = "'Fraunces', 'Georgia', serif";
const NAME_PX = 28;
/* 13, not 15. The garden's name and the line under it are a title and its
   subtext like any other, and Georgia has no semibold to lean on, so the ratio
   is what gives the title its presence: 2.15 here, the same as a bouquet step. */
const NOTE_PX = 13;
/* #name-wrap is nowrap and centred, so at 26px it cannot fall back to a second
   line: "Keni's Gratitude Garden" alone is 336px, and the field takes names up
   to 30 characters. fitTitle shrinks the whole title until it fits the window,
   down to a floor, rather than letting a long name run off both edges. */
/* 13, not 15: a 30 character name at 15px is still 356px, which is wider
   than a 380px layout leaves. Only the longest names on the narrowest layouts
   ever reach the floor. */
/* 16 ON A PHONE, 13 anywhere else, and the 16 is not a design choice. iOS
   zooms the page in when a focused input is under 16px and does not zoom back
   out, and the garden's name IS an input. The phone block's blanket 16px floor
   on text fields was doing that job and getting it wrong in the process: it
   raised the INPUT and not the "'s Gratitude Garden" beside it, so the title
   came out in two different sizes. Setting the floor here instead keeps
   `fitTitle` the one thing that decides, and it sizes both halves together. */
const NAME_PX_MIN = (typeof window !== "undefined" && window.innerWidth <= 768) ? 16 : 13;
let titlePx = NAME_PX;

let prompt1Wrap, prompt2Wrap, prompt3Wrap, flowerPreviewWrap, gardenWrap;
let continueBtn1, continueBtn2, continueBtn3;
let journalField;
let colorPickerSelect, plantBtn;
let saveBtn, tipsCard, dailyNote;
/* The photo picked on the journal step, held until the flower is planted. */
let photoInput = null, photoThumb = null, photoFile = null;
let previewGraphics;
let gardenName = "";

const STORAGE_KEY = "personal_gratitude_garden";
const LAST_PLANT_KEY = "gratitude_last_planted";

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
  /* HIDDEN. The orchid and the chrysanthemum below are drawn everywhere the
     other eight are, but they are in no picker and no mood map, so nothing can
     plant one. They were built as florist orderable stand ins for the lotus and
     the sakura; that is meant to become its own separate thing for the real
     bouquet rather than a change to this garden.

     Their keyword lists are EMPTY, not missing. `chooseFlowerForMood` reads
     `.keywords` off entries here, so a removed or renamed field throws the
     moment anyone writes a journal entry. The real lists are parked alongside
     under `keywordsHidden`, ready to swap back in. */
  orchid: {
    keywords: [],
    keywordsHidden: ["difficult", "struggling", "overwhelmed", "swamped", "pushing through", "accepting", "strong", "despite", "kept going", "still here", "persevering", "surviving", "managing", "enduring", "holding on", "held it together", "composed"],
    meaning: "grace & endurance",
    quote: "You held yourself together today, and that took more than anyone saw. That is its own kind of strength."
  },
  chrysanth: {
    keywords: [],
    keywordsHidden: ["grateful", "gratitude", "thankful", "noticed", "noticing", "memory", "remember", "appreciating", "appreciate", "present", "savoured", "savored", "small moment", "took it in", "paused"],
    meaning: "reflection & presence",
    quote: "You noticed something worth holding onto today. That kind of awareness is rare and beautiful."
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
  const boot = window.__gardenBoot || { flowers: [], name: "" };
  flowers = Array.isArray(boot.flowers) ? boot.flowers : [];
  flowerCounter = flowers.length;
  // Loaded flowers are already fully grown, so force the BLOOM stage
  flowers.forEach(f => {
    f.growthStage = GROWTH_STAGES.BLOOM;
    f.growthStartTime = 0;
    f.isOld = true;
  });
  gardenName = boot.name || "";
  if (flowers.length > 0) {
  flowers.forEach(f => f.isLatest = false);
  flowers[flowers.length - 1].isLatest = true;
}
}

function saveGarden() {
  if (window.GardenStore) window.GardenStore.save(flowers);
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
    /* Only species that can actually be planted are counted. `flowerMeanings`
       also holds the hidden orchid and chrysanthemum, and without this guard a
       keyword hit on one of those would write `votes[undefined]` and quietly
       poison the result. */
    Object.keys(votes).forEach(species => {
      const m = flowerMeanings[species];
      if (!m || !m.keywords) return;
      m.keywords.forEach(keyword => {
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
    sakura: 5,
    orchid: 5,
    chrysanth: 18
  }[id] || 16;
}

function defaultSat(sp) {
  return { daisy: 45, tulip: 50, rose: 55, sunflower: 60, lily: 40, sakura: 40, lotus: 50, orchid: 50, chrysanth: 48, lavender: 55 }[sp] || 45;
}

function defaultLight(sp) {
  return { daisy: 65, tulip: 60, rose: 55, sunflower: 65, lily: 70, sakura: 75, lotus: 70, orchid: 68, chrysanth: 72, lavender: 68 }[sp] || 65;
}

function getTodayDate() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  const year  = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/* The marker is a cache; the garden is the truth.
   Every flower carries the date it was planted, so "have I planted today" is
   answerable from the flowers alone. The marker is still read first because it
   is what follows an account between devices, but when the two disagree the
   garden wins and the marker is repaired. This only ever unblocks: a marker
   that says today with no flower dated today is stale, and before this it shut
   the prompts off with nothing on screen to say why and no way back except
   clearing storage by hand.

   loadGarden() runs in preload(), which p5 finishes before setup(), so
   `flowers` is populated by the time anything asks. */
function hasPlantedToday() {
  const today = getTodayDate();
  const last = window.GardenStore ? window.GardenStore.lastPlanted() : "";
  if (last !== today) return false;
  if (flowers.some(f => f && f.date === today)) return true;
  if (window.GardenStore) window.GardenStore.markPlanted("");
  return false;
}

function markPlantedToday() {
  if (window.GardenStore) window.GardenStore.markPlanted(getTodayDate());
}

function addFlower(dayRating, dayShaper, journal, species, hue) {
  if (hasPlantedToday()) return;
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
const stemScale = width < 720 ? 0.7 : 1;
minStem = height * lerp(0.13, 0.19, t) * stemScale;
maxStem = height * lerp(0.17, 0.23, t) * stemScale;
  } else if (midFlowers.length < ROW_CAPACITY) {
const t = midFlowers.length / ROW_CAPACITY;
targetLayer = "mid";
targetBaseY = groundLevel - height * 0.10;
const stemScale = width < 720 ? 0.7 : 1;
minStem = height * lerp(0.17, 0.23, t) * stemScale;
maxStem = height * lerp(0.21, 0.27, t) * stemScale;
} else {
const t = backFlowers.length / ROW_CAPACITY;
targetLayer = "back";
targetBaseY = groundLevel - height * 0.17;
const stemScale = width < 720 ? 0.7 : 1;
minStem = height * lerp(0.11, 0.17, t) * stemScale;
maxStem = height * lerp(0.15, 0.21, t) * stemScale;
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

  flowers.forEach(f => f.isLatest = false);
  
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
    isLatest: true,
    plantedTime: Date.now()
  };

  flowers.push(newFlower);
  saveGarden();
  if (typeof tintCursor === "function") tintCursor();
  if (window.GardenJournal) {
    const day = GardenJournal.fromUS(newFlower.date);
    const entry = {
      day: day, species: newFlower.species,
      hue: Math.round(newFlower.hue), sat: Math.round(newFlower.sat),
      light: Math.round(newFlower.light), word: "", note: newFlower.journal || ""
    };
    /* The photo goes up here, not when it was chosen, so one picked and then
       abandoned never reaches the database. The entry is written either way:
       an upload that fails costs the day nothing. */
    if (photoFile && GardenJournal.uploadPhoto) {
      GardenJournal.uploadPhoto(day, photoFile).then(function (path) {
        if (path) { newFlower.photo = path; entry.photo = path; saveGarden(); }
        photoFile = null;
        GardenJournal.record("personal", entry);
      });
    } else {
      GardenJournal.record("personal", entry);
    }
  }
  updateResponsiveFlowerLayout();
  markPlantedToday();
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

/* Phalaenopsis, face on. Three narrow sepals behind (one up, two down), two
   broad petals in front, and the lip at the bottom in a deeper tone. The lip
   is what makes it read as an orchid rather than a generic five petalled
   bloom, so it keeps real contrast. Unlike the lotus it replaces, this is a
   CENTRED bloom, so it needs none of lotus's origin nudge or label offset. */
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
   inward so it reads as a ball rather than a disc. Drawn as a pompom and not
   as a single flat bloom for a specific reason: a chrysanthemum is in the same
   family as the daisy, and drawn simply the two are the same picture twice. */
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

function bloomShadow(f, R, alphaK) {
  var k = (alphaK === undefined) ? 1 : alphaK;
  if (k <= 0) return;
  var box = BLOOM_BOX[f.species] || BLOOM_BOX.daisy;
  var ctx = drawingContext;

  /* THE OFFSET AND THE BLUR ARE DEVICE PIXELS AND THE TRANSFORM DOES NOT
     TOUCH THEM, so both have to be converted by hand. It used to multiply by
     the pixel density alone, which is right only while nothing else has
     scaled the canvas. It reads the LIVE horizontal scale off the matrix
     instead, so a bloom drawn inside a `scale()` still gets its shadow in
     the right place.

     What went wrong without it is worth keeping: the shape is drawn 6000
     units off to the right and dragged back purely as its own shadow, so an
     unaccounted scale of k left the shadow at 6000*(k-1) device pixels from
     where it belongs. Growing a bloom from 0.18 to 1 therefore slid its
     shadow in from somewhere off the left of the screen and snapped it into
     place at the last frame, which is the pop that was visible. */
  var m = (ctx.getTransform ? ctx.getTransform() : null);
  var sx = m ? Math.sqrt(m.a * m.a + m.b * m.b) : 1;
  if (!(sx > 0)) sx = 1;
  var FAR = 6000;                       /* far outside any canvas */

  /* CENTRED on the bloom, not dropped below it, and light. A shadow cast down
     and to the side says the light is low and hard, which is the wrong
     weather for a pastel garden: it read as a heavy smudge under every
     flower. Centred and soft it is a halo that separates the bloom from the
     grass and says nothing about the sun at all, which is what this needed to
     do in the first place. */
  ctx.save();
  ctx.shadowColor = "rgba(18,62,56," + (0.18 * k).toFixed(3) + ")";
  ctx.shadowBlur = Math.max(6, R * 0.32) * sx;
  ctx.shadowOffsetX = -FAR * sx;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(FAR, box[0] * R, box[1] * R * SHADOW_FIT, box[2] * R * SHADOW_FIT,
              0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
/* `shadowK` scales the drop shadow, 0 for none. A growing bloom passes a
   ramp so the shadow arrives with the flower rather than appearing whole on
   one frame. Everything else leaves it out and gets the full shadow. */
function drawBloom(f, shadowK) {
  colorMode(HSL, 360, 100, 100, 1);
  noStroke();

  const R     = f.size;
  const hue   = f.hue;
  const sat   = f.sat;
  const light = f.light;
  bloomShadow(f, R, shadowK);

  if (f.species === "tulip") {
    drawTulipBloom(R, hue, sat, light);
  } else if (f.species === "rose") {
    drawRoseBloom(R, hue, sat, light);
  } else if (f.species === "sunflower") {
    drawSunflowerBloom(R, hue, sat, light);
  } else if (f.species === "sakura") {
    drawCherryBloom(R, hue, sat, light);
  } else if (f.species === "chrysanth") {
    drawChrysanthBloom(R, hue, sat, light);       /* hidden from the picker, drawn anyway */
  } else if (f.species === "orchid") {
    drawOrchidBloom(R, hue, sat, light);          /* hidden from the picker, drawn anyway */
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
  } else if (species === "chrysanth") {
    drawChrysanthBloomOnGraphics(pg, R, hue, sat, light);
  } else if (species === "orchid") {
    drawOrchidBloomOnGraphics(pg, R, hue, sat, light);
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

function drawOrchidBloomOnGraphics(pg, R, hue, sat, light) {
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

function drawChrysanthBloomOnGraphics(pg, R, hue, sat, light) {
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
  let newest = flowers.find(f => f.isLatest);
  if (!newest) return;
  if (newest.growthStage !== GROWTH_STAGES.BLOOM) return;

  const alpha = 1;

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

/* `lenK` is how far the pair has unfolded, 1 when finished, and `tAt` is
   where on the curve they sit. Both are optional: every finished flower
   calls this with neither and gets exactly what it always got. A growing one
   passes both, because on a half risen stem the attachment point is at a
   different PARAMETER even though it is at the same HEIGHT. */
function drawLeavesOnStem(x0, y0, c1x, c1y, c2x, c2y, x3, y3, lenK, tAt) {
  const tAttach = (tAt === undefined) ? LEAF_T : tAt;
  const baseLen = 32;
  const k = (lenK === undefined) ? 1 : lenK;
  if (k <= 0) return;

  const scaleFactor = (width < 720 ? gardenScale : 1);
  const len = baseLen * scaleFactor * k;

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

/* GROWING, in two stages that lead into each other rather than cutting.

   It was a green ellipse on a stub for two seconds, then a longer stem with a
   slightly bigger green ellipse for three, and then the finished bloom at full
   size in a single frame: three pictures rather than one thing growing.

   Now the stem rises the whole way with a real BUD riding its tip, the bud
   ripens from leaf green to the flower's own colour as it climbs, and then it
   OPENS, the bloom scaling up out of it while the bud shrinks away behind.

   THE TIMINGS AND THE SHAPES ARE THE SAME IN BOTH GARDENS, and they are
   written out in each rather than shared, like the seven copies of the flower
   maths, because the drawing goes through p5's globals. **Edit one and edit
   the other.** */
const GROW_RISE = 3400;   /* stem from nothing to full, bud on the tip */
const GROW_OPEN = 1700;   /* the bud opens into the bloom */

function growEase(t) { return 1 - Math.pow(1 - t, 3); }

/* THE LEAVES. They used to arrive in a single frame at the very end, because
   nothing drew them until growth was over and `drawFlowerStemAndLeaves` took
   over, so a finished flower simply had leaves that the growing one never
   had. They now unfold while the stem is still climbing.

   `LEAF_T` is where they attach along the stem's curve and has always been
   0.60. `LEAF_FRAC` is what that means as a fraction of the stem's HEIGHT,
   and the two are not the same number. It is `bezierPoint(0, 0.4, 0.7, 1,
   0.60)`, which is 0.6336, and it does not depend on how long the stem is:
   the rising stem is the finished one with every control point scaled by the
   same amount, so those 0.4 and 0.7 are constants.

   That is what lets a leaf STAY WHERE IT CAME OUT while the stem goes on
   growing past it, which is what a plant does. Drawn at a fixed parameter
   instead, the leaves slide up the stem with the tip. */
const LEAF_T = 0.60;
const LEAF_FRAC = 0.6336;   /* bezierPoint(0, 0.4, 0.7, 1, LEAF_T) */
/* The moment the tip first reaches that height, inverting `growEase`. */
const LEAF_AT = GROW_RISE * (1 - Math.cbrt(1 - LEAF_FRAC));

/* THE LEAVES FINISH WITH THE BLOOM, not before it. They used to unfold over
   900ms and then sit at full size for the remaining three seconds, so the
   one thing still visibly growing while the flower opened was the flower,
   and the leaves read as having been dropped in and stopped. They now run
   from the moment they appear all the way to the end of the whole sequence.

   `leafEase` is a smoothstep, NOT the cubic ease-out the stem uses.
   `growEase` is 0.93 of the way done by the time the bloom starts opening,
   which over a four second ramp is the same early finish in a slower dress.
   A smoothstep is 0.63 there, so a third of the growth is still to come
   while the petals open, and it leaves and arrives gently, which is what
   lets them start from nothing without reading as a pop. */
function leafEase(t) { return t * t * (3 - 2 * t); }
function leafGrowth(elapsed) {
  const span = GROW_RISE + GROW_OPEN - LEAF_AT;
  return leafEase(constrain((elapsed - LEAF_AT) / span, 0, 1));
}

/* Which PARAMETER on the current curve sits at a given fraction of the
   finished stem's height. Bisection, since the cubic has no tidy inverse and
   eighteen halvings put it well inside a pixel. */
function stemParamAtFrac(frac) {
  if (frac >= 1) return 1;
  if (frac <= 0) return 0;
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) * 0.5;
    if (bezierPoint(0, 0.4, 0.7, 1, mid) < frac) lo = mid; else hi = mid;
  }
  return (lo + hi) * 0.5;
}

/* A closed bud: a teardrop with two sepals at its foot and one seam down it,
   drawn around the origin so the caller only has to stand at the stem's tip.

   `colorMode` is set INSIDE, because the growth pass runs in RGB (the stems
   are `stroke(40, 120, 90)`) while a flower's own colour is HSL, and lerping
   between the two needs them in one space. p5's push saves the mode. */
/* The shorter of the two ways round a 360 degree wheel. See the note in
   `drawBudShape`. Identical in both gardens. */
function shortHue(from, to, t) {
  const d = ((to - from + 540) % 360) - 180;
  return (from + d * t + 360) % 360;
}

function drawBudShape(f, r, ripe) {
  const w = r * 0.60;
  push();
  colorMode(HSL, 360, 100, 100, 1);
  noStroke();
  /* Sepals first, so the bud sits in front of them. */
  fill(122, 34, 38);
  ellipse(-w * 0.62, r * 0.42, w * 1.0, r * 0.62);
  ellipse(w * 0.62, r * 0.42, w * 1.0, r * 0.62);
  /* A BUD RIPENS THE SHORT WAY ROUND THE WHEEL, and `lerpColor` does not.
     It moves every component in a straight line, so a green bud at hue 112
     ripening into a rose at 350 was walked through 231 on the way: the bud
     came out PURPLE on every warm flower, which is the one thing a red rose
     bud must not be. Taking the shorter arc sends it 112 to 51 to 350, down
     through yellow green and orange, which is how a bud actually colours up.
     Saturation and lightness are straight lines; only hue is an angle. */
  const skin = color(shortHue(112, f.hue, ripe),
                     lerp(36, f.sat, ripe),
                     lerp(50, f.light, ripe));
  fill(skin);
  beginShape();
  vertex(0, -r);
  bezierVertex(w * 1.06, -r * 0.44, w * 0.94, r * 0.52, 0, r * 0.64);
  bezierVertex(-w * 0.94, r * 0.52, -w * 1.06, -r * 0.44, 0, -r);
  endShape(CLOSE);
  /* One seam, so it reads as wrapped rather than as a leaf. */
  noFill();
  stroke(hue(skin), saturation(skin), max(0, lightness(skin) - 14), 0.65);
  strokeWeight(max(1, r * 0.1));
  bezier(0, -r * 0.82, w * 0.42, -r * 0.3, w * 0.34, r * 0.2, 0, r * 0.5);
  pop();
}

function drawFlowerWithGrowth(f) {
  const elapsed = millis() - f.growthStartTime;
  const scaleFactor = (width < 720 ? gardenScale : 1);
  if (elapsed >= GROW_RISE + GROW_OPEN) { drawFlowerStemAndLeaves(f); return; }

  const budR = max(7, f.size * 0.34 * scaleFactor);
  const weight = max(2, (f.size / 40) * 3) * scaleFactor;

  if (elapsed < GROW_RISE) {
    /* RISING. The stem EASES OUT, so it leaves the ground quickly and slows as
       it arrives, which is what reads as growing rather than as a line being
       extended at a constant rate. */
    const p = growEase(elapsed / GROW_RISE);
    const len = f.stemLen * p;
    push();
    stroke(40, 120, 90);
    strokeWeight(weight);
    noFill();
    bezier(0, 0, 10 * p, -len * 0.4, -6 * p, -len * 0.7, 0, -len);
    pop();
    /* The pair unfolds once the tip has climbed past where they belong. They
       are placed by HEIGHT, not by parameter, so they stay put while the
       stem carries on past them. */
    if (p >= LEAF_FRAC) {
      drawLeavesOnStem(0, 0, 10 * p, -len * 0.4, -6 * p, -len * 0.7, 0, -len,
                       leafGrowth(elapsed), stemParamAtFrac(LEAF_FRAC / p));
    }
    const r = budR * (0.45 + 0.55 * p);
    push();
    translate(0, -len - r * 0.5);
    /* Green for the first half of the climb, then ripening. */
    drawBudShape(f, r, constrain((p - 0.55) / 0.45, 0, 1));
    pop();
    return;
  }

  /* OPENING. The stem is done, so the bloom scales up out of the bud while the
     bud shrinks behind it: one becomes the other rather than swapping. */
  const q = growEase((elapsed - GROW_RISE) / GROW_OPEN);
  push();
  stroke(40, 120, 90);
  strokeWeight(weight);
  noFill();
  bezier(0, 0, 10, -f.stemLen * 0.4, -6, -f.stemLen * 0.7, 0, -f.stemLen);
  pop();
  /* STILL GROWING, and at their finished position. `leafGrowth` reaches 1
     exactly when this phase ends, so the handover to
     `drawFlowerStemAndLeaves`, which always draws them full size, lands on
     the same number rather than on a step. */
  drawLeavesOnStem(0, 0, 10, -f.stemLen * 0.4, -6, -f.stemLen * 0.7, 0, -f.stemLen,
                   leafGrowth(elapsed));

  if (q < 0.98) {
    push();
    translate(0, -f.stemLen - budR * 0.5 * (1 - q));
    drawBudShape(f, budR * (1 - q * 0.72), 1);
    pop();
  }
  /* NO SHADOW UNTIL THE BLOOM IS NEARLY THERE, then it comes up over the last
     third of the opening. A bud has nothing to cast one, and a shadow that
     simply switched on at the final frame would be the same pop in a
     different place. */
  push();
  translate(0, -f.stemLen);
  scale(0.18 + 0.82 * q);
  drawBloom(f, constrain((q - 0.66) / 0.34, 0, 1));
  pop();
}

// Bloomed stems only, drawn BEFORE their hill so the hill hides the base
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

// Growing sprouts, drawn AFTER their hill so they poke above it
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

// Blooms, drawn AFTER all hills so they float above the landscape
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
  if (f.isOld) return; // stop old flowers from animating

  const elapsed = millis() - f.growthStartTime;
  /* The same two figures the drawing uses, or a flower would be handed to the
     bloom pass while it is still opening and jump to full size. */
  if (elapsed < GROW_RISE) f.growthStage = GROWTH_STAGES.BUD;
  else if (elapsed < GROW_RISE + GROW_OPEN) f.growthStage = GROWTH_STAGES.STEM;
  else f.growthStage = GROWTH_STAGES.BLOOM;
}

// Bloomed stems only, drawn BEFORE their hill so the hill hides the base
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

// Growing sprouts, drawn AFTER their hill so they poke above it
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

// Blooms, drawn AFTER all hills so they float above the landscape
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

/* TAP A FLOWER TO READ THE DAY, which opens the book at that flower's own
   date. The hover box is a glance; this is the whole entry.

   Three guards, and each is load bearing:

   - p5 calls `mousePressed` for a press ANYWHERE in the window, not only on
     its canvas, so without the target test this fires while somebody is
     pressing a button on a prompt card or typing in the book itself.
   - Only in the garden step. On the prompt screens the canvas is behind a
     card and a flower under it is not something anybody is pointing at.
   - `checkHover` is re-run from the press position rather than trusting
     `hoveredFlower`, because a touch screen never fires a move first and the
     stored value would be whatever the last mouse happened to be over.

   Returning nothing rather than `false` leaves p5's own default alone. */
function mousePressed(event) {
  if (step !== "garden") return;
  var t = event && event.target;
  if (!t || String(t.tagName).toUpperCase() !== "CANVAS") return;
  if (!window.GardenJournal || !GardenJournal.openAt) return;
  checkHover(mouseX, mouseY);
  if (!hoveredFlower || !hoveredFlower.date) return;
  var day = GardenJournal.fromUS(hoveredFlower.date);
  if (day) GardenJournal.openAt(day);
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
  /* Nothing floats over the open book. The veil takes pointer events, so the
     hover can no longer be UPDATED once the book is up, but the last flower
     the pointer crossed stays set and its box would go on being painted
     underneath: a glance and the full entry on screen at once, which is the
     doubling the book exists to remove. */
  if (window.GardenJournal && GardenJournal.isOpen && GardenJournal.isOpen()) return;

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
    const headerText = `${speciesLabel}: ${flowerMeaning.meaning}`;
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

  /* A GLANCE, NOT THE WHOLE ENTRY. This box used to carry the mood, what
     shaped the day and the journal text as well, which is every word the
     book now opens with when you TAP the flower. Two places saying the same
     thing is the repetition the book was meant to remove, and the long
     version had a real cost besides: a paragraph of journal made the box
     taller than the flower it belonged to and it covered its own neighbours.

     Species, what it stands for, the date, and a line saying there is more.
     `Tap` rather than `Click`, since this garden is read on a phone too. */
  lines.push({ text: "---", bold: false, divider: true });
  lines.push({ text: f.date || "", bold: false, muted: true });
  lines.push({ text: "Tap to read the day", bold: false, muted: true });

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
  /* Cap stem height relative to width on narrow screens.
     This used to reference `f` outside the `for...of` that declared it, so it
     threw a ReferenceError on every resize under 720px and took the rest of
     windowResized() with it. The cap was never applied to anything; it applies
     to each flower now, which is what the loops above it do. */
  if (width < 720) {
    const maxStemForWidth = width * 0.45;
    for (const f of flowers) {
      if (f.stemLen > maxStemForWidth) f.stemLen = maxStemForWidth;
    }
  }
}

function buildLogo() {
  const logoImg = loadImage("LOGO-01.png", () => {
    logoDiv = createDiv();
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

/* Dead. Nothing calls this. It is showStep's logic again with different
   reset behaviour, and it never rendered the daily note, which is the bug
   buildUI used to carry. Route through showStep instead of reviving it. */
function updateScreen() {
  // ALWAYS show garden background
  gardenWrap.style("display", "block");

  // hide all overlays
  prompt1Wrap.style("display", "none");
  prompt2Wrap.style("display", "none");
  prompt3Wrap.style("display", "none");
  flowerPreviewWrap.style("display", "none");

  // HIDE garden UI by default
  if (saveBtn) saveBtn.style("display", "none");
  if (tipsCard) tipsCard.style("display", "none");

  // decide what to show
  if (hasPlantedToday()) {
    step = "garden";

    // show garden UI again
    if (saveBtn) saveBtn.style("display", "flex");
    if (tipsCard) tipsCard.style("display", "block");
    if (logoDiv) logoDiv.style("display", "block");

  } else {
    step = "prompt1";
    prompt1Wrap.style("display", "flex");
  }
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
  card1.style("width", "min(460px, 92vw)");
  card1.style("box-sizing", "border-box");
  card1.style("padding", "24px 28px 20px 28px");
  createElement("h3", "How was your day?").style("text-align", "center").style("color", "#0f5132").style("font-size", "23px").style("font-weight", "600").style("margin", "0 0 16px 0").parent(card1);
  
  const btnGrid1 = createDiv().parent(card1);
  btnGrid1.style("display", "grid");
  btnGrid1.style("grid-template-columns", "repeat(2, 1fr)");
  btnGrid1.style("gap", "9px");
  btnGrid1.style("margin-bottom", "16px");

  dayRatingOptions.forEach(option => {
    const btn = createButton(option);
    btn.parent(btnGrid1);
    btn.style("padding", "13px");
    btn.style("border", "2px solid #bde0d6");
    btn.style("border-radius", "10px");
    btn.style("background", "white");
    btn.style("cursor", "pointer");
    btn.style("font-size", "15px");
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
  continueBtn1.style("font-weight", "700");
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
  card2.style("width", "min(460px, 92vw)");
  card2.style("box-sizing", "border-box");
  card2.style("padding", "24px 28px 20px 28px");
  createElement("h3", "What shaped your day?").style("text-align", "center").style("color", "#0f5132").style("font-size", "23px").style("font-weight", "600").style("margin", "0 0 16px 0").parent(card2);
  
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
  continueBtn2.style("font-weight", "700");
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
  card3.style("max-width", "460");
  card3.style("width", "min(460px, 92vw)");
  card3.style("box-sizing", "border-box");
  card3.style("padding", "24px 28px 20px 28px");
  createElement("h3", "Anything else?").style("text-align", "center").style("color", "#0f5132").style("font-size", "23px").style("font-weight", "600").style("margin", "0 0 2px 0").parent(card3);
  createP("Optional, add more thoughts if you'd like").addClass("gg-sub").style("font-size", "13px").style("margin", "0 0 12px 0").style("text-align", "center").style("color", "#5a9e8e").parent(card3);
  
  journalField = createElement("textarea").parent(card3);
  journalField.attribute("maxlength", "500");
  journalField.attribute("placeholder", "Additional thoughts or reflections...");
  journalField.style("width", "100%");
  journalField.style("box-sizing", "border-box");
  journalField.style("border", "2px solid #bde0d6");
  journalField.style("border-radius", "12px");
  journalField.style("height", "150px");
  journalField.style("padding", "14px 16px");
  journalField.style("font-size", "16px");
  journalField.style("resize", "none");
  journalField.style("pointer-events", "auto");
  journalField.input(() => {
    journalEntry = journalField.elt.value;
  });

  /* ------------------------------------------------------- a photo, optional
     One picture a day, kept with the entry and shown beside that day's flower
     in the history. It is offered here rather than afterwards because this is
     the screen where the day is being written down.

     Signed in ONLY, and the control says so rather than appearing and then
     failing: a photo has to live somewhere that follows you, and this browser
     is not that. Nothing about planting depends on it, so a failed upload
     costs the entry nothing.

     The FILE is held, not the upload: it goes up when the flower is planted,
     so a photo picked and then abandoned never reaches the database. */
  const photoRow = createDiv().parent(card3);
  photoRow.style("display", "flex");
  photoRow.style("align-items", "center");
  photoRow.style("gap", "10px");
  photoRow.style("margin", "10px 0 4px");
  photoRow.style("pointer-events", "auto");

  photoInput = createElement("input").parent(photoRow);
  photoInput.attribute("type", "file");
  photoInput.attribute("accept", "image/*");
  photoInput.style("display", "none");

  /* A GALLERY ICON, not a camera, and the words stay beside it. The input is
     `accept="image/*"` with no `capture`, so a phone offers the camera and
     the camera roll both; a camera icon would promise only the first. The
     label stays because an unlabelled dashed box in the middle of a form is
     a guess, and this is the one control on the step nobody is looking for.

     `createButton` writes its argument as innerHTML, which is what lets the
     icon be inline SVG rather than a file. */
  const PHOTO_ICON =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" ' +
    'style="flex:0 0 auto">' +
    '<rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="2"/>' +
    '<circle cx="8.6" cy="10" r="1.7" fill="currentColor"/>' +
    '<path d="M4 16.4l4.3-4a1.6 1.6 0 0 1 2.2 0l3.1 2.9 2-1.8a1.6 1.6 0 0 1 2.2 0L20 15.6" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  const photoBtn = createButton(PHOTO_ICON + "<span>Add a photo</span>").parent(photoRow);
  photoBtn.style("background", "none");
  photoBtn.style("border", "2px dashed #bde0d6");
  photoBtn.style("border-radius", "12px");
  photoBtn.style("padding", "9px 14px");
  photoBtn.style("font-size", "14px");
  photoBtn.style("font-weight", "700");
  photoBtn.style("color", "#2c7a7b");
  photoBtn.style("cursor", "pointer");
  photoBtn.style("pointer-events", "auto");
  /* Flex, or the icon sits on the text's baseline and rides high. */
  photoBtn.style("display", "inline-flex");
  photoBtn.style("align-items", "center");
  photoBtn.style("gap", "7px");
  photoBtn.style("line-height", "1");

  photoThumb = createElement("img").parent(photoRow);
  photoThumb.style("display", "none");
  photoThumb.style("width", "46px");
  photoThumb.style("height", "46px");
  photoThumb.style("object-fit", "cover");
  photoThumb.style("border-radius", "10px");

  const photoNote = createSpan("").parent(photoRow);
  photoNote.style("font-size", "12.5px");
  photoNote.style("color", "#8aa9a7");

  function refreshPhotoRow() {
    const signedIn = !!(window.GardenAccount && GardenAccount.isLive() && GardenAccount.user());
    photoBtn.elt.disabled = !signedIn;
    photoBtn.style("opacity", signedIn ? "1" : "0.45");
    photoBtn.style("cursor", signedIn ? "pointer" : "not-allowed");
    if (!signedIn) photoNote.html("Sign in to keep a photo with the day");
    else if (!photoFile) photoNote.html("Optional, one a day");
  }
  refreshPhotoRow();
  if (window.GardenAccount) GardenAccount.onChange(refreshPhotoRow);

  photoBtn.mousePressed(() => { if (!photoBtn.elt.disabled) photoInput.elt.click(); });
  photoInput.elt.addEventListener("change", () => {
    const file = photoInput.elt.files && photoInput.elt.files[0];
    if (!file) return;
    /* Six megabytes is well past what a phone photo needs to be here and well
       under what a free storage plan minds. */
    if (file.size > 6 * 1024 * 1024) {
      photoNote.html("That one is too big. Under 6MB please.");
      photoInput.elt.value = "";
      return;
    }
    photoFile = file;
    photoThumb.elt.src = URL.createObjectURL(file);
    photoThumb.style("display", "block");
    photoNote.html("Kept with today's entry");
  });

  continueBtn3 = createButton("See Your Flower").parent(card3);
  continueBtn3.style("background", "#4db6ac");
  continueBtn3.style("color", "white");
  continueBtn3.style("border", "none");
  continueBtn3.style("border-radius", "12px");
  continueBtn3.style("padding", "14px");
  continueBtn3.style("font-size", "15px");
  continueBtn3.style("font-weight", "700");
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
  card4.style("width", "min(460px, 92vw)");
  card4.style("box-sizing", "border-box");
  card4.style("padding", "24px 28px 20px 28px");
  createElement("h2", "Your Flower").style("text-align", "center").style("color", "#0f5132").style("font-size", "26px").style("font-weight", "600").style("margin", "0 0 4px 0").parent(card4);
  
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
  plantBtn.style("font-weight", "700");
  plantBtn.style("width", "100%");
  plantBtn.style("cursor", "pointer");
  plantBtn.style("margin-bottom", "8px");
  plantBtn.style("pointer-events", "auto");
  plantBtn.mousePressed(() => {
  addFlower(dayRating, dayShaper, journalEntry, chosenSpecies, chosenHue);
  flowerPreviewWrap.style("display", "none");
  showStep("garden");
  dayRating = "";
  dayShaper = "";
  journalEntry = "";
  if (journalField) journalField.value("");
});

  gardenWrap = createDiv().id("garden-wrap").parent(root);
  gardenWrap.style("pointer-events", "none");

  // const clearBtn = createButton("Clear Garden").id("clear-garden-btn").parent(gardenWrap);
  // clearBtn.style("display", "none");
  // clearBtn.style("pointer-events", "auto");
  // clearBtn.style("position", "absolute");
  // clearBtn.style("top", "28px");
  // clearBtn.style("right", "16px");
  // clearBtn.style("background", "#e57373");
  // clearBtn.style("color", "white");
  // clearBtn.style("border", "none");
  // clearBtn.style("border-radius", "999px");
  // clearBtn.style("padding", "10px 18px");
  // clearBtn.style("font-size", "13px");
  // clearBtn.style("font-weight", "600");
  // clearBtn.style("cursor", "pointer");
  // clearBtn.style("z-index", "30");
  // clearBtn.style("opacity", "0.85");
  // clearBtn.mousePressed(() => {
  //   if (confirm("Clear all flowers and start fresh?")) {
  //     flowers = [];
  //     flowerCounter = 0;
  //     localStorage.removeItem(STORAGE_KEY);
  //     localStorage.removeItem(LAST_PLANT_KEY);
  //     hoveredFlower = null;
  //     resetPromptSelections();
  //     showStep("prompt1");
  //   }
  // });

    saveBtn = createButton("").id("save-btn").parent(gardenWrap);
  /* A camera, in slot 3 of the top right row of round icons: music at
     right 16, the account at 62, the journal at 108, this at 154. It was
     a labelled "Save PNG" pill, which made it the one control up there
     that was not an icon. */
  saveBtn.html('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 8.5h3.2l1.4-2h7.8l1.4 2H21v10.5H3z"/><circle cx="12" cy="13.5" r="3.4"/></svg>');
  /* No `title`: it would open the operating system's own tooltip on top of
     the project's hover label. `aria-label` is what a screen reader reads. */
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
    isSaving = true;
    setTimeout(() => {
      saveCanvas("my_gratitude_garden", "png");
      isSaving = false;
    }, 80);
  });

  tipsCard = createDiv().id("tips-card").parent(gardenWrap);
  tipsCard.style("pointer-events", "none");
  createElement("h3", "Garden Tips").parent(tipsCard);
  /* Five fragments, about five words each, and the brevity is the point: this
     card sits in the corner of a garden somebody is looking at, so it has to
     be read at a glance rather than studied. They were full sentences and ran
     to twelve words, which is a paragraph in that corner.

     What they SAY was rewritten too. Nothing here said a flower can be
     hovered for its meaning, or that every day already planted is still there
     to look back at. */
  const ul = createElement("ul").parent(tipsCard);
  /* The tip has to name what the flower actually does now. Hovering gives a
     glance; the day itself is a tap away, and nothing else on the page says
     so, which is exactly what this card is for. */
  createElement("li", "Tap a flower to read that day").parent(ul);
  createElement("li", "Sparkles mark your newest bloom").parent(ul);
  const savedWhere = (window.GardenStore && window.GardenStore.signedIn)
    ? "Saved to your account, any device"
    : "Saved in this browser";
  createElement("li", savedWhere).parent(ul);
  createElement("li", "Click the name to rename it").parent(ul);
  createElement("li", "Top right: music, friends, history, camera").parent(ul);
  tipsCard.style("display", "none");

  const nameWrap = createDiv().id("name-wrap").parent(gardenWrap);
  nameWrap.style("display", "none");
  nameWrap.style("pointer-events", "auto");
  nameWrap.style("position", "absolute");
  nameWrap.style("top", "18px");
  nameWrap.style("left", "50%");
  nameWrap.style("transform", "translateX(-50%)");
  nameWrap.style("z-index", "30");
  nameWrap.style("align-items", "baseline");
  nameWrap.style("gap", "0px");
  nameWrap.style("white-space", "nowrap");

  const nameField = createElement("input").parent(nameWrap);
  /* An id so the phone stylesheet's 16px floor on text fields can leave this
     one alone. It is an input only by accident of being editable; it is the
     page's title, and `fitTitle` is the one thing that may size it. */
  nameField.id("gg-name");
  nameField.attribute("type", "text");
  nameField.attribute("placeholder", "Your name");
  nameField.attribute("maxlength", "30");
  nameField.style("border", "none");
  nameField.style("border-bottom", "2px solid transparent");
  nameField.style("border-radius", "0");
  /* No right padding. With 4px there the input's box held the name away from
     the "'s" that follows it and the title read as "Keni 's Gratitude Garden". */
  nameField.style("padding", "2px 0 2px 4px");
  nameField.style("font-family", NAME_FONT);
  nameField.style("font-size", NAME_PX + "px");
  nameField.style("font-weight", "600");
  nameField.style("font-variation-settings", "'SOFT' 50, 'WONK' 0");
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
    /* the same font the field is in, or the measured width is wrong and the
       name either clips or leaves a gap before the "'s" */
    tmp.style.cssText = "font-family:" + NAME_FONT + ";font-size:" + titlePx +
      "px;font-weight:600;visibility:hidden;position:absolute;white-space:pre;";
    tmp.textContent = nameField.elt.value || nameField.elt.placeholder;
    document.body.appendChild(tmp);
    const w = Math.max(40, tmp.offsetWidth + 6);
    nameField.elt.style.width = w + "px";
    document.body.removeChild(tmp);
  };

  /* Measure, then shrink. Guessing a size from a breakpoint gets a short name
     wrong at one width and a long one wrong at another; the only thing that
     answers it is the rendered width of this name at this size. */
  fitTitle = () => {
    /* A hidden tab or a detached frame reports a width of 0, and shrinking to
       the floor on the strength of that leaves the title tiny when the page
       comes back. Below 200 there is nothing worth fitting to, so keep the
       size we already have. */
    if (windowWidth < 200) return;
    const room = windowWidth - 32;
    titlePx = NAME_PX;
    for (let i = 0; i < 14; i++) {
      nameField.elt.style.fontSize = titlePx + "px";
      nameSuffixEl.style.fontSize = titlePx + "px";
      resizeNameField();
      if (nameWrap.elt.offsetWidth <= room || titlePx <= NAME_PX_MIN) break;
      titlePx -= 1;
    }
    /* the note keeps the 0.58 ratio it was given, and the two stay 5px apart */
    const notePx = Math.max(10, Math.round(titlePx * 0.46));
    dailyNote.style("font-size", notePx + "px");
    dailyNote.style("top", (18 + Math.round(titlePx * 1.38) + 5) + "px");
  };
  nameField.elt.addEventListener("input", () => fitTitle());

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

  dailyNote = createDiv("").id("daily-note").parent(gardenWrap);
  dailyNote.style("display", "none");
  dailyNote.style("position", "absolute");
  dailyNote.style("top", "58px");
  dailyNote.style("left", "50%");
  dailyNote.style("transform", "translateX(-50%)");
  dailyNote.style("text-align", "center");
  dailyNote.style("z-index", "30");
  dailyNote.style("pointer-events", "none");
  dailyNote.style("font-family", "Arial, Helvetica, sans-serif");
  dailyNote.style("font-size", NOTE_PX + "px");
  dailyNote.style("color", "#2c7a7b");
  /* No text shadow. A white shadow under dark green text on a pale sky is a
     halo rather than a lift: it fattens every letter by a pixel and reads as
     print that has not quite registered. The sky behind this is already pale
     enough that the text has its contrast without help. */

  const nameSuffix = createSpan("'s Gratitude Garden").parent(nameWrap);
  nameSuffixEl = nameSuffix.elt;
  nameSuffix.style("font-family", NAME_FONT);
  nameSuffix.style("font-size", NAME_PX + "px");
  nameSuffix.style("font-weight", "600");
  nameSuffix.style("font-variation-settings", "'SOFT' 50, 'WONK' 0");
  nameSuffix.style("color", "#0f5132");
  nameSuffix.style("pointer-events", "none");

  if (gardenName) nameField.value(gardenName);
  fitTitle();

  const saveName = () => {
    gardenName = nameField.value().trim();
    if (window.GardenStore) window.GardenStore.saveName(gardenName);
  };

  nameField.elt.addEventListener("blur", saveName);
  nameField.elt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { saveName(); nameField.elt.blur(); }
  });

  buildLogo();

  // RESET ALL SCREENS FIRST
prompt1Wrap.style("display", "none");
/* Through showStep, not by hand. This used to set `step` and toggle the wraps
   itself, which meant the daily note was never rendered on load: a returning
   visitor was dropped into the garden with no prompts and nothing saying why.
   showStep is the one driver, so it also gets the Save button, the tips card
   and the name field right. */
showStep(hasPlantedToday() ? "garden" : "prompt1");
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
      nameDiv.html(`${speciesLabel} : ${data.meaning}`);
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
    saveBtn.style("display", s === "garden" && hasFlower ? "flex" : "none");
  }
  if (tipsCard) {
    tipsCard.style("display", s === "garden" && hasFlower ? "block" : "none");
  }

  const clearBtn = select("#clear-garden-btn");
  if (clearBtn) {
    clearBtn.style("display", s === "garden" ? "block" : "none");
  }

  const nameWrap = select("#name-wrap");
  if (nameWrap) {
    nameWrap.style("display", s === "garden" ? "flex" : "none");
  }

  if (dailyNote) {
    const planted = s === "garden" && hasPlantedToday();
    dailyNote.html(planted ? "Today's flower is planted. Come back tomorrow for another." : "");
    dailyNote.style("display", planted ? "block" : "none");
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
  fitTitle();
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

  /* The daily gate, not the flower count. This asked "does this garden hold
     any flowers" and sent everyone who had ever planted straight to the
     garden, forever: it runs after buildUI, so it overrode the gate buildUI
     had just applied and the prompts never came back the next day. The
     question is whether today's flower is planted, which is the same question
     buildUI asks, so both now ask it the same way. */
  showStep(hasPlantedToday() ? "garden" : "prompt1");

  mountJournal();
  tintCursor();
}

function draw() {
  background(240);
  drawSky();
  drawSunGradient();
  drawClouds();
  /* The birds go in with the clouds, so the hills paint over them at the
     horizon exactly as they paint over a distant cloud. `drawingContext` is
     p5's own 2D context, already scaled by the pixel density, so garden-life
     draws in p5 units without knowing it is inside a sketch. */
  if (window.GardenLife) GardenLife.sky(drawingContext, width, height, { horizon: height * 0.56 });

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
  /* The butterflies and the motes go on LAST, over the flowers and over the
     labels, because they are in the air in front of the garden. They stay
     under drawNewestSparkles so the burst that fires when a flower is planted
     is still the brightest thing on screen. */
  if (window.GardenLife) GardenLife.meadow(drawingContext, width, height, { horizon: height * 0.56 });

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

/* -------------------------------------------------------------------------
   The journal

   Nothing new is stored for this garden. Every flower already carries the
   date it was planted, the mood, the shaper and the journal entry, and that
   array already syncs to the account, so the log is a VIEW of data the garden
   has always had rather than a second copy of it.

   The icon under each day is drawn by the preview family this sketch already
   owns, through a p5.Graphics whose canvas is then blitted into the small DOM
   canvas the strip holds. That matters: an eighth copy of the flower maths
   would drift from the seven that already exist.
   ------------------------------------------------------------------------- */
var journalBuf = null;

function paintJournalBloom(el, species, hue) {
  if (!el || !el.width) return;
  /* SQUARE, because the strip's slot is square and squashing a tall buffer
     into it would stretch every bloom sideways. Unlike the shared garden's,
     drawPreviewFlower centres itself, so nothing is translated here. */
  if (!journalBuf) {
    journalBuf = createGraphics(150, 150);
    journalBuf.pixelDensity(2);
  }
  journalBuf.clear();
  drawPreviewFlower(journalBuf, species, hue);
  var c = el.getContext("2d");
  c.clearRect(0, 0, el.width, el.height);
  c.drawImage(journalBuf.canvas, 0, 0, el.width, el.height);
}

function mountJournal() {
  if (!window.GardenJournal) return;
  GardenJournal.mount({
    garden: "personal",
    entries: function () {
      var out = {};
      flowers.forEach(function (f) {
        var day = GardenJournal.fromUS(f.date);
        if (!day) return;
        out[day] = {
          day: day, species: f.species, hue: f.hue, sat: f.sat, light: f.light,
          note: f.journal || "", mood: f.dayRating || "", shaper: f.dayShaper || "",
          photo: f.photo || ""
        };
      });
      return out;
    },
    meaning: function (sp) {
      return (flowerMeanings[sp] && flowerMeanings[sp].meaning) || "";
    },
    paint: paintJournalBloom
  });
}


/* The cursor's bloom takes the hue of the flower planted most recently, so
   the thing following the pointer is the last thing that grew here rather
   than a fixed decoration. Called on load and again after planting. */
function tintCursor() {
  if (!window.GardenCursor || !flowers.length) return;
  var newest = flowers[flowers.length - 1];
  for (var i = 0; i < flowers.length; i++) {
    if (flowers[i].isLatest) { newest = flowers[i]; break; }
  }
  if (newest && typeof newest.hue === "number") GardenCursor.tint(newest.hue);
}
