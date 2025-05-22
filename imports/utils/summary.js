
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  i = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}


export function getMachineSummary(machineLog) {
  const gpuPct = machineLog.gpus.reduce((sum, g) => sum + Math.max(g.utilization, g.memory_used / g.memory_total), 0) / Math.max(1, machineLog.gpus.length);
  const gpuAvgUtil = machineLog.gpus.reduce((sum, g) => sum + g.utilization, 0) / Math.max(1, machineLog.gpus.length);
  const gpuCurrMem = machineLog.gpus.reduce((sum, g) => sum + g.memory_used, 0);
  const gpuTotalMem = machineLog.gpus.reduce((sum, g) => sum + g.memory_total, 0);
  const gpuDisplay = `${(100 * gpuAvgUtil).toFixed(0)}% util; ${formatBytes(gpuCurrMem)} / ${formatBytes(gpuTotalMem)}`;

  const cpuPct =
    machineLog.cpu.nproc === 0 ? 0 : (machineLog.cpu.load_avg / machineLog.cpu.nproc) * 100;
  const cpuDisplay = `${machineLog.cpu.load_avg.toFixed(1)} / ${machineLog.cpu.nproc} cores`;

  const ramPct =
    machineLog.cpu.memory_total === 0
      ? 0
      : (machineLog.cpu.memory_used / machineLog.cpu.memory_total) * 100;
  const ramDisplay = `${formatBytes(machineLog.cpu.memory_used)} / ${formatBytes(machineLog.cpu.memory_total)}`;

  const hddPct =
    machineLog.cpu.storage_total === 0
      ? 0
      : (machineLog.cpu.storage_used / machineLog.cpu.storage_total) * 100;
  const hddDisplay = `${formatBytes(machineLog.cpu.storage_used)} / ${formatBytes(machineLog.cpu.storage_total)}`;

  return {
    cpu: { util: Math.round(cpuPct), display: cpuDisplay },
    gpu: { util: Math.round(gpuPct), display: gpuDisplay },
    ram: { util: Math.round(ramPct), display: ramDisplay },
    hdd: { util: Math.round(hddPct), display: hddDisplay },
  };
}
