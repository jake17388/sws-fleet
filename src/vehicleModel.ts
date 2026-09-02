export const vehicleStatuses = ['Active', 'Inactive', 'In maintenance', 'Retired'] as const
export const vehicleTypes = ['Truck', 'Trailer', 'Van', 'Other'] as const

export type VehicleStatus = typeof vehicleStatuses[number]
export type VehicleType = typeof vehicleTypes[number]

export type Vehicle = {
  id: string
  name: string
  year: number
  make: string
  model: string
  vin: string
  status: VehicleStatus
  type: VehicleType
  group: string
  currentMeter: number
  meterUnit: 'mi' | 'hr'
  licensePlate: string
  watchers: string[]
  createdAt: string
  updatedAt: string
}

export type VehicleInput = Omit<Vehicle, 'id' | 'watchers' | 'createdAt' | 'updatedAt'>

export const validateVehicle = (input: Partial<VehicleInput>) => {
  const errors: Record<string, string> = {}
  if (!input.name?.trim()) errors.name = 'Name is required'
  if (!Number.isInteger(input.year) || input.year! < 1900 || input.year! > new Date().getFullYear() + 1) errors.year = 'Enter a valid year'
  if (!input.make?.trim()) errors.make = 'Make is required'
  if (!input.model?.trim()) errors.model = 'Model is required'
  if (input.vin && !/^[A-HJ-NPR-Z0-9]{11,17}$/i.test(input.vin)) errors.vin = 'VIN must be 11–17 valid characters'
  if (!vehicleStatuses.includes(input.status as VehicleStatus)) errors.status = 'Choose a valid status'
  if (!vehicleTypes.includes(input.type as VehicleType)) errors.type = 'Choose a valid type'
  if (!Number.isFinite(input.currentMeter) || input.currentMeter! < 0) errors.currentMeter = 'Meter must be zero or greater'
  return errors
}

export const sampleVehicles: Vehicle[] = [
  ['2015 Double Bucket',2015,'Ford','F-550 Super Duty','1FDUF5GT1FEB72705','Active','Truck','Bucket Trucks',181583,'mi','CJ43300'],
  ['2016 Flatbed',2016,'Ford','F-450 Super Duty','1FD0W4GT9GED42125','Active','Truck','',149281,'mi','CK47519'],
  ['2018 Altec Crane',2018,'Ford','F-750 Super Duty','1FDXF7DEXJDF03858','Active','Truck','Cranes',101485,'mi','CMO6222'],
  ['Big Tex Dump Trailer',2021,'Big Tex Trailers','—','', 'Active','Trailer','',12345,'mi','HMA 02D'],
].map(([name,year,make,model,vin,status,type,group,currentMeter,meterUnit,licensePlate], index) => ({ id: `vehicle-${index + 1}`, name, year, make, model, vin, status, type, group, currentMeter, meterUnit, licensePlate, watchers: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Vehicle))

const KEY = 'sws-fleet.vehicles.v1'
export const loadVehicles = (): Vehicle[] => {
  if (typeof localStorage === 'undefined') return sampleVehicles
  try { const stored = localStorage.getItem(KEY); if (stored) return JSON.parse(stored) }
  catch { /* fall back to the bundled seed */ }
  localStorage.setItem(KEY, JSON.stringify(sampleVehicles)); return sampleVehicles
}
export const saveVehicles = (vehicles: Vehicle[]) => { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(vehicles)) }

export const fromDatabaseVehicle = (row: Record<string, unknown>): Vehicle => ({
  id: String(row.id), name: String(row.name), year: Number(row.year), make: String(row.make ?? ''), model: String(row.model ?? ''),
  vin: String(row.vin ?? ''), status: row.status as VehicleStatus, type: row.type as VehicleType, group: String(row.vehicle_group ?? ''),
  currentMeter: Number(row.current_meter ?? 0), meterUnit: row.meter_unit as 'mi' | 'hr', licensePlate: String(row.license_plate ?? ''),
  watchers: [], createdAt: String(row.created_at ?? ''), updatedAt: String(row.updated_at ?? '')
})

export const toDatabaseVehicle = (vehicle: Vehicle) => ({
  name: vehicle.name, year: vehicle.year || null, make: vehicle.make || null, model: vehicle.model || null, vin: vehicle.vin || null,
  status: vehicle.status, type: vehicle.type, vehicle_group: vehicle.group || null, current_meter: vehicle.currentMeter,
  meter_unit: vehicle.meterUnit, license_plate: vehicle.licensePlate || null
})

export const isDatabaseId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
