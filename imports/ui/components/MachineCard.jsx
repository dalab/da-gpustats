import React, { useState, useEffect, useMemo, useReducer } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { getMachineSummary } from "/imports/utils/summary";
import MachineCardDetails from "./MachineCardDetails";

dayjs.extend(relativeTime);

const DEFAULT_WARNING_RANGES = {
  CPU: { min: 80, max: 100 },
  GPU: { min: 80, max: 100 },
  RAM: { min: 70, max: 90 },
  HDD: { min: 80, max: 90 },
};


export const FancyBarGauge = ({
  name,
  percent = 0,
  title = null,
  warningRange = { min: 60, max: 80 },
  sections = 10,
}) => {
  const sectionHeight = 1.0 / sections;

  // Round and clamp fillPct to [0, 100]
  fillPct = Math.min(Math.max(Math.round(percent), 0), 100);

  // Decide bar colour based on thresholds
  let barColour = "bg-green-500";
  if (fillPct >= warningRange.min && fillPct < warningRange.max) barColour = "bg-yellow-500";
  if (fillPct >= warningRange.max) barColour = "bg-red-500";

  return (
    <div className="flex flex-col items-center rounded" title={title}>
      <div className="relative flex-1 min-h-20 w-6 overflow-hidden pointer-events-none">
        <div className="flex flex-col-reverse gap-[1px] h-full">
          {[...Array(sections)]
              .map((_, i) => Math.min(Math.max((fillPct - 100*sectionHeight*i) / sectionHeight, 0), 100))
              .map((fillPct, i) => (
            <div
              key={i}
              className={`w-full relative h-1 flex-grow bg-zinc-700`}
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
          {/* <div className="absolute inset-0 pointer-events-none bg-zinc-900" /> */}
        </div>
      </div>

      {/* text labels */}
      <span className="mt-1 text-zinc-200 font-mono text-xs">{percent.toFixed(0)}%</span>
      <span className="text-zinc-300/90 font-mono text-[11px]">{name}</span>
    </div>
  );
};


const StillAlive = ({ lastUpdated, warningRange = { min: 10, max: 240 }}) => {
  // if the machine was last updated more than 240 minutes ago, it's dead
  const notAlive = dayjs().diff(dayjs(lastUpdated), "minute") > warningRange.max;
  // if it was last updated less than 10 minutes ago, it's still alive
  const isAlive = dayjs().diff(dayjs(lastUpdated), "minute") < warningRange.min;
  // if it's neighter alive nor dead, it is maybe alive
  const maybeAlive = !isAlive && !notAlive;

  const color = isAlive ? "bg-green-500/40" : notAlive ? "bg-red-500/40" : "bg-yellow-500/40";
  const display = maybeAlive ? "maybe alive 🤞" : notAlive ? "not alive 💀" : "alive ✨";

  return (
    <div className={`text-xs rounded-lg px-2 py-0.5 inline-block my-0.5 text-white/90 ${color}`}>
      {display}
    </div>
  );
};

const GPUStatusBar = ({ gpus }) => {
  return (
    <div className="flex flex-row gap-1 flex-wrap">
      {gpus.map((gpu, index) => {
        return (
          gpu.users.length === 0 ? (
            <div
              key={index}
              className={`text-xs rounded-lg px-2 py-0.5 bg-radial-[at_75%_25%] from-green-400/80 to-green-600/50 inset-shadow-sm inset-shadow-green-200/60 shadow-xs shadow-green-500/10`}
              title={`GPU ${index} is free`}
            >
              <span className="text-xs font-bold opacity-70 text-white">{index}</span>
            </div>
          ) : (gpu.utilization > 80) ? (
            <div
              key={index}
              className={`opacity-90 text-xs rounded-lg px-2 py-0.5 relative overflow-hidden bg-radial-[at_50%_60%] from-orange-500/80 to-rose-500/80 inset-shadow-sm inset-shadow-orange-400/70 shadow-xs shadow-red-500/10`}
              title={`GPU ${index} fully utilized`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-amber-300/70 to-rose-600/30 opacity-90 inset-shadow-xs inset-shadow-orange-400/90 animate-[pulse_4s_cubic-bezier(.5,0,.5,1)_infinite]" />
              <span className="text-xs font-bold opacity-80 text-white">{index}</span>
            </div>
          ) : (
            <div
              key={index}
              className={`text-xs rounded-lg px-2 py-0.5 bg-radial-[at_50%_60%] from-zinc-400/50 to-zinc-500/50 inset-shadow-[0_1px_2.5px_rgba(0,0,0,0.3)]`}
              title={`GPU ${index} in use`}
            >
              <span className="text-xs font-bold opacity-70 text-zinc-300">{index}</span>
            </div>
          )
        );
      })}
    </div>
  );
};


const MachineCard = ({
  machine,
  warningRanges = DEFAULT_WARNING_RANGES,
}) => {
  // Persist collapsed state in localStorage, keyed by machine._id
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false; // SSR safeguard
    return localStorage.getItem(`machine-card-collapsed-${machine._id}`) === "true";
  });

  const summary = useMemo(() => {
    return getMachineSummary(machine);
  }, [machine]);

  useEffect(() => {
    localStorage.setItem(`machine-card-collapsed-${machine._id}`, collapsed);
  }, [collapsed, machine._id]);

  // Tick every minute so the relative timestamp remains fresh
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(forceUpdate, 60_000);
    return () => clearInterval(id);
  }, []);

  const { icon, machineState } = useMemo(() => {
    const numFreeGpus = machine.gpus.filter((gpu) => gpu.users.length === 0).length;
    const numGpus = machine.gpus.length;
    // burning if all GPUs are utilized >= 80%
    const isBurning = numGpus > 0 && machine.gpus.every((gpu) => gpu.utilization >= 90);
    const isFull = summary.hdd.util >= warningRanges.HDD.max || summary.ram.util >= warningRanges.RAM.max || summary.cpu.util >= warningRanges.CPU.max;
    const isFree = summary.cpu.util < warningRanges.CPU.min && numFreeGpus >= (numGpus / 4) && summary.ram.util < warningRanges.RAM.min && summary.hdd.util < warningRanges.HDD.min;
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
      percent: summary.cpu.util,
      warningRange: warningRanges.CPU,
    },
    {
      key: "gpu",
      name: "GPU",
      title: summary.gpu.display,
      percent: summary.gpu.util,
      warningRange: warningRanges.GPU,
    },
    {
      key: "ram",
      name: "RAM",
      title: summary.ram.display,
      percent: summary.ram.util,
      warningRange: warningRanges.RAM,
    },
    {
      key: "hdd",
      name: "HDD",
      title: summary.hdd.display,
      percent: summary.hdd.util,
      warningRange: warningRanges.HDD,
    },
  ];

  // Get all GPU users
  const allGpuUsers = useMemo(() => {
    const users = {};
    machine.gpus.forEach((gpu) => {
      gpu.users.forEach((user) => users[user] = users[user] === undefined ? 1 : users[user] + 1);
    });
    // return array of objects with user and count
    return Object.entries(users)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
  }, [machine.gpus]);

  return (
    <div
      className="border-[1px] border-white/15 backdrop-blur-xl bg-linear-45 from-zinc-900/30 to-zinc-600/20 rounded-lg p-3 shadow-md select-none transition-all duration-200"
      onClick={toggle}
    >
      <div className="flex flex-row justify-between gap-4">
        <div>
          <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 -mt-0.5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-sm inline-block" title={machineState}>{icon}</span>
              <span>{machine.name}</span>
            </h2>
            <StillAlive lastUpdated={machine.timestamp} />
          </div>

          <p className="text-xs text-zinc-400 mt-1" title={formattedTimestamp}>
            Last update: {relativeTimestamp}
          </p>

          <div className="mt-3 mb-1">
            <GPUStatusBar gpus={machine.gpus} />
          </div>

          {allGpuUsers.length > 0 && (
            <p className="text-xs text-zinc-400 mt-4">
              Used by {allGpuUsers.map((u, i) => (
                <>
                  <span className="text-zinc-300">{u.user}</span>({u.count})
                  {i < allGpuUsers.length - 1 ? ", " : ""}
                </>
              ))}
            </p>
          )}
        </div>

        <div className="flex flex-row">
          <div className="flex flex-row gap-2.5 rounded">
            {resources.map((res) => (
              <FancyBarGauge key={res.name} {...res} />
            ))}
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-4 mb-1">
          <MachineCardDetails machine={machine} />
        </div>
      )}
    </div>
  );
};

export default MachineCard;