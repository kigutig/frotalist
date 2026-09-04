import React, { useRef, useState, useEffect, useCallback } from 'react'
import { PenTool, Trash2, Check, RotateCcw } from 'lucide-react'
import type { StepProps } from './shared'
import { driversApi } from '../../../lib/api'
import type { Driver } from '../../../types'

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
  const [responsibleSignature, setResponsibleSignature] = useState<string>(form.responsible_signature ?? '')
  const [responsibleName, setResponsibleName] = useState(form.responsible_name ?? '')

  useEffect(() => {
    async function loadDriver() {
      if (form.driver_id) {
        const d = await driversApi.getById(form.driver_id)
        setDriver(d)
      }
    }
    void loadDriver()
  }, [form.driver_id])

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <PenTool className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 5 — Assinatura Digital</h3>
            <p className="text-xs text-slate-500">
              Assine para confirmar o checklist. Desenhe na área indicada com o mouse ou toque na tela.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        {/* Driver signature */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {driver?.name?.charAt(0) ?? 'M'}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Assinatura do Motorista: <span className="text-blue-600 font-bold">{driver?.name ?? 'Motorista'}</span>
            </p>
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

        {/* Responsible person */}
        <div>
          <div className="mb-2">
            <label htmlFor="resp-name-input" className="block text-sm font-semibold text-slate-700">
              Responsável pela Conferência
            </label>
          </div>
          <input
            id="resp-name-input"
            type="text"
            placeholder="Nome do responsável pelo checklist..."
            value={responsibleName}
            onChange={(e) => {
              setResponsibleName(e.target.value)
              onUpdateField('responsible_name', e.target.value)
            }}
            className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <SignatureCanvas
            label={`Responsável: ${responsibleName.trim() || 'Conferente'}`}
            value={responsibleSignature}
            onChange={(v) => {
              setResponsibleSignature(v)
              onUpdateField('responsible_signature', v)
            }}
            placeholder="Desenhe a assinatura do responsável aqui"
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            As assinaturas digitais serão vinculadas ao checklist e registradas de forma auditável.
          </p>
        </div>
      </div>
    </div>
  )
}
