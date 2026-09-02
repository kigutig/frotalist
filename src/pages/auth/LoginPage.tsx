import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Truck, Eye, EyeOff, Shield, AlertTriangle, CheckCircle2, UserPlus, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'

export function LoginPage() {
  const { signIn, signUp, isAuthenticated, isLoading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  
  // Login form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Register form states
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('operator')
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha o email e a senha.')
      return
    }
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    const result = await signIn(email, password)
    setIsSubmitting(false)
    if (result.error) setError(result.error)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setError('')
    setSuccess('')
    setIsSubmitting(true)

    const result = await signUp({ name, email, password, role })
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Cadastro realizado com sucesso! Conectando ao sistema...')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600/30 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left panel — branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2px, transparent 0)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/40">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            Shopping das
            <br />
            <span className="text-blue-400">Academias</span>
          </h1>
          <p className="mt-3 text-lg text-slate-400">Controle e Checklist de Frota</p>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: '🛡️', title: 'Segurança', desc: 'Checklist completo antes de cada saída' },
              { icon: '📍', title: 'Rastreabilidade', desc: 'Histórico completo de cada viagem' },
              { icon: '⚡', title: 'Agilidade', desc: 'Checklist rápido no celular ou tablet' },
              { icon: '📊', title: 'Gestão', desc: 'Relatórios e indicadores operacionais' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <span className="text-2xl">{f.icon}</span>
                <p className="mt-2 text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login / register form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="mb-6 flex flex-col items-center lg:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Shopping das Academias</h1>
          <p className="text-sm text-slate-400">Controle de Frota</p>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
            
            {/* Tabs toggle */}
            <div className="mb-6 flex rounded-xl bg-white/10 p-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Criar Conta
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {mode === 'login' ? 'Acessar Sistema' : 'Novo Cadastro'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'login'
                  ? 'Informe seu email e senha para continuar'
                  : 'Preencha os dados abaixo para criar sua conta'}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                <p className="text-sm text-green-300">{success}</p>
              </div>
            )}

            {mode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Entrando...
                    </span>
                  ) : (
                    'Entrar no Sistema'
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@shoppingacademias.com.br"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Função
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="operator">Operador / Logística</option>
                      <option value="admin">Administrador</option>
                      <option value="driver">Motorista</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Senha (mín. 6)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-white/15 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Cadastrando...
                    </span>
                  ) : (
                    'Criar Conta no Sistema'
                  )}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-slate-500">
              © 2026 Shopping das Academias — Controle de Frota v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
