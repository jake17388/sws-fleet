import { useNavigate } from "react-router-dom";
import type { Vehicle } from "./vehicleModel";
import { Status, VehiclePhoto } from "./VehicleDisplay";

export function VehicleTable({
  vehicles,
  shown,
  openMenu,
  setOpenMenu,
  navigate,
  watch,
  clear,
}: {
  vehicles: Vehicle[];
  shown: Vehicle[];
  openMenu: string;
  setOpenMenu: (id: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  watch: (vehicle: Vehicle) => void;
  clear: () => void;
}) {
  return (
    <>
      <div className="table-wrap" role="region" aria-label="Vehicle inventory" tabIndex={0}>
        <table className="vehicle-table" aria-label="All vehicles">
          <thead>
            <tr>
              {[
                "Vehicle",
                "Year",
                "Make & model",
                "VIN",
                "Status",
                "Group",
                "Current meter",
                "License plate",
                "Watchers",
                "",
              ].map((field) => (
                <th scope="col" key={field}>
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <button
                    className="vehicle-link"
                    aria-label={`Open ${vehicle.name}`}
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <VehiclePhoto vehicle={vehicle} />
                    <span>
                      <strong>{vehicle.name}</strong>
                      <small>{vehicle.type}</small>
                    </span>
                  </button>
                </td>
                <td>{vehicle.year}</td>
                <td>
                  {vehicle.make}
                  <small>{vehicle.model}</small>
                </td>
                <td className="mono">{vehicle.vin || "—"}</td>
                <td>
                  <Status status={vehicle.status} />
                </td>
                <td>{vehicle.group || "—"}</td>
                <td className="number">
                  {vehicle.currentMeter.toLocaleString()} {vehicle.meterUnit}
                </td>
                <td>{vehicle.licensePlate || "—"}</td>
                <td>
                  <button
                    className="watch-button"
                    aria-label={`${vehicle.watchers.includes("Jake Banks") ? "Unwatch" : "Watch"} ${vehicle.name}`}
                    onClick={() => watch(vehicle)}
                  >
                    {vehicle.watchers.includes("Jake Banks") ? "Watching" : "Watch"}
                  </button>
                  <small>
                    {vehicle.watchers.length} watcher{vehicle.watchers.length === 1 ? "" : "s"}
                  </small>
                </td>
                <td className="actions-cell">
                  <button
                    className="kebab"
                    aria-label={`Actions for ${vehicle.name}`}
                    aria-expanded={openMenu === vehicle.id}
                    onClick={() => setOpenMenu(openMenu === vehicle.id ? "" : vehicle.id)}
                  >
                    •••
                  </button>
                  {openMenu === vehicle.id && (
                    <div className="action-menu" role="menu">
                      <button role="menuitem" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
                        View vehicle
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => navigate(`/vehicles/${vehicle.id}?edit=1`)}
                      >
                        Edit vehicle
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={10} className="table-empty">
                  <div className="state-icon">⌕</div>
                  <strong>
                    {vehicles.length === 0 ? "No vehicles yet" : "No vehicles match your filters."}
                  </strong>
                  <p>
                    {vehicles.length === 0
                      ? "Add your first vehicle to start building your fleet."
                      : "Try changing your search or filters."}
                  </p>
                  {vehicles.length > 0 && (
                    <button className="secondary" onClick={clear}>
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-summary" role="status">
        <span>
          Showing <strong>{shown.length}</strong> of {vehicles.length} vehicles
        </span>
        <span>All results on one page</span>
      </div>
    </>
  );
}
