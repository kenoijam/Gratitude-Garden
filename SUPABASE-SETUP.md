# Turning on accounts

*One config for the whole project. Today only the personal garden reads it;
the shared garden and the bouquet will read the same file when the account
system is built.*

## Read this first

**You do not have to do any of this.** The personal garden already works. Right
now it saves your flowers into the browser you opened it in, using something
called `localStorage`. Nothing here is broken and nothing is waiting to be
switched on.

What you get by doing the steps below is one thing: **the same garden on your
phone and on your laptop.** Browser storage cannot do that, because a browser
only knows about itself. To follow a person between devices, the flowers have to
be kept somewhere on the internet, and something has to know which flowers are
yours. That is all Supabase is here: a place to keep the flowers, and a login.

It is free for this. There is no card to enter.

Set aside about ten minutes.

---

## Step 1: Make a Supabase account and a project

1. Go to **supabase.com** and press **Start your project**. Sign up however you
   like (GitHub is fastest if you have one).
2. Press **New project**.
3. It asks for three things:
   - **Name**: anything. `gratitude-garden` is fine.
   - **Database password**: it generates one. **Copy it somewhere safe now.**
     You will almost certainly never need it, but there is no way to see it
     again later. This is not the password you will use to sign in to your
     garden.
   - **Region**: pick the one closest to you.
4. Press **Create new project** and wait. It takes a minute or two while it
   builds your database.

---

## Step 2: Make the table that holds gardens

A database keeps things in **tables**, which are like spreadsheets. We need one
table, called `gardens`, with one row per person.

1. In the left sidebar of your project, click **SQL Editor**.
2. Press **New query**.
3. Paste in everything in the box below, then press **Run**.

```sql
create table public.gardens (
  user_id      uuid primary key references auth.users on delete cascade,
  garden_name  text        not null default '',
  flowers      jsonb       not null default '[]'::jsonb,
  last_planted text        not null default '',
  updated_at   timestamptz not null default now()
);

alter table public.gardens enable row level security;

-- Each of these says the same thing: you may only touch your own row.
create policy "read own garden"   on public.gardens
  for select using (auth.uid() = user_id);
create policy "create own garden" on public.gardens
  for insert with check (auth.uid() = user_id);
create policy "update own garden" on public.gardens
  for update using (auth.uid() = user_id);
```

You should see **Success. No rows returned**. That is what success looks like
for a command that creates something rather than fetching something.

**What you just made,** line by line, in case you are asked:

- `user_id` is which account the row belongs to. `references auth.users` ties it
  to Supabase's own list of accounts, and `on delete cascade` means deleting an
  account deletes its garden too.
- `garden_name`, `flowers` and `last_planted` are what the garden actually
  stores. `flowers` is `jsonb`, which lets a whole list of flower objects live in
  one cell.
- `last_planted` is why the once-a-day limit follows you between devices instead
  of resetting on each one.
- **`row level security` and the three policies are the important part.** They
  are a rule enforced by the database itself: a request may only read or write
  the row whose `user_id` matches the account making the request. Without them,
  anyone could read everyone's gardens.

---

## Step 3: Copy your two keys into the project

1. In the sidebar, click the gear icon (**Project Settings**), then **API**.
2. You need two values from that page:
   - **Project URL**, which looks like `https://abcdefgh.supabase.co`
   - the key that is **safe to publish**. Supabase renamed these, so your
     dashboard shows one of two things:
     - **Publishable key**, starting `sb_publishable_`, the current name, or
     - **anon public**, one long string starting `eyJ`, the older name for
       exactly the same thing

   Either works. Take whichever you are shown, and copy the **whole** string.
   The key beside it, called **Secret key** or **`service_role`**, is the
   opposite of safe and the page will refuse it.
3. Open **`config.js`** at the top level of the project and replace the two
   placeholders:

   There used to be a second config at `personal-garden/supabase-config.js`,
   and it was loaded *after* this one, so it reassigned both values back to
   the placeholders. Real keys went in and accounts still did not switch on.
   That file is gone. **`config.js` at the root is the only one.**

