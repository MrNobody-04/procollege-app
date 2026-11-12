import { createClient } from '@libsql/client/web';

// Support both Node.js / Cloudflare Workers environment and Vite client environment
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Vite client import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteKey = `VITE_${key}`;
      return (import.meta as any).env[viteKey] || (import.meta as any).env[key] || '';
    }
  } catch {
    // ignore
  }
  return '';
};

const url = getEnvVar('TURSO_DB_URL') || 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io';
const authToken = getEnvVar('TURSO_AUTH_TOKEN');

export const db = createClient({
  url,
  authToken,
});

export function getDb(env?: { TURSO_DB_URL?: string; TURSO_AUTH_TOKEN?: string }) {
  if (env && env.TURSO_DB_URL && env.TURSO_AUTH_TOKEN) {
    return createClient({
      url: env.TURSO_DB_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

export default db;

