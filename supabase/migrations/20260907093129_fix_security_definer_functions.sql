/*
# Fix security issues on database functions

## Problems
1. `public.set_updated_at` has a mutable search_path — allows search_path hijacking attacks.
2. `public.handle_new_user()` is a SECURITY DEFINER function callable by `anon` and `authenticated` roles via the REST API (`/rest/v1/rpc/handle_new_user`). This function is a trigger that auto-creates a profile on signup — it should ONLY be invoked by the database trigger on `auth.users`, never directly by any client.

## Changes
1. Set `search_path = public` (immutable) on both `public.handle_new_user` and `public.set_updated_at` to prevent search_path hijacking.
2. Revoke `EXECUTE` on `public.handle_new_user()` from `anon`, `authenticated`, and `PUBLIC` so it cannot be called via the REST API. The trigger on `auth.users` still works because trigger execution uses the function owner's privileges, not the caller's.

## Notes
- `handle_new_user` must remain SECURITY DEFINER because it inserts into `profiles` on behalf of the auth system.
- The trigger on `auth.users` is unaffected — it fires with elevated privileges regardless of role grants.
- No data is modified or lost.
*/

-- Fix 1: Set immutable search_path on handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, language_pref)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'language_pref', 'id'));
  RETURN NEW;
END;
$$;

-- Fix 2: Revoke EXECUTE on handle_new_user from all client-accessible roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Fix 3: Set immutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
