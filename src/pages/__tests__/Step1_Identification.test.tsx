import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Step1_Identification } from '../checklists/steps/Step1_Identification'
import type { ChecklistFormState } from '../../types'
import { hashDriverPassword } from '../../lib/driver-auth'

const { mockTrucks, mockDrivers } = vi.hoisted(() => ({
  mockTrucks: [
    {
      id: 'truck-1',
      internal_code: 'CAM-01',
      plate: 'ABC-1234',
      brand: 'Mercedes-Benz',
      model: 'Accelo',
      mileage: 45000,
      status: 'available',
    },
  ],
  mockDrivers: [
    {
      id: 'driver-1',
      name: 'Carlos Silva',
      cnh: '1234567890',
      cnh_category: 'D',
      status: 'active',
    },
  ],
}))

vi.mock('../../lib/api', () => ({
  trucksApi: {
    getAll: vi.fn().mockResolvedValue(mockTrucks),
  },
  driversApi: {
    getAll: vi.fn().mockResolvedValue(mockDrivers),
    update: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
}))

describe('Step1_Identification - Driver Password Verification', () => {
  const initialForm: ChecklistFormState = {
    truck_id: 'truck-1',
    driver_id: '',
    mileage: 45000,
    destination: 'Campinas',
    notes: '',
    items: {},
    item_observations: {},
    occurrences: [],
    photos: [],
    driver_password_confirmed: false,
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders truck and driver selection fields', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(
        <Step1_Identification
          form={initialForm}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    expect(screen.getByText(/Etapa 1 — Identificação/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Caminhão/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Motorista/i)).toBeInTheDocument()
  })

  it('shows password prompt when a driver with configured password is selected', async () => {
    const onUpdateField = vi.fn()
    const hash = await hashDriverPassword('senha123')

    const { driversApi } = await import('../../lib/api')
    vi.mocked(driversApi.getAll).mockResolvedValueOnce([
      {
        ...mockDrivers[0],
        password_hash: hash,
      } as any,
    ])

    await act(async () => {
      render(
        <Step1_Identification
          form={{ ...initialForm, driver_id: 'driver-1' }}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    expect(screen.getByText(/Confirme a Senha de Carlos Silva/i)).toBeInTheDocument()

    const pwdInput = screen.getByPlaceholderText(/Digite sua senha de motorista/i)
    await act(async () => {
      fireEvent.change(pwdInput, { target: { value: 'senha123' } })
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Senha/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    expect(onUpdateField).toHaveBeenCalledWith('driver_password_confirmed', true)
  })

  it('shows error when wrong driver password is typed in Step 1', async () => {
    const onUpdateField = vi.fn()
    const hash = await hashDriverPassword('senhacerta')

    const { driversApi } = await import('../../lib/api')
    vi.mocked(driversApi.getAll).mockResolvedValueOnce([
      {
        ...mockDrivers[0],
        password_hash: hash,
      } as any,
    ])

    await act(async () => {
      render(
        <Step1_Identification
          form={{ ...initialForm, driver_id: 'driver-1' }}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    const pwdInput = screen.getByPlaceholderText(/Digite sua senha de motorista/i)
    await act(async () => {
      fireEvent.change(pwdInput, { target: { value: 'senhaerrada' } })
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Senha/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    expect(screen.getByText(/Senha incorreta! Não é permitido iniciar o checklist/i)).toBeInTheDocument()
    expect(onUpdateField).toHaveBeenCalledWith('driver_password_confirmed', false)
  })

  it('shows password creation form for first-time driver without password in Step 1', async () => {
    const onUpdateField = vi.fn()

    await act(async () => {
      render(
        <Step1_Identification
          form={{ ...initialForm, driver_id: 'driver-1' }}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    expect(screen.getByText(/Primeiro checklist de saída de Carlos Silva/i)).toBeInTheDocument()

    const newPwdInput = screen.getByLabelText(/Criar Senha Própria/i)
    const confirmPwdInput = screen.getByLabelText(/Confirmar Senha/i)

    await act(async () => {
      fireEvent.change(newPwdInput, { target: { value: 'novasenha456' } })
      fireEvent.change(confirmPwdInput, { target: { value: 'novasenha456' } })
    })

    const saveBtn = screen.getByRole('button', { name: /Salvar Senha e Liberar Checklist/i })
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    expect(onUpdateField).toHaveBeenCalledWith('driver_password_confirmed', true)
  })

  it('filters out in_route trucks from available select options and shows error if selected truck is in_route', async () => {
    const onUpdateField = vi.fn()
    const { trucksApi } = await import('../../lib/api')

    vi.mocked(trucksApi.getAll).mockResolvedValueOnce([
      {
        id: 'truck-avail',
        internal_code: 'CAM-OK',
        plate: 'AAA-1111',
        brand: 'Scania',
        model: 'R450',
        mileage: 30000,
        status: 'available',
      },
      {
        id: 'truck-in-route',
        internal_code: 'CAM-ROTA',
        plate: 'BBB-2222',
        brand: 'Volvo',
        model: 'FH',
        mileage: 80000,
        status: 'in_route',
      },
    ] as any)

    await act(async () => {
      render(
        <Step1_Identification
          form={{ ...initialForm, truck_id: 'truck-in-route' }}
          onUpdateField={onUpdateField}
          onUpdateItem={vi.fn()}
          onUpdateObservation={vi.fn()}
        />
      )
    })

    // CAM-OK should be in options, CAM-ROTA should NOT be in options
    expect(screen.getByText(/CAM-OK — AAA-1111/i)).toBeInTheDocument()
    expect(screen.queryByText(/CAM-ROTA — BBB-2222/i)).not.toBeInTheDocument()

    // But because form.truck_id was set to the in-route truck, warning alert is rendered
    expect(screen.getByText(/está atualmente/i)).toBeInTheDocument()
    expect(screen.getByText(/EM ROTA/i)).toBeInTheDocument()
    expect(screen.getByText(/Não é permitido criar um novo checklist para um caminhão que já está em viagem/i)).toBeInTheDocument()
  })
})
