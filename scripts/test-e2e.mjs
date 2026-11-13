import { createClient } from '@libsql/client/web';
import fs from 'node:fs';

const BASE = 'https://procollege-app.sujan-bit-n2024.workers.dev';

// Read Turso auth token
const envContent = fs.readFileSync('.dev.vars', 'utf-8');
let token = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('TURSO_AUTH_TOKEN=')) token = line.split('=')[1].trim().replace(/['"]/g, '');
}

const client = createClient({
  url: 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io',
  authToken: token
});

async function testSuite() {
  console.log('🧪 Starting Clean Production E2E Verification...\n');

  // 1. Developer Login
  console.log('1️⃣ Testing Platform Developer Login...');
  const devLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gcsujan321@gmail.com', password: 'GaMeR?123' })
  });
  const devLoginData = await devLoginRes.json();
  console.log('   Dev login status:', devLoginRes.status);
  console.log('   Dev token present:', Boolean(devLoginData.token));
  console.log('   Role:', devLoginData.user?.role);
  console.log('   Institution:', devLoginData.user?.institution_name);

  if (!devLoginData.token || devLoginData.user?.role !== 'developer') {
    throw new Error('❌ Test 1 Failed: Developer login failed');
  }
  console.log('   ✅ Test 1 Passed: Developer login verified!');

  // 2. Platform Organizations List - Zero Demo Orgs Allowed!
  console.log('\n2️⃣ Testing Platform Organizations List (Zero Demo Orgs Allowed)...');
  const orgsRes = await fetch(`${BASE}/api/platform/institutions`, {
    headers: { 'Authorization': `Bearer ${devLoginData.token}` }
  });
  const orgsData = await orgsRes.json();
  console.log('   Status:', orgsRes.status);
  console.log('   Organizations Count:', orgsData.organizations?.length);
  console.log('   Organizations:', orgsData.organizations?.map(o => `${o.name} (${o.id})`));

  const hasDemo = orgsData.organizations?.some(o => 
    o.id.includes('padmashree') || o.name.toLowerCase().includes('padmashree') ||
    o.id.includes('stanford') || o.name.toLowerCase().includes('stanford') ||
    o.id.includes('procollege_network') || o.name.toLowerCase().includes('procollege university network')
  );

  if (hasDemo) {
    throw new Error('❌ Test 2 Failed: Unwanted demo organizations found in organizations list!');
  }
  console.log('   ✅ Test 2 Passed: No demo organizations exist! Only legitimate institutions returned.');

  // 3. Reset Admin Password & 2FA OTP for Public English School
  console.log('\n3️⃣ Testing Developer Reset Admin Password & 2FA OTP for Public English School...');
  const resetRes = await fetch(`${BASE}/api/platform/institutions/col_public-english-school_9m3f/reset-admin-password`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${devLoginData.token}` }
  });
  const resetData = await resetRes.json();
  console.log('   Reset status:', resetRes.status);
  console.log('   Admin Email:', resetData.adminEmail);
  console.log('   Generated Temp Password:', resetData.temporaryPassword);
  console.log('   Generated 2FA OTP:', resetData.otpCode);

  if (!resetData.success || !resetData.temporaryPassword || !resetData.otpCode) {
    throw new Error('❌ Test 3 Failed: Developer reset password failed');
  }
  console.log('   ✅ Test 3 Passed: Fresh temporary password and 2FA OTP generated!');

  // 4. Admin Login with Reset Credentials
  console.log('\n4️⃣ Testing Public English School Admin Login with Reset Credentials...');
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', password: resetData.temporaryPassword })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log('   Login status:', adminLoginRes.status);
  console.log('   requireOtp:', adminLoginData.requireOtp);
  console.log('   mustChangePassword:', adminLoginData.mustChangePassword);
  console.log('   OTP matches generated:', adminLoginData.devOtp === resetData.otpCode);

  if (!adminLoginData.requireOtp || adminLoginData.devOtp !== resetData.otpCode) {
    throw new Error('❌ Test 4 Failed: Expected 2FA OTP requirement matching generated OTP');
  }
  console.log('   ✅ Test 4 Passed: 2FA OTP verified on admin login!');

  // 5. Verify OTP
  console.log('\n5️⃣ Testing 2FA OTP Verification...');
  const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', otp: resetData.otpCode })
  });
  const verifyData = await verifyRes.json();
  console.log('   Verify status:', verifyRes.status);
  console.log('   mustChangePassword:', verifyData.mustChangePassword);
  console.log('   User Institution:', verifyData.user?.institution_name);

  if (!verifyData.success || !verifyData.mustChangePassword) {
    throw new Error('❌ Test 5 Failed: OTP verification failed or password reset flag missing');
  }
  console.log('   ✅ Test 5 Passed: OTP verified and password change required!');

  // 6. Set Permanent Password
  console.log('\n6️⃣ Testing Setting Permanent Password...');
  const changeRes = await fetch(`${BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${verifyData.token}`
    },
    body: JSON.stringify({
      email: 'gamerlush11@gmail.com',
      newPassword: 'SchoolPermanentPass#2026'
    })
  });
  const changeData = await changeRes.json();
  console.log('   Change password status:', changeRes.status);
  console.log('   Success:', changeData.success);

  if (!changeData.success) {
    throw new Error('❌ Test 6 Failed: Password change failed');
  }
  console.log('   ✅ Test 6 Passed: Permanent password saved in Turso!');

  // 7. Workspace Bootstrap Clean State Verification
  console.log('\n7️⃣ Testing Workspace Bootstrap for Public English School (Zero Data Bleed)...');
  const bootRes = await fetch(`${BASE}/api/workspace/bootstrap?institution=Public%20English%20School&role=admin`, {
    headers: { 'Authorization': `Bearer ${verifyData.token}` }
  });
  const bootData = await bootRes.json();
  console.log('   Bootstrap status:', bootRes.status);
  console.log('   Institution:', bootData.institution);
  console.log('   Courses count:', bootData.courses?.length);
  console.log('   Assignments count:', bootData.assignments?.length);
  console.log('   Notices count:', bootData.notices?.length);
  console.log('   Faculties count:', bootData.faculties?.length);

  if (bootData.courses?.length !== 0 || bootData.assignments?.length !== 0 || bootData.notices?.length !== 0) {
    throw new Error('❌ Test 7 Failed: Demo data bleed detected in new organization!');
  }
  console.log('   ✅ Test 7 Passed: Pristine, clean dashboard with zero demo data leakage!');

  console.log('\n🎉 ALL 7 PRODUCTION AUDIT TESTS PASSED WITH 100% SUCCESS!\n');
}

testSuite().catch(err => {
  console.error('\n❌ Audit Failure:', err);
  process.exit(1);
});
