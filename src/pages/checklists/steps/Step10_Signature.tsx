import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  PenTool,
  Check,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'
import type { StepProps } from './shared'
import { driversApi } from '../../../lib/api'
import {
  hasDriverPassword,
  verifyDriverPassword,
  saveDriverPassword,
} from '../../../lib/driver-auth'
import type { Driver } from '../../../types'
import { Button, Input, Alert } from '../../../components/ui'

interface SignatureCanvasProps {
  label: string
  value: string
  onChange: (dataUrl: string) => void
  placeholder?: string
}

function SignatureCanvas({
  label,
  value,
  onChange,
  placeholder = 'Assine aqui com o mouse ou dedo',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const lastEmittedValue = useRef<string>(value)
  const [hasDrawing, setHasDrawing] = useState(Boolean(value))

  // Draw an image onto the canvas (e.g. from saved state)
  const drawImageOntoCanvas = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!dataUrl) {
      setHasDrawing(false)
      return
    }

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setHasDrawing(true)
    }
    img.src = dataUrl
  }, [])

  // Sync when value changes externally
  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      lastEmittedValue.current = value
      drawImageOntoCanvas(value)
    }
  }, [value, drawImageOntoCanvas])

  // Initial draw if value exists on mount
  useEffect(() => {
    if (value) {
      drawImageOntoCanvas(value)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function getCoordinates(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    // Capture pointer events even if dragging slightly outside canvas
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    isDrawing.current = true
    const { x, y } = getCoordinates(e)
    lastPoint.current = { x, y }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.arc(x, y, 1.25, 0, Math.PI * 2)
    ctx.fill()
    setHasDrawing(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)

    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPoint.current = { x, y }
    if (!hasDrawing) {
      setHasDrawing(true)
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return
    isDrawing.current = false
    lastPoint.current = null

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // ignore
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    lastEmittedValue.current = dataUrl
    onChange(dataUrl)
  }

  function handleClear() {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    setHasDrawing(false)
    lastEmittedValue.current = ''
    onChange('')
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-semibold text-slate-700">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasDrawing ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <Check className="h-3.5 w-3.5" /> Assinado
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Aguardando assinatura</span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Limpar assinatura"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      <div className="relative bg-white select-none">
        <canvas
          ref={canvasRef}
          width={700}
          height={180}
          className="w-full h-36 md:h-44 touch-none cursor-crosshair block"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={(e) => {
            // Only stop if pointer capture was not active
            if (isDrawing.current && !e.currentTarget.hasPointerCapture(e.pointerId)) {
              handlePointerUp(e)
            }
          }}
        />

        {/* Placeholder text when empty */}
        {!hasDrawing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-400 select-none font-medium">{placeholder}</p>
          </div>
        )}

        {/* Signature guideline */}
        <div className="pointer-events-none absolute bottom-5 left-8 right-8 border-b-2 border-dashed border-slate-200 flex items-center justify-between pb-1 text-2xs text-slate-300">
          <span>X</span>
          <span>Linha de assinatura</span>
        </div>
      </div>
    </div>
  )
}

export function Step10_Signature({ form, onUpdateField }: StepProps) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [driverSignature, setDriverSignature] = useState<string>(form.driver_signature ?? '')

  // Driver password confirmation states
  const [isPasswordConfirmed, setIsPasswordConfirmed] = useState<boolean>(
    Boolean(form.driver_password_confirmed)
  )
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
    async function loadDriver() {
      if (form.driver_id) {
        const d = await driversApi.getById(form.driver_id)
        setDriver(d)
      }
    }
    void loadDriver()
  }, [form.driver_id])

  useEffect(() => {
    setIsPasswordConfirmed(Boolean(form.driver_password_confirmed))
  }, [form.driver_password_confirmed])

  async function handleVerifyPassword() {
    if (!driver) return
    setIsVerifying(true)
    setAuthError('')
    const ok = await verifyDriverPassword(driver, enteredPassword)
    if (ok) {
      setIsPasswordConfirmed(true)
      onUpdateField('driver_password_confirmed', true)
    } else {
      setAuthError(
        `Senha incorreta! Não é permitido liberar ou assinar a saída em nome de ${driver.name}.`
      )
      setIsPasswordConfirmed(false)
      onUpdateField('driver_password_confirmed', false)
    }
    setIsVerifying(false)
  }

  async function handleCreatePassword() {
    if (!driver) return
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
    const res = await saveDriverPassword(driver.id, newPassword.trim())
    if (res.success) {
      setDriver((prev) => (prev ? { ...prev, password_hash: res.hash } : null))
      setIsPasswordConfirmed(true)
      onUpdateField('driver_password_confirmed', true)
    } else {
      setSetupError(res.error || 'Erro ao salvar a senha do motorista.')
    }
    setIsSettingPassword(false)
  }

  const driverHasPassword = hasDriverPassword(driver)

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <PenTool className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 5 — Assinatura Digital e Confirmação</h3>
            <p className="text-xs text-slate-500">
              Confirme a identidade do motorista por senha e assine para validar a saída do caminhão.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        {/* Driver identity & password verification section */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                {driver?.name?.charAt(0) ?? 'M'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Identidade do Motorista: <span className="text-blue-600">{driver?.name ?? 'Carregando...'}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Proteção antifraude — apenas o próprio motorista titular pode autorizar
                </p>
              </div>
            </div>

            {isPasswordConfirmed ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Senha Confirmada
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <ShieldAlert className="h-3.5 w-3.5" /> Confirmação Pendente
              </span>
            )}
          </div>

          {/* Password authentication forms */}
          {isPasswordConfirmed ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Motorista Autenticado com Sucesso
                  </p>
                  <p className="text-xs text-emerald-700">
                    {driver?.name} validou a saída através de sua senha própria.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPasswordConfirmed(false)
                  onUpdateField('driver_password_confirmed', false)
                }}
                className="text-emerald-700 hover:bg-emerald-100 text-xs"
              >
                Alterar
              </Button>
            </div>
          ) : driverHasPassword ? (
            /* Motorista já possui senha cadastrada */
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Confirme a Senha de {driver?.name ?? 'Motorista'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Digite a sua senha própria (pode ser a mesma de quando criou a conta) para autorizar a saída em seu nome:
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
            /* Primeiro checklist deste motorista - Criar senha própria */
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Primeiro checklist de saída de {driver?.name ?? 'Motorista'}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Crie uma senha própria agora para que ninguém mais use o seu nome nas próximas saídas (pode ser a mesma de quando você criou sua conta):
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
                Salvar Senha e Confirmar Saída
              </Button>
            </div>
          )}

          {/* Driver signature canvas */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Assinatura na Tela: <span className="text-blue-600 font-bold">{driver?.name ?? 'Motorista'}</span>
              </p>
              {!isPasswordConfirmed && (
                <span className="text-xs text-amber-600 font-medium">
                  * Necessário confirmar a senha acima para liberar
                </span>
              )}
            </div>
            <SignatureCanvas
              label={`Motorista: ${driver?.name ?? 'Motorista'}`}
              value={driverSignature}
              onChange={(v) => {
                setDriverSignature(v)
                onUpdateField('driver_signature', v)
              }}
              placeholder="Desenhe a assinatura do motorista aqui"
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            A senha e a assinatura digital do motorista serão vinculadas ao checklist de saída para registro e auditoria.
          </p>
        </div>
      </div>
    </div>
  )
}
