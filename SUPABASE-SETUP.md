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

## Step 6: Turn on usernames, likes, comments and friends

This one is optional. Skip it and everything else still works; the shared
garden simply has no like button, no comments and no friends list on it.

Go back to the **SQL Editor**, click **New query**, paste all of this in and
press **Run**. It is safe to run more than once: every line either creates
something that is missing or leaves what is already there alone.

```sql
-- ---------------------------------------------------------------------
-- The shared garden's flowers, and the likes and comments on them.
--
-- A flower is planted with nothing but a typed name, exactly as before, and
-- planting still writes NOTHING here. A row appears the first time somebody
-- signed in opens that flower to react to it. That is what keeps the garden
-- open to anyone while still making a like or a comment belong to a person.
-- ---------------------------------------------------------------------

-- posts already exists and holds id, user_id, caption and created_at.
-- These columns describe which bloom a post is anchored to.
alter table public.posts alter column user_id drop not null;

alter table public.posts
  add column if not exists kind          text not null default 'shared_flower',
  add column if not exists day           text not null default '',
  add column if not exists created_index integer,
  add column if not exists planter       text not null default '',
  add column if not exists species       text not null default 'daisy',
  add column if not exists hue           integer not null default 0,
  add column if not exists sat           integer not null default 60,
  add column if not exists light         integer not null default 65,
  add column if not exists anchored_by   uuid references auth.users on delete set null;

-- One post per bloom per day. Two people opening the same flower at the same
-- moment would otherwise each create one, and the comments would split in two.
create unique index if not exists posts_shared_flower_key
  on public.posts (day, created_index) where kind = 'shared_flower';

create index if not exists comments_post_idx on public.comments (post_id);
create index if not exists likes_post_idx    on public.likes (post_id);

-- Nobody may like the same flower twice. Doing this in the database rather
-- than in the page is the point: the page can be edited by anyone reading it.
create unique index if not exists likes_one_per_person
  on public.likes (post_id, user_id);

alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.likes    enable row level security;
alter table public.profiles enable row level security;

-- A shared flower is public, so anyone may read it and read what was said
-- about it, signed in or not.
drop policy if exists "read shared flowers" on public.posts;
create policy "read shared flowers" on public.posts
  for select using (kind = 'shared_flower');

-- Only somebody signed in may create the row, and only in their own name.
drop policy if exists "anchor a shared flower" on public.posts;
create policy "anchor a shared flower" on public.posts
  for insert with check (
    auth.uid() is not null
    and kind = 'shared_flower'
    and anchored_by = auth.uid()
  );

drop policy if exists "read comments"      on public.comments;
drop policy if exists "write own comment"  on public.comments;
drop policy if exists "delete own comment" on public.comments;
create policy "read comments"      on public.comments for select using (true);
create policy "write own comment"  on public.comments for insert with check (auth.uid() = user_id);
create policy "delete own comment" on public.comments for delete using (auth.uid() = user_id);

drop policy if exists "read likes"    on public.likes;
drop policy if exists "like as me"    on public.likes;
drop policy if exists "unlike my own" on public.likes;
create policy "read likes"    on public.likes for select using (true);
create policy "like as me"    on public.likes for insert with check (auth.uid() = user_id);
create policy "unlike my own" on public.likes for delete using (auth.uid() = user_id);

-- A comment has to show a name, so profiles stay readable. The only columns
-- on there are a username, a display name and a favourite flower.
drop policy if exists "create own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "create own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Usernames and friends.
--
-- A username is how somebody is found, so it has to be unique no matter how
-- it is capitalised: Keni and keni are the same person as far as searching
-- is concerned, and allowing both is how people get impersonated.
-- ---------------------------------------------------------------------
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- friendships already exists and holds id, requester_id, addressee_id,
-- status and created_at.
alter table public.friendships enable row level security;

-- One row per PAIR, whichever way round it was asked. Without this, two
-- people who request each other at the same time end up as friends twice and
-- every list shows them double.
create unique index if not exists friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

drop policy if exists "see my friendships" on public.friendships;
drop policy if exists "ask to be friends"  on public.friendships;
drop policy if exists "answer a request"   on public.friendships;
drop policy if exists "end a friendship"   on public.friendships;

-- You can only ever see a row you are part of. Nobody can read who else is
-- friends with whom.
create policy "see my friendships" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- You may only ask in your own name, and not of yourself.
create policy "ask to be friends" on public.friendships
  for insert with check (auth.uid() = requester_id and requester_id <> addressee_id);

-- Only the person who was ASKED may accept. The asker cannot accept on their
-- own behalf, which is the whole point of a request.
create policy "answer a request" on public.friendships
  for update using (auth.uid() = addressee_id);

-- Either side may end it, and declining is the same operation as removing.
create policy "end a friendship" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);
```

