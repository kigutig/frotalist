import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Step8_Photos } from '../checklists/steps/Step8_Photos'
import type { ChecklistPhoto } from '../../types'

describe('Step8_Photos', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-photo')
  })

  it('renders photo type buttons and allows changing type', async () => {
    const onUpdateField = vi.fn()
    await act(async () => {
      render(
        <Step8_Photos
          form={{ photos: [] }}
          onUpdateField={onUpdateField}
        />
      )
    })

    expect(screen.getByText('Fotos do Veículo')).toBeInTheDocument()
    expect(screen.getByText(/📷 Frontal/i)).toBeInTheDocument()
    expect(screen.getByText(/📷 Traseira/i)).toBeInTheDocument()

    // Click on Traseira
    const rearButton = screen.getByText(/📷 Traseira/i)
    await act(async () => {
      fireEvent.click(rearButton)
    })

    expect(rearButton.className).toContain('bg-blue-600')
  })

  it('allows adding photos through file input', async () => {
    const onUpdateField = vi.fn()
    let container: HTMLElement
    await act(async () => {
      const res = render(
        <Step8_Photos
          form={{ photos: [] }}
          onUpdateField={onUpdateField}
        />
      )
      container = res.container
    })

    const descInput = screen.getByPlaceholderText(/Descrição opcional da foto/i)
    await act(async () => {
      fireEvent.change(descInput, { target: { value: 'Foto lateral avaria' } })
    })

    const fileInput = container!.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['mock-image-content'], 'truck-front.jpg', { type: 'image/jpeg' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    expect(onUpdateField).toHaveBeenCalledWith('photos', expect.arrayContaining([
      expect.objectContaining({
        description: 'Foto lateral avaria',
        url: 'blob:http://localhost/mock-photo',
      })
    ]))
  })

  it('renders existing photos and allows removing and updating description', async () => {
    const onUpdateField = vi.fn()
    const mockPhotos: Partial<ChecklistPhoto>[] = [
      {
        id: 'p1',
        photo_type: 'front',
        description: 'Foto da frente',
        url: 'blob:http://localhost/front',
      },
      {
        id: 'p2',
        photo_type: 'tires',
        description: 'Pneus ok',
        url: 'blob:http://localhost/tires',
      },
    ]

    await act(async () => {
      render(
        <Step8_Photos
          form={{ photos: mockPhotos }}
          onUpdateField={onUpdateField}
          title="Fotos do Retorno"
          subtitle="Registre o estado do veículo no retorno"
        />
      )
    })

    expect(screen.getByText('Fotos do Retorno')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Foto da frente')).toBeInTheDocument()

    // Test updating description
    const descInputs = screen.getAllByPlaceholderText(/Descrição\.\.\./i)
    await act(async () => {
      fireEvent.change(descInputs[0], { target: { value: 'Frente com arranhão' } })
    })

    expect(onUpdateField).toHaveBeenCalledWith('photos', expect.arrayContaining([
      expect.objectContaining({ id: 'p1', description: 'Frente com arranhão' }),
    ]))

    // Test removing photo
    const removeButtons = screen.getAllByLabelText(/Remover foto/i)
    await act(async () => {
      fireEvent.click(removeButtons[0])
    })

    expect(onUpdateField).toHaveBeenCalledWith('photos', [mockPhotos[1]])
  })
})
