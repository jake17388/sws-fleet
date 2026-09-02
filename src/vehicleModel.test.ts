import { describe, expect, it } from 'vitest'
import { validateVehicle } from './vehicleModel'

describe('vehicle validation', () => {
  it('accepts a complete vehicle', () => expect(validateVehicle({ name:'Truck 1', year:2020, make:'Ford', model:'F-550', vin:'1FDUF5GT1FEB72705', status:'Active', type:'Truck', currentMeter:10 })).toEqual({}))
  it('reports required and invalid fields', () => expect(validateVehicle({ name:'', year:1800, make:'', model:'', vin:'bad', status:'Bad' as never, type:'Bad' as never, currentMeter:-1 })).toMatchObject({ name:'Name is required', year:'Enter a valid year', vin:'VIN must be 11–17 valid characters', status:'Choose a valid status', type:'Choose a valid type', currentMeter:'Meter must be zero or greater' }))
})
