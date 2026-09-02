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
  signUp: (data: { name: string; email: string; password: string; role?: UserRole }) => Promise<{ error?: string }>
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

  // Load user profile from DB or fallback to auth metadata
  const loadUserProfile = useCallback(async (userId: string, userEmail?: string, userMetadata?: any): Promise<User> => {
    const emailLower = (userEmail || '').trim().toLowerCase()
    const isAdminUser = emailLower === 'kigutifenix@gmail.com'
    const fallbackName = userMetadata?.name || (emailLower ? emailLower.split('@')[0] : 'Usuário')
    const fallbackRole: UserRole = isAdminUser ? 'admin' : (userMetadata?.role || 'operator')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) {
        const profile = data as User
        if (isAdminUser) {
          profile.role = 'admin'
        }
        return profile
      }

      // Se não existir na tabela public.users, cria automaticamente
      const newProfile: User = {
        id: userId,
        name: fallbackName,
        email: userEmail || '',
        role: fallbackRole,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Tenta persistir na tabela se ela existir
      try {
        await supabase.from('users').upsert(newProfile)
      } catch (upsertErr) {
        console.warn('Nota: tabela users ainda não criada no Supabase:', upsertErr)
      }

      return newProfile
    } catch {
      return {
        id: userId,
        name: fallbackName,
        email: userEmail || '',
        role: fallbackRole,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      // Limpa qualquer dado demo salvo anteriormente
      localStorage.removeItem('demo_user')
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
          existingSession.user.email,
          existingSession.user.user_metadata
        )
        if (mounted) setUser(profile)
      }
      if (mounted) setIsLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return
        setSession(newSession)
        if (newSession) {
          const profile = await loadUserProfile(
            newSession.user.id,
            newSession.user.email,
            newSession.user.user_metadata
          )
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email ou senha incorretos. Caso ainda não tenha conta, cadastre-se na aba "Criar Conta".' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Email não confirmado. Verifique a confirmação no painel do Supabase.' }
        }
        return { error: error.message }
      }

      if (data?.user) {
        setSession(data.session)
        const profile = await loadUserProfile(
          data.user.id,
          data.user.email,
          data.user.user_metadata
        )
        setUser(profile)
      }

      return {}
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Erro ao realizar login' }
    }
  }, [loadUserProfile])

  const signUp = useCallback(async ({
    name,
    email,
    password,
  }: {
    name: string
    email: string
    password: string
    role?: UserRole
  }): Promise<{ error?: string }> => {
    // kigutifenix@gmail.com é sempre administrador. Demais usuários são operadores por padrão.
    const assignedRole: UserRole =
      email.trim().toLowerCase() === 'kigutifenix@gmail.com' ? 'admin' : 'operator'

    if (IS_DEMO_MODE) {
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name,
        email,
        role: assignedRole,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUser(newUser)
      localStorage.setItem('demo_user', JSON.stringify(newUser))
      return {}
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: assignedRole,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Create user profile in public.users table
        const { error: profileError } = await supabase.from('users').upsert({
          id: data.user.id,
          name,
          email,
          role: assignedRole,
          status: 'active',
        })

        if (profileError) {
          console.warn('Perfil pendente de autorização no DB:', profileError.message)
        }
      }

      return {}
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Erro ao cadastrar usuário' }
    }
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
        signUp,
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
