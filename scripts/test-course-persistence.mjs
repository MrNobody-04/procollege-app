import assert from 'node:assert/strict';
import app from '../src/worker.ts';
import { createClient } from '@libsql/client';
import fs from 'node:fs';
import { signJwt } from '../src/lib/jwt.ts';

const JWT_SECRET = 'super-secret-jwt-key-32-chars-at-least!';
const DB_FILE = 'local-course-test.db';
try { fs.unlinkSync(DB_FILE); } catch {}

async function runCourseTest() {
  console.log('🧪 Testing Course Creation & Refresh Persistence...');

  // Setup SQLite client for isolated testing
  const db = createClient({ url: `file:${DB_FILE}` });
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
    CREATE TABLE IF NOT EXISTS school_attendance (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      college_id TEXT,
      class_id TEXT,
      student_id TEXT,
      date TEXT,
      status TEXT,
      taken_by_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subject_attendance (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      college_id TEXT,
      course_id TEXT,
      subject_id TEXT,
      student_id TEXT,
      date TEXT,
      status TEXT,
      taken_by_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS assignment_attendance_overrides (
      id TEXT PRIMARY KEY,
      assignment_id TEXT,
      student_id TEXT,
      active INTEGER DEFAULT 1
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      college_id TEXT,
      institution_id TEXT,
      institution_name TEXT,
      name TEXT,
      email TEXT,
      role TEXT,
      status TEXT DEFAULT 'active'
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      college_id TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT,
      department_id TEXT,
      faculty_id TEXT,
      term TEXT,
      color TEXT DEFAULT '#4f46e5',
      icon TEXT DEFAULT '⚡',
      instructor_id TEXT,
      instructor_name TEXT,
      instructor_data TEXT,
      member_count INTEGER DEFAULT 0,
      is_activated INTEGER DEFAULT 1,
      model TEXT DEFAULT 'model-a',
      template TEXT DEFAULT 'Class',
      enrolled_students TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      college_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_general INTEGER DEFAULT 0,
      type TEXT DEFAULT 'general',
      student_file_permission TEXT DEFAULT 'read-only',
      subject_lecturer_name TEXT,
      subject_lecturer_id TEXT,
      unread_count INTEGER DEFAULT 0
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS faculties (
      id TEXT PRIMARY KEY,
      college_id TEXT NOT NULL,
      institution_name TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      head_id TEXT,
      head_name TEXT,
      dean_id TEXT,
      dean_name TEXT,
      description TEXT,
      subjects_json TEXT
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      college_id TEXT NOT NULL,
      institution_name TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      head_id TEXT,
      head_name TEXT,
      dean_id TEXT,
      dean_name TEXT,
      description TEXT
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      college_id TEXT,
      institution_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      college_id TEXT,
      institution_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS course_files (
      id TEXT PRIMARY KEY,
      college_id TEXT,
      course_id TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed college and admin user
  const collegeId = 'col_public-english-boarding-school_ln9o';
  const instName = 'PUBLIC ENGLISH BOARDING SCHOOL';
  await db.execute({
    sql: 'INSERT INTO colleges (id, name, code) VALUES (?, ?, ?);',
    args: [collegeId, instName, 'PEBS']
  });
  await db.execute({
    sql: 'INSERT INTO users (id, college_id, institution_id, name, email, role) VALUES (?, ?, ?, ?, ?, ?);',
    args: ['usr_admin_1', collegeId, collegeId, 'SURESH HAMAL', 'admin@pebs.edu.np', 'admin']
  });

  const env = {
    JWT_SECRET,
    TURSO_DB_URL: ':memory:',
    TURSO_AUTH_TOKEN: 'mock_token',
    __db: db,
    DEVELOPER_EMAIL: 'dev@procollege.io',
    DEVELOPER_PASSWORD: 'DevPassword123!'
  };

  const adminToken = await signJwt({
    id: 'usr_admin_1',
    email: 'admin@pebs.edu.np',
    role: 'admin',
    college_id: collegeId,
    institution_id: collegeId,
    institution_name: instName
  }, JWT_SECRET);

  // 1. Create a course when frontend passes default placeholder state ('ProCollege University Network')
  console.log('1. Testing course creation with client default placeholder state...');
  const res1 = await app.fetch(new Request('http://localhost/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      id: 'course_test_101',
      code: 'CLASS 10 C',
      name: 'CLASS 10 C',
      department: 'School Department',
      college_id: 'ProCollege University Network',
      institution_id: 'ProCollege University Network',
      institution_name: 'ProCollege University Network',
      channels: [
        { name: 'Announcements', isGeneral: true },
        { name: 'Math [MTH-101]', isGeneral: false, subjectLecturerName: 'SURESH HAMAL' }
      ]
    })
  }), env);

  assert.equal(res1.status, 201, 'Course creation must succeed with 201');
  const data1 = await res1.json();
  assert.equal(data1.success, true);
  console.log('   ✓ Course created successfully despite placeholder college_id!');

  // 2. Verify course in database has proper college_id and institution_name
  const dbCheck = await db.execute({
    sql: 'SELECT id, college_id, institution_name, code, name FROM courses WHERE id = ?;',
    args: ['course_test_101']
  });
  assert.equal(dbCheck.rows.length, 1);
  assert.equal(dbCheck.rows[0].college_id, collegeId);
  assert.equal(dbCheck.rows[0].institution_name, instName);
  console.log('   ✓ Database record strictly mapped to caller tenant:', dbCheck.rows[0].college_id);

  // 3. Simulate page refresh: call GET /api/workspace/bootstrap
  console.log('\n2. Testing page refresh via GET /api/workspace/bootstrap...');
  const bootRes = await app.fetch(new Request(`http://localhost/api/workspace/bootstrap?institution=${encodeURIComponent(instName)}&role=admin`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }), env);

  if (bootRes.status !== 200) {
    console.error('Bootstrap failed with status', bootRes.status, await bootRes.text());
  }
  assert.equal(bootRes.status, 200, 'Bootstrap must return 200');
  const bootData = await bootRes.json();
  assert.equal(bootData.success, true);
  const foundCourse = bootData.courses.find(c => c.id === 'course_test_101');
  assert(foundCourse, 'Created course must be present after refresh in bootstrap courses!');
  assert.equal(foundCourse.name, 'CLASS 10 C');
  assert.equal(foundCourse.collegeId, collegeId);
  assert.equal(foundCourse.channels.length, 2);
  console.log('   ✓ Course and its channels retrieved upon refresh in bootstrap payload!');

  // 4. Test Cross-Tenant Attack Protection: Admin attempting to create course under another tenant
  console.log('\n3. Testing Cross-Tenant Attack Protection...');
  const maliciousRes = await app.fetch(new Request('http://localhost/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      id: 'course_malicious',
      code: 'HACK 101',
      name: 'Hacked Class',
      college_id: 'col_other_foreign_tenant',
      channels: []
    })
  }), env);

  assert.equal(maliciousRes.status, 500);
  const malData = await maliciousRes.json();
  assert.equal(malData.error, 'FORBIDDEN_TENANT_MISMATCH');
  console.log('   ✓ Cross-tenant attack strictly rejected with FORBIDDEN_TENANT_MISMATCH!');

  console.log('\n🎉 ALL COURSE CREATION & REFRESH PERSISTENCE TESTS PASSED 100%!');
}

runCourseTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
