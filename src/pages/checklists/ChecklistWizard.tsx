import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui'
import { Step1_Identification } from './steps/Step1_Identification'
import { Step7_Occurrences } from './steps/Step7_Occurrences'
import { Step8_Photos } from './steps/Step8_Photos'
import { Step9_Review } from './steps/Step9_Review'
import { Step10_Signature } from './steps/Step10_Signature'
import { Step11_Release } from './steps/Step11_Release'
import type { ChecklistFormState, CheckItemStatus } from '../../types'
import { cn } from '../../lib/utils'

const STEPS = [
  { id: 1, label: 'Identificação', short: 'ID' },
  { id: 2, label: 'Ocorrências', short: 'OCC' },
  { id: 3, label: 'Fotos', short: 'FOT' },
  { id: 4, label: 'Revisão', short: 'REV' },
  { id: 5, label: 'Assinatura', short: 'ASS' },
  { id: 6, label: 'Liberação', short: 'LIB' },
]

const INITIAL_FORM_STATE: ChecklistFormState = {
  truck_id: '',
  driver_id: '',
  mileage: 0,
  destination: '',
  notes: '',
  items: {},
  item_observations: {},
  occurrences: [],
  photos: [],
  cargo_volumes: undefined,
  cargo_notes: '',
}

export function ChecklistWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<ChecklistFormState>({
    ...INITIAL_FORM_STATE,
    truck_id: searchParams.get('truck') ?? '',
  })
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const notOkItems = form.occurrences.length
  const hasBlockingIssue = form.occurrences.some((occ) => occ.severity === 'critical' || occ.severity === 'high')

  const updateFormField = useCallback(<K extends keyof ChecklistFormState>(
    key: K,
    value: ChecklistFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateItemStatus = useCallback((key: string, status: CheckItemStatus) => {
    setForm((prev) => ({
      ...prev,
      items: { ...prev.items, [key]: status },
    }))
  }, [])

  const updateItemObservation = useCallback((key: string, obs: string) => {
    setForm((prev) => ({
      ...prev,
      item_observations: { ...prev.item_observations, [key]: obs },
    }))
  }, [])

  function canProceedStep(): boolean {
    switch (currentStep) {
      case 1:
        return !!(form.truck_id && form.driver_id && form.mileage > 0 && form.destination)
      default:
        return true
    }
  }

  function handleNext() {
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1)
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const stepProps = {
    form,
    onUpdateField: updateFormField,
    onUpdateItem: updateItemStatus,
    onUpdateObservation: updateItemObservation,
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Checklist de Saída</h1>
            <p className="text-xs text-slate-500">Inspeção rápida antes da viagem</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={X}
          onClick={() => setShowExitConfirm(true)}
          className="text-slate-500 hover:text-slate-700"
        >
          Cancelar
        </Button>
      </div>

      {/* Steps Navigation Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id)
                }}
                disabled={step.id > currentStep}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  step.id === currentStep && 'bg-blue-600 text-white shadow-sm',
                  step.id < currentStep && 'text-green-700 hover:bg-green-50',
                  step.id > currentStep && 'cursor-default text-slate-400'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold',
                    step.id === currentStep ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  )}>
                    {step.id}
                  </span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.short}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'mx-1 h-0.5 w-4 md:w-8',
                  step.id < currentStep ? 'bg-green-400' : 'bg-slate-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        {currentStep === 1 && <Step1_Identification {...stepProps} />}
        {currentStep === 2 && <Step7_Occurrences {...stepProps} notOkItems={notOkItems} />}
        {currentStep === 3 && <Step8_Photos {...stepProps} />}
        {currentStep === 4 && <Step9_Review {...stepProps} hasBlockingIssue={hasBlockingIssue} />}
        {currentStep === 5 && <Step10_Signature {...stepProps} />}
        {currentStep === 6 && (
          <Step11_Release
            {...stepProps}
            hasBlockingIssue={hasBlockingIssue}
            onComplete={() => navigate('/checklists')}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card md:static md:shadow-none">
        <Button
          variant="outline"
          leftIcon={ArrowLeft}
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Voltar
        </Button>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hidden sm:inline">Etapa</span>
          <span className="font-bold text-slate-700">{currentStep}</span>
          <span>/</span>
          <span>{STEPS.length}</span>
        </div>

        {currentStep < STEPS.length ? (
          <Button
            variant="primary"
            rightIcon={ArrowRight}
            onClick={handleNext}
            disabled={!canProceedStep()}
          >
            Avançar
          </Button>
        ) : null}
      </div>

      {/* Modal de Cancelar */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800">Sair do checklist?</h3>
            <p className="mt-1 text-sm text-slate-500">
              O progresso atual não salvo será descartado.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowExitConfirm(false)}>
                Continuar preenchendo
              </Button>
              <Button variant="danger" size="sm" onClick={() => navigate('/checklists')}>
                Sim, sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
