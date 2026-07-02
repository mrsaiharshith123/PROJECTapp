-- Secure grant_perovo_admin: create/replace first, then revoke JWT access.
-- Safe when prior admin migrations were never applied on this project.
CREATE OR REPLACE FUNCTION public.grant_perovo_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'grant_perovo_admin may only be called from '
      'the Supabase SQL Editor or service role, not from a user session.';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id required';
  END IF;

  UPDATE public.profiles
  SET is_admin = true
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found for %', target_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_perovo_admin(uuid)
  FROM PUBLIC, authenticated, anon;

COMMENT ON FUNCTION public.grant_perovo_admin(uuid) IS
  'SQL Editor only — blocked for all JWT-authenticated callers. '
  'Run: select grant_perovo_admin(''<user-uuid>'');';
