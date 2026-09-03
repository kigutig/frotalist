import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { StepProps } from './shared'
import type { Occurrence, OccurrenceSeverity } from '../../../types'
import { DEPARTURE_CHECKLIST_ITEMS, CATEGORY_LABELS } from '../../../lib/checklist-items'
import { OCCURRENCE_SEVERITY_LABELS, OCCURRENCE_SEVERITY_COLORS, cn } from '../../../lib/utils'

interface Step7Props extends StepProps {
  notOkItems?: number
}

export function Step7_Occurrences({ form, onUpdateField }: Step7Props) {
  // Build occurrences from not_ok items
  const autoOccurrences = DEPARTURE_CHECKLIST_ITEMS.filter(
    (item) => form.items[item.key] === 'not_ok'
  ).map((item) => ({
    item_key: item.key,
    category: item.category,
    item_label: item.label,
    observation: form.item_observations[item.key] ?? '',
    blocksRelease: item.blocks_release,
  }))

  const manualOccurrences = (form.occurrences ?? []) as Partial<Occurrence>[]

  function addManualOccurrence() {
    onUpdateField('occurrences', [
      ...manualOccurrences,
      {
        severity: 'medium',
        description: '',
        status: 'open',
      },
    ])
  }

  function removeOccurrence(idx: number) {
    const updated = [...manualOccurrences]
    updated.splice(idx, 1)
    onUpdateField('occurrences', updated)
  }

  function updateOccurrence(idx: number, field: string, value: string) {
    const updated = [...manualOccurrences]
    updated[idx] = { ...updated[idx], [field]: value }
    onUpdateField('occurrences', updated)
  }

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 7 — Ocorrências</h3>
            <p className="text-xs text-slate-500">Detalhes dos problemas encontrados</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        {/* Auto-detected from not_ok items */}
        {autoOccurrences.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Problemas detectados ({autoOccurrences.length})
            </p>
            {autoOccurrences.map((occ) => (
              <div
                key={occ.item_key}
                className={cn(
                  'rounded-xl border p-4',
                  occ.blocksRelease ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-orange-50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{occ.item_label}</p>
                    <p className="text-xs text-slate-500">
                      {CATEGORY_LABELS[occ.category ?? ''] ?? occ.category}
                      {occ.blocksRelease && (
                        <span className="ml-2 rounded bg-red-200 px-1.5 py-0.5 text-2xs font-bold text-red-800">
                          BLOQUEIA SAÍDA
                        </span>
                      )}
                    </p>
                  </div>
                  <AlertTriangle className={cn('h-4 w-4 shrink-0', occ.blocksRelease ? 'text-red-600' : 'text-orange-500')} />
                </div>
                {occ.observation && (
                  <div className="mt-3 rounded-lg bg-white border border-slate-200 px-3 py-2">
                    <p className="text-xs text-slate-500">Descrição</p>
                    <p className="text-sm text-slate-700">{occ.observation}</p>
                  </div>
                )}

                {/* Severity selector for auto occurrence */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as OccurrenceSeverity[]).map((sev) => {
                    const colors = OCCURRENCE_SEVERITY_COLORS[sev]
                    return (
                      <button
                        key={sev}
                        className={cn(
                          'rounded-lg border px-2 py-1.5 text-xs font-medium transition-all',
                          colors.badge
                        )}
                      >
                        {OCCURRENCE_SEVERITY_LABELS[sev]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual occurrences */}
        {manualOccurrences.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ocorrências adicionais
            </p>
            {manualOccurrences.map((occ, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Ocorrência #{idx + 1}</p>
                  <button
                    onClick={() => removeOccurrence(idx)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  placeholder="Descrição detalhada do problema..."
                  value={occ.description ?? ''}
                  onChange={(e) => updateOccurrence(idx, 'description', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as OccurrenceSeverity[]).map((sev) => {
                    const colors = OCCURRENCE_SEVERITY_COLORS[sev]
                    return (
                      <button
                        key={sev}
                        onClick={() => updateOccurrence(idx, 'severity', sev)}
                        className={cn(
                          'rounded-lg border px-2 py-1.5 text-xs font-medium transition-all',
                          occ.severity === sev ? colors.badge : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        )}
                      >
                        {OCCURRENCE_SEVERITY_LABELS[sev]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {autoOccurrences.length === 0 && manualOccurrences.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-10 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Nenhuma ocorrência detectada</p>
            <p className="mt-1 text-xs text-slate-400">
              Itens marcados como "Não OK" aparecerão aqui automaticamente.
            </p>
          </div>
        )}

        <Button variant="outline" leftIcon={Plus} onClick={addManualOccurrence} className="w-full">
          Adicionar ocorrência manual
        </Button>
      </div>
    </div>
  )
}
