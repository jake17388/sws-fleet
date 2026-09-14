import { useState } from "react";
import {
  validateVehicle,
  vehicleStatuses,
  vehicleTypes,
  type Vehicle,
  type VehicleInput,
} from "./vehicleModel";
import { VehiclePhoto } from "./VehicleDisplay";

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function VehicleForm({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (input: VehicleInput) => Promise<void>;
}) {
  const [form, setForm] = useState<VehicleInput>({
    name: vehicle.name,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    vin: vehicle.vin,
    status: vehicle.status,
    type: vehicle.type,
    group: vehicle.group,
    currentMeter: vehicle.currentMeter,
    meterUnit: vehicle.meterUnit,
    licensePlate: vehicle.licensePlate,
    photoUrl: vehicle.photoUrl,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const update = (key: keyof VehicleInput, value: string) =>
    setForm({
      ...form,
      [key]: key === "year" || key === "currentMeter" ? Number(value) : value,
    } as VehicleInput);
  return (
    <form
      className="panel vehicle-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (saving) return;
        const nextErrors = validateVehicle(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        setSaving(true);
        setSaveError("");
        try {
          await onSave(form);
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "Could not save vehicle");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="form-heading">
        <div>
          <p className="eyebrow">Vehicle record</p>
          <h3>{vehicle.id === "new" ? "Add vehicle" : "Edit vehicle"}</h3>
        </div>
        <button className="icon-close" type="button" onClick={onClose} aria-label="Close form">
          ×
        </button>
      </div>
      <fieldset disabled={saving}>
        <label className="photo-field">
          <span>Vehicle photo</span>
          <div>
            <VehiclePhoto
              vehicle={{ ...vehicle, photoUrl: form.photoUrl, name: form.name }}
              large
            />
            <label className="secondary upload-button">
              Choose photo
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) update("photoUrl", await fileToDataUrl(file));
                }}
              />
            </label>
            {form.photoUrl && (
              <button type="button" className="text-button" onClick={() => update("photoUrl", "")}>
                Remove
              </button>
            )}
          </div>
        </label>
        <div className="form-grid">
          {[
            ["name", "Name"],
            ["year", "Year"],
            ["make", "Make"],
            ["model", "Model"],
            ["vin", "VIN"],
            ["group", "Group"],
            ["currentMeter", "Current Meter"],
            ["licensePlate", "License Plate"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type={key === "year" || key === "currentMeter" ? "number" : "text"}
                required={["name", "year", "make", "model", "currentMeter"].includes(key)}
                aria-label={label}
                value={String(form[key as keyof VehicleInput])}
                onChange={(event) => update(key as keyof VehicleInput, event.target.value)}
              />
              {errors[key] && <small className="error">{errors[key]}</small>}
            </label>
          ))}
          <label>
            Status
            <select
              aria-label="Status"
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              {vehicleStatuses.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              aria-label="Type"
              value={form.type}
              onChange={(event) => update("type", event.target.value)}
            >
              {vehicleTypes.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Meter unit
            <select
              aria-label="Meter unit"
              value={form.meterUnit}
              onChange={(event) => update("meterUnit", event.target.value)}
            >
              <option>mi</option>
              <option>hr</option>
            </select>
          </label>
        </div>
      </fieldset>
      {saveError && (
        <p role="alert" className="error form-error">
          {saveError}
        </p>
      )}
      <div className="form-actions">
        <button className="secondary" type="button" disabled={saving} onClick={onClose}>
          Cancel
        </button>
        <button className="primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save vehicle"}
        </button>
      </div>
    </form>
  );
}
