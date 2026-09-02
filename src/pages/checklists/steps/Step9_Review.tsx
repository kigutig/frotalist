import { ClipboardList, CheckCircle2, XCircle, MinusCircle, AlertTriangle } from 'lucide-react'
import { DEPARTURE_CHECKLIST_ITEMS, CATEGORY_LABELS } from '../../../lib/checklist-items'
import { MOCK_TRUCKS, MOCK_DRIVERS } from '../../../lib/mock-data'
import type { StepProps } from './shared'
import { cn } from '../../../lib/utils'

interface Step9Props extends StepProps {
  hasBlockingIssue: boolean
}

export function Step9_Review({ form, hasBlockingIssue }: Step9Props) {
  const truck = MOCK_TRUCKS.find((t) => t.id === form.truck_id)
  const driver = MOCK_DRIVERS.find((d) => d.id === form.driver_id)

  const totalItems = DEPARTURE_CHECKLIST_ITEMS.length
  const okCount = Object.values(form.items).filter((s) => s === 'ok').length
  const notOkCount = Object.values(form.items).filter((s) => s === 'not_ok').length
  const naCount = Object.values(form.items).filter((s) => s === 'na').length
  const pendingCount = DEPARTURE_CHECKLIST_ITEMS.filter(
    (item) => !form.items[item.key] || form.items[item.key] === 'pending'
  ).length

  const categoryCounts: Record<string, { ok: number; notOk: number; na: number; total: number }> = {}
  DEPARTURE_CHECKLIST_ITEMS.forEach((item) => {
    if (!categoryCounts[item.category]) {
      categoryCounts[item.category] = { ok: 0, notOk: 0, na: 0, total: 0 }
    }
    categoryCounts[item.category].total++
    const status = form.items[item.key]
    if (status === 'ok') categoryCounts[item.category].ok++
    else if (status === 'not_ok') categoryCounts[item.category].notOk++
    else if (status === 'na') categoryCounts[item.category].na++
  })

  const notOkItems = DEPARTURE_CHECKLIST_ITEMS.filter((i) => form.items[i.key] === 'not_ok')

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <ClipboardList className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 9 — Revisão do Checklist</h3>
            <p className="text-xs text-slate-500">Confira todas as informações antes de assinar</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        {/* Trip summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Resumo da viagem
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Caminhão</p>
              <p className="font-semibold text-slate-800">
                {truck ? `${truck.internal_code} — ${truck.plate}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Motorista</p>
              <p className="font-semibold text-slate-800">{driver?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">KM Saída</p>
              <p className="font-semibold text-slate-800 font-mono">
                {form.mileage.toLocaleString('pt-BR')} km
              </p>
            </div>
            <div>
              <p className="text-slate-500">Destino</p>
              <p className="font-semibold text-slate-800">{form.destination || '—'}</p>
            </div>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totalItems, icon: ClipboardList, color: 'text-slate-700 bg-slate-100' },
            { label: 'OK', value: okCount, icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
            { label: 'Não OK', value: notOkCount, icon: XCircle, color: 'text-red-700 bg-red-100' },
            { label: 'N/A', value: naCount, icon: MinusCircle, color: 'text-slate-600 bg-slate-100' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className={cn('rounded-xl p-3 text-center', s.color)}>
                <Icon className="mx-auto mb-1 h-5 w-5" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs font-medium">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Release status */}
        <div className={cn(
          'rounded-xl border-2 p-5 text-center',
          hasBlockingIssue
            ? 'border-red-400 bg-red-50'
            : pendingCount > 0
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-green-400 bg-green-50'
        )}>
          {hasBlockingIssue ? (
            <>
              <p className="text-lg font-bold text-red-700">🔴 CAMINHÃO NÃO LIBERADO</p>
              <p className="mt-1 text-sm text-red-600">
                Existem {notOkCount} pendências obrigatórias que precisam ser resolvidas antes da saída.
              </p>
            </>
          ) : pendingCount > 0 ? (
            <>
              <p className="text-lg font-bold text-yellow-700">🟡 CHECKLIST INCOMPLETO</p>
              <p className="mt-1 text-sm text-yellow-600">
                Ainda há {pendingCount} itens sem resposta.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-green-700">🟢 APROVADO — PRONTO PARA LIBERAR</p>
              <p className="mt-1 text-sm text-green-600">
                Todos os itens verificados. O caminhão pode ser liberado.
              </p>
            </>
          )}
        </div>

        {/* Not-ok items detail */}
        {notOkItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Problemas encontrados
            </p>
            {notOkItems.map((item) => (
              <div key={item.key} className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-800">{item.label}</p>
                  {form.item_observations[item.key] && (
                    <p className="text-xs text-red-600">{form.item_observations[item.key]}</p>
                  )}
                  {item.blocks_release && (
                    <span className="mt-1 inline-block rounded bg-red-200 px-1.5 py-0.5 text-2xs font-bold text-red-800">
                      BLOQUEIA SAÍDA
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Resumo por categoria
          </p>
          {Object.entries(categoryCounts).map(([cat, counts]) => (
            <div key={cat} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-700">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 font-medium">{counts.ok} OK</span>
                {counts.notOk > 0 && <span className="text-red-600 font-bold">{counts.notOk} ✗</span>}
                {counts.na > 0 && <span className="text-slate-400">{counts.na} N/A</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
