export function getMachineSummary(machineLog) {
  const gpuPct =
    machineLog.gpus.length === 0
      ? 0
      : machineLog.gpus.reduce((sum, g) => sum + Math.max(g.utilization, g.memory_used / g.memory_total), 0) / machineLog.gpus.length;
  const gpuCurrMem = machineLog.gpus.reduce((sum, g) => sum + g.memory_used, 0);
  const gpuTotalMem = machineLog.gpus.reduce((sum, g) => sum + g.memory_total, 0);
  const gpuDisplay = `${gpuCurrMem.toFixed(1)}/${gpuTotalMem.toFixed(1)} GB`;

  const cpuPct =
    machineLog.cpu.nproc === 0 ? 0 : (machineLog.cpu.load_avg / machineLog.cpu.nproc) * 100;
  const cpuDisplay = `${machineLog.cpu.load_avg.toFixed(1)}/${machineLog.cpu.nproc} cores`;

  const ramPct =
    machineLog.cpu.memory_total === 0
      ? 0
      : (machineLog.cpu.memory_used / machineLog.cpu.memory_total) * 100;
  const ramDisplay = `${machineLog.cpu.memory_used.toFixed(1)}/${machineLog.cpu.memory_total.toFixed(1)} GB`;

  const hddPct =
    machineLog.cpu.storage_total === 0
      ? 0
      : (machineLog.cpu.storage_used / machineLog.cpu.storage_total) * 100;
  const hddDisplay = `${machineLog.cpu.storage_used.toFixed(1)}/${machineLog.cpu.storage_total.toFixed(1)} GB`;

  return {
    cpu: { util: cpuPct, display: cpuDisplay },
    gpu: { util: gpuPct, display: gpuDisplay },
    ram: { util: ramPct, display: ramDisplay },
    hdd: { util: hddPct, display: hddDisplay },
  };
}
