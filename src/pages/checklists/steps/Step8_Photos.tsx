import { useState, useRef } from 'react'
import { Camera, Upload, Trash2, X, ImageIcon } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { StepProps } from './shared'
import type { ChecklistPhoto } from '../../../types'

const PHOTO_TYPES = [
  { value: 'front', label: '📷 Frontal' },
  { value: 'rear', label: '📷 Traseira' },
  { value: 'left', label: '📷 Lateral Esq.' },
  { value: 'right', label: '📷 Lateral Dir.' },
  { value: 'tires', label: '🔵 Pneus' },
  { value: 'cargo', label: '📦 Carga' },
  { value: 'panel', label: '🎛️ Painel' },
  { value: 'issue', label: '⚠️ Problema' },
  { value: 'other', label: '📸 Outro' },
]

export function Step8_Photos({ form, onUpdateField }: StepProps) {
  const photos = (form.photos ?? []) as Partial<ChecklistPhoto>[]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedType, setSelectedType] = useState<string>('front')
  const [selectedDescription, setSelectedDescription] = useState('')

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newPhotos = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      storage_path: URL.createObjectURL(file),
      url: URL.createObjectURL(file),
      photo_type: selectedType as ChecklistPhoto['photo_type'],
      description: selectedDescription || file.name,
      created_at: new Date().toISOString(),
    }))
    onUpdateField('photos', [...photos, ...newPhotos] as Partial<ChecklistPhoto>[])
    setSelectedDescription('')
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto(idx: number) {
    const updated = [...photos]
    updated.splice(idx, 1)
    onUpdateField('photos', updated)
  }

  function updatePhotoDescription(idx: number, desc: string) {
    const updated = [...photos]
    updated[idx] = { ...updated[idx], description: desc }
    onUpdateField('photos', updated)
  }

  return (
    <div>
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Camera className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Etapa 8 — Fotos</h3>
            <p className="text-xs text-slate-500">
              Fotografe o veículo e registre qualquer problema visual
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        {/* Upload area */}
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
              <Camera className="h-7 w-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700">Adicionar foto</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Clique para selecionar ou arraste aqui. JPG, PNG, WEBP até 10MB.
              </p>
            </div>

            {/* Type selector */}
            <div className="flex flex-wrap justify-center gap-2">
              {PHOTO_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Descrição opcional da foto..."
              value={selectedDescription}
              onChange={(e) => setSelectedDescription(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                leftIcon={Camera}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment')
                    fileInputRef.current.click()
                  }
                }}
              >
                Tirar Foto
              </Button>
              <Button
                variant="outline"
                leftIcon={Upload}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture')
                    fileInputRef.current.click()
                  }
                }}
              >
                Galeria
              </Button>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fotos adicionadas ({photos.length})
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={photo.url ?? photo.storage_path}
                    alt={photo.description ?? ''}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => removePhoto(idx)}
                      className="self-end rounded-full bg-red-500 p-1"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    <div>
                      <p className="text-xs text-white/80">
                        {PHOTO_TYPES.find((t) => t.value === photo.photo_type)?.label ?? photo.photo_type}
                      </p>
                      <input
                        type="text"
                        value={photo.description ?? ''}
                        onChange={(e) => updatePhotoDescription(idx, e.target.value)}
                        placeholder="Descrição..."
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-full rounded bg-black/30 px-2 py-0.5 text-xs text-white placeholder-white/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {photos.length === 0 && (
          <div className="text-center">
            <p className="text-sm text-slate-400">
              Nenhuma foto adicionada. As fotos são opcionais, mas recomendadas para registrar o estado do veículo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
