/* =========================================================================
   growth.js  -  how a flower arrives, in ONE place

   The 2D project carries this sequence twice, character for character, in
   the personal and shared sketches, with a note in CLAUDE.md saying to edit
   one and edit the other. There are two scenes here now, so the same crack
   was about to open. It is a module instead.

   The numbers are the web version's, unchanged: a flower takes the same
   time to arrive in both versions, which is continuity rather than
   coincidence.
   ========================================================================= */
export const GROW_RISE = 3400;      /* the stem coming up out of nothing */
export const GROW_OPEN = 1700;      /* the bud opening into the bloom */

/* a cubic ease out, so it leaves the ground quickly and arrives slowly,
   which is the shape a plant actually grows in */
export const growEase = t => 1 - Math.pow(1 - t, 3);
export const smooth = t => t * t * (3 - 2 * t);

/* THE BLOOM OVERSHOOTS AND SETTLES. A smoothstep arrives and simply stops,
   which is the one moment in the whole sequence that reads as an animation
   ending rather than as a flower opening.
   THE COEFFICIENT IS NOT THE OVERSHOOT. At 0.3 it came out at 1.002, which
   is two parts in a thousand and invisible; the peak is measured, not read
   off the constant. At 1.2 it is 1.053, about five percent, which is a
   bloom settling rather than a bounce. */
export const settle = t => {
  const c = 1.2, p = t - 1;
  return 1 + (c + 1) * p * p * p + c * p * p;
};

/* A FLOWER TAKES AS LONG AS ITS SIZE SAYS IT SHOULD.
   The web version gives every species 3400ms because it is drawing on a
   canvas where nothing has a size in the world. Here a daisy and a tree are
   plainly different objects, and watching a tree reach full height in the
   time a daisy takes was the single thing that most said "animation".
   SPEED is the whole scene's pace against the web version's; PACE is each
   species against the others. Multiply, do not replace, so the shape of the
   2D sequence is kept and only its length changes. */
export const SPEED = 2.6;
export const PACE = {
  daisy: 0.8, lavender: 0.85, tulip: 0.95, lily: 1.0,
  lotus: 1.0, rose: 1.05, sunflower: 1.25, sakura: 1.9
};
export const paceOf = id => SPEED * (PACE[id] || 1);
/* how long the whole thing takes, which is what a caller waiting on it
   needs rather than the constant */
export const growMs = id => GROW_RISE * paceOf(id);

/* `born` is a timestamp: negative means finished and in the ground already,
   and a time in the FUTURE means planted but not yet arrived, which is what
   lets a scene put a flower down before somebody has walked to it. */
export function growFlower(f, now) {
  const born = f.userData.born;
  const blooms = f.userData.blooms || [];
  const set = v => blooms.forEach(b => b.scale.setScalar(v));
  if (born < 0) { f.scale.set(1, 1, 1); set(1); return; }
  const k = paceOf(f.userData.species);
  const rise = GROW_RISE * k, open = GROW_OPEN * k;
  const e = now - born;
  if (e < 0) { f.scale.set(1, 0.001, 1); set(0.18); return; }
  const up = growEase(Math.min(1, e / rise));
  f.scale.set(1, Math.max(0.001, up), 1);
  const o = (e - (rise - open)) / open;
  set(0.18 + 0.82 * settle(Math.min(1, Math.max(0, o))));
}
