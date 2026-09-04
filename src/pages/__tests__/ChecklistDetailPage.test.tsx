import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import React from 'react'
import { ChecklistDetailPage } from '../checklists/ChecklistDetailPage'
import { checklistsApi } from '../../lib/api'
import type { Checklist } from '../../types'

vi.mock('../../lib/api', () => ({
  checklistsApi: {
    getById: vi.fn(),
  },
}))

describe('ChecklistDetailPage', () => {
  const mockChecklist: Checklist = {
    id: 'ckl-123',
    truck_id: 'truck-1',
    driver_id: 'driver-1',
    type: 'departure',
    status: 'released',
    started_at: '2026-09-04T10:00:00Z',
    mileage: 45200,
    destination: 'Campinas - SP',
    truck: {
      id: 'truck-1',
      plate: 'ABC-1234',
      internal_code: 'ABC-1234',
      model: 'Volvo FH 540',
      brand: 'Volvo',
      year: 2022,
      type: 'truck',
      status: 'available',
      mileage: 45200,
      created_at: '2024-01-01',
    },
    driver: {
      id: 'driver-1',
      name: 'João Silva',
      cpf: '12345678901',
      phone: '11999999999',
      cnh: '987654321',
      cnh_category: 'E',
      cnh_expiration: '2028-12-31',
      status: 'active',
      created_at: '2024-01-01',
    },
    items: [
      {
        id: 'item-1',
        checklist_id: 'ckl-123',
        category: 'exterior',
        item_key: 'tires',
        item_label: 'Calibragem dos Pneus',
        status: 'ok',
        is_required: true,
      },
    ],
    photos: [
      {
        id: 'photo-1',
        checklist_id: 'ckl-123',
        storage_path: 'https://example.com/front.jpg',
        url: 'https://example.com/front.jpg',
        photo_type: 'front',
        description: 'Foto frontal do caminhão',
        created_at: '2026-09-04T10:05:00Z',
      },
      {
        id: 'photo-2',
        checklist_id: 'ckl-123',
        storage_path: 'https://example.com/tires.jpg',
        url: 'https://example.com/tires.jpg',
        photo_type: 'tires',
        description: 'Pneu dianteiro direito',
        created_at: '2026-09-04T10:06:00Z',
      },
    ],
    driver_signature: 'data:image/png;base64,sigDriver',
    responsible_signature: 'data:image/png;base64,sigResp',
    responsible_name: 'Supervisor Carlos',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders checklist details and photos section with images', async () => {
    vi.mocked(checklistsApi.getById).mockResolvedValue(mockChecklist)

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/checklists/ckl-123']}>
          <Routes>
            <Route path="/checklists/:id" element={<ChecklistDetailPage />} />
          </Routes>
        </MemoryRouter>
      )
    })

    // Header & vehicle info
    expect(screen.getByText(/Checklist de Saída/i)).toBeInTheDocument()
    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
    expect(screen.getAllByText('João Silva')).toHaveLength(2)

    // Photos section
    expect(screen.getByRole('heading', { name: /Fotos Registradas/i })).toBeInTheDocument()
    expect(screen.getByText('Foto frontal do caminhão')).toBeInTheDocument()
    expect(screen.getByText('Pneu dianteiro direito')).toBeInTheDocument()
    expect(screen.getByText('📷 Frontal')).toBeInTheDocument()
    expect(screen.getByText('🔵 Pneus')).toBeInTheDocument()

    // Lightbox interaction
    const frontPhotoCard = screen.getByText('Foto frontal do caminhão')
    await act(async () => {
      fireEvent.click(frontPhotoCard)
    })

    expect(screen.getByTitle('Fechar')).toBeInTheDocument()

    // Close lightbox
    await act(async () => {
      fireEvent.click(screen.getByTitle('Fechar'))
    })

    expect(screen.queryByTitle('Fechar')).not.toBeInTheDocument()
  })

  it('renders empty photos state when checklist has no photos', async () => {
    vi.mocked(checklistsApi.getById).mockResolvedValue({
      ...mockChecklist,
      photos: [],
    })

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/checklists/ckl-123']}>
          <Routes>
            <Route path="/checklists/:id" element={<ChecklistDetailPage />} />
          </Routes>
        </MemoryRouter>
      )
    })

    expect(screen.getByRole('heading', { name: /Fotos Registradas/i })).toBeInTheDocument()
    expect(screen.getByText('Nenhuma foto registrada')).toBeInTheDocument()
  })

  it('renders not found state when checklist does not exist', async () => {
    vi.mocked(checklistsApi.getById).mockResolvedValue(null)

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/checklists/ckl-999']}>
          <Routes>
            <Route path="/checklists/:id" element={<ChecklistDetailPage />} />
          </Routes>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Checklist não encontrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Voltar aos Checklists/i })).toBeInTheDocument()
  })

  it('renders items with non-conformities, notes, and release justification', async () => {
    vi.mocked(checklistsApi.getById).mockResolvedValue({
      ...mockChecklist,
      release_justification: 'Autorizado pelo gerente de frota',
      notes: 'Entregar com urgência',
      items: [
        {
          id: 'item-1',
          checklist_id: 'ckl-123',
          category: 'exterior',
          item_key: 'tires',
          item_label: 'Calibragem dos Pneus',
          status: 'not_ok',
          observation: 'Pneu com baixa pressão',
          is_required: true,
        },
      ],
    })

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/checklists/ckl-123']}>
          <Routes>
            <Route path="/checklists/:id" element={<ChecklistDetailPage />} />
          </Routes>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Autorizado pelo gerente de frota')).toBeInTheDocument()
    expect(screen.getByText('Entregar com urgência')).toBeInTheDocument()
    expect(screen.getByText(/Itens com Não Conformidade \/ Avarias \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Obs: Pneu com baixa pressão/i)).toBeInTheDocument()
  })
})
