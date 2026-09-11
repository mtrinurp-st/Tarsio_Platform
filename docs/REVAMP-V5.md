# Tarsio revamp v5 implementation checkpoint

This increment extends the existing application. The authoritative attached PRD was expanded to 24 sections, with a standalone execution prompt at the end.

## Implemented in source

- Per-account browser preferences for Indonesian/English and light/dark/system. Document language and color scheme follow preferences. No reload or journal translation.
- Bilingual navigation labels, preference/privacy surfaces, and Community Quests UI. Existing lesson and other journey copy is **not fully translated yet**; this is explicitly disclosed.
- Poin replaces visible Gems naming without resetting historical balances. This is a compatibility label, not a completed monetary ledger.
- Community authoring for the four original question types, reusing FieldInput. Draft preview, submission consent, review checklist, request changes/rejection/publication, report/suspension, private response save/export. Pilot explicitly awards no XP/Poin.
- Server-side ownership, immutable review states, expected revisions, prohibition on self-review, moderation audit snapshots, owner-only responses, private reports, and authenticated-only publication projection.
- Cross-squad league UI hidden for the new PRD direction; existing tables and consent data remain intact. A full squad weekly leaderboard remains a follow-up.

## Backend staging

`supabase/pending/community_quests.sql` is reviewed/testable SQL, deliberately outside automatic migration replay. The Supabase CLI was unavailable and package acquisition did not complete; no migration filename was fabricated. No accessible Supabase projects were returned. No production database was changed.

When the project/CLI is available:

1. Run `supabase --version` and `supabase migration new --help`.
2. Run `supabase migration new community_quests` and copy the staged SQL into the generated file.
3. Remove the pending-file execution from `tests/database.test.mjs` after migration promotion so it runs exactly once through the standard migration loop.
4. Check schema drift and existing tables before applying. The file intentionally fails on duplicate tables; it does not silently replace them.
5. Run tests against clean and upgrade fixtures; apply to staging; verify RLS/grants/advisors and real Auth sessions with A/B/admin accounts.
6. Configure the existing frontend's Supabase URL and publishable/anon key. No service-role key belongs in the browser.
7. Perform browser QA and operational moderation training before opening UGC beyond a closed pilot.

## Release gaps

Full bilingual parity, account preference sync across devices, full retention/delete controls, appeals and assignment, pagination beyond the pilot's 100-item queue, moderation capacity/SLA, payment/fulfillment, and live provider verification remain open. There is no claim of production readiness, E2EE, full Duolingo parity, or completed privacy compliance.

Draft content is intentionally the only content given to moderators after explicit submission. Private UGC responses are separate from existing Blueprint data and have their own export button. Saving a response is explicit; it is not autosaved while typing. A quest withdrawal during completion makes the server reject that completion.
