/* =========================================================================
   xr-light.js  -  the garden lit by the room it is standing in

   WebXR LIGHTING ESTIMATION, which is a real API and a narrow one. In an
   immersive-ar session the device watches the room through its camera and
   hands back, every frame:

     - nine spherical harmonic coefficients per channel, which is the whole
       ambient light of the room as a low frequency function of direction
     - a primary light direction and intensity, which is the brightest thing
       in the room, usually a window or a lamp

   So a flower standing on somebody's table picks up the colour of their
   curtains and casts its shadow the way the room casts shadows.

   WHAT IT CANNOT DO, said plainly because it decides where this belongs:
   it only runs inside an ACTIVE AR SESSION, on hardware that supports it,
   which today means an ARCore Android phone or a passthrough headset. On a
   laptop `isSessionSupported` answers false and none of this runs. It is
   therefore an ADDITION to the scene's own lighting and can never be the
   only lighting the project has: `world.js` still lights the garden for
   everybody else, and this restores it on the way out.

   THE SCENE IS SHRUNK AND PUSHED AWAY on entry. The island is about fifteen
   units across, and in AR one unit is one METRE, so entering without scaling
   would drop a fifteen metre garden through the floor and around the user.
   It becomes a tabletop object a little over a metre wide, a metre and a
   half in front.
   ========================================================================= */
import * as THREE from "./lib/three.module.min.js";

export async function arSupported() {
  if (!navigator.xr || !navigator.xr.isSessionSupported) return false;
  try { return await navigator.xr.isSessionSupported("immersive-ar"); }
  catch (e) { return false; }
}

export function createARLighting(renderer, scene, lights, onState) {
  const probeLight = new THREE.LightProbe();
  probeLight.intensity = 1;
  let session = null, xrProbe = null, saved = null, warned = false;

  async function start() {
    if (session) return;
    session = await navigator.xr.requestSession("immersive-ar", {
      optionalFeatures: ["light-estimation", "local-floor"]
    });
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");
    await renderer.xr.setSession(session);

    /* everything the scene's own look does is put back on the way out */
    saved = {
      sun: lights.sun.intensity, hemi: lights.hemi.intensity, rim: lights.rim.intensity,
      sunPos: lights.sun.position.clone(), sunColour: lights.sun.color.clone(),
      background: scene.background, fog: scene.fog, environment: scene.environment,
      scale: scene.scale.clone(), position: scene.position.clone()
    };
    /* AR composites over the camera feed, so a painted sky and a fog that
       fades to one would both draw over the room */
    scene.background = null;
    scene.fog = null;
    /* and the generated environment is replaced by the real one */
    scene.environment = null;
    lights.hemi.intensity = 0;
    lights.rim.intensity = 0;
    scene.add(probeLight);
    scene.scale.setScalar(0.08);
    scene.position.set(0, -0.35, -1.5);

    try {
      xrProbe = await session.requestLightProbe();
    } catch (e) {
      xrProbe = null;
      if (!warned) { warned = true; console.warn("light estimation unavailable:", e.message); }
    }
    session.addEventListener("end", cleanup, { once: true });
    if (onState) onState(true, !!xrProbe);
  }

  function cleanup() {
    if (saved) {
      lights.sun.intensity = saved.sun;
      lights.hemi.intensity = saved.hemi;
      lights.rim.intensity = saved.rim;
      lights.sun.position.copy(saved.sunPos);
      lights.sun.color.copy(saved.sunColour);
      scene.background = saved.background;
      scene.fog = saved.fog;
      scene.environment = saved.environment;
      scene.scale.copy(saved.scale);
      scene.position.copy(saved.position);
      saved = null;
    }
    scene.remove(probeLight);
    session = null; xrProbe = null;
    renderer.xr.enabled = false;
    if (onState) onState(false, false);
  }

  async function stop() { if (session) await session.end(); }

  /* called once per frame from the render loop, with the XRFrame three hands
     through `setAnimationLoop`. Does nothing at all outside a session. */
  function update(frame) {
    if (!frame || !xrProbe) return;
    const est = frame.getLightEstimate(xrProbe);
    if (!est) return;
    /* the ambient half: nine coefficients per channel, straight into a
       three LightProbe, which is the same representation */
    probeLight.sh.fromArray(est.sphericalHarmonicsCoefficients);
    /* and the direct half: the brightest source in the room. The colour is
       normalised against the peak channel and the magnitude handed to the
       intensity, or a bright room would blow every colour out to white. */
    const i = est.primaryLightIntensity;
    const peak = Math.max(1, i.x, i.y, i.z);
    const d = est.primaryLightDirection;
    lights.sun.position.set(d.x, d.y, d.z);
    lights.sun.color.setRGB(i.x / peak, i.y / peak, i.z / peak);
    lights.sun.intensity = peak;
  }

  return { start, stop, update, inSession: () => !!session, hasEstimate: () => !!xrProbe };
}
