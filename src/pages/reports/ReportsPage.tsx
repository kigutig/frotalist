import { useState } from 'react'
import { BarChart3, Download, TrendingUp, AlertTriangle, Truck, ClipboardList } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import {
  MOCK_CHECKLISTS_BY_DAY, MOCK_OCCURRENCES_BY_CATEGORY,
  MOCK_TRUCKS, MOCK_OCCURRENCES,
} from '../../lib/mock-data'

const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#eab308', '#8b5cf6']

const MILEAGE_DATA = [
  { month: 'Abr', km: 14200 },
  { month: 'Mai', km: 18500 },
  { month: 'Jun', km: 16800 },
  { month: 'Jul', km: 21300 },
  { month: 'Ago', km: 19700 },
  { month: 'Set', km: 8400 },
]

const OCCURRENCES_BY_TRUCK = MOCK_TRUCKS.slice(0, 5).map((t) => ({
  truck: t.internal_code,
  count: MOCK_OCCURRENCES.filter((o) => o.truck_id === t.id).length,
}))

export function ReportsPage() {
  const [period, setPeriod] = useState('30')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-sm text-slate-500">Análises e indicadores operacionais da frota</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <Button variant="outline" leftIcon={Download}>
            Exportar PDF
          </Button>
          <Button variant="outline" leftIcon={Download}>
            Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Checklists Realizados', value: '47', icon: ClipboardList, color: 'bg-blue-100 text-blue-600' },
          { label: 'Checklists Reprovados', value: '3', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
          { label: 'Ocorrências Abertas', value: '8', icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' },
          { label: 'Km Total', value: '8.4k', icon: Truck, color: 'bg-green-100 text-green-600' },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-800">Checklists por Dia</h3>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MOCK_CHECKLISTS_BY_DAY} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="departure" name="Saída" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="return" name="Retorno" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-slate-800">Quilometragem Mensal</h3>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MILEAGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="km" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} name="KM" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-slate-800">Ocorrências por Categoria</h3>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={MOCK_OCCURRENCES_BY_CATEGORY} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="category">
                  {MOCK_OCCURRENCES_BY_CATEGORY.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-2">
              {MOCK_OCCURRENCES_BY_CATEGORY.map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-slate-600">{c.category}</span>
                  </span>
                  <span className="font-semibold text-slate-800">{c.count} ({c.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800">Ocorrências por Caminhão</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={OCCURRENCES_BY_TRUCK} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="truck" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="Ocorrências" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