You should see **Success. No rows returned**. That is what success looks like
for a query that only changes the shape of things.

### What this does and does not protect

- **A like cannot be cast twice**, and a comment cannot be posted under
  somebody else's name. Both are enforced by the database, not by the page,
  which matters because anyone can edit the page in their own browser.
- **Anyone signed in can create the anchor row for a flower.** That is the one
  loose thread. It costs an account and it only ever creates a row that points
  at a bloom that already exists in the garden, so the worst case is clutter
  rather than anything reaching another person.
- **Every profile is readable by anyone**, which is what puts a name under a
  comment and what makes username search work at all. If you would rather it
  were not, that is a policy change on `profiles`, and it will take the names
  off the comments and break friend search with it.
- **A friendship row is visible only to the two people in it.** Nobody can
  read who else is friends with whom, and only the person who was asked can
  accept, which is what makes it a request rather than an announcement.

## Step 7: Turn on the history log and sending a bouquet

Also optional, and also safe to run more than once. **SQL Editor, New query,
paste, Run.**

```sql
-- ---------------------------------------------------------------------
-- One row per person per day per garden. This is what draws the icon
-- under each day in the journal strip.
-- ---------------------------------------------------------------------
alter table public.garden_entries
  add column if not exists day     text    not null default '',
  add column if not exists garden  text    not null default 'personal',
  add column if not exists species text    not null default 'daisy',
  add column if not exists hue     integer not null default 0,
  add column if not exists sat     integer not null default 60,
  add column if not exists light   integer not null default 65,
  add column if not exists word    text    not null default '',
  add column if not exists note    text    not null default '';

-- One a day, per garden. The page checks too, but only this is enforced.
create unique index if not exists garden_entries_one_a_day
  on public.garden_entries (user_id, garden, day);

alter table public.garden_entries enable row level security;
drop policy if exists "read own entries"   on public.garden_entries;
drop policy if exists "write own entries"  on public.garden_entries;
drop policy if exists "update own entries" on public.garden_entries;
create policy "read own entries"   on public.garden_entries for select using (auth.uid() = user_id);
create policy "write own entries"  on public.garden_entries for insert with check (auth.uid() = user_id);
create policy "update own entries" on public.garden_entries for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- The shared meadow, one snapshot row per day.
--
-- p5.party's demo server does not keep a room once its date has passed, so
-- without this a past day in the log has nothing to show. The snapshot is
-- written by whoever is signed in and standing in the garden, from the live
-- room, which is the authority on what is planted.
-- ---------------------------------------------------------------------
create table if not exists public.shared_days (
  day        text primary key,
  flowers    jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

alter table public.shared_days enable row level security;
drop policy if exists "read any day"     on public.shared_days;
drop policy if exists "snapshot today"   on public.shared_days;
drop policy if exists "resnapshot today" on public.shared_days;

-- A past meadow is public, the same as the garden was on the day.
create policy "read any day" on public.shared_days for select using (true);

-- Only around TODAY, and only signed in. The window is three days wide
-- because the page names the day in ITS timezone and the database checks in
-- UTC, and those disagree for part of every day. What it stops is somebody
-- rewriting last month.
create policy "snapshot today" on public.shared_days
  for insert with check (
    auth.uid() is not null and updated_by = auth.uid()
    and day >= to_char(now() - interval '1 day', 'YYYY-MM-DD')
    and day <= to_char(now() + interval '1 day', 'YYYY-MM-DD'));

create policy "resnapshot today" on public.shared_days
  for update using (
    auth.uid() is not null
    and day >= to_char(now() - interval '1 day', 'YYYY-MM-DD')
    and day <= to_char(now() + interval '1 day', 'YYYY-MM-DD'));

-- ---------------------------------------------------------------------
-- Sending a bouquet to a friend. `payload` is the builder's own encoded
-- bouquet, the exact string that already travels in a share link, so a sent
-- bouquet and a linked one are the same object and render through the same
-- code.
-- ---------------------------------------------------------------------
alter table public.bouquets
  add column if not exists payload text    not null default '',
  add column if not exists opened  boolean not null default false;

alter table public.bouquets enable row level security;
drop policy if exists "see my bouquets"   on public.bouquets;
drop policy if exists "send a bouquet"    on public.bouquets;
drop policy if exists "mark mine opened"  on public.bouquets;
drop policy if exists "unsend or delete"  on public.bouquets;

-- Only the two people involved can see it.
create policy "see my bouquets" on public.bouquets
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "send a bouquet" on public.bouquets
  for insert with check (auth.uid() = sender_id and sender_id <> recipient_id);
create policy "mark mine opened" on public.bouquets
  for update using (auth.uid() = recipient_id);
create policy "unsend or delete" on public.bouquets
  for delete using (auth.uid() = sender_id or auth.uid() = recipient_id);
```

