// Idempotent seed: creates demo members, posts, follows, likes, comments.
// Run from generated-app/frontend/: node scripts/seed.mjs  (reads ../../.env)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
if (!globalThis.WebSocket) globalThis.WebSocket = (await import('ws')).default
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)
const supabase = createClient(env.SUPABASE_PROJECT_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

const users = [
  { username: 'alice', email: 'alice@zeeter.app', password: 'Password123!', display_name: 'Alice Rivers', bio: 'Product designer. Coffee, cycling, and #design systems.' },
  { username: 'bob', email: 'bob@zeeter.app', password: 'Password123!', display_name: 'Bob Chen', bio: 'Full-stack dev shipping #react and #supabase apps.' },
  { username: 'carol', email: 'carol@zeeter.app', password: 'Password123!', display_name: 'Carol Mendes', bio: 'Photographer & traveler. Always chasing light. #travel' },
]

const posts = {
  alice: [
    'Just shipped a new component library at work. Consistent spacing tokens make everything feel calmer. #design #ux',
    'Hot take: the best onboarding is the one you never notice. #ux',
    'Sunday ride done: 60km along the coast. Legs are toast, heart is full. #cycling',
  ],
  bob: [
    'Row Level Security in #supabase is underrated. Policies as code, right next to your schema.',
    'Finally moved our feed sorting to a database view. Trending is now one query. #react #supabase',
    'Weekend project: rebuilding Zeeter in a day. Text-only, fast, and fun. #buildinpublic',
  ],
  carol: [
    'Golden hour in Lisbon never disappoints. #travel #photography',
    'Packing light for a two-week trip: one lens, one bag, zero regrets. #travel',
    'Reminder: the best camera is the one you actually carry. #photography',
  ],
}

async function ensureUser(u) {
  const { data: existing } = await supabase.from('profiles').select('id').eq('username', u.username).maybeSingle()
  let id = existing?.id
  if (!id) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email, password: u.password, email_confirm: true,
      user_metadata: { username: u.username, display_name: u.display_name },
    })
    if (error) throw error
    id = data.user.id
  }
  const { error } = await supabase.from('profiles').update({ display_name: u.display_name, bio: u.bio }).eq('id', id)
  if (error) throw error
  return id
}

const ids = {}
for (const u of users) ids[u.username] = await ensureUser(u)
console.log('users:', ids)

const postIds = {}
for (const [uname, contents] of Object.entries(posts)) {
  postIds[uname] = []
  for (const content of contents) {
    const { data: existing } = await supabase.from('posts').select('id').eq('author_id', ids[uname]).eq('content', content).maybeSingle()
    if (existing) { postIds[uname].push(existing.id); continue }
    const { data, error } = await supabase.from('posts').insert({ author_id: ids[uname], content }).select('id').single()
    if (error) throw error
    postIds[uname].push(data.id)
  }
}

const follows = [['alice', 'bob'], ['alice', 'carol'], ['bob', 'alice'], ['carol', 'alice'], ['carol', 'bob']]
for (const [a, b] of follows) {
  const { error } = await supabase.from('follows').upsert({ follower_id: ids[a], following_id: ids[b] }, { onConflict: 'follower_id,following_id', ignoreDuplicates: true })
  if (error) throw error
}

const likes = [['bob', postIds.alice[0]], ['carol', postIds.alice[0]], ['alice', postIds.bob[1]], ['carol', postIds.bob[1]], ['bob', postIds.carol[0]], ['alice', postIds.carol[0]], ['bob', postIds.alice[2]]]
for (const [u, p] of likes) {
  const { error } = await supabase.from('likes').upsert({ user_id: ids[u], post_id: p }, { onConflict: 'user_id,post_id', ignoreDuplicates: true })
  if (error) throw error
}

const comments = [
  ['bob', postIds.alice[0], 'Congrats! Spacing tokens changed how I build UIs too.'],
  ['carol', postIds.alice[2], 'That coastal route is gorgeous. Next time bring a camera!'],
  ['alice', postIds.bob[1], 'Views for the win. Cleaner than client-side sorting.'],
  ['alice', postIds.carol[0], 'Lisbon light is unreal. Jealous.'],
]
for (const [u, p, content] of comments) {
  const { data: existing } = await supabase.from('comments').select('id').eq('author_id', ids[u]).eq('post_id', p).eq('content', content).maybeSingle()
  if (existing) continue
  const { error } = await supabase.from('comments').insert({ author_id: ids[u], post_id: p, content })
  if (error) throw error
}
console.log('seed complete')
