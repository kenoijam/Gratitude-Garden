/* =========================================================================
   Gratitude Garden, background music.

   ONE file, loaded by all four pages, because this project already pays for
   the same drawing code living in seven places and a second copy of an audio
   engine would rot the same way. The page says which mood it wants on the
   script tag itself:

       <script src="garden-music.js" data-mood="calm"></script>

   Nothing is downloaded and there are no audio files in the repo. The music
   is SYNTHESISED as it plays, with the Web Audio API, which is why it never
   audibly loops: a clip repeats every thirty seconds and you start waiting
   for the join, while a generated piece only ever repeats its chords.

   Four moods, one engine. What separates them is the key, the chords, how
   fast the notes fall, the waveform and how much room is around them. See
   MOODS below.
   ========================================================================= */

(function () {
  "use strict";

  /* Which mood this page asked for. `document.currentScript` is the script
     tag being executed right now, which is how a shared file can be told
     apart per page without the page having to set a global first. */
  var tag = document.currentScript;
  var MOOD_NAME = (tag && tag.getAttribute("data-mood")) || "whimsy";

  /* Shared across all four pages, since they are one origin. Turning the
     music off in the bouquet keeps it off in the garden and on the next
     visit, which is the whole point of remembering it. */
  var KEY_ON = "gg_music_on";
  var KEY_VOL = "gg_music_vol";

  /* Even at the top of the slider this is background music, so the ceiling
     is deliberately low. A visitor should never have to reach for the system
     volume because a garden shouted at them.

     Each mood then carries its own `trim` against this, because four patches
     built from different waveforms do NOT come out at the same loudness on
     their own: untrimmed at the master output they ran calm 0.0426, whimsy
     0.0270, bright 0.0193 and romantic 0.0187 RMS, a spread of about 7dB,
     which is plainly audible as a jump when you walk from one page to the
     next. The trims pull all four onto roughly 0.028.

     RE-MEASURED, and the numbers moved, so they are not a set-and-forget.
     The first pass matched the four over a long window only, and a page is
     judged on the first few seconds of it. Measured two ways, over 32
     seconds of a seeded offline render and again over just the eight
     seconds after the fade-in: at the old trims the spread was 1.85dB
     across the whole piece and 2.25dB across the opening, with the shared
     garden loudest and the bouquet quietest. Trimming against the MEAN of
     the two windows rather than the long one alone brings it to 0.60dB and
     0.71dB, which is under what anyone hears as a step.

     Equalising the opening matters more than equalising the whole, because
     the four differ in how fast they fill up: the shared garden's notes
     come every half second and the bouquet's every 1.3, so the bouquet is
     still arriving while the shared garden is already at full density.

     Re-measure and reset them if a mood's waveform, gain or note density
     changes. The harness renders each mood through an OfflineAudioContext
     with `Math.random` seeded identically, pulling this table and every
     voice function out of this file as text so it cannot drift. */
  var MAX_GAIN = 0.34;
  var FADE_IN = 2.6;    /* seconds, long enough to read as arriving rather than starting */
  var FADE_OUT = 1.1;

  /* The scheduler looks this far ahead and wakes this often. Timer callbacks
     are not accurate enough to play notes from directly, so they only ever
     QUEUE notes against the audio clock, which is sample accurate. */
  var LOOKAHEAD = 0.3;  /* seconds of music queued in advance */
  var TICK = 60;        /* ms between wake-ups */

  /* ------------------------------------------------------------------ *
     The four moods.

     `chords` are semitone offsets from `root`, four voices each, and every
     progression is I - vi - IV - V in some dress, because that shape resolves
     forever without ever asking for a cadence. `scale` is what the melody may
     land on, and all four are pentatonic or close to it: a pentatonic note
     cannot clash with the chord under it, which is what lets the melody be
     chosen at random and still sound written.
   * ------------------------------------------------------------------ */
  var MOODS = {

    /* Landing page. Lydian, because the raised fourth is the sound of
       whimsy: it never quite settles, so the page feels like somewhere you
       have just arrived rather than somewhere that is waiting for you.
       F Lydian, mid register, bells over an airy pad. */
    whimsy: {
      root: 53,                                   /* F3 */
      scale: [0, 2, 4, 6, 7, 9, 11],              /* F G A B C D E */
      chords: [
        [0, 4, 7, 11],                            /* Fmaj7  */
        [2, 6, 9, 11],                            /* G6     */
        [-3, 0, 4, 7],                            /* Dm7    */
        [-5, -1, 2, 7]                            /* C      */
      ],
      chordSecs: 6.5, noteSecs: 0.9, noteChance: 0.55,
      melody: "wander", melodyOct: 24, melodyRange: 12,
      padWave: "triangle", padCut: 1500, padGain: 0.30, padDetune: 7,
      bellWave: "sine", bellGain: 0.22, bellDecay: 2.4, bellShimmer: 0.30,
      bass: false, reverbSecs: 3.4, reverbMix: 0.34, trim: 0.98
    },

    /* Personal garden. The slowest of the four and the lowest, because this
       is the page you sit with: it is one flower a day and a page of writing,
       and anything with momentum would be hurrying you through it. D major
       pentatonic, sine throughout, and the largest room of the four. */
    calm: {
      root: 50,                                   /* D3 */
      scale: [0, 2, 4, 7, 9],                     /* D major pentatonic */
      chords: [
        [0, 4, 7, 14],                            /* Dmaj9  */
        [-3, 0, 4, 7],                            /* Bm7    */
        [-7, -3, 0, 4],                           /* Gmaj7  */
        [-5, -1, 2, 9]                            /* A6     */
      ],
      chordSecs: 11, noteSecs: 2.0, noteChance: 0.45,
      melody: "wander", melodyOct: 24, melodyRange: 9,
      padWave: "sine", padCut: 1100, padGain: 0.36, padDetune: 5,
      bellWave: "sine", bellGain: 0.20, bellDecay: 3.4, bellShimmer: 0.22,
      bass: true, reverbSecs: 4.6, reverbMix: 0.42, trim: 0.64
    },

    /* Shared garden. Excited, but the excitement is DENSITY and direction,
       not volume or drums: the notes come four times as often as the calm
       garden's and climb rather than wander, which reads as anticipation.
       That suits a room full of other people's flowers appearing. G major,
       triangle, a brighter filter and a smaller room so it stays crisp. */
    bright: {
      root: 55,                                   /* G3 */
      scale: [0, 2, 4, 7, 9],                     /* G major pentatonic */
      chords: [
        [0, 4, 7, 11],                            /* Gmaj7  */
        [-3, 0, 4, 7],                            /* Em7    */
        [-7, -3, 0, 4],                           /* Cmaj7  */
        [-5, -1, 2, 4]                            /* D6     */
      ],
      chordSecs: 5.0, noteSecs: 0.5, noteChance: 0.62,
      melody: "arp", melodyOct: 24, melodyRange: 14,
      padWave: "triangle", padCut: 2000, padGain: 0.26, padDetune: 9,
      bellWave: "triangle", bellGain: 0.17, bellDecay: 1.5, bellShimmer: 0.34,
      bass: false, reverbSecs: 2.6, reverbMix: 0.28, trim: 1.27
    },

    /* Bouquet builder. Romantic is the warm end of the spectrum, so this is
       the only mood on a sawtooth pad: a saw under a low filter is a much
       thicker sound than a sine, and thickness is what "vibey" means here.
       Eb, major sevenths and a ninth, a slow vibrato on the pad and a bass
       under it. Flat keys sound warmer for no reason anyone can defend, and
       it is true anyway. */
    romantic: {
      root: 51,                                   /* Eb3 */
      scale: [0, 2, 4, 7, 9, 11],                 /* Eb pentatonic plus the major 7th */
      chords: [
        [0, 4, 7, 11],                            /* Ebmaj7  */
        [-3, 0, 4, 11],                           /* Cm9     */
        [-7, -3, 0, 4],                           /* Abmaj7  */
        [-5, 0, 2, 5]                             /* Bb7sus  */
      ],
      chordSecs: 8.5, noteSecs: 1.3, noteChance: 0.5,
      melody: "wander", melodyOct: 24, melodyRange: 10,
      padWave: "sawtooth", padCut: 520, padGain: 0.20, padDetune: 8,
      bellWave: "sine", bellGain: 0.20, bellDecay: 3.0, bellShimmer: 0.20,
      bass: true, vibrato: true, reverbSecs: 5.0, reverbMix: 0.40, trim: 1.66
    }
  };

  var M = MOODS[MOOD_NAME] || MOODS.whimsy;

  /* ------------------------------------------------------------------ *
     State
   * ------------------------------------------------------------------ */
  var ctx = null, master = null, dry = null, wet = null, verb = null;
  var running = false;      /* the scheduler is queueing notes */
  var wantOn = read(KEY_ON, "1") !== "0";
  var volume = clamp(parseFloat(read(KEY_VOL, "0.5")) || 0.5, 0, 1);
  var timer = null, stopTimer = null;
  var nextChordAt = 0, nextNoteAt = 0, chordStep = 0, arpStep = 0;
  var lastMelodyIdx = 3;

  function read(k, d) {
    try { var v = localStorage.getItem(k); return v === null ? d : v; }
    catch (e) { return d; }
  }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function clamp(n, a, b) { return n < a ? a : n > b ? b : n; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ------------------------------------------------------------------ *
     Graph

     Everything runs through one master gain, so a fade is a single ramp and
     there is exactly one place the volume lives. The reverb is a convolver
     fed by a generated noise tail rather than a recorded room, since a real
     impulse response would be the audio file this whole approach avoids.
   * ------------------------------------------------------------------ */
  function makeReverbBuffer(seconds, decay) {
    var rate = ctx.sampleRate;
    var len = Math.max(1, Math.floor(rate * seconds));
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        /* Noise under an exponential fall. The power is what separates a
           plate from a hall: higher decays faster and sounds smaller. */
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    dry = ctx.createGain();
    dry.gain.value = 1;
    dry.connect(master);

    verb = ctx.createConvolver();
    verb.buffer = makeReverbBuffer(M.reverbSecs, 2.6);
    wet = ctx.createGain();
    wet.gain.value = M.reverbMix;
    verb.connect(wet);
    wet.connect(master);
    return true;
  }

  /* Every voice sends to both, so `reverbMix` is a real wet/dry balance
     rather than a send that quietly doubles the level. */
  function sendTo(node) { node.connect(dry); node.connect(verb); }

  /* ------------------------------------------------------------------ *
     Voices
   * ------------------------------------------------------------------ */

  /* The pad is the chord: two oscillators per note, detuned against each
     other, under one lowpass. The detune is the entire reason it sounds like
     an instrument and not a test tone, and the filter is what keeps a
     sawtooth from being harsh. */
  function padChord(notes, when, dur) {
    var g = ctx.createGain();
    g.gain.value = 0;

    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = M.padCut * 0.7;
    /* A slow sweep across the chord's life. Static filters read as a held
       synth note; a moving one reads as breathing. */
    f.frequency.linearRampToValueAtTime(M.padCut, when + dur * 0.55);
    f.frequency.linearRampToValueAtTime(M.padCut * 0.72, when + dur);
    f.Q.value = 0.6;

    g.connect(f);
    sendTo(f);

    var oscs = [];
    for (var i = 0; i < notes.length; i++) {
      var hz = midiHz(M.root + notes[i]);
      for (var d = -1; d <= 1; d += 2) {
        var o = ctx.createOscillator();
        o.type = M.padWave;
        o.frequency.value = hz;
        o.detune.value = d * M.padDetune;
        o.connect(g);
        o.start(when);
        o.stop(when + dur + 0.6);
        oscs.push(o);
      }
    }

    /* Slow vibrato, romantic only. It is 4 cents, which is under the
       threshold you would call vibrato and over the one you would call
       nothing: the chord simply stops sitting still. */
    if (M.vibrato) {
      var lfo = ctx.createOscillator();
      var lfoG = ctx.createGain();
      lfo.frequency.value = 0.22;
      lfoG.gain.value = 4;
      lfo.connect(lfoG);
      for (var k = 0; k < oscs.length; k++) lfoG.connect(oscs[k].detune);
      lfo.start(when);
      lfo.stop(when + dur + 0.6);
    }

    var peak = M.padGain / Math.max(1, notes.length * 0.55);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when + dur * 0.35);      /* long swell in */
    g.gain.setValueAtTime(peak, when + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.5); /* and out under the next chord */

    oscs[oscs.length - 1].onended = function () {
      try { g.disconnect(); f.disconnect(); } catch (e) {}
    };
  }

  /* A bell. Fast attack, long exponential fall, and a quiet octave above it,
     which is the cheapest convincing way to get a struck sound out of a sine.
     Each one is panned somewhere different so the melody has width. */
  function bell(midi, when, vel) {
    var g = ctx.createGain();
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = rand(-0.55, 0.55); g.connect(pan); sendTo(pan); }
    else sendTo(g);

    var hz = midiHz(midi);
    var o = ctx.createOscillator();
    o.type = M.bellWave;
    o.frequency.value = hz;
    o.connect(g);

    var o2 = ctx.createOscillator();
    var g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.value = hz * 2;
    g2.gain.value = M.bellShimmer;
    o2.connect(g2);
    g2.connect(g);

    var peak = M.bellGain * vel;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + M.bellDecay);

    o.start(when);  o.stop(when + M.bellDecay + 0.1);
    o2.start(when); o2.stop(when + M.bellDecay + 0.1);
    o.onended = function () {
      try { g.disconnect(); g2.disconnect(); if (pan) pan.disconnect(); } catch (e) {}
    };
  }

  /* Root of the chord, two octaves down, sine, very quiet. It is felt more
     than heard, which is what a bass is for at this volume. */
  function bassNote(midi, when, dur) {
    var g = ctx.createGain();
    sendTo(g);
    var o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = midiHz(midi - 12);
    o.connect(g);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.16, when + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.start(when);
    o.stop(when + dur + 0.2);
    o.onended = function () { try { g.disconnect(); } catch (e) {} };
  }

  /* ------------------------------------------------------------------ *
     Scheduler

     Chords and melody run on two independent clocks rather than a shared
     grid, so the melody drifts across the chord changes instead of landing
     on them, which is what stops it sounding like a sequence.
   * ------------------------------------------------------------------ */
  function scaleNote(idx) {
    var n = M.scale.length;
    var oct = Math.floor(idx / n);
    return M.root + M.melodyOct + M.scale[((idx % n) + n) % n] + oct * 12;
  }

  function pickMelody() {
    var span = Math.round(M.melodyRange / 2);
    if (M.melody === "arp") {
      /* Climbing. It resets down an octave once it runs out of room, which
         gives the shared garden its lift without ever running off the top. */
      arpStep++;
      if (arpStep > span) arpStep = -1;
      lastMelodyIdx = arpStep + (Math.random() < 0.2 ? 1 : 0);
    } else {
      /* A random walk, kept inside a range so it cannot wander off into a
         register the pad no longer supports. */
      lastMelodyIdx += Math.round(rand(-2.4, 2.4));
      if (lastMelodyIdx > span) lastMelodyIdx = span - 2;
      if (lastMelodyIdx < -span) lastMelodyIdx = -span + 2;
    }
    return scaleNote(lastMelodyIdx);
  }

  function schedule() {
    if (!running) return;
    var horizon = ctx.currentTime + LOOKAHEAD;

    while (nextChordAt < horizon) {
      var ch = M.chords[chordStep % M.chords.length];
      padChord(ch, nextChordAt, M.chordSecs);
      if (M.bass) bassNote(M.root + ch[0], nextChordAt, M.chordSecs);
      chordStep++;
      nextChordAt += M.chordSecs;
    }

    while (nextNoteAt < horizon) {
      if (Math.random() < M.noteChance) {
        /* Nudged off the grid and given a different weight each time. Notes
           landing exactly on time at exactly one volume is the thing that
           makes generated music sound generated. */
        bell(pickMelody(), nextNoteAt + rand(-0.03, 0.03), rand(0.55, 1));
      }
      nextNoteAt += M.noteSecs;
    }

    timer = setTimeout(schedule, TICK);
  }

  /* ------------------------------------------------------------------ *
     Transport
   * ------------------------------------------------------------------ */
  function start() {
    if (!ctx && !build()) return;
    clearTimeout(stopTimer);
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    if (!running) {
      running = true;
      /* Both clocks are re-based on every fresh start rather than carried
         over. They have to be: a suspended context freezes `currentTime`,
         so a resumed one that kept its old targets would find them long
         past and fire every missed chord at once. */
      nextChordAt = ctx.currentTime + 0.15;
      nextNoteAt = ctx.currentTime + 1.2;   /* pad first, so the melody arrives into something */
      schedule();
    }
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(volume * MAX_GAIN * M.trim, now + FADE_IN);
  }

  function stop() {
    if (!ctx || !running) return;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + FADE_OUT);
    /* The scheduler is left running THROUGH the fade, or the chord that is
       sounding would be cut off rather than fading with everything else. It
       is only torn down once the fade has finished, and the context is
       suspended with it so a silent page costs nothing. */
    clearTimeout(stopTimer);
    stopTimer = setTimeout(function () {
      running = false;
      clearTimeout(timer);
      if (ctx && ctx.suspend) ctx.suspend();
    }, (FADE_OUT + 0.3) * 1000);
  }

  function applyVolume() {
    if (!ctx || !running) return;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(volume * MAX_GAIN * M.trim, now + 0.12);
  }

  /* ------------------------------------------------------------------ *
     The control

     Built here rather than in each page's markup, for the same reason the
     engine is one file. It is styled as a sibling of the Home pill every
     page already carries: same cream, same border, same shadow.
   * ------------------------------------------------------------------ */
  var btn, wrapEl, slider;

  var CSS =
    '#gg-music{position:fixed;top:20px;right:16px;z-index:260;' +
      'font-family:Arial,Helvetica,sans-serif;}' +
    '#gg-music-btn{width:38px;height:38px;border-radius:50%;' +
      'background:rgba(255,249,227,0.92);border:1.5px solid #b7e4e7;color:#1d6466;' +
      'box-shadow:0 2px 10px rgba(29,100,102,0.14);cursor:pointer;padding:0;' +
      'display:flex;align-items:center;justify-content:center;' +
      'transition:background 0.2s,transform 0.15s,border-color 0.2s;}' +
    '#gg-music-btn:hover{background:#e1f7f7;transform:translateY(-1px);}' +
    '#gg-music-btn:focus-visible{outline:2px solid #1d6466;outline-offset:2px;}' +
    '#gg-music-btn svg{width:18px;height:18px;display:block;}' +
    '#gg-music-btn .off-mark{display:none;}' +
    '#gg-music[data-on="0"] .wave{display:none;}' +
    '#gg-music[data-on="0"] .off-mark{display:block;}' +
    /* The volume drops BELOW the button rather than sliding out beside it.
       On both garden pages Save PNG sits immediately to the left, so a panel
       that opened sideways would open straight onto it.

       `top:100%` and a transparent `padding-top` are load bearing, and this
       is the whole reason the panel is a wrapper with a pill inside it rather
       than one box. At `top:44px` on a 38px button there was a 6px gap that
       belonged to NEITHER element: `#gg-music` is only as tall as the button,
       so the moment the pointer entered that gap the hover was lost and the
       panel closed under the hand reaching for it. The gap is now padding
       INSIDE the panel, so the hit area runs unbroken from the button down
       into the slider while the gap still reads as a gap. */
    '#gg-music-vol{position:absolute;top:100%;right:0;padding-top:8px;' +
      'opacity:0;visibility:hidden;transform:translateY(-4px);' +
      /* Opening is instant, closing waits. Without the delay a pointer that
         clips a corner on the way down dismisses the thing it was aiming at.
         `visibility` rather than `pointer-events` because it is reliably
         transitionable, and it also keeps the slider out of the tab order
         while the panel is shut. */
      'transition:opacity 0.18s ease 0.35s,transform 0.18s ease 0.35s,' +
        'visibility 0s linear 0.53s;}' +
    '#gg-music:hover #gg-music-vol,#gg-music:focus-within #gg-music-vol{' +
      'opacity:1;visibility:visible;transform:none;' +
      'transition:opacity 0.18s ease 0s,transform 0.18s ease 0s,visibility 0s linear 0s;}' +
    '#gg-music-vol .pill{background:rgba(255,249,227,0.96);border:1.5px solid #b7e4e7;' +
      'border-radius:50px;box-shadow:0 2px 10px rgba(29,100,102,0.14);padding:7px 12px;}' +
    /* The input is 16px tall against a 4px track, so the grab area is the
       whole height of the pill's inside rather than the hairline you can see.
       A 4px input is accurate to about a pixel, which is not a thing anyone
       should have to be. */
    '#gg-music-vol input{width:88px;height:16px;display:block;cursor:pointer;' +
      '-webkit-appearance:none;appearance:none;background:transparent;margin:0;}' +
    '#gg-music-vol input::-webkit-slider-runnable-track{height:4px;border-radius:3px;' +
      'background:#cfe9ea;}' +
    '#gg-music-vol input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;' +
      'width:14px;height:14px;border-radius:50%;background:#1d6466;cursor:pointer;' +
      'border:none;margin-top:-5px;}' +
    '#gg-music-vol input::-moz-range-track{height:4px;border-radius:3px;background:#cfe9ea;}' +
    '#gg-music-vol input::-moz-range-thumb{width:14px;height:14px;border-radius:50%;' +
      'background:#1d6466;cursor:pointer;border:none;}' +
    '#gg-music-vol input:focus-visible{outline:2px solid #1d6466;outline-offset:3px;}' +
    /* While it plays the outer arc breathes, which is the only way to tell
       at a glance that the button is doing something. */
    '#gg-music[data-on="1"] .wave-out{animation:gg-breathe 2.8s ease-in-out infinite;}' +
    '@keyframes gg-breathe{0%,100%{opacity:1}50%{opacity:0.25}}' +
    '@media (prefers-reduced-motion:reduce){' +
      '#gg-music[data-on="1"] .wave-out{animation:none;}' +
      '#gg-music-btn,#gg-music-vol{transition:none;}}' +
    '@media (max-width:768px){#gg-music{top:16px;right:12px;}' +
      '#gg-music-btn{width:34px;height:34px;}#gg-music-btn svg{width:16px;height:16px;}}' +

    /* The hint. It hangs under the button on the same corner the volume panel
       uses, which is deliberate: it is pointing AT the button, so it has to
       come from the button. They cannot both be open, and the hint is the one
       that gives way, since reaching for the control means it has done its
       job. */
    '#gg-music-hint{position:absolute;top:100%;right:0;margin-top:9px;width:196px;' +
      'background:rgba(255,249,227,0.97);border:1.5px solid #b7e4e7;border-radius:14px;' +
      'box-shadow:0 4px 16px rgba(29,100,102,0.16);padding:10px 12px;' +
      'color:#1d6466;font-size:12.5px;line-height:1.45;text-align:left;' +
      'cursor:pointer;opacity:0;transform:translateY(-6px);pointer-events:none;' +
      'transition:opacity 0.32s ease,transform 0.32s ease;}' +
    '#gg-music-hint[data-show="1"]{opacity:1;transform:none;pointer-events:auto;}' +
    '#gg-music-hint b{font-weight:700;}' +
    /* A notch rather than a line to the button. Two squares rotated 45
       degrees, the back one carrying the border and the front one the fill,
       because a single bordered square shows its own lower edges through the
       panel it is supposed to be part of. */
    '#gg-music-hint::before,#gg-music-hint::after{content:"";position:absolute;' +
      'top:-6px;right:13px;width:10px;height:10px;transform:rotate(45deg);}' +
    '#gg-music-hint::before{background:#b7e4e7;}' +
    '#gg-music-hint::after{top:-4px;background:rgba(255,249,227,0.97);}' +
    '@media (prefers-reduced-motion:reduce){#gg-music-hint{transition:none;}}';

  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke-linejoin="round"/>' +
    '<path class="wave" d="M15.8 9.4a3.6 3.6 0 0 1 0 5.2"/>' +
    '<path class="wave wave-out" d="M18.4 6.9a7.2 7.2 0 0 1 0 10.2"/>' +
    '<path class="off-mark" d="M16.5 9.8l5 4.4M21.5 9.8l-5 4.4"/>' +
    '</svg>';

  function buildUI() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    wrapEl = document.createElement("div");
    wrapEl.id = "gg-music";
    wrapEl.setAttribute("data-on", wantOn ? "1" : "0");

    btn = document.createElement("button");
    btn.id = "gg-music-btn";
    btn.type = "button";
    btn.innerHTML = ICON;
    btn.addEventListener("click", toggle);

    var vol = document.createElement("div");
    vol.id = "gg-music-vol";
    var pill = document.createElement("div");
    pill.className = "pill";
    slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(Math.round(volume * 100));
    slider.setAttribute("aria-label", "Music volume");
    slider.addEventListener("input", function () {
      volume = clamp(parseInt(slider.value, 10) / 100, 0, 1);
      write(KEY_VOL, String(volume));
      applyVolume();
    });
    pill.appendChild(slider);
    vol.appendChild(pill);

    hintEl = document.createElement("div");
    hintEl.id = "gg-music-hint";
    hintEl.setAttribute("role", "status");
    hintEl.innerHTML = "<b>Music is playing.</b><br>Use this button to mute it.";
    hintEl.addEventListener("click", hideHint);

    wrapEl.appendChild(btn);
    wrapEl.appendChild(vol);
    wrapEl.appendChild(hintEl);
    /* Reaching for the control is the hint being read, so it stands aside
       rather than opening the volume panel behind itself. */
    wrapEl.addEventListener("pointerenter", hideHint);
    document.body.appendChild(wrapEl);
    label();
  }

  /* ------------------------------------------------------------------ *
     The hint

     It says the music is playing, so it may only appear once the music is
     actually PLAYING. Audio does not start until the visitor's first gesture,
     and that gesture may be one the browser refuses to unlock sound on, so
     announcing it on load would be a claim the page could not keep. It is
     shown from the one place that knows the context is genuinely running.

     Once a visit, not once ever and not once a page: `sessionStorage` so
     walking between the four pages does not say it four times, and a later
     visit is a new visitor as far as this is concerned. Anyone who has
     already muted is never told, since they plainly know how.
   * ------------------------------------------------------------------ */
  var hintEl, hintTimer, HINT_KEY = "gg_music_hint", HINT_MS = 7000;

  function hintSeen() {
    try { return sessionStorage.getItem(HINT_KEY) === "1"; } catch (e) { return true; }
  }
  function markHintSeen() {
    try { sessionStorage.setItem(HINT_KEY, "1"); } catch (e) {}
  }
  function hideHint() {
    if (!hintEl) return;
    clearTimeout(hintTimer);
    hintEl.setAttribute("data-show", "0");
  }
  function showHint() {
    if (!hintEl || !wantOn || hintSeen()) return;
    markHintSeen();
    hintEl.setAttribute("data-show", "1");
    hintTimer = setTimeout(hideHint, HINT_MS);
  }

  function label() {
    var what = wantOn ? "Turn music off" : "Turn music on";
    btn.setAttribute("aria-pressed", wantOn ? "true" : "false");
    btn.setAttribute("aria-label", what);
    /* NO hover label on this one, and no `title` either.

       Every other icon in the row carries a `data-tip` that opens centred
       underneath it. This button cannot: its volume panel drops into exactly
       that space, so the label and the panel arrived on top of each other, and
       pushed to the left it ran across the three icons beside it. It is also
       the one button in the row that explains itself, since hovering it slides
       out a volume slider. The `title` went with it; hovering used to produce
       the project's own label and then the operating system's on top of that.
       `aria-label` above is what a screen reader reads, and it is enough. */
    wrapEl.setAttribute("data-on", wantOn ? "1" : "0");
  }

  function toggle() {
    wantOn = !wantOn;
    write(KEY_ON, wantOn ? "1" : "0");
    label();
    hideHint();          /* they have found the button, so stop pointing at it */
    markHintSeen();
    if (wantOn) start(); else stop();
  }

  /* ------------------------------------------------------------------ *
     Getting started

     Browsers refuse to make sound until the visitor has interacted with the
     page, so there is nothing to be done on load except wait for the first
     gesture of any kind and fade in then.
   * ------------------------------------------------------------------ */
  var GESTURES = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"];
  function unarm() {
    GESTURES.forEach(function (e) {
      window.removeEventListener(e, firstGesture, true);
    });
  }
  function firstGesture() {
    /* Off by choice: nothing to arm, and the button starts it if that
       changes. */
    if (!wantOn) { unarm(); return; }
    start();
    /* The listeners are NOT removed just because one fired. A scroll or a
       wheel does not count as a user activation in Chrome, so `resume()`
       can be refused, and unarming there would spend the only chance on a
       gesture that was never allowed to unlock anything. They come off once
       the context is genuinely running and not before. */
    if (!ctx) return;
    if (ctx.state === "running") { unarm(); showHint(); }
    else if (ctx.resume) {
      var p = ctx.resume();
      if (p && p.then) p.then(function () {
        if (ctx.state === "running") { unarm(); showHint(); }
      }, function () {});
    }
  }

  /* A garden nobody is looking at should not be playing. The fade makes a
     quick tab switch sound like a door closing rather than a cut. */
  function visibility() {
    if (!ctx) return;
    if (document.hidden) {
      if (running) stop();
    } else if (wantOn) {
      start();
    }
  }

  function boot() {
    if (!(window.AudioContext || window.webkitAudioContext)) return;
    buildUI();
    GESTURES.forEach(function (e) {
      window.addEventListener(e, firstGesture, true);
    });
    document.addEventListener("visibilitychange", visibility);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
