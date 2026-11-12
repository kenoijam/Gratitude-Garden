/* Gratitude Garden, shared Supabase settings
   ------------------------------------------------------------------
   Every page loads this file, so it is the one place the project's
   Supabase keys live. It is a PLACEHOLDER: nothing here is wired up to
   anything yet, and the pages all work without it exactly as they always
   have.

   Both values below are safe to keep in this file and to publish. The
   anon key is designed to be public, and the database's row level
   security is what actually keeps one person's data away from another's.
   Never paste the service_role key here, or anywhere that reaches a
   browser.

   Where to find them: Supabase dashboard, Project Settings, API.

   This is the ONLY config. There used to be a second one at
   `personal-garden/supabase-config.js`, loaded after this file, which
   reassigned both values back to their placeholders: real keys pasted
   here were silently thrown away and accounts never switched on. That
   file is gone. See SUPABASE-SETUP.md. */

/* Replace BOTH of the two lines below with the values from your own
   project. Do not keep the example text: the page checks, and will tell you
   in the browser console if what is here is not a real project.

   The variable is still called ANON_KEY because that is the name the auth
   code reads, but paste whichever key YOUR dashboard shows. Supabase renamed
   them partway through:
     - PUBLISHABLE key, starting `sb_publishable_`, is the current name
     - anon public, one long `eyJ...` string, is the older name for the same
       thing and still works
   Either is correct here. The one beside it, the SECRET key, previously
   called `service_role`, must never go in this file. The page refuses it. */

window.SUPABASE_URL = "https://ezcpoxgnkhxiqnmmtwse.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_PmhTvIXNQzG8-N8CsYIeVw_c1w4XAcO";


/* ------------------------------------------------------------------
   readSupabaseConfig()

   Returns {url, key} when this file holds a real project, or null with a
   named reason in the console when it does not.

   It lives HERE rather than in a page's own script because more than one
   page needs it now: the personal garden gates on it, and the shared
   garden's likes and comments do too. Two copies of a check that decides
   whether a SECRET key reaches a browser is exactly the kind of thing this
   project has been bitten by before, when a second config file quietly
   overwrote this one.

   Why it is more than a placeholder check. It used to be "does it start
   with YOUR_", which let through anything that was not literally the
   placeholder, including the shortened example values printed in the setup
   guide. Pasting those gets you a sign in screen and then "could not reach
   the garden", with nothing anywhere saying the URL is not a real project.
   That is close to undiagnosable if you are setting Supabase up for the
   first time, so this names the problem instead.

   It also REFUSES a secret key outright. Publishing one is the single worst
   mistake available here, because it ignores row level security entirely,
   and silently working would be the worst possible response.
   ------------------------------------------------------------------ */
window.readSupabaseConfig = function () {
  function looksLikeServiceRole(key) {
    var parts = key.split(".");
    if (parts.length !== 3) return false;
    try {
      var b = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b.length % 4) b += "=";
      return JSON.parse(atob(b)).role === "service_role";
    } catch (e) { return false; }
  }

  var url = String(window.SUPABASE_URL || "").trim();
  var key = String(window.SUPABASE_ANON_KEY || "").trim();
  var why = null;

  if (!url || !key) why = "config.js has not been filled in yet.";
  else if (url.indexOf("YOUR_") === 0 || key.indexOf("YOUR_") === 0)
    why = "config.js still has its placeholders in it.";
  else if (/yourprojectid/i.test(url))
    why = "The Project URL in config.js is the example from the guide, not your own project.";
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))
    why = "The Project URL in config.js does not look like a Supabase URL. It should be https://something.supabase.co";
  else if (key.indexOf("...") !== -1)
    why = "The key in config.js is the shortened example from the guide. A real key is one long unbroken string with no dots in the middle.";
  else if (key.indexOf("sb_secret_") === 0 || looksLikeServiceRole(key))
    why = "That is the SECRET key. It ignores row level security and must never be in a web page. Use the publishable key, or the anon key on an older project.";
  else if (key.indexOf("sb_publishable_") !== 0 && key.split(".").length !== 3)
    why = "The key in config.js does not look like a Supabase key. It should start with sb_publishable_ or be one long eyJ... string.";

  if (why) {
    console.warn("[Gratitude Garden] Accounts are OFF. " + why +
      " See SUPABASE-SETUP.md.");
    return null;
  }
  return { url: url.replace(/\/$/, ""), key: key };
};
