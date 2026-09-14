import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchVehicles } from "./persistence";
import type { Vehicle } from "./vehicleModel";
import {
  fetchServices,
  persistService,
  serviceStatus,
  today,
  validateService,
  type ServiceRecord,
} from "./serviceModel";

export function ServicePage() {
  const [params, setParams] = useSearchParams();
  const vehicleFilter = params.get("vehicle") ?? "";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState("Upcoming");
  const [editor, setEditor] = useState<ServiceRecord | null>(null);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([fetchVehicles(), fetchServices()])
      .then(([fleet, services]) => {
        if (active) {
          setVehicles(fleet);
          setRecords(services);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const schedule = () => {
    const vehicle = vehicles.find((v) => v.id === vehicleFilter) ?? vehicles[0];
    setCompleting(false);
    setMessage("");
    setEditor({
      id: "",
      vehicleId: vehicle.id,
      title: "",
      dueDate: "",
      dueMeter: null,
      meterUnit: vehicle.meterUnit,
      notes: "",
      completedDate: null,
      completedMeter: null,
      cost: null,
      provider: "",
    });
  };
  const shown = records.filter(
    (r) =>
      (!vehicleFilter || r.vehicleId === vehicleFilter) &&
      (view === "History" ? !!r.completedDate : !r.completedDate),
  );
  return (
    <div className="content">
      <section className="welcome">
        <div>
          <p className="eyebrow">Fleet maintenance</p>
          <h2>Service & maintenance</h2>
          <p>Schedule work, record completion, and track vehicle history.</p>
        </div>
        <button
          className="primary"
          disabled={loading || !!error || !vehicles.length || !!editor}
          onClick={schedule}
        >
          ＋ Schedule service
        </button>
      </section>
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      {loading ? (
        <p role="status">Loading service records…</p>
      ) : error ? (
        <section className="panel">
          <p role="alert" className="error">
            Could not load service: {error}
          </p>
          <button onClick={() => setRetry(retry + 1)}>Retry</button>
        </section>
      ) : editor ? (
        <ServiceForm
          key={`${editor.id}-${completing}`}
          record={editor}
          vehicles={vehicles}
          completing={completing}
          onClose={() => setEditor(null)}
          onSave={async (record) => {
            const saved = await persistService(record);
            setRecords((current) =>
              record.id
                ? current.map((r) => (r.id === record.id ? saved : r))
                : [saved, ...current],
            );
            setEditor(null);
            setView(saved.completedDate ? "History" : "Upcoming");
            setMessage(
              saved.completedDate
                ? "Service completed and saved to history."
                : "Service schedule saved.",
            );
          }}
        />
      ) : (
        <section className="panel">
          <div className="toolbar">
            <select
              aria-label="Filter service by vehicle"
              value={vehicleFilter}
              onChange={(e) => setParams(e.target.value ? { vehicle: e.target.value } : {})}
            >
              <option value="">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Service view"
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option>Upcoming</option>
              <option>History</option>
            </select>
          </div>
          {!vehicles.length ? (
            <p>
              Add a vehicle before scheduling maintenance.{" "}
              <Link to="/vehicles">Go to vehicles</Link>
            </p>
          ) : !shown.length ? (
            <p>
              {view === "History" ? "No completed service yet." : "No upcoming service scheduled."}
            </p>
          ) : (
            <div className="service-list">
              {shown.map((record) => {
                const vehicle = vehicles.find((v) => v.id === record.vehicleId);
                const status = serviceStatus(
                  record,
                  vehicle?.meterUnit === record.meterUnit ? vehicle.currentMeter : -1,
                );
                return (
                  <article className="service-card" key={record.id}>
                    <div className="panel-heading">
                      <div>
                        <h3>{record.title}</h3>
                        <p>{vehicle?.name ?? "Vehicle unavailable"}</p>
                      </div>
                      <span className={`tag ${status === "Overdue" ? "red" : "amber"}`}>
                        {status}
                      </span>
                    </div>
                    <p>
                      Due: {record.dueDate || "No date"}
                      {record.dueMeter !== null &&
                        ` · ${record.dueMeter.toLocaleString()} ${record.meterUnit}`}
                    </p>
                    {vehicle && (
                      <p>
                        Current meter: {vehicle.currentMeter.toLocaleString()} {vehicle.meterUnit}
                      </p>
                    )}
                    {vehicle && vehicle.meterUnit !== record.meterUnit && (
                      <p className="error">
                        Meter unit changed. Review this schedule before using meter reminders.
                      </p>
                    )}
                    {record.completedDate && (
                      <p>
                        Completed {record.completedDate} · {record.completedMeter?.toLocaleString()}{" "}
                        {record.meterUnit} ·{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(record.cost ?? 0)}
                      </p>
                    )}
                    {record.provider && <p>Provider: {record.provider}</p>}
                    {record.notes && <p className="service-notes">{record.notes}</p>}
                    {!record.completedDate && (
                      <div className="service-actions">
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditor(record);
                            setCompleting(false);
                            setMessage("");
                          }}
                        >
                          Edit schedule
                        </button>
                        <button
                          className="primary"
                          onClick={() => {
                            setEditor({
                              ...record,
                              completedDate: today(),
                              completedMeter:
                                vehicle?.meterUnit === record.meterUnit
                                  ? vehicle.currentMeter
                                  : null,
                            });
                            setCompleting(true);
                            setMessage("");
                          }}
                        >
                          Complete service
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ServiceForm({
  record,
  vehicles,
  completing,
  onClose,
  onSave,
}: {
  record: ServiceRecord;
  vehicles: Vehicle[];
  completing: boolean;
  onClose: () => void;
  onSave: (record: ServiceRecord) => Promise<void>;
}) {
  const [form, setForm] = useState(record);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof ServiceRecord, value: string | number | null) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="panel detail-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (saving) return;
        const validation = validateService(form);
        if (validation) {
          setError(validation);
          return;
        }
        setSaving(true);
        setError("");
        try {
          await onSave(form);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Could not save service.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3>{completing ? "Complete service" : record.id ? "Edit schedule" : "Schedule service"}</h3>
      <fieldset disabled={saving}>
        <label>
          Vehicle
          <select
            aria-label="Vehicle"
            disabled={completing || !!record.id}
            value={form.vehicleId}
            onChange={(event) => {
              const vehicle = vehicles.find((v) => v.id === event.target.value)!;
              setForm({
                ...form,
                vehicleId: vehicle.id,
                meterUnit: vehicle.meterUnit,
                dueMeter: null,
              });
            }}
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Service title
          <input
            required
            value={form.title}
            readOnly={completing}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        {!completing && (
          <>
            <label>
              Due date
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
              />
            </label>
            <label>
              Due meter ({form.meterUnit})
              <input
                type="number"
                min="0"
                step="any"
                value={form.dueMeter ?? ""}
                onChange={(e) =>
                  update("dueMeter", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </label>
            <p>Set a date, a meter reading, or both. Either threshold can make the service due.</p>
          </>
        )}
        {completing && (
          <>
            <label>
              Completion date
              <input
                type="date"
                required
                max={today()}
                value={form.completedDate ?? ""}
                onChange={(e) => update("completedDate", e.target.value)}
              />
            </label>
            <label>
              Completion meter ({form.meterUnit})
              <input
                type="number"
                required
                min="0"
                step="any"
                value={form.completedMeter ?? ""}
                onChange={(e) =>
                  update("completedMeter", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </label>
            <p>
              This reading is saved with the service. Update the vehicle’s current meter separately
              if needed.
            </p>
            <label>
              Cost (USD)
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.cost ?? ""}
                onChange={(e) =>
                  update("cost", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </label>
          </>
        )}
        <label>
          Service provider
          <input value={form.provider} onChange={(e) => update("provider", e.target.value)} />
        </label>
        <label>
          Notes
          <textarea rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={saving} type="submit">
        {saving ? "Saving…" : completing ? "Save completion" : "Save service"}
      </button>
      <button type="button" className="text-button" disabled={saving} onClick={onClose}>
        Cancel
      </button>
    </form>
  );
}
