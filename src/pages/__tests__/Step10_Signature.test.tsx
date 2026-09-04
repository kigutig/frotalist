import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Step10_Signature } from '../checklists/steps/Step10_Signature'
import type { ChecklistFormState } from '../../types'

vi.mock('../../lib/api', () => ({
  driversApi: {
    getById: vi.fn().mockResolvedValue({ id: 'driver-1', name: 'Carlos Motorista' }),
  },
}))

describe('Step10_Signature', () => {
  const initialForm: ChecklistFormState = {
    truck_id: 'truck-1',
    driver_id: 'driver-1',
    mileage: 50000,
    destination: 'São Paulo',
    notes: '',
    items: {},
    item_observations: {},
    occurrences: [],
    photos: [],
    driver_signature: '',
    responsible_signature: '',
    responsible_name: '',
  }

  beforeEach(() => {
    // Mock HTMLCanvasElement context & methods for JSDOM
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      scale: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockSignatureData')
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn()
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn()
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 700,
      height: 180,
    })
  })

  it('renders signature sections for driver and responsible', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(<Step10_Signature form={initialForm} onUpdateField={onUpdateField} onUpdateItem={vi.fn()} onUpdateObservation={vi.fn()} />)
    })

    expect(screen.getByText(/Etapa 5 — Assinatura Digital/i)).toBeInTheDocument()
    expect(screen.getByText(/Responsável pela Conferência/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nome do responsável pelo checklist/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Aguardando assinatura/i)).toHaveLength(2)
  })

  it('allows typing responsible name', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(<Step10_Signature form={initialForm} onUpdateField={onUpdateField} onUpdateItem={vi.fn()} onUpdateObservation={vi.fn()} />)
    })

    const input = screen.getByPlaceholderText(/Nome do responsável pelo checklist/i)
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Supervisor Roberto' } })
    })

    expect(onUpdateField).toHaveBeenCalledWith('responsible_name', 'Supervisor Roberto')
  })

  it('draws on canvas and calls onUpdateField with image data', async () => {
    const onUpdateField = vi.fn()
    let container: HTMLElement
    await act(async () => {
      const res = render(
        <Step10_Signature form={initialForm} onUpdateField={onUpdateField} onUpdateItem={vi.fn()} onUpdateObservation={vi.fn()} />
      )
      container = res.container
    })

    const canvases = container!.querySelectorAll('canvas')
    expect(canvases).toHaveLength(2)
    const driverCanvas = canvases[0]

    // Simulate pointer down, move, and up
    await act(async () => {
      fireEvent.pointerDown(driverCanvas, { clientX: 100, clientY: 50, pointerId: 1 })
      fireEvent.pointerMove(driverCanvas, { clientX: 120, clientY: 60, pointerId: 1 })
      fireEvent.pointerUp(driverCanvas, { pointerId: 1 })
    })

    expect(onUpdateField).toHaveBeenCalledWith('driver_signature', 'data:image/png;base64,mockSignatureData')
  })

  it('clears the signature when clicking Limpar button', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(
        <Step10_Signature
          form={{ ...initialForm, driver_signature: 'data:image/png;base64,existing' }}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    const clearButtons = screen.getAllByRole('button', { name: /Limpar/i })
    await act(async () => {
      fireEvent.click(clearButtons[0])
    })

    expect(onUpdateField).toHaveBeenCalledWith('driver_signature', '')
  })
})
