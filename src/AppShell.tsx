import { useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { InspectionsPage } from "./InspectionsPage";
import { Brand, NavIcon, navigation, sidebarLinkLayout } from "./Navigation";
import { ServicePage } from "./ServicePage";
import { SettingsPage, loadCompactTables, loadTheme, type Theme } from "./SettingsPage";
import { supabase } from "./supabase";
import { VehiclesPage } from "./VehiclesPage";

export function AppShell() {
  const [compact, setCompact] = useState(loadCompactTables);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const location = useLocation();
  const active =
    navigation.find((item) => location.pathname.startsWith(item.path))?.name ?? "Dashboard";
  const applyTheme = (next: Theme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };
  return (
    <div className={`app-shell${compact ? " compact-tables" : ""}`}>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              style={sidebarLinkLayout}
              to={item.path}
              key={item.name}
            >
              <NavIcon item={item} />
              <span className="nav-label">{item.name}</span>
              {item.comingSoon && <small>Coming Soon</small>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">JB</span>
            <span>
              <strong>Jake Banks</strong>
              <small>Administrator</small>
            </span>
          </div>
          <button className="signout" onClick={() => void supabase?.auth.signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h1>{active}</h1>
          </div>
          <div className="header-user">
            <span className="avatar">JB</span>
            <span>
              <strong>Jake Banks</strong>
              <small>Administrator</small>
            </span>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:vehicleId" element={<VehiclesPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/inspections" element={<InspectionsPage />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                compact={compact}
                onCompactChange={setCompact}
                theme={theme}
                onThemeChange={applyTheme}
              />
            }
          />
          {navigation
            .filter((item) => item.comingSoon)
            .map((item) => (
              <Route
                key={item.name}
                path={item.path}
                element={<PlaceholderPage title={item.name} />}
              />
            ))}
        </Routes>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 4).map((item) => (
          <NavLink to={item.path} key={item.name}>
            <NavIcon item={item} />
            <small>{item.name}</small>
          </NavLink>
        ))}
        <NavLink to="/settings">
          <span aria-hidden="true">⚙</span>
          <small>More</small>
        </NavLink>
      </nav>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="empty-state">
      <div className="state-icon">◇</div>
      <span className="coming-pill">Coming Soon</span>
      <h2>{title} is on the way</h2>
      <p>This workspace is reserved for the next SWS Fleet milestone.</p>
      <Link className="secondary" to="/dashboard">
        Return to dashboard
      </Link>
    </section>
  );
}
