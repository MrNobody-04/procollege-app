// ProCollege Device Fingerprinting and Persistent Trusted Device Utilities

export function getOrCreateDeviceHash(): string {
  try {
    let hash = localStorage.getItem('procollege_device_hash');
    if (!hash) {
      const raw = [
        typeof navigator !== 'undefined' ? navigator.userAgent : '',
        typeof navigator !== 'undefined' ? navigator.language : '',
        typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : '',
        typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '',
      ].join('|||');

      // 32-bit FNV-1a & Murmur-like hash mix
      let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
      h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
      h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

      const num = 4294967296 * (2097151 & h2) + (h1 >>> 0);
      hash = 'dev_' + num.toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('procollege_device_hash', hash);
    }
    return hash;
  } catch {
    return 'dev_unknown_' + Math.random().toString(36).substring(2, 9);
  }
}

export function getStoredDeviceToken(): string {
  try {
    return localStorage.getItem('procollege_device_token') || '';
  } catch {
    return '';
  }
}

export function saveDeviceToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem('procollege_device_token', token);
    }
  } catch {
    // Ignore localStorage errors (e.g. private browsing restrictions)
  }
}

export function clearDeviceToken(): void {
  try {
    localStorage.removeItem('procollege_device_token');
  } catch {
    // Ignore
  }
}

export function getDeviceDisplayName(): string {
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let os = 'Desktop';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Mac/i.test(ua)) os = 'macOS';
    else if (/Win/i.test(ua)) os = 'Windows';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';

    return `${os} • ${browser}`;
  } catch {
    return 'Trusted Web Browser';
  }
}
