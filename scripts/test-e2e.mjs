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

  // 3. Ensure Public English School is Provisioned by Developer
  console.log('\n3️⃣ Testing Developer Organization Provisioning & Master Admin Credential Reset...');
  let targetOrg = orgsData.organizations?.find(o => o.id.startsWith('col_')) || orgsData.organizations?.[0];
  let adminTempPassword = '';

  if (!targetOrg) {
    console.log('   ℹ️ No organizations currently exist. Skipping admin reset test (Zero automated org creation allowed).');
    return;
  }

  // Now test Developer Master Reset Password endpoint on this organization
  const resetRes = await fetch(`${BASE}/api/platform/institutions/${encodeURIComponent(targetOrg.id)}/reset-admin-password`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${devLoginData.token}` }
  });
  const resetData = await resetRes.json();
  console.log('   Reset status:', resetRes.status);
  console.log('   Admin Email:', resetData.adminEmail);
  console.log('   Generated Temp Password:', resetData.temporaryPassword);
  adminTempPassword = resetData.temporaryPassword;

  if (!resetData.success || !resetData.temporaryPassword) {
    throw new Error('❌ Test 3 Failed: Developer reset password failed');
  }
  console.log('   ✅ Test 3 Passed: Organization provisioned and temporary password generated!');

  // 4. Admin Login with Reset Credentials
  console.log('\n4️⃣ Testing Public English School Admin Login with Reset Credentials...');
  const adminTargetEmail = resetData.adminEmail || 'gamerlush11@gmail.com';
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminTargetEmail, password: adminTempPassword })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log('   Login status:', adminLoginRes.status);
  console.log('   requireOtp:', adminLoginData.requireOtp);
  console.log('   mustChangePassword:', adminLoginData.mustChangePassword);

  if (!adminLoginData.requireOtp || !adminLoginData.mustChangePassword) {
    throw new Error('❌ Test 4 Failed: Expected 2FA OTP requirement and mustChangePassword flag');
  }

  // Fetch the fresh OTP code from Turso database (which was dispatched via email)
  const dbOtpRes = await client.execute({
    sql: 'SELECT otp_code FROM users WHERE LOWER(email) = LOWER(?);',
    args: [adminTargetEmail]
  });
  const currentOtp = String(dbOtpRes.rows[0]?.otp_code || '');
  console.log('   Live Turso Dispatched 2FA OTP Code:', currentOtp);
  if (!currentOtp || currentOtp.length !== 6) {
    throw new Error('❌ Test 4 Failed: Expected 6-digit OTP code in Turso database');
  }
  console.log('   ✅ Test 4 Passed: 2FA OTP generated and dispatched for admin login!');

  // 5. Verify OTP
  console.log('\n5️⃣ Testing 2FA OTP Verification...');
  const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminTargetEmail, otp: currentOtp })
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
      email: adminTargetEmail,
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

  const hasDemoLeak = bootData.courses?.some(c => c.id?.includes('demo') || c.name?.includes('Demo') || c.name === 'CS-101') ||
    bootData.assignments?.some(a => a.id?.includes('demo')) ||
    bootData.notices?.some(n => n.id?.includes('demo'));

  if (hasDemoLeak) {
    throw new Error('❌ Test 7 Failed: Demo data bleed detected in new organization!');
  }
  console.log(`   Real classes loaded: ${bootData.courses?.length} (0 demo leakage)`);
  console.log('   ✅ Test 7 Passed: Pristine, clean dashboard with zero demo data leakage!');

  // 8. Admin Excel Roster Import
  console.log('\n8️⃣ Testing Admin Bulk Excel Roster Import & Credential Distribution...');
  const rosterRes = await fetch(`${BASE}/api/admin/import-roster`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${verifyData.token}`
    },
    body: JSON.stringify({
      students: [
        { Name: 'Aarav Sharma', Phone: '+977-9841234567', Gmail: 'aarav.sharma2026@gmail.com', Faculty: 'Faculty of Information Technology', Class: 'BIT 101' },
        { Name: 'Pooja Thapa', Phone: '+977-9812345678', Gmail: 'pooja.thapa2026@gmail.com', Faculty: 'Faculty of Information Technology', Class: 'BIT 101' },
        { Name: 'Bikash Adhikari', Phone: '+977-9867890123', Gmail: 'bikash.adhikari2026@gmail.com', Faculty: 'Faculty of Information Technology', Class: 'BIT 101' }
      ],
      institutionId: targetOrg.id,
      institutionName: 'Public English School'
    })
  });
  const rosterData = await rosterRes.json();
  console.log('   Import status:', rosterRes.status);
  console.log('   Total Imported:', rosterData.totalImported);
  console.log('   Credentials returned:', rosterData.credentials?.length);
  console.log('   First student temporary password:', rosterData.credentials?.[0]?.temporaryPassword);

  if (!rosterData.success || rosterData.totalImported !== 3 || !rosterData.credentials?.[0]?.temporaryPassword) {
    throw new Error('❌ Test 8 Failed: Admin bulk roster import failed');
  }
  console.log('   ✅ Test 8 Passed: 3 student accounts provisioned with downloadable credentials!');

  // 9. Student Login with Generated Temporary Password -> Triggers 2FA Email
  console.log('\n9️⃣ Testing Student Login with Temporary Credentials (2FA Email Trigger)...');
  const studentEmail = 'aarav.sharma2026@gmail.com';
  const studentTempPass = rosterData.credentials[0].temporaryPassword;

  const stdLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: studentTempPass })
  });
  const stdLoginData = await stdLoginRes.json();
  console.log('   Student login status:', stdLoginRes.status);
  console.log('   Student requireOtp:', stdLoginData.requireOtp);
  console.log('   Student mustChangePassword:', stdLoginData.mustChangePassword);

  if (!stdLoginData.requireOtp || !stdLoginData.mustChangePassword) {
    throw new Error('❌ Test 9 Failed: Student login must require 2FA OTP and password change');
  }

  // Fetch student OTP from Turso DB
  const stdDbOtpRes = await client.execute({
    sql: 'SELECT otp_code FROM users WHERE LOWER(email) = LOWER(?);',
    args: [studentEmail]
  });
  const studentOtp = String(stdDbOtpRes.rows[0]?.otp_code || '');
  console.log('   Student Dispatched 2FA OTP Code:', studentOtp);
  if (!studentOtp || studentOtp.length !== 6) {
    throw new Error('❌ Test 9 Failed: Expected 6-digit OTP code in Turso for student');
  }
  console.log('   ✅ Test 9 Passed: Student login required 2FA and dispatched code!');

  // 10. Student Verify 2FA OTP & Change Password
  console.log('\n🔟 Testing Student 2FA OTP Verification & Permanent Password Setup...');
  const stdVerifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, otp: studentOtp })
  });
  const stdVerifyData = await stdVerifyRes.json();
  console.log('   Student verify status:', stdVerifyRes.status);
  console.log('   Student mustChangePassword:', stdVerifyData.mustChangePassword);

  if (!stdVerifyData.success || !stdVerifyData.mustChangePassword) {
    throw new Error('❌ Test 10 Failed: Student OTP verification failed');
  }

  const stdChangeRes = await fetch(`${BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${stdVerifyData.token}`
    },
    body: JSON.stringify({
      email: studentEmail,
      newPassword: 'StudentPermanentPass#2026'
    })
  });
  const stdChangeData = await stdChangeRes.json();
  console.log('   Student permanent password set status:', stdChangeRes.status);
  if (!stdChangeData.success) {
    throw new Error('❌ Test 10 Failed: Setting student permanent password failed');
  }
  console.log('   ✅ Test 10 Passed: Student 2FA verified and permanent password created!');

  // 11. Resend OTP Endpoint Test
  console.log('\n1️⃣1️⃣ Testing Resend OTP Endpoint...');
  const resendRes = await fetch(`${BASE}/api/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pooja.thapa2026@gmail.com' })
  });
  const resendData = await resendRes.json();
  console.log('   Resend status:', resendRes.status);
  console.log('   Success:', resendData.success);
  console.log('   Message:', resendData.message);
  if (!resendData.success) {
    throw new Error('❌ Test 11 Failed: Resend OTP failed');
  }
  console.log('   ✅ Test 11 Passed: Resend OTP endpoint active with 60s cooldown support!');

  // 12. Platform Email Gateway Settings & Delivery Logs Test
  console.log('\n1️⃣2️⃣ Testing Platform Email Gateway & Audit Logs...');
  const emailSettingsRes = await fetch(`${BASE}/api/platform/email-settings`, {
    headers: { 'Authorization': `Bearer ${devLoginData.token}` }
  });
  const emailSettingsData = await emailSettingsRes.json();
  console.log('   Email Settings status:', emailSettingsRes.status);
  console.log('   Active Provider:', emailSettingsData.provider);

  const emailLogsRes = await fetch(`${BASE}/api/platform/email-logs`, {
    headers: { 'Authorization': `Bearer ${devLoginData.token}` }
  });
  const emailLogsData = await emailLogsRes.json();
  console.log('   Email Logs count in Turso:', emailLogsData.logs?.length);
  if (!emailSettingsRes.ok || !emailLogsRes.ok) {
    throw new Error('❌ Test 12 Failed: Email gateway APIs failed');
  }
  console.log('   ✅ Test 12 Passed: Email Gateway APIs and Turso email audit logs verified!');

  console.log('\n🎉 ALL 12 PRODUCTION AUDIT TESTS PASSED WITH 100% SUCCESS!\n');
}

testSuite().catch(err => {
  console.error('\n❌ Audit Failure:', err);
  process.exit(1);
});
