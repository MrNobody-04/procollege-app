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

async function init() {
  try {
    console.log('📦 1. Initializing Multi-Tenant Tables...');

    // 1. colleges
    await db.execute(`
      CREATE TABLE IF NOT EXISTS colleges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `colleges` created / verified');

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

    // 4. users
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
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    const userColsRes = await db.execute("PRAGMA table_info(users);");
    const userCols = new Set(userColsRes.rows.map(r => r.name));
    if (!userCols.has('password')) await db.execute("ALTER TABLE users ADD COLUMN password TEXT;");
    if (!userCols.has('password_hash')) await db.execute("ALTER TABLE users ADD COLUMN password_hash TEXT;");
    console.log('   ✔ Table `users` created / verified (with password columns)');

    // 5. channels
    await db.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        section_id TEXT REFERENCES sections(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'general',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `channels` created / verified');

    // 6. messages
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        sender_id TEXT,
        sender_name TEXT NOT NULL,
        body TEXT NOT NULL,
        author_name TEXT,
        content TEXT,
        attachments TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    // Ensure all required columns exist in pre-existing table
    const msgColsRes = await db.execute("PRAGMA table_info(messages);");
    const msgCols = new Set(msgColsRes.rows.map(r => r.name));
    if (!msgCols.has('sender_id')) await db.execute("ALTER TABLE messages ADD COLUMN sender_id TEXT;");
    if (!msgCols.has('sender_name')) await db.execute("ALTER TABLE messages ADD COLUMN sender_name TEXT;");
    if (!msgCols.has('body')) await db.execute("ALTER TABLE messages ADD COLUMN body TEXT;");
    if (!msgCols.has('author_name')) await db.execute("ALTER TABLE messages ADD COLUMN author_name TEXT;");
    if (!msgCols.has('content')) await db.execute("ALTER TABLE messages ADD COLUMN content TEXT;");
    console.log('   ✔ Table `messages` created / verified');

    // 7. notices
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        author_id TEXT,
        author_name TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `notices` created / verified');

    // 8. assignments
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        section_id TEXT REFERENCES sections(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        due_date TEXT,
        max_points INTEGER DEFAULT 100,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('   ✔ Table `assignments` created / verified');

    // 9. college_requests (Request Campus Access inquiries)
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

    console.log('\n🔍 2. Creating Composite Indexes...');

    // Index 1: idx_messages_channel_time
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_messages_channel_time 
      ON messages(channel_id, created_at);
    `);
    console.log('   ✔ Index `idx_messages_channel_time` on messages(channel_id, created_at)');

    // Index 2: idx_notices_college_time
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_notices_college_time 
      ON notices(college_id, created_at);
    `);
    console.log('   ✔ Index `idx_notices_college_time` on notices(college_id, created_at)');

    // Index 3: idx_channels_college_sec
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_channels_college_sec 
      ON channels(college_id, section_id);
    `);
    console.log('   ✔ Index `idx_channels_college_sec` on channels(college_id, section_id)');

    // Index 4: idx_users_college_sec
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_users_college_sec 
      ON users(college_id, section_id);
    `);
    console.log('   ✔ Index `idx_users_college_sec` on users(college_id, section_id)');

    console.log('\n🌱 3. Seeding Live Demo Data...');

    // 1 Default College: id: 'padmashree-demo', name: 'Padmashree College'
    const collegeId = 'padmashree-demo';
    await db.execute({
      sql: `INSERT OR REPLACE INTO colleges (id, name, code) VALUES (?, ?, ?);`,
      args: [collegeId, 'Padmashree College', 'PDC'],
    });
    console.log('   ✔ Seeded College: "Padmashree College" (ID: padmashree-demo)');

    // 1 Department: BIT
    const deptId = 'dept-bit';
    await db.execute({
      sql: `INSERT OR REPLACE INTO departments (id, college_id, name, code) VALUES (?, ?, ?, ?);`,
      args: [deptId, collegeId, 'BIT', 'BIT'],
    });
    console.log('   ✔ Seeded Department: "BIT" (ID: dept-bit)');

    // 1 Section: Sem 5 - Sec A
    const sectionId = 'sec-sem5-a';
    await db.execute({
      sql: `INSERT OR REPLACE INTO sections (id, college_id, department_id, name, academic_year) VALUES (?, ?, ?, ?, ?);`,
      args: [sectionId, collegeId, deptId, 'Sem 5 - Sec A', '2026-2027'],
    });
    console.log('   ✔ Seeded Section: "Sem 5 - Sec A" (ID: sec-sem5-a)');

    // 1 User: Admin (Academic Dean)
    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'usr-admin-01',
        collegeId,
        sectionId,
        'Academic Dean',
        'dean@padmashree.edu.np',
        'admin',
        'password123',
        'password123',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      ],
    });
    console.log('   ✔ Seeded Admin: "Academic Dean" (dean@padmashree.edu.np / password123)');

    // 2 User: Teacher (Er. Ramesh Sharma)
    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'usr-teacher-01',
        collegeId,
        sectionId,
        'Er. Ramesh Sharma',
        'teacher@padmashree.edu.np',
        'teacher',
        'password123',
        'password123',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      ],
    });
    console.log('   ✔ Seeded Teacher: "Er. Ramesh Sharma" (teacher@padmashree.edu.np / password123)');

    // 3 User: Student (Sujan G.C.)
    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'usr-student-01',
        collegeId,
        sectionId,
        'Sujan G.C.',
        'sujan@padmashree.edu.np',
        'student',
        'password123',
        'password123',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      ],
    });
    console.log('   ✔ Seeded Student: "Sujan G.C." (sujan@padmashree.edu.np / password123)');

    // 2 Channels: general and announcements
    const chGeneralId = 'ch-general';
    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, section_id, name, description, type) VALUES (?, ?, ?, ?, ?, ?);`,
      args: [chGeneralId, collegeId, sectionId, 'general', 'General discussions for Sem 5 - Sec A', 'general'],
    });
    console.log('   ✔ Seeded Channel: "general" (ID: ch-general)');

    const chAnnounceId = 'ch-announcements';
    await db.execute({
      sql: `INSERT OR REPLACE INTO channels (id, college_id, section_id, name, description, type) VALUES (?, ?, ?, ?, ?, ?);`,
      args: [chAnnounceId, collegeId, sectionId, 'announcements', 'Official announcements and notices broadcast', 'announcements'],
    });
    console.log('   ✔ Seeded Channel: "announcements" (ID: ch-announcements)');

    // 2 Welcome Notices
    const userId = 'usr-admin-01';
    const notice1Id = 'not-welcome-01';
    await db.execute({
      sql: `INSERT OR REPLACE INTO notices (id, college_id, title, content, priority, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [
        notice1Id,
        collegeId,
        'Welcome to Padmashree College Portal',
        'We are thrilled to launch the new ProCollege campus collaboration and academic suite. Explore channels, announcements, and assignments.',
        'important',
        userId,
        'Academic Dean',
      ],
    });
    console.log('   ✔ Seeded Notice 1: "Welcome to Padmashree College Portal"');

    const notice2Id = 'not-welcome-02';
    await db.execute({
      sql: `INSERT OR REPLACE INTO notices (id, college_id, title, content, priority, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [
        notice2Id,
        collegeId,
        'Semester 5 Schedule & Orientation',
        'All Semester 5 Section A lectures commence on Monday at 8:00 AM. Check the Calendar tab for detailed room assignments.',
        'normal',
        userId,
        'HOD Department of BIT',
      ],
    });
    console.log('   ✔ Seeded Notice 2: "Semester 5 Schedule & Orientation"');

    // Seed Initial Messages in General Channel
    const msgId = 'msg-welcome-01';
    await db.execute({
      sql: `INSERT OR REPLACE INTO messages (id, channel_id, user_id, sender_id, sender_name, body, author_name, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        msgId,
        chGeneralId,
        userId,
        userId,
        'Academic Dean',
        'Welcome to Sem 5 - Sec A General channel! Real-time messaging and class resources are online.',
        'Academic Dean',
        'Welcome to Sem 5 - Sec A General channel! Real-time messaging and class resources are online.',
      ],
    });
    console.log('   ✔ Seeded Initial Message in "general" channel');

    console.log('\n📊 4. Verifying Live Database Content on Turso...');
    const tablesRes = await db.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' ORDER BY name;
    `);
    const tableNames = tablesRes.rows.map(r => r.name);
    console.log('   Live Tables in Turso:', tableNames.join(', '));

    const collegesCount = await db.execute('SELECT count(*) as c FROM colleges;');
    const deptsCount = await db.execute('SELECT count(*) as c FROM departments;');
    const sectionsCount = await db.execute('SELECT count(*) as c FROM sections;');
    const usersCount = await db.execute('SELECT count(*) as c FROM users;');
    const channelsCount = await db.execute('SELECT count(*) as c FROM channels;');
    const noticesCount = await db.execute('SELECT count(*) as c FROM notices;');
    const messagesCount = await db.execute('SELECT count(*) as c FROM messages;');

    console.log('\n📈 Row Counts:');
    console.log(`   - colleges:    ${collegesCount.rows[0].c}`);
    console.log(`   - departments: ${deptsCount.rows[0].c}`);
    console.log(`   - sections:    ${sectionsCount.rows[0].c}`);
    console.log(`   - users:       ${usersCount.rows[0].c}`);
    console.log(`   - channels:    ${channelsCount.rows[0].c}`);
    console.log(`   - notices:     ${noticesCount.rows[0].c}`);
    console.log(`   - messages:    ${messagesCount.rows[0].c}`);

    console.log('\n🎉 Turso database successfully initialized and verified!');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err);
    process.exit(1);
  }
}

init();
