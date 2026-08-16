# Rajshahi Polytechnic Institute Red Crescent Society — Website & Management Platform

A complete, production-ready website and management platform for the Red Crescent Society
unit of Rajshahi Polytechnic Institute. Built with **Next.js (App Router)**, **TypeScript**,
**Tailwind CSS**, **shadcn/ui** and **Supabase**.

> A real institutional website, volunteer management platform, blood support platform,
> event system, activity & training portal, notice board, gallery of activities, digital
> volunteer profiles and an admin dashboard — no fake data, no fake buttons.

---

## Features

### Public website
- **Homepage** — hero, society principles, live statistics, activities, upcoming events,
  blood support, training, volunteer recognition, notices and emergency contact.
- **About** — mission, vision, what volunteers do, history, the seven fundamental
  principles and the leadership team.
- **Volunteers** — searchable/filterable directory of approved volunteers, plus public
  profiles with a scannable **QR member ID card**. Private data is never exposed.
- **Blood Support** — donor search by blood group/area, public blood request form with
  status tracking, donor registration, and a privacy-safe **“Request Contact”** flow
  (donor phone numbers are never public).
- **Events** — event listing with categories, event detail pages and online registration.
- **Gallery of Activities** — field activities presented as a photo gallery; each
  activity opens into its full report with a lightbox viewer (the former separate
  “Activities” and “Gallery” pages are merged here; `/activities` redirects to
  `/gallery`).
- **Notices** — notice board with pinned notices that publish instantly, plus attachments.
- **Training** — first aid / CPR / disaster training programs.
- **Emergency** — configurable emergency section (numbers are set by admins, never invented).
- **Certificate verification** — `/verify/certificate/<token>` public verification pages.
- **Contact** — configurable details + contact form that lands in the admin inbox.
- **Join** — full volunteer application form with validation.
- **Bilingual (EN + বাংলা)** — the whole public site is translated. The language
  switcher in the header sets a cookie; first-time visitors are redirected to their
  browser language. English stays at `/…`, Bangla lives under `/bn/…` (e.g.
  `/bn/about`). The admin dashboard remains in English.

### Admin dashboard (`/admin`)
Dashboard overview, volunteer approval workflow (auto member IDs), team management,
blood donor management, blood request workflow, events + participant export (CSV),
activities, notices, training, gallery albums, certificate issuing, event attendance,
contact messages, website settings (society info, contact, social, emergency, homepage,
points) and a full **audit log**.

### Security & privacy
- Role-based access control (`SUPER_ADMIN`, `ADMIN`, `VOLUNTEER_MANAGER`, `EVENT_MANAGER`,
  `CONTENT_MANAGER`) enforced **server-side** and in **Row Level Security**.
- Public SQL **views** (`public_volunteers`, `public_blood_donors`, `public_blood_requests`)
  that physically exclude phone numbers, emergency contacts and student IDs.
- Audit logging for every important admin action.
- No service-role keys in the browser; input validation with Zod on both client and server.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Language  | TypeScript |
| Styling   | Tailwind CSS v4 |
| UI        | shadcn/ui + curated components from **21st.dev** (Marquee, NumberTicker, BentoGrid) |
| Animation | Motion (Framer Motion) — subtle, respects `prefers-reduced-motion` |
| Backend   | Next.js Server Actions + Route Handlers |
| Database  | PostgreSQL via **Supabase** (RLS enabled) |
| Auth      | Supabase Auth (email/password) |
| Validation| Zod + react-hook-form conventions |
| Extras    | `qrcode.react` (QR member cards), `date-fns` |

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in your Supabase values

# 3. Run the migration (see "Supabase setup" below)

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project URL from Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for admin | Server-only — used for audit logging |
| `NEXT_PUBLIC_APP_URL` | Recommended | Used for sitemap, Open Graph and QR codes |

The site renders with friendly empty states before Supabase is configured.

---

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of every file in
   [`supabase/migrations/`](supabase/migrations/) (in filename order) → **Run**. This
   creates all tables, views, RLS policies, indexes and default settings. If you already
   ran `0001_initial_schema.sql`, just run the later files. (Or run `supabase db push` if
   you use the Supabase CLI.)
3. **Authentication**: enable Email auth in *Authentication → Providers*.
4. **Storage** (optional, for uploaded images): `supabase/migrations/0003_storage_images.sql`
   creates the public `images` bucket with admin upload policies — the admin image upload
   fields (founders, team, events) use it automatically. Buckets for certificates and
   attachments (`certificates`, `attachments`, `logos`) can be created manually in the
   dashboard if needed.
5. **Logos**: replace the placeholder files in [`public/logos/`](public/logos/) with the
   two official logos (see the README there).

### Creating the first admin

1. In the Supabase dashboard → **Authentication → Users**, create the admin user
   (or let them sign up via the site).
2. In **SQL Editor**, promote the account to an admin:

```sql
update public.profiles
set role = 'SUPER_ADMIN'
where id = (
  select id from auth.users where email = 'you@example.com'
);
```

You can now sign in at `/admin/login`.

---

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm start            # serve the production build
npm run lint         # eslint
```

---

## Deployment

**Vercel** (recommended):
1. Push the repository to GitHub/GitLab.
2. Import the project on [vercel.com](https://vercel.com).
3. Add the four environment variables above.
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to your production domain.

Any Node hosting works the same way: build with `npm run build`, start with `npm start`.

---

## Project structure

```
app/                  # App Router pages (public + admin under route groups)
  admin/(auth)/       # Login page (outside the protected layout)
  admin/(panel)/      # Protected dashboard pages
components/
  ui/                 # shadcn/ui + 21st.dev components
  layout/             # Header, footer, logos
  home/               # Hero, stats
  cards/              # Event / volunteer / notice / activity / album cards
  forms/              # Public forms (join, blood request, contact, …)
  admin/              # Admin dialog, tables, inline status, settings forms
lib/
  supabase/           # client / server / admin clients + middleware + config
  actions.ts          # Public server actions
  admin-actions.ts    # Admin server actions (role-checked)
  queries.ts          # Data access layer
  validation.ts       # Zod schemas
  constants.ts        # Domain constants
supabase/migrations/  # SQL schema (tables + RLS + views + defaults)
types/                # Database types
public/logos/         # Replace with the official logos
```

---

## Known limitations

- Public forms (join, blood request, contact, …) are English-only for now; the pages
  around them are fully translated.
- Image uploads: admin forms and portal avatars upload to Supabase Storage (the `images`
  bucket) with client-side cropping and compression; a few legacy fields still accept image
  URLs directly.
- Volunteer-to-account linking: volunteers are linked to auth users by email when they
  sign in; the public join form does not require an account.
- The `points` settings values are informational on the homepage — award points manually
  from the volunteer detail page (configurable rules can be wired to triggers later).
- The site is English-primary with full Bangla font support (`Noto Sans Bengali`).

## Brand & design

- Primary identity: **BDRCS Green `#006F45`** · Urgency/Blood: **Red `#ED1C24`** ·
  Subtle accent: **Polytechnic Blue `#1769AA`**.
- Logos are rendered at original proportions — never stretched or recolored.
- Typography: **Poppins** (Latin) + **Noto Sans Bengali** (Bangla).
