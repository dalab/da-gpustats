import React from "react";

const MachineCard = ({ machine }) => {
  // Persist collapsed state in localStorage, keyed by machine.id
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false; // SSR safeguard
    const saved = localStorage.getItem(`machine-card-collapsed-${machine.id}`);
    return saved === "true"; // default to expanded (false) when no value
  });

  React.useEffect(() => {
    // Sync whenever state or machine changes
    localStorage.setItem(`machine-card-collapsed-${machine.id}`, collapsed);
  }, [collapsed, machine.id]);

  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <div
      className="border rounded-lg p-4 shadow-md cursor-pointer select-none transition-all duration-200"
      onClick={toggle}
    >
      <h2 className="text-xl font-semibold">{machine.name}</h2>
      <p className="text-sm text-gray-500">Last updated: {machine.timestamp}</p>
      {!collapsed && (
        <ul className="mt-2">
          <li>
            <strong>CPU:</strong> {machine.cpu}
          </li>
          <li>
            <strong>GPU:</strong> {machine.gpu}
          </li>
          <li>
            <strong>RAM:</strong> {machine.ram}
          </li>
          <li>
            <strong>HDD:</strong> {machine.hdd}
          </li>
        </ul>
      )}
    </div>
  );
};

export default MachineCard;
