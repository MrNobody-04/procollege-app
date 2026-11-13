import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

const devVarsPath = resolve(process.cwd(), '.dev.vars');
let devVarsContent = '';

try {
  devVarsContent = readFileSync(devVarsPath, 'utf8');
} catch {
  console.error('❌ Could not read .dev.vars');
  process.exit(1);
}

const vars = {};
for (const line of devVarsContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    vars[key] = val;
  }
}

if (!vars.JWT_SECRET) {
  vars.JWT_SECRET = '80df5bf206efef1e2a4ee83efd12fb6cb50555d72ed113a8ff4f3c1a34f36bbe';
}

const secrets = [
  { key: 'TURSO_AUTH_TOKEN', val: vars.TURSO_AUTH_TOKEN },
  { key: 'ABLY_API_KEY', val: vars.ABLY_API_KEY },
  { key: 'JWT_SECRET', val: vars.JWT_SECRET },
];

console.log('🔐 Pushing Encrypted Cloudflare Worker Secrets...');

for (const { key, val } of secrets) {
  if (!val) {
    console.warn(`⚠ Skipping ${key} (no value found)`);
    continue;
  }
  console.log(`⏳ Setting secret: ${key}...`);
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['wrangler', 'secret', 'put', key], {
    input: val,
    encoding: 'utf8',
    shell: true,
  });

  if (result.status === 0) {
    console.log(`✔ Secret ${key} successfully updated!`);
  } else {
    console.error(`❌ Failed setting ${key}:`, result.stderr || result.stdout);
  }
}
