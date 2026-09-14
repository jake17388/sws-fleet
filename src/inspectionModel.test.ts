import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: null }))

import {
  createInspectionIssue,
  inspectionStatus,
  isInspectionOverdue,
  loadInspectionTemplates,
  requiredInspectionItemsMissing,
  validateInspectionTemplate,
  type Inspection,
  type InspectionTemplate,
} from './inspectionModel'

beforeEach(() => localStorage.clear())

const template: InspectionTemplate = {
  id: 'template-1', name: 'Pre-trip inspection', description: 'Daily truck safety check',
  vehicleTypes: ['Truck'], vehicleIds: [], cadenceDays: 1, archivedAt: null,
  createdAt: '2026-09-14T12:00:00.000Z', updatedAt: '2026-09-14T12:00:00.000Z',
  items: [
    { id: 'item-1', label: 'Service brakes', responseType: 'pass_fail_na', required: true, instructions: 'Confirm firm pedal pressure.', position: 0 },
    { id: 'item-2', label: 'Odometer', responseType: 'meter', required: true, instructions: '', position: 1 },
    { id: 'item-3', label: 'Additional notes', responseType: 'text', required: false, instructions: '', position: 2 },
  ],
}

const inspection: Inspection = {
  id: 'inspection-1', templateId: template.id, templateName: template.name, vehicleId: 'vehicle-1',
  status: 'Draft', notes: '', startedAt: '2026-09-14T12:00:00.000Z', submittedAt: null,
  updatedAt: '2026-09-14T12:00:00.000Z', responses: [],
}

describe('inspection templates', () => {
  it('seeds a Summit West Signs pre-trip truck template', async () => {
    const templates = await loadInspectionTemplates()
    expect(templates[0].name).toBe('SWS Truck Pre-Trip Inspection')
    expect(templates[0].vehicleTypes).toContain('Truck')
    expect(templates[0].items.some(item => item.label.match(/brake/i))).toBe(true)
    expect(templates[0].items.some(item => item.responseType === 'photo')).toBe(true)
  })

  it('validates template names, assignments, and items', () => {
    expect(validateInspectionTemplate({ ...template, name: '' })).toMatch(/name/i)
    expect(validateInspectionTemplate({ ...template, vehicleTypes: [], vehicleIds: [] })).toMatch(/assign/i)
    expect(validateInspectionTemplate({ ...template, items: [] })).toMatch(/item/i)
    expect(validateInspectionTemplate(template)).toBe('')
  })
})

describe('inspection completion', () => {
  it('lists unanswered required items', () => {
    expect(requiredInspectionItemsMissing(template, inspection)).toEqual(['Service brakes', 'Odometer'])
  })

  it('derives passed and failed submission states', () => {
    const complete = { ...inspection, responses: [
      { itemId: 'item-1', value: 'pass', notes: '', photoPaths: [] },
      { itemId: 'item-2', value: 24500, notes: '', photoPaths: [] },
    ] }
    expect(inspectionStatus(template, complete)).toBe('Passed')
    expect(inspectionStatus(template, { ...complete, responses: [{ itemId: 'item-1', value: 'fail', notes: '', photoPaths: [] }, complete.responses[1]] })).toBe('Failed')
  })

  it('detects overdue recurring inspections', () => {
    expect(isInspectionOverdue(template, [], 'vehicle-1', new Date('2026-09-16T12:00:00Z'))).toBe(true)
    expect(isInspectionOverdue(template, [{ ...inspection, status: 'Passed', submittedAt: '2026-09-16T08:00:00Z' }], 'vehicle-1', new Date('2026-09-16T12:00:00Z'))).toBe(false)
  })

  it('creates an issue linked to the failed response and vehicle', () => {
    const issue = createInspectionIssue(inspection, template.items[0])
    expect(issue).toMatchObject({ vehicleId: 'vehicle-1', inspectionId: 'inspection-1', inspectionItemId: 'item-1', status: 'Open' })
  })
})
