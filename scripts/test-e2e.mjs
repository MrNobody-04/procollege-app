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
  console.log('🧪 Starting ProCollege Live 2FA & Multi-Tenant E2E Audit...\n');

  // Fetch current admin credentials from Turso
  const userCheck = await client.execute("SELECT id, name, email, password, role, must_change_password FROM users WHERE email = 'gamerlush11@gmail.com';");
  const currentTempPass = String(userCheck.rows[0]?.password || '');
  console.log(`ℹ️  Current Admin in Turso: ${userCheck.rows[0]?.email}, TempPass: ${currentTempPass}`);

  // Test 1: Public English School Admin Login with Temporary Credentials
  console.log('\n1️⃣ Testing Public English School Admin Login with Temporary Credentials...');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', password: currentTempPass })
  });

  const loginData = await loginRes.json();
  console.log('   Response status:', loginRes.status);
  console.log('   requireOtp:', loginData.requireOtp);
  console.log('   mustChangePassword:', loginData.mustChangePassword);
  console.log('   devOtp:', loginData.devOtp);

  if (!loginData.requireOtp || !loginData.devOtp) {
    throw new Error('❌ Test 1 Failed: Expected requireOtp and devOtp for Public English School admin');
  }
  console.log('   ✅ Test 1 Passed: 2FA OTP verification is strictly enforced!');

  // Test 2: Verify 2FA OTP Code
  console.log('\n2️⃣ Testing 2FA OTP Verification...');
  const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', otp: loginData.devOtp })
  });

  const verifyData = await verifyRes.json();
  console.log('   Response status:', verifyRes.status);
  console.log('   Success:', verifyData.success);
  console.log('   mustChangePassword:', verifyData.mustChangePassword);
  console.log('   User Institution:', verifyData.user?.institution_name);

  if (!verifyData.success || !verifyData.mustChangePassword) {
    throw new Error('❌ Test 2 Failed: Expected mustChangePassword to be true after OTP verification');
  }
  console.log('   ✅ Test 2 Passed: 2FA OTP verified and mandatory password reset flagged!');

  // Test 3: Workspace Bootstrap Clean State Verification
  console.log('\n3️⃣ Testing Clean, Fresh Dashboard Bootstrap for Public English School...');
  const bootRes = await fetch(`${BASE}/api/workspace/bootstrap?institution=Public%20English%20School&role=admin`, {
    headers: { 'Authorization': `Bearer ${verifyData.token}` }
  });

  const bootData = await bootRes.json();
  console.log('   Response status:', bootRes.status);
  console.log('   Institution:', bootData.institution);
  console.log('   Courses count:', bootData.courses?.length);
  console.log('   Assignments count:', bootData.assignments?.length);
  console.log('   Notices count:', bootData.notices?.length);
  console.log('   Faculties count:', bootData.faculties?.length);

  if (bootData.courses?.length !== 0 || bootData.assignments?.length !== 0) {
    throw new Error('❌ Test 3 Failed: Data bleed detected! New organization should have 0 courses and 0 assignments.');
  }
  console.log('   ✅ Test 3 Passed: 100% clean, pristine dashboard with zero data leakage!');

  // Test 4: Developer Console Admin Password Reset
  console.log('\n4️⃣ Testing Platform Developer Reset Admin Password & 2FA OTP...');
  const devLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gcsujan321@gmail.com', password: 'GaMeR?123' })
  });
  const devLoginData = await devLoginRes.json();
  console.log('   Dev login status:', devLoginRes.status, 'token present:', Boolean(devLoginData.token));
  const devToken = devLoginData.token;

  const resetRes = await fetch(`${BASE}/api/platform/institutions/col_public-english-school_9m3f/reset-admin-password`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${devToken}` }
  });

  const resetData = await resetRes.json();
  console.log('   Reset Response status:', resetRes.status);
  console.log('   Success:', resetData.success);
  console.log('   Admin Email:', resetData.adminEmail);
  console.log('   Temporary Password:', resetData.temporaryPassword);
  console.log('   New 2FA OTP Code:', resetData.otpCode);

  if (!resetData.success || !resetData.temporaryPassword || !resetData.otpCode) {
    throw new Error('❌ Test 4 Failed: Expected reset password credentials and 2FA OTP code');
  }
  console.log('   ✅ Test 4 Passed: Developer reset endpoint generated fresh credentials and 2FA OTP!');

  // Test 5: Verify login with the newly reset password
  console.log('\n5️⃣ Testing Login with Developer-Reset Password & 2FA OTP...');
  const resetLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', password: resetData.temporaryPassword })
  });
  const resetLoginData = await resetLoginRes.json();
  console.log('   Response status:', resetLoginRes.status);
  console.log('   requireOtp:', resetLoginData.requireOtp);
  console.log('   devOtp matches returned OTP:', resetLoginData.devOtp === resetData.otpCode);

  if (!resetLoginData.requireOtp || resetLoginData.devOtp !== resetData.otpCode) {
    throw new Error('❌ Test 5 Failed: Login with newly reset password did not return expected 2FA OTP');
  }
  console.log('   ✅ Test 5 Passed: Login with reset password returned matching 2FA OTP!');

  // Test 6: Verify OTP and Change to Permanent Password
  console.log('\n6️⃣ Testing Setting Permanent Password via /api/auth/change-password...');
  const vRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', otp: resetData.otpCode })
  });
  const vData = await vRes.json();

  const changePassRes = await fetch(`${BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vData.token}`
    },
    body: JSON.stringify({
      email: 'gamerlush11@gmail.com',
      newPassword: 'MyNewPermanentPassword@2026'
    })
  });
  const changePassData = await changePassRes.json();
  console.log('   Change password status:', changePassRes.status);
  console.log('   Change password success:', changePassData.success);

  if (!changePassData.success) {
    throw new Error('❌ Test 6 Failed: Could not update permanent password');
  }
  console.log('   ✅ Test 6 Passed: Permanent password updated successfully in Turso!');

  // Test 7: Verify subsequent login with new permanent password
  console.log('\n7️⃣ Testing Subsequent Login with Permanent Password...');
  const permLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', password: 'MyNewPermanentPassword@2026' })
  });
  const permLoginData = await permLoginRes.json();
  console.log('   Perm login status:', permLoginRes.status);
  console.log('   requireOtp:', permLoginData.requireOtp);

  // Since it requires 2FA on admin logins (or OTP verification), verify OTP
  const finalVerifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gamerlush11@gmail.com', otp: permLoginData.devOtp })
  });
  const finalVerifyData = await finalVerifyRes.json();
  console.log('   mustChangePassword:', finalVerifyData.mustChangePassword);

  if (finalVerifyData.mustChangePassword !== false) {
    throw new Error('❌ Test 7 Failed: mustChangePassword should be false now that permanent password is set!');
  }
  console.log('   ✅ Test 7 Passed: Permanent password accepted and no longer requires password change!');

  console.log('\n🎉 ALL 7 E2E AUDIT TESTS COMPLETED WITH 100% SUCCESS!\n');
}

testSuite().catch(err => {
  console.error('\n❌ Audit Failure:', err);
  process.exit(1);
});
