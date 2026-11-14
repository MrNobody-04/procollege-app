import 'dotenv/config';
import { createClient } from '@libsql/client/web';
import fs from 'node:fs';
import path from 'node:path';

// Parse .dev.vars or .env for local script execution
const loadEnvFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        const val = v.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
};

loadEnvFile(path.resolve(process.cwd(), '.dev.vars'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const url = process.env.TURSO_DB_URL || 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('---------------------------------------------------------');
console.log('🚀 Connecting to Turso Database:');
console.log('   URL:', url);
console.log('   Auth Token:', authToken ? `${authToken.slice(0, 10)}...${authToken.slice(-8)}` : 'MISSING!');
console.log('---------------------------------------------------------');

if (!authToken) {
  console.error('❌ Error: TURSO_AUTH_TOKEN is missing in environment!');
  process.exit(1);
}

const db = createClient({
  url,
  authToken,
});

// Helper to safely add column if missing
async function ensureColumn(table, column, definition) {
  try {
    const res = await db.execute(`PRAGMA table_info(${table});`);
    const cols = new Set(res.rows.map(r => r.name));
    if (!cols.has(column)) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
      console.log(`   ✔ Added column \`${column}\` to table \`${table}\``);
    }
  } catch (err) {
    console.warn(`   ⚠ Column ${column} check on ${table}:`, err.message);
  }
}

async function init() {
  try {
    console.log('📦 1. Initializing Multi-Tenant Tables...');

    // 1. colleges
    await db.execute(`
      CREATE TABLE IF NOT EXISTS colleges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        billing_plan TEXT DEFAULT 'campus-pro',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('colleges', 'status', "TEXT NOT NULL DEFAULT 'active'");
    await ensureColumn('colleges', 'billing_plan', "TEXT DEFAULT 'campus-pro'");
    console.log('   ✔ Table `colleges` created / verified');

    // 1b. institutions (Multi-tenant organizations & workflow pausing)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS institutions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        billing_plan TEXT DEFAULT 'campus-pro',
        student_count INTEGER DEFAULT 0,
        contact_email TEXT,
        contact_phone TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('institutions', 'status', "TEXT NOT NULL DEFAULT 'active'");
    await ensureColumn('institutions', 'billing_plan', "TEXT DEFAULT 'campus-pro'");
    await ensureColumn('institutions', 'student_count', "INTEGER DEFAULT 0");
    await ensureColumn('institutions', 'contact_email', "TEXT");
    await ensureColumn('institutions', 'contact_phone', "TEXT");
    console.log('   ✔ Table `institutions` created / verified');

    // 2. departments
    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `departments` created / verified');

    // 3. sections
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        academic_year TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `sections` created / verified');

    // 4. faculties
    await db.execute(`
      CREATE TABLE IF NOT EXISTS faculties (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        dean_id TEXT,
        dean_name TEXT,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('faculties', 'institution_name', 'TEXT');
    await ensureColumn('faculties', 'dean_id', 'TEXT');
    await ensureColumn('faculties', 'dean_name', 'TEXT');
    console.log('   ✔ Table `faculties` created / verified');

    // 5. courses
    await db.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        department TEXT,
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
        enrolled_students TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('courses', 'institution_name', 'TEXT');
    await ensureColumn('courses', 'instructor_data', 'TEXT');
    await ensureColumn('courses', 'enrolled_students', 'TEXT');
    await ensureColumn('courses', 'faculty_id', 'TEXT');
    console.log('   ✔ Table `courses` created / verified');

    // 6. users
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        avatar_url TEXT,
        password TEXT,
        password_hash TEXT,
        institution_name TEXT,
        department TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('users', 'password', 'TEXT');
    await ensureColumn('users', 'password_hash', 'TEXT');
    await ensureColumn('users', 'institution_name', 'TEXT');
    await ensureColumn('users', 'institution_id', 'TEXT');
    await ensureColumn('users', 'course_id', 'TEXT');
    await ensureColumn('users', 'phone', 'TEXT');
    await ensureColumn('users', 'otp_code', 'TEXT');
    await ensureColumn('users', 'otp_expires_at', 'TEXT');
    await ensureColumn('users', 'must_change_password', 'INTEGER DEFAULT 0');
    await ensureColumn('users', 'department', 'TEXT');
    console.log('   ✔ Table `users` created / verified (with OTP & tenant isolation columns)');

    // 7. channels
    await db.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL,
        course_id TEXT,
        section_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        is_general INTEGER DEFAULT 0,
        type TEXT NOT NULL DEFAULT 'general',
        student_file_permission TEXT DEFAULT 'read-only',
        subject_lecturer_name TEXT,
        subject_lecturer_id TEXT,
        unread_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('channels', 'course_id', 'TEXT');
    await ensureColumn('channels', 'is_general', 'INTEGER DEFAULT 0');
    await ensureColumn('channels', 'student_file_permission', 'TEXT DEFAULT "read-only"');
    await ensureColumn('channels', 'subject_lecturer_name', 'TEXT');
    await ensureColumn('channels', 'subject_lecturer_id', 'TEXT');
    await ensureColumn('channels', 'unread_count', 'INTEGER DEFAULT 0');
    console.log('   ✔ Table `channels` created / verified');

    // 8. messages
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        sender_id TEXT,
        sender_name TEXT NOT NULL,
        body TEXT NOT NULL,
        author_name TEXT,
        content TEXT,
        attachments TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('messages', 'sender_id', 'TEXT');
    await ensureColumn('messages', 'sender_name', 'TEXT');
    await ensureColumn('messages', 'body', 'TEXT');
    await ensureColumn('messages', 'author_name', 'TEXT');
    await ensureColumn('messages', 'content', 'TEXT');
    console.log('   ✔ Table `messages` created / verified');

    // 9. notices
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL,
        institution_name TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        author_id TEXT,
        author_name TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('notices', 'institution_name', 'TEXT');
    console.log('   ✔ Table `notices` created / verified');

    // 10. assignments
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL,
        institution_name TEXT,
        faculty_id TEXT,
        section_id TEXT,
        course_id TEXT,
        course_code TEXT,
        channel_id TEXT,
        subject_name TEXT,
        title TEXT NOT NULL,
        instructions TEXT,
        description TEXT,
        subject TEXT,
        due_date TEXT,
        due_at TEXT,
        due_timestamp INTEGER,
        close_at TEXT,
        is_strict_no_late INTEGER DEFAULT 0,
        rubric TEXT,
        max_points INTEGER DEFAULT 100,
        created_by TEXT,
        created_by_email TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('assignments', 'institution_name', 'TEXT');
    await ensureColumn('assignments', 'faculty_id', 'TEXT');
    await ensureColumn('assignments', 'course_id', 'TEXT');
    await ensureColumn('assignments', 'course_code', 'TEXT');
    await ensureColumn('assignments', 'channel_id', 'TEXT');
    await ensureColumn('assignments', 'subject_name', 'TEXT');
    await ensureColumn('assignments', 'instructions', 'TEXT');
    await ensureColumn('assignments', 'due_at', 'TEXT');
    await ensureColumn('assignments', 'due_timestamp', 'INTEGER');
    await ensureColumn('assignments', 'close_at', 'TEXT');
    await ensureColumn('assignments', 'is_strict_no_late', 'INTEGER DEFAULT 0');
    await ensureColumn('assignments', 'created_by_email', 'TEXT');
    await ensureColumn('assignments', 'rubric', 'TEXT');
    console.log('   ✔ Table `assignments` created / verified');

    // 11. assignment_submissions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT,
        status TEXT DEFAULT 'turned-in',
        submission_text TEXT,
        file_name TEXT,
        file_size TEXT,
        file_data TEXT,
        files TEXT,
        grade REAL,
        feedback TEXT,
        submitted_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('assignment_submissions', 'files', 'TEXT');
    await ensureColumn('assignment_submissions', 'grade', 'REAL');
    await ensureColumn('assignment_submissions', 'feedback', 'TEXT');
    console.log('   ✔ Table `assignment_submissions` created / verified');

    // 12. course_files
    await db.execute(`
      CREATE TABLE IF NOT EXISTS course_files (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        college_id TEXT,
        channel_id TEXT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Class Materials',
        size TEXT,
        type TEXT,
        uploaded_by TEXT,
        is_class_material INTEGER DEFAULT 1,
        permission TEXT DEFAULT 'read-only',
        uploaded_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('course_files', 'channel_id', 'TEXT');
    await ensureColumn('course_files', 'category', 'TEXT');
    await ensureColumn('course_files', 'college_id', 'TEXT');
    console.log('   ✔ Table `course_files` created / verified');

    // 13. college_requests
    await db.execute(`
      CREATE TABLE IF NOT EXISTS college_requests (
        id TEXT PRIMARY KEY,
        institution_name TEXT NOT NULL,
        department TEXT,
        contact_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        student_count INTEGER DEFAULT 1000,
        deployment_type TEXT DEFAULT 'campus-pro',
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `college_requests` created / verified');

    // 14. platform_settings
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `platform_settings` created / verified');

    // 15. email_logs (Track 2FA OTP emails & delivery status)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        subject TEXT,
        otp_code TEXT,
        provider TEXT,
        status TEXT,
        error_message TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `email_logs` created / verified');

    // 16. school_attendance (Daily bulk roll-call for School level: Nursery to Class 12)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS school_attendance (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        college_id TEXT,
        class_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        taken_by_user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('school_attendance', 'college_id', 'TEXT');
    await ensureColumn('school_attendance', 'class_id', 'TEXT');
    await ensureColumn('school_attendance', 'student_id', 'TEXT');
    await ensureColumn('school_attendance', 'date', 'TEXT');
    await ensureColumn('school_attendance', 'status', 'TEXT');
    await ensureColumn('school_attendance', 'taken_by_user_id', 'TEXT');
    console.log('   ✔ Table `school_attendance` created / verified');

    // 17. subject_attendance (Granular per-subject attendance for University / Bachelor level)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subject_attendance (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        college_id TEXT,
        course_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        taken_by_user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await ensureColumn('subject_attendance', 'college_id', 'TEXT');
    await ensureColumn('subject_attendance', 'course_id', 'TEXT');
    await ensureColumn('subject_attendance', 'subject_id', 'TEXT');
    await ensureColumn('subject_attendance', 'student_id', 'TEXT');
    await ensureColumn('subject_attendance', 'date', 'TEXT');
    await ensureColumn('subject_attendance', 'status', 'TEXT');
    await ensureColumn('subject_attendance', 'taken_by_user_id', 'TEXT');
    console.log('   ✔ Table `subject_attendance` created / verified');

    // 18. assignment_attendance_overrides (Lecturer One-Time Exception for low attendance lock)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignment_attendance_overrides (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        overridden_by TEXT NOT NULL,
        overridden_at TEXT DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1
      );
    `);
    await ensureColumn('assignment_attendance_overrides', 'active', 'INTEGER DEFAULT 1');
    console.log('   ✔ Table `assignment_attendance_overrides` created / verified');

    console.log('\n🔍 2. Creating Composite & Foreign Key Indexes...');
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_channel_time ON messages(channel_id, created_at);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notices_college_time ON notices(college_id, created_at);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_channels_college_sec ON channels(college_id, section_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_college_sec ON users(college_id, section_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_courses_college ON courses(college_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_courses_inst ON courses(institution_name);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_faculties_inst ON faculties(institution_name);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_assignments_inst ON assignments(institution_name);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sub_asgn_stu ON assignment_submissions(assignment_id, student_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sch_att_cls_date ON school_attendance(class_id, date);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sch_att_stu ON school_attendance(student_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sub_att_sub_date ON subject_attendance(subject_id, date);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sub_att_stu ON subject_attendance(student_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_asgn_ovr_asgn_stu ON assignment_attendance_overrides(assignment_id, student_id);`);

    // Always ensure platform_root exists for developer account
    await db.execute(`
      INSERT OR REPLACE INTO colleges (id, name, code, status, billing_plan, created_at)
      VALUES ('platform_root', 'ProCollege Platform Operations', 'PLATFORM', 'active', 'enterprise', datetime('now'));
    `);
    await db.execute(`
      INSERT OR REPLACE INTO institutions (id, name, code, status, billing_plan, created_at)
      VALUES ('platform_root', 'ProCollege Platform Operations', 'PLATFORM', 'active', 'enterprise', datetime('now'));
    `);

    // Master Platform Developer / Root Creator (Loaded securely from environment, never committed to git)
    const devEmail = process.env.DEVELOPER_EMAIL;
    const devPass = process.env.DEVELOPER_PASSWORD;

    if (devEmail && devPass) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO users (id, college_id, institution_id, section_id, name, email, role, password, password_hash, avatar_url, institution_name, department)
              VALUES (?, 'platform_root', 'platform_root', NULL, ?, ?, 'developer', ?, ?, ?, 'ProCollege Platform Operations', 'Platform Architecture & Operations');`,
        args: [
          'user_dev_root',
          'Platform Creator',
          devEmail,
          devPass,
          devPass,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        ],
      });
      console.log('   ✔ Seeded Developer Administrator (Platform Creator)');
    }

    const shouldSeedDemo = process.argv.includes('--seed-demo');
    if (shouldSeedDemo) {
      console.log('\n🌱 3. Seeding Live Demo Multi-Tenant Data (--seed-demo passed)...');

      // --- TENANT 1: Padmashree College ('padmashree-demo') ---
      const collegeId = 'padmashree-demo';
      const instPadmashree = 'Padmashree College';

      await db.execute({
        sql: `INSERT OR REPLACE INTO colleges (id, name, code, status, billing_plan) VALUES (?, ?, ?, 'active', 'enterprise');`,
        args: [collegeId, instPadmashree, 'PDC'],
      });

      await db.execute({
        sql: `INSERT OR REPLACE INTO institutions (id, name, code, status, billing_plan, contact_email) VALUES (?, ?, ?, 'active', 'enterprise', 'dean@padmashree.edu.np');`,
        args: [collegeId, instPadmashree, 'PDC'],
      });

    const deptId = 'dept-bit';
    await db.execute({
      sql: `INSERT OR REPLACE INTO departments (id, college_id, name, code) VALUES (?, ?, ?, ?);`,
      args: [deptId, collegeId, 'BIT', 'BIT'],
    });

    const sectionId = 'sec-sem5-a';
    await db.execute({
      sql: `INSERT OR REPLACE INTO sections (id, college_id, department_id, name, academic_year) VALUES (?, ?, ?, ?, ?);`,
      args: [sectionId, collegeId, deptId, 'Sem 5 - Sec A', '2026-2027'],
    });

    // Users
    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url, institution_name, department)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'usr-admin-01',
        collegeId,
        sectionId,
        'Academic Dean',
        'dean@padmashree.edu.np',
        'admin',
        'password123',
        'password123',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        instPadmashree,
        'Administration',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url, institution_name, department)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'usr-teacher-01',
        collegeId,
        sectionId,
        'Er. Ramesh Sharma',
        'teacher@padmashree.edu.np',
        'teacher',
        'password123',
        'password123',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
        instPadmashree,
        'Department of BIT',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url, institution_name, department)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'usr-student-01',
        collegeId,
        sectionId,
        'Sujan G.C.',
        'sujan@padmashree.edu.np',
        'student',
        'password123',
        'password123',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        instPadmashree,
        'Department of BIT',
      ],
    });

    // Faculties for Padmashree
    await db.execute({
      sql: `INSERT OR REPLACE INTO faculties (id, college_id, institution_name, name, code, dean_id, dean_name, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'fac_padma_bit',
        collegeId,
        instPadmashree,
        'Faculty of Information Technology (BIT)',
        'FBIT',
        'usr-admin-01',
        'Academic Dean',
        'Distributed Systems, Cloud Architecture, Full-Stack Web Engineering',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO faculties (id, college_id, institution_name, name, code, dean_id, dean_name, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'fac_padma_cs',
        collegeId,
        instPadmashree,
        'Faculty of Computer Science & Software Engineering',
        'FCSSE',
        'usr-teacher-01',
        'Er. Ramesh Sharma',
        'Algorithms, High-Performance Computing, Systems Engineering',
      ],
    });
    console.log('   ✔ Seeded Faculties for Padmashree College');

    // Courses for Padmashree
    const course1Id = 'course_padma_bit_sem5';
    await db.execute({
      sql: `INSERT OR REPLACE INTO courses (id, college_id, institution_name, code, name, department, term, color, icon, instructor_id, instructor_name, instructor_data, member_count, is_activated, model, template)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        course1Id,
        collegeId,
        instPadmashree,
        'BIT 501',
        'Cloud Computing & Distributed Systems',
        'Department of BIT',
        'Fall 2026',
        '#4f46e5',
        '⚡',
        'usr-teacher-01',
        'Er. Ramesh Sharma',
        JSON.stringify({ id: 'usr-teacher-01', name: 'Er. Ramesh Sharma', role: 'teacher', email: 'teacher@padmashree.edu.np' }),
        45,
        1,
        'model-a',
        'Class',
      ],
    });

    // Channels for Course 1
    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, section_id, name, description, is_general, type, student_file_permission, subject_lecturer_name, subject_lecturer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'ch_padma_announcements',
        collegeId,
        course1Id,
        sectionId,
        'Announcements',
        'Class-wide notices, exam schedules, and alerts from all lecturers',
        1,
        'announcements',
        'read-only',
        'Er. Ramesh Sharma',
        'usr-teacher-01',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, section_id, name, description, is_general, type, student_file_permission, subject_lecturer_name, subject_lecturer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'ch_padma_lectures',
        collegeId,
        course1Id,
        sectionId,
        'Cloud Architecture Lectures',
        'Serverless workers, edge computation, and low latency streaming',
        0,
        'general',
        'read-only',
        'Er. Ramesh Sharma',
        'usr-teacher-01',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, section_id, name, description, is_general, type, student_file_permission, subject_lecturer_name, subject_lecturer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'ch_padma_turso_lab',
        collegeId,
        course1Id,
        sectionId,
        'Turso LibSQL Lab',
        'Database replication, SQLite edge clients, and schema migration',
        0,
        'general',
        'can-edit',
        'Er. Ramesh Sharma',
        'usr-teacher-01',
      ],
    });

    const course2Id = 'course_padma_web_sem5';
    await db.execute({
      sql: `INSERT OR REPLACE INTO courses (id, college_id, institution_name, code, name, department, term, color, icon, instructor_id, instructor_name, instructor_data, member_count, is_activated, model, template)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        course2Id,
        collegeId,
        instPadmashree,
        'BIT 502',
        'Full-Stack Web Engineering',
        'Department of BIT',
        'Fall 2026',
        '#0891b2',
        '🏛️',
        'usr-teacher-01',
        'Er. Ramesh Sharma',
        JSON.stringify({ id: 'usr-teacher-01', name: 'Er. Ramesh Sharma', role: 'teacher', email: 'teacher@padmashree.edu.np' }),
        45,
        1,
        'model-b',
        'Class',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, section_id, name, description, is_general, type, student_file_permission)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'ch_padma_web_announcements',
        collegeId,
        course2Id,
        sectionId,
        'Announcements',
        'Full-Stack Web Engineering announcements and milestones',
        1,
        'announcements',
        'read-only',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, section_id, name, description, is_general, type, student_file_permission)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'ch_padma_web_react',
        collegeId,
        course2Id,
        sectionId,
        'React 19 & Hono Microservices',
        'Client-side state, TanStack patterns, and Edge runtime APIs',
        0,
        'general',
        'can-edit',
      ],
    });
    console.log('   ✔ Seeded Courses and Channels for Padmashree College');

    // Assignments for Padmashree
    const asgn1Id = 'asgn_padma_01';
    await db.execute({
      sql: `INSERT OR REPLACE INTO assignments (id, college_id, institution_name, course_id, course_code, section_id, title, description, instructions, due_at, due_timestamp, close_at, is_strict_no_late, max_points, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        asgn1Id,
        collegeId,
        instPadmashree,
        course1Id,
        'BIT 501',
        sectionId,
        'Cloudflare Workers & Distributed DB Assignment',
        'Implement serverless Hono Worker connected to live Turso LibSQL database.',
        'Implement serverless Hono Worker connected to live Turso LibSQL database.',
        'Nov 25, 2026, 11:59 PM',
        1795651140000,
        'Nov 25, 2026, 11:59 PM',
        1,
        100,
        'usr-teacher-01',
      ],
    });

    const asgn2Id = 'asgn_padma_02';
    await db.execute({
      sql: `INSERT OR REPLACE INTO assignments (id, college_id, institution_name, course_id, course_code, section_id, title, description, instructions, due_at, due_timestamp, close_at, is_strict_no_late, max_points, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        asgn2Id,
        collegeId,
        instPadmashree,
        course1Id,
        'BIT 501',
        sectionId,
        'Turso Edge Multi-Tenancy Architecture Report',
        'Analyze latency benchmarks of distributed read replicas across cloud edge regions.',
        'Analyze latency benchmarks of distributed read replicas across cloud edge regions.',
        'Nov 30, 2026, 11:59 PM',
        1796083140000,
        'Nov 30, 2026, 11:59 PM',
        0,
        100,
        'usr-teacher-01',
      ],
    });

    const asgn3Id = 'asgn_padma_03_due_passed';
    await db.execute({
      sql: `INSERT OR REPLACE INTO assignments (id, college_id, institution_name, course_id, course_code, section_id, title, description, instructions, due_at, due_timestamp, close_at, is_strict_no_late, max_points, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        asgn3Id,
        collegeId,
        instPadmashree,
        course1Id,
        'BIT 501',
        sectionId,
        'Lab 1: Docker & Container Orchestration (Past Deadline)',
        'Containerize multi-tier web applications with Docker Compose and health checks.',
        'Containerize multi-tier web applications with Docker Compose and health checks.',
        'Nov 01, 2026, 11:59 PM',
        1793587140000, // Past deadline!
        'Nov 01, 2026, 11:59 PM',
        1,
        100,
        'usr-teacher-01',
      ],
    });

    // Seed 1 active submission for Student (Sujan G.C.)
    await db.execute({
      sql: `INSERT OR REPLACE INTO assignment_submissions (id, assignment_id, student_id, student_name, status, submission_text, file_name, file_size, files, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'sub_padma_01',
        asgn1Id,
        'usr-student-01',
        'Sujan G.C.',
        'turned-in',
        'Submitted live repository link and PDF report.',
        'BIT501_Cloudflare_Turso_SujanGC.pdf',
        '1.8 MB',
        JSON.stringify([
          { name: 'BIT501_Cloudflare_Turso_SujanGC.pdf', size: '1.8 MB', type: 'pdf', isReadOnly: true, uploadedAt: 'Nov 12, 2026, 03:45 PM' },
        ]),
        'Nov 12, 2026, 03:45 PM',
      ],
    });
    console.log('   ✔ Seeded Assignments & Submissions for Padmashree College');

    // Seed Notices
    await db.execute({
      sql: `INSERT OR REPLACE INTO notices (id, college_id, institution_name, title, content, priority, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'not_padma_01',
        collegeId,
        instPadmashree,
        'Welcome to Padmashree College Portal',
        'We are thrilled to launch the new ProCollege campus collaboration and academic suite. Explore channels, announcements, and assignments.',
        'important',
        'usr-admin-01',
        'Academic Dean',
      ],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO notices (id, college_id, institution_name, title, content, priority, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'not_padma_02',
        collegeId,
        instPadmashree,
        'Semester 5 Schedule & Orientation',
        'All Semester 5 Section A lectures commence on Monday at 8:00 AM. Check the Calendar tab for detailed room assignments.',
        'normal',
        'usr-teacher-01',
        'Er. Ramesh Sharma',
      ],
    });
    console.log('   ✔ Seeded Notices for Padmashree College');

    // Seed Course Files for Padmashree
    const seedFilesPadma = [
      { id: 'file_padma_01', courseId: course1Id, channelId: 'ch_padma_announcements', name: 'BIT501_Cloudflare_Turso_Syllabus.pdf', category: 'Class Materials', size: '1.2 MB', uploadedBy: 'Er. Ramesh Sharma', isClassMaterial: 1, permission: 'read-only' },
      { id: 'file_padma_02', courseId: course1Id, channelId: 'ch_padma_distributed_db', name: 'LibSQL_Turso_Architecture_Guide.pdf', category: 'Lecture Slides', size: '3.4 MB', uploadedBy: 'Er. Ramesh Sharma', isClassMaterial: 1, permission: 'read-only' },
      { id: 'file_padma_03', courseId: course1Id, channelId: 'ch_padma_edge_computing', name: 'Cloudflare_Workers_Runtime_Notes.pdf', category: 'Lab Manuals', size: '2.1 MB', uploadedBy: 'Er. Ramesh Sharma', isClassMaterial: 1, permission: 'read-only' },
    ];
    for (const f of seedFilesPadma) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO course_files (id, course_id, college_id, channel_id, name, category, size, type, uploaded_by, is_class_material, permission)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pdf', ?, ?, ?);`,
        args: [f.id, f.courseId, collegeId, f.channelId, f.name, f.category, f.size, f.uploadedBy, f.isClassMaterial, f.permission],
      });
    }
    console.log('   ✔ Seeded Course Files for Padmashree College');

    // --- TENANT 2: ProCollege University Network fixtures ---
    const instPro = 'ProCollege University Network';
    const colProId = 'col_procollege_network';

    await db.execute({
      sql: `INSERT OR REPLACE INTO colleges (id, name, code, status, billing_plan) VALUES (?, ?, ?, 'active', 'campus-pro');`,
      args: [colProId, instPro, 'PCN'],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO institutions (id, name, code, status, billing_plan, contact_email) VALUES (?, ?, ?, 'active', 'campus-pro', 'admin@procollege.edu');`,
      args: [colProId, instPro, 'PCN'],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO faculties (id, college_id, institution_name, name, code, dean_id, dean_name, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['fac_cs', colProId, instPro, 'Faculty of Computer Science & Engineering', 'FCSE', 'user_alan', 'Prof. Alan Turing', 'Algorithms, Software Architecture, Operating Systems'],
    });
    await db.execute({
      sql: `INSERT OR REPLACE INTO faculties (id, college_id, institution_name, name, code, dean_id, dean_name, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['fac_ai', colProId, instPro, 'Faculty of Artificial Intelligence & Data Science', 'FAIDS', 'user_feifei', 'Dr. Fei-Fei Li', 'Neural Networks, Computer Vision, Foundation Models'],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO courses (id, college_id, institution_name, code, name, department, term, color, icon, instructor_id, instructor_name, member_count, is_activated, model, template)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['course_cs301', colProId, instPro, 'CS 301', 'Advanced Algorithms & Complexity', 'Computer Science', 'Fall 2026', '#4f46e5', '⚡', 'user_alan', 'Prof. Alan Turing', 68, 1, 'model-a', 'Class'],
    });

    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, name, description, is_general, type, student_file_permission) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['ch_cs301_gen', colProId, 'course_cs301', 'Announcements', 'Class-wide notices, exam schedules, and alerts from all lecturers', 1, 'announcements', 'read-only'],
    });
    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, course_id, name, description, is_general, type, student_file_permission) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['ch_cs301_lec', colProId, 'course_cs301', 'Weekly Lectures', 'Slide decks, lecture recordings, and Q&A', 0, 'general', 'read-only'],
    });
    const seedFilesPro = [
      { id: 'file_cm_1', courseId: 'course_cs301', channelId: 'ch_cs301_gen', name: 'CS301_Complete_Syllabus_2026.pdf', category: 'Class Materials', size: '1.4 MB', uploadedBy: 'Prof. Alan Turing', isClassMaterial: 1, permission: 'read-only' },
      { id: 'file_cm_2', courseId: 'course_cs301', channelId: 'ch_cs301_gen', name: 'Lecture01_Amortized_Analysis.pdf', category: 'Class Materials', size: '4.8 MB', uploadedBy: 'Prof. Alan Turing', isClassMaterial: 1, permission: 'read-only' },
      { id: 'file_cm_3', courseId: 'course_cs301', channelId: 'ch_cs301_lec', name: 'LabManual_Graph_Algorithms.pdf', category: 'Lab Manuals', size: '2.3 MB', uploadedBy: 'Prof. Alan Turing', isClassMaterial: 1, permission: 'read-only' },
    ];
    for (const f of seedFilesPro) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO course_files (id, course_id, college_id, channel_id, name, category, size, type, uploaded_by, is_class_material, permission)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pdf', ?, ?, ?);`,
        args: [f.id, f.courseId, colProId, f.channelId, f.name, f.category, f.size, f.uploadedBy, f.isClassMaterial, f.permission],
      });
    }
    console.log('   ✔ Seeded ProCollege University Network fixtures');
    } else {
      console.log('\n⏩ Skipping demo tenant seeding (clean production mode). Pass --seed-demo to seed demo data.');
    }

    console.log('\n📊 4. Verifying Live Database Content on Turso...');
    const tablesRes = await db.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' ORDER BY name;
    `);
    const tableNames = tablesRes.rows.map(r => r.name);
    console.log('   Live Tables in Turso:', tableNames.join(', '));

    const collegesCount = await db.execute('SELECT count(*) as c FROM colleges;');
    const facultiesCount = await db.execute('SELECT count(*) as c FROM faculties;');
    const coursesCount = await db.execute('SELECT count(*) as c FROM courses;');
    const channelsCount = await db.execute('SELECT count(*) as c FROM channels;');
    const assignmentsCount = await db.execute('SELECT count(*) as c FROM assignments;');
    const submissionsCount = await db.execute('SELECT count(*) as c FROM assignment_submissions;');
    const filesCount = await db.execute('SELECT count(*) as c FROM course_files;');
    const usersCount = await db.execute('SELECT count(*) as c FROM users;');

    console.log('\n📈 Row Counts:');
    console.log(`   - colleges:               ${collegesCount.rows[0].c}`);
    console.log(`   - faculties:              ${facultiesCount.rows[0].c}`);
    console.log(`   - courses:                ${coursesCount.rows[0].c}`);
    console.log(`   - channels:               ${channelsCount.rows[0].c}`);
    console.log(`   - assignments:            ${assignmentsCount.rows[0].c}`);
    console.log(`   - assignment_submissions: ${submissionsCount.rows[0].c}`);
    console.log(`   - course_files:           ${filesCount.rows[0].c}`);
    console.log(`   - users:                  ${usersCount.rows[0].c}`);

    console.log('\n🎉 Turso database successfully initialized, multi-tenant tables isolated, and live data seeded!');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err);
    process.exit(1);
  }
}

init();
