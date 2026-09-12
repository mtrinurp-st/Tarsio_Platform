# Tarsio Revamp 0.8 — 12 September 2026

Incremental update of the existing React/Vite application. This is a review release, not a claim of complete PRD delivery.

## Changed
- Account requests and SDK session locks now have finite deadlines and bilingual errors.
- Chat handles provider configuration failures and timeouts, retains failed text for retry, and avoids duplicate retry bubbles.
- Account and chat dialogs no longer stack; conversation starters make the first message easier.
- A persistent recovery action appears when authenticated progress cannot load.
- Existing ambient music controls, device quests/forms, rewards, theme/language settings, and moderated quest implementation are preserved.

## Review
Open Settings to change language/theme and enable quiet ambient music. Complete a quest, reload to inspect device persistence, and open Tarsy. When no backend is configured, Tarsy explicitly explains that online chat is unavailable. Chat consent and conversation state are session-only; do not describe them as permanent storage.

## Live blockers
The connected Supabase account returned no accessible projects. Therefore Auth/SMTP/redirect configuration, database migrations/RLS, deployed chat-reply with server-side GEMINI_API_KEY, and live CMS/moderation cannot be activated or integration-tested. Configure these on the existing Tarsio project; never put the Gemini key in VITE variables or browser code.

## Remaining PRD work
Full editorial translation parity, cross-device preferences, moderation appeals/assignment, account retention/deletion, paid entitlements/fulfillment and advanced squad mechanics remain outside this review release. These must not be represented as completed production features. See prior PRD and revamp documents for staged SQL and rollout details.
