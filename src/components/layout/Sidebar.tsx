import { NavLink, useNavigate } from 'react-router-dom'
import {
  Truck,
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  Wrench,
  History,
  BarChart3,
  Settings,
  LogOut,
  Route,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn, getInitials } from '../../lib/utils'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  to: string
  roles?: string[]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Truck, label: 'Caminhões', to: '/trucks' },
  { icon: Users, label: 'Motoristas', to: '/drivers' },
  { icon: Route, label: 'Viagens', to: '/trips' },
  { icon: ClipboardList, label: 'Checklists', to: '/checklists' },
  { icon: AlertTriangle, label: 'Ocorrências', to: '/occurrences' },
  { icon: Wrench, label: 'Manutenção', to: '/maintenance' },
  { icon: History, label: 'Histórico', to: '/history' },
  { icon: BarChart3, label: 'Relatórios', to: '/reports', roles: ['admin'] },
  { icon: Settings, label: 'Configurações', to: '/settings', roles: ['admin'] },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(user?.role ?? '')
  })

  return (
    <aside className="flex h-full w-full flex-col bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white leading-tight">
            Shopping das Academias
          </p>
          <p className="truncate text-xs text-slate-400 leading-tight">
            Controle de Frota
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-2xs font-semibold uppercase tracking-widest text-slate-500">
          Principal
        </p>
        <ul className="space-y-0.5">
          {visibleItems.slice(0, 6).map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} />
          ))}
        </ul>

        <p className="mb-2 mt-5 px-2 text-2xs font-semibold uppercase tracking-widest text-slate-500">
          Gestão
        </p>
        <ul className="space-y-0.5">
          {visibleItems.slice(6).map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} />
          ))}
        </ul>
      </nav>

      {/* Footer — User info */}
      <div className="border-t border-slate-800 p-4">
        {isAdmin && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-600/10 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Administrador</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            {getInitials(user?.name ?? 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  item,
  onClose,
}: {
  item: NavItem
  onClose?: () => void
}) {
  const Icon = item.icon

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              )}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-2xs font-bold text-white">
                {item.badge}
              </span>
            ) : isActive ? (
              <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
            ) : null}
          </>
        )}
      </NavLink>
    </li>
  )
}
