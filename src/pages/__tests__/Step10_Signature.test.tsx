import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Step10_Signature } from '../checklists/steps/Step10_Signature'
import type { ChecklistFormState } from '../../types'
import { hashDriverPassword } from '../../lib/driver-auth'

vi.mock('../../lib/api', () => ({
  driversApi: {
    getById: vi.fn().mockResolvedValue({ id: 'driver-1', name: 'Carlos Motorista' }),
    update: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

  it('renders signature section for driver only', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(<Step10_Signature form={initialForm} onUpdateField={onUpdateField} onUpdateItem={vi.fn()} onUpdateObservation={vi.fn()} />)
    })

    expect(screen.getByText(/Etapa 5 — Assinatura Digital/i)).toBeInTheDocument()
    expect(screen.getByText(/Assinatura na Tela/i)).toBeInTheDocument()
    expect(screen.queryByText(/Responsável pela Conferência/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Aguardando assinatura/i)).toHaveLength(1)
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
    expect(canvases).toHaveLength(1)
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

  it('allows creating password for first-time driver and confirms identity', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(
        <Step10_Signature
          form={initialForm}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    expect(screen.getByText(/Primeiro checklist de saída de Carlos Motorista/i)).toBeInTheDocument()

    const pwdInput = screen.getByLabelText(/Criar Senha Própria/i)
    const confirmInput = screen.getByLabelText(/Confirmar Senha/i)

    await act(async () => {
      fireEvent.change(pwdInput, { target: { value: '123456' } })
      fireEvent.change(confirmInput, { target: { value: '123456' } })
    })

    const saveBtn = screen.getByRole('button', { name: /Salvar Senha e Confirmar Saída/i })
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    expect(onUpdateField).toHaveBeenCalledWith('driver_password_confirmed', true)
    expect(screen.getByText(/Motorista Autenticado com Sucesso/i)).toBeInTheDocument()
  })

  it('verifies existing driver password successfully', async () => {
    const onUpdateField = vi.fn()
    const hash = await hashDriverPassword('senhacarlos')

    // Mock driver with existing password
    const { driversApi } = await import('../../lib/api')
    vi.mocked(driversApi.getById).mockResolvedValueOnce({
      id: 'driver-1',
      name: 'Carlos Motorista',
      password_hash: hash,
    } as any)

    await act(async () => {
      render(
        <Step10_Signature
          form={initialForm}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    expect(screen.getByText(/Confirme a Senha de Carlos Motorista/i)).toBeInTheDocument()

    const pwdInput = screen.getByPlaceholderText(/Digite sua senha de motorista/i)
    await act(async () => {
      fireEvent.change(pwdInput, { target: { value: 'senhacarlos' } })
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Senha/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    expect(onUpdateField).toHaveBeenCalledWith('driver_password_confirmed', true)
    expect(screen.getByText(/Motorista Autenticado com Sucesso/i)).toBeInTheDocument()
  })

  it('shows error when wrong driver password is entered', async () => {
    const onUpdateField = vi.fn()
    const hash = await hashDriverPassword('senhacorreta')

    const { driversApi } = await import('../../lib/api')
    vi.mocked(driversApi.getById).mockResolvedValueOnce({
      id: 'driver-1',
      name: 'Carlos Motorista',
      password_hash: hash,
    } as any)

    await act(async () => {
      render(
        <Step10_Signature
          form={initialForm}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    const pwdInput = screen.getByPlaceholderText(/Digite sua senha de motorista/i)
    await act(async () => {
      fireEvent.change(pwdInput, { target: { value: 'senhaincorreta' } })
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Senha/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    expect(screen.getByText(/Senha incorreta! Não é permitido liberar ou assinar a saída/i)).toBeInTheDocument()
    expect(onUpdateField).toHaveBeenCalledWith('driver_password_confirmed', false)
  })
})
