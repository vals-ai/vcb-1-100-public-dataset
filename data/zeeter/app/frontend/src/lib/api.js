import { supabase } from './supabase'

async function throwOnError(promise) { const { data, error, count } = await promise; if (error) throw error; return count === null || count === undefined ? data : { data, count } }

async function attachProfiles(rows, key = 'author_id', field = 'author') {
  if (!rows?.length) return rows || []
  const ids = [...new Set(rows.map((row) => row[key]).filter(Boolean))]
  const profiles = await throwOnError(supabase.from('profiles').select('*').in('id', ids))
  const byId = Object.fromEntries(profiles.map((profile) => [profile.id, profile]))
  return rows.map((row) => ({ ...row, [field]: byId[row[key]] }))
}

export async function fetchPosts({ scope = 'all', q = '', userId } = {}) {
  let authorIds
  if (scope === 'following' && userId) {
    const follows = await throwOnError(supabase.from('follows').select('following_id').eq('follower_id', userId))
    authorIds = follows.map((follow) => follow.following_id)
    if (!authorIds.length) return []
  }
  let query = supabase.from('posts_with_stats').select('*').order('created_at', { ascending: false }).limit(100)
  if (authorIds) query = query.in('author_id', authorIds)
  if (q.trim()) query = query.ilike('content', `%${q.trim()}%`)
  return attachProfiles(await throwOnError(query))
}

export async function fetchLikedPostIds(userId, postIds) {
  if (!userId || !postIds.length) return []
  const likes = await throwOnError(supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds))
  return likes.map((like) => like.post_id)
}
export async function toggleLike(userId, postId, liked) {
  if (liked) return throwOnError(supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId))
  return throwOnError(supabase.from('likes').insert({ user_id: userId, post_id: postId }))
}
export const createPost = (authorId, content) => throwOnError(supabase.from('posts').insert({ author_id: authorId, content }).select().single())
export const updatePost = (id, content) => throwOnError(supabase.from('posts').update({ content }).eq('id', id).select().single())
export const deletePost = (id) => throwOnError(supabase.from('posts').delete().eq('id', id))

export async function fetchProfile(username) {
  const profile = await throwOnError(supabase.from('profiles').select('*').eq('username', username).maybeSingle())
  if (!profile) return null
  const [{ count: posts }, { count: followers }, { count: following }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
  ])
  return { ...profile, counts: { posts: posts || 0, followers: followers || 0, following: following || 0 } }
}
export async function isFollowing(followerId, followingId) { return !!(await throwOnError(supabase.from('follows').select('*').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle())) }
export async function toggleFollow(followerId, followingId, following) {
  if (following) return throwOnError(supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId))
  return throwOnError(supabase.from('follows').insert({ follower_id: followerId, following_id: followingId }))
}
export async function fetchPost(id) { const post = await throwOnError(supabase.from('posts_with_stats').select('*').eq('id', id).maybeSingle()); return post ? (await attachProfiles([post]))[0] : null }
export async function fetchComments(postId) { return attachProfiles(await throwOnError(supabase.from('comments').select('*').eq('post_id', postId).order('created_at')), 'author_id', 'author') }
export const createComment = (postId, authorId, content) => throwOnError(supabase.from('comments').insert({ post_id: postId, author_id: authorId, content }).select().single())

export async function fetchNotifications(userId) {
  let rows = await throwOnError(supabase.from('notifications').select('*').eq('recipient_id', userId).order('created_at', { ascending: false }))
  rows = await attachProfiles(rows, 'actor_id', 'actor')
  const commentIds = rows.map((row) => row.comment_id).filter(Boolean)
  if (commentIds.length) {
    const comments = await throwOnError(supabase.from('comments').select('id,content').in('id', commentIds))
    const byId = Object.fromEntries(comments.map((comment) => [comment.id, comment]))
    rows = rows.map((row) => ({ ...row, comment: byId[row.comment_id] }))
  }
  return rows
}
export const markNotificationsRead = (userId) => throwOnError(supabase.from('notifications').update({ read: true }).eq('recipient_id', userId).eq('read', false))
export async function unreadNotificationCount(userId) { const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', userId).eq('read', false); if (error) throw error; return count || 0 }

export async function suggestedProfiles(userId) {
  const profiles = await throwOnError(supabase.from('profiles').select('*').limit(20))
  if (!userId) return profiles.slice(0, 3)
  const follows = await throwOnError(supabase.from('follows').select('following_id').eq('follower_id', userId))
  const excluded = new Set([userId, ...follows.map((item) => item.following_id)])
  return profiles.filter((profile) => !excluded.has(profile.id)).slice(0, 3)
}
