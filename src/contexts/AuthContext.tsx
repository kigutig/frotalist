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
  signUp: (data: { name: string; email: string; password: string }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasPermission: (requiredRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Função auxiliar para mapear o usuário autenticado para o formato User do app
  const buildUserProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: any }): Promise<User> => {
    const emailLower = (authUser.email || '').trim().toLowerCase()
    const isMainAdmin = emailLower === 'kigutifenix@gmail.com'
    const role: UserRole = isMainAdmin ? 'admin' : (authUser.user_metadata?.role || 'operator')
    const name: string = authUser.user_metadata?.name || (emailLower ? emailLower.split('@')[0] : 'Usuário')

    // Tenta buscar da tabela public.users
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!error && data) {
        const profile = data as User
        if (isMainAdmin && profile.role !== 'admin') {
          profile.role = 'admin'
        }
        return profile
      }
    } catch (e) {
      console.warn('Erro ao ler public.users:', e)
    }

    // Se não existir na tabela public.users, cria o registro no banco agora
    const profile: User = {
      id: authUser.id,
      name,
      email: authUser.email || '',
      role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      await supabase.from('users').upsert(profile)
    } catch (e) {
      console.warn('Erro ao inserir em public.users:', e)
    }

    return profile
  }, [])

  // Inicialização e escuta da sessão real do Supabase
  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Erro getSession:', error.message)
        }

        if (mounted && currentSession?.user) {
          setSession(currentSession)
          const profile = await buildUserProfile(currentSession.user)
          if (mounted) setUser(profile)
        } else {
          // Verifica se havia uma sessão ativa persistida
          const savedSession = localStorage.getItem('auth_session_user')
          if (savedSession && mounted) {
            try {
              const parsed = JSON.parse(savedSession)
              setUser(parsed)
            } catch {}
          }
        }
      } catch (err) {
        console.error('Falha ao inicializar autenticação:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void initSession()

    // Escuta mudanças de auth (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)

      if (newSession?.user) {
        const profile = await buildUserProfile(newSession.user)
        if (mounted) setUser(profile)
      } else {
        if (mounted) setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [buildUserProfile])

  // LOGIN NO SISTEMA
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase()
    const isMainAdmin = cleanEmail === 'kigutifenix@gmail.com'

    // 1. Tenta autenticar pelo Supabase Auth oficial
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (!error && data?.user && data?.session) {
        setSession(data.session)
        const profile = await buildUserProfile(data.user)
        setUser(profile)
        localStorage.setItem('auth_session_user', JSON.stringify(profile))
        return {}
      }

      // Se der erro no Supabase, mas for o Administrador Principal
      if (isMainAdmin) {
        // Gera o hash SHA-256 da senha para nunca armazenar credenciais em texto claro (CWE-312)
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        // Remove chave legada em texto claro se existir
        localStorage.removeItem('admin_pwd')

        const savedAdminHash = localStorage.getItem('admin_pwd_hash')
        if (!savedAdminHash || savedAdminHash === hashHex) {
          // Grava apenas o hash seguro
          localStorage.setItem('admin_pwd_hash', hashHex)

          const adminProfile: User = {
            id: 'admin_kiguti',
            name: 'Administrador Geral',
            email: 'kigutifenix@gmail.com',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          setUser(adminProfile)
          localStorage.setItem('auth_session_user', JSON.stringify(adminProfile))
          return {}
        } else {
          return { error: 'Senha incorreta para o administrador kigutifenix@gmail.com.' }
        }
      }

      if (error) {
        return { error: error.message }
      }
    } catch (err: unknown) {
      if (isMainAdmin) {
        const adminProfile: User = {
          id: 'admin_kiguti',
          name: 'Administrador Geral',
          email: 'kigutifenix@gmail.com',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setUser(adminProfile)
        localStorage.setItem('auth_session_user', JSON.stringify(adminProfile))
        return {}
      }
      return { error: err instanceof Error ? err.message : 'Erro ao realizar login' }
    }

    return { error: 'Não foi possível autenticar. Verifique seus dados.' }
  }, [buildUserProfile])

  // CADASTRO REAL NO SUPABASE
  const signUp = useCallback(async ({
    name,
    email,
    password,
  }: {
    name: string
    email: string
    password: string
  }): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase()
    const isMainAdmin = cleanEmail === 'kigutifenix@gmail.com'
    const role: UserRole = isMainAdmin ? 'admin' : 'operator'

    // 1. Cria o usuário diretamente no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (error) {
      console.error('Supabase signUp error:', error)
      if (error.message.includes('User already registered')) {
        return { error: 'Este email já está cadastrado. Tente entrar na aba "Entrar" ou redefinir a senha.' }
      }
      return { error: error.message }
    }

    if (!data.user) {
      return { error: 'Falha ao criar usuário no Supabase. Tente novamente.' }
    }

    // 2. Se o Supabase retornou o usuário criado, grava na tabela public.users
    try {
      await supabase.from('users').upsert({
        id: data.user.id,
        name,
        email: cleanEmail,
        role,
        status: 'active',
      })
    } catch (e) {
      console.warn('Erro ao inserir em public.users no cadastro:', e)
    }

    // 3. Se o Supabase não retornou sessão imediata (por exemplo, aguardando confirmação de email)
    if (!data.session) {
      // Tenta logar imediatamente com as credenciais cadastradas
      const loginResult = await signIn(cleanEmail, password)
      if (loginResult.error) {
        return {
          error: 'Conta criada no Supabase! Porém o Supabase exige confirmação de email: ' + loginResult.error,
        }
      }
      return {}
    }

    // Se já retornou sessão, atualiza o estado
    setSession(data.session)
    const profile = await buildUserProfile(data.user)
    setUser(profile)

    return {}
  }, [buildUserProfile, signIn])

  // LOGOUT
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Erro signOut:', e)
    }
    localStorage.removeItem('auth_session_user')
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
