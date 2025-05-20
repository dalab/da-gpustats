import React, { useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { getMachineSummary } from "/imports/utils/summary"; 

dayjs.extend(relativeTime);

const DEFAULT_WARNING_RANGES = {
  CPU: { min: 50, max: 80 },
  GPU: { min: 50, max: 80 },
  RAM: { min: 70, max: 90 },
  HDD: { min: 70, max: 90 },
};

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
  fillPct = 0,
  title = null,
  warningRange = { min: 60, max: 80 },
  sections = 5,
}) => {
  const sectionHeight = 1.0 / sections;

  // Decide bar colour based on thresholds
  let barColour = "bg-green-500";
  if (fillPct >= warningRange.min && fillPct < warningRange.max) barColour = "bg-yellow-500";
  if (fillPct >= warningRange.max) barColour = "bg-red-500";

  return (
    <div className="flex flex-col items-center rounded" title={title}>
      <div className="relative h-12 w-6 overflow-hidden pointer-events-none">
        <div className="flex flex-col-reverse gap-[1px] h-full">
          {[...Array(sections)]
              .map((_, i) => Math.min(Math.max((fillPct - 100*sectionHeight*i) / sectionHeight, 0), 100))
              .map((fillPct, i) => (
            <div
              key={i}
              className={`w-full relative h-1 flex-grow bg-slate-700`}
            >
              <div
                className={`absolute bottom-0 left-0 w-full border-t-white/10 ${barColour} ${fillPct > 0 ? ('border-b-[1px] border-b-black/5 ' + (fillPct >= 100 ? 'border-t-[2px]' : 'border-t-[1px]')) : ''}`}
                style={{ height: `${fillPct}%` }}
              />
              {fillPct >= 100 && (
                <div
                  className={`absolute inset-0 border-t-1 border-t-white/15`}
                />
              )}
            </div>
          ))}
          {/* <div className="absolute inset-0 pointer-events-none bg-slate-900" /> */}
        </div>
      </div>

      {/* text labels */}
      <span className="mt-1 text-white font-mono text-xs">{fillPct.toFixed(0)}%</span>
      <span className="text-white font-mono text-[11px]">{name}</span>
    </div>
  );
};

/**
 * StillAlive
 * --------------------------------------------------------------
 * Props:
 *  - lastUpdated: Date
 *  - warningRange: { min, max } ⇒ yellow zone when curr% ∈ [min, max]
 */
const StillAlive = ({ lastUpdated, warningRange = { min: 10, max: 240 }}) => {
  // if the machine was last updated more than 240 minutes ago, it's dead
  const notAlive = dayjs().diff(dayjs(lastUpdated), "minute") > warningRange.max;
  // if it was last updated less than 10 minutes ago, it's still alive
  const isAlive = dayjs().diff(dayjs(lastUpdated), "minute") < warningRange.min;
  // if it's neighter alive nor dead, it is maybe alive
  const maybeAlive = !isAlive && !notAlive;

  const color = isAlive ? "bg-green-500/50" : notAlive ? "bg-red-500/50" : "bg-yellow-500/50";
  const display = maybeAlive ? "Maybe alive 🤞" : notAlive ? "Not alive 💀" : "Still alive ✨";

  return (
    <div className={`text-xs rounded-lg px-2 py-0.5 inline-block mb-1 ${color}`}>
      {display}
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
  warningRanges = DEFAULT_WARNING_RANGES,
}) => {
  // Persist collapsed state in localStorage, keyed by machine._id
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false; // SSR safeguard
    return localStorage.getItem(`machine-card-collapsed-${machine._id}`) === "true";
  });

  const summary = useMemo(() => {
    return getMachineSummary(machine);
  }, [machine]);

  React.useEffect(() => {
    localStorage.setItem(`machine-card-collapsed-${machine._id}`, collapsed);
  }, [collapsed, machine._id]);

  // Tick every minute so the relative timestamp remains fresh
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(forceUpdate, 60_000);
    return () => clearInterval(id);
  }, []);

  const { icon, machineState } = useMemo(() => {
    const isBurning = summary.cpu.util >= warningRanges.CPU.max || summary.gpu.util >= warningRanges.GPU.max;
    const isFull = summary.hdd.util >= warningRanges.HDD.max || summary.ram.util >= warningRanges.RAM.max;
    const isFree = summary.cpu.util < warningRanges.CPU.min && summary.gpu.util < warningRanges.GPU.min && summary.ram.util < warningRanges.RAM.min && summary.hdd.util < warningRanges.HDD.min;
    let icon = "🟡";
    let machineState = "Moderately used";
    if (isBurning) {
      icon = "🔥"
      machineState = "Fully utilized";
    } else if (isFull) {
      icon = "🔴";
      machineState = "Storage full, please clean up!";
    } else if (isFree) {
      icon = "🟢";
      machineState = "Free to use";
    }
    return { icon, machineState };
  }, [summary, warningRanges, machine.hdd]);

  const toggle = () => setCollapsed((prev) => !prev);

  const relativeTimestamp = dayjs(machine.timestamp).fromNow();
  const formattedTimestamp = dayjs(machine.timestamp).format("D MMM, HH:mm");

  // Build resources using defaults & machine values
  const resources = [
    {
      key: "cpu",
      name: "CPU",
      title: summary.cpu.display,
      fillPct: summary.cpu.util,
      warningRange: warningRanges.CPU,
    },
    {
      key: "gpu",
      name: "GPU",
      title: summary.gpu.display,
      fillPct: summary.gpu.util,
      warningRange: warningRanges.GPU,
    },
    {
      key: "ram",
      name: "RAM",
      title: summary.ram.display,
      fillPct: summary.ram.util,
      warningRange: warningRanges.RAM,
    },
    {
      key: "hdd",
      name: "HDD",
      title: summary.hdd.display,
      fillPct: summary.hdd.util,
      warningRange: warningRanges.HDD,
    },
  ];

  return (
    <div
      className="border-[2px] border-white/15 backdrop-blur-xl bg-linear-45 from-slate-900/30 to-slate-600/30 rounded-lg p-4 shadow-md cursor-pointer select-none transition-all duration-200"
      onClick={toggle}
    >
      <div className="flex flex-row justify-between items-start gap-4">
        <div>
          <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-semibold flex items-center"><span className="text-base inline-block" title={machineState}>{icon}</span><span>&nbsp;{machine.name}</span></h2>
            <StillAlive lastUpdated={machine.timestamp} />
          </div>
          <p className="text-sm text-gray-500 mt-1" title={formattedTimestamp}>
            Last update: {relativeTimestamp}
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
        <div className="mt-4">
          <p>Detailed stats</p>
        </div>
      )}
    </div>
  );
};

export default MachineCard;