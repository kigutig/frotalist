import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock the API
vi.mock('../../lib/api', () => ({
  driversApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  usersApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}))

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
    isAdmin: true,
    isOperator: false,
  }),
}))

import { DriversPage } from '../../pages/drivers/DriversPage'
import { driversApi } from '../../lib/api'

const mockDrivers = [
  {
    id: '1',
    name: 'João Silva',
    cpf: '12345678901',
    phone: '11987654321',
    cnh: '12345678',
    cnh_category: 'E',
    cnh_expiration: '2026-12-31',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Maria Santos',
    cpf: '98765432100',
    phone: '11912345678',
    cnh: '87654321',
    cnh_category: 'D',
    cnh_expiration: '2025-06-15',
    status: 'inactive',
    created_at: '2024-02-01T00:00:00Z',
  },
]

function renderWithRouter(component: React.ReactElement) {
  return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('DriversPage', () => {
  beforeEach(() => {
    vi.mocked(driversApi.getAll).mockResolvedValue(mockDrivers as any)
  })

  it('shows loading state initially', () => {
    renderWithRouter(<DriversPage />)
    expect(screen.getByText(/Carregando motoristas/i)).toBeInTheDocument()
  })

  it('renders driver list after loading', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })
  })

  it('shows driver count in header', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => {
      expect(screen.getByText(/2 motoristas cadastrados/i)).toBeInTheDocument()
    })
  })

  it('filters drivers by search term', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => screen.getByText('João Silva'))

    const searchInput = screen.getByPlaceholderText(/Buscar por nome/i)
    fireEvent.change(searchInput, { target: { value: 'João' } })

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
  })

  it('filters drivers by status', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => screen.getByText('João Silva'))

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'inactive' } })

    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
  })

  it('shows "Novo Motorista" button', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => {
      expect(screen.getByText('Novo Motorista')).toBeInTheDocument()
    })
  })

  it('opens form modal when "Novo Motorista" is clicked', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => screen.getByText('Novo Motorista'))

    fireEvent.click(screen.getByText('Novo Motorista'))
    // Modal should appear — look for a form field
    await waitFor(() => {
      expect(screen.getByText('Cadastre um novo motorista na frota')).toBeInTheDocument()
    })
  })

  it('shows empty state when no drivers match search', async () => {
    renderWithRouter(<DriversPage />)
    await waitFor(() => screen.getByText('João Silva'))

    const searchInput = screen.getByPlaceholderText(/Buscar por nome/i)
    fireEvent.change(searchInput, { target: { value: 'XXXXXXXXXXX' } })

    await waitFor(() => {
      expect(screen.getByText(/Nenhum motorista cadastrado/i)).toBeInTheDocument()
    })
  })
})
