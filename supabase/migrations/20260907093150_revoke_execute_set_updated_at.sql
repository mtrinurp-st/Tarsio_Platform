/*
# Revoke EXECUTE on set_updated_at from client roles

## Problem
`public.set_updated_at()` is a SECURITY DEFINER trigger function that can be called directly by `anon` and `authenticated` roles via `/rest/v1/rpc/set_updated_at`. It should only be invoked by table triggers, never by clients.

## Changes
- Revoke EXECUTE on `public.set_updated_at()` from `anon`, `authenticated`, and `PUBLIC`.
- The trigger on `profiles` and `quests` still works because trigger execution uses the function owner's privileges.

## Notes
- No data is modified or lost.
*/

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
