import { useCallback, useEffect, useState } from 'react'
import { fetchLikedPostIds, fetchProfile as getProfile, fetchPosts, isFollowing } from '../lib/api'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

export function useProfile(username) {
  const { user } = useAuth()
  const toast = useToast()
  const [state, setState] = useState({ profile: null, posts: [], likedIds: new Set(), following: false, loading: true })
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }))
    try {
      const profile = await getProfile(username)
      if (!profile) { setState({ profile: null, posts: [], likedIds: new Set(), following: false, loading: false }); return }
      const [posts, following] = await Promise.all([
        fetchPosts().then((rows) => rows.filter((row) => row.author_id === profile.id)),
        user && user.id !== profile.id ? isFollowing(user.id, profile.id) : false,
      ])
      const likedIds = new Set(await fetchLikedPostIds(user?.id, posts.map((post) => post.id)))
      setState({ profile, posts, likedIds, following, loading: false })
    } catch (error) {
      toast(error.message, 'error')
      setState((current) => ({ ...current, loading: false }))
    }
  }, [username, user, toast])
  useEffect(() => { load() }, [load])
  return { ...state, refresh: load, setFollowing: (following) => setState((current) => ({ ...current, following })) }
}
