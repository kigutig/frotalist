import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Phone,
  FileText,
  Calendar,
  MapPin,
  Edit2,
  Loader2,
  Route,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { driversApi, tripsApi } from '../../lib/api'
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
  TRIP_STATUS_LABELS,
  TRIP_STATUS_COLORS,
  formatDate,
  formatDateTime,
  formatMileage,
  formatCPF,
  formatPhone,
  daysUntil,
  isCNHExpiring,
  isCNHExpired,
  cn,
} from '../../lib/utils'
import { DriverFormModal } from './DriverFormModal'
import type { Driver, DriverStatus, Trip } from '../../types'

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      const [driverData, allTrips] = await Promise.all([
        driversApi.getById(id),
        tripsApi.getAll(),
      ])
      setDriver(driverData)
      setTrips(allTrips.filter((t) => t.driver_id === id))
      setLoading(false)
    }
    void loadData()
  }, [id])

  const handleSaveDriver = async (formData: Partial<Driver>) => {
    if (!driver) return
    await driversApi.update(driver.id, formData)
    setShowEditForm(false)
    const updated = await driversApi.getById(driver.id)
    setDriver(updated)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando dados do motorista...</span>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="mb-4 h-16 w-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Motorista não encontrado</h3>
        <Button variant="outline" leftIcon={ArrowLeft} className="mt-4" onClick={() => navigate('/drivers')}>
          Voltar à lista
        </Button>
      </div>
    )
  }

  const status = driver.status as DriverStatus
  const colors = DRIVER_STATUS_COLORS[status] || { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
  const expired = isCNHExpired(driver.cnh_expiration)
  const expiring = isCNHExpiring(driver.cnh_expiration, 60)
  const days = daysUntil(driver.cnh_expiration)

  const initials = driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const tripsCompleted = trips.filter((t) => t.status === 'returned').length
  const tripsActive = trips.filter((t) => t.status === 'in_route').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/drivers')}
          className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800">{driver.name}</h2>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                      colors.badge
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                    {DRIVER_STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3.5 w-3.5" />
                  {formatPhone(driver.phone)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              leftIcon={Edit2}
              onClick={() => setShowEditForm(true)}
            >
              Editar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Dados pessoais */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Dados do Motorista</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {[
                { label: 'CPF', value: formatCPF(driver.cpf) },
                { label: 'Telefone', value: formatPhone(driver.phone) },
                { label: 'CNH', value: driver.cnh },
                { label: 'Categoria CNH', value: driver.cnh_category },
                { label: 'Cadastrado em', value: formatDate(driver.created_at) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-800 font-mono">{item.value}</span>
                </div>
              ))}
              {driver.user && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Conta vinculada</span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    🔗 {driver.user.email}
                  </span>
                </div>
              )}
              {driver.notes && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Observações</p>
                  <p className="mt-1 text-sm text-slate-700">{driver.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Status da CNH */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Validade da CNH</h3>
            </CardHeader>
            <CardBody>
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl p-4',
                  expired ? 'bg-red-50' : expiring ? 'bg-yellow-50' : 'bg-green-50'
                )}
              >
                {expired ? (
                  <XCircle className="h-6 w-6 shrink-0 text-red-500 mt-0.5" />
                ) : expiring ? (
                  <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-500 mt-0.5" />
                ) : (
                  <CheckCircle className="h-6 w-6 shrink-0 text-green-500 mt-0.5" />
                )}
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      expired ? 'text-red-700' : expiring ? 'text-yellow-700' : 'text-green-700'
                    )}
                  >
                    {expired
                      ? '🔴 CNH VENCIDA'
                      : expiring
                        ? `⚠️ Vence em ${days} dias`
                        : '✅ CNH em dia'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Validade: {formatDate(driver.cnh_expiration)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Resumo de viagens */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Resumo</h3>
            </CardHeader>
            <CardBody className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: trips.length },
                { label: 'Ativas', value: tripsActive },
                { label: 'Concluídas', value: tripsCompleted },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Histórico de viagens */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-800">Histórico de Viagens</h3>
            </CardHeader>
            <CardBody className="p-0">
              {trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Route className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-400">Nenhuma viagem registrada para este motorista</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {trips.map((trip) => {
                    const distance =
                      trip.return_mileage && trip.departure_mileage
                        ? trip.return_mileage - trip.departure_mileage
                        : null
                    return (
                      <li
                        key={trip.id}
                        className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                          <MapPin className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {trip.origin ?? 'Origem'} → {trip.destination}
                            </p>
                            <span
                              className={cn(
                                'shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                TRIP_STATUS_COLORS[trip.status]
                              )}
                            >
                              {TRIP_STATUS_LABELS[trip.status]}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {trip.truck?.internal_code ?? '—'}
                            </span>
                            <span>{formatDateTime(trip.departure_at)}</span>
                            {distance !== null && (
                              <span>{distance.toLocaleString('pt-BR')} km rodados</span>
                            )}
                          </div>
                          {trip.departure_mileage != null && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              KM saída: {formatMileage(trip.departure_mileage)}
                              {trip.return_mileage != null && ` · KM retorno: ${formatMileage(trip.return_mileage)}`}
                            </p>
                          )}
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

      {showEditForm && (
        <DriverFormModal
          driver={driver}
          onClose={() => setShowEditForm(false)}
          onSave={handleSaveDriver}
        />
      )}
    </div>
  )
}
