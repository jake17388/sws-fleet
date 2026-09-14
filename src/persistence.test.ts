import { beforeEach, expect, it, vi } from 'vitest'
const { from, single, insert, update, eq } = vi.hoisted(() => {
  const single = vi.fn()
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => ({ select }))
  return { single, eq, insert: vi.fn((_row: unknown) => ({ select })), update: vi.fn(() => ({ eq })), from: vi.fn() }
})
vi.mock('./supabase', () => ({ supabase: { from } }))
import { persistVehicle } from './persistence'
import { sampleVehicles } from './vehicleModel'
beforeEach(() => { vi.clearAllMocks(); from.mockReturnValue({ insert, update }) })
it('inserts only the new vehicle and returns its database id', async () => {
  single.mockResolvedValue({ data: { id: '8b755398-9c9b-4d93-8bba-e55674a99f45', name: 'New truck' }, error: null })
  const result = await persistVehicle({ ...sampleVehicles[0], id: 'new', name: 'New truck' })
  expect(insert).toHaveBeenCalledOnce()
  expect(insert.mock.calls[0][0]).toMatchObject({ name: 'New truck' })
  expect(result.id).toBe('8b755398-9c9b-4d93-8bba-e55674a99f45')
})
it('updates only the selected persisted vehicle', async () => {
  const id = '8b755398-9c9b-4d93-8bba-e55674a99f45'
  single.mockResolvedValue({ data: { id, name: 'Edited truck' }, error: null })
  await persistVehicle({ ...sampleVehicles[1], id, name: 'Edited truck' })
  expect(eq).toHaveBeenCalledWith('id', id)
  expect(insert).not.toHaveBeenCalled()
})
it('propagates rejected saves instead of claiming success', async () => {
  single.mockResolvedValue({ data: null, error: { message: 'Permission denied' } })
  await expect(persistVehicle({ ...sampleVehicles[0], id: 'new' })).rejects.toThrow('Permission denied')
})
it('reports a missing write confirmation', async () => {
  single.mockResolvedValue({ data: null, error: null })
  await expect(persistVehicle({ ...sampleVehicles[0], id: 'new' })).rejects.toThrow('confirmed')
})
