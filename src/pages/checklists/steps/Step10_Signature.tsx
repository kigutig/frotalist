import { useRef, useState } from 'react'
import { PenTool, Trash2, Check } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { StepProps } from './shared'
import { MOCK_DRIVERS } from '../../../lib/mock-data'

export function Step10_Signature({ form, onUpdateField }: StepProps) {
  const driver = MOCK_DRIVERS.find((d) => d.id === form.driver_id)
  const [driverSignature, setDriverSignature] = useState<string>(form.driver_signature ?? '')
  const [responsibleSignature, setResponsibleSignature] = useState<string>(form.responsible_signature ?? '')
  const [responsibleName, setResponsibleName] = useState(form.responsible_name ?? '')
  const [activeCanvas, setActiveCanvas] = useState<'driver' | 'responsible' | null>(null)

  // Simple canvas-based signature
  function SignatureCanvas({
    label,
    value,
    onChange,
    onActivate,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    onActivate: () => void
  }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const [hasDrawing, setHasDrawing] = useState(!!value)

    function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
          y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
        }
      }
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    function startDrawing(e: React.MouseEvent | React.TouchEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      isDrawing.current = true
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      onActivate()
    }

    function draw(e: React.MouseEvent | React.TouchEvent) {
      if (!isDrawing.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const pos = getPos(e, canvas)
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#1e3a8a'
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setHasDrawing(true)
    }

    function stopDrawing() {
      if (!isDrawing.current) return
      isDrawing.current = false
      const canvas = canvasRef.current
      if (!canvas) return
      const data = canvas.toDataURL('image/png')
      onChange(data)
    }

    function clearCanvas() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawing(false)
      onChange('')
    }

    return (
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <PenTool className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-slate-700">{label}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasDrawing && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check className="h-3.5 w-3.5" /> Assinado
              </span>
            )}
            <button
              onClick={clearCanvas}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
              title="Limpar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {value ? (
          <div className="flex items-center justify-center bg-slate-50 p-4">
            <img src={value} alt="Assinatura" className="max-h-24 w-full object-contain" />
          </div>
        ) : (
          <div className="relative bg-slate-50">
            <canvas
              ref={canvasRef}
              width={600}
              height={140}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={(e) => { e.preventDefault(); draw(e) }}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-slate-400">Assine aqui</p>
              </div>
            )}
            <div className="absolute bottom-0 left-8 right-8 border-b-2 border-dashed border-slate-300" />
          </div>
        )}
      </div>
    )
  }

  function saveSignatures() {
    onUpdateField('driver_signature', driverSignature)
    onUpdateField('responsible_signature', responsibleSignature)
    onUpdateField('responsible_name', responsibleName)
  }

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <PenTool className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 10 — Assinatura Digital</h3>
            <p className="text-xs text-slate-500">
              Assine para confirmar o checklist. Use o mouse ou toque na tela.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        {/* Driver signature */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {driver?.name?.charAt(0) ?? 'M'}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Assinatura do Motorista: {driver?.name ?? 'Motorista'}
            </p>
          </div>
          <SignatureCanvas
            label="Motorista"
            value={driverSignature}
            onChange={(v) => {
              setDriverSignature(v)
              onUpdateField('driver_signature', v)
            }}
            onActivate={() => setActiveCanvas('driver')}
          />
        </div>

        {/* Responsible person */}
        <div>
          <div className="mb-2">
            <p className="text-sm font-semibold text-slate-700">Responsável pela Conferência</p>
          </div>
          <input
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
            label="Responsável"
            value={responsibleSignature}
            onChange={(v) => {
              setResponsibleSignature(v)
              onUpdateField('responsible_signature', v)
            }}
            onActivate={() => setActiveCanvas('responsible')}
          />
        </div>

        <p className="text-xs text-slate-400 text-center">
          As assinaturas serão vinculadas ao checklist e não poderão ser alteradas após a liberação.
        </p>
      </div>
    </div>
  )
}
