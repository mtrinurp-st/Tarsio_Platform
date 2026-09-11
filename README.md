# Tarsio 2 — Growth platform

An Indonesian self-development application with a Duolingo-inspired learning path, the original Tarsy mascot, 22 structured reflection quests across seven learning units, and an eighth social space.

## Run

```sh
npm ci
npm run dev
```

Without Supabase configuration, the app starts in **device mode**. Reflections, onboarding, progress, daily rewards, streaks, shop items, and CMS previews persist in this browser. Device mode is explicitly labeled and does not simulate real users, authentication, or online leagues. Device data is separate from signed-in data; it is not silently uploaded on login.

## Connect Supabase

1. Create a Supabase project or use the existing project's staging environment.
2. Copy `.env.example` to `.env.local` and supply the public project URL and anon key. Never use a service-role key in a Vite environment variable.
3. Apply the repository migrations in chronological order with the Supabase CLI (`supabase link`, then `supabase db push`) or your existing migration workflow. Test on staging before applying to an existing production project.
4. Configure Auth Site URL and allowed redirect URLs for the deployment origin. Enable email/password authentication, email confirmation, and your production SMTP service. The app includes register, login, password reset, and password recovery forms.
5. Promote a verified internal account to `profiles.role = 'admin'` using the trusted SQL editor or an operational migration. This cannot be done by a client or by signup metadata.
6. Rebuild after changing Vite configuration: `npm run build`. Static hosting does not inject runtime Vite variables into an existing bundle.

See [launch notes](docs/LAUNCH.md) for production boundaries and rollout details.

## Implemented experience

- Five-step onboarding: name, mood, starting unit, daily time goal, reason to return.
- Seven learning paths, sequential lesson unlocks, configurable free roam, resume drafts, and completion states.
- 22 lesson schemas covering energy, relationships, boundaries, money, self-worth, health, career, communication, habits, and productivity. The supplied PRD's itemized list contains 22 lessons although its summary says 27.
- Typed fields, multi-select, numerical alternatives to sliders, required-field validation, a 24-hour time grid, budget total validation, debt-aware target comparisons, investment projection, breathing timer, and communication-style feedback.
- Structured autosaved answers, resumable steps, local pending-write queue for signed-in drafts, retry and errors surfaced to users.
- +50 XP per first completion and +10 for the server-observed original session. Server transactions and an event ledger prevent replay rewards. Repeating lessons remains possible without additional completion XP.
- Daily mood/lesson/reflection missions, gems, Asia/Jakarta calendar streaks, 3/7/30-day milestone gems, up to two purchased freeze items, and a permanent cosmetic aura.
- In-app 24-hour follow-ups, weekly checks across 90 days, career follow-ups, digital-detox checklist, and six-month future-letter resurfacing.
- Real client-generated PDF blueprint and boundary-contract downloads; raw journal inclusion is opt-in. Downloadable affirmation PNG and private JSON export.
- Supabase-backed squads (up to six), invitation codes, member kudos (five per sender/day), weekly private squad reflection, and opt-in weekly leagues grouped in cohorts of up to 30.
- Five league tiers. Previous-week cohorts with at least 15 participants promote top five/relegate bottom five. Rollover is evaluated when a member next opens the social page; there is no simulated ranking or background cron dependency.
- Content Studio: search, create, edit steps, field types/options/limits/required status, draft/publish, server-side role validation, and content revision records. Device mode offers a separately labeled local preview.
- Responsive layouts, accessible native form controls, keyboard focus trapping in the lesson player, reduced-motion support, and light/dark themes.

## Data and security

New data lives in `growth_*` tables, retaining original tables and content. `profiles` client updates are restricted to display name, avatar URL, and language; clients cannot change roles, subscriptions, XP, or streak counters. Personal journals have owner-only RLS, even for application admins. The admin analytics RPC returns only coarse aggregate counts.

**This is not end-to-end encrypted.** Journal JSON is protected by database permissions/RLS and the managed provider's transport/storage controls. Database owners and service-role holders can access it. Client-side encryption with user-managed recovery keys is a separate project and must not be advertised as implemented. Device mode uses localStorage and is intended for review/personal use on a trusted browser.

The original dashboard source and bilingual content are retained for migration/reference; the default experience now uses the Growth UI. Existing old quest completions are not reinterpreted as completions of the new lesson schemas. Existing `profiles.xp_total` is used as initial Growth XP at first account creation.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The suite covers client calculations and real PostgreSQL semantics through PGlite, with a lightweight emulation of Supabase's `auth.uid()`. It applies all migrations to an empty database, completes every lesson, verifies reward idempotency and field permissions, checks user/admin journal isolation, exercises CMS publishing and revision writes, and tests squad/kudos/league behavior. It does not substitute for hosted Supabase Auth/SMTP, browser, accessibility, or concurrency/load testing.

`npm run seed:generate` regenerates the initial lesson seed from `src/features/growth/catalog.ts`. Seed application uses `ON CONFLICT DO NOTHING` so it never overwrites subsequent CMS edits. Database content takes precedence for connected accounts.
