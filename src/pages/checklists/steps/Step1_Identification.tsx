import { useState, useEffect } from 'react'
import {
  Truck,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Navigation,
  Clock,
  Fuel,
  Sparkles,
  RotateCcw,
  Route,
} from 'lucide-react'
import { Input, Select, Button, Alert } from '../../../components/ui'
import { trucksApi, driversApi, tripsApi } from '../../../lib/api'
import {
  hasDriverPassword,
  verifyDriverPassword,
  saveDriverPassword,
} from '../../../lib/driver-auth'
import {
  calculateRouteDistanceAndETA,
  FIXED_DEPARTURE_ORIGIN,
  type RouteCalculationResult,
} from '../../../lib/route-calculator'
import { checkTruckRodizio } from '../../../lib/rodizio'
import {
  fetchInternetDate,
  getNetworkDate,
  formatToSaoPauloDatetimeInput,
} from '../../../lib/server-time'
import type { StepProps } from './shared'
import type { Truck as TruckType, Driver, Trip } from '../../../types'

export function Step1_Identification({ form, onUpdateField }: StepProps) {
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  // Data e hora oficial sincronizada via Internet (Horário de Brasília)
  const [currentNetworkTime, setCurrentNetworkTime] = useState(() =>
    formatToSaoPauloDatetimeInput(getNetworkDate())
  )
  const [isTimeSynced, setIsTimeSynced] = useState(false)

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

  // Route & ETA calculation states - Origem Fixa no Galpão 01 de Cotia
  const origin = FIXED_DEPARTURE_ORIGIN
  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [routeError, setRouteError] = useState('')

  useEffect(() => {
    if (!form.origin || form.origin !== FIXED_DEPARTURE_ORIGIN) {
      onUpdateField('origin', FIXED_DEPARTURE_ORIGIN)
    }
  }, [form.origin, onUpdateField])

  // Sincroniza a data e hora oficial diretamente via Internet / Servidor em nuvem
  useEffect(() => {
    let active = true
    void fetchInternetDate().then((res) => {
      if (active) {
        setCurrentNetworkTime(formatToSaoPauloDatetimeInput(res.date))
        setIsTimeSynced(res.isNetworkVerified)
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [tData, dData, trData] = await Promise.all([
        trucksApi.getAll(),
        driversApi.getAll(),
        tripsApi.getAll(),
      ])
      setTrucks(tData)
      setDrivers(dData)
      setTrips(trData)
      setLoading(false)
    }
    void loadData()
  }, [])

  // Mapeia motoristas com viagem ativa em rota
  const inRouteDriverMap = new Map(
    trips.filter((t) => t.status === 'in_route').map((t) => [t.driver_id, t])
  )

  const truckOptions = trucks
    .filter((t) => t.status === 'available')
    .map((t) => {
      const rodizio = checkTruckRodizio(t.plate)
      const rodizioBadge = rodizio.isRodizioToday ? ' ⚠️ [Rodízio Hoje]' : ''
      return {
        value: t.id,
        label: `${t.internal_code} — ${t.plate} (${t.brand} ${t.model})${rodizioBadge}`,
      }
    })

  const driverOptions = drivers
    .filter((d) => d.status === 'active' && !inRouteDriverMap.has(d.id))
    .map((d) => ({
      value: d.id,
      label: `${d.name} — CNH Cat. ${d.cnh_category}`,
    }))

  const selectedTruck = trucks.find((t) => t.id === form.truck_id)
  const selectedTruckRodizio = selectedTruck ? checkTruckRodizio(selectedTruck.plate) : null
  const selectedDriver = drivers.find((d) => d.id === form.driver_id)
  const selectedDriverTrip = inRouteDriverMap.get(form.driver_id)
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

  async function triggerRouteCalculation(dest = form.destination, orig = origin) {
    if (!dest || dest.trim().length < 3) {
      setRouteResult(null)
      setRouteError('')
      return
    }

    setIsCalculatingRoute(true)
    setRouteError('')
    try {
      const res = await calculateRouteDistanceAndETA(orig, dest)
      setRouteResult(res)
      onUpdateField('origin', orig)
      onUpdateField('estimated_distance_km', res.distanceKm)
      onUpdateField('estimated_duration_minutes', res.durationMinutes)
      onUpdateField('estimated_arrival', res.estimatedArrival.toISOString())
    } catch (err: any) {
      setRouteError(err?.message || 'Não foi possível estimar a rota.')
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Debounce para recalcular rota quando destino ou origem mudarem
  useEffect(() => {
    if (!form.destination || form.destination.trim().length < 3) return
    const timer = setTimeout(() => {
      void triggerRouteCalculation(form.destination, origin)
    }, 800)
    return () => clearTimeout(timer)
  }, [form.destination, origin])

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

          {selectedTruck && selectedTruckRodizio?.isRodizioToday && (
            <div className={`rounded-xl border p-3.5 space-y-1.5 animate-fade-in ${
              selectedTruckRodizio.isTruckRestrictedNow
                ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50/80 text-amber-950'
                : 'border-amber-300 bg-amber-50/70 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-white text-xs font-bold shrink-0">
                  ⚠️
                </span>
                <p className="text-xs font-bold text-amber-950">
                  {selectedTruckRodizio.isTruckRestrictedNow
                    ? `RESTRIÇÃO DE RODÍZIO ATIVA AGORA — Final ${selectedTruckRodizio.lastDigit}`
                    : `Atenção: Dia de Rodízio Hoje — Final ${selectedTruckRodizio.lastDigit}`}
                </p>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  Placa: {selectedTruck.plate}
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Este veículo possui placa com final <strong>{selectedTruckRodizio.lastDigit}</strong> ({selectedTruckRodizio.rodizioDayName}).
                A restrição para caminhões na <strong>ZMRC (Zona de Máxima Restrição de Circulação de SP)</strong> vigora das <strong>05h00 às 21h00</strong>.
                Certifique-se de que a rota de entrega não cruze vias restritas neste horário para evitar autuações.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Select
            label="Motorista"
            value={form.driver_id}
            onChange={(e) => handleSelectDriver(e.target.value)}
            options={driverOptions}
            placeholder={loading ? 'Carregando motoristas...' : driverOptions.length === 0 ? 'Nenhum motorista disponível (motoristas em viagem, inativos ou bloqueados)' : 'Selecione o motorista...'}
            required
          />

          {selectedDriver && selectedDriverTrip && (
            <Alert type="error" className="animate-fade-in text-xs py-2.5">
              ⚠️ O motorista <strong>{selectedDriver.name}</strong> está atualmente <strong>EM VIAGEM</strong>
              {selectedDriverTrip.truck ? ` no caminhão ${selectedDriverTrip.truck.internal_code} (${selectedDriverTrip.truck.plate})` : ''} com destino a <strong>{selectedDriverTrip.destination}</strong>.
              Não é permitido iniciar um novo checklist para um motorista que já está em rota. Conclua o retorno da viagem primeiro.
            </Alert>
          )}

          {/* Confirmação de senha do motorista logo na Etapa 1 */}
          {selectedDriver && !selectedDriverTrip && (
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
            label="Data e Horário Oficial"
            type="datetime-local"
            value={currentNetworkTime}
            disabled
            hint={
              isTimeSynced
                ? '🌐 Sincronizado via Internet (Horário de Brasília)'
                : '🌐 Sincronizando relógio oficial via Internet...'
            }
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

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Route className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Trajeto e Destino da Viagem</h4>
                <p className="text-xs text-slate-500">Calcula automaticamente a distância em KM e previsão de chegada do motorista</p>
              </div>
            </div>
            {routeResult && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Rota Calculada
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  Local de Saída (Origem Fixa)
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                  <Lock className="h-2.5 w-2.5" /> Endereço Fixo
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-100/80 p-2.5 text-xs text-slate-700">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 leading-tight">
                    Galpão 01 — Jardim do Rio Cotia
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                    {origin}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Destino da Entrega / Rota *"
                placeholder="Ex: Campinas, Santos, Av. Paulista..."
                value={form.destination}
                onChange={(e) => onUpdateField('destination', e.target.value)}
                leftIcon={Navigation}
                required
                hint="Cidade, polo ou endereço de entrega"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void triggerRouteCalculation(form.destination, origin)}
              loading={isCalculatingRoute}
              disabled={!form.destination || form.destination.trim().length < 3}
              className="text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Recalcular Rota & ETA
            </Button>

            {isCalculatingRoute && (
              <span className="text-xs text-blue-600 flex items-center gap-1.5 animate-pulse font-medium">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                Calculando rodovias e tempo de viagem...
              </span>
            )}
          </div>

          {/* Erro de cálculo se houver */}
          {routeError && (
            <Alert type="warning" className="text-xs py-2">
              {routeError}
            </Alert>
          )}

          {/* Card de Resultados da Rota (Distância, Duração, ETA e Combustível) */}
          {routeResult && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white p-4 shadow-sm animate-fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold">
                    IA
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Estimativa Logística de Rota (Caminhões Pesados)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      De: {routeResult.originFormatted} ➔ Para: {routeResult.destinationFormatted}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  routeResult.source === 'osrm'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-amber-100 text-amber-700 border-amber-300'
                }`}>
                  {routeResult.source === 'osrm' ? 'OSRM / Malha Rodoviária' : 'Estimativa Logística'}
                </span>
              </div>

              {/* Grid com os 4 indicadores principais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                    <Route className="h-3.5 w-3.5 text-blue-600" />
                    Distância
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {routeResult.distanceKm.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500">km</span>
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    Tempo Estimado
                  </div>
                  <p className="text-lg font-bold text-amber-900">
                    {routeResult.durationFormatted}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Previsão Chegada
                  </div>
                  <p className="text-sm font-bold text-emerald-800 leading-tight">
                    {routeResult.estimatedArrivalFormatted}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                    <Fuel className="h-3.5 w-3.5 text-purple-600" />
                    Diesel Est.
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    ~{routeResult.fuelEstimateLiters} <span className="text-xs font-normal text-slate-500">L</span>
                  </p>
                </div>
              </div>

              {/* Insights e Paradas Regulamentares */}
              <div className="space-y-1 pt-1 border-t border-blue-100/70">
                {routeResult.insights.map((insight, idx) => (
                  <p key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <span className="text-blue-500">•</span> {insight}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

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
              {selectedTruckRodizio?.isRodizioToday && (
                <li className="font-semibold text-amber-800">
                  ⚠️ Rodízio SP Hoje: Placa final {selectedTruckRodizio.lastDigit} (Restrição ZMRC: 05h às 21h)
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
