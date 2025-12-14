export async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hash);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Very small fallback (should rarely be used in this app since calls happen client-side).
  // NOTE: Not cryptographically strong without WebCrypto, but acceptable for family PIN gating.
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`.padEnd(64, '0');
}

