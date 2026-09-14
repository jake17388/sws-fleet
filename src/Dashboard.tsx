import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVehicles } from './persistence'
import { fetchServices, serviceStatus, today, type ServiceRecord } from './serviceModel'
import type { Vehicle } from './vehicleModel'

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([fetchVehicles(), fetchServices()]).then(([fleet, records]) => {
      if (active) { setVehicles(fleet); setServices(records) }
    }).catch(error => { if (active) setError(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const upcoming = services.filter(s => !s.completedDate).map(record => {
    const vehicle = vehicles.find(v => v.id === record.vehicleId)
    return { record, vehicle, status: serviceStatus(record, vehicle?.meterUnit === record.meterUnit ? vehicle.currentMeter : -1) }
  }).sort((a, b) => ['Overdue', 'Due now', 'Due today', 'Due soon', 'Scheduled'].indexOf(a.status) - ['Overdue', 'Due now', 'Due today', 'Due soon', 'Scheduled'].indexOf(b.status))
  const cost = services.filter(s => s.completedDate?.startsWith(today().slice(0, 7))).reduce((sum, s) => sum + (s.cost ?? 0), 0)
  return <div className="content"><section className="welcome"><div><p className="eyebrow">Fleet overview</p><h2>Good morning, Jordan</h2><p>Here’s what needs your attention today.</p></div><Link className="primary" to="/service">＋ Add service</Link></section>
    {loading ? <p role="status">Loading fleet overview…</p> : error ? <p role="alert" className="error">Could not load overview: {error}. <Link to="/service">Open service to retry.</Link></p> : <>
      <section className="stat-grid">{[[String(vehicles.length), 'Vehicles'], [String(upcoming.filter(s => s.status !== 'Scheduled').length), 'Due or due within 7 days'], [String(services.filter(s => s.completedDate).length), 'Completed services'], [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cost), 'Service costs this month']].map(([v, l]) => <article className="stat" key={l}><strong>{v}</strong><span>{l}</span></article>)}</section>
    </>}
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><h3>Upcoming maintenance</h3><Link to="/service">View all</Link></div>
      {!loading && !error && !upcoming.length && <p>No maintenance scheduled.</p>}
      {!error && upcoming.slice(0, 5).map(({ record, vehicle, status }) => <div className="maintenance-row" key={record.id}><div><Link to={`/service?vehicle=${encodeURIComponent(record.vehicleId)}`}>{record.title}</Link><small>{vehicle?.name ?? 'Vehicle unavailable'} · {record.dueDate || `${record.dueMeter} ${record.meterUnit}`}</small></div><span className={`tag ${status === 'Overdue' ? 'red' : 'amber'}`}>{status}</span></div>)}
    </section><section className="panel map-card"><h3>Fleet location</h3><div className="map-placeholder"><span>⌖</span><p>Fleet map integration ready</p></div></section></div>
  </div>
}
