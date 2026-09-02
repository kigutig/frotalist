import { useState } from 'react'
import { X, Truck } from 'lucide-react'
import { Button, Input, Select, Textarea } from '../../components/ui'
import type { Truck as TruckType, TruckStatus } from '../../types'

interface TruckFormModalProps {
  truck?: TruckType | null
  onClose: () => void
  onSave: (data: Partial<TruckType>) => void
}

const STATUS_OPTIONS = [
  { value: 'available', label: '🟢 Disponível' },
  { value: 'maintenance', label: '🟡 Em Manutenção' },
  { value: 'blocked', label: '🔴 Bloqueado' },
  { value: 'inactive', label: '⚫ Inativo' },
]

const TYPE_OPTIONS = [
  { value: 'Baú', label: 'Baú' },
  { value: 'Carroceria', label: 'Carroceria' },
  { value: 'Van', label: 'Van' },
  { value: 'Frigorífico', label: 'Frigorífico' },
  { value: 'Plataforma', label: 'Plataforma' },
  { value: 'Tanque', label: 'Tanque' },
  { value: 'Outro', label: 'Outro' },
]

export function TruckFormModal({ truck, onClose, onSave }: TruckFormModalProps) {
  const isEdit = !!truck
  const [form, setForm] = useState({
    internal_code: truck?.internal_code ?? '',
    plate: truck?.plate ?? '',
    brand: truck?.brand ?? '',
    model: truck?.model ?? '',
    year: truck?.year?.toString() ?? new Date().getFullYear().toString(),
    type: truck?.type ?? '',
    capacity: truck?.capacity ?? '',
    mileage: truck?.mileage?.toString() ?? '0',
    status: truck?.status ?? 'available',
    notes: truck?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.internal_code) e.internal_code = 'Código interno é obrigatório.'
    if (!form.plate) e.plate = 'Placa é obrigatória.'
    if (!form.brand) e.brand = 'Marca é obrigatória.'
    if (!form.model) e.model = 'Modelo é obrigatório.'
    if (!form.year || isNaN(Number(form.year))) e.year = 'Ano inválido.'
    if (!form.type) e.type = 'Tipo é obrigatório.'
    if (isNaN(Number(form.mileage))) e.mileage = 'Quilometragem inválida.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setIsSubmitting(true)
    // In a real app: call supabase service
    await new Promise((r) => setTimeout(r, 500))
    onSave({
      ...form,
      year: Number(form.year),
      mileage: Number(form.mileage),
      status: form.status as TruckStatus,
    })
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                {isEdit ? 'Editar Caminhão' : 'Novo Caminhão'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? `Editando ${truck.internal_code}` : 'Preencha os dados do veículo'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código Interno"
              placeholder="TRK-001"
              value={form.internal_code}
              onChange={(e) => setForm({ ...form, internal_code: e.target.value })}
              error={errors.internal_code}
              required
            />
            <Input
              label="Placa"
              placeholder="ABC-1234"
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              error={errors.plate}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Marca"
              placeholder="Volkswagen"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              error={errors.brand}
              required
            />
            <Input
              label="Modelo"
              placeholder="Delivery 11.180"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              error={errors.model}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Ano"
              type="number"
              placeholder="2022"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              error={errors.year}
              required
            />
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={TYPE_OPTIONS}
              placeholder="Selecione..."
              error={errors.type}
            />
            <Input
              label="Capacidade"
              placeholder="7 toneladas"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quilometragem Atual"
              type="number"
              placeholder="0"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              error={errors.mileage}
              required
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TruckStatus })}
              options={STATUS_OPTIONS}
            />
          </div>

          <Textarea
            label="Observações"
            placeholder="Observações adicionais sobre o veículo..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" loading={isSubmitting} type="submit">
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Caminhão'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
