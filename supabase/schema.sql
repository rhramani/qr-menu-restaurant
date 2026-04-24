-- ============================================================
-- QRBite SaaS — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('super_admin', 'restaurant_admin', 'staff');
create type restaurant_status as enum ('active', 'inactive', 'suspended', 'trial');
create type plan_type as enum ('starter', 'professional', 'enterprise');
create type order_status as enum ('pending', 'preparing', 'ready', 'served', 'cancelled');
create type subscription_status as enum ('active', 'cancelled', 'expired', 'trial');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  res_pass text,
  full_name text,
  avatar_url text,
  role user_role not null default 'restaurant_admin',
  restaurant_id uuid, -- linked after restaurant creation
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PLANS
-- ============================================================

create table public.plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type plan_type not null,
  price_monthly numeric(10,2) not null,
  price_yearly numeric(10,2),
  max_tables integer not null default 10,
  max_menu_items integer not null default 50,
  max_categories integer not null default 10,
  features jsonb default '[]',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- RESTAURANTS
-- ============================================================

create table public.restaurants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  cover_image_url text,
  address text,
  city text,
  country text default 'IN',
  phone text,
  email text,
  res_pass text,
  currency text default 'INR',
  currency_symbol text default '₹',
  status restaurant_status default 'trial',
  is_accepting_orders boolean default true,
  primary_color text default '#f59e0b',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  plan_id uuid references public.plans(id) not null,
  status subscription_status default 'trial',
  started_at timestamptz default now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================

create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  is_gluten_free boolean default false,
  is_featured boolean default false,
  is_available boolean default true,
  sort_order integer default 0,
  prep_time_minutes integer default 15,
  calories integer,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RESTAURANT TABLES
-- ============================================================

create table public.restaurant_tables (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_number text not null,
  capacity integer default 4,
  floor text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(restaurant_id, table_number)
);

-- ============================================================
-- QR CODES
-- ============================================================

create table public.qr_codes (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_id uuid references public.restaurant_tables(id) on delete cascade not null unique,
  qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  scan_count integer default 0,
  last_scanned_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ORDERS
-- ============================================================

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  order_number text not null,
  customer_name text,
  customer_phone text,
  status order_status default 'pending',
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  notes text,
  served_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity integer not null default 1,
  subtotal numeric(10,2) not null,
  special_instructions text,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index idx_menu_items_category on public.menu_items(category_id);
create index idx_orders_restaurant on public.orders(restaurant_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);
create index idx_order_items_order on public.order_items(order_id);
create index idx_qr_codes_token on public.qr_codes(qr_token);
create index idx_categories_restaurant on public.categories(restaurant_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-generate order numbers
create or replace function generate_order_number(restaurant_id uuid)
returns text as $$
declare
  count integer;
  prefix text;
begin
  select count(*) + 1 into count
  from public.orders o
  where o.restaurant_id = $1
    and o.created_at >= date_trunc('day', now());

  prefix := to_char(now(), 'YYYYMMDD');
  return prefix || '-' || lpad(count::text, 3, '0');
end;
$$ language plpgsql security definer;

-- Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'restaurant_admin')
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_restaurants_updated_at
  before update on public.restaurants
  for each row execute function update_updated_at_column();

create trigger update_menu_items_updated_at
  before update on public.menu_items
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.qr_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper: get current user's role
create or replace function public.get_my_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: get current user's restaurant_id
create or replace function public.get_my_restaurant_id()
returns uuid as $$
  select restaurant_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Super admins can view all profiles" on public.profiles
  for all using (get_my_role() = 'super_admin');

-- PLANS policies
create policy "Plans are publicly readable" on public.plans
  for select using (true);

create policy "Super admins manage plans" on public.plans
  for all using (get_my_role() = 'super_admin');

-- RESTAURANTS policies
create policy "Public can view active restaurants" on public.restaurants
  for select using (status = 'active' or status = 'trial');

create policy "Restaurant admins view own restaurant" on public.restaurants
  for select using (id = get_my_restaurant_id());

create policy "Restaurant admins update own restaurant" on public.restaurants
  for update using (id = get_my_restaurant_id());

create policy "Super admins manage all restaurants" on public.restaurants
  for all using (get_my_role() = 'super_admin');

-- CATEGORIES policies
create policy "Public can view active categories" on public.categories
  for select using (is_active = true);

create policy "Restaurant admins manage own categories" on public.categories
  for all using (restaurant_id = get_my_restaurant_id());

create policy "Super admins manage all categories" on public.categories
  for all using (get_my_role() = 'super_admin');

-- MENU ITEMS policies
create policy "Public can view available menu items" on public.menu_items
  for select using (is_available = true);

create policy "Restaurant admins manage own menu items" on public.menu_items
  for all using (restaurant_id = get_my_restaurant_id());

create policy "Super admins manage all menu items" on public.menu_items
  for all using (get_my_role() = 'super_admin');

-- RESTAURANT TABLES policies
create policy "Public can view active tables" on public.restaurant_tables
  for select using (is_active = true);

create policy "Restaurant admins manage own tables" on public.restaurant_tables
  for all using (restaurant_id = get_my_restaurant_id());

-- QR CODES policies
create policy "Public can view qr codes" on public.qr_codes
  for select using (true);

create policy "Restaurant admins manage own qr codes" on public.qr_codes
  for all using (restaurant_id = get_my_restaurant_id());

-- ORDERS policies
create policy "Anyone can create orders" on public.orders
  for insert with check (true);

create policy "Restaurant admins view own orders" on public.orders
  for select using (restaurant_id = get_my_restaurant_id());

create policy "Restaurant admins update own orders" on public.orders
  for update using (restaurant_id = get_my_restaurant_id());

create policy "Super admins manage all orders" on public.orders
  for all using (get_my_role() = 'super_admin');

-- ORDER ITEMS policies
create policy "Anyone can create order items" on public.order_items
  for insert with check (true);

create policy "Restaurant admins view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
      and o.restaurant_id = get_my_restaurant_id()
    )
  );

create policy "Super admins manage all order items" on public.order_items
  for all using (get_my_role() = 'super_admin');

-- SUBSCRIPTIONS policies
create policy "Restaurant admins view own subscription" on public.subscriptions
  for select using (restaurant_id = get_my_restaurant_id());

create policy "Super admins manage all subscriptions" on public.subscriptions
  for all using (get_my_role() = 'super_admin');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default plans
insert into public.plans (name, type, price_monthly, price_yearly, max_tables, max_menu_items, features) values
  ('Starter', 'starter', 999, 9990, 5, 30, '["QR ordering", "Basic analytics", "Email support"]'),
  ('Professional', 'professional', 2499, 24990, 20, 150, '["QR ordering", "Advanced analytics", "Priority support", "Custom branding", "Multiple staff accounts"]'),
  ('Enterprise', 'enterprise', 4999, 49990, 100, 999, '["QR ordering", "Full analytics", "24/7 support", "Custom branding", "Unlimited staff", "API access", "White label"]');
