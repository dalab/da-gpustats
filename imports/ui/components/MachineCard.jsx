import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

  // Force a re-render every minute so the relative timestamp stays fresh
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(forceUpdate, 60_000); // 1 minute
    return () => clearInterval(id);
  }, []);

  const toggle = () => setCollapsed((prev) => !prev);

  const relative = dayjs(machine.timestamp).fromNow();
  const formatted = dayjs(machine.timestamp).format("D MMM, HH:mm");

  return (
    <div
      className="border rounded-lg p-4 backdrop-blur-lg shadow-md cursor-pointer select-none transition-all duration-200"
      onClick={toggle}
    >
      <h2 className="text-xl font-semibold">{machine.name}</h2>
      <p className="text-sm text-gray-500" title={formatted}>
        Last updated: {relative}
      </p>
      {!collapsed && (
        <ul className="mt-2 flex flex-wrap flex-row justify-between gap-2">
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