import React from "react";

import { formatBytes } from "/imports/utils/summary";


const GPUStatus = ({ gpu }) => {
  const isFree = gpu.users.length === 0;
  const isBurning = gpu.utilization > 90;
  
  return (
    isFree ? (
      <span className="inline-block text-[10px] text-white/80 bg-green-500/30 rounded-md px-1.5 mx-1 pt-[2px] pb-[1px] uppercase">
        Free
      </span>
    ) : (
      <span className="text-sm/4 mx-1">{isBurning ? "🔥" : ""}</span>
    )
  )
};

const MachineCardDetails = ({ machine }) => {
  const uniqueGPUModels = React.useMemo(() => {
    const allGPUModels = machine.gpus.map((gpu) => gpu.name.replace(/NVIDIA/, "").trim());
    return [...new Set(allGPUModels)];
  }, [machine.gpus]);

  return (
    <div>
      <table className="w-full text-sm text-left text-zinc-300">
        <thead className="text-sm text-zinc-400/90 uppercase">
          <tr className="border-b border-zinc-700">
            <th scope="col" className="pr-2 pl-1 pb-1 w-6 text-center align-top">GPU</th>
            <th scope="col" className="px-2 pb-1 w-10 text-right align-top">Util<br/>PWR</th>
            <th scope="col" className="px-2 pb-1 w-8 text-center align-top"></th>
            <th scope="col" className="pl-2 pr-1 pb-1 text-right align-top">Memory<br/>User(s)</th>
          </tr>
        </thead>
        <tbody>
          {machine.gpus.map((gpu, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="pr-2 pl-1 pt-1 text-center font-bold text-zinc-200">{index}</td>
                <td className="px-2 pt-1 text-right">{gpu.utilization}%</td>
                <td className="pr-2 pl-1 pt-1 text-center">
                  <GPUStatus gpu={gpu} />
                </td>
                <td className="pl-2 pr-1 pt-1 text-right text-zinc-400">
                  <p>{formatBytes(gpu.memory_used)} / {formatBytes(gpu.memory_total)}</p>
                </td>
              </tr>
              <tr className="border-b border-zinc-700">
                <td className="pr-2 pl-1 pb-0.5"></td>
                <td className="px-2 pb-0.5">
                  <p className="text-xs text-right text-zinc-400 mb-0.5 whitespace-nowrap">{gpu.power.toFixed(0)} W</p>
                </td>
                <td className="pr-2 pl-1 pb-0.5"></td>
                <td className="text-zinc-200 text-xs text-right pb-0.5 pl-2 pr-1">
                  {(gpu.users.length >= 0) && (
                    <p className="mb-0.5">{gpu.users.join(", ")}</p>
                  )}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="flex flex-row flex-wrap gap-x-6 gap-y-1 mt-5 text-xs text-zinc-400 px-1">
        <p className="">CPU: {machine.cpu.load_avg} / {machine.cpu.nproc}</p>
        <p className="">RAM: {formatBytes(machine.cpu.memory_used)} / {formatBytes(machine.cpu.memory_total)}</p>
        <p className="">HDD: {formatBytes(machine.cpu.storage_used)} / {formatBytes(machine.cpu.storage_total)}</p>
        <p className="">GPU Model: {uniqueGPUModels.join(", ")}</p>
      </div>
    </div>
  );
};

export default MachineCardDetails;
