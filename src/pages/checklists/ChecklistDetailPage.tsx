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
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../../components/ui'
import { checklistsApi } from '../../lib/api'
import { CATEGORY_LABELS } from '../../lib/checklist-items'
import {
  CHECKLIST_STATUS_LABELS,
  CHECKLIST_STATUS_COLORS,
  formatDateTime,
  formatMileage,
  cn,
} from '../../lib/utils'
import type { Checklist, ChecklistItem, ChecklistPhoto } from '../../types'

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

export function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<ChecklistPhoto | null>(null)

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

  // Agrupar itens por categoria
  const groupedItems: Record<string, ChecklistItem[]> = {}
  items.forEach((item) => {
    const cat = item.category || 'geral'
    if (!groupedItems[cat]) groupedItems[cat] = []
    groupedItems[cat].push(item)
  })

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
                  <p className="text-sm text-slate-500">
                    Realizado em {formatDateTime(checklist.started_at)}
                  </p>
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

      {/* Detalhamento Completo dos Itens por Categoria */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Itens Inspecionados por Categoria</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Nenhum item detalhado registrado neste checklist.
            </div>
          ) : (
            Object.entries(groupedItems).map(([cat, catItems]) => (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                    {CATEGORY_LABELS[cat] || cat} ({catItems.length})
                  </h4>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">{catItems.filter((i) => i.status === 'ok').length} OK</span>
                    {catItems.filter((i) => i.status === 'not_ok').length > 0 && (
                      <span className="text-red-600 font-bold">{catItems.filter((i) => i.status === 'not_ok').length} Não OK</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {catItems.map((item) => (
                    <div
                      key={item.id || item.item_key}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs"
                    >
                      <span className="font-medium text-slate-700 truncate pr-2">{item.item_label}</span>
                      <span className={cn('rounded px-2 py-0.5 font-bold uppercase shrink-0',
                        item.status === 'ok' ? 'bg-green-100 text-green-700' :
                        item.status === 'not_ok' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                      )}>
                        {item.status === 'ok' ? 'OK' : item.status === 'not_ok' ? 'NÃO OK' : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

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
                const src = photo.url || photo.storage_path
                const label = PHOTO_TYPE_LABELS[photo.photo_type || ''] || 'Outro'
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                      <img
                        src={src}
                        alt={photo.description || label}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 text-slate-800 shadow-md">
                          <Maximize2 className="h-4 w-4" />
                        </div>
                      </div>
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

      {/* Assinaturas Digitais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assinatura Motorista */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Assinatura do Motorista</h3>
            </div>
          </CardHeader>
          <CardBody className="p-4 flex flex-col items-center justify-center min-h-[140px] bg-slate-50">
            {checklist.driver_signature ? (
              <img src={checklist.driver_signature} alt="Assinatura Motorista" className="max-h-24 object-contain" />
            ) : (
              <p className="text-xs text-slate-400 italic">Assinatura digital não anexada</p>
            )}
            <p className="text-xs font-semibold text-slate-600 mt-2">
              {checklist.driver?.name || 'Motorista'}
            </p>
          </CardBody>
        </Card>

        {/* Assinatura Responsável */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Assinatura do Responsável</h3>
            </div>
          </CardHeader>
          <CardBody className="p-4 flex flex-col items-center justify-center min-h-[140px] bg-slate-50">
            {checklist.responsible_signature ? (
              <img src={checklist.responsible_signature} alt="Assinatura Responsável" className="max-h-24 object-contain" />
            ) : (
              <p className="text-xs text-slate-400 italic">Assinatura digital não anexada</p>
            )}
            <p className="text-xs font-semibold text-slate-600 mt-2">
              {checklist.responsible_name || 'Responsável pela Conferência'}
            </p>
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
            <div className="flex items-center justify-center p-2 bg-black/40">
              <img
                src={selectedPhoto.url || selectedPhoto.storage_path}
                alt={selectedPhoto.description || 'Foto'}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
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
