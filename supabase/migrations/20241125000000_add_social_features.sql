-- 1. Create Study Circles Tables

-- circles table
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.circles enable row level security;

-- circle_members table
create table public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner' or 'member'
  joined_at timestamptz not null default now(),
  unique (circle_id, user_id)
);
alter table public.circle_members enable row level security;

-- circle_messages table
create table public.circle_messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.circle_messages enable row level security;


-- 2. Create Focus Feed Tables

-- feed_item_type enum
create type public.feed_item_type as enum ('session_completed', 'achievement_unlocked');

-- feed_items table
create table public.feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.feed_item_type not null,
  data jsonb, -- e.g., { "duration": 60, "tag": "Physics" }
  created_at timestamptz not null default now()
);
alter table public.feed_items enable row level security;

-- feed_applauds (likes) table
create table public.feed_applauds (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feed_item_id, user_id)
);
alter table public.feed_applauds enable row level security;


-- 3. RLS Policies

-- Circles
create policy "Allow authenticated users to view circles" on public.circles for select using (auth.role() = 'authenticated');
create policy "Allow users to create circles" on public.circles for insert with check (auth.uid() = owner_id);
create policy "Allow owner to update circle" on public.circles for update using (auth.uid() = owner_id);
create policy "Allow owner to delete circle" on public.circles for delete using (auth.uid() = owner_id);

-- Circle Members
create policy "Allow members to view other members" on public.circle_members for select using (
  exists (select 1 from public.circle_members where circle_id = circle_members.circle_id and user_id = auth.uid())
);
create policy "Allow users to join circles" on public.circle_members for insert with check (true);
create policy "Allow users to leave circles" on public.circle_members for delete using (auth.uid() = user_id);

-- Circle Messages
create policy "Allow members to view messages" on public.circle_messages for select using (
  exists (select 1 from public.circle_members where circle_id = circle_messages.circle_id and user_id = auth.uid())
);
create policy "Allow members to send messages" on public.circle_messages for insert with check (
  exists (select 1 from public.circle_members where circle_id = circle_messages.circle_id and user_id = auth.uid())
);

-- Feed Items
create policy "Allow authenticated users to view feed items" on public.feed_items for select using (auth.role() = 'authenticated');
-- Insertion will be handled by a trigger/function

-- Feed Applauds
create policy "Allow authenticated users to view applauds" on public.feed_applauds for select using (auth.role() = 'authenticated');
create policy "Allow users to applaud posts" on public.feed_applauds for insert with check (auth.uid() = user_id);
create policy "Allow users to remove their applaud" on public.feed_applauds for delete using (auth.uid() = user_id);


-- 4. Database Function and Trigger for Automatic Feed Posts

-- Function to create a feed item when a focus session ends
create or replace function public.handle_new_focus_session_feed_item()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only create a feed item if the session was longer than 1 minute
  if new.duration_minutes is not null and new.duration_minutes > 0 then
    insert into public.feed_items (user_id, type, data)
    values (
      new.user_id,
      'session_completed',
      jsonb_build_object(
        'duration', new.duration_minutes,
        'tag', new.tag
      )
    );
  end if;
  return new;
end;
$$;

-- Trigger to call the function after a focus_sessions row is updated
create trigger on_focus_session_end
  after update on public.focus_sessions
  for each row
  when (old.end_time is null and new.end_time is not null)
  execute function public.handle_new_focus_session_feed_item();