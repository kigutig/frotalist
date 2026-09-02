// Shared types and CheckItem component for all checklist steps
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import type { CheckItemStatus, ChecklistFormState } from '../../../types'
import { cn } from '../../../lib/utils'

export interface StepProps {
  form: ChecklistFormState
  onUpdateField: <K extends keyof ChecklistFormState>(key: K, value: ChecklistFormState[K]) => void
  onUpdateItem: (key: string, status: CheckItemStatus) => void
  onUpdateObservation: (key: string, obs: string) => void
}

interface CheckItemProps {
  itemKey: string
  label: string
  status?: CheckItemStatus
  observation?: string
  required?: boolean
  blocksRelease?: boolean
  onStatusChange: (key: string, status: CheckItemStatus) => void
  onObservationChange: (key: string, obs: string) => void
}

export function CheckItem({
  itemKey,
  label,
  status,
  observation,
  required,
  blocksRelease,
  onStatusChange,
  onObservationChange,
}: CheckItemProps) {
  const isNotOk = status === 'not_ok'

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      isNotOk ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'
    )}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            {required && !blocksRelease && (
              <span className="text-2xs text-slate-400">*</span>
            )}
            {blocksRelease && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-2xs font-semibold text-red-700">
                OBRIGATÓRIO
              </span>
            )}
          </div>
        </div>

        {/* Status buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onStatusChange(itemKey, 'ok')}
            title="OK"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all',
              status === 'ok'
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-slate-200 text-slate-400 hover:border-green-400 hover:text-green-500'
            )}
          >
            <CheckCircle2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => onStatusChange(itemKey, 'not_ok')}
            title="Não OK"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all',
              status === 'not_ok'
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500'
            )}
          >
            <XCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => onStatusChange(itemKey, 'na')}
            title="N/A"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all',
              status === 'na'
                ? 'border-slate-400 bg-slate-400 text-white'
                : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-500'
            )}
          >
            <MinusCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Observation field when not_ok */}
      {isNotOk && (
        <div className="mt-3">
          <textarea
            placeholder="Descreva o problema encontrado... (obrigatório)"
            value={observation ?? ''}
            onChange={(e) => onObservationChange(itemKey, e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none"
          />
        </div>
      )}
    </div>
  )
}

export function StepHeader({
  title,
  description,
  icon: Icon,
  count,
  answered,
}: {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  answered?: number
}) {
  return (
    <div className="border-b border-slate-100 px-5 py-4 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        {count !== undefined && answered !== undefined && (
          <div className="text-right">
            <p className="text-sm font-bold text-slate-700">
              {answered}/{count}
            </p>
            <p className="text-xs text-slate-400">respondidos</p>
          </div>
        )}
      </div>
    </div>
  )
}
