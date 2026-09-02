import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  Route,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Activity,
  TrendingUp,
  Wrench,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { StatCard, Card, CardHeader, CardBody, Badge, Button } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import {
  MOCK_DASHBOARD_STATS,
  MOCK_RECENT_ACTIVITIES,
  MOCK_CHECKLISTS_BY_DAY,
  MOCK_OCCURRENCES_BY_CATEGORY,
  MOCK_TRUCKS,
} from '../../lib/mock-data'
import {
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_COLORS,
  formatDateTime,
  formatDate,
} from '../../lib/utils'
import type { TruckStatus } from '../../types'

const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#eab308', '#8b5cf6']

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const stats = MOCK_DASHBOARD_STATS
  const activities = MOCK_RECENT_ACTIVITIES

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => navigate('/checklists/new')}
        >
          Novo Checklist
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Disponíveis"
          value={stats.trucks_available}
          icon={Truck}
          color="green"
          onClick={() => navigate('/trucks?status=available')}
        />
        <StatCard
          title="Em Rota"
          value={stats.trucks_in_route}
          icon={Route}
          color="blue"
          onClick={() => navigate('/trips?status=in_route')}
        />
        <StatCard
          title="Em Manutenção"
          value={stats.trucks_maintenance}
          icon={Wrench}
          color="yellow"
          onClick={() => navigate('/maintenance')}
        />
        <StatCard
          title="Bloqueados"
          value={stats.trucks_blocked}
          icon={XCircle}
          color="red"
          onClick={() => navigate('/trucks?status=blocked')}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Saídas Hoje"
          value={stats.checklists_today_departure}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Retornos Hoje"
          value={stats.checklists_today_return}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Ocorrências Abertas"
          value={stats.open_occurrences}
          icon={AlertTriangle}
          color="yellow"
          onClick={() => navigate('/occurrences')}
        />
        <StatCard
          title="Críticas"
          value={stats.critical_occurrences}
          icon={AlertTriangle}
          color="red"
          onClick={() => navigate('/occurrences?severity=critical')}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Checklists by day chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800">Checklists por Dia</h3>
              </div>
              <span className="text-xs text-slate-500">Últimos 7 dias</span>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_CHECKLISTS_BY_DAY} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="departure" name="Saída" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="return" name="Retorno" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-500">Saída</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-slate-500">Retorno</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Occurrences by category chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-slate-800">Ocorrências por Categoria</h3>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={MOCK_OCCURRENCES_BY_CATEGORY}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="category"
                >
                  {MOCK_OCCURRENCES_BY_CATEGORY.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1">
              {MOCK_OCCURRENCES_BY_CATEGORY.map((c, i) => (
                <li key={c.category} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-600">{c.category}</span>
                  </span>
                  <span className="font-medium text-slate-800">{c.count}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Fleet Status + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Fleet Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Status da Frota</h3>
              <Button variant="ghost" size="sm" rightIcon={ArrowRight} onClick={() => navigate('/trucks')}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100">
              {MOCK_TRUCKS.slice(0, 6).map((truck) => {
                const status = truck.status as TruckStatus
                const colors = TRUCK_STATUS_COLORS[status]
                return (
                  <li
                    key={truck.id}
                    className="flex cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                    onClick={() => navigate(`/trucks/${truck.id}`)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{truck.internal_code}</p>
                      <p className="truncate text-xs text-slate-500">
                        {truck.plate} · {truck.brand} {truck.model}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${colors.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      {TRUCK_STATUS_LABELS[status]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <h3 className="font-semibold text-slate-800">Atividades Recentes</h3>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100">
              {activities.map((activity) => {
                const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                  checklist_departure: ClipboardList,
                  checklist_return: CheckCircle2,
                  occurrence_created: AlertTriangle,
                  maintenance_scheduled: Wrench,
                  truck_status_changed: XCircle,
                  trip_released: Route,
                }
                const colorMap: Record<string, string> = {
                  checklist_departure: 'bg-blue-100 text-blue-600',
                  checklist_return: 'bg-green-100 text-green-600',
                  occurrence_created: 'bg-orange-100 text-orange-600',
                  maintenance_scheduled: 'bg-yellow-100 text-yellow-600',
                  truck_status_changed: 'bg-red-100 text-red-600',
                  trip_released: 'bg-indigo-100 text-indigo-600',
                }
                const Icon = iconMap[activity.type] ?? ClipboardList
                const colorClass = colorMap[activity.type] ?? 'bg-slate-100 text-slate-600'

                return (
                  <li key={activity.id} className="flex items-start gap-3 px-5 py-4">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">{activity.description}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {activity.user_name} · {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
