import { useState, useEffect } from 'react'
import { Truck, CheckCircle2, ShieldAlert, Lock } from 'lucide-react'
import { Button, Alert } from '../../../components/ui'
import type { StepProps } from './shared'
import { trucksApi, driversApi, checklistsApi, tripsApi, occurrencesApi } from '../../../lib/api'
import { formatMileage } from '../../../lib/utils'
import { DEPARTURE_CHECKLIST_ITEMS } from '../../../lib/checklist-items'
import { useAuth } from '../../../contexts/AuthContext'
import type { Truck as TruckType, Driver } from '../../../types'

interface Step11Props extends StepProps {
  hasBlockingIssue: boolean
  onComplete: () => void
}

export function Step11_Release({ form, hasBlockingIssue, onComplete }: Step11Props) {
  const { isAdmin, user } = useAuth()
  const [truck, setTruck] = useState<TruckType | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [releaseJustification, setReleaseJustification] = useState('')
  const [isReleasing, setIsReleasing] = useState(false)
  const [released, setReleased] = useState(false)

  useEffect(() => {
    async function loadEntities() {
      if (form.truck_id) {
        const t = await trucksApi.getById(form.truck_id)
        setTruck(t)
      }
      if (form.driver_id) {
        const d = await driversApi.getById(form.driver_id)
        setDriver(d)
      }
    }
    void loadEntities()
  }, [form.truck_id, form.driver_id])

  const totalItems = DEPARTURE_CHECKLIST_ITEMS.length
  const okCount = Object.values(form.items).filter((s) => s === 'ok').length
  const notOkCount = Object.values(form.items).filter((s) => s === 'not_ok').length
  const naCount = Object.values(form.items).filter((s) => s === 'na').length

  async function handleRelease() {
    setIsReleasing(true)
    
    // 1. Salvar checklist no Supabase
    const { data: newChecklist, error: cklError } = await checklistsApi.create({
      truck_id: form.truck_id,
      driver_id: form.driver_id,
      type: 'departure',
      status: hasBlockingIssue ? 'approved' : 'released',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      released_at: new Date().toISOString(),
      mileage: form.mileage,
      destination: form.destination,
      cargo_volumes: form.cargo_volumes,
      cargo_notes: form.cargo_notes,
      notes: form.notes,
      release_justification: releaseJustification || undefined,
      driver_signature: form.driver_signature,
      responsible_signature: form.responsible_signature,
      responsible_name: form.responsible_name,
    })

    if (!cklError && newChecklist) {
      // 2. Salvar os itens verificados
      const itemsToSave = Object.entries(form.items).map(([key, status]) => {
        const def = DEPARTURE_CHECKLIST_ITEMS.find((i) => i.key === key)
        return {
          checklist_id: newChecklist.id,
          category: def?.category || 'geral',
          item_key: key,
          item_label: def?.label || key,
          status,
          observation: form.item_observations[key] || undefined,
          is_required: def?.is_required || false,
        }
      })
      if (itemsToSave.length > 0) {
        await checklistsApi.saveItems(itemsToSave)
      }

      // 2.1 Salvar fotos anexadas
      if (form.photos && form.photos.length > 0) {
        await checklistsApi.savePhotos(
          form.photos.map((p) => ({
            checklist_id: newChecklist.id,
            storage_path: p.storage_path || p.url || '',
            url: p.url || p.storage_path || '',
            description: p.description || '',
            photo_type: p.photo_type || 'other',
          }))
        )
      }

      // 2.2 Salvar ocorrências se houver
      if (form.occurrences && form.occurrences.length > 0) {
        for (const occ of form.occurrences) {
          await occurrencesApi.create({
            checklist_id: newChecklist.id,
            truck_id: form.truck_id,
            description: occ.description,
            severity: occ.severity,
            status: 'open',
          })
        }
      }

      // 3. Criar a viagem correspondente
      await tripsApi.create({
        truck_id: form.truck_id,
        driver_id: form.driver_id,
        departure_checklist_id: newChecklist.id,
        origin: 'Pátio Central',
        destination: form.destination,
        departure_at: new Date().toISOString(),
        departure_mileage: form.mileage,
        status: 'in_route',
      })

      // 4. Atualizar status do caminhão para em rota
      await trucksApi.update(form.truck_id, { status: 'in_route', mileage: form.mileage })
    }

    setIsReleasing(false)
    setConfirmOpen(false)
    setReleased(true)
  }

  if (released) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-700">Caminhão Liberado com Sucesso!</h3>
        <p className="mt-2 text-slate-600">
          O checklist e a viagem foram registrados no banco de dados.
        </p>
        <div className="mt-6 w-full max-w-sm rounded-xl border border-green-200 bg-green-50 p-5 text-left space-y-2">
          <p className="text-sm text-green-800">
            🚛 <strong>{truck?.internal_code}</strong> — {truck?.plate}
          </p>
          <p className="text-sm text-green-800">
            👤 <strong>{driver?.name}</strong>
          </p>
          <p className="text-sm text-green-800">
            📏 KM Saída: <strong>{formatMileage(form.mileage)}</strong>
          </p>
          <p className="text-sm text-green-800">
            📍 Destino: <strong>{form.destination}</strong>
          </p>
          <p className="text-sm text-green-800">
            🕐 Liberado em: <strong>{new Date().toLocaleString('pt-BR')}</strong>
          </p>
          <p className="text-sm text-green-800">
            👤 Por: <strong>{user?.name || user?.email}</strong>
          </p>
        </div>
        <Button
          variant="primary"
          className="mt-6"
          onClick={onComplete}
        >
          Concluir e Voltar ao Início
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${hasBlockingIssue ? 'bg-red-100' : 'bg-green-100'}`}>
            {hasBlockingIssue ? (
              <Lock className="h-5 w-5 text-red-600" />
            ) : (
              <Truck className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 11 — Liberação</h3>
            <p className="text-xs text-slate-500">Autorize a saída do caminhão</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        {/* Summary card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-sm font-bold text-slate-800">Checklist Concluído</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Caminhão</p>
              <p className="font-bold text-slate-800">{truck?.internal_code ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Motorista</p>
              <p className="font-bold text-slate-800">{driver?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">KM</p>
              <p className="font-bold font-mono text-slate-800">{formatMileage(form.mileage)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Destino</p>
              <p className="font-bold text-slate-800">{form.destination}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Itens Verificados</p>
              <p className="font-bold text-slate-800">{totalItems}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status dos Itens</p>
              <p className="font-bold text-slate-800">
                <span className="text-green-600">{okCount} OK</span>
                {' · '}
                <span className="text-slate-500">{naCount} N/A</span>
                {' · '}
                <span className="text-red-600">{notOkCount} Não OK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Block status */}
        {hasBlockingIssue ? (
          <div className="rounded-xl border-2 border-red-400 bg-red-50 p-5 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-600" />
            <p className="text-lg font-bold text-red-700">🔴 CAMINHÃO NÃO LIBERADO</p>
            <p className="mt-2 text-sm text-red-600">
              Existem pendências obrigatórias marcadas como "Não OK" que impedem a saída do caminhão.
            </p>

            {isAdmin && (
              <div className="mt-4 rounded-lg border border-red-300 bg-white p-4 text-left">
                <p className="text-sm font-semibold text-red-700">
                  ⚠️ Liberação Excepcional (Apenas Administrador)
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Como administrador, você pode autorizar a saída excepcionalmente. Justifique abaixo:
                </p>
                <textarea
                  placeholder="Justificativa formal para liberação com pendências..."
                  value={releaseJustification}
                  onChange={(e) => setReleaseJustification(e.target.value)}
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none"
                />
                <Button
                  variant="danger"
                  className="mt-3 w-full"
                  disabled={!releaseJustification.trim()}
                  onClick={() => setConfirmOpen(true)}
                >
                  Liberar Excepcionalmente
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-green-400 bg-green-50 p-5 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
            <p className="text-lg font-bold text-green-700">🟢 APROVADO</p>
            <p className="mt-2 text-sm text-green-600">
              Todos os itens foram inspecionados. Confirme a liberação abaixo.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full bg-green-600 hover:bg-green-700"
              onClick={() => setConfirmOpen(true)}
            >
              LIBERAR CAMINHÃO
            </Button>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Confirmar Liberação</h3>
            <p className="mt-2 text-sm text-slate-600">
              Confirmar liberação do veículo <strong>{truck?.internal_code}</strong> com o motorista{' '}
              <strong>{driver?.name}</strong>?
            </p>
            {hasBlockingIssue && (
              <Alert type="error" className="mt-3">
                Liberação excepcional. Justificativa: {releaseJustification}
              </Alert>
            )}
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
                disabled={isReleasing}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={isReleasing}
                onClick={handleRelease}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
