import { Truck } from 'lucide-react'
import { DEPARTURE_CHECKLIST_ITEMS, CATEGORY_LABELS } from '../../../lib/checklist-items'
import { CheckItem, StepHeader, type StepProps } from './shared'

const ITEMS = DEPARTURE_CHECKLIST_ITEMS.filter((i) => i.category === 'exterior')

export function Step3_ExteriorInspection({ form, onUpdateItem, onUpdateObservation }: StepProps) {
  const answered = ITEMS.filter((i) => form.items[i.key] && form.items[i.key] !== 'pending').length

  return (
    <div>
      <StepHeader
        title="Etapa 3 — Inspeção Exterior"
        description="Verifique a parte externa do veículo"
        icon={Truck}
        count={ITEMS.length}
        answered={answered}
      />
      <div className="space-y-3 p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {CATEGORY_LABELS.exterior}
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
