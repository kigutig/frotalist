import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Route,
  Gauge,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Camera,
} from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { tripsApi, checklistsApi, trucksApi } from '../../lib/api'
import { Step8_Photos } from '../checklists/steps/Step8_Photos'
import {
  TRIP_STATUS_LABELS,
  formatMileage,
  formatDateTime,
  cn,
} from '../../lib/utils'
import type { Trip, ChecklistPhoto } from '../../types'

// ---- Types ----
interface ReturnOccurrence {
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

const STEPS = [
  { id: 1, label: 'Resumo', short: 'RES' },
  { id: 2, label: 'Quilometragem', short: 'KM' },
  { id: 3, label: 'Ocorrências', short: 'OCC' },
  { id: 4, label: 'Fotos', short: 'FOT' },
  { id: 5, label: 'Entregas', short: 'ENT' },
  { id: 6, label: 'Confirmar', short: 'CON' },
]

const SEVERITY_OPTIONS = [
  { value: 'low', label: '🟢 Baixa' },
  { value: 'medium', label: '🟡 Média' },
  { value: 'high', label: '🟠 Alta' },
  { value: 'critical', label: '🔴 Crítica' },
]

export function TripReturnPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Form state
  const [returnMileage, setReturnMileage] = useState('')
  const [occurrences, setOccurrences] = useState<ReturnOccurrence[]>([])
  const [newOccDesc, setNewOccDesc] = useState('')
  const [newOccSev, setNewOccSev] = useState<ReturnOccurrence['severity']>('low')
  const [photos, setPhotos] = useState<Partial<ChecklistPhoto>[]>([])
  const [deliveriesCompleted, setDeliveriesCompleted] = useState('')
  const [deliveriesPending, setDeliveriesPending] = useState('')
  const [pendingReason, setPendingReason] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      const allTrips = await tripsApi.getAll()
      const found = allTrips.find((t) => t.id === id) ?? null
      setTrip(found)
      if (found?.departure_mileage) {
        setReturnMileage(String(found.departure_mileage))
      }
      setLoading(false)
    }
    void loadData()
  }, [id])

  const addOccurrence = () => {
    if (!newOccDesc.trim()) return
    setOccurrences((prev) => [...prev, { description: newOccDesc.trim(), severity: newOccSev }])
    setNewOccDesc('')
    setNewOccSev('low')
  }

  const removeOccurrence = (index: number) => {
    setOccurrences((prev) => prev.filter((_, i) => i !== index))
  }

  function canProceed(): boolean {
    if (currentStep === 2) {
      const km = Number(returnMileage)
      return km > 0 && (!trip?.departure_mileage || km >= trip.departure_mileage)
    }
    return true
  }

  async function handleFinalize() {
    if (!trip || !id) return
    setSaving(true)
    try {
      const returnKm = Number(returnMileage)

      // 1. Criar checklist de retorno
      const { data: returnChecklist } = await checklistsApi.create({
        truck_id: trip.truck_id,
        driver_id: trip.driver_id,
        trip_id: id,
        type: 'return',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        mileage: returnKm,
        notes: notes || undefined,
      })

      // 1.1 Salvar fotos registradas no retorno
      if (returnChecklist && photos.length > 0) {
        await checklistsApi.savePhotos(
          photos.map((p) => ({
            checklist_id: returnChecklist.id,
            storage_path: p.storage_path || p.url || '',
            url: p.url || p.storage_path,
            description: p.description || '',
            photo_type: p.photo_type || 'other',
          }))
        )
      }

      // 2. Atualizar a viagem
      await tripsApi.update(id, {
        status: 'returned',
        return_at: new Date().toISOString(),
        return_mileage: returnKm,
        return_checklist_id: returnChecklist?.id,
        deliveries_completed: deliveriesCompleted ? Number(deliveriesCompleted) : undefined,
        deliveries_pending: deliveriesPending ? Number(deliveriesPending) : undefined,
        pending_reason: pendingReason || undefined,
        notes: notes || undefined,
      })

      // 4. Atualizar status do caminhão para disponível
      await trucksApi.update(trip.truck_id, {
        status: 'available',
        mileage: returnKm,
      })

      setDone(true)
    } catch (err) {
      console.error('Erro ao registrar retorno:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------- Loading / Not found ----------

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando viagem...</span>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Route className="mb-4 h-16 w-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Viagem não encontrada</h3>
        <Button variant="outline" leftIcon={ArrowLeft} className="mt-4" onClick={() => navigate('/trips')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (trip.status !== 'in_route') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-yellow-400" />
        <h3 className="text-lg font-semibold text-slate-700">Esta viagem não está em rota</h3>
        <p className="mt-2 text-sm text-slate-500">
          Somente viagens com status "Em Rota" podem ter retorno registrado.<br />
          Status atual: <strong>{TRIP_STATUS_LABELS[trip.status]}</strong>
        </p>
        <Button variant="outline" leftIcon={ArrowLeft} className="mt-4" onClick={() => navigate(`/trips/${id}`)}>
          Voltar ao detalhe
        </Button>
      </div>
    )
  }

  // ---------- Done ----------
  if (done) {
    const returnKm = Number(returnMileage)
    const distance = trip.departure_mileage ? returnKm - trip.departure_mileage : null
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center mx-auto max-w-md">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-700">Retorno Registrado!</h2>
        <p className="mt-2 text-slate-500">O caminhão foi marcado como disponível.</p>

        <div className="mt-6 w-full rounded-xl border border-green-200 bg-green-50 p-5 text-left space-y-2">
          <p className="text-sm text-green-800">🚛 <strong>{trip.truck?.internal_code}</strong> — {trip.truck?.plate}</p>
          <p className="text-sm text-green-800">👤 <strong>{trip.driver?.name}</strong></p>
          <p className="text-sm text-green-800">📍 {trip.origin} → {trip.destination}</p>
          <p className="text-sm text-green-800">📏 KM Retorno: <strong>{formatMileage(returnKm)}</strong></p>
          {distance !== null && (
            <p className="text-sm text-green-800">🛣️ Distância percorrida: <strong>{distance.toLocaleString('pt-BR')} km</strong></p>
          )}
          <p className="text-sm text-green-800">🕐 Registrado em: <strong>{new Date().toLocaleString('pt-BR')}</strong></p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => navigate('/trips')}>
            Ver Viagens
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Ir ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ---------- Wizard ----------
  const returnKmNum = Number(returnMileage)
  const distance = trip.departure_mileage && returnKmNum > 0 ? returnKmNum - trip.departure_mileage : null

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/trips/${id}`)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-md">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Registrar Retorno</h1>
          <p className="text-xs text-slate-500">
            {trip.truck?.plate} · {trip.driver?.name}
          </p>
        </div>
      </div>

      {/* Steps bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => { if (step.id < currentStep) setCurrentStep(step.id) }}
                disabled={step.id > currentStep}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  step.id === currentStep && 'bg-green-600 text-white shadow-sm',
                  step.id < currentStep && 'text-green-700 hover:bg-green-50',
                  step.id > currentStep && 'cursor-default text-slate-400'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold',
                    step.id === currentStep ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  )}>
                    {step.id}
                  </span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.short}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-1 h-0.5 w-3 md:w-6', step.id < currentStep ? 'bg-green-400' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Step 1 — Resumo da viagem */}
        {currentStep === 1 && (
          <div>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <Route className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Resumo da Viagem</h3>
                  <p className="text-xs text-slate-500">Confirme os dados antes de registrar o retorno</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Caminhão', value: trip.truck?.plate ? (trip.truck.internal_code && trip.truck.internal_code !== trip.truck.plate ? `${trip.truck.internal_code} — ${trip.truck.plate}` : trip.truck.plate) : '—' },
                  { label: 'Motorista', value: trip.driver?.name ?? '—' },
                  { label: 'Origem', value: trip.origin ?? '—' },
                  { label: 'Destino', value: trip.destination },
                  { label: 'Saída', value: formatDateTime(trip.departure_at) },
                  { label: 'KM Saída', value: formatMileage(trip.departure_mileage) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
                <p className="text-sm font-semibold text-green-700">✅ Pronto para registrar o retorno</p>
                <p className="text-xs text-green-600 mt-1">Clique em Avançar para continuar</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — KM de retorno */}
        {currentStep === 2 && (
          <div>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Gauge className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Quilometragem de Retorno</h3>
                  <p className="text-xs text-slate-500">Informe o KM atual do odômetro</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">KM de saída</span>
                <span className="text-sm font-bold font-mono text-slate-800">
                  {formatMileage(trip.departure_mileage)}
                </span>
              </div>

              <Input
                label="KM de Retorno (odômetro atual)"
                type="number"
                placeholder="Ex: 185000"
                value={returnMileage}
                onChange={(e) => setReturnMileage(e.target.value)}
                required
                hint={
                  trip.departure_mileage && returnKmNum > 0 && returnKmNum < trip.departure_mileage
                    ? '⚠️ KM de retorno deve ser maior que o KM de saída'
                    : `KM deve ser maior que ${formatMileage(trip.departure_mileage)}`
                }
              />

              {distance !== null && distance >= 0 && (
                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-center">
                  <p className="text-xs text-indigo-500">Distância percorrida</p>
                  <p className="text-2xl font-bold text-indigo-700 font-mono mt-1">
                    {distance.toLocaleString('pt-BR')} km
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Ocorrências */}
        {currentStep === 3 && (
          <div>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Ocorrências no Retorno</h3>
                  <p className="text-xs text-slate-500">Registre problemas encontrados durante a viagem</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Add occurrence */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700">Nova Ocorrência</p>
                <textarea
                  placeholder="Descreva o problema ou ocorrência encontrada..."
                  value={newOccDesc}
                  onChange={(e) => setNewOccDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newOccSev}
                    onChange={(e) => setNewOccSev(e.target.value as ReturnOccurrence['severity'])}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {SEVERITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    leftIcon={Plus}
                    onClick={addOccurrence}
                    disabled={!newOccDesc.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* List */}
              {occurrences.length === 0 ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-sm text-green-700">✅ Nenhuma ocorrência registrada</p>
                  <p className="text-xs text-green-600 mt-1">Se não houver problemas, pode avançar</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {occurrences.map((occ, i) => {
                    const sevLabel = SEVERITY_OPTIONS.find((o) => o.value === occ.severity)?.label ?? occ.severity
                    return (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                        <span className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border',
                          occ.severity === 'low' && 'bg-green-100 text-green-800 border-green-200',
                          occ.severity === 'medium' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          occ.severity === 'high' && 'bg-orange-100 text-orange-800 border-orange-200',
                          occ.severity === 'critical' && 'bg-red-100 text-red-800 border-red-200',
                        )}>
                          {sevLabel}
                        </span>
                        <p className="flex-1 text-sm text-slate-700">{occ.description}</p>
                        <button
                          onClick={() => removeOccurrence(i)}
                          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Fotos */}
        {currentStep === 4 && (
          <Step8_Photos
            form={{ photos }}
            onUpdateField={(_field, val) => setPhotos(val as Partial<ChecklistPhoto>[])}
            title="Fotos do Retorno"
            subtitle="Fotografe o veículo no retorno para registrar o estado e eventuais avarias"
          />
        )}

        {/* Step 5 — Entregas */}
        {currentStep === 5 && (
          <div>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <ClipboardCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Resultado das Entregas</h3>
                  <p className="text-xs text-slate-500">Informe o resultado da rota</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Entregas realizadas"
                  type="number"
                  placeholder="0"
                  value={deliveriesCompleted}
                  onChange={(e) => setDeliveriesCompleted(e.target.value)}
                  hint="Número de entregas concluídas"
                />
                <Input
                  label="Entregas pendentes"
                  type="number"
                  placeholder="0"
                  value={deliveriesPending}
                  onChange={(e) => setDeliveriesPending(e.target.value)}
                  hint="Não realizadas"
                />
              </div>

              {Number(deliveriesPending) > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Motivo das pendências <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Explique o motivo das entregas não realizadas..."
                    value={pendingReason}
                    onChange={(e) => setPendingReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações gerais</label>
                <textarea
                  placeholder="Informações adicionais sobre a viagem..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6 — Confirmar */}
        {currentStep === 6 && (
          <div>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Confirmar Retorno</h3>
                  <p className="text-xs text-slate-500">Revise e finalize o registro</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Resumo do Retorno</p>
                {[
                  { label: 'Caminhão', value: `${trip.truck?.plate}${trip.truck?.internal_code && trip.truck?.internal_code !== trip.truck?.plate ? ` (${trip.truck?.internal_code})` : ''}` },
                  { label: 'Motorista', value: trip.driver?.name ?? '—' },
                  { label: 'Rota', value: `${trip.origin ?? '—'} → ${trip.destination}` },
                  { label: 'KM Saída', value: formatMileage(trip.departure_mileage) },
                  { label: 'KM Retorno', value: formatMileage(returnKmNum) },
                  ...(distance !== null ? [{ label: 'Distância percorrida', value: `${distance.toLocaleString('pt-BR')} km` }] : []),
                  ...(deliveriesCompleted ? [{ label: 'Entregas realizadas', value: deliveriesCompleted }] : []),
                  ...(deliveriesPending ? [{ label: 'Entregas pendentes', value: deliveriesPending }] : []),
                  ...(occurrences.length > 0 ? [{ label: 'Ocorrências', value: `${occurrences.length} registrada(s)` }] : []),
                  ...(photos.length > 0 ? [{ label: 'Fotos registradas', value: `${photos.length} foto(s)` }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="text-sm font-medium text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>

              {photos.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Fotos Anexadas ({photos.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={photo.url || photo.storage_path}
                          alt={photo.description || 'Foto do retorno'}
                          className="h-full w-full object-cover"
                        />
                        {photo.description && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[10px] text-white truncate">
                            {photo.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border-2 border-green-400 bg-green-50 p-4 text-center">
                <p className="text-sm font-bold text-green-700">
                  Ao confirmar, o caminhão será marcado como <strong>Disponível</strong>
                  {' '}e a viagem como <strong>Retornada</strong>.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
                loading={saving}
                onClick={handleFinalize}
              >
                {saving ? 'Registrando...' : 'CONFIRMAR RETORNO'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:static md:shadow-none">
        <Button
          variant="outline"
          leftIcon={ArrowLeft}
          onClick={() => {
            if (currentStep === 1) navigate(`/trips/${id}`)
            else setCurrentStep((s) => s - 1)
          }}
          disabled={saving}
        >
          Voltar
        </Button>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-bold text-slate-700">{currentStep}</span>
          <span>/</span>
          <span>{STEPS.length}</span>
        </div>

        {currentStep < STEPS.length ? (
          <Button
            variant="primary"
            rightIcon={ArrowRight}
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Avançar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
