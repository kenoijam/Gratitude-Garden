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

/* `born` is a timestamp: negative means finished and in the ground already,
   and a time in the FUTURE means planted but not yet arrived, which is what
   lets a scene put a flower down before somebody has walked to it. */
export function growFlower(f, now) {
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
}
