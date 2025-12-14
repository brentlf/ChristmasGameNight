import os from 'node:os';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getLanIPv4(): string | null {
  const nets = os.networkInterfaces();

  // Prefer common interface names first (Windows/macOS/Linux)
  const preferredNames = ['Wi-Fi', 'WLAN', 'Ethernet', 'en0', 'en1', 'eth0', 'wlan0'];
  const names = [
    ...preferredNames.filter((n) => Boolean(nets[n])),
    ...Object.keys(nets).filter((n) => !preferredNames.includes(n)),
  ];

  for (const name of names) {
    const addrs = nets[name] ?? [];
    for (const addr of addrs) {
      if (addr.family !== 'IPv4') continue;
      if (addr.internal) continue;
      // Skip link-local
      if (addr.address.startsWith('169.254.')) continue;
      return addr.address;
    }
  }

  return null;
}

export async function GET() {
  return NextResponse.json({ ip: getLanIPv4() });
}

