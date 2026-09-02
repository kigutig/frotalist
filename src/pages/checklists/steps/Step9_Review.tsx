import { useState, useEffect } from 'react'
import { ClipboardList, AlertTriangle, CheckCircle2, Truck, User, Camera } from 'lucide-react'
import { trucksApi, driversApi } from '../../../lib/api'
import type { StepProps } from './shared'
import type { Truck as TruckType, Driver as DriverType } from '../../../types'
import { cn } from '../../../lib/utils'

interface Step9Props extends StepProps {
  hasBlockingIssue: boolean
}

export function Step9_Review({ form, hasBlockingIssue }: Step9Props) {
  const [truck, setTruck] = useState<TruckType | null>(null)
  const [driver, setDriver] = useState<DriverType | null>(null)

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

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Revisão do Checklist</h2>
            <p className="text-xs text-slate-500">Confira os dados antes de assinar e liberar o veículo</p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* Release Status Banner */}
        <div className={cn(
          'rounded-xl border-2 p-5 text-center',
          hasBlockingIssue
            ? 'border-amber-400 bg-amber-50'
            : 'border-green-400 bg-green-50'
        )}>
          {hasBlockingIssue ? (
            <>
              <p className="text-lg font-bold text-amber-800 flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                OCORRÊNCIAS DE ATENÇÃO REGISTRADAS
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Há ocorrências registradas para esta saída. A liberação exigirá autorização do responsável.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-green-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                PRONTO PARA LIBERAÇÃO
              </p>
              <p className="mt-1 text-sm text-green-600">
                Identificação preenchida e sem impeditivos graves. Prossiga para assinatura e liberação.
              </p>
            </>
          )}
        </div>

        {/* Resumo de Caminhão e Motorista */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>Veículo</span>
            </div>
            <p className="font-bold text-slate-800 text-lg">
              {truck?.internal_code || '—'}
            </p>
            <p className="text-sm text-slate-600">Placa: {truck?.plate} · {truck?.model || ''}</p>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              KM Saída: {form.mileage ? form.mileage.toLocaleString('pt-BR') + ' km' : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <User className="h-4 w-4 text-purple-600" />
              <span>Motorista e Rota</span>
            </div>
            <p className="font-bold text-slate-800 text-lg">
              {driver?.name || '—'}
            </p>
            <p className="text-sm text-slate-600">CNH: {driver?.cnh} ({driver?.cnh_category})</p>
            <p className="text-xs text-slate-500 mt-2">
              Destino: <span className="font-semibold text-slate-700">{form.destination || 'Não informado'}</span>
            </p>
          </div>
        </div>

        {/* Resumo de Ocorrências e Fotos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-3xl font-bold text-slate-800">{form.occurrences.length}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Ocorrência(s) Apontada(s)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">{form.photos.length}</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">Foto(s) Anexada(s)</p>
          </div>
        </div>

        {/* Lista de Ocorrências */}
        {form.occurrences.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Detalhes das Ocorrências
            </p>
            {form.occurrences.map((occ, idx) => (
              <div key={idx} className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs">
                <span className="font-medium text-slate-800">{occ.description}</span>
                <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-amber-900 text-2xs shrink-0 ml-2">
                  {occ.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
