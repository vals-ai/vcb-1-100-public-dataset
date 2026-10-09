# Zeeter — User Guide

Zeeter is a short-form, text-only social network. Open the app at the `APP_PUBLIC_URL` from `.env` (e.g. `http://localhost:14614`).

## Test accounts (password for all: `Password123!`)
| Username | Email             | Display name |
|----------|-------------------|--------------|
| alice    | alice@zeeter.app  | Alice Rivers |
| bob      | bob@zeeter.app    | Bob Chen     |
| carol    | carol@zeeter.app  | Carol Mendes |

You can sign in with **either the username or the email**. Creating a new account via **Sign up** works too (username, email, password — no email verification).

## Navigation
| URL | What you can do |
|-----|-----------------|
| `/` | Home feed. Guests see all posts with a "Join the conversation" banner. Members get a composer (280-char counter), **For you / Following** scope tabs, **Newest / Trending** sorting and a search box (keyword or `#hashtag`, e.g. `#travel`). Clicking a hashtag in a post searches it. |
| `/u/:username` | Public profile: avatar, name, bio, counts, and the member's posts. Members see **Follow / Unfollow**; on your own profile, **Edit profile**. |
| `/p/:id` | Post detail with comments and a comment composer (members). Reach it via the comment icon on a post. |
| `/notifications` | Member-only: follow, like and comment events on your content, unread dot + header badge, **Mark all as read**. |
| `/settings/profile` | Member-only: display name, bio (160 chars), profile photo upload. New sign-ups land here first. |
| `/login`, `/signup` | Authentication. |

## Suggested walkthrough
1. Browse `/` as a guest, try Trending and search `#travel`; click a heart → "Sign in to like" prompt.
2. **Sign up** a new member → fill in profile → **Skip/Save** → land on the feed and post something with a `#hashtag`.
3. On your post, use the edit (pencil) and delete (trash) icons — only visible on your own posts.
4. Sign in as **alice**: open `/u/bob`, Follow, like and comment on one of Bob's posts.
5. Sign out (avatar menu, top right) and sign in as **bob**: the Notifications badge shows the new follow/like/comment.
6. Toggle dark mode with the moon/sun icon in the header.
