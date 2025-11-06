'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

// Function to ensure user profile exists
async function ensureUserProfile(user: User) {
  if (!supabase) return
  
  try {
    // Check if profile exists
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      // Create profile with metadata from auth
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null
        })
      
      if (error) {
        console.error('Failed to create user profile:', error)
      } else {
        console.log('User profile created successfully')
      }
    }
  } catch (err) {
    console.error('Error ensuring user profile:', err)
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Automatically create profile for new users
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureUserProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    })
    
    // If signup successful and user is created, ensure profile exists
    if (!error && data.user) {
      await ensureUserProfile(data.user)
    }
    
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
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
