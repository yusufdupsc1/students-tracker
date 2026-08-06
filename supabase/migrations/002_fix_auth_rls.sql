-- Migration: 002_fix_auth_rls.sql
-- Fixes critical RLS issue that blocked signup/login
-- Previous migration only had SELECT policies, no INSERT/UPDATE for schools, user_profiles, subscriptions
-- This caused every signup to fail with RLS violation and login to loop with missing profile/subscription

-- Allow authenticated users to create a school during signup
drop policy if exists "Allow authenticated to insert schools" on public.schools;
create policy "Allow authenticated to insert schools"
  on public.schools for insert
  with check (auth.role() = 'authenticated');

-- Allow users to update their own school
drop policy if exists "Users can update their own school" on public.schools;
create policy "Users can update their own school"
  on public.schools for update
  using (
    exists (select 1 from public.user_profiles up where up.school_id = schools.id and up.id = auth.uid())
  )
  with check (
    exists (select 1 from public.user_profiles up where up.school_id = schools.id and up.id = auth.uid())
  );

-- Allow users to delete their own school (admin only, but RLS must allow)
drop policy if exists "Users can delete their own school" on public.schools;
create policy "Users can delete their own school"
  on public.schools for delete
  using (
    exists (select 1 from public.user_profiles up where up.school_id = schools.id and up.id = auth.uid())
  );

-- User profiles: allow insert for own id (critical for signup)
drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Subscriptions: allow insert for authenticated users (signup creates trialing subscription)
-- At subscription creation time, user_profiles already exists, so we check that linkage,
-- but also allow any authenticated insert to avoid ordering deadlock
drop policy if exists "Users can insert subscription" on public.subscriptions;
create policy "Users can insert subscription"
  on public.subscriptions for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can update their school subscription" on public.subscriptions;
create policy "Users can update their school subscription"
  on public.subscriptions for update
  using (
    exists (select 1 from public.user_profiles up where up.school_id = subscriptions.school_id and up.id = auth.uid())
  )
  with check (
    exists (select 1 from public.user_profiles up where up.school_id = subscriptions.school_id and up.id = auth.uid())
  );

-- Ensure updated_at triggers exist (auto-update timestamp)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_schools on public.schools;
create trigger set_updated_at_schools before update on public.schools for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_user_profiles on public.user_profiles;
create trigger set_updated_at_user_profiles before update on public.user_profiles for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_subscriptions on public.subscriptions;
create trigger set_updated_at_subscriptions before update on public.subscriptions for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_grading_scale on public.grading_scale;
create trigger set_updated_at_grading_scale before update on public.grading_scale for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_classes on public.classes;
create trigger set_updated_at_classes before update on public.classes for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_students on public.students;
create trigger set_updated_at_students before update on public.students for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_mtr_records on public.mtr_records;
create trigger set_updated_at_mtr_records before update on public.mtr_records for each row execute function public.handle_updated_at();
