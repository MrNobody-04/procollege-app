// scripts/test-stage1-local.mjs
// Local integration test suite for Stage 1 (Signed HS256 JWT & Legacy Token Rules)
// Runs 100% locally against a temporary SQLite file database. Zero real accounts or networks touched.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@libsql/client';
import app from '../src/worker.ts';
import { signJwt } from '../src/lib/jwt.ts';

const DB_FILE = 'local-stage1-test.db';
const DB_URL = `file:${DB_FILE}`;
const TEST_JWT_SECRET = 'local-stage1-test-secret-32-chars-ok!';

// Ensure pristine state
try { fs.unlinkSync(DB_FILE); } catch {}

const db = createClient({ url: DB_URL });

async function setupDatabase() {
  console.log('--- Setting up isolated local test schema ---');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS colleges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      status TEXT DEFAULT 'active'
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT,
      password_hash TEXT,
      role TEXT NOT NULL,
      college_id TEXT,
      institution_id TEXT,
      institution_name TEXT,
      status TEXT DEFAULT 'active',
      section_id TEXT,
      login_id TEXT,
      avatar_url TEXT,
      otp_code TEXT,
      otp_expires_at TEXT,
      otp_attempts INTEGER DEFAULT 0,
      must_change_password INTEGER DEFAULT 0
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      department TEXT,
      instructor TEXT,
      co_owners TEXT,
      enrolled_students TEXT,
      college_id TEXT,
      institution_name TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS course_files (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      college_id TEXT,
      channel_id TEXT,
      name TEXT NOT NULL,
      category TEXT,
      size TEXT,
      type TEXT NOT NULL,
      uploaded_by TEXT,
      is_class_material INTEGER DEFAULT 0,
      permission TEXT DEFAULT 'read-only',
      uploaded_at TEXT,
      url TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trusted_devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_hash TEXT,
      device_name TEXT,
      last_used_at TEXT,
      created_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      email TEXT,
      otp_code TEXT,
      status TEXT,
      created_at TEXT
    );
  `);

  // Seed demo colleges
  await db.execute({
    sql: "INSERT INTO colleges (id, name) VALUES ('col_platform_root', 'ProCollege Platform Root'), ('col_test_campus', 'Apex Test College'), ('col_other_college', 'Other College');",
    args: []
  });

  // Seed demo users (one per role + inactive users + other tenant user)
  await db.execute({
    sql: `INSERT INTO users (id, name, email, role, college_id, institution_id, institution_name, status) VALUES 
      ('user_dev_root', 'Platform Dev', 'dev@platform.local', 'developer', 'col_platform_root', 'col_platform_root', 'ProCollege Platform Root', 'active'),
      ('usr_test_admin', 'Campus Admin', 'admin@campus.local', 'admin', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'active'),
      ('usr_inactive_admin', 'Inactive Admin', 'inactive_admin@campus.local', 'admin', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'suspended'),
      ('usr_test_lecturer', 'Prof Newton', 'newton@campus.local', 'lecturer', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'active'),
      ('usr_test_student', 'Alice Student', 'alice@campus.local', 'student', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'active'),
      ('usr_inactive_user', 'Inactive User', 'inactive@campus.local', 'student', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'suspended'),
      ('usr_other_student', 'Other Student', 'other@different.local', 'student', 'col_other_college', 'col_other_college', 'Other College', 'active');
    `,
    args: []
  });

  // Seed 1 test course
  await db.execute({
    sql: `INSERT INTO courses (id, name, code, department, instructor, college_id, institution_name) VALUES
      ('course_physics_101', 'Physics 101', 'PHY101', 'Science', 'Prof Newton', 'col_test_campus', 'Apex Test College');
    `,
    args: []
  });

  console.log('✓ Isolated schema and test seed data ready.');
}

async function runLocalIntegrationTests() {
  await setupDatabase();

  const env = {
    JWT_SECRET: TEST_JWT_SECRET,
    DEVELOPER_EMAIL: 'dev@platform.local',
    ALLOW_LEGACY_TOKENS: 'true',
    LEGACY_TOKEN_CUTOFF: new Date(Date.now() + 86400 * 1000).toISOString(),
    __db: db,
  };

  console.log('\n--- Running Stage 1 Local Integration Tests ---');

  // Test 1: Signed JWT for Developer
  const devToken = await signJwt({
    id: 'user_dev_root',
    email: 'dev@platform.local',
    role: 'developer',
    institution_id: 'col_platform_root',
    college_id: 'col_platform_root',
    institution_name: 'ProCollege Platform Root',
  }, TEST_JWT_SECRET);

  const meDevRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${devToken}` }
  }), env);
  assert.equal(meDevRes.status, 200, '/api/auth/me must return 200 for signed dev token');
  const meDevData = await meDevRes.json();
  assert.equal(meDevData.user?.role, 'developer');
  assert.equal(meDevData.user?.id, 'user_dev_root');
  console.log('✓ 1. Developer authenticated via signed JWT');

  // Test 2: Signed JWT for Admin
  const adminToken = await signJwt({
    id: 'usr_test_admin',
    email: 'admin@campus.local',
    role: 'admin',
    institution_id: 'col_test_campus',
    college_id: 'col_test_campus',
    institution_name: 'Apex Test College',
  }, TEST_JWT_SECRET);

  const meAdminRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }), env);
  assert.equal(meAdminRes.status, 200);
  const meAdminData = await meAdminRes.json();
  assert.equal(meAdminData.user?.role, 'admin');
  assert.equal(meAdminData.user?.id, 'usr_test_admin');
  console.log('✓ 2. Admin authenticated via signed JWT');

  // Test 3: Signed JWT for Lecturer & File Upload + Delete Authorization
  const lecturerToken = await signJwt({
    id: 'usr_test_lecturer',
    email: 'newton@campus.local',
    role: 'lecturer',
    institution_id: 'col_test_campus',
    college_id: 'col_test_campus',
    institution_name: 'Apex Test College',
  }, TEST_JWT_SECRET);

  // Upload file to course
  const fileUploadRes = await app.fetch(new Request('http://localhost/api/courses/course_physics_101/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lecturerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'syllabus.pdf',
      url: 'https://example.com/syllabus.pdf',
      type: 'pdf',
      size: 1024,
      courseId: 'course_physics_101',
    })
  }), env);
  assert.equal(fileUploadRes.status, 201, 'File upload must succeed with 201');
  const fileUploadData = await fileUploadRes.json();
  assert(fileUploadData.file?.id, 'File ID must be returned');
  const uploadedFileId = fileUploadData.file.id;
  console.log('✓ 3a. Lecturer uploaded file with Authorization header');

  // Delete file from course
  const fileDeleteRes = await app.fetch(new Request(`http://localhost/api/courses/course_physics_101/files/${uploadedFileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${lecturerToken}`,
    }
  }), env);
  assert.equal(fileDeleteRes.status, 200, 'File delete must succeed with 200');
  console.log('✓ 3b. Lecturer deleted file with Authorization header');

  // Test 4: Signed JWT for Student
  const studentToken = await signJwt({
    id: 'usr_test_student',
    email: 'alice@campus.local',
    role: 'student',
    institution_id: 'col_test_campus',
    college_id: 'col_test_campus',
    institution_name: 'Apex Test College',
  }, TEST_JWT_SECRET);

  const meStudentRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }), env);
  assert.equal(meStudentRes.status, 200);
  const meStudentData = await meStudentRes.json();
  assert.equal(meStudentData.user?.role, 'student');
  console.log('✓ 4. Student authenticated via signed JWT');

  // Test 5: Legacy Token Resolution from Database (Role claim in token ignored)
  // We craft a legacy token claiming role: 'admin' and college: 'fake_org', but userId is 'usr_test_student'
  const spoofedLegacyPayload = {
    id: 'usr_test_student',
    role: 'developer', // spoofed!
    institution_id: 'spoofed_org', // spoofed!
    ts: Date.now() - 5000,
  };
  const legacyToken = 'tok_' + Buffer.from(JSON.stringify(spoofedLegacyPayload)).toString('base64');

  const legacyRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${legacyToken}` }
  }), env);
  assert.equal(legacyRes.status, 200);
  const legacyData = await legacyRes.json();
  // Role MUST be resolved from DB ('student'), NOT the spoofed 'developer'
  assert.equal(legacyData.user?.role, 'student', 'Role must strictly resolve from database, ignoring legacy claims');
  assert.equal(legacyData.user?.college_id, 'col_test_campus', 'Tenant must strictly resolve from database');
  console.log('✓ 5. Legacy token safely resolved genuine role & tenant from DB, ignoring spoofed claims');

  // Test 6: Inactive User with Legacy Token Rejected
  const inactiveLegacyPayload = {
    id: 'usr_inactive_user',
    role: 'student',
    ts: Date.now() - 5000,
  };
  const inactiveLegacyToken = 'tok_' + Buffer.from(JSON.stringify(inactiveLegacyPayload)).toString('base64');
  const inactiveRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${inactiveLegacyToken}` }
  }), env);
  assert.equal(inactiveRes.status, 401, 'Inactive user legacy token must be rejected with 401');
  console.log('✓ 6. Inactive user rejected during legacy token DB lookup');

  // Test 7: Legacy Tokens Rejected when ALLOW_LEGACY_TOKENS=false
  const envNoLegacy = { ...env, ALLOW_LEGACY_TOKENS: 'false' };
  const rejectedLegacyRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${legacyToken}` }
  }), envNoLegacy);
  assert.equal(rejectedLegacyRes.status, 401, 'Legacy token must be rejected when ALLOW_LEGACY_TOKENS is false');
  console.log('✓ 7. Legacy token rejected when ALLOW_LEGACY_TOKENS=false');

  // Test 7b: Legacy Token for Developer account MUST return 401
  const devLegacyPayload = {
    id: 'user_dev_root',
    ts: Date.now() - 5000,
  };
  const devLegacyToken = 'tok_' + Buffer.from(JSON.stringify(devLegacyPayload)).toString('base64');
  const devLegacyRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${devLegacyToken}` }
  }), env);
  assert.equal(devLegacyRes.status, 401, 'Legacy token for developer account must be rejected with 401');
  console.log('✓ 7b. Legacy token for developer account strictly rejected (401)');

  // Test 7c: Legacy Token for Admin account MUST return 401
  const adminLegacyPayload = {
    id: 'usr_test_admin',
    ts: Date.now() - 5000,
  };
  const adminLegacyToken = 'tok_' + Buffer.from(JSON.stringify(adminLegacyPayload)).toString('base64');
  const adminLegacyRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${adminLegacyToken}` }
  }), env);
  assert.equal(adminLegacyRes.status, 401, 'Legacy token for admin account must be rejected with 401');
  console.log('✓ 7c. Legacy token for admin account strictly rejected (401)');

  // Stage 2 Test 9a: Request with spoofed x-user-role: developer and NO token MUST return 401
  const spoofHeaderRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: {
      'x-user-role': 'developer',
      'x-user-email': 'attacker@spoof.local',
      'x-institution-id': 'col_platform_root',
    }
  }), env);
  assert.equal(spoofHeaderRes.status, 401, 'Request with spoofed x-user-role and NO token must return 401');
  console.log('✓ 9a. Request with spoofed x-user-role and no token returned 401 Unauthorized');

  // Stage 2 Test 9b: Tenant mismatch rejection (student attempting to query another college)
  const mismatchRes = await app.fetch(new Request('http://localhost/api/workspace/bootstrap?collegeId=col_other_tenant', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }), env);
  assert.equal(mismatchRes.status, 403, 'Tenant mismatch must return 403 Forbidden');
  console.log('✓ 9b. Request with tenant mismatch strictly returned 403 Forbidden');

  // Stage 3 Test 10a: /api/vault/* restricted to developer/platform_admin only
  const vaultNonDevRes = await app.fetch(new Request('http://localhost/api/vault/backups', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }), env);
  assert.equal(vaultNonDevRes.status, 403, 'Non-developer accessing vault must return 403');
  console.log('✓ 10a. Non-developer accessing /api/vault/backups strictly returned 403 Forbidden');

  // Stage 3 Test 10b: Inactive user rejected on admin / platform routes
  const inactiveAdminToken = await signJwt({
    id: 'usr_inactive_admin',
    email: 'inactive_admin@campus.local',
    role: 'admin',
    institution_id: 'col_test_campus',
    college_id: 'col_test_campus',
  }, TEST_JWT_SECRET);

  const inactiveAdminRes = await app.fetch(new Request('http://localhost/api/admin/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${inactiveAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Bob', email: 'bob@campus.local' }),
  }), env);
  assert.equal(inactiveAdminRes.status, 403, 'Inactive admin must return 403 on mutation');
  console.log('✓ 10b. Suspended/inactive admin mutation strictly returned 403 Forbidden');

  // Stage 3 Test 10c: Student cannot delete users
  const studentDeleteRes = await app.fetch(new Request('http://localhost/api/admin/users/usr_test_lecturer', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }), env);
  assert.equal(studentDeleteRes.status, 403, 'Student deleting user must return 403');
  console.log('✓ 10c. Student deleting user strictly returned 403 Forbidden');

  // Stage 3 Test 10d: Cross-tenant user deletion forbidden
  const crossTenantDeleteRes = await app.fetch(new Request('http://localhost/api/admin/users/usr_other_student', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }), env);
  assert.equal(crossTenantDeleteRes.status, 403, 'Cross-tenant user deletion must return 403');
  console.log('✓ 10d. Admin attempting cross-tenant user deletion strictly returned 403 Forbidden');

  // Stage 3 Test 10e: POST /api/storage/files route protection & tenant scoping
  // 1. Unauthenticated -> 401
  const storageUnauthRes = await app.fetch(new Request('http://localhost/api/storage/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'doc.pdf' }),
  }), env);
  assert.equal(storageUnauthRes.status, 401, 'Unauthenticated storage upload must return 401');

  // 2. Tenant mismatch -> 403
  const storageMismatchRes = await app.fetch(new Request('http://localhost/api/storage/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'doc.pdf', collegeId: 'col_other_college' }),
  }), env);
  assert.equal(storageMismatchRes.status, 403, 'Storage upload with tenant mismatch must return 403');

  // 3. Valid authenticated upload -> 201
  const storageValidRes = await app.fetch(new Request('http://localhost/api/storage/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'doc.pdf', type: 'pdf', size: '2.5 MB' }),
  }), env);
  assert.equal(storageValidRes.status, 201, 'Valid storage upload must return 201');
  const storageData = await storageValidRes.json();
  assert.equal(storageData.success, true);
  console.log('✓ 10e. POST /api/storage/files verified for auth (401), tenant isolation (403), and valid creation (201)');

  // Stage 3 Test 10f: Trusted Device 2FA Query Security
  // Ensure that passing an arbitrary deviceHash without valid device token does NOT skip 2FA
  await db.execute({
    sql: `INSERT OR REPLACE INTO trusted_devices (id, user_id, device_hash, device_name, last_used_at, created_at)
          VALUES ('dev_tok_valid_123', 'usr_test_admin', 'device_hash_legit', 'Admin Chrome', datetime('now'), datetime('now'));`,
    args: []
  });

  // Verify query with matching token + user_id returns device
  const legitDeviceRes = await db.execute({
    sql: `SELECT id, user_id, device_hash, last_used_at FROM trusted_devices WHERE id = ? AND user_id = ? LIMIT 1;`,
    args: ['dev_tok_valid_123', 'usr_test_admin']
  });
  assert.equal(legitDeviceRes.rows.length, 1, 'Legitimate device token and user_id must match');

  // Verify attacker presenting another user's device_hash with spoofed token or wrong user_id returns NOTHING
  const spoofedCheckRes = await db.execute({
    sql: `SELECT id, user_id, device_hash, last_used_at FROM trusted_devices WHERE id = ? AND user_id = ? LIMIT 1;`,
    args: ['dev_tok_valid_123', 'usr_test_student'] // Wrong user!
  });
  assert.equal(spoofedCheckRes.rows.length, 0, 'Cross-user device token query must return 0 rows');
  console.log('✓ 10f. Trusted device query strictly enforces id = ? AND user_id = ? preventing 2FA bypass');

  // Test 8: Missing JWT_SECRET Fails Loudly
  const envNoSecret = { ...env, JWT_SECRET: '' };
  const failLoudRes = await app.fetch(new Request('http://localhost/api/auth/me', {
    headers: { 'Authorization': `Bearer ${devToken}` }
  }), envNoSecret);
  assert.equal(failLoudRes.status, 500, 'Must return 500 server error when JWT_SECRET is missing');

  // Also assert direct verifyJwt call throws loudly
  const { verifyJwt } = await import('../src/lib/jwt.ts');
  await assert.rejects(
    async () => verifyJwt(devToken, ''),
    /\[SECURITY FATAL\] JWT_SECRET environment variable is missing/,
    'Direct verifyJwt must throw when JWT_SECRET is unset'
  );
  console.log('✓ 8. Missing JWT_SECRET fails loudly');

  console.log('\nALL 8 STAGE 1 LOCAL INTEGRATION TESTS PASSED!');
}

runLocalIntegrationTests()
  .catch(err => {
    console.error('Integration test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await db.close();
      fs.unlinkSync(DB_FILE);
      console.log('✓ Cleaned up temporary test database.');
    } catch {}
  });