```js
window.SUPABASE_URL = "https://abcdefgh.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

**Is it safe to have that key in a file anyone can read?** Yes, and this is worth
understanding rather than taking on trust. The anon key only says "a request is
coming from this project". It does not say who you are. What decides what you may
read or write is the row level security from step 2, which the database checks on
every single request against the account you are actually signed in as.

On the same settings page there is a **Secret key**, previously called
**`service_role`**. That one ignores row level security completely. **Never put it in this file, never put it in anything
that runs in a browser, and never send it to anyone**, including me.

---

## Step 4: Let the password reset email come back to your page

Resets work by emailing a link back to your garden. Supabase will only send
someone back to an address you have listed, otherwise the link is a way to send
people anywhere.

1. Sidebar, **Authentication**, then **URL Configuration**.
2. **Site URL**: set this to where the site actually lives.

```
https://kenoijam.github.io/Gratitude-Garden/
```

3. Under **Redirect URLs**, press **Add URL** for each address you open the
   garden at. Add all of these, because you will use both:

```
http://localhost:8000/**
https://kenoijam.github.io/Gratitude-Garden/**
```

   The `/**` on the end is a wildcard, which saves adding every page one at a
   time. If your dashboard will not take a wildcard, add the two full pages
   instead:

```
http://localhost:8000/personal-garden/personal-garden-index.html
https://kenoijam.github.io/Gratitude-Garden/personal-garden/personal-garden-index.html
```

Skip this and everything else still works; only "Forgot your password?" breaks,
and it breaks at the last step, after the email has already been sent.

---

## Step 5: Decide about confirmation emails

By default Supabase emails a confirmation link before a new account can sign in.
For a piece of coursework you are demonstrating, that is usually a nuisance.

- To skip it: **Authentication** in the left sidebar, then **Providers**
  (newer dashboards call this **Sign In / Providers**), then click the
  **Email** row to open it, and turn off **Confirm email**. If you cannot
  find it, this link opens that page on whichever project you have selected:
  `https://supabase.com/dashboard/project/_/auth/providers`
- To keep it: leave it on, and expect to click a link in your inbox after
  creating an account. The garden already handles this and tells you to go and
  check your email.

---

## Check that it worked

Serve the site and open the personal garden.

- **You see a sign in screen.** Good, that means the keys were read.
  Still going straight into the garden means the placeholders are still in
  `config.js`, or the file has a typo.
- Press **New here? Create an account**, use any email and a password of at least
  six characters.
- You land in the garden, with your email and a **Sign out** button in the bottom
  left.
- Plant a flower. Then in Supabase, sidebar, **Table Editor**, **gardens**. There
  should be one row, and `flowers` should have something in it.
- Press **Sign out**, sign back in, and your flower should still be there. That
  is the whole thing working.

---

## If something goes wrong

- **"Could not reach the garden."** The Project URL is wrong, or you are offline.
- **The sign in screen never appears.** Open the browser console (right
  click, Inspect, Console). If accounts are off, the page says so there and
  names the reason: placeholders still in place, the example values from this
  guide pasted instead of your own, a URL that is not a Supabase address, a
  key that was copied only partly, or a secret key it refused to use.
- **You sign in and it says it cannot reach your garden, check the table exists.**
  Step 2 did not run. Go back to the SQL Editor and run it again.
- **You created an account and nothing happened.** Confirmation emails are on.
  Check your inbox, or turn them off in step 5.
- **The reset email link refuses to come back.** Step 4.

---

## Things worth knowing about how it behaves

- **Nobody is forced to make an account.** The sign in screen has **Use this
  browser only, no account** at the bottom, which is the browser storage mode the
  garden has always had.
- **A garden already in your browser is offered, never taken.** The first time you
  sign in on a device that already has flowers in it, and the account is new, the
  garden asks whether to move them across or start fresh. Choosing start fresh
  leaves the browser's copy alone.
- **The once-a-day limit lives on the account row**, so it follows you between
  devices rather than resetting on each one.
- **One row per account** holds the flowers, the garden name and the date last
  planted. Writes are grouped so planting is one database update, not three.

---

## Where this is published

The project is a public GitHub repository, **kenoijam/Gratitude-Garden**, served
by GitHub Pages at:

```
https://kenoijam.github.io/Gratitude-Garden/
```

Pages serves whatever is on the `main` branch, from the repository root, so
pushing to `main` is publishing. There is normally a minute or two between the
push and the site changing.

**The anon key in `config.js` is published along with everything else, and that
is fine.** It is designed to be public and it says nothing about who you are.
What protects one person's garden from another's is the row level security in
step 2, which the database checks on every request against the account you are
actually signed in as. The `service_role` key is the opposite of that and must
never be in this repository, in any file a browser loads, or in a message to
anyone.
