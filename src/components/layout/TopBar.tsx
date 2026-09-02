import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell,
  Menu,
  X,
  AlertTriangle,
  Truck,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Sidebar } from './Sidebar'
import { cn, getInitials } from '../../lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/trucks': 'Caminhões',
  '/trucks/new': 'Novo Caminhão',
  '/drivers': 'Motoristas',
  '/drivers/new': 'Novo Motorista',
  '/trips': 'Viagens',
  '/trips/new': 'Nova Viagem',
  '/checklists': 'Checklists',
  '/checklists/new': 'Novo Checklist',
  '/occurrences': 'Ocorrências',
  '/maintenance': 'Manutenção',
  '/history': 'Histórico',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const base = '/' + pathname.split('/')[1]
  return PAGE_TITLES[base] ?? 'Frota'
}

// Mock notifications for demo
const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'CNH próxima do vencimento', message: 'Pedro Santos — vence em 48 dias', type: 'warning' as const },
  { id: '2', title: 'Ocorrência crítica aberta', message: 'TRK-005 — Documentação irregular', type: 'critical' as const },
  { id: '3', title: 'Checklist de retorno pendente', message: 'TRK-001 está em rota desde 07:30', type: 'info' as const },
]

export function TopBar() {
  const { user } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const pageTitle = getPageTitle(location.pathname)

  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title */}
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600 lg:hidden" />
          <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="font-semibold text-slate-800">Notificações</p>
                    <p className="text-xs text-slate-500">{MOCK_NOTIFICATIONS.length} pendentes</p>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {MOCK_NOTIFICATIONS.map((n) => (
                      <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            n.type === 'critical' && 'bg-red-100 text-red-600',
                            n.type === 'warning' && 'bg-yellow-100 text-yellow-600',
                            n.type === 'info' && 'bg-blue-100 text-blue-600'
                          )}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {getInitials(user?.name ?? 'U')}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name}</p>
              <p className="text-xs capitalize text-slate-500 leading-tight">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'operator' ? 'Operador' : 'Motorista'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
            <div className="relative flex h-full flex-col">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-800"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </aside>
        </>
      )}
    </>
  )
}
