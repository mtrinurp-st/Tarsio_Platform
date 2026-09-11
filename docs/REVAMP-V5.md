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

## Revamp 0.6 — preview and interaction follow-up

- Visible `Revamp 0.6` label in the footer/settings identifies the new frontend. The canonical private review URL is unchanged. The GitHub PR remains draft; the repository's default branch and unrelated Bolt/custom-domain deployments are not updated by publishing the private review Site.
- Added Tarsy chat to the active Growth shell. Requests call the existing `chat-reply` Edge Function with account verification and explicit AI consent. The function validates the JWT through Auth, rejects mismatched user IDs, caps history/input sizes, and never fetches someone else's context using a supplied ID/service role. No other journal is sent to Gemini. Session chat is memory-only and cleared on close.
- Gemini key travels only server-to-server in the API-key header, not the URL or client bundle. Requests time out after 25 seconds; fallback messages are labeled. Missing Gemini configuration returns 503, not a simulated successful AI response. Default model remains gemini-2.5-flash, configurable server-side.
- Auth now has confirmation-password validation, password visibility, resend confirmation, neutral recovery messages, translated errors, and focus trapping. Login accepts an existing shorter password; new passwords require eight characters. No online account is simulated when backend configuration is missing.
- Added a shared UI copy dictionary across shell, missions, shop, Blueprint, onboarding, player and CMS; added English course titles/descriptions. Custom/editorial question text, some dynamic status/helper copy, and exported report content still need full English parity. The language selector is functional and does not mutate answers.
- CMS includes a form preview reusing FieldInput. Existing creation/editing/publishing and role checks remain.
- Original Web Audio ambient chord loop, manual on/off, volume, no autoplay, no external audio requests. It remains active while navigating inside the app and stops when the document becomes hidden. Playback needs another click after reload/tab hiding.
- Mascot captions now sit below the animation with a stable gap and 14px text; the chat identity uses a separate text column. Reward ripple/arrival effects respect reduced motion.

### What is needed for live Gemini/Auth

The connected Supabase account still returns no projects. No live Edge Function or secret was changed. Select/connect the existing Tarsio Supabase project, then apply tested migrations and deploy the updated chat-reply function using the project's documented CLI workflow (discover deploy/secrets commands with --help). Set GEMINI_API_KEY as a Supabase secret, optionally GEMINI_MODEL. Configure Auth redirect URLs and SMTP, then rebuild the frontend with its public Supabase URL and publishable/anon key. Never paste the Gemini key into the frontend or a VITE variable.

Verify with two actual accounts that wrong-user requests fail and that the provider returns a Gemini response, not a fallback. Configure durable rate limits/quotas before opening public traffic. Local mocked-provider tests verify request/auth behavior but cannot prove the user's key, billing, provider quota, SMTP, or deployment is operational.

References checked: [Gemini text generation](https://ai.google.dev/gemini-api/docs/text-generation), [model lifecycle](https://ai.google.dev/gemini-api/docs/deprecations), and [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
