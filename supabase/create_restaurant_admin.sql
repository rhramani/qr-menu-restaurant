-- ============================================================
-- Create Restaurant Admin User & Link to Restaurant
-- Run in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  new_user_id    uuid := gen_random_uuid();
  admin_email    text := 'owner@restaurant.com';  -- ← change this
  admin_pass     text := 'Owner@123456';           -- ← change this
  admin_name     text := 'Restaurant Owner';       -- ← change this
  v_restaurant_id uuid;                            -- will be fetched below
  restaurant_slug text := 'the-grand-kitchen';     -- ← slug of the restaurant you created
BEGIN

  -- Fetch the restaurant by slug
  SELECT id INTO v_restaurant_id
  FROM public.restaurants
  WHERE slug = restaurant_slug;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION '❌ Restaurant with slug "%" not found. Check the slug.', restaurant_slug;
  END IF;

  -- 1. Create auth user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    admin_email,
    crypt(admin_pass, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('role', 'restaurant_admin', 'full_name', admin_name),
    NOW(), NOW(), '', '', '', ''
  );

  -- 2. Create identity (required for email login)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data,
    provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, admin_email,
    jsonb_build_object('sub', new_user_id::text, 'email', admin_email),
    'email', NOW(), NOW(), NOW()
  );

  -- 3. Update profile: set role + link to restaurant
  UPDATE public.profiles
  SET role          = 'restaurant_admin',
      full_name     = admin_name,
      restaurant_id = v_restaurant_id
  WHERE id = new_user_id;

  -- 4. Link restaurant owner
  UPDATE public.restaurants
  SET owner_id = new_user_id
  WHERE id = v_restaurant_id;

  RAISE NOTICE '✅ Restaurant admin created';
  RAISE NOTICE '   Email: %', admin_email;
  RAISE NOTICE '   Password: %', admin_pass;
  RAISE NOTICE '   Restaurant: % (%)', restaurant_slug, v_restaurant_id;

END $$;
