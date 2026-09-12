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
