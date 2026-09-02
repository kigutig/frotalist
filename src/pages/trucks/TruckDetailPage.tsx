import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  Edit2,
  ClipboardList,
  Wrench,
  MapPin,
  Calendar,
  Gauge,
  Package,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { trucksApi, tripsApi, occurrencesApi, maintenanceApi } from '../../lib/api'
import {
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_COLORS,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_COLORS,
  formatMileage,
  formatDateTime,
  cn,
} from '../../lib/utils'
import type { Truck as TruckType, TruckStatus, OccurrenceSeverity, Trip, Occurrence, Maintenance } from '../../types'

export function TruckDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [truck, setTruck] = useState<TruckType | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      const [tData, allTrips, allOccs, allMaint] = await Promise.all([
        trucksApi.getById(id),
        tripsApi.getAll(),
        occurrencesApi.getAll(),
        maintenanceApi.getAll(),
      ])
      setTruck(tData)
      setTrips(allTrips.filter((tr) => tr.truck_id === id))
      setOccurrences(allOccs.filter((o) => o.truck_id === id))
      setMaintenance(allMaint.filter((m) => m.truck_id === id))
      setLoading(false)
    }
    void loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando dados do veículo...</span>
      </div>
    )
  }

  if (!truck) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Truck className="mb-4 h-16 w-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Caminhão não encontrado</h3>
        <Button variant="outline" leftIcon={ArrowLeft} className="mt-4" onClick={() => navigate('/trucks')}>
          Voltar à lista
        </Button>
      </div>
    )
  }

  const status = truck.status as TruckStatus
  const colors = TRUCK_STATUS_COLORS[status] || { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/trucks')}
          className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">{truck.internal_code}</h2>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                        colors.badge
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                      {TRUCK_STATUS_LABELS[status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {truck.plate} · {truck.brand} {truck.model} · {truck.year}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" leftIcon={ClipboardList} onClick={() => navigate(`/checklists/new?truck=${truck.id}`)}>
                Novo Checklist
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Dados do Veículo</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {[
                { label: 'Placa', value: truck.plate },
                { label: 'Marca / Modelo', value: `${truck.brand} ${truck.model}` },
                { label: 'Tipo', value: truck.type },
                { label: 'Capacidade', value: truck.capacity ?? '—' },
                { label: 'Ano', value: truck.year.toString() },
                { label: 'Quilometragem', value: formatMileage(truck.mileage) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
              {truck.notes && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Observações</p>
                  <p className="mt-1 text-sm text-slate-700">{truck.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Resumo</h3>
            </CardHeader>
            <CardBody className="grid grid-cols-3 gap-3">
              {[
                { label: 'Viagens', value: trips.length },
                { label: 'Ocorrências', value: occurrences.length },
                { label: 'Manutenções', value: maintenance.length },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Occurrences */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Ocorrências</h3>
            </CardHeader>
            <CardBody className="p-0">
              {occurrences.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Nenhuma ocorrência registrada</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {occurrences.map((occ) => {
                    const sev = occ.severity as OccurrenceSeverity
                    const sevColors = OCCURRENCE_SEVERITY_COLORS[sev] || { badge: 'bg-slate-100 text-slate-700' }
                    return (
                      <li key={occ.id} className="flex items-start gap-3 px-5 py-4">
                        <span
                          className={cn(
                            'mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                            sevColors.badge
                          )}
                        >
                          {OCCURRENCE_SEVERITY_LABELS[sev]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700">{occ.description}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(occ.created_at)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Trip history */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Histórico de Viagens</h3>
            </CardHeader>
            <CardBody className="p-0">
              {trips.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Nenhuma viagem registrada</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {trips.map((trip) => (
                    <li
                      key={trip.id}
                      className="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-slate-50"
                      onClick={() => navigate(`/trips/${trip.id}`)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">
                          {trip.origin} → {trip.destination}
                        </p>
                        <p className="text-xs text-slate-400">
                          {trip.driver?.name ?? 'Motorista'} · {formatDateTime(trip.departure_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Manutenções</h3>
            </CardHeader>
            <CardBody className="p-0">
              {maintenance.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Nenhuma manutenção registrada</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {maintenance.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 px-5 py-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                        <Wrench className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">{m.description}</p>
                        <p className="text-xs text-slate-400">{m.date} · {m.workshop || 'Oficina'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
