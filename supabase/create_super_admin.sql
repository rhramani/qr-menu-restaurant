-- ============================================================
-- Create Super Admin User
-- Run in Supabase SQL Editor (requires service role access)
-- Change email and password before running!
-- ============================================================

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  admin_email  text := 'admin@qrbite.com';   -- ← change this
  admin_pass   text := 'Admin@123456';        -- ← change this (min 8 chars)
  admin_name   text := 'Super Admin';
BEGIN

  -- 1. Create the auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_pass, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('role', 'super_admin', 'full_name', admin_name),
    NOW(),
    NOW(),
    '', '', '', ''
  );

  -- 2. Create the identity record (required for email login to work)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    admin_email,
    jsonb_build_object('sub', new_user_id::text, 'email', admin_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- 3. The trigger auto-creates the profile — but force-update role to super_admin
  UPDATE public.profiles
  SET role = 'super_admin',
      full_name = admin_name
  WHERE id = new_user_id;

  RAISE NOTICE '✅ Super admin created — ID: %, Email: %', new_user_id, admin_email;

END $$;
