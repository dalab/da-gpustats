import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * FancyBarGauge – vertical bar gauge for resource usage
 * --------------------------------------------------------------
 * name         Friendly resource label (e.g. "CPU")
 * currUsage    Current usage value (number)
 * maxUsage     Maximum possible usage (number)
 * unit         Units for tooltip (e.g. "%", "GB")
 * warningRange { min, max } ⇒ yellow zone when curr% ∈ [min, max]
 */
export const FancyBarGauge = ({
  name,
  currUsage = 0,
  maxUsage = 100,
  unit = "%",
  warningRange = { min: 60, max: 80 },
  sections = 5,
}) => {
  const percent = maxUsage ? Math.ceil((currUsage / maxUsage) * 100) : 0;

  sectionHeight = 1.0 / sections;

  // Decide bar colour based on thresholds
  let barColour = "bg-green-500";
  if (percent >= warningRange.min && percent <= warningRange.max) barColour = "bg-yellow-500";
  if (percent > warningRange.max) barColour = "bg-red-500";


  return (
    <div className="flex flex-col items-center bg-slate-900 rounded" title={`${currUsage}/${maxUsage} ${unit}`}>
      {/* gauge */}
      <div className="relative h-12 w-6 overflow-hidden pointer-events-none">
        {/* Filled portion */}
        {/* <div
          className={`absolute bottom-0 left-0 w-full ${barColour}`}
          style={{ height: `${Math.min(Math.max(percent, 0), 100)}%` }}
        /> */}
        {/* Separators overlay */}
        <div className="flex flex-col-reverse gap-[1px] h-full">
          {[...Array(sections)]
              .map((_, i) => Math.min(Math.max((percent - 100*sectionHeight*i) / sectionHeight, 0), 100))
              .map((fillPct, i) => (
            <div
              key={i}
              className={`w-full relative h-1 flex-grow bg-slate-700`}
            >
              <div
                className={`absolute bottom-0 left-0 w-full border-t-white/10 ${barColour} ${fillPct > 0 ? ('border-b-[1px] border-b-black/5 ' + (fillPct >= 100 ? 'border-t-[3px]' : 'border-t-[1px]')) : ''}`}
                style={{ height: `${fillPct}%` }}
              />
              {fillPct >= 100 && (
                <div
                  className={`absolute inset-0 border-t-1 border-t-white/20`}
                />
              )}
            </div>
          ))}
          {/* <div className="absolute inset-0 pointer-events-none bg-slate-900" /> */}
        </div>
      </div>

      {/* text labels */}
      <span className="mt-1 text-white font-mono text-xs">{percent.toFixed(0)}%</span>
      <span className="text-white font-mono text-[11px]">{name}</span>
    </div>
  );
};

/**
 * MachineCard
 * --------------------------------------------------------------
 * Props:
 *  - machine: { id, name, timestamp: Date, cpu, gpu, ram, hdd }
 *  - units (optional): { CPU, GPU, RAM, HDD }
 *  - warningRanges (optional): { CPU, GPU, RAM, HDD }
 *  - maxUsage (optional): { CPU, GPU, RAM, HDD }
 */
const MachineCard = ({
  machine,
  units = { CPU: "%", GPU: "%", RAM: "%", HDD: "%" },
  warningRanges = {
    CPU: { min: 60, max: 80 },
    GPU: { min: 60, max: 80 },
    RAM: { min: 70, max: 90 },
    HDD: { min: 70, max: 90 },
  },
  maxUsage = { CPU: 100, GPU: 100, RAM: 100, HDD: 100 },
}) => {
  // Persist collapsed state in localStorage, keyed by machine._id
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false; // SSR safeguard
    return localStorage.getItem(`machine-card-collapsed-${machine._id}`) === "true";
  });

  React.useEffect(() => {
    localStorage.setItem(`machine-card-collapsed-${machine._id}`, collapsed);
  }, [collapsed, machine._id]);

  // Tick every minute so the relative timestamp remains fresh
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(forceUpdate, 60_000);
    return () => clearInterval(id);
  }, []);

  const toggle = () => setCollapsed((prev) => !prev);

  const relative = dayjs(machine.timestamp).fromNow();
  const formatted = dayjs(machine.timestamp).format("D MMM, HH:mm");

  // Build resources using defaults & machine values
  const resources = [
    {
      key: "cpu",
      name: "CPU",
      currUsage: machine.cpu,
      maxUsage: maxUsage.CPU ?? 100,
      unit: units.CPU ?? "%",
      warningRange: warningRanges.CPU,
    },
    {
      key: "gpu",
      name: "GPU",
      currUsage: machine.gpu,
      maxUsage: maxUsage.GPU ?? 100,
      unit: units.GPU ?? "%",
      warningRange: warningRanges.GPU,
    },
    {
      key: "ram",
      name: "RAM",
      currUsage: machine.ram,
      maxUsage: maxUsage.RAM ?? 100,
      unit: units.RAM ?? "%",
      warningRange: warningRanges.RAM,
    },
    {
      key: "hdd",
      name: "HDD",
      currUsage: machine.hdd,
      maxUsage: maxUsage.HDD ?? 100,
      unit: units.HDD ?? "%",
      warningRange: warningRanges.HDD,
    },
  ].filter((r) => r.currUsage !== undefined && r.currUsage !== null);

  return (
    <div
      className="border-[2px] border-white/15 backdrop-blur-xl bg-linear-45 from-slate-900/30 to-slate-600/30 rounded-lg p-4 shadow-md cursor-pointer select-none transition-all duration-200"
      onClick={toggle}
    >
      <div className="flex flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold">{machine.name}</h2>
          <p className="text-sm text-gray-500" title={formatted}>
            Last updated: {relative}
          </p>
        </div>

        <div className="flex flex-row">
          <div className="flex flex-row gap-3 rounded">
            {resources.map((res) => (
              <FancyBarGauge key={res.name} {...res} />
            ))}
          </div>
        </div>
      </div>

      {!collapsed && (
        <p>Detailed stats</p>
      )}
    </div>
  );
};

export default MachineCard;