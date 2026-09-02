import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  Edit2,
  ClipboardList,
  AlertTriangle,
  History,
  Wrench,
  MapPin,
  Calendar,
  Gauge,
  Package,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Badge } from '../../components/ui'
import { MOCK_TRUCKS, MOCK_TRIPS, MOCK_OCCURRENCES, MOCK_MAINTENANCE } from '../../lib/mock-data'
import {
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_COLORS,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_COLORS,
  formatMileage,
  formatDateTime,
  cn,
} from '../../lib/utils'
import type { TruckStatus, OccurrenceSeverity } from '../../types'

export function TruckDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const truck = MOCK_TRUCKS.find((t) => t.id === id)

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
  const colors = TRUCK_STATUS_COLORS[status]
  const truckTrips = MOCK_TRIPS.filter((t) => t.truck_id === id)
  const truckOccurrences = MOCK_OCCURRENCES.filter((o) => o.truck_id === id)
  const truckMaintenance = MOCK_MAINTENANCE.filter((m) => m.truck_id === id)

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
              <Button variant="primary" leftIcon={Edit2}>
                Editar
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
                { label: 'Placa', value: truck.plate, icon: Truck },
                { label: 'Marca / Modelo', value: `${truck.brand} ${truck.model}`, icon: Truck },
                { label: 'Tipo', value: truck.type, icon: Package },
                { label: 'Capacidade', value: truck.capacity ?? '—', icon: Package },
                { label: 'Ano', value: truck.year.toString(), icon: Calendar },
                { label: 'Quilometragem', value: formatMileage(truck.mileage), icon: Gauge },
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
            <CardBody className="grid grid-cols-2 gap-3">
              {[
                { label: 'Viagens', value: truckTrips.length, color: 'blue' },
                { label: 'Ocorrências', value: truckOccurrences.length, color: 'orange' },
                { label: 'Manutenções', value: truckMaintenance.length, color: 'yellow' },
                { label: 'Checklists', value: truckTrips.length * 2, color: 'green' },
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Ocorrências</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/occurrences?truck=${truck.id}`)}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {truckOccurrences.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Nenhuma ocorrência registrada</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {truckOccurrences.map((occ) => {
                    const sev = occ.severity as OccurrenceSeverity
                    const sevColors = OCCURRENCE_SEVERITY_COLORS[sev]
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Histórico de Viagens</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/trips?truck=${truck.id}`)}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {truckTrips.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Nenhuma viagem registrada</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {truckTrips.map((trip) => (
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Manutenções</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/maintenance?truck=${truck.id}`)}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {truckMaintenance.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Nenhuma manutenção registrada</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {truckMaintenance.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 px-5 py-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                        <Wrench className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">{m.description}</p>
                        <p className="text-xs text-slate-400">{m.date} · {m.workshop}</p>
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
