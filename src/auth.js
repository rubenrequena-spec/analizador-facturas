import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext({
  session: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isActive: false,
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProfile(userId) {
      if (!userId) {
        if (active) setProfile(null)
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (active) setProfile(data || null)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      loadProfile(data.session?.user?.id).finally(() => {
        if (active) setLoading(false)
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfile(newSession?.user?.id)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    isAdmin: profile?.role === 'admin' && profile?.active !== false,
    isActive: profile?.active !== false,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  return useContext(AuthContext)
}

// Devuelve un mensaje de error, o null si el login fue correcto.
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? error.message : null
}

export async function signOut() {
  await supabase.auth.signOut()
}
