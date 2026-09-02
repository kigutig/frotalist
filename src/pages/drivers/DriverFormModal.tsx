import { useState } from 'react'
import { X, User } from 'lucide-react'
import { Button, Input, Select, Textarea } from '../../components/ui'
import type { Driver, DriverStatus, CNHCategory } from '../../types'

interface DriverFormModalProps {
  driver?: Driver | null
  onClose: () => void
  onSave: (data: Partial<Driver>) => void
}

const CNH_CATEGORIES: { value: string; label: string }[] = [
  { value: 'A', label: 'A — Motocicleta' },
  { value: 'B', label: 'B — Automóvel' },
  { value: 'C', label: 'C — Caminhão (leve)' },
  { value: 'D', label: 'D — Ônibus / Caminhão' },
  { value: 'E', label: 'E — Combinações' },
  { value: 'AB', label: 'AB' },
  { value: 'AC', label: 'AC' },
  { value: 'AD', label: 'AD' },
  { value: 'AE', label: 'AE' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: '🟢 Ativo' },
  { value: 'inactive', label: '⚫ Inativo' },
  { value: 'blocked', label: '🔴 Bloqueado' },
]

export function DriverFormModal({ driver, onClose, onSave }: DriverFormModalProps) {
  const isEdit = !!driver
  const [form, setForm] = useState({
    name: driver?.name ?? '',
    cpf: driver?.cpf ?? '',
    phone: driver?.phone ?? '',
    cnh: driver?.cnh ?? '',
    cnh_category: driver?.cnh_category ?? 'D',
    cnh_expiration: driver?.cnh_expiration ?? '',
    status: driver?.status ?? 'active',
    notes: driver?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name) e.name = 'Nome é obrigatório.'
    if (!form.cpf) e.cpf = 'CPF é obrigatório.'
    if (!form.phone) e.phone = 'Telefone é obrigatório.'
    if (!form.cnh) e.cnh = 'Número da CNH é obrigatório.'
    if (!form.cnh_expiration) e.cnh_expiration = 'Validade da CNH é obrigatória.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    onSave({ ...form, status: form.status as DriverStatus, cnh_category: form.cnh_category as CNHCategory })
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                {isEdit ? 'Editar Motorista' : 'Novo Motorista'}
              </h2>
              <p className="text-xs text-slate-500">Preencha os dados do motorista</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Input
            label="Nome Completo"
            placeholder="João da Silva"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              error={errors.cpf}
              required
            />
            <Input
              label="Telefone"
              placeholder="(11) 99999-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Número da CNH"
              placeholder="12345678901"
              value={form.cnh}
              onChange={(e) => setForm({ ...form, cnh: e.target.value })}
              error={errors.cnh}
              required
            />
            <Select
              label="Categoria"
              value={form.cnh_category}
              onChange={(e) => setForm({ ...form, cnh_category: e.target.value })}
              options={CNH_CATEGORIES}
            />
            <Input
              label="Validade da CNH"
              type="date"
              value={form.cnh_expiration}
              onChange={(e) => setForm({ ...form, cnh_expiration: e.target.value })}
              error={errors.cnh_expiration}
              required
            />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={STATUS_OPTIONS}
          />

          <Textarea
            label="Observações"
            placeholder="Observações adicionais..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" loading={isSubmitting} type="submit">
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Motorista'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
