import { useState } from 'react'

const nav = ['Dashboard', 'Vehicles', 'Service', 'Inspections', 'Issues', 'Reports', 'Fleet map']
const stats = [
  ['6', 'Vehicles'], ['2', 'Due this week'], ['1', 'Open issues'], ['$4,280', 'This month']
]
const vehicles = [
  ['2015 Double Bucket', '2015', 'Ford', 'F-550 Super Duty', '1FDUF5GT1FEB72705', 'Active', 'Truck', 'Bucket Trucks', '181,583 mi', 'CJ43300'],
  ['2016 Flatbed', '2016', 'Ford', 'F-450 Super Duty', '1FD0W4GT9GED42125', 'Active', 'Truck', '—', '149,281 mi', 'CK47519'],
  ['2018 Altec Crane', '2018', 'Ford', 'F-750 Super Duty', '1FDXF7DEXJDF03858', 'Active', 'Truck', 'Cranes', '101,485 mi', 'CMO6222'],
  ['Big Tex Dump Trailer', '2021', 'Big Tex Trailers', '—', '—', 'Active', 'Trailer', '—', '12,345 mi', 'HMA 02D'],
]

export function App() {
  const [active, setActive] = useState('Dashboard')
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><span>SWS Fleet</span></div><nav aria-label="Primary navigation">{nav.map(item => <button className={active === item ? 'active' : ''} onClick={() => setActive(item)} key={item}>{item}</button>)}</nav><div className="user-chip"><span className="avatar">JM</span><span><strong>Jordan Miller</strong><small>Administrator</small></span></div></aside>
    <main><header><button className="menu" aria-label="Open menu" onClick={() => setActive(active === 'Dashboard' ? 'Vehicles' : 'Dashboard')}>☰</button><div><p className="eyebrow">Wednesday, September 2, 2026</p><h1>{active}</h1></div><button className="help" aria-label="Help">?</button></header>
      {active === 'Dashboard' ? <Dashboard /> : active === 'Vehicles' ? <VehiclesPage /> : <PlaceholderPage title={active} />}
    </main>
  </div>
}

function VehiclesPage() {
  const [watched, setWatched] = useState<string[]>([])
  const toggleWatch = (name: string) => setWatched(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name])
  return <div className="content"><section className="welcome"><div><p className="eyebrow">Fleet inventory</p><h2>Vehicles</h2><p>Manage fleet details and vehicle notifications.</p></div><button className="primary">＋ Add vehicle</button></section><div className="panel vehicle-panel"><div className="table-wrap"><table><thead><tr>{['Name','Year','Make','Model','VIN','Status','Type','Group','Current Meter','License Plate','Watchers'].map(field => <th key={field}>{field}</th>)}</tr></thead><tbody>{vehicles.map(vehicle => <tr key={vehicle[0]}>{vehicle.map((value, index) => <td key={index}>{index === 5 ? <span className="vehicle-status"><i/> Active</span> : value}</td>)}<td><button className="watch-button" aria-label={`${watched.includes(vehicle[0]) ? 'Unwatch' : 'Watch'} ${vehicle[0]}`} onClick={() => toggleWatch(vehicle[0])}>{watched.includes(vehicle[0]) ? 'Watching' : 'Watch'}</button><small>2 watchers</small></td></tr>)}</tbody></table></div></div></div>
}

function PlaceholderPage({ title }: { title: string }) {
  return <section className="empty-state"><img src="/sws-fleet/under-construction-white.png" alt="Page under construction" /><h2>{title}</h2><p>This workspace is ready for the next SWS Fleet milestone.</p></section>
}

function Dashboard() { return <div className="content"><section className="welcome"><div><p className="eyebrow">Fleet overview</p><h2>Good morning, Jordan</h2><p>Here’s what needs your attention today.</p></div><button className="primary">＋ Add service</button></section><section className="stat-grid">{stats.map(([value, label]) => <article className="stat" key={label}><strong>{value}</strong><span>{label}</span></article>)}</section><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Action required</p><h3>Upcoming maintenance</h3></div><button className="text-button">View all →</button></div><div className="maintenance-row"><span className="status-dot warning"/><div><strong>Oil change</strong><small>Truck 104 · Due in 3 days</small></div><span className="tag amber">Due soon</span></div><div className="maintenance-row"><span className="status-dot danger"/><div><strong>Annual inspection</strong><small>Trailer 22 · 4 days overdue</small></div><span className="tag red">Overdue</span></div></section><section className="panel map-card"><div className="panel-heading"><div><p className="eyebrow">SureCam</p><h3>Fleet location</h3></div><span className="live"><i/> Live</span></div><div className="map-placeholder"><span>⌖</span><p>Fleet map integration ready</p></div></section></div></div> }
