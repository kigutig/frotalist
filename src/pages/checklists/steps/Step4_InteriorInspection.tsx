import { Settings } from 'lucide-react'
import { DEPARTURE_CHECKLIST_ITEMS } from '../../../lib/checklist-items'
import { CheckItem, StepHeader, type StepProps } from './shared'

const ITEMS = DEPARTURE_CHECKLIST_ITEMS.filter((i) => i.category === 'interior')

export function Step4_InteriorInspection({ form, onUpdateItem, onUpdateObservation }: StepProps) {
  const answered = ITEMS.filter((i) => form.items[i.key] && form.items[i.key] !== 'pending').length
  return (
    <div>
      <StepHeader
        title="Etapa 4 — Inspeção Interior"
        description="Verifique a cabine e equipamentos internos"
        icon={Settings}
        count={ITEMS.length}
        answered={answered}
      />
      <div className="space-y-3 p-5 md:p-6">
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