**Success. No rows returned** is what you should see.

### What this does and does not protect

- **A journal entry is yours alone.** Nobody else can read what you planted or
  what you wrote, in either garden.
- **A day's shared meadow is public**, which it was on the day. What the
  snapshot cannot do is be complete on a day when nobody signed in visited the
  garden, because there was nobody there to write it down.
- **A snapshot can only be written around today.** Somebody signed in could
  still write a wrong snapshot for today, which is the loose thread; they
  cannot touch last week.
- **A bouquet is visible only to its sender and the person it went to.**

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

## Step 8: photos on a personal garden entry

One picture a day, kept with the entry and shown beside that day's flower in
the History panel. It is for signed in people only, because a photo has to
live somewhere that follows you between devices and this browser is not that.

Run this in the SQL editor, the same place as Steps 6 and 7.

```sql
-- The column the path is written to.
alter table public.garden_entries
  add column if not exists photo text default '';

-- A PRIVATE bucket. Private matters: the page fetches a picture through a
-- signed URL that expires within the hour, so a link copied out of it stops
-- working rather than being readable by anybody for ever.
insert into storage.buckets (id, name, public)
values ('entries', 'entries', false)
on conflict (id) do nothing;

-- Every path is `<your user id>/<the day>.<ext>`, and these four policies are
-- what make that folder yours. The check is on the FIRST path segment, so a
-- path that does not begin with your own id is refused by the database rather
-- than by the page, which is the only place a refusal is worth anything.
create policy "own entry photos: read"
  on storage.objects for select to authenticated
  using (bucket_id = 'entries' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own entry photos: write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'entries' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own entry photos: replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'entries' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own entry photos: remove"
  on storage.objects for delete to authenticated
  using (bucket_id = 'entries' and auth.uid()::text = (storage.foldername(name))[1]);
```

Until this is run, the Add a photo button still appears for somebody signed
in and the upload quietly fails, which costs the entry nothing: the flower and
the words are written either way. Nothing else on any page depends on it.
