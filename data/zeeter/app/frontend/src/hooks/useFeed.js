import { useCallback, useEffect, useState } from 'react'
import { fetchLikedPostIds, fetchPosts } from '../lib/api'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

export function useFeed({ scope = 'all', sort = 'newest', q = '' } = {}) {
  const { user } = useAuth(); const toast = useToast()
  const [posts, setPosts] = useState([]); const [likedIds, setLikedIds] = useState(new Set()); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      let rows = await fetchPosts({ scope, q: q.replace(/^#/, '#'), userId: user?.id })
      if (sort === 'trending') rows = [...rows].sort((a, b) => (b.like_count * 2 + b.comment_count) - (a.like_count * 2 + a.comment_count) || new Date(b.created_at) - new Date(a.created_at))
      setPosts(rows)
      setLikedIds(new Set(await fetchLikedPostIds(user?.id, rows.map((row) => row.id))))
    } catch (error) { toast(error.message, 'error') } finally { setLoading(false) }
  }, [scope, sort, q, user?.id, toast])
  useEffect(() => { load() }, [load])
  return { posts, likedIds, loading, refresh: load, setPosts, setLikedIds }
}
