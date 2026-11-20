# Resale Inventory

A small, fast app for tracking thrifted clothing from sourcing to sale on Depop, Instagram and at flea markets.
Use it on your phone (install it to your home screen) or on a computer. It's the same app on both.

Built with Next.js, Supabase (database, photos, login) and Vercel (hosting), all on free plans.

---

## What you need

- **Node.js 24 or newer**: check with `node --version`. Get it from [nodejs.org](https://nodejs.org).
- A free **Supabase** account: [supabase.com](https://supabase.com)
- A free **Vercel** account (only when you're ready to put it online): [vercel.com](https://vercel.com)
- A **GitHub** account, if you want Vercel to deploy automatically

---

## 1. Run it on your computer

```bash
npm install
cp .env.example .env.local   # on Windows PowerShell: copy .env.example .env.local
npm run dev
```

**Try it on your phone:** with your phone on the same Wi-Fi, open the "Network" address
that `npm run dev` prints (like `http://192.168.0.122:3000`).

Open http://localhost:3000. Until Supabase is connected, you'll see the login page with a note
saying it isn't connected yet. That's expected. Do step 2 next.

---

## 2. Set up Supabase (about 10 minutes, once)

1. **Create a project.** In Supabase, click **New project**. Pick a name, a strong database
   password (save it in your password manager) and the region closest to you.
2. **Create the tables.** Open **SQL Editor > New query**. Paste the whole contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and click **Run**.
   You should see "Success". Then do the same with
   [`supabase/migrations/0002_business_plan.sql`](supabase/migrations/0002_business_plan.sql), then
   [`supabase/migrations/0003_instagram.sql`](supabase/migrations/0003_instagram.sql).
   Together they create the items, categories, expenses and settings tables, the private photo
   bucket, and the security rules. Run each file once, in order.
   **Already set up before?** Just run the files you haven't run yet.
3. **Turn off sign-ups.** Go to **Authentication > Sign In / Providers** and turn off
   **Allow new users to sign up**. Only you can log in.
4. **Create your login.** Go to **Authentication > Users > Add user > Create new user**. Enter your
   email and a password, and tick **Auto Confirm User**.
   Or, once step 5 is done, run `npm run create-admin` and type them in the terminal.
   To change the password later, run `npm run create-admin -- --reset`.
5. **Copy your keys** into `.env.local`:
   - **Project URL**: **Project Settings > Data API**. Paste it into `NEXT_PUBLIC_SUPABASE_URL`.
   - **Publishable key** (`sb_publishable_...`): **Project Settings > API Keys**. Paste it into
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - **Secret key** (`sb_secret_...`): same page. Paste it into `SUPABASE_SECRET_KEY`. Keep this one
     private. It can read and change everything.
6. **Check the Depop fee.** The database starts with a guess for Depop fees (3.3% + $0.45) and
   0% for Instagram and flea markets. Check what Depop actually charges you, then edit it in **Table Editor >
   settings > fee_presets**. The same row holds your lowest price ($10), haggle room ($3), monthly
   budgets ($130 stock, $70 upkeep), your usual stores and your bins. A settings screen comes later.
7. **Restart the app** (stop `npm run dev` with Ctrl+C and start it again), then log in.

To check it's connected, open http://localhost:3000/api/health. It should say `{"ok":true,"db":"up"}`.

### Optional: add sample items

```bash
npm run seed
```

This adds about 20 realistic sample items so you can try things out. It won't add anything if you
already have items, unless you run `npm run seed -- --force`. You can archive or delete the samples later.

---

## 3. Put it online with Vercel

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New > Project** and import the repository. The defaults are fine.
3. Under **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | same as in `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same as in `.env.local` |
   | `CRON_SECRET` | any long random string (e.g. from a password generator) |

   You don't need `SUPABASE_SECRET_KEY` on Vercel. The app itself never uses it.
4. Click **Deploy**.
5. In Supabase, go to **Authentication > URL Configuration** and set **Site URL** to your Vercel address.

**Keeping Supabase awake:** free Supabase projects pause after a week with no activity.
[`vercel.json`](vercel.json) sets up a daily job that visits `/api/health` to prevent that.
Vercel sends `CRON_SECRET` with it automatically. You don't need to do anything else.

**Install on your phone:** open your Vercel address in Safari (iPhone: Share > **Add to Home Screen**)
or Chrome (Android: menu > **Install app**).

If you change environment variables on Vercel, redeploy for them to take effect.

---

## Environment variables

| Name | Where it's used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | App and seed script | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App (browser and server) | No. Security rules block everything until you log in |
| `SUPABASE_SECRET_KEY` | `npm run seed` only | **Yes**. Never give it a `NEXT_PUBLIC_` prefix |
| `CRON_SECRET` | `/api/health` on Vercel | Yes |

Older Supabase projects show "anon" and "service_role" keys instead. Those work in the same two slots.

---

## For developers

```bash
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run lint     # ESLint
npm run build    # production build
npm run seed     # sample data (needs .env.local)
```

- `CLAUDE.md` holds the product rules and build plan. `DESIGN.md` holds the design tokens and components.
- `lib/`: business logic and helpers (money, env, Supabase clients). Components stay thin.
- `app/(app)/`: logged-in pages with the bottom nav. `app/login/`: login. `app/api/health/`: health check.
- `proxy.ts`: refreshes the login session and sends logged-out visitors to `/login`.
- `supabase/migrations/`: database schema. New changes go in a new numbered file.
- Money is always stored as integer cents and formatted only for display (`lib/money.ts`).
- Next.js 16 with Cache Components is on. Reading cookies or request data inside a page must
  sit behind `<Suspense>`. See `node_modules/next/dist/docs/`.
- On Windows, run tests from PowerShell or the VS Code terminal. Vitest fails to start from Git Bash.
