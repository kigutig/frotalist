import { useState, useEffect } from 'react'
import {
  Truck,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'
import { Input, Select, Button, Alert } from '../../../components/ui'
import { trucksApi, driversApi } from '../../../lib/api'
import {
  hasDriverPassword,
  verifyDriverPassword,
  saveDriverPassword,
} from '../../../lib/driver-auth'
import type { StepProps } from './shared'
import type { Truck as TruckType, Driver } from '../../../types'

export function Step1_Identification({ form, onUpdateField }: StepProps) {
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date().toISOString().slice(0, 16)

  // Password verification states
  const [enteredPassword, setEnteredPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [authError, setAuthError] = useState('')

  // First-time setup states
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  const [setupError, setSetupError] = useState('')

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
    .filter((t) => t.status === 'available')
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
  const driverHasPassword = hasDriverPassword(selectedDriver)

  function handleSelectDriver(driverId: string) {
    onUpdateField('driver_id', driverId)
    onUpdateField('driver_password_confirmed', false)
    setEnteredPassword('')
    setAuthError('')
    setNewPassword('')
    setConfirmNewPassword('')
    setSetupError('')
  }

  async function handleVerifyPassword() {
    if (!selectedDriver) return
    setIsVerifying(true)
    setAuthError('')
    const ok = await verifyDriverPassword(selectedDriver, enteredPassword)
    if (ok) {
      onUpdateField('driver_password_confirmed', true)
    } else {
      setAuthError(
        `Senha incorreta! Não é permitido iniciar o checklist em nome de ${selectedDriver.name}.`
      )
      onUpdateField('driver_password_confirmed', false)
    }
    setIsVerifying(false)
  }

  async function handleCreatePassword() {
    if (!selectedDriver) return
    if (newPassword.trim().length < 4) {
      setSetupError('A senha deve ter pelo menos 4 caracteres ou dígitos.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setSetupError('As senhas digitadas não coincidem.')
      return
    }
    setIsSettingPassword(true)
    setSetupError('')
    const res = await saveDriverPassword(selectedDriver.id, newPassword.trim())
    if (res.success) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === selectedDriver.id ? { ...d, password_hash: res.hash } : d))
      )
      onUpdateField('driver_password_confirmed', true)
    } else {
      setSetupError(res.error || 'Erro ao salvar a senha do motorista.')
    }
    setIsSettingPassword(false)
  }

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 1 — Identificação</h3>
            <p className="text-xs text-slate-500">Selecione o caminhão, confirme a senha do motorista e o destino</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <div className="space-y-2">
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
            placeholder={loading ? 'Carregando caminhões...' : truckOptions.length === 0 ? 'Nenhum caminhão disponível (veículos em rota, manutenção ou bloqueados)' : 'Selecione o caminhão...'}
            required
          />

          {selectedTruck && selectedTruck.status === 'in_route' && (
            <Alert type="error" className="animate-fade-in text-xs py-2.5">
              ⚠️ O caminhão <strong>{selectedTruck.internal_code} ({selectedTruck.plate})</strong> está atualmente <strong>EM ROTA</strong>.
              Não é permitido criar um novo checklist para um caminhão que já está em viagem. Conclua o retorno da viagem primeiro.
            </Alert>
          )}
        </div>

        <div className="space-y-3">
          <Select
            label="Motorista"
            value={form.driver_id}
            onChange={(e) => handleSelectDriver(e.target.value)}
            options={driverOptions}
            placeholder={loading ? 'Carregando motoristas...' : driverOptions.length === 0 ? 'Nenhum motorista ativo (cadastre em Motoristas)' : 'Selecione o motorista...'}
            required
          />

          {/* Confirmação de senha do motorista logo na Etapa 1 */}
          {selectedDriver && (
            form.driver_password_confirmed ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Motorista Autenticado com Sucesso
                    </p>
                    <p className="text-xs text-emerald-700">
                      Identidade de <strong>{selectedDriver.name}</strong> confirmada por senha própria. Checklist liberado para continuar.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onUpdateField('driver_password_confirmed', false)
                  }}
                  className="text-emerald-700 hover:bg-emerald-100 text-xs"
                >
                  Alterar
                </Button>
              </div>
            ) : driverHasPassword ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Confirme a Senha de {selectedDriver.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Para segurança da frota e para que ninguém use seu nome, digite sua senha própria para prosseguir (pode ser a mesma de quando criou a conta):
                    </p>
                  </div>
                </div>

                {authError && (
                  <Alert type="error" className="text-xs py-2">
                    {authError}
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha de motorista..."
                      value={enteredPassword}
                      onChange={(e) => {
                        setEnteredPassword(e.target.value)
                        if (authError) setAuthError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleVerifyPassword()
                        }
                      }}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void handleVerifyPassword()}
                    loading={isVerifying}
                    disabled={!enteredPassword.trim()}
                  >
                    Confirmar Senha
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      Primeiro checklist de saída de {selectedDriver.name}
                    </p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Crie sua senha própria agora para que ninguém use seu nome em saídas (pode ser a mesma de quando você criou sua conta):
                    </p>
                  </div>
                </div>

                {setupError && (
                  <Alert type="error" className="text-xs py-2">
                    {setupError}
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Criar Senha Própria"
                    type="password"
                    placeholder="Mínimo 4 caracteres..."
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (setupError) setSetupError('')
                    }}
                  />
                  <Input
                    label="Confirmar Senha"
                    type="password"
                    placeholder="Repita a nova senha..."
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value)
                      if (setupError) setSetupError('')
                    }}
                  />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => void handleCreatePassword()}
                  loading={isSettingPassword}
                  disabled={!newPassword || !confirmNewPassword}
                >
                  Salvar Senha e Liberar Checklist
                </Button>
              </div>
            )
          )}
        </div>

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
