-- Supabase SQL Migration: 001_initial_schema.sql
-- Run this in Supabase Dashboard → SQL Editor after creating your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Plans table
create table public.plans (
  id text primary key,
  name text not null,
  price_monthly_bdt integer not null,
  price_yearly_bdt integer not null,
  max_students integer not null,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Schools table
create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  village text,
  post_office text,
  upazila text,
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User profiles (extends Supabase Auth.users)
create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'admin' check (role in ('admin', 'teacher', 'viewer')),
  school_id uuid references public.schools on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools on delete cascade not null,
  plan_id text references public.plans not null,
  status text not null default 'trialing' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now() + interval '30 days',
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grading scale table
create table public.grading_scale (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  min_percent integer not null,
  gpa numeric not null,
  grade text not null,
  remark text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  UNIQUE(school_id, min_percent)
);

-- Classes table
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_number integer not null,
  name text not null,
  subjects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  UNIQUE(school_id, class_number)
);

-- Students table
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  roll integer not null,
  name text not null,
  guardian text,
  village text,
  attendance numeric,
  marks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  UNIQUE(school_id, class_id, roll)
);

-- MTR records table
create table public.mtr_records (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  roll integer not null,
  bangla_reading text not null default 'unassessed',
  math_four_rules text not null default 'unassessed',
  english_reading text not null default 'unassessed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  UNIQUE(school_id, student_id)
);

-- Snapshots table
create table public.snapshots (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  reason text not null,
  json_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Insert default plans
insert into public.plans (id, name, price_monthly_bdt, price_yearly_bdt, max_students, features) values
  ('basic', 'Basic', 299, 2990, 100, '["core_features", "report_cards", "mtr_tracking"]'::jsonb),
  ('pro', 'Pro', 499, 4990, 300, '["core_features", "report_cards", "mtr_tracking", "qr_ids", "encrypted_backup", "priority_support"]'::jsonb),
  ('enterprise', 'Enterprise', 999, 9990, 999999, '["core_features", "report_cards", "mtr_tracking", "qr_ids", "encrypted_backup", "priority_support", "sms_notifications", "parent_portal", "attendance", "exam_management", "dedicated_support"]'::jsonb)
on conflict (id) do nothing;

-- Row Level Security (RLS) policies
alter table public.schools enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plans enable row level security;
alter table public.grading_scale enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.mtr_records enable row level security;
alter table public.snapshots enable row level security;

-- Plans are public read-only
create policy "Plans are viewable by everyone" on public.plans for select using (true);

-- Schools: users can view their own school
create policy "Users can view their own school" on public.schools for select using (
  exists (
    select 1 from public.user_profiles up
    where up.school_id = schools.id and up.id = auth.uid()
  )
);

-- User profiles: users can view their own profile
create policy "Users can view their own profile" on public.user_profiles for select using (
  id = auth.uid()
);

-- Subscriptions: users can view their school's subscription
create policy "Users can view their school subscription" on public.subscriptions for select using (
  exists (
    select 1 from public.user_profiles up
    where up.school_id = subscriptions.school_id and up.id = auth.uid()
  )
);

-- Grading scale policies
create policy "Users can view their school grading scale" on public.grading_scale for select using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);
create policy "Users can manage their school grading scale" on public.grading_scale for all using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);

-- Classes policies
create policy "Users can view their school classes" on public.classes for select using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);
create policy "Users can manage their school classes" on public.classes for all using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);

-- Students policies
create policy "Users can view their school students" on public.students for select using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);
create policy "Users can manage their school students" on public.students for all using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);

-- MTR records policies
create policy "Users can view their school mtr records" on public.mtr_records for select using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);
create policy "Users can manage their school mtr records" on public.mtr_records for all using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);

-- Snapshots policies
create policy "Users can view their school snapshots" on public.snapshots for select using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);
create policy "Users can manage their school snapshots" on public.snapshots for all using (
  school_id in (select school_id from public.user_profiles where id = auth.uid())
);
