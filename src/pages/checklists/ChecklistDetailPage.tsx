import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  User,
  ClipboardList,
  XCircle,
  FileText,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  PenTool,
  Camera,
  Maximize2,
  X,
  Route,
  MapPin,
  Navigation,
  Clock,
  Fuel,
  Calendar,
  Sparkles,
  ShieldAlert,
  Globe,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { checklistsApi } from '../../lib/api'
import { checkTruckRodizio } from '../../lib/rodizio'
import { FIXED_DEPARTURE_ORIGIN } from '../../lib/route-calculator'
import {
  CHECKLIST_STATUS_LABELS,
  CHECKLIST_STATUS_COLORS,
  formatDateTime,
  formatMileage,
  cn,
  sanitizeImageUrl,
} from '../../lib/utils'
import { isPersistentImageUrl } from '../../lib/image-utils'
import type { Checklist, ChecklistPhoto } from '../../types'

const PHOTO_TYPE_LABELS: Record<string, string> = {
  front: '📷 Frontal',
  rear: '📷 Traseira',
  left: '📷 Lateral Esq.',
  right: '📷 Lateral Dir.',
  tires: '🔵 Pneus',
  cargo: '📦 Carga',
  panel: '🎛️ Painel',
  issue: '⚠️ Problema',
  other: '📸 Outro',
}
function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<ChecklistPhoto | null>(null)
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadChecklist() {
      if (!id) return
      setLoading(true)
      const data = await checklistsApi.getById(id)
      setChecklist(data)
      setLoading(false)
    }
    void loadChecklist()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando dados do checklist...</span>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ClipboardList className="mb-4 h-16 w-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Checklist não encontrado</h3>
        <p className="text-sm text-slate-500 mt-1">O registro solicitado não foi localizado no banco de dados.</p>
        <Button variant="outline" leftIcon={ArrowLeft} className="mt-4" onClick={() => navigate('/checklists')}>
          Voltar aos Checklists
        </Button>
      </div>
    )
  }

  const items = checklist.items || []
  const photos = checklist.photos || []
  const okItems = items.filter((i) => i.status === 'ok')
  const notOkItems = items.filter((i) => i.status === 'not_ok')
  const naItems = items.filter((i) => i.status === 'na')

  const statusClass = CHECKLIST_STATUS_COLORS[checklist.status] || 'bg-slate-100 text-slate-700'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/checklists')}
          className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl',
                  checklist.type === 'departure' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                )}>
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">
                      Checklist de {checklist.type === 'departure' ? 'Saída' : 'Retorno'}
                    </h2>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', statusClass)}>
                      {CHECKLIST_STATUS_LABELS[checklist.status] || checklist.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500 mt-0.5">
                    <span>Realizado em {formatDateTime(checklist.started_at)}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-2xs font-semibold text-blue-700 border border-blue-200">
                      <Globe className="h-3 w-3" /> Horário Oficial (Internet)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" leftIcon={Printer} onClick={() => window.print()}>
                Imprimir Checklist
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Veículo */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>Veículo</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              {checklist.truck?.plate || checklist.truck?.internal_code || '—'}
            </p>
            <p className="text-xs text-slate-500">{checklist.truck?.model || 'Modelo não especificado'}</p>
          </CardBody>
        </Card>

        {/* Motorista */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <User className="h-4 w-4 text-purple-600" />
              <span>Motorista</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              {checklist.driver?.name || '—'}
            </p>
            <p className="text-xs text-slate-500">CNH: {checklist.driver?.cnh || '—'}</p>
          </CardBody>
        </Card>

        {/* Odômetro */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <FileText className="h-4 w-4 text-amber-600" />
              <span>Quilometragem</span>
            </div>
            <p className="text-lg font-bold text-slate-800 font-mono">
              {formatMileage(checklist.mileage)}
            </p>
            <p className="text-xs text-slate-500">Destino: {checklist.destination || 'Não informado'}</p>
          </CardBody>
        </Card>

        {/* Status Itens e Fotos */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Conformidades & Fotos</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-bold">{okItems.length} OK</span>
              <span className="text-red-600 font-bold">{notOkItems.length} Não OK</span>
              <span className="text-slate-500">{naItems.length} N/A</span>
            </div>
            <p className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" />
              <span>{photos.length} {photos.length === 1 ? 'foto registrada' : 'fotos registradas'}</span>
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Liberação Excepcional / Justificativa (se houver) */}
      {checklist.release_justification && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Liberação Excepcional Registrada por Administrador</span>
          </div>
          <p className="mt-1 text-sm text-amber-900">
            {checklist.release_justification}
          </p>
        </div>
      )}

      {/* Resumo da Rota & Estimativa de Viagem */}
      <Card className="overflow-hidden border-blue-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Route className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Trajeto e Estimativa de Viagem
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo automático de distância, duração prevista e consumo estimado de diesel
                </p>
              </div>
            </div>
            {checklist.estimated_distance_km ? (
              <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Rota Logística Calculada
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardBody className="p-5 space-y-5">
          {/* Origem e Destino com visual de trajeto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origem */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Ponto de Saída (Origem Fixa)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                    Galpão 01
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  Cotia / SP — Galpão Principal
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {checklist.origin || FIXED_DEPARTURE_ORIGIN}
                </p>
              </div>
            </div>

            {/* Destino */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
                <Navigation className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    Destino da Viagem
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 rounded px-1.5 py-0.5">
                    Entrega
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {checklist.destination || 'Destino não informado'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Local programado para entrega e prestação de serviço
                </p>
              </div>
            </div>
          </div>

          {/* Métricas Estimadas: KM, Duração, ETA e Diesel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <Route className="h-3.5 w-3.5 text-blue-600" />
                <span>Distância Prevista</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {checklist.estimated_distance_km ? (
                  <>
                    {checklist.estimated_distance_km.toLocaleString('pt-BR')} <span className="text-xs font-medium text-slate-500">km</span>
                  </>
                ) : (
                  '—'
                )}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Malha viária calculada</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Tempo Estimado</span>
              </div>
              <p className="text-xl font-bold text-amber-900">
                {formatDuration(checklist.estimated_duration_minutes)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Velocidade média de carga</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Previsão de Chegada</span>
              </div>
              <p className="text-sm font-bold text-emerald-800 leading-snug">
                {checklist.estimated_arrival ? (
                  formatDateTime(checklist.estimated_arrival)
                ) : (
                  '—'
                )}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Estimativa de chegada (ETA)</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <Fuel className="h-3.5 w-3.5 text-purple-600" />
                <span>Diesel Estimado</span>
              </div>
              <p className="text-xl font-bold text-purple-900">
                {checklist.estimated_distance_km ? (
                  <>
                    ~{Math.round(checklist.estimated_distance_km / 3.5)} <span className="text-xs font-medium text-slate-500">L</span>
                  </>
                ) : (
                  '—'
                )}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Méd. 3,5 km/l (veículo pesado)</p>
            </div>
          </div>

          {/* Dados de Carga e Volumes (se informados) */}
          {(checklist.cargo_volumes !== undefined && checklist.cargo_volumes !== null || checklist.cargo_notes) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <span>📦 Detalhes da Carga Transportada</span>
                {checklist.cargo_volumes !== undefined && checklist.cargo_volumes !== null && (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-slate-800">
                    {checklist.cargo_volumes} {checklist.cargo_volumes === 1 ? 'Volume / Palete' : 'Volumes / Paletes'}
                  </span>
                )}
              </div>
              {checklist.cargo_notes && (
                <p className="text-slate-600 mt-1">{checklist.cargo_notes}</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Regras e Alerta de Rodízio Municipal de Veículos Pesados (SP / ZMRC) */}
      {(() => {
        const truckPlate = checklist.truck?.plate || ''
        const checkDate = checklist.started_at ? new Date(checklist.started_at) : new Date()
        const rodizio = checkTruckRodizio(truckPlate, checkDate)

        return (
          <Card className={cn(
            'border transition-all shadow-xs',
            rodizio.isRodizioToday
              ? rodizio.isTruckRestrictedNow
                ? 'border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50/50 to-white'
                : 'border-amber-300 bg-amber-50/40'
              : 'border-slate-200'
          )}>
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    rodizio.isRodizioToday ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                  )}>
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                      Rodízio Municipal de Veículos e Caminhões (CET-SP / ZMRC)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Monitoramento de restrição de tráfego na Região Metropolitana e Centro Expandido
                    </p>
                  </div>
                </div>

                <span className={cn(
                  'inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border',
                  rodizio.isRodizioToday
                    ? rodizio.isTruckRestrictedNow
                      ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                )}>
                  {rodizio.isRodizioToday
                    ? (rodizio.isTruckRestrictedNow ? '⚠️ Restrição Ativa no Momento do Checklist' : '⚠️ Em Dia de Rodízio')
                    : '✅ Veículo Livre de Rodízio'}
                </span>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-500 block mb-1">Dígito Final da Placa</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800">
                      {rodizio.lastDigit !== null ? rodizio.lastDigit : '—'}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      ({truckPlate || 'Placa n/d'})
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-500 block mb-1">Dia Oficial de Restrição</span>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    {rodizio.rodizioDayName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Baseado na legislação de SP</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-500 block mb-1">Horário de Restrição para Caminhões</span>
                  <p className="text-base font-bold text-amber-900 mt-1">
                    05h00 às 21h00
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">ZMRC (Zona de Máxima Restrição)</p>
                </div>
              </div>

              {rodizio.isRodizioToday && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 flex items-start gap-3 text-xs text-amber-950">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      Aviso aos Operadores e Motoristas de Frota
                    </p>
                    <p className="leading-relaxed text-amber-900">
                      Este caminhão possui placa com final <strong>{rodizio.lastDigit}</strong>. Conforme as regras da CET-SP, caminhões estão proibidos de circular na <strong>Zona de Máxima Restrição de Circulação (ZMRC)</strong> das <strong>05h00 às 21h00</strong>. Certifique-se de que a rota utilize as vias liberadas (como Rodoanel) para evitar autuações de trânsito.
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )
      })()}

      {/* Observações Gerais */}
      {checklist.notes && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800 text-sm">Observações da Viagem</h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-700">{checklist.notes}</p>
          </CardBody>
        </Card>
      )}

      {/* Itens com Não Conformidade (Alerta) */}
      {notOkItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-800">Itens com Não Conformidade / Avarias ({notOkItems.length})</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notOkItems.map((item) => (
                <div key={item.id || item.item_key} className="rounded-lg border border-red-200 bg-white p-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-red-700">{item.item_label}</p>
                    <span className="rounded bg-red-100 px-2 py-0.5 text-2xs font-bold text-red-700">
                      NÃO OK
                    </span>
                  </div>
                  {item.observation && (
                    <p className="text-xs text-slate-600 mt-1">Obs: {item.observation}</p>
                  )}
                  {item.is_required && (
                    <span className="inline-block mt-1 text-2xs font-bold text-red-600 uppercase">
                      ⚠️ Item Obrigatório
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Fotos Registradas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">
                Fotos Registradas {photos.length > 0 && `(${photos.length})`}
              </h3>
            </div>
            {photos.length > 0 && (
              <span className="text-xs font-medium text-slate-500">
                Clique na foto para ampliar
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <Camera className="mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Nenhuma foto registrada</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Não foram anexadas fotografias durante a realização deste checklist.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo, idx) => {
                const photoId = photo.id || String(idx)
                const rawSrc = photo.url || photo.storage_path || ''
                const isBlob = rawSrc.trim().startsWith('blob:')
                const isAvailable = isPersistentImageUrl(rawSrc) && !failedPhotos[photoId]
                const src = isAvailable ? sanitizeImageUrl(rawSrc) : ''
                const label = PHOTO_TYPE_LABELS[photo.photo_type || ''] || 'Outro'
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      {isAvailable && src ? (
                        <>
                          <img
                            src={src}
                            alt={photo.description || label}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={() => setFailedPhotos((prev) => ({ ...prev, [photoId]: true }))}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 text-slate-800 shadow-md">
                              <Maximize2 className="h-4 w-4" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full min-h-[120px] flex-col items-center justify-center bg-slate-100 p-3 text-center text-slate-400">
                          <Camera className="mb-1.5 h-6 w-6 text-slate-300" />
                          <span className="text-2xs font-semibold text-slate-600">
                            {isBlob ? 'Sessão Expirada' : 'Foto Indisponível'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {isBlob ? 'Gravada em sessão anterior' : 'Não foi possível carregar'}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-2xs font-semibold text-white">
                        {label}
                      </span>
                    </div>

                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-slate-700 truncate" title={photo.description || label}>
                        {photo.description || label}
                      </p>
                      {photo.created_at && (
                        <p className="text-2xs text-slate-400 mt-0.5">
                          {formatDateTime(photo.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Assinatura Digital do Motorista (Autenticação) */}
      <div className="max-w-xl mx-auto w-full">
        <Card className="border-purple-200 shadow-sm">
          <CardHeader className="border-b border-purple-100 bg-purple-50/40">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Assinatura Digital do Motorista</h3>
            </div>
          </CardHeader>
          <CardBody className="p-5 flex flex-col items-center justify-center min-h-[160px] bg-white">
            {checklist.driver_signature ? (
              <img src={checklist.driver_signature} alt="Assinatura Motorista" className="max-h-28 object-contain" />
            ) : (
              <p className="text-xs text-slate-400 italic">Assinatura digital não anexada</p>
            )}
            <p className="text-sm font-bold text-slate-700 mt-3">
              {checklist.driver?.name || 'Motorista'}
            </p>
            {checklist.driver_password_confirmed && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Autenticado com Senha Própria do Motorista
              </span>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Lightbox / Modal de Foto em Tamanho Real */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-600/80 px-2 py-0.5 text-xs font-medium">
                  {PHOTO_TYPE_LABELS[selectedPhoto.photo_type || ''] || 'Foto'}
                </span>
                <p className="text-sm font-medium text-slate-200 truncate max-w-md">
                  {selectedPhoto.description || 'Foto do checklist'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-black/40 min-h-[220px]">
              {isPersistentImageUrl(selectedPhoto.url || selectedPhoto.storage_path) &&
              !failedPhotos[selectedPhoto.id || ''] ? (
                <img
                  src={sanitizeImageUrl(selectedPhoto.url || selectedPhoto.storage_path)}
                  alt={selectedPhoto.description || 'Foto'}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                  onError={() =>
                    setFailedPhotos((prev) => ({ ...prev, [selectedPhoto.id || '']: true }))
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Camera className="mb-2 h-10 w-10 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">Foto Não Disponível</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Esta foto foi gravada em uma sessão anterior temporária local e não está mais acessível. Novas fotos enviadas ficam permanentemente salvas na nuvem.
                  </p>
                </div>
              )}
            </div>
            {selectedPhoto.description && (
              <div className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-400">
                {selectedPhoto.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

