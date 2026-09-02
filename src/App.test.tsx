import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('SWS Fleet shell', () => {
  it('shows the dashboard overview', () => { render(<App />); expect(screen.getByText('Good morning, Jordan')).toBeInTheDocument(); expect(screen.getByText('Upcoming maintenance')).toBeInTheDocument() })
  it('switches workspace from navigation', () => { render(<App />); fireEvent.click(screen.getByRole('button', { name: 'Vehicles' })); expect(screen.getByRole('heading', { name: 'Vehicles' })).toBeInTheDocument() })
})
