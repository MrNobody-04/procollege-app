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
      password_hash TEXT,
      role TEXT NOT NULL,
      college_id TEXT,
      institution_id TEXT,
      institution_name TEXT,
      status TEXT DEFAULT 'active',
      section_id TEXT,
      login_id TEXT,
      avatar_url TEXT
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
      token_hash TEXT NOT NULL,
      device_name TEXT,
      expires_at TEXT,
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
    sql: "INSERT INTO colleges (id, name) VALUES ('col_platform_root', 'ProCollege Platform Root'), ('col_test_campus', 'Apex Test College');",
    args: []
  });

  // Seed 4 demo users (one per role)
  await db.execute({
    sql: `INSERT INTO users (id, name, email, role, college_id, institution_id, institution_name, status) VALUES 
      ('user_dev_root', 'Platform Dev', 'dev@platform.local', 'developer', 'col_platform_root', 'col_platform_root', 'ProCollege Platform Root', 'active'),
      ('usr_test_admin', 'Campus Admin', 'admin@campus.local', 'admin', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'active'),
      ('usr_test_lecturer', 'Prof Newton', 'newton@campus.local', 'lecturer', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'active'),
      ('usr_test_student', 'Alice Student', 'alice@campus.local', 'student', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'active'),
      ('usr_inactive_user', 'Inactive User', 'inactive@campus.local', 'student', 'col_test_campus', 'col_test_campus', 'Apex Test College', 'suspended');
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
