import { NextResponse } from "next/server";
import os from "os";
import fs from "fs";

export async function GET() {
  try {
    // 1. Memory Usage (Real Linux Data)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / 1024 / 1024 / 1024).toFixed(1); // GB
    const totalMemGb = (totalMem / 1024 / 1024 / 1024).toFixed(1);

    // 2. CPU Usage (Load Average normalized by Core count)
    const cpus = os.cpus();
    const coreCount = cpus.length;
    const loadAvg = os.loadavg()[0]; // 1 min load average
    // Load avg can be > core count, but for % visualization we cap at 100% logic usually
    // But let's show raw percentage relative to capacity
    const cpuPercent = Math.min(100, Math.round((loadAvg / coreCount) * 100));

    // 3. Uptime
    const uptime = os.uptime();
    const uptimeHrs = Math.floor(uptime / 3600);
    const uptimeMins = Math.floor((uptime % 3600) / 60);

    return NextResponse.json({
      cpu: `${cpuPercent}%`,
      rawLoad: loadAvg.toFixed(2),
      cores: coreCount,
      ram: `${memUsage} GB`,
      totalRam: `${totalMemGb} GB`,
      uptime: `${uptimeHrs}h ${uptimeMins}m`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
