import { Link } from "react-router-dom";
import { InspectionVehicleHistory } from "./InspectionsPage";
import type { Vehicle, VehicleInput } from "./vehicleModel";
import { Status, VehiclePhoto } from "./VehicleDisplay";
import { VehicleForm } from "./VehicleForm";

export function VehicleDetail({
  vehicle,
  editing,
  onEdit,
  onClose,
  onBack,
  onWatch,
  onSave,
}: {
  vehicle: Vehicle;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onBack: () => void;
  onWatch: () => void;
  onSave: (input: VehicleInput) => Promise<void>;
}) {
  const inspectionTab = new URLSearchParams(window.location.search).get("tab") === "inspections";
  return (
    <div className="content detail-content">
      <button className="back-link" onClick={onBack}>
        ← Back to vehicles
      </button>
      <section className="vehicle-hero">
        <VehiclePhoto vehicle={vehicle} large />
        <div>
          <p className="eyebrow">{vehicle.type || "New vehicle"}</p>
          <h2>{vehicle.name || "Add vehicle"}</h2>
          {vehicle.id !== "new" && (
            <p>
              {vehicle.year} {vehicle.make} {vehicle.model} · <Status status={vehicle.status} />
            </p>
          )}
        </div>
        {vehicle.id !== "new" && (
          <div className="hero-actions">
            <button className="secondary" onClick={onWatch}>
              {vehicle.watchers.includes("Jake Banks") ? "Watching" : "Watch"}
            </button>
            <button className="primary" onClick={onEdit}>
              Edit vehicle
            </button>
          </div>
        )}
      </section>
      {editing ? (
        <VehicleForm vehicle={vehicle} onClose={onClose} onSave={onSave} />
      ) : (
        <>
          <nav className="detail-tabs" aria-label="Vehicle sections">
            <Link className={!inspectionTab ? "active" : ""} to={`/vehicles/${vehicle.id}`}>
              Overview
            </Link>
            <Link to={`/service?vehicle=${encodeURIComponent(vehicle.id)}`}>Service history</Link>
            <Link
              className={inspectionTab ? "active" : ""}
              to={`/vehicles/${vehicle.id}?tab=inspections`}
            >
              Inspection history
            </Link>
            <span>Issues</span>
            <span>Meter history</span>
          </nav>
          {inspectionTab ? (
            <InspectionVehicleHistory vehicleId={vehicle.id} />
          ) : (
            <div className="vehicle-detail-grid">
              <section className="panel detail-fields">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Vehicle profile</p>
                    <h3>Vehicle details</h3>
                  </div>
                  <button className="text-button" onClick={onEdit}>
                    Edit fields
                  </button>
                </div>
                <dl>
                  {[
                    ["Name", vehicle.name],
                    ["Meter", `${vehicle.currentMeter.toLocaleString()} ${vehicle.meterUnit}`],
                    ["Status", vehicle.status],
                    ["Group", vehicle.group || "Unassigned"],
                    ["Type", vehicle.type],
                    ["VIN / SN", vehicle.vin || "—"],
                    ["License plate", vehicle.licensePlate || "—"],
                    ["Year", vehicle.year],
                    ["Make", vehicle.make],
                    ["Model", vehicle.model],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <dt>{label}</dt>
                      <dd>{label === "Status" ? <Status status={vehicle.status} /> : value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <div className="detail-stack">
                <section className="panel location-card">
                  <div className="panel-heading">
                    <h3>Last known location</h3>
                    <span className="count-badge">Coming Soon</span>
                  </div>
                  <div className="map-placeholder">
                    <span>⌖</span>
                    <p>Vehicle location will appear here when Fleet Map is connected.</p>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <h3>Service & maintenance</h3>
                    <Link to={`/service?vehicle=${encodeURIComponent(vehicle.id)}`}>
                      View history
                    </Link>
                  </div>
                  <p className="muted">
                    Review upcoming work, reminders, and completed maintenance for this vehicle.
                  </p>
                  <Link
                    className="secondary inline-action"
                    to={`/service?vehicle=${encodeURIComponent(vehicle.id)}`}
                  >
                    Open service records
                  </Link>
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
