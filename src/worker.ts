import { Hono } from 'hono';
import { createClient } from '@libsql/client/web';

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: Record<string, unknown>; error?: string }>;
  all<T = unknown>(): Promise<{ results?: T[]; success: boolean; meta: Record<string, unknown>; error?: string }>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<{ results?: T[]; success: boolean }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export type Env = {
  TURSO_DB_URL: string;
  TURSO_AUTH_TOKEN: string;
  ABLY_API_KEY: string;
  VITE_ABLY_SUBSCRIBE_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  JWT_SECRET?: string;
  procollege_vault?: D1Database;
  ASSETS: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: Env }>();

const DEFAULT_TURSO_URL = 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_AUTH_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQ1MDUyOTYsImlkIjoiMDFhMWQwZDktMzAwMS03OTk2LWI4ZjQtOGRmYTcxNzBkODM4Iiwia2lkIjoieTgwbkYzLU5YWlhpZENKRVgwdTVZbTNMZEhwSmZYUEJCYWkzNHRXY3A1OCIsInJpZCI6IjdhMzNmOWFlLWI3ZGEtNDM3Ni1hM2IwLTRkOTY4MDBkZDJkNCJ9.CLJY0HpjsEaSGVV3WejPoLCxiK0oxai8lZmlqPFHlVNDJzaZLh_Cmlv2JIYICZYMiaKgJfV7ylGrzAjcIUyQCg';
const DEFAULT_ABLY_KEY = 'wbIoLQ.bER0PQ:cmYHzvBCwqC4sOZ5frsiGLHssDBjCcLSm9eY3faKx6U';

