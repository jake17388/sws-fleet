import { useState } from 'react'

const nav = ['Dashboard', 'Vehicles', 'Service', 'Inspections', 'Issues', 'Reports', 'Fleet map']
const stats = [
  ['6', 'Vehicles'], ['2', 'Due this week'], ['1', 'Open issues'], ['$4,280', 'This month']
]

export function App() {
  const [active, setActive] = useState('Dashboard')
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><span>SWS Fleet</span></div><nav aria-label="Primary navigation">{nav.map(item => <button className={active === item ? 'active' : ''} onClick={() => setActive(item)} key={item}>{item}</button>)}</nav><div className="user-chip"><span className="avatar">JM</span><span><strong>Jordan Miller</strong><small>Administrator</small></span></div></aside>
    <main><header><button className="menu" aria-label="Open menu" onClick={() => setActive(active === 'Dashboard' ? 'Vehicles' : 'Dashboard')}>☰</button><div><p className="eyebrow">Wednesday, September 2, 2026</p><h1>{active}</h1></div><button className="help" aria-label="Help">?</button></header>
      {active === 'Dashboard' ? <Dashboard /> : <PlaceholderPage title={active} />}
    </main>
  </div>
}

function PlaceholderPage({ title }: { title: string }) {
  return <section className="empty-state"><img src="/sws-fleet/under-construction-white.png" alt="Page under construction" /><h2>{title}</h2><p>This workspace is ready for the next SWS Fleet milestone.</p></section>
}

function Dashboard() { return <div className="content"><section className="welcome"><div><p className="eyebrow">Fleet overview</p><h2>Good morning, Jordan</h2><p>Here’s what needs your attention today.</p></div><button className="primary">＋ Add service</button></section><section className="stat-grid">{stats.map(([value, label]) => <article className="stat" key={label}><strong>{value}</strong><span>{label}</span></article>)}</section><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Action required</p><h3>Upcoming maintenance</h3></div><button className="text-button">View all →</button></div><div className="maintenance-row"><span className="status-dot warning"/><div><strong>Oil change</strong><small>Truck 104 · Due in 3 days</small></div><span className="tag amber">Due soon</span></div><div className="maintenance-row"><span className="status-dot danger"/><div><strong>Annual inspection</strong><small>Trailer 22 · 4 days overdue</small></div><span className="tag red">Overdue</span></div></section><section className="panel map-card"><div className="panel-heading"><div><p className="eyebrow">SureCam</p><h3>Fleet location</h3></div><span className="live"><i/> Live</span></div><div className="map-placeholder"><span>⌖</span><p>Fleet map integration ready</p></div></section></div></div> }
