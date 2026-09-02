import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('SWS Fleet shell', () => {
  it('shows the dashboard overview', () => { render(<App />); expect(screen.getByText('Good morning, Jordan')).toBeInTheDocument(); expect(screen.getByText('Upcoming maintenance')).toBeInTheDocument() })
  it('switches workspace from navigation', () => { render(<App />); fireEvent.click(screen.getAllByRole('button', { name: 'Vehicles' })[0]); expect(screen.getAllByRole('heading', { name: 'Vehicles' }).length).toBeGreaterThan(0) })
  it('shows vehicle fields and lets an administrator watch a vehicle', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Vehicles' })[0])
    expect(screen.getByRole('columnheader', { name: 'VIN' })).toBeInTheDocument()
    expect(screen.getByText('2015 Double Bucket')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Watch 2015 Double Bucket' }))
    expect(screen.getByRole('button', { name: 'Unwatch 2015 Double Bucket' })).toBeInTheDocument()
  })
  it('opens a vehicle detail view and admin form', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Vehicles' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Open 2015 Double Bucket' }))
    expect(screen.getByRole('heading', { name: '2015 Double Bucket' })).toBeInTheDocument()
    expect(screen.getAllByText('Vehicle details').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Edit vehicle' }))
    expect(screen.getByLabelText('License Plate')).toHaveValue('CJ43300')
  })
})
