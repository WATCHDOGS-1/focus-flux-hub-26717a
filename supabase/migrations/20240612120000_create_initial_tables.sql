-- Create profiles table to store user data
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text,
  profile_photo_url text,
  primary key (id)
);
-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Create focus_sessions table
create table public.focus_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  start_time timestamp with time zone not null default now(),
  end_time timestamp with time zone,
  duration_minutes integer,
  primary key (id)
);
alter table public.focus_sessions enable row level security;
create policy "Users can manage their own sessions." on public.focus_sessions for all using (auth.uid() = user_id);

-- Create chat_messages table
create table public.chat_messages (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  message text not null,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);
alter table public.chat_messages enable row level security;
create policy "Users can view all messages." on public.chat_messages for select using (true);
create policy "Users can insert their own messages." on public.chat_messages for insert with check (auth.uid() = user_id);

-- Create daily_goals table
create table public.daily_goals (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  target_minutes integer not null,
  date date not null,
  primary key (id)
);
alter table public.daily_goals enable row level security;
create policy "Users can manage their own daily goals." on public.daily_goals for all using (auth.uid() = user_id);

-- Create weekly_goals table
create table public.weekly_goals (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  target_minutes integer not null,
  week_start date not null,
  primary key (id)
);
alter table public.weekly_goals enable row level security;
create policy "Users can manage their own weekly goals." on public.weekly_goals for all using (auth.uid() = user_id);

-- Create weekly_stats table
create table public.weekly_stats (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  week_start date not null,
  total_minutes integer not null default 0,
  primary key (id)
);
alter table public.weekly_stats enable row level security;
create policy "Users can view all weekly stats." on public.weekly_stats for select using (true);
create policy "Users can manage their own weekly stats." on public.weekly_stats for all using (auth.uid() = user_id);

-- Function to create a profile for a new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, profile_photo_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage for profile photos
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Profile photos are publicly accessible."
on storage.objects for select
using ( bucket_id = 'profile-photos' );

create policy "Anyone can upload a profile photo."
on storage.objects for insert
with check ( bucket_id = 'profile-photos' );

create policy "Anyone can update their own profile photo."
on storage.objects for update
using ( auth.uid() = owner )
with check ( bucket_id = 'profile-photos' );