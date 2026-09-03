import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Route,
  Loader2,
  MapPin,
  ArrowRight,
  User,
  Truck,
  Calendar,
  Gauge,
  Package,
  Clock,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { tripsApi } from '../../lib/api'
import {
  TRIP_STATUS_LABELS,
  TRIP_STATUS_COLORS,
  formatDate,
  formatDateTime,
  formatMileage,
  cn,
} from '../../lib/utils'
import type { Trip, TripStatus } from '../../types'

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      // tripsApi.getAll returns trips with truck and driver joined
      const allTrips = await tripsApi.getAll()
      const found = allTrips.find((t) => t.id === id) ?? null
      setTrip(found)
      setLoading(false)
    }
    void loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando dados da viagem...</span>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Route className="mb-4 h-16 w-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Viagem não encontrada</h3>
        <Button variant="outline" leftIcon={ArrowLeft} className="mt-4" onClick={() => navigate('/trips')}>
          Voltar à lista
        </Button>
      </div>
    )
  }

  const status = trip.status as TripStatus
  const statusColorClass = TRIP_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200'

  const distance =
    trip.return_mileage && trip.departure_mileage
      ? trip.return_mileage - trip.departure_mileage
      : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/trips')}
          className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                  <Route className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-800">
                      Viagem — {trip.truck?.internal_code ?? '—'}
                    </h2>
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                        statusColorClass
                      )}
                    >
                      {TRIP_STATUS_LABELS[status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.origin ?? 'Origem'}
                    <ArrowRight className="h-3.5 w-3.5" />
                    {trip.destination}
                  </p>
                </div>
              </div>
            </div>
            {trip.status === 'in_route' && (
              <Button
                variant="primary"
                onClick={() => navigate(`/trips/${trip.id}/return`)}
              >
                Registrar Retorno
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Dados da viagem */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Dados da Viagem</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', statusColorClass)}>
                  {TRIP_STATUS_LABELS[status]}
                </span>
              </div>
              {[
                { label: 'Saída', value: formatDateTime(trip.departure_at) },
                { label: 'Retorno', value: trip.return_at ? formatDateTime(trip.return_at) : '—' },
                { label: 'Prev. retorno', value: trip.estimated_return ? formatDate(trip.estimated_return) : '—' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
              {trip.notes && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Observações</p>
                  <p className="mt-1 text-sm text-slate-700">{trip.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* KM */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Quilometragem</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {[
                { label: 'KM Saída', value: formatMileage(trip.departure_mileage) },
                { label: 'KM Retorno', value: formatMileage(trip.return_mileage) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-mono font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
              {distance !== null && (
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                  <span className="text-sm font-medium text-indigo-700">Distância percorrida</span>
                  <span className="text-sm font-bold font-mono text-indigo-800">
                    {distance.toLocaleString('pt-BR')} km
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Entregas */}
          {(trip.deliveries_completed != null || trip.deliveries_pending != null) && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-800">Entregas</h3>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Realizadas', value: trip.deliveries_completed ?? 0, color: 'bg-green-50 text-green-800' },
                  { label: 'Pendentes', value: trip.deliveries_pending ?? 0, color: 'bg-yellow-50 text-yellow-800' },
                ].map((s) => (
                  <div key={s.label} className={cn('rounded-xl p-3 text-center', s.color)}>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
                {trip.pending_reason && (
                  <div className="col-span-2 rounded-lg bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-700 font-medium">Motivo das pendências:</p>
                    <p className="mt-1 text-sm text-yellow-800">{trip.pending_reason}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Rota */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Rota</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 mb-1">Origem</p>
                  <p className="text-sm font-semibold text-slate-800">{trip.origin ?? '—'}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <ArrowRight className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 mb-1">Destino</p>
                  <p className="text-sm font-semibold text-slate-800">{trip.destination}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Motorista */}
          {trip.driver && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-800">Motorista</h3>
              </CardHeader>
              <CardBody>
                <div
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/drivers/${trip.driver_id}`)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-700">
                    {trip.driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{trip.driver.name}</p>
                    <p className="text-xs text-slate-500">
                      CNH {trip.driver.cnh} · Categoria {trip.driver.cnh_category}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Caminhão */}
          {trip.truck && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-800">Veículo</h3>
              </CardHeader>
              <CardBody>
                <div
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/trucks/${trip.truck_id}`)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{trip.truck.internal_code}</p>
                    <p className="text-xs text-slate-500">
                      {trip.truck.plate} · {trip.truck.brand} {trip.truck.model} · {trip.truck.year}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Checklists vinculados */}
          {(trip.departure_checklist_id || trip.return_checklist_id) && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-800">Checklists</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {trip.departure_checklist_id && (
                  <div
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/checklists/${trip.departure_checklist_id}`)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <ClipboardList className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">Checklist de Saída</p>
                      <p className="text-xs text-slate-400">Clique para ver detalhes</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                {trip.return_checklist_id && (
                  <div
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/checklists/${trip.return_checklist_id}`)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <ClipboardList className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">Checklist de Retorno</p>
                      <p className="text-xs text-slate-400">Clique para ver detalhes</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
