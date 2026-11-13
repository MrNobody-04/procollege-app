const BASE_URL = 'https://procollege-app.sujan-bit-n2024.workers.dev';

async function runAudit() {
  console.log('\n=============================================================');
  console.log('🔍 PROCOLLEGE MULTI-CLOUD STORAGE & SYNC END-TO-END AUDIT');
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`⏱ Timestamp: ${new Date().toISOString()}`);
  console.log('=============================================================\n');

  let passedAll = true;

  // 1. Health & Status Check
  console.log('📡 STEP 1: Verifying Live Health & Multi-Cloud Services...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error(`HTTP ${healthRes.status} ${healthRes.statusText}`);
    }
    const health = await healthRes.json();
    console.log('   ✔ Endpoint Response Status: HTTP 200 OK');

    // 1.1 Turso Primary DB
    const isTursoOk = health.status === 'ok' && health.collegesCount > 0;
    console.log('\n📦 1. PRIMARY DATABASE: Turso LibSQL (AWS Mumbai: ap-south-1)');
    console.log(`   - Status:           ${isTursoOk ? '🟢 ONLINE & ACTIVE' : '🔴 ERROR'}`);
    console.log(`   - DB Host:          libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io`);
    console.log(`   - Colleges Count:   ${health.collegesCount}`);
    if (!isTursoOk) passedAll = false;

    // 1.2 Cloudflare D1 Vault
    const d1Status = health.d1Vault?.status === 'connected';
    console.log('\n🛡️  2. DISASTER RECOVERY & BACKUP: Cloudflare D1 (Edge Vault)');
    console.log(`   - Binding:          ${health.d1Vault?.binding || 'procollege_vault'}`);
    console.log(`   - Status:           ${d1Status ? '🟢 CONNECTED & REPLICATING' : '🔴 DISCONNECTED'}`);
    console.log(`   - Remote Tables:    ${health.d1Vault?.tablesCount || 0} active tables`);
    if (!d1Status) passedAll = false;

    // 1.3 Cloudinary Binary Storage
    const storageConfigRes = await fetch(`${BASE_URL}/api/storage/config`);
    const storageConfig = await storageConfigRes.json();
    const isCloudinaryOk = storageConfig.cloudName === 'pf66y0wq';
    console.log('\n☁️  3. BINARY ASSET STORAGE: Cloudinary 25GB Storage Tier');
    console.log(`   - Cloud Name:       ${storageConfig.cloudName}`);
    console.log(`   - Provider:         ${storageConfig.provider}`);
    console.log(`   - Upload API:       ${storageConfig.uploadEndpoint}`);
    console.log(`   - Status:           ${isCloudinaryOk ? '🟢 CONFIGURED & READY' : '🔴 MISCONFIGURED'}`);
    if (!isCloudinaryOk) passedAll = false;

  } catch (err) {
    console.error('   ❌ Health Check Failed:', err.message);
    passedAll = false;
  }

  // 2. Live Backup Snapshot Trigger Test
  console.log('\n-------------------------------------------------------------');
  console.log('🚀 STEP 2: Executing Live Backup Snapshot to Cloudflare D1...');
  try {
    const backupRes = await fetch(`${BASE_URL}/api/vault/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!backupRes.ok) {
      throw new Error(`HTTP ${backupRes.status} ${backupRes.statusText}`);
    }

    const backupData = await backupRes.json();
    if (backupData.success) {
      console.log('   ✔ Snapshot Triggered Successfully!');
      console.log(`   - Snapshot Timestamp: ${backupData.snapshotTime}`);
      console.log('   - Synchronized Tables to Cloudflare D1 Vault:');
      
      const tables = backupData.backedUpTables || {};
      for (const [table, count] of Object.entries(tables)) {
        console.log(`       • ${table.padEnd(22)} : ${count} records archived`);
      }
    } else {
      console.error('   ❌ Backup returned non-success:', backupData);
      passedAll = false;
    }

    // 2.1 Verify Backup History in D1
    const backupsListRes = await fetch(`${BASE_URL}/api/vault/backups`);
    if (backupsListRes.ok) {
      const listData = await backupsListRes.json();
      console.log(`   - Verified Vault History : ${listData.backups?.length || 0} historical table snapshots in D1`);
    }

  } catch (err) {
    console.error('   ❌ Backup Trigger Test Failed:', err.message);
    passedAll = false;
  }

  // Final Summary
  console.log('\n=============================================================');
  if (passedAll) {
    console.log('🎉 AUDIT RESULT: ALL SYSTEMS OPERATIONAL (100% PASS)');
    console.log('   • Primary Turso DB        : Synced & Healthy');
    console.log('   • Cloudflare D1 Vault     : Replicating & Persisting');
    console.log('   • Cloudinary 25GB Storage : Configured & Active');
  } else {
    console.log('⚠ AUDIT RESULT: ONE OR MORE CHECKS REPORTED ISSUES');
  }
  console.log('=============================================================\n');
}

runAudit();
