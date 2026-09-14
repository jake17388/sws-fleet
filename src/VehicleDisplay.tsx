import type { Vehicle } from "./vehicleModel";

export function emptyVehicle(): Vehicle {
  return {
    id: "new",
    name: "",
    year: new Date().getFullYear(),
    make: "",
    model: "",
    vin: "",
    status: "Active",
    type: "Truck",
    group: "",
    currentMeter: 0,
    meterUnit: "mi",
    licensePlate: "",
    photoUrl: "",
    watchers: [],
    createdAt: "",
    updatedAt: "",
  };
}

const bundledPhotos: Record<string, string> = {
  "2015 double bucket": "double-2015.webp",
  "2025 double bucket": "double-2025.webp",
  "2018 altec crane": "crane-2018.webp",
  "2022 altec crane": "crane-2022.webp",
  "2016 flatbed": "flatbed-2016.webp",
  "2019 single bucket": "single-2019.webp",
  "2023 single bucket": "single-2023.webp",
  "big tex dump trailer": "trailer-dump.webp",
  "large flatbed trailer": "trailer-long.webp",
  "red trailer": "trailer-red.webp",
  "white trailer": "trailer-white.webp",
  'white trailer (2")': "trailer-white.webp",
};
export function VehiclePhoto({ vehicle, large = false }: { vehicle: Vehicle; large?: boolean }) {
  const source =
    vehicle.photoUrl ||
    (bundledPhotos[vehicle.name.toLowerCase()]
      ? `/sws-fleet/vehicles/${bundledPhotos[vehicle.name.toLowerCase()]}`
      : "");
  return source ? (
    <img
      className={`vehicle-photo${large ? " large" : ""}`}
      src={source}
      alt={`${vehicle.name} vehicle`}
    />
  ) : (
    <span className={`vehicle-photo placeholder${large ? " large" : ""}`} aria-hidden="true">
      {vehicle.name?.slice(0, 1) || "+"}
    </span>
  );
}
export function Status({ status }: { status: Vehicle["status"] }) {
  return (
    <span className="vehicle-status" data-status={status}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}
