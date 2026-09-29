import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext({
  session: null,
  profile: null,
  colaboradorUser: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isActive: false,
  isColaborador: false,
  colaborador: null,
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [colaboradorUser, setColaboradorUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Tras el login puede tratarse de personal interno (profiles) o de un
    // colaborador externo (colaborador_usuarios) — son dos identidades
    // distintas sobre la misma sesión de Supabase Auth.
    async function loadIdentity(userId) {
      if (!userId) {
        if (active) {
          setProfile(null)
          setColaboradorUser(null)
        }
        return
      }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (!active) return
      if (p) {
        setProfile(p)
        setColaboradorUser(null)
        return
      }
      setProfile(null)
      const { data: cu } = await supabase
        .from('colaborador_usuarios')
        .select('*, colaborador:colaboradores(*)')
        .eq('id', userId)
        .maybeSingle()
      if (active) setColaboradorUser(cu || null)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      loadIdentity(data.session?.user?.id).finally(() => {
        if (active) setLoading(false)
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadIdentity(newSession?.user?.id)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    profile,
    colaboradorUser,
    loading,
    isAuthenticated: !!session,
    isAdmin: profile?.role === 'admin' && profile?.active !== false,
    isActive: profile?.active !== false,
    isColaborador: !!colaboradorUser && colaboradorUser.active !== false,
    colaborador: colaboradorUser?.colaborador || null,
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
