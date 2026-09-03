import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import React from 'react'

vi.mock('../../lib/api', () => ({
  tripsApi: {
    getAll: vi.fn(),
    update: vi.fn(),
  },
  checklistsApi: {
    create: vi.fn(),
    saveItems: vi.fn(),
  },
  trucksApi: {
    update: vi.fn(),
  },
}))

import { TripReturnPage } from '../../pages/trips/TripReturnPage'
import { tripsApi, checklistsApi, trucksApi } from '../../lib/api'

const mockTripInRoute = {
  id: 'trip-1',
  truck_id: 'truck-1',
  driver_id: 'driver-1',
  origin: 'Pátio Central',
  destination: 'Shopping Campinas',
  departure_at: '2025-01-15T08:00:00Z',
  departure_mileage: 150000,
  status: 'in_route',
  created_at: '2025-01-15T07:00:00Z',
  created_by: 'user-1',
  truck: { id: 'truck-1', internal_code: 'TRK-001', plate: 'ABC-1234', brand: 'Volvo', model: 'FH', year: 2022, type: 'truck', mileage: 150000, status: 'in_route', created_at: '' },
  driver: { id: 'driver-1', name: 'João Silva', cpf: '12345678901', phone: '11987654321', cnh: '12345678', cnh_category: 'E', cnh_expiration: '2026-12-31', status: 'active', created_at: '' },
}

const mockTripReturned = { ...mockTripInRoute, status: 'returned' }

function renderPage(tripId = 'trip-1') {
  return render(
    <MemoryRouter initialEntries={[`/trips/${tripId}/return`]}>
      <Routes>
        <Route path="/trips/:id/return" element={<TripReturnPage />} />
        <Route path="/trips" element={<div>Trips List</div>} />
        <Route path="/trips/:id" element={<div>Trip Detail</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TripReturnPage', () => {
  beforeEach(() => {
    vi.mocked(tripsApi.getAll).mockResolvedValue([mockTripInRoute] as any)
    vi.mocked(checklistsApi.create).mockResolvedValue({ data: { id: 'ckl-1' }, error: null } as any)
    vi.mocked(checklistsApi.saveItems).mockResolvedValue({ error: null } as any)
    vi.mocked(tripsApi.update).mockResolvedValue({ data: {}, error: null } as any)
    vi.mocked(trucksApi.update).mockResolvedValue({ data: {}, error: null } as any)
  })

  it('shows loading state initially', () => {
    renderPage()
    expect(screen.getByText(/Carregando viagem/i)).toBeInTheDocument()
  })

  it('renders step 1 — Resumo after load', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Resumo da Viagem')).toBeInTheDocument()
    })
  })

  it('shows trip details in step 1', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('TRK-001 — ABC-1234')).toBeInTheDocument()
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Shopping Campinas')).toBeInTheDocument()
    })
  })

  it('shows page header with trip info', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Registrar Retorno')).toBeInTheDocument()
    })
  })

  it('has 5 steps in the progress bar', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Resumo da Viagem'))

    // Step labels
    expect(screen.getByText('Resumo')).toBeInTheDocument()
    expect(screen.getByText('Quilometragem')).toBeInTheDocument()
    expect(screen.getByText('Ocorrências')).toBeInTheDocument()
    expect(screen.getByText('Entregas')).toBeInTheDocument()
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
  })

  it('advances to step 2 when Avançar is clicked', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Resumo da Viagem'))

    fireEvent.click(screen.getByText('Avançar'))

    await waitFor(() => {
      expect(screen.getByText('Quilometragem de Retorno')).toBeInTheDocument()
    })
  })

  it('blocks advance on step 2 if KM is invalid', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Resumo da Viagem'))
    fireEvent.click(screen.getByText('Avançar'))
    await waitFor(() => screen.getByText('Quilometragem de Retorno'))

    // Clear mileage
    const input = screen.getByPlaceholderText(/Ex: 185000/i)
    fireEvent.change(input, { target: { value: '0' } })

    const avancarBtn = screen.getByText('Avançar')
    expect(avancarBtn.closest('button')).toBeDisabled()
  })

  it('allows advance on step 2 with valid KM', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Resumo da Viagem'))
    fireEvent.click(screen.getByText('Avançar'))
    await waitFor(() => screen.getByText('Quilometragem de Retorno'))

    const input = screen.getByPlaceholderText(/Ex: 185000/i)
    fireEvent.change(input, { target: { value: '155000' } })

    const avancarBtn = screen.getByText('Avançar')
    expect(avancarBtn.closest('button')).not.toBeDisabled()
  })

  it('shows distance when return KM > departure KM', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Resumo da Viagem'))
    fireEvent.click(screen.getByText('Avançar'))
    await waitFor(() => screen.getByText('Quilometragem de Retorno'))

    const input = screen.getByPlaceholderText(/Ex: 185000/i)
    fireEvent.change(input, { target: { value: '155000' } })

    await waitFor(() => {
      expect(screen.getByText('Distância percorrida')).toBeInTheDocument()
    })
  })

  it('shows "not in route" warning for returned trip', async () => {
    vi.mocked(tripsApi.getAll).mockResolvedValue([mockTripReturned] as any)
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Esta viagem não está em rota/i)).toBeInTheDocument()
    })
  })

  it('shows "not found" for unknown trip ID', async () => {
    vi.mocked(tripsApi.getAll).mockResolvedValue([])
    renderPage('unknown-id')
    await waitFor(() => {
      expect(screen.getByText(/Viagem não encontrada/i)).toBeInTheDocument()
    })
  })

  it('goes back to step 1 from step 2 via Voltar button', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Resumo da Viagem'))
    fireEvent.click(screen.getByText('Avançar'))
    await waitFor(() => screen.getByText('Quilometragem de Retorno'))

    fireEvent.click(screen.getByText('Voltar'))
    await waitFor(() => {
      expect(screen.getByText('Resumo da Viagem')).toBeInTheDocument()
    })
  })
})
