import { supabase } from './supabase'

export type ServiceRecord = {
  id: string
  vehicleId: string
  title: string
  dueDate: string
  dueMeter: number | null
  meterUnit: 'mi' | 'hr'
  notes: string
  completedDate: string | null
  completedMeter: number | null
  cost: number | null
  provider: string
}
export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
export function validateService(record: ServiceRecord): string {
  if (!record.vehicleId) return 'Choose a vehicle.'
  if (!record.title.trim()) return 'Enter a service title.'
  if (!record.dueDate && record.dueMeter === null) return 'Enter a due date or due meter.'
  if (record.dueDate && !validDate(record.dueDate)) return 'Enter a valid due date.'
  if (record.dueMeter !== null && (!Number.isFinite(record.dueMeter) || record.dueMeter < 0)) return 'Enter a valid due meter.'
  if (record.completedDate) {
    if (!validDate(record.completedDate) || record.completedDate > today()) return 'Enter a completion date on or before today.'
    if (record.completedMeter === null || !Number.isFinite(record.completedMeter) || record.completedMeter < 0) return 'Enter a valid completion meter.'
    if (record.cost === null || !Number.isFinite(record.cost) || record.cost < 0) return 'Enter a valid cost, including zero for no charge.'
  }
  return ''
}
export function serviceStatus(record: ServiceRecord, currentMeter: number, date = today()) {
  if (record.completedDate) return 'Completed'
  if ((record.dueDate && record.dueDate < date) || (record.dueMeter !== null && currentMeter > record.dueMeter)) return 'Overdue'
  if (record.dueMeter !== null && currentMeter === record.dueMeter) return 'Due now'
  if (record.dueDate === date) return 'Due today'
  if (record.dueDate && (Date.parse(record.dueDate) - Date.parse(date)) / 86400000 <= 7) return 'Due soon'
  return 'Scheduled'
}
const key = 'sws-fleet.services.v1'
const fromRow = (row: Record<string, unknown>): ServiceRecord => ({
  id: String(row.id), vehicleId: String(row.vehicle_id), title: String(row.title), dueDate: String(row.due_date ?? ''),
  dueMeter: row.due_meter == null ? null : Number(row.due_meter), meterUnit: row.meter_unit as 'mi' | 'hr', notes: String(row.notes ?? ''),
  completedDate: row.completed_date == null ? null : String(row.completed_date), completedMeter: row.completed_meter == null ? null : Number(row.completed_meter),
  cost: row.cost == null ? null : Number(row.cost), provider: String(row.provider ?? ''),
})
export async function fetchServices(): Promise<ServiceRecord[]> {
  if (!supabase) return JSON.parse(localStorage.getItem(key) ?? '[]')
  const { data, error } = await supabase.from('service_records').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(fromRow)
}
export async function persistService(record: ServiceRecord): Promise<ServiceRecord> {
  const errorMessage = validateService(record)
  if (errorMessage) throw new Error(errorMessage)
  if (!supabase) {
    const records = await fetchServices()
    const saved = { ...record, id: record.id || crypto.randomUUID() }
    localStorage.setItem(key, JSON.stringify(record.id ? records.map(r => r.id === record.id ? saved : r) : [saved, ...records]))
    return saved
  }
  const row = { vehicle_id: record.vehicleId, title: record.title.trim(), due_date: record.dueDate || null,
    due_meter: record.dueMeter, meter_unit: record.meterUnit, notes: record.notes, completed_date: record.completedDate,
    completed_meter: record.completedMeter, cost: record.cost, provider: record.provider }
  const request = record.id ? supabase.from('service_records').update(row).eq('id', record.id).is('completed_date', null) : supabase.from('service_records').insert(row)
  const { data, error } = await request.select('*').single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Save could not be confirmed. Reload before retrying.')
  return fromRow(data)
}
