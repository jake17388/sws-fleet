import { supabase } from "./supabase";
import {
  fromDatabaseVehicle,
  toDatabaseVehicle,
  isDatabaseId,
  loadVehicles,
  saveVehicles,
  type Vehicle,
} from "./vehicleModel";

export async function fetchVehicles(): Promise<Vehicle[]> {
  if (!supabase) return loadVehicles();
  const { data, error } = await supabase.from("vehicles").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromDatabaseVehicle);
}

export async function persistVehicle(vehicle: Vehicle): Promise<Vehicle> {
  if (!supabase) {
    const saved = { ...vehicle, id: vehicle.id === "new" ? crypto.randomUUID() : vehicle.id };
    const current = loadVehicles();
    saveVehicles(
      current.some((v) => v.id === saved.id)
        ? current.map((v) => (v.id === saved.id ? saved : v))
        : [...current, saved],
    );
    return saved;
  }
  const row = toDatabaseVehicle(vehicle);
  const request = isDatabaseId(vehicle.id)
    ? supabase.from("vehicles").update(row).eq("id", vehicle.id)
    : supabase.from("vehicles").insert(row);
  const { data, error } = await request.select("*").single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The saved vehicle could not be confirmed. Reload before retrying.");
  return { ...fromDatabaseVehicle(data), watchers: vehicle.watchers };
}
