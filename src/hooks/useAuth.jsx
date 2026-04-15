import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // Favorites (local fallback when not authed)
  const getFavorites = useCallback(async () => {
    if (!user) {
      try {
        return JSON.parse(localStorage.getItem('fav_episodes') || '[]')
      } catch {
        return []
      }
    }
    try {
      const { data, error } = await supabase.from('user_favorites').select('episode_id').eq('user_id', user.id)
      if (error) throw error
      return (data || []).map(r => r.episode_id)
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
      return []
    }
  }, [user])

  const toggleFavorite = useCallback(async (episodeId) => {
    if (!user) {
      try {
        const favs = JSON.parse(localStorage.getItem('fav_episodes') || '[]')
        const idx = favs.indexOf(episodeId)
        if (idx === -1) favs.push(episodeId)
        else favs.splice(idx, 1)
        localStorage.setItem('fav_episodes', JSON.stringify(favs))
        return idx === -1
      } catch (err) {
        console.error('LocalStorage error:', err)
        return false
      }
    }
    try {
      const { data: existing, error } = await supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('episode_id', episodeId).maybeSingle()
      if (error) throw error
      if (existing) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('episode_id', episodeId)
        return false
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, episode_id: episodeId })
        return true
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      return false
    }
  }, [user])

  const addHistory = useCallback(async (episodeId) => {
    if (!user) {
      const hist = JSON.parse(localStorage.getItem('listen_history') || '[]')
      const filtered = hist.filter(id => id !== episodeId)
      filtered.unshift(episodeId)
      localStorage.setItem('listen_history', JSON.stringify(filtered.slice(0, 50)))
      return
    }
    await supabase.from('listen_history').upsert({ user_id: user.id, episode_id: episodeId, listened_at: new Date().toISOString() }, { onConflict: 'user_id,episode_id' })
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getFavorites, toggleFavorite, addHistory }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
