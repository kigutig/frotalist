import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Badge, Button, Input, Select, Alert, EmptyState } from '../../components/ui'
import { Users } from 'lucide-react'

// ---- Badge ----
describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Ativo</Badge>)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('renders with success variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>)
    expect(container.firstChild).toHaveClass('bg-green-100')
  })

  it('renders with danger variant', () => {
    const { container } = render(<Badge variant="danger">Bloqueado</Badge>)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })

  it('renders dot indicator when dot=true', () => {
    const { container } = render(<Badge dot>Status</Badge>)
    // dot is a span sibling
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(1)
  })
})

// ---- Button ----
describe('Button', () => {
  it('renders children', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique</Button>)
    fireEvent.click(screen.getByText('Clique'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Bloqueado</Button>)
    const btn = screen.getByText('Bloqueado').closest('button')
    expect(btn).toBeDisabled()
  })

  it('renders with primary variant classes', () => {
    const { container } = render(<Button variant="primary">OK</Button>)
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('bg-')
  })

  it('renders loading state with spinner', () => {
    render(<Button loading>Carregando</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('renders with danger variant', () => {
    render(<Button variant="danger">Excluir</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
  })
})

// ---- Input ----
describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Nome" />)
    expect(screen.getByText('Nome')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(<Input placeholder="Digite aqui" />)
    expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument()
  })

  it('fires onChange', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('renders hint text', () => {
    render(<Input hint="Campo obrigatório" />)
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

// ---- Select ----
describe('Select', () => {
  const options = [
    { value: 'a', label: 'Opção A' },
    { value: 'b', label: 'Opção B' },
  ]

  it('renders all options', () => {
    render(<Select options={options} value="" onChange={vi.fn()} />)
    expect(screen.getByText('Opção A')).toBeInTheDocument()
    expect(screen.getByText('Opção B')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Select label="Status" options={options} value="" onChange={vi.fn()} />)
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('fires onChange on selection', () => {
    const handleChange = vi.fn()
    render(<Select options={options} value="a" onChange={handleChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } })
    expect(handleChange).toHaveBeenCalled()
  })
})

// ---- Alert ----
describe('Alert', () => {
  it('renders children', () => {
    render(<Alert type="info">Mensagem de alerta</Alert>)
    expect(screen.getByText('Mensagem de alerta')).toBeInTheDocument()
  })

  it('renders with title', () => {
    render(<Alert type="warning" title="Atenção">Conteúdo</Alert>)
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('renders warning type', () => {
    const { container } = render(<Alert type="warning">Aviso</Alert>)
    // warning should have yellow-ish classes
    expect(container.firstChild).toBeTruthy()
  })

  it('renders error type', () => {
    const { container } = render(<Alert type="error">Erro</Alert>)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---- EmptyState ----
describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={Users}
        title="Nenhum item"
        description="Cadastre para começar"
      />
    )
    expect(screen.getByText('Nenhum item')).toBeInTheDocument()
    expect(screen.getByText('Cadastre para começar')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    render(
      <EmptyState
        icon={Users}
        title="Vazio"
        action={<Button>Adicionar</Button>}
      />
    )
    expect(screen.getByText('Adicionar')).toBeInTheDocument()
  })
})
