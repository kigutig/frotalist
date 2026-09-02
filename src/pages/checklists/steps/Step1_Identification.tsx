import { Truck, User, MapPin, Gauge, Clock } from 'lucide-react'
import { Input, Select } from '../../../components/ui'
import { MOCK_TRUCKS, MOCK_DRIVERS } from '../../../lib/mock-data'
import type { StepProps } from './shared'

const TRUCK_OPTIONS = MOCK_TRUCKS
  .filter((t) => t.status === 'available' || t.status === 'in_route')
  .map((t) => ({ value: t.id, label: `${t.internal_code} — ${t.plate} (${MOCK_TRUCKS.find(x => x.id === t.id)?.model})` }))

const DRIVER_OPTIONS = MOCK_DRIVERS
  .filter((d) => d.status === 'active')
  .map((d) => ({ value: d.id, label: `${d.name} — CNH ${d.cnh_category}` }))

export function Step1_Identification({ form, onUpdateField }: StepProps) {
  const now = new Date().toISOString().slice(0, 16)

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 1 — Identificação</h3>
            <p className="text-xs text-slate-500">Selecione o caminhão, motorista e destino</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <Select
          label="Caminhão"
          value={form.truck_id}
          onChange={(e) => onUpdateField('truck_id', e.target.value)}
          options={TRUCK_OPTIONS}
          placeholder="Selecione o caminhão..."
          required
        />

        <Select
          label="Motorista"
          value={form.driver_id}
          onChange={(e) => onUpdateField('driver_id', e.target.value)}
          options={DRIVER_OPTIONS}
          placeholder="Selecione o motorista..."
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data e Horário"
            type="datetime-local"
            defaultValue={now}
            disabled
            hint="Preenchido automaticamente"
          />
          <Input
            label="Quilometragem de Saída"
            type="number"
            placeholder="0"
            value={form.mileage || ''}
            onChange={(e) => onUpdateField('mileage', Number(e.target.value))}
            required
            hint="KM atual do odômetro"
          />
        </div>

        <Input
          label="Destino"
          placeholder="Ex: Shopping das Academias Campinas"
          value={form.destination}
          onChange={(e) => onUpdateField('destination', e.target.value)}
          leftIcon={MapPin}
          required
        />

        <Input
          label="Responsável pelo Checklist"
          placeholder="Nome do operador responsável"
          defaultValue=""
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Observações iniciais
          </label>
          <textarea
            placeholder="Informações adicionais sobre a viagem..."
            value={form.notes}
            onChange={(e) => onUpdateField('notes', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Helper info */}
        {form.truck_id && form.driver_id && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-800">Resumo da operação</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>🚛 {MOCK_TRUCKS.find((t) => t.id === form.truck_id)?.internal_code} — {MOCK_TRUCKS.find((t) => t.id === form.truck_id)?.plate}</li>
              <li>👤 {MOCK_DRIVERS.find((d) => d.id === form.driver_id)?.name}</li>
              {form.destination && <li>📍 Destino: {form.destination}</li>}
              {form.mileage > 0 && <li>📏 KM Saída: {form.mileage.toLocaleString('pt-BR')} km</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
