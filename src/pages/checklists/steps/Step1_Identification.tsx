import { useState, useEffect } from 'react'
import { Truck, MapPin } from 'lucide-react'
import { Input, Select } from '../../../components/ui'
import { trucksApi, driversApi } from '../../../lib/api'
import type { StepProps } from './shared'
import type { Truck as TruckType, Driver } from '../../../types'

export function Step1_Identification({ form, onUpdateField }: StepProps) {
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date().toISOString().slice(0, 16)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [tData, dData] = await Promise.all([
        trucksApi.getAll(),
        driversApi.getAll(),
      ])
      setTrucks(tData)
      setDrivers(dData)
      setLoading(false)
    }
    void loadData()
  }, [])

  const truckOptions = trucks
    .filter((t) => t.status === 'available' || t.status === 'in_route')
    .map((t) => ({
      value: t.id,
      label: `${t.internal_code} — ${t.plate} (${t.brand} ${t.model})`,
    }))

  const driverOptions = drivers
    .filter((d) => d.status === 'active')
    .map((d) => ({
      value: d.id,
      label: `${d.name} — CNH Cat. ${d.cnh_category}`,
    }))

  const selectedTruck = trucks.find((t) => t.id === form.truck_id)
  const selectedDriver = drivers.find((d) => d.id === form.driver_id)

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
          onChange={(e) => {
            const trkId = e.target.value
            onUpdateField('truck_id', trkId)
            const t = trucks.find((x) => x.id === trkId)
            if (t && t.mileage) {
              onUpdateField('mileage', t.mileage)
            }
          }}
          options={truckOptions}
          placeholder={loading ? 'Carregando caminhões...' : truckOptions.length === 0 ? 'Nenhum caminhão disponível (cadastre em Caminhões)' : 'Selecione o caminhão...'}
          required
        />

        <Select
          label="Motorista"
          value={form.driver_id}
          onChange={(e) => onUpdateField('driver_id', e.target.value)}
          options={driverOptions}
          placeholder={loading ? 'Carregando motoristas...' : driverOptions.length === 0 ? 'Nenhum motorista ativo (cadastre em Motoristas)' : 'Selecione o motorista...'}
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
          label="Destino da Entrega / Rota"
          placeholder="Ex: Shopping das Academias Campinas"
          value={form.destination}
          onChange={(e) => onUpdateField('destination', e.target.value)}
          leftIcon={MapPin}
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Observações Iniciais
          </label>
          <textarea
            placeholder="Informações adicionais sobre a rota ou carga..."
            value={form.notes}
            onChange={(e) => onUpdateField('notes', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Helper info */}
        {selectedTruck && selectedDriver && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-800">Resumo da Operação</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>🚛 {selectedTruck.internal_code} — {selectedTruck.plate} ({selectedTruck.brand} {selectedTruck.model})</li>
              <li>👤 {selectedDriver.name} — CNH: {selectedDriver.cnh} (Cat. {selectedDriver.cnh_category})</li>
              {form.destination && <li>📍 Destino: {form.destination}</li>}
              {form.mileage > 0 && <li>📏 KM Saída: {form.mileage.toLocaleString('pt-BR')} km</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
