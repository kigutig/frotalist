import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, X, AlertTriangle, Truck } from 'lucide-react'
import { Button, ProgressBar, Alert } from '../../components/ui'
import { Step1_Identification } from './steps/Step1_Identification'
import { Step2_Documentation } from './steps/Step2_Documentation'
import { Step3_ExteriorInspection } from './steps/Step3_ExteriorInspection'
import { Step4_InteriorInspection } from './steps/Step4_InteriorInspection'
import { Step5_Safety } from './steps/Step5_Safety'
import { Step6_Cargo } from './steps/Step6_Cargo'
import { Step7_Occurrences } from './steps/Step7_Occurrences'
import { Step8_Photos } from './steps/Step8_Photos'
import { Step9_Review } from './steps/Step9_Review'
import { Step10_Signature } from './steps/Step10_Signature'
import { Step11_Release } from './steps/Step11_Release'
import { DEPARTURE_CHECKLIST_ITEMS } from '../../lib/checklist-items'
import type { ChecklistFormState, CheckItemStatus, OccurrenceSeverity } from '../../types'
import { cn } from '../../lib/utils'

const STEPS = [
  { id: 1, label: 'Identificação', short: 'ID' },
  { id: 2, label: 'Documentação', short: 'DOC' },
  { id: 3, label: 'Exterior', short: 'EXT' },
  { id: 4, label: 'Interior', short: 'INT' },
  { id: 5, label: 'Segurança', short: 'SEG' },
  { id: 6, label: 'Carga', short: 'CRG' },
  { id: 7, label: 'Ocorrências', short: 'OCC' },
  { id: 8, label: 'Fotos', short: 'FOT' },
  { id: 9, label: 'Revisão', short: 'REV' },
  { id: 10, label: 'Assinatura', short: 'ASS' },
  { id: 11, label: 'Liberação', short: 'LIB' },
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

  const totalItems = DEPARTURE_CHECKLIST_ITEMS.length
  const answeredItems = Object.keys(form.items).length
  const progress = Math.round((answeredItems / totalItems) * 100)

  // Count not_ok items
  const notOkItems = Object.values(form.items).filter((s) => s === 'not_ok').length

  // Check if any blocking item is not_ok
  const hasBlockingIssue = DEPARTURE_CHECKLIST_ITEMS.some(
    (item) => item.blocks_release && form.items[item.key] === 'not_ok'
  )

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
    <div className="flex flex-col gap-0 md:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card md:p-5">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Checklist de Saída</h2>
            {form.truck_id && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {form.truck_id}
              </span>
            )}
          </div>
          <div className="mt-2">
            <ProgressBar
              value={answeredItems}
              max={totalItems}
              label={`${answeredItems} / ${totalItems} itens`}
              showPercentage
              color={hasBlockingIssue ? 'red' : notOkItems > 0 ? 'yellow' : 'blue'}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Step indicator — desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-card md:block">
        <div className="flex items-center gap-0 min-w-max">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  step.id === currentStep && 'bg-blue-600 text-white',
                  step.id < currentStep && 'cursor-pointer text-green-700 hover:bg-green-50',
                  step.id > currentStep && 'cursor-default text-slate-400'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold',
                    step.id === currentStep ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  )}>
                    {step.id}
                  </span>
                )}
                <span className="hidden lg:inline">{step.label}</span>
                <span className="lg:hidden">{step.short}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'mx-1 h-0.5 w-4',
                  step.id < currentStep ? 'bg-green-400' : 'bg-slate-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile step indicator */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card md:hidden">
        <span className="text-sm text-slate-500">
          Etapa {currentStep} de {STEPS.length}
        </span>
        <span className="font-semibold text-slate-800">
          {STEPS[currentStep - 1]?.label}
        </span>
      </div>

      {/* Blocking issue banner */}
      {hasBlockingIssue && currentStep >= 7 && (
        <Alert type="error" title="🔴 Caminhão não pode ser liberado">
          Existem itens obrigatórios marcados como "Não OK" que impedem a liberação.
          Resolva os problemas antes de continuar.
        </Alert>
      )}

      {/* Step content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        {currentStep === 1 && <Step1_Identification {...stepProps} />}
        {currentStep === 2 && <Step2_Documentation {...stepProps} />}
        {currentStep === 3 && <Step3_ExteriorInspection {...stepProps} />}
        {currentStep === 4 && <Step4_InteriorInspection {...stepProps} />}
        {currentStep === 5 && <Step5_Safety {...stepProps} />}
        {currentStep === 6 && <Step6_Cargo {...stepProps} />}
        {currentStep === 7 && <Step7_Occurrences {...stepProps} notOkItems={notOkItems} />}
        {currentStep === 8 && <Step8_Photos {...stepProps} />}
        {currentStep === 9 && <Step9_Review {...stepProps} hasBlockingIssue={hasBlockingIssue} />}
        {currentStep === 10 && <Step10_Signature {...stepProps} />}
        {currentStep === 11 && (
          <Step11_Release
            {...stepProps}
            hasBlockingIssue={hasBlockingIssue}
            onComplete={() => navigate('/checklists')}
          />
        )}
      </div>

      {/* Navigation */}
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
            Próximo
          </Button>
        ) : null}
      </div>

      {/* Exit confirm dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Descartar checklist?</h3>
            <p className="mt-2 text-sm text-slate-500">
              O checklist em andamento será descartado. As informações preenchidas serão perdidas.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowExitConfirm(false)}
              >
                Continuar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => navigate('/checklists')}
              >
                Descartar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
