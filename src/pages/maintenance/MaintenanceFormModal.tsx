import { useState, useEffect } from 'react'
import { X, Wrench } from 'lucide-react'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { trucksApi, maintenanceApi } from '../../lib/api'
import type { Truck } from '../../types'

interface MaintenanceFormModalProps {
  onClose: () => void
  onSave: () => void
}

const TYPE_OPTIONS = [
  { value: 'preventive', label: 'Preventiva' },
  { value: 'corrective', label: 'Corretiva' },
  { value: 'emergency', label: 'Emergência' },
  { value: 'inspection', label: 'Inspeção' },
  { value: 'tire', label: 'Pneus' },
  { value: 'electrical', label: 'Elétrica' },
  { value: 'mechanical', label: 'Mecânica' },
  { value: 'bodywork', label: 'Lataria' },
  { value: 'other', label: 'Outra' },
]

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluída' },
]

export function MaintenanceFormModal({ onClose, onSave }: MaintenanceFormModalProps) {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [form, setForm] = useState({
    truck_id: '', type: 'corrective', description: '',
    date: new Date().toISOString().slice(0, 10),
    mileage: '', cost: '', workshop: '', parts_used: '',
    status: 'scheduled', notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchTrucks() {
      const data = await trucksApi.getAll()
      setTrucks(data)
    }
    void fetchTrucks()
  }, [])

  const truckOptions = trucks.map((t) => ({ value: t.id, label: `${t.internal_code} — ${t.plate}` }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.truck_id || !form.description) return
    setIsSubmitting(true)
    await maintenanceApi.create({
      truck_id: form.truck_id,
      type: form.type as any,
      description: form.description,
      date: form.date,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      workshop: form.workshop || undefined,
      parts_used: form.parts_used || undefined,
      status: form.status as any,
      notes: form.notes || undefined,
    })
    setIsSubmitting(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100">
              <Wrench className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="font-semibold text-slate-800">Nova Manutenção</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Caminhão" value={form.truck_id} onChange={(e) => setForm({ ...form, truck_id: e.target.value })}
              options={truckOptions} placeholder={truckOptions.length === 0 ? 'Nenhum caminhão cadastrado' : 'Selecione...'} required />
            <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={TYPE_OPTIONS} />
          </div>
          <Textarea label="Descrição" placeholder="Descreva o serviço a ser realizado..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Quilometragem" type="number" placeholder="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
            <Input label="Custo (R$)" type="number" placeholder="0,00" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Oficina" placeholder="Nome da oficina..." value={form.workshop} onChange={(e) => setForm({ ...form, workshop: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
          </div>
          <Textarea label="Peças Utilizadas" placeholder="Liste as peças utilizadas..."
            value={form.parts_used} onChange={(e) => setForm({ ...form, parts_used: e.target.value })} rows={2} />
          <Textarea label="Observações" placeholder="Observações adicionais..."
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" loading={isSubmitting} type="submit">Salvar Manutenção</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