// Helper to get Turso client from context with safe fallback
function getDb(c: { env: Env }) {
  const url = c.env?.TURSO_DB_URL || DEFAULT_TURSO_URL;
  const authToken = c.env?.TURSO_AUTH_TOKEN || DEFAULT_TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

// 1. Health check & DB verification (Turso + D1 procollege_vault + Cloudinary)
app.get('/api/health', async (c) => {
  try {
    const db = getDb(c);
    const result = await db.execute('SELECT count(*) as count FROM colleges;');
    const count = Number(result.rows[0]?.count ?? 0);

    let d1Status = 'not_bound';
    let d1TablesCount = 0;
    if (c.env.procollege_vault) {
      try {
        const d1Res = await c.env.procollege_vault.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").first<{ count: number }>();
        d1Status = 'connected';
        d1TablesCount = Number(d1Res?.count ?? 0);
      } catch (d1Err) {
        d1Status = `error: ${d1Err instanceof Error ? d1Err.message : String(d1Err)}`;
      }
    }

    return c.json({
      status: 'ok',
      collegesCount: count,
      d1Vault: {
        status: d1Status,
        tablesCount: d1TablesCount,
        binding: 'procollege_vault',
      },
      storage: {
        provider: 'cloudinary',
        cloudName: c.env.CLOUDINARY_CLOUD_NAME || 'pf66y0wq',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ status: 'error', message }, 500);
  }
});

// 2. Notices for college with Edge Cache
app.get('/api/notices/:collegeId', async (c) => {
  const collegeId = c.req.param('collegeId');
  try {
    const db = getDb(c);
    const result = await db.execute({
      sql: 'SELECT * FROM notices WHERE college_id = ? ORDER BY created_at DESC;',
      args: [collegeId],
    });

    // Cache-Control: public, max-age=60, s-maxage=60 for edge caching
    c.header('Cache-Control', 'public, max-age=60, s-maxage=60');
    return c.json({ notices: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 3. Channels for college
app.get('/api/channels/:collegeId', async (c) => {
  const collegeId = c.req.param('collegeId');
  try {
    const db = getDb(c);
    const result = await db.execute({
      sql: 'SELECT * FROM channels WHERE college_id = ? ORDER BY name ASC;',
      args: [collegeId],
    });
    return c.json({ channels: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 4. Messages for channel with delta sync (?since=TIMESTAMP)
app.get('/api/messages/:channelId', async (c) => {
  const channelId = c.req.param('channelId');
  const since = c.req.query('since');

  try {
    const db = getDb(c);
    let result;

    if (since) {
      result = await db.execute({
        sql: 'SELECT * FROM messages WHERE channel_id = ? AND created_at > ? ORDER BY created_at ASC;',
        args: [channelId, since],
      });
    } else {
      result = await db.execute({
        sql: 'SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC LIMIT 100;',
        args: [channelId],
      });
    }

    return c.json({ messages: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 5. Send message: Saves to Turso & publishes via Ably REST
app.post('/api/messages', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channelId = body.channel_id;
    const senderId = body.sender_id || body.user_id || 'usr_anonymous';
    const senderName = body.sender_name || body.author_name || 'Anonymous';
    const text = body.body || body.content || '';
    const attachments = body.attachments ? JSON.stringify(body.attachments) : null;
    const createdAt = body.created_at || new Date().toISOString();

    if (!channelId || !text.trim()) {
      return c.json({ error: 'channel_id and message body are required' }, 400);
    }

    const db = getDb(c);
    await db.execute({
      sql: `INSERT INTO messages (id, channel_id, user_id, sender_id, sender_name, body, author_name, content, attachments, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [id, channelId, senderId, senderId, senderName, text, senderName, text, attachments, createdAt],
    });

    const savedMessage = {
      id,
      channel_id: channelId,
      sender_id: senderId,
      sender_name: senderName,
      body: text,
      author_name: senderName,
      content: text,
      attachments,
      created_at: createdAt,
    };

    // Publish to Ably REST using Basic Auth (API Key)
    const ablyApiKey = c.env.ABLY_API_KEY || DEFAULT_ABLY_KEY;
    if (ablyApiKey) {
      try {
        const authHeader = 'Basic ' + btoa(ablyApiKey);
        await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channelId)}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'chat-message',
            data: savedMessage,
          }),
        });
      } catch (ablyErr) {
        console.error('Failed to broadcast to Ably:', ablyErr);
      }
    }

    return c.json({ message: savedMessage }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// --- Authentication & Session Endpoints ---

// 1. Login with email & password against live Turso database
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const db = getDb(c);
    const result = await db.execute({
      sql: `SELECT u.id, u.college_id, u.section_id, u.name, u.email, u.role, u.avatar_url, u.password, u.password_hash,
                   c.name as college_name, c.code as college_code
            FROM users u
            LEFT JOIN colleges c ON u.college_id = c.id
            WHERE LOWER(u.email) = LOWER(?);`,
      args: [email],
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'Account not found. Please check your institutional email address.' }, 404);
    }

    const userRow = result.rows[0];
    const storedPass = String(userRow.password || userRow.password_hash || '');

    // Check credentials (supports direct match or default demo password123)
    const isValid = storedPass === password || password === 'password123';
    if (!isValid) {
      return c.json({ error: 'Incorrect password. Please verify your credentials.' }, 401);
    }

    // Generate lightweight edge token
    const tokenPayload = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      ts: Date.now(),
    };
    const token = 'tok_' + btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');

    const user = {
      id: String(userRow.id),
      email: String(userRow.email),
      full_name: String(userRow.name),
      name: String(userRow.name),
      role: String(userRow.role),
      college_id: String(userRow.college_id || 'padmashree-demo'),
      section_id: userRow.section_id ? String(userRow.section_id) : null,
      avatar_url: String(userRow.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'),
    };

    const college = {
      id: String(userRow.college_id || 'padmashree-demo'),
      name: String(userRow.college_name || 'Padmashree College'),
      code: String(userRow.college_code || 'PDC'),
    };

    return c.json({
      success: true,
      token,
      user,
      college,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 2. Register a new user in Turso
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const password = (body.password || 'password123').trim();
    const role = body.role || 'student';
    const collegeId = body.college_id || 'padmashree-demo';
    const sectionId = body.section_id || 'sec-sem5-a';
    const avatarUrl = body.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';

    if (!email || !name) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    const db = getDb(c);
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = LOWER(?);',
      args: [email],
    });

    if (existing.rows.length > 0) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }

    const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await db.execute({
      sql: `INSERT INTO users (id, college_id, section_id, name, email, role, password, password_hash, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [newId, collegeId, sectionId, name, email, role, password, password, avatarUrl],
    });

    const user = {
      id: newId,
      email,
      full_name: name,
      name,
      role,
      college_id: collegeId,
      section_id: sectionId,
      avatar_url: avatarUrl,
    };

    const token = 'tok_' + btoa(JSON.stringify({ id: newId, email, role, ts: Date.now() })).replace(/=/g, '');

    return c.json({
      success: true,
      token,
      user,
      college: { id: collegeId, name: 'Padmashree College', code: 'PDC' },
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 3. Verify session / me
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing bearer token' }, 401);
  }

  const rawToken = authHeader.slice(7);
  try {
    const decoded = JSON.parse(atob(rawToken.replace(/^tok_/, '')));
    const db = getDb(c);
    const result = await db.execute({
      sql: `SELECT u.id, u.college_id, u.section_id, u.name, u.email, u.role, u.avatar_url,
                   c.name as college_name, c.code as college_code
            FROM users u
            LEFT JOIN colleges c ON u.college_id = c.id
            WHERE u.id = ?;`,
      args: [decoded.id],
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'User session not found' }, 404);
    }

    const u = result.rows[0];
    return c.json({
      user: {
        id: String(u.id),
        email: String(u.email),
        full_name: String(u.name),
        name: String(u.name),
        role: String(u.role),
        college_id: String(u.college_id),
        section_id: u.section_id ? String(u.section_id) : null,
        avatar_url: String(u.avatar_url),
      },
      college: {
        id: String(u.college_id),
        name: String(u.college_name || 'Padmashree College'),
        code: String(u.college_code || 'PDC'),
      },
    });
  } catch {
    return c.json({ error: 'Invalid or expired session token' }, 401);
  }
});

// 4. Record "Request Campus Access" inquiries directly into Turso
app.post('/api/colleges/request-access', async (c) => {
  try {
    const body = await c.req.json();
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const institutionName = (body.institutionName || body.institution_name || '').trim();
    const department = (body.department || '').trim() || 'Academic Operations';
    const contactName = (body.contactName || body.contact_name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim() || 'N/A';
    const studentCount = Number(body.studentCount || body.student_count || 1000);
    const deploymentType = body.deploymentType || body.deployment_type || 'campus-pro';
    const notes = (body.notes || '').trim();

    if (!institutionName || !contactName || !email) {
      return c.json({ error: 'Institution name, contact name, and email are required.' }, 400);
    }

    const db = getDb(c);
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

    await db.execute({
      sql: `INSERT INTO college_requests (id, institution_name, department, contact_name, email, phone, student_count, deployment_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [id, institutionName, department, contactName, email, phone, studentCount, deploymentType, notes],
    });

    return c.json({
      success: true,
      message: 'Campus access request recorded successfully in Turso database.',
      id,
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 5. Create / Post Announcement to Notices table & broadcast via Ably
app.post('/api/notices', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `not_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const collegeId = body.college_id || body.collegeId || 'padmashree-demo';
    const title = (body.title || '').trim();
    const content = (body.content || '').trim();
    const priority = body.priority || 'normal';
    const authorId = body.author_id || body.authorId || 'usr_anonymous';
    const authorName = body.author_name || body.authorName || 'Faculty Member';
    const createdAt = new Date().toISOString();

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    const db = getDb(c);
    await db.execute({
      sql: `INSERT INTO notices (id, college_id, title, content, priority, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [id, collegeId, title, content, priority, authorId, authorName, createdAt],
    });

    const savedNotice = {
      id,
      college_id: collegeId,
      title,
      content,
      priority,
      author_id: authorId,
      author_name: authorName,
      created_at: createdAt,
    };

    // Broadcast notice via Ably REST API
    const ablyApiKey = c.env?.ABLY_API_KEY || DEFAULT_ABLY_KEY;
    if (ablyApiKey) {
      try {
        const authHeader = 'Basic ' + btoa(ablyApiKey);
        await fetch(`https://rest.ably.io/channels/notices/messages`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'notice-broadcast',
            data: savedNotice,
          }),
        });
      } catch (ablyErr) {
        console.error('Failed to broadcast notice to Ably:', ablyErr);
      }
    }

    return c.json({ success: true, notice: savedNotice }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// --- Multi-Tenant SQL Isolation & Bootstrap ---

// 6. Bootstrap workspace data for a logged-in user's institution
app.get('/api/workspace/bootstrap', async (c) => {
  try {
    const institutionParam = c.req.query('institution') || c.req.header('x-institution-name') || 'Padmashree College';
    const roleParam = c.req.query('role') || c.req.header('x-user-role') || '';
    const isDeveloper = roleParam === 'developer';

    const db = getDb(c);
    const collegeId = institutionParam === 'Padmashree College' ? 'padmashree-demo' : 'col_procollege_network';

    let facultiesRes, coursesRes, channelsRes, assignmentsRes, submissionsRes, noticesRes, usersRes, filesRes;

    if (isDeveloper && institutionParam === 'all') {
      facultiesRes = await db.execute('SELECT * FROM faculties ORDER BY name ASC;');
      coursesRes = await db.execute('SELECT * FROM courses ORDER BY code ASC;');
      channelsRes = await db.execute('SELECT * FROM channels ORDER BY name ASC;');
      assignmentsRes = await db.execute('SELECT * FROM assignments ORDER BY created_at DESC;');
      submissionsRes = await db.execute('SELECT * FROM assignment_submissions;');
      noticesRes = await db.execute('SELECT * FROM notices ORDER BY created_at DESC;');
      usersRes = await db.execute('SELECT * FROM users ORDER BY name ASC;');
      filesRes = await db.execute('SELECT * FROM course_files ORDER BY uploaded_at DESC;');
    } else {
      facultiesRes = await db.execute({
        sql: 'SELECT * FROM faculties WHERE institution_name = ? OR college_id = ? ORDER BY name ASC;',
        args: [institutionParam, collegeId],
      });
      coursesRes = await db.execute({
        sql: 'SELECT * FROM courses WHERE institution_name = ? OR college_id = ? ORDER BY code ASC;',
        args: [institutionParam, collegeId],
      });
      channelsRes = await db.execute({
        sql: 'SELECT * FROM channels WHERE college_id = ? ORDER BY name ASC;',
        args: [collegeId],
      });
      assignmentsRes = await db.execute({
        sql: 'SELECT * FROM assignments WHERE institution_name = ? OR college_id = ? ORDER BY created_at DESC;',
        args: [institutionParam, collegeId],
      });
      submissionsRes = await db.execute('SELECT * FROM assignment_submissions;');
      noticesRes = await db.execute({
        sql: 'SELECT * FROM notices WHERE institution_name = ? OR college_id = ? ORDER BY created_at DESC;',
        args: [institutionParam, collegeId],
      });
      usersRes = await db.execute({
        sql: 'SELECT * FROM users WHERE institution_name = ? OR college_id = ? ORDER BY name ASC;',
        args: [institutionParam, collegeId],
      });
      filesRes = await db.execute({
        sql: 'SELECT * FROM course_files WHERE college_id = ? OR course_id IN (SELECT id FROM courses WHERE institution_name = ? OR college_id = ?) ORDER BY uploaded_at DESC;',
        args: [collegeId, institutionParam, collegeId],
      });
    }

    // Map channels to courses
    const allChannels = channelsRes.rows.map(ch => ({
      id: String(ch.id),
      courseId: ch.course_id ? String(ch.course_id) : '',
      name: String(ch.name),
      description: String(ch.description || ''),
      isGeneral: Boolean(ch.is_general || ch.name === 'Announcements'),
      unreadCount: Number(ch.unread_count || 0),
      studentFilePermission: (ch.student_file_permission || 'read-only') as 'read-only' | 'can-edit',
      subjectLecturerName: ch.subject_lecturer_name ? String(ch.subject_lecturer_name) : undefined,
      subjectLecturerId: ch.subject_lecturer_id ? String(ch.subject_lecturer_id) : undefined,
    }));

    const allCourses = coursesRes.rows.map(cRow => {
      let instructor = {
        id: String(cRow.instructor_id || 'usr-teacher-01'),
        name: String(cRow.instructor_name || 'Er. Ramesh Sharma'),
        role: 'professor',
        email: 'teacher@padmashree.edu.np',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
        license: 'Microsoft 365 A5 for Faculty',
        department: String(cRow.department || 'Department of BIT'),
        institutionName: String(cRow.institution_name || institutionParam),
        status: 'available' as const,
      };
      if (cRow.instructor_data) {
        try {
          instructor = { ...instructor, ...JSON.parse(String(cRow.instructor_data)) };
        } catch {}
      }

      let enrolledStudents: any[] = [];
      if (cRow.enrolled_students) {
        try {
          enrolledStudents = JSON.parse(String(cRow.enrolled_students));
        } catch {}
      }

      const courseChannels = allChannels.filter(ch => ch.courseId === String(cRow.id));
      if (courseChannels.length === 0) {
        courseChannels.push({
          id: `ch_${cRow.id}_gen`,
          courseId: String(cRow.id),
          name: 'Announcements',
          description: `${cRow.name} announcements noticeboard`,
          isGeneral: true,
          unreadCount: 0,
          studentFilePermission: 'read-only',
          subjectLecturerName: instructor.name,
          subjectLecturerId: instructor.id,
        });
      }

      return {
        id: String(cRow.id),
        code: String(cRow.code),
        name: String(cRow.name),
        department: String(cRow.department || 'Department of BIT'),
        institutionName: String(cRow.institution_name || institutionParam),
        term: String(cRow.term || 'Fall 2026'),
        color: String(cRow.color || '#4f46e5'),
        icon: String(cRow.icon || '⚡'),
        instructor,
        memberCount: Number(cRow.member_count || enrolledStudents.length || 45),
        isActivated: Boolean(cRow.is_activated ?? true),
        model: (cRow.model || 'model-a') as 'model-a' | 'model-b',
        template: 'Class' as const,
        channels: courseChannels,
        enrolledStudents,
      };
    });

    // Map submissions to assignments
    const allSubmissions = submissionsRes.rows.map(s => {
      let parsedFiles = [];
      if (s.files) {
        try {
          parsedFiles = JSON.parse(String(s.files));
        } catch {}
      } else if (s.file_name) {
        parsedFiles = [
          {
            name: String(s.file_name),
            size: String(s.file_size || '1.8 MB'),
            type: 'pdf',
            isReadOnly: true,
            uploadedAt: String(s.submitted_at || 'Just now'),
          },
        ];
      }

      return {
        id: String(s.id),
        assignmentId: String(s.assignment_id),
        studentId: String(s.student_id),
        studentName: String(s.student_name || 'Student'),
        status: (s.status || 'turned-in') as 'not-turned-in' | 'viewed' | 'turned-in' | 'turned-in-late' | 'graded',
        submittedAt: String(s.submitted_at || ''),
        fileName: s.file_name ? String(s.file_name) : undefined,
        fileSize: s.file_size ? String(s.file_size) : undefined,
        files: parsedFiles,
        grade: s.grade ? Number(s.grade) : undefined,
        feedback: s.feedback ? String(s.feedback) : undefined,
      };
    });

    const allAssignments = assignmentsRes.rows.map(a => {
      let rubric = [
        { id: 'r1', criterion: 'Technical accuracy and code execution', maxPoints: 60 },
        { id: 'r2', criterion: 'Documentation and report quality', maxPoints: 40 },
      ];
      if (a.rubric) {
        try {
          rubric = JSON.parse(String(a.rubric));
        } catch {}
      }

      const asgnSubs = allSubmissions.filter(s => s.assignmentId === String(a.id));
      const channelId = String(a.channel_id || a.target_channel_id || 'ch_cs301_lec');
      const subjectName = String(a.subject_name || a.subject || '');

      return {
        id: String(a.id),
        institutionName: String(a.institution_name || institutionParam || 'ProCollege University Network'),
        facultyId: String(a.faculty_id || ''),
        courseId: String(a.course_id || 'course_cs301'),
        courseCode: String(a.course_code || 'CS 301'),
        channelId,
        targetChannelId: channelId,
        subjectName,
        createdByEmail: String(a.created_by_email || a.created_by || ''),
        title: String(a.title),
        instructions: String(a.instructions || a.description || ''),
        points: Number(a.max_points || 100),
        referenceMaterialMode: 'students-cant-edit' as const,
        referenceFiles: [],
        dueAt: String(a.due_at || a.due_date || 'Nov 25, 2026, 11:59 PM'),
        dueTimestamp: a.due_timestamp ? Number(a.due_timestamp) : (a.due_at ? new Date(String(a.due_at)).getTime() : 1795651140000),
        closeAt: a.close_at ? String(a.close_at) : String(a.due_at || 'Nov 25, 2026, 11:59 PM'),
        isStrictNoLateSubmission: Boolean(a.is_strict_no_late ?? 1),
        rubric,
        submissions: asgnSubs,
      };
    });

    const allFaculties = facultiesRes.rows.map(f => ({
      id: String(f.id),
      name: String(f.name),
      code: String(f.code),
      deanId: String(f.dean_id || 'usr-admin-01'),
      deanName: String(f.dean_name || 'Academic Dean'),
      institutionName: String(f.institution_name || institutionParam),
      description: String(f.description || ''),
    }));

    const allUsers = usersRes.rows.map(u => ({
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      role: (u.role === 'teacher' ? 'professor' : u.role) as any,
      license: u.role === 'student' ? 'Microsoft 365 A3 for Students' : 'Microsoft 365 A5 for Faculty',
      department: String(u.department || 'Department of BIT'),
      institutionName: String(u.institution_name || institutionParam),
      avatar: String(u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'),
      status: 'available' as const,
    }));

    const allFiles = filesRes.rows.map(f => ({
      id: String(f.id),
      courseId: String(f.course_id),
      channelId: f.channel_id ? String(f.channel_id) : undefined,
      name: String(f.name),
      category: (f.category || 'Class Materials') as any,
      size: String(f.size || '1.0 MB'),
      uploadedAt: String(f.uploaded_at || 'Recently'),
      uploadedBy: String(f.uploaded_by || 'Instructor'),
      isClassMaterials: Boolean(f.is_class_material ?? 1),
      permission: (f.permission || 'read-only') as 'read-only' | 'can-edit',
    }));

    return c.json({
      success: true,
      institution: institutionParam,
      faculties: allFaculties,
      courses: allCourses,
      assignments: allAssignments,
      files: allFiles,
      notices: noticesRes.rows,
      users: allUsers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// Get all faculties
app.get('/api/faculties', async (c) => {
  try {
    const db = getDb(c);
    const res = await db.execute('SELECT * FROM faculties ORDER BY name ASC;');
    const faculties = res.rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      code: String(r.code),
      deanId: r.dean_id ? String(r.dean_id) : undefined,
      deanName: r.dean_name ? String(r.dean_name) : undefined,
      description: r.description ? String(r.description) : undefined,
      institutionName: r.institution_name ? String(r.institution_name) : undefined,
    }));
    return c.json({ success: true, faculties });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 7. Persist newly created Faculty (R13, R22)
app.post('/api/faculties', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `fac_${Date.now()}`;
    const collegeId = body.college_id || 'padmashree-demo';
    const institutionName = body.institutionName || body.institution_name || 'Padmashree College';
    const name = (body.name || '').trim();
    const code = (body.code || '').trim().toUpperCase();
    const deanId = body.deanId || body.dean_id || 'usr-admin-01';
    const deanName = body.deanName || body.dean_name || 'Academic Dean';
    const description = (body.description || '').trim();

    if (!name || !code) {
      return c.json({ error: 'Faculty name and code are required' }, 400);
    }

    const db = getDb(c);
    await db.execute({
      sql: `INSERT INTO faculties (id, college_id, institution_name, name, code, dean_id, dean_name, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [id, collegeId, institutionName, name, code, deanId, deanName, description],
    });

    const faculty = { id, college_id: collegeId, institutionName, name, code, deanId, deanName, description };
    return c.json({ success: true, faculty }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// Delete Faculty
app.delete('/api/faculties/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const db = getDb(c);
    await db.execute({
      sql: 'DELETE FROM faculties WHERE id = ?;',
      args: [id],
    });
    return c.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 8. Persist newly created Course & Channels (R14, R20)
app.post('/api/courses', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `course_${Date.now()}`;
    const collegeId = body.college_id || 'padmashree-demo';
    const institutionName = body.institutionName || body.institution_name || 'Padmashree College';
    const code = (body.code || '').trim().toUpperCase();
    const name = (body.name || '').trim();
    const department = (body.department || 'Department of BIT').trim();
    const term = (body.term || 'Fall 2026').trim();
    const color = body.color || '#4f46e5';
    const icon = body.icon || '⚡';
    const instructor = body.instructor || {};
    const instructorId = instructor.id || 'usr-teacher-01';
    const instructorName = instructor.name || 'Er. Ramesh Sharma';
    const memberCount = Number(body.memberCount || 45);
    const model = body.model || 'model-a';
    const template = body.template || 'Class';
    const enrolledStudents = body.enrolledStudents ? JSON.stringify(body.enrolledStudents) : '[]';

    if (!code || !name) {
      return c.json({ error: 'Course code and name are required' }, 400);
    }

    const db = getDb(c);
    await db.execute({
      sql: `INSERT INTO courses (id, college_id, institution_name, code, name, department, term, color, icon, instructor_id, instructor_name, instructor_data, member_count, is_activated, model, template, enrolled_students)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [id, collegeId, institutionName, code, name, department, term, color, icon, instructorId, instructorName, JSON.stringify(instructor), memberCount, 1, model, template, enrolledStudents],
    });

    // Default protected Announcements channel
    const defaultChanId = `ch_${id}_announcements`;
    await db.execute({
      sql: `INSERT INTO channels (id, college_id, course_id, name, description, is_general, type, student_file_permission, subject_lecturer_name, subject_lecturer_id)
            VALUES (?, ?, ?, ?, ?, 1, 'announcements', 'read-only', ?, ?);`,
      args: [defaultChanId, collegeId, id, 'Announcements', 'Class-wide notices, exam schedules, and alerts from all lecturers', instructorName, instructorId],
    });

    // Any additional subject channels passed in creation
    const channels = body.channels || [];
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      if (ch.name && ch.name !== 'Announcements') {
        const chanId = ch.id || `ch_${id}_${i + 1}`;
        await db.execute({
          sql: `INSERT INTO channels (id, college_id, course_id, name, description, is_general, type, student_file_permission, subject_lecturer_name, subject_lecturer_id)
                VALUES (?, ?, ?, ?, ?, 0, 'general', ?, ?, ?);`,
          args: [chanId, collegeId, id, ch.name, ch.description || `Subject Channel: ${ch.name}`, ch.studentFilePermission || 'read-only', ch.subjectLecturerName || instructorName, ch.subjectLecturerId || instructorId],
        });
      }
    }

    return c.json({ success: true, courseId: id }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// Delete Course & Channels
app.delete('/api/courses/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const db = getDb(c);
    await db.execute({
      sql: 'DELETE FROM courses WHERE id = ?;',
      args: [id],
    });
    await db.execute({
      sql: 'DELETE FROM channels WHERE course_id = ?;',
      args: [id],
    });
    return c.json({ success: true, deletedCourseId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 9. Delete subject channel with protected Announcements check (R20)
app.delete('/api/courses/:courseId/subjects/:subjectId', async (c) => {
  const courseId = c.req.param('courseId');
  const subjectId = c.req.param('subjectId');

  try {
    const db = getDb(c);
    const result = await db.execute({
      sql: 'SELECT id, name, is_general FROM channels WHERE id = ? AND course_id = ?;',
      args: [subjectId, courseId],
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    const chan = result.rows[0];
    const chanName = String(chan.name || '').toLowerCase();
    if (chanName === 'announcements' || Boolean(chan.is_general)) {
      return c.json({ error: 'Cannot delete default protected Announcements channel' }, 403);
    }

    await db.execute({
      sql: 'DELETE FROM channels WHERE id = ? AND course_id = ?;',
      args: [subjectId, courseId],
    });

    return c.json({ success: true, message: 'Subject channel deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 10. Persist automated Semester Rollover (R23)
app.post('/api/courses/rollover', async (c) => {
  try {
    const body = await c.req.json();
    const sourceCourseId = body.sourceCourseId;
    const newCode = (body.code || '').trim().toUpperCase();
    const newName = (body.name || '').trim();
    const newTerm = (body.term || '').trim();
    const instructorId = body.instructorId || 'usr-teacher-01';

    if (!sourceCourseId || !newCode || !newName) {
      return c.json({ error: 'sourceCourseId, code, and name are required for rollover' }, 400);
    }

    const db = getDb(c);
    const sourceRes = await db.execute({
      sql: 'SELECT * FROM courses WHERE id = ?;',
      args: [sourceCourseId],
    });

    if (sourceRes.rows.length === 0) {
      return c.json({ error: 'Source course not found' }, 404);
    }

    const src = sourceRes.rows[0];
    const newCourseId = `course_rollover_${Date.now()}`;
    const collegeId = String(src.college_id || 'padmashree-demo');
    const institutionName = String(src.institution_name || 'Padmashree College');

    await db.execute({
      sql: `INSERT INTO courses (id, college_id, institution_name, code, name, department, term, color, icon, instructor_id, instructor_name, member_count, is_activated, model, template, enrolled_students)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'Class', ?);`,
      args: [
        newCourseId,
        collegeId,
        institutionName,
        newCode,
        newName,
        src.department,
        newTerm,
        src.color || '#0891b2',
        src.icon || '🏛️',
        instructorId,
        'Er. Ramesh Sharma',
        src.member_count || 45,
        src.model || 'model-b',
        src.enrolled_students || '[]',
      ],
    });

    // Create Announcement channel for rollover
    await db.execute({
      sql: `INSERT INTO channels (id, college_id, course_id, name, description, is_general, type, student_file_permission)
            VALUES (?, ?, ?, 'Announcements', ?, 1, 'announcements', 'read-only');`,
      args: [`ch_${newCourseId}_gen`, collegeId, newCourseId, `${newName} Class announcements and notices`],
    });

    // Create additional rollover channels if provided
    const channels = body.channels || [];
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      await db.execute({
        sql: `INSERT INTO channels (id, college_id, course_id, name, description, is_general, type, student_file_permission, subject_lecturer_name, subject_lecturer_id)
              VALUES (?, ?, ?, ?, ?, 0, 'general', 'read-only', ?, ?);`,
        args: [`ch_${newCourseId}_${i + 1}`, collegeId, newCourseId, ch.name, ch.description || `Subject: ${ch.name}`, ch.subjectLecturerName, ch.subjectLecturerId],
      });
    }

    return c.json({ success: true, newCourseId }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 11. Create assignment in Turso with strict 4-level scoping
app.post('/api/assignments', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `asgn_${Date.now()}`;
    const collegeId = body.college_id || body.collegeId || 'padmashree-demo';
    const institutionName = body.institution_name || body.institutionName || 'ProCollege University Network';
    const facultyId = body.faculty_id || body.facultyId || 'fac_cs';
    const courseId = body.course_id || body.courseId || 'course_cs301';
    const courseCode = body.course_code || body.courseCode || 'CS 301';
    const channelId = body.channel_id || body.channelId || body.targetChannelId || 'ch_cs301_lec';
    const subjectName = body.subject_name || body.subjectName || 'Subject Coursework';
    const sectionId = body.section_id || body.sectionId || 'sec-sem5-a';
    const title = (body.title || '').trim();
    const instructions = (body.instructions || body.description || '').trim();
    const dueAt = body.due_at || body.dueAt || 'Nov 25, 2026, 11:59 PM';
    const dueTimestamp = body.dueTimestamp || (body.due_at ? new Date(body.due_at).getTime() : 1795651140000);
    const maxPoints = Number(body.max_points || body.points || 100);
    const rubric = body.rubric ? JSON.stringify(body.rubric) : null;
    let createdBy = body.created_by || body.createdBy || 'Course Lecturer';
    let createdByEmail = body.created_by_email || body.createdByEmail || '';

    if (!title) {
      return c.json({ error: 'Assignment title is required' }, 400);
    }

    const db = getDb(c);

    // Safely ensure new boundary columns exist
    const colsToEnsure = [
      { name: 'faculty_id', type: 'TEXT' },
      { name: 'channel_id', type: 'TEXT' },
      { name: 'subject_name', type: 'TEXT' },
      { name: 'created_by_email', type: 'TEXT' }
    ];
    for (const col of colsToEnsure) {
      try {
        await db.execute(`ALTER TABLE assignments ADD COLUMN ${col.name} ${col.type};`);
      } catch {}
    }

    await db.execute({
      sql: `INSERT INTO assignments (id, college_id, institution_name, faculty_id, course_id, course_code, section_id, channel_id, subject_name, title, description, instructions, due_at, due_timestamp, close_at, is_strict_no_late, max_points, rubric, created_by, created_by_email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?);`,
      args: [id, collegeId, institutionName, facultyId, courseId, courseCode, sectionId, channelId, subjectName, title, instructions, instructions, dueAt, dueTimestamp, dueAt, maxPoints, rubric, createdBy, createdByEmail],
    });

    return c.json({
      success: true,
      assignment: { id, title, courseCode, channelId, subjectName, dueAt, dueTimestamp, maxPoints },
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 12. Submit assignment with Server-Side Deadline Lock (R3, R4)
app.post('/api/assignments/:id/submit', async (c) => {
  const assignmentId = c.req.param('id');
  try {
    const body = await c.req.json();
    const studentId = body.student_id || body.studentId || 'usr_anonymous';
    const studentName = body.student_name || body.studentName || 'Student';
    const submissionText = body.submission_text || body.notes || '';
    const fileName = body.file_name || body.fileName || 'Submission.pdf';
    const fileSize = body.file_size || body.fileSize || '1.8 MB';
    const files = body.files ? JSON.stringify(body.files) : JSON.stringify([
      { name: fileName, size: fileSize, type: 'pdf', isReadOnly: true, uploadedAt: 'Just now' }
    ]);
    const submittedAt = new Date().toISOString();

    const db = getDb(c);

    // Verify Assignment & Enforce Server-Side Deadline Lock
    const asgnRes = await db.execute({
      sql: 'SELECT id, due_at, due_timestamp FROM assignments WHERE id = ?;',
      args: [assignmentId],
    });

    if (asgnRes.rows.length > 0) {
      const asgn = asgnRes.rows[0];
      const now = Date.now();
      const dueTs = asgn.due_timestamp ? Number(asgn.due_timestamp) : (asgn.due_at ? new Date(String(asgn.due_at)).getTime() : 0);
      if (dueTs > 0 && now > dueTs) {
        return c.json({ error: 'Submission Closed — Deadline Passed' }, 403);
      }
    }

    const id = body.id || `sub_${assignmentId}_${studentId}`;
    await db.execute({
      sql: `INSERT OR REPLACE INTO assignment_submissions (id, assignment_id, student_id, student_name, status, submission_text, file_name, file_size, files, submitted_at)
            VALUES (?, ?, ?, ?, 'turned-in', ?, ?, ?, ?, ?);`,
      args: [id, assignmentId, studentId, studentName, submissionText, fileName, fileSize, files, submittedAt],
    });

    return c.json({
      success: true,
      submission: {
        id,
        assignment_id: assignmentId,
        student_id: studentId,
        student_name: studentName,
        status: 'turned-in',
        submitted_at: submittedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 13. Undo submission with Server-Side Deadline Lock (R3, R4)
app.post('/api/assignments/:id/undo', async (c) => {
  const assignmentId = c.req.param('id');
  try {
    const body = await c.req.json();
    const studentId = body.student_id || body.studentId || 'usr_anonymous';

    const db = getDb(c);

    // Verify Assignment & Enforce Server-Side Deadline Lock
    const asgnRes = await db.execute({
      sql: 'SELECT id, due_at, due_timestamp FROM assignments WHERE id = ?;',
      args: [assignmentId],
    });

    if (asgnRes.rows.length > 0) {
      const asgn = asgnRes.rows[0];
      const now = Date.now();
      const dueTs = asgn.due_timestamp ? Number(asgn.due_timestamp) : (asgn.due_at ? new Date(String(asgn.due_at)).getTime() : 0);
      if (dueTs > 0 && now > dueTs) {
        return c.json({ error: 'Cannot undo submission — Deadline Passed' }, 403);
      }
    }

    await db.execute({
      sql: `UPDATE assignment_submissions SET status = 'not-turned-in' WHERE assignment_id = ? AND student_id = ?;`,
      args: [assignmentId, studentId],
    });

    return c.json({ success: true, message: 'Turn in undone successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 14. Get live campus access requests for Admin Center
app.get('/api/colleges/requests', async (c) => {
  try {
    const db = getDb(c);
    const result = await db.execute('SELECT * FROM college_requests ORDER BY created_at DESC;');
    return c.json({ requests: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 10. Get users for a college
app.get('/api/colleges/users/:collegeId', async (c) => {
  const collegeId = c.req.param('collegeId');
  try {
    const db = getDb(c);
    const result = await db.execute({
      sql: `SELECT id, college_id, section_id, name, email, role, avatar_url, created_at
            FROM users
            WHERE college_id = ?
            ORDER BY name ASC;`,
      args: [collegeId],
    });
    return c.json({ users: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 15. Create / Upload Course File in Turso
app.post('/api/courses/:courseId/files', async (c) => {
  const courseId = c.req.param('courseId');
  try {
    const body = await c.req.json();
    const id = body.id || `file_${Date.now()}`;
    const collegeId = body.collegeId || body.college_id || 'padmashree-demo';
    const channelId = body.channelId || body.channel_id || null;
    const name = (body.name || 'document.pdf').trim();
    const category = body.category || 'Class Materials';
    const size = body.size || '1.2 MB';
    const type = body.type || 'pdf';
    const uploadedBy = body.uploadedBy || body.uploaded_by || 'Instructor';
    const isClassMaterial = body.isClassMaterials ? 1 : 0;
    const permission = body.permission || 'read-only';
    const uploadedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const db = getDb(c);
    await db.execute({
      sql: `INSERT INTO course_files (id, course_id, college_id, channel_id, name, category, size, type, uploaded_by, is_class_material, permission, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [id, courseId, collegeId, channelId, name, category, size, type, uploadedBy, isClassMaterial, permission, uploadedAt],
    });

    return c.json({
      success: true,
      file: { id, courseId, channelId, name, category, size, uploadedBy, isClassMaterials: Boolean(isClassMaterial), permission, uploadedAt }
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 16. Delete Course File from Turso with permission check
app.delete('/api/courses/:courseId/files/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const role = c.req.header('x-user-role') || '';
  try {
    const db = getDb(c);
    const existing = await db.execute({
      sql: 'SELECT * FROM course_files WHERE id = ?;',
      args: [fileId],
    });
    if (existing.rows.length === 0) {
      return c.json({ error: 'File not found' }, 404);
    }
    const file = existing.rows[0];
    if (file.is_class_material && role === 'student') {
      return c.json({ error: 'Class Materials are protected and read-only for students' }, 403);
    }

    await db.execute({
      sql: 'DELETE FROM course_files WHERE id = ?;',
      args: [fileId],
    });

    return c.json({ success: true, message: `Deleted ${file.name}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 17. Cloudflare D1 procollege_vault: Backup snapshot from Turso
app.post('/api/vault/backup', async (c) => {
  try {
    if (!c.env.procollege_vault) {
      return c.json({ error: 'Cloudflare D1 procollege_vault binding not found' }, 503);
    }
    const db = getDb(c);
    const tables = ['colleges', 'users', 'courses', 'assignments', 'notices', 'course_files'];
    const snapshotTime = new Date().toISOString();
    const results: Record<string, number> = {};

    for (const table of tables) {
      try {
        const res = await db.execute(`SELECT * FROM ${table};`);
        const rows = res.rows;
        const count = rows.length;
        results[table] = count;
        const id = `snap_${table}_${Date.now()}`;
        await c.env.procollege_vault.prepare(
          'INSERT OR REPLACE INTO backup_vault (id, snapshot_time, table_name, record_count, status, data_json) VALUES (?, ?, ?, ?, ?, ?);'
        ).bind(id, snapshotTime, table, count, 'completed', JSON.stringify(rows)).run();
      } catch (tableErr) {
        results[table] = -1;
      }
    }

    return c.json({
      success: true,
      message: 'Turso database successfully backed up to Cloudflare D1 procollege_vault',
      snapshotTime,
      backedUpTables: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 18. Cloudflare D1 procollege_vault: List recent backups
app.get('/api/vault/backups', async (c) => {
  try {
    if (!c.env.procollege_vault) {
      return c.json({ error: 'Cloudflare D1 procollege_vault binding not found' }, 503);
    }
    const result = await c.env.procollege_vault.prepare(
      'SELECT id, snapshot_time, table_name, record_count, status, created_at FROM backup_vault ORDER BY created_at DESC LIMIT 50;'
    ).all();
    return c.json({ success: true, backups: result.results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// 19. Cloudinary 25GB Storage Config
app.get('/api/storage/config', (c) => {
  return c.json({
    provider: 'cloudinary',
    cloudName: c.env.CLOUDINARY_CLOUD_NAME || 'pf66y0wq',
    uploadEndpoint: `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME || 'pf66y0wq'}/auto/upload`,
  });
});

// 20. Cloudinary 25GB Storage: Register uploaded file metadata
app.post('/api/storage/files', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `asset_${Date.now()}`;
    const fileName = body.name || body.fileName || 'file.pdf';
    const cloudName = c.env.CLOUDINARY_CLOUD_NAME || 'pf66y0wq';
    const fileUrl = body.url || body.fileUrl || `https://res.cloudinary.com/${cloudName}/image/upload/${id}`;
    const fileSize = body.size || body.fileSize || '1.0 MB';
    const fileType = body.type || body.fileType || 'pdf';
    const publicId = body.publicId || id;
    const uploadedBy = body.uploadedBy || 'User';
    const courseId = body.courseId || 'course_padma_bit_sem5';

    // 1. Record into Cloudflare D1 procollege_vault
    if (c.env.procollege_vault) {
      await c.env.procollege_vault.prepare(
        'INSERT OR REPLACE INTO storage_assets (id, file_name, file_url, file_size, file_type, provider, cloud_name, public_id, uploaded_by, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
      ).bind(id, fileName, fileUrl, fileSize, fileType, 'cloudinary', cloudName, publicId, uploadedBy, courseId).run();
    }

    // 2. Also register into Turso course_files so it appears in the active course workspace
    const db = getDb(c);
    await db.execute({
      sql: `INSERT OR REPLACE INTO course_files (id, course_id, college_id, name, category, size, type, uploaded_by, is_class_material, permission)
            VALUES (?, ?, 'padmashree-demo', ?, 'Class Materials', ?, ?, ?, 1, 'read-only');`,
      args: [id, courseId, fileName, fileSize, fileType, uploadedBy],
    });

    return c.json({
      success: true,
      asset: { id, fileName, fileUrl, fileSize, fileType, publicId, courseId }
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

// Fallback: Serve static assets (React SPA) for all non-API routes
app.all('*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;

