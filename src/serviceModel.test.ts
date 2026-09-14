import { expect, it } from 'vitest'
import { serviceStatus, validateService, type ServiceRecord } from './serviceModel'
const service = { title: 'Oil change', vehicleId: 'v1', dueDate: '2026-09-20', dueMeter: null, completedDate: null } as ServiceRecord
it('classifies date and meter reminders including due today', () => {
  expect(serviceStatus(service, 100, '2026-09-14')).toBe('Due soon')
  expect(serviceStatus(service, 100, '2026-09-21')).toBe('Overdue')
  expect(serviceStatus(service, 100, '2026-09-20')).toBe('Due today')
  expect(serviceStatus({ ...service, dueDate: '', dueMeter: 100 }, 100, '2026-09-14')).toBe('Due now')
  expect(serviceStatus({ ...service, dueDate: '', dueMeter: 200 }, 100, '2026-09-14')).toBe('Scheduled')
  expect(serviceStatus({ ...service, completedDate: '2026-09-14' }, 100, '2026-09-21')).toBe('Completed')
})
it('requires a vehicle, title and a valid date or nonnegative meter', () => {
  expect(validateService(service)).toBe('')
  expect(validateService({ ...service, vehicleId: '' })).toContain('vehicle')
  expect(validateService({ ...service, title: ' ' })).toContain('title')
  expect(validateService({ ...service, dueDate: '', dueMeter: null })).toContain('due')
  expect(validateService({ ...service, dueDate: '2026-02-30' })).toContain('date')
  expect(validateService({ ...service, dueMeter: -1 })).toContain('meter')
})
