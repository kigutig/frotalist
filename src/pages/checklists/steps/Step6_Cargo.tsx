import { Package } from 'lucide-react'
import { DEPARTURE_CHECKLIST_ITEMS } from '../../../lib/checklist-items'
import { CheckItem, StepHeader, type StepProps } from './shared'

const ITEMS = DEPARTURE_CHECKLIST_ITEMS.filter((i) => i.category === 'cargo')

export function Step6_Cargo({ form, onUpdateItem, onUpdateObservation, onUpdateField }: StepProps) {
  const answered = ITEMS.filter((i) => form.items[i.key] && form.items[i.key] !== 'pending').length

  return (
    <div>
      <StepHeader
        title="Etapa 6 — Carga"
        description="Verifique a carga carregada no veículo"
        icon={Package}
        count={ITEMS.length}
        answered={answered}
      />
      <div className="p-5 md:p-6 space-y-5">
        {/* Cargo metadata */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Quantidade de Volumes
            </label>
            <input
              type="number"
              placeholder="0"
              value={form.cargo_volumes ?? ''}
              onChange={(e) => onUpdateField('cargo_volumes', Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Observações da Carga
            </label>
            <input
              type="text"
              placeholder="Ex: fragil, refrigerado..."
              value={form.cargo_notes ?? ''}
              onChange={(e) => onUpdateField('cargo_notes', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Itens de verificação da carga
        </p>

        {ITEMS.map((item) => (
          <CheckItem
            key={item.key}
            itemKey={item.key}
            label={item.label}
            status={form.items[item.key]}
            observation={form.item_observations[item.key]}
            required={item.is_required}
            blocksRelease={item.blocks_release}
            onStatusChange={onUpdateItem}
            onObservationChange={onUpdateObservation}
          />
        ))}
      </div>
    </div>
  )
}
