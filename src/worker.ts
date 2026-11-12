import { Hono } from 'hono';
import { createClient } from '@libsql/client/web';

export type Env = {
  TURSO_DB_URL: string;
  TURSO_AUTH_TOKEN: string;
  ABLY_API_KEY: string;
  ASSETS: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: Env }>();

// Helper to get Turso client from context
function getDb(c: { env: Env }) {
  const url = c.env.TURSO_DB_URL || 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io';
  const authToken = c.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

// 1. Health check & DB verification
app.get('/api/health', async (c) => {
  try {
    const db = getDb(c);
    const result = await db.execute('SELECT count(*) as count FROM colleges;');
    const count = Number(result.rows[0]?.count ?? 0);
    return c.json({
      status: 'ok',
      collegesCount: count,
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
    const ablyApiKey = c.env.ABLY_API_KEY;
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

// Fallback: Serve static assets (React SPA) for all non-API routes
app.all('*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;

