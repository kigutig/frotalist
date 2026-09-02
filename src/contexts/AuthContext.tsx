import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User, UserRole } from '../types'
import { MOCK_USERS } from '../lib/mock-data'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  role: UserRole | null
  isAdmin: boolean
  isOperator: boolean
  isDriver: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasPermission: (requiredRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Demo mode: no real Supabase connection
const IS_DEMO_MODE =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user profile from DB or mock
  const loadUserProfile = useCallback(async (userId: string, userEmail?: string): Promise<User | null> => {
    if (IS_DEMO_MODE) {
      // Return mock user based on email
      const found = MOCK_USERS.find((u) => u.email === userEmail) ?? MOCK_USERS[0]
      return found
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error || !data) return null
      return data as User
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      if (IS_DEMO_MODE) {
        // Check if there's a persisted demo session
        const stored = localStorage.getItem('demo_user')
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as User
            if (mounted) {
              setUser(parsed)
            }
          } catch {
            localStorage.removeItem('demo_user')
          }
        }
        if (mounted) setIsLoading(false)
        return
      }

      // Real Supabase auth
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (mounted && existingSession) {
        setSession(existingSession)
        const profile = await loadUserProfile(
          existingSession.user.id,
          existingSession.user.email
        )
        if (mounted) setUser(profile)
      }
      if (mounted) setIsLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return
        setSession(newSession)
        if (newSession) {
          const profile = await loadUserProfile(newSession.user.id, newSession.user.email)
          setUser(profile)
        } else {
          setUser(null)
        }
      })

      return () => subscription.unsubscribe()
    }

    void initAuth()
    return () => { mounted = false }
  }, [loadUserProfile])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (IS_DEMO_MODE) {
      // Demo login: accept any of the mock user emails with any password
      const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (found && (password === 'demo123' || password.length >= 3)) {
        setUser(found)
        localStorage.setItem('demo_user', JSON.stringify(found))
        return {}
      }
      return { error: 'Email ou senha incorretos. Use um email de demonstração com senha "demo123".' }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: 'Email ou senha incorretos.' }
    }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    if (IS_DEMO_MODE) {
      setUser(null)
      localStorage.removeItem('demo_user')
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const hasPermission = useCallback((requiredRoles: UserRole[]): boolean => {
    if (!user) return false
    return requiredRoles.includes(user.role)
  }, [user])

  const role = user?.role ?? null
  const isAdmin = role === 'admin'
  const isOperator = role === 'operator' || role === 'admin'
  const isDriver = role === 'driver' || role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        role,
        isAdmin,
        isOperator,
        isDriver,
        signIn,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
