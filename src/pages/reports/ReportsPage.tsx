import { useState, useEffect } from 'react'
import { Download, TrendingUp, AlertTriangle, Truck, ClipboardList, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { trucksApi, checklistsApi, occurrencesApi, tripsApi } from '../../lib/api'
import type { Truck as TruckType, Checklist, Occurrence, Trip } from '../../types'

const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#eab308', '#8b5cf6', '#ef4444']

export function ReportsPage() {
  const [period, setPeriod] = useState('30')
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      setLoading(true)
      const [tData, cData, oData, trData] = await Promise.all([
        trucksApi.getAll(),
        checklistsApi.getAll(),
        occurrencesApi.getAll(),
        tripsApi.getAll(),
      ])
      setTrucks(tData)
      setChecklists(cData)
      setOccurrences(oData)
      setTrips(trData)
      setLoading(false)
    }
    void loadReports()
  }, [])

  const rejectedChecklists = checklists.filter((c) => c.status === 'rejected')
  const openOccurrences = occurrences.filter((o) => o.status === 'open')

  // Group occurrences by severity
  const severityCounts: Record<string, number> = {}
  occurrences.forEach((occ) => {
    const sev = occ.severity || 'low'
    severityCounts[sev] = (severityCounts[sev] || 0) + 1
  })

  const pieData = Object.entries(severityCounts).map(([category, count]) => ({
    category,
    count,
  }))

  // Occurrences by truck
  const occurrencesByTruck = trucks.slice(0, 5).map((t) => ({
    truck: t.internal_code,
    count: occurrences.filter((o) => o.truck_id === t.id).length,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-sm text-slate-500">Análises e indicadores operacionais da frota em tempo real</p>
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
          <Button variant="outline" leftIcon={Download} onClick={() => window.print()}>
            Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Checklists Realizados', value: checklists.length.toString(), icon: ClipboardList, color: 'bg-blue-100 text-blue-600' },
          { label: 'Checklists Reprovados', value: rejectedChecklists.length.toString(), icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
          { label: 'Ocorrências Abertas', value: openOccurrences.length.toString(), icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' },
          { label: 'Viagens Registradas', value: trips.length.toString(), icon: Truck, color: 'bg-green-100 text-green-600' },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : kpi.value}
              </p>
              <p className="text-xs text-slate-500">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-slate-800">Ocorrências por Gravidade</h3>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col items-center">
            {pieData.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Nenhuma ocorrência registrada na frota
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="category">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-1.5 mt-2">
                  {pieData.map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-slate-600 capitalize">{c.category}</span>
                      </span>
                      <span className="font-semibold text-slate-800">{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-800">Ocorrências por Veículo</h3>
            </div>
          </CardHeader>
          <CardBody>
            {occurrencesByTruck.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Nenhum veículo com ocorrências cadastradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={occurrencesByTruck} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="truck" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" name="Ocorrências" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
