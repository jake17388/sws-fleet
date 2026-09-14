import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('./supabase', () => ({ supabase: null }))
import { App } from './App'

afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); localStorage.clear() })

describe('SWS Fleet shell', () => {
  it('uses the Summit West Signs fleet brand and labels unfinished destinations', () => {
    render(<App />)
    expect(screen.getByText('Summit West Signs')).toBeInTheDocument()
    expect(screen.getByText('Fleet Management')).toBeInTheDocument()
    expect(screen.getAllByText('Coming Soon')).toHaveLength(4)
  })
  it('uses the supplied vehicle and service icons with spaced sidebar labels', () => {
    render(<App />)
    const vehicleLink = screen.getAllByRole('link', { name: 'Vehicles' })[0]
    const serviceLink = screen.getAllByRole('link', { name: 'Service' })[0]
    expect(vehicleLink.querySelector('img')).toHaveAttribute('src', '/sws-fleet/car.png')
    expect(serviceLink.querySelector('img')).toHaveAttribute('src', '/sws-fleet/wrench.png')
    expect(vehicleLink.querySelector('.nav-label')).toHaveTextContent('Vehicles')
    expect(serviceLink.querySelector('.nav-label')).toHaveTextContent('Service')
    expect(vehicleLink).toHaveStyle({ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr) auto' })
  })
  it('lets the user select and persist a dark appearance', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: /Preferences/ }))
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('sws-fleet.theme.v1')).toBe('dark')
  })
  it('shows the dashboard overview', () => { render(<App />); expect(screen.getByText('Good morning, Jake')).toBeInTheDocument(); expect(screen.getByText('Upcoming maintenance')).toBeInTheDocument() })
  it('opens settings from navigation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: 'Account details' })).toBeInTheDocument()
    expect(screen.getAllByText('Jake Banks').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /User management/ }))
    expect(screen.getByRole('heading', { name: 'User management' })).toBeInTheDocument()
  })
  it('switches workspace from navigation', () => { render(<App />); fireEvent.click(screen.getAllByRole('link', { name: 'Vehicles' })[0]); expect(screen.getAllByRole('heading', { name: 'Vehicles' }).length).toBeGreaterThan(0) })
  it('shows vehicle fields and lets an administrator watch a vehicle', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('link', { name: 'Vehicles' })[0])
    expect(screen.getAllByRole('columnheader', { name: 'VIN' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('2015 Double Bucket').length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole('button', { name: 'Watch 2015 Double Bucket' })[0])
    expect(screen.getAllByRole('button', { name: 'Unwatch 2015 Double Bucket' }).length).toBeGreaterThan(0)
  })
  it('opens a vehicle detail view and admin form', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('link', { name: 'Vehicles' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Open 2015 Double Bucket' })[0])
    expect(window.location.pathname).toBe('/vehicles/vehicle-1')
    expect(screen.getByRole('heading', { name: '2015 Double Bucket' })).toBeInTheDocument()
    expect(screen.getAllByText('Vehicle details').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Edit vehicle' }))
    expect(screen.getByLabelText('License Plate')).toHaveValue('CJ43300')
  })
  it('opens vehicle actions from a three dot menu', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('link', { name: 'Vehicles' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Actions for 2015 Double Bucket' }))
    expect(screen.getByRole('menuitem', { name: 'View vehicle' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit vehicle' })).toBeInTheDocument()
  })
})
