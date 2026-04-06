-- 001_profiles.sql
-- Run this in your Supabase project's SQL editor (Dashboard → SQL Editor → New query).
-- Creates the profiles table that stores display names for each authenticated user.

create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  first_name  text not null,
  last_name   text not null,
  created_at  timestamp with time zone default now() not null
);

-- Enable Row Level Security so users can only access their own row.
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
