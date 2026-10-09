-- Zeeter schema
create extension if not exists citext;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique check (length(username) between 3 and 30 and username ~ '^[A-Za-z0-9_]+$'),
  email citext not null unique,
  display_name text not null default '',
  bio text not null default '' check (length(bio) <= 160),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) between 1 and 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_author_idx on public.posts(author_id, created_at desc);
create index posts_created_idx on public.posts(created_at desc);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows(following_id);

create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index likes_post_idx on public.likes(post_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) between 1 and 280),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow','like','comment')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);

-- Feed view with engagement counts (respects RLS of underlying tables)
create view public.posts_with_stats with (security_invoker = true) as
select p.*,
  (select count(*) from public.likes l where l.post_id = p.id)::int as like_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count
from public.posts p;

-- Auto-create profile on signup from metadata
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uname text := coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(replace(new.id::text,'-',''),1,10));
begin
  insert into public.profiles (id, username, email, display_name)
  values (new.id, uname, coalesce(new.email, uname || '@zeeter.local'), coalesce(new.raw_user_meta_data->>'display_name', uname))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Resolve username -> email for login (callable by anon)
create or replace function public.email_for_username(uname text) returns text
language sql security definer stable set search_path = public as $$
  select email::text from public.profiles where username = uname limit 1;
$$;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- Check username availability at signup
create or replace function public.username_available(uname text) returns boolean
language sql security definer stable set search_path = public as $$
  select not exists (select 1 from public.profiles where username = uname);
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- updated_at maintenance
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Notification triggers
create or replace function public.notify_on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type) values (new.following_id, new.follower_id, 'follow');
  return new;
end $$;
create trigger follows_notify after insert on public.follows for each row execute function public.notify_on_follow();

create or replace function public.notify_on_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id) values (owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end $$;
create trigger likes_notify after insert on public.likes for each row execute function public.notify_on_like();

create or replace function public.notify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id) values (owner, new.author_id, 'comment', new.post_id, new.id);
  end if;
  return new;
end $$;
create trigger comments_notify after insert on public.comments for each row execute function public.notify_on_comment();

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "posts public read" on public.posts for select using (true);
create policy "posts insert own" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "posts update own" on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "posts delete own" on public.posts for delete to authenticated using (auth.uid() = author_id);

create policy "follows public read" on public.follows for select using (true);
create policy "follows insert own" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "follows delete own" on public.follows for delete to authenticated using (auth.uid() = follower_id);

create policy "likes public read" on public.likes for select using (true);
create policy "likes insert own" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes delete own" on public.likes for delete to authenticated using (auth.uid() = user_id);

create policy "comments public read" on public.comments for select using (true);
create policy "comments insert own" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "comments delete own" on public.comments for delete to authenticated using (auth.uid() = author_id);

create policy "notifications read own" on public.notifications for select to authenticated using (auth.uid() = recipient_id);
create policy "notifications update own" on public.notifications for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Avatar storage bucket
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars upload own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete own" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
