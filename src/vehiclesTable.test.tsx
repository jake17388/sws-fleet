import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('./supabase', () => ({ supabase: null }))
import { App } from './App'
import { sampleVehicles, saveVehicles } from './vehicleModel'

beforeEach(() => {
  window.history.replaceState({}, '', '/vehicles')
  saveVehicles(Array.from({ length: 12 }, (_, index) => ({
    ...sampleVehicles[0], id: `truck-${index}`, name: `Truck ${String(index + 1).padStart(2, '0')}`,
    status: index === 11 ? 'In maintenance' : 'Active',
  })))
})
afterEach(() => { cleanup(); localStorage.clear() })

it('shows the entire fleet in one table and filters vehicles beyond the former page limit', async () => {
  render(<App />)
  await screen.findByRole('button', { name: 'Open Truck 12' })
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(13)
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'In maintenance' } })
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Open Truck 12' }))
  expect(screen.getByRole('link', { name: 'View service and maintenance' })).toHaveAttribute('href', '/service?vehicle=truck-11')
})

it('explains an empty search and lets the user clear filters', async () => {
  render(<App />)
  await screen.findByRole('button', { name: 'Open Truck 01' })
  fireEvent.change(screen.getByLabelText('Search vehicles'), { target: { value: 'missing' } })
  expect(screen.getByText('No vehicles match your filters.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByRole('button', { name: 'Open Truck 12' })).toBeInTheDocument()
})
