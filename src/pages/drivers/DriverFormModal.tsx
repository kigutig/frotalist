import { useState, useEffect } from 'react'
import { X, User, Link as LinkIcon } from 'lucide-react'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { usersApi } from '../../lib/api'
import type { Driver, DriverStatus, CNHCategory, User as UserType } from '../../types'

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
  const [users, setUsers] = useState<UserType[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [form, setForm] = useState({
    user_id: driver?.user_id ?? '',
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

  // Carregar lista de usuários para associação
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true)
      const data = await usersApi.getAll()
      setUsers(data)
      setLoadingUsers(false)
    }
    void loadUsers()
  }, [])

  function handleSelectUser(userId: string) {
    const selected = users.find((u) => u.id === userId)
    setForm((prev) => ({
      ...prev,
      user_id: userId,
      name: prev.name || selected?.name || '',
    }))
  }

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
    onSave({
      ...form,
      user_id: form.user_id || undefined,
      status: form.status as DriverStatus,
      cnh_category: form.cnh_category as CNHCategory,
    })
    setIsSubmitting(false)
  }

  const userOptions = [
    { value: '', label: 'Nenhum (não associar a uma conta de usuário)' },
    ...users.map((u) => ({
      value: u.id,
      label: `${u.name || 'Sem nome'} (${u.email})`,
    })),
  ]

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
              <p className="text-xs text-slate-500">
                {isEdit ? `Atualizando ${driver?.name}` : 'Cadastre um novo motorista na frota'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vínculo com Usuário */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs uppercase tracking-wider">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Associar a Usuário do Sistema</span>
            </div>
            <Select
              value={form.user_id}
              onChange={(e) => handleSelectUser(e.target.value)}
              options={userOptions}
              placeholder={loadingUsers ? 'Carregando contas de usuários...' : 'Selecione a conta do usuário...'}
              hint="Permite que o motorista faça login e visualize apenas suas viagens e checklists"
            />
          </div>

          <Input
            label="Nome Completo"
            placeholder="Nome do motorista..."
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
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
              required
            />
          </div>

          <Input
            label="Número da CNH"
            placeholder="Registro da CNH..."
            value={form.cnh}
            onChange={(e) => setForm({ ...form, cnh: e.target.value })}
            error={errors.cnh}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={form.cnh_category}
              onChange={(e) => setForm({ ...form, cnh_category: e.target.value as CNHCategory })}
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
            onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
            options={STATUS_OPTIONS}
          />

          <Textarea
            label="Observações"
            placeholder="Informações adicionais..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" loading={isSubmitting} type="submit">
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Motorista'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
