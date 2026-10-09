import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchProfile = async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data || null)
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      return fetchProfile(data.session?.user?.id)
    }).finally(() => setLoading(false))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setTimeout(() => fetchProfile(next?.user?.id), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])
  const value = { user: session?.user || null, session, profile, loading, signOut: () => supabase.auth.signOut(), refreshProfile: () => fetchProfile(session?.user?.id) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }
