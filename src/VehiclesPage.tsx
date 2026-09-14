import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchVehicles, persistVehicle } from "./persistence";
import { supabase } from "./supabase";
import {
  loadVehicles,
  saveVehicles,
  vehicleStatuses,
  type Vehicle,
  type VehicleInput,
} from "./vehicleModel";
import { emptyVehicle } from "./VehicleDisplay";
import { VehicleDetail } from "./VehicleDetail";
import { VehicleTable } from "./VehicleTable";

export function VehiclesPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const wantsEdit = new URLSearchParams(window.location.search).has("edit");
  const [vehicles, setVehicles] = useState<Vehicle[]>(supabase ? [] : loadVehicles());
  const [loading, setLoading] = useState(!!supabase);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(vehicleId === "new" || wantsEdit);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("name");
  const [openMenu, setOpenMenu] = useState("");
  const selected =
    vehicleId === "new" ? emptyVehicle() : vehicles.find((vehicle) => vehicle.id === vehicleId);
  const shown = useMemo(
    () =>
      vehicles
        .filter(
          (vehicle) =>
            (status === "All" || vehicle.status === status) &&
            Object.values(vehicle).join(" ").toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          String(a[sort as keyof Vehicle]).localeCompare(String(b[sort as keyof Vehicle])),
        ),
    [vehicles, query, status, sort],
  );
  useEffect(() => {
    let active = true;
    fetchVehicles()
      .then((data) => {
        if (active) setVehicles(data);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => setEditing(vehicleId === "new" || wantsEdit), [vehicleId, wantsEdit]);
  const watch = (vehicle: Vehicle) => {
    const next = vehicles.map((item) =>
      item.id === vehicle.id
        ? {
            ...item,
            watchers: item.watchers.includes("Jake Banks")
              ? item.watchers.filter((watcher) => watcher !== "Jake Banks")
              : [...item.watchers, "Jake Banks"],
          }
        : item,
    );
    if (!supabase) saveVehicles(next);
    setVehicles(next);
  };
  const save = async (vehicle: Vehicle, input: VehicleInput) => {
    const now = new Date().toISOString();
    const saved = await persistVehicle({
      ...vehicle,
      ...input,
      createdAt: vehicle.createdAt || now,
      updatedAt: now,
    });
    setVehicles((current) =>
      vehicle.id === "new"
        ? [saved, ...current]
        : current.map((item) => (item.id === vehicle.id ? saved : item)),
    );
    setEditing(false);
    navigate(`/vehicles/${saved.id}`, { replace: true });
  };
  if (loading)
    return (
      <section className="empty-state" role="status">
        <span className="loader" />
        <h2>Loading vehicles</h2>
        <p>Retrieving the latest fleet information…</p>
      </section>
    );
  if (loadError)
    return (
      <section className="empty-state" role="alert">
        <div className="state-icon">!</div>
        <h2>We couldn’t load the fleet</h2>
        <p>{loadError}</p>
        <button className="secondary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </section>
    );
  if (vehicleId && !selected)
    return (
      <section className="empty-state">
        <h2>Vehicle not found</h2>
        <p>This vehicle may have been removed or is unavailable.</p>
        <Link className="primary" to="/vehicles">
          Return to vehicles
        </Link>
      </section>
    );
  if (selected)
    return (
      <VehicleDetail
        vehicle={selected}
        editing={editing}
        onEdit={() => setEditing(true)}
        onClose={() => (selected.id === "new" ? navigate("/vehicles") : setEditing(false))}
        onBack={() => navigate("/vehicles")}
        onWatch={() => watch(selected)}
        onSave={(input) => save(selected, input)}
      />
    );
  return (
    <div className="content fleet-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Fleet inventory</p>
          <h2>Vehicles</h2>
          <p>Search, review, and manage every vehicle in your fleet.</p>
        </div>
        <button className="primary" onClick={() => navigate("/vehicles/new")}>
          ＋ Add vehicle
        </button>
      </section>
      <section className="panel fleet-panel">
        <div className="fleet-panel-heading">
          <h3>
            All vehicles <span className="count-badge">{vehicles.length}</span>
          </h3>
          <span>Updated just now</span>
        </div>
        <div className="toolbar">
          <input
            aria-label="Search vehicles"
            placeholder="Search by name, VIN, plate, or group…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="All">All statuses</option>
            {vehicleStatuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            aria-label="Sort vehicles"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="year">Sort: Year</option>
            <option value="make">Sort: Make</option>
            <option value="currentMeter">Sort: Meter</option>
          </select>
          {(query || status !== "All") && (
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setStatus("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        <VehicleTable
          vehicles={vehicles}
          shown={shown}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          navigate={navigate}
          watch={watch}
          clear={() => {
            setQuery("");
            setStatus("All");
          }}
        />
      </section>
    </div>
  );
}
