export const STORAGE_KEY_PROFILE_ID = 'cgn_profile_id';

// 12 chars of base32-ish (no confusing chars), easy to read/type.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export function normalizeProfileCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidProfileCode(code: string): boolean {
  const c = normalizeProfileCode(code);
  // Support either raw code or prefixed code pasted by users.
  const withoutPrefix = c.startsWith('P') && c.length === 13 ? c.slice(1) : c;
  return /^[A-Z0-9]{12}$/.test(withoutPrefix);
}

export function getOrCreateProfileId(): string {
  if (typeof window === 'undefined') {
    return `P${randomCode(12)}`;
  }
  const existing = localStorage.getItem(STORAGE_KEY_PROFILE_ID);
  if (existing && isValidProfileCode(existing)) return normalizeProfileCode(existing);
  const created = `P${randomCode(12)}`;
  localStorage.setItem(STORAGE_KEY_PROFILE_ID, created);
  return created;
}

export function getProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  const existing = localStorage.getItem(STORAGE_KEY_PROFILE_ID);
  if (!existing) return null;
  return isValidProfileCode(existing) ? normalizeProfileCode(existing) : null;
}

export function setProfileId(input: string): string {
  if (typeof window === 'undefined') return normalizeProfileCode(input);
  const normalized = normalizeProfileCode(input);
  // Accept codes like PXXXXXXXXXXXX or just XXXXXXXXXXXX
  const withoutPrefix = normalized.startsWith('P') && normalized.length === 13 ? normalized : `P${normalized}`;
  if (!isValidProfileCode(withoutPrefix)) {
    throw new Error('Invalid profile code');
  }
  localStorage.setItem(STORAGE_KEY_PROFILE_ID, withoutPrefix);
  return withoutPrefix;
}

export function resetProfileId(): string {
  if (typeof window === 'undefined') {
    return `P${randomCode(12)}`;
  }
  const created = `P${randomCode(12)}`;
  localStorage.setItem(STORAGE_KEY_PROFILE_ID, created);
  return created;
}


