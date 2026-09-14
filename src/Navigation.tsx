export const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: "⌂" },
  { name: "Vehicles", path: "/vehicles", icon: "▰", iconSrc: "/sws-fleet/car.png" },
  { name: "Service", path: "/service", icon: "◇", iconSrc: "/sws-fleet/wrench.png" },
  { name: "Inspections", path: "/inspections", icon: "✓" },
  { name: "Issues", path: "/issues", icon: "!", comingSoon: true },
  { name: "Reports", path: "/reports", icon: "▥", comingSoon: true },
  { name: "Fleet map", path: "/fleet-map", icon: "⌖", comingSoon: true },
  { name: "Settings", path: "/settings", icon: "⚙" },
];
export const sidebarLinkLayout = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr) auto",
  columnGap: "12px",
} as const;

export function Brand() {
  return (
    <div className="brand">
      <img src="/sws-fleet/brand-mark-96.png" alt="" />
      <span>
        <strong>Summit West Signs</strong>
        <small>Fleet Management</small>
      </span>
    </div>
  );
}
export function NavIcon({ item }: { item: (typeof navigation)[number] }) {
  return (
    <span className="nav-symbol" aria-hidden="true">
      {"iconSrc" in item ? <img src={item.iconSrc} alt="" /> : item.icon}
    </span>
  );
}
