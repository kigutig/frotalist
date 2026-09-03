import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  ClipboardList,
  AlertTriangle,
  Route,
  Plus,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { trucksApi, tripsApi, occurrencesApi, checklistsApi } from '../../lib/api'
import {
  TRIP_STATUS_LABELS,
  TRIP_STATUS_COLORS,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_COLORS,
  formatDateTime,
  formatMileage,
  cn,
} from '../../lib/utils'
import type { Truck as TruckType, Trip, Occurrence, Checklist } from '../../types'

export function DashboardPage() {
  const navigate = useNavigate()
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      const [tData, trData, oData, cData] = await Promise.all([
        trucksApi.getAll(),
        tripsApi.getAll(),
        occurrencesApi.getAll(),
        checklistsApi.getAll(),
      ])
      setTrucks(tData)
      setTrips(trData)
      setOccurrences(oData)
      setChecklists(cData)
      setLoading(false)
    }
    void loadDashboard()
  }, [])

  // KPI Calculations
  const availableCount = trucks.filter((t) => t.status === 'available').length
  const inRouteCount = trucks.filter((t) => t.status === 'in_route').length
  const maintenanceCount = trucks.filter((t) => t.status === 'maintenance').length

  const openOccurrences = occurrences.filter((o) => o.status === 'open')
  const completedChecklists = checklists.filter((c) => c.status === 'released' || c.status === 'completed')

  const kpis = [
    {
      title: 'Total de Caminhões',
      value: trucks.length.toString(),
      icon: Truck,
      color: 'bg-blue-500/10 text-blue-600',
      description: `${availableCount} disponíveis · ${inRouteCount} em rota`,
    },
    {
      title: 'Checklists Concluídos',
      value: completedChecklists.length.toString(),
      icon: ClipboardList,
      color: 'bg-green-500/10 text-green-600',
      description: `${checklists.length} realizados no total`,
    },
    {
      title: 'Viagens em Rota',
      value: inRouteCount.toString(),
      icon: Route,
      color: 'bg-indigo-500/10 text-indigo-600',
      description: 'Entregas em andamento',
    },
    {
      title: 'Ocorrências Abertas',
      value: openOccurrences.length.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600',
      description: `${maintenanceCount} em manutenção`,
    },
  ]

  const activeTrips = trips.filter((t) => t.status === 'in_route' || t.status === 'released')

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Sistema Operacional Ativo
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold">Shopping das Academias</h1>
            <p className="text-sm text-slate-400">
              Controle de frota, saída e retorno de caminhões em tempo real.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => navigate('/checklists/new')}
            >
              Novo Checklist
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="transition-all hover:shadow-md">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpi.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-slate-800">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin inline text-slate-400" /> : kpi.value}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">{kpi.description}</p>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — Active Trips & Trucks */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Trips */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-800">Viagens em Andamento</h3>
                </div>
                <Button variant="ghost" size="sm" rightIcon={ArrowRight} onClick={() => navigate('/trips')}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {activeTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <Route className="mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium">Nenhuma viagem em andamento no momento</p>
                  <p className="text-xs text-slate-400 mt-1">Inicie um novo checklist de saída para registrar uma viagem.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activeTrips.map((trip) => (
                    <li key={trip.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {trip.truck?.internal_code} — {trip.truck?.plate}
                          </p>
                          <p className="text-xs text-slate-500">
                            {trip.driver?.name} · Destino: {trip.destination}
                          </p>
                        </div>
                      </div>
                      <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', TRIP_STATUS_COLORS[trip.status])}>
                        {TRIP_STATUS_LABELS[trip.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Trucks Status Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-slate-700" />
                  <h3 className="font-semibold text-slate-800">Status dos Caminhões</h3>
                </div>
                <Button variant="ghost" size="sm" rightIcon={ArrowRight} onClick={() => navigate('/trucks')}>
                  Gerenciar
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {trucks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">Nenhum caminhão cadastrado na base.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/trucks')}>
                    Cadastrar Caminhões
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {trucks.slice(0, 6).map((truck) => (
                    <div
                      key={truck.id}
                      onClick={() => navigate(`/trucks/${truck.id}`)}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-blue-300 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{truck.internal_code}</span>
                        <span className={cn('h-2 w-2 rounded-full', 
                          truck.status === 'available' ? 'bg-green-500' :
                          truck.status === 'in_route' ? 'bg-blue-500' :
                          truck.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{truck.plate}</p>
                      <p className="text-xs font-medium text-slate-700 mt-2">{formatMileage(truck.mileage)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column — Recent Occurrences & Quick Actions */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Ações Rápidas</h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <Button
                variant="primary"
                className="w-full justify-start"
                leftIcon={ClipboardList}
                onClick={() => navigate('/checklists/new')}
              >
                Novo Checklist de Saída
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                leftIcon={Truck}
                onClick={() => navigate('/trucks')}
              >
                Cadastrar Caminhão
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                leftIcon={AlertTriangle}
                onClick={() => navigate('/occurrences')}
              >
                Ver Ocorrências
              </Button>
            </CardBody>
          </Card>

          {/* Recent Occurrences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-slate-800">Ocorrências Recentes</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/occurrences')}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {occurrences.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhuma ocorrência registrada
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {occurrences.slice(0, 4).map((occ) => {
                    const sevColors = OCCURRENCE_SEVERITY_COLORS[occ.severity] || { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' }
                    return (
                      <li key={occ.id} className="p-4">
                        <div className="flex items-start gap-2">
                          <span className={cn('mt-0.5 rounded px-1.5 py-0.5 text-2xs font-semibold', sevColors.badge)}>
                            {OCCURRENCE_SEVERITY_LABELS[occ.severity]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800">
                              {occ.truck?.internal_code || 'Veículo'}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                              {occ.description}
                            </p>
                            <p className="text-2xs text-slate-400 mt-1">
                              {formatDateTime(occ.created_at)}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
