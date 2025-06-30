import React, { createContext, useState, useContext, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { makeRedirectUri } from 'expo-auth-session'
import { router } from 'expo-router'
// import { subscriptionManager } from './subscriptionManager' // temporarily disabled

type AuthContextType = {
  session: Session | null
  loading: boolean
  isInitialized: boolean
  error: string | null
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  setSession: (session: Session | null) => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isInitialized: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  setSession: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = makeRedirectUri({
    scheme: 'com.supabase',
    path: 'auth/callback'
  })

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log('Starting auth initialization...')
        setError(null)
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Auth session result:', { session: !!initialSession, error: sessionError })
        
        if (sessionError) {
          throw sessionError
        }
        
        if (mounted) {
          console.log('Initial auth state:', initialSession ? 'logged in' : 'logged out')
          setSession(initialSession)
          setIsInitialized(true)
          setLoading(false)
          console.log('Auth initialization complete')

          // Don't navigate here - let the layout handle navigation
          // if (initialSession) {
          //   router.replace('/(tabs)/recipes')
          // } else {
          //   router.replace('/auth/sign-in')
          // }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Authentication initialization failed')
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      setSession(session)
      if (event === 'SIGNED_IN') {
        router.replace('/(tabs)/home')
      } else if (event === 'SIGNED_OUT') {
        // Clean up all subscriptions when user signs out
        // subscriptionManager.removeAll() // temporarily disabled
        router.replace('/auth/sign-in')
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    // Clean up all subscriptions before signing out
    // subscriptionManager.removeAll() // temporarily disabled
    const { error } = await supabase.auth.signOut()
    setSession(null); // Immediately clear session in context
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      isInitialized,
      error,
      signIn,
      signOut,
      setSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
