# Zeeter — Technical README

## General Implementation
Zeeter is a text-only, short-form social network. Members publish ≤280-character posts, follow other members, like and comment on posts, and receive in-app notifications. Guests browse all public content but are prompted to sign in for member actions.

**Tech stack:** React 19 + Vite (JavaScript), React Router (lazy-loaded pages), Tailwind CSS v3 with a semantic HSL token design system (light/dark), hand-written shadcn-style UI primitives, `@supabase/supabase-js`. Supabase provides Auth (email+password; username login resolved via RPC), Postgres (RLS on every table), and Storage (`avatars` bucket). No custom backend — all business rules live in the database (constraints, triggers, RLS policies).

**Architecture:** the SPA talks directly to Supabase with the anon key. Row Level Security enforces ownership (only authors edit/delete posts, only followers unfollow, etc.). Notifications are produced by DB triggers on `follows`, `likes`, and `comments` inserts, so they cannot be forged from the client. The `posts_with_stats` view (security_invoker) exposes like/comment counts for Newest/Trending sorting. Search uses `ilike` on post content (`#tag` for hashtags). Profiles are auto-created by a trigger on `auth.users` from signup metadata.

## Code Structure
```
generated-app/
  docker-compose.yml            # single service `zeeter` (Vite preview on 4173 -> ${APP_PUBLIC_PORT})
  .env                          # Supabase + port config (provided)
  supabase/migrations/          # 20260905000000_init_zeeter.sql — full schema, RLS, triggers, bucket
  frontend/
    Dockerfile.frontend, .dockerignore, .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    scripts/seed.mjs            # idempotent demo data (npm run seed, from frontend/)
    src/
      lib/supabase.js           # client;  lib/api.js — all data access (feed, likes, follows, comments, notifications)
      hooks/useAuth.jsx         # session + own profile context; useFeed/useProfile/usePost/useNotifications/useToast
      components/               # Header, Layout, Sidebar, Composer, PostCard, InteractionPrompt, ThemeToggle, ui/*
      pages/                    # Home, Profile (/u/:username), PostDetail (/p/:id), Notifications,
                                # ProfileSettings (/settings/profile), Login, Signup, NotFound
```

## Database Schema (public)
- `profiles(id→auth.users, username citext unique, email citext unique, display_name, bio≤160, avatar_url, created_at, updated_at)`
- `posts(id, author_id→profiles, content 1..280, created_at, updated_at)`
- `follows(follower_id, following_id)` PK, no self-follow
- `likes(user_id, post_id)` PK
- `comments(id, post_id→posts, author_id→profiles, content 1..280, created_at)`
- `notifications(id, recipient_id, actor_id, type follow|like|comment, post_id, comment_id, read, created_at)`
- view `posts_with_stats` = posts + `like_count`, `comment_count`
- RPCs: `email_for_username(text)`, `username_available(text)`; triggers: `handle_new_user`, `notify_on_*`, `set_updated_at`
- Storage bucket `avatars` (public read; users write only under `<uid>/`)

Seeding: `cd frontend && npm install && npm run seed` (uses the service role key from `../.env`; safe to re-run).
