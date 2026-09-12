# Launch / handoff

## Status of this delivery

The application is runnable and its business/database logic is locally tested. The review deployment defaults to device mode because project-specific Supabase configuration is not present in this checkout. It is **not yet a verified production multi-user service**.

To enable production accounts and multi-user behavior, the owner must provide/configure the actual Supabase project, apply migrations, set Auth redirects/SMTP, assign trusted admin access, rebuild, and run hosted integration checks. Do not enable production social/community traffic before these checks.

## Schema rollout

- `20260827153632_add_5_questions_per_quest.sql` now includes missing category/quest parents for fresh database installs. This fixes an existing foreign-key failure. Databases that already applied the migration do not replay it.
- `20260910110000_growth_platform.sql` adds the new schema/RPCs/RLS and narrows editable profile columns. Old direct client XP/subscription updates will be rejected after this migration; roll out the new frontend together with it.
- `20260911090000_pin_private_writes_to_account.sql` requires an expected account ID on draft, action, and settings requests, rejecting writes queued before an account change. Deploy the accompanying client together with this migration.
- `20260910110100_seed_growth_content.sql` installs the 22 initial lesson schemas without overwriting existing entries.
- Old tables are retained, including original mood logs, chat history and completions. Their answers are not converted into different new lessons.
- Take an ordinary database backup before production migration. No migration in this delivery deletes legacy user journals.

## Honest scope boundaries

The following are not claimed as completed production capabilities:

- Managed Supabase provisioning, real SMTP delivery, OAuth provider setup, or verification against the user's live backend.
- End-to-end journal encryption or user-key recovery. Application administrators cannot read journals through the provided policies, but trusted DB/service-role operators remain privileged.
- Email/web-push delivery while the app is closed. Reminders are derived in-app and shown on the Missions page. No external automation was created on the owner's personal account.
- Exact Duolingo feature parity, mobile native apps, a fully animated four-stage character asset set, or live AI counseling. The original mascot, level-stage labels, moods, and cosmetic aura are used.
- Full English localization of the new 22-lesson catalog. Indonesian content lives in an extensible schema; legacy bilingual resources are retained.
- A public journal share URL/QR, automatic squad matching, automated content moderation, or payments. These need explicit product/security work; no paid upgrades are falsely simulated.
- Randomized weighted daily quests. This release uses three deterministic, verifiable daily missions.
- Mandatory signature canvas. The boundary contract uses the requested accessible typed-name/consent fallback and real PDF output.
- Radar/spider-web artwork, draggable mind maps, and a graphical anatomical map. Accessible structured controls and bar/grid summaries implement the underlying inputs.

## Production smoke checklist

1. Register two ordinary accounts and one trusted admin. Verify email confirmation and reset links on the final origin.
2. Complete onboarding, partially answer a lesson, close/reopen the app, and resume the same draft. Repeat while briefly offline. Verify account switching never shows another user's answers.
3. Complete a lesson twice and in competing tabs. Check one ledger award only, with no client permission to edit rewards/roles.
4. Verify all 22 lesson submissions and exports with real saved records. Check Indonesian text, long notes, mobile layouts and keyboard/screen-reader behavior.
5. Confirm ordinary users cannot retrieve another user's `growth_progress` even by changing IDs in direct requests; verify admin JWTs also cannot read personal payloads.
6. Draft/publish/edit a quest as admin. Verify drafts are hidden from normal accounts and revisions are recorded.
7. Create/join a squad, check six-member capacity, fifth/sixth daily kudos behavior, private weekly answers, opt-in/out visibility, and week rollover.
8. Configure monitoring, backups, retention/account deletion procedures, rate limits, moderation/escalation, privacy terms, and support appropriate to the actual public launch.

## UI paths

The Vite SPA uses hash navigation to remain compatible with static hosting: `#learn`, `#explore`, `#missions`, `#blueprint`, `#social`, `#shop`, `#settings`, `#admin`. Lesson players are modal flows. Auth and onboarding are accessible from the main surface.

## Important runtime behavior

- Signed-in draft writes queue on the device before remote save. Failed writes remain queued and can be retried in Settings. Draft queues are scoped by user ID. A newer server draft wins on reload when its timestamp is newer.
- Device mode and account mode intentionally do not merge private records automatically.
- A streak uses calendar dates in Asia/Jakarta, not a sliding 24-hour timer.
- A freeze preserves a missed day, does not add a day of activity, and is consumed by the next valid activity.
- League assignment is serialized; groups fill to 30. Cohorts with fewer than 15 do not promote/relegate. Rollovers occur on the first social-page visit after the week changes, not via an installed Sunday cron job.
- Reward eligibility comes from persisted server records. The local demonstration runs equivalent rules but is naturally editable by the owner of the browser.

## September 11 iteration

- Added mood check-in to Missions, so daily mood rewards are reachable when the desktop side panel is hidden.
- New budget forms start with 50/30/20 allocations; simulator forms start with zero initial balance and an explicitly illustrative 5% assumption.
- Draft replay compares timestamp instants, protects account transitions before/after requests, preserves failed-write labels, and rejects mismatched expected owners in PostgreSQL.
- Component-local reflections and CMS drafts reset across account changes.
