import { beforeEach, expect, it, vi } from 'vitest'
const { from, single, insert, update, eq, is, order } = vi.hoisted(() => {
  const single = vi.fn(), order = vi.fn()
  const select = vi.fn(() => ({ single, order }))
  const is = vi.fn(() => ({ select })), eq = vi.fn(() => ({ is }))
  return { single, is, eq, order, insert: vi.fn(() => ({ select })), update: vi.fn(() => ({ eq })), from: vi.fn() }
})
vi.mock('./supabase', () => ({ supabase: { from } }))
import { fetchServices, persistService, validateService, type ServiceRecord } from './serviceModel'
const record: ServiceRecord = { id: '', vehicleId: 'vehicle-id', title: 'Oil change', dueDate: '', dueMeter: 0, meterUnit: 'mi', notes: '', provider: '', completedDate: null, completedMeter: null, cost: null }
const row = { id: 'record-id', vehicle_id: 'vehicle-id', title: 'Oil change', due_meter: 0, meter_unit: 'mi' }
beforeEach(() => { vi.clearAllMocks(); from.mockReturnValue({ insert, update, select: () => ({ order }) }) })
it('loads remote records and surfaces database errors', async () => {
  order.mockResolvedValueOnce({ data: [row], error: null })
  expect(await fetchServices()).toEqual([{ ...record, id: 'record-id' }])
  order.mockResolvedValueOnce({ data: null, error: { message: 'Missing table' } })
  await expect(fetchServices()).rejects.toThrow('Missing table')
})
it('retains server IDs on create and only updates incomplete records', async () => {
  single.mockResolvedValue({ data: row, error: null })
  expect((await persistService(record)).id).toBe('record-id')
  expect(insert).toHaveBeenCalledOnce()
  await persistService({ ...record, id: 'record-id' })
  expect(eq).toHaveBeenCalledWith('id', 'record-id')
  expect(is).toHaveBeenCalledWith('completed_date', null)
})
it('rejects invalid input and unconfirmed or rejected writes', async () => {
  await expect(persistService({ ...record, title: '' })).rejects.toThrow('title')
  expect(insert).not.toHaveBeenCalled()
  single.mockResolvedValueOnce({ data: null, error: { message: 'Not allowed' } })
  await expect(persistService(record)).rejects.toThrow('Not allowed')
  single.mockResolvedValueOnce({ data: null, error: null })
  await expect(persistService(record)).rejects.toThrow('confirmed')
})
it('validates completion dates, readings and cost', () => {
  const completed = { ...record, completedDate: '2026-01-01', completedMeter: 0, cost: 0 }
  expect(validateService(completed)).toBe('')
  expect(validateService({ ...completed, completedDate: '2099-01-01' })).toContain('date')
  expect(validateService({ ...completed, completedDate: '2026-02-30' })).toContain('date')
  expect(validateService({ ...completed, completedMeter: null })).toContain('meter')
  expect(validateService({ ...completed, completedMeter: -1 })).toContain('meter')
  expect(validateService({ ...completed, cost: null })).toContain('cost')
  expect(validateService({ ...completed, cost: -1 })).toContain('cost')
})
