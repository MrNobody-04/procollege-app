import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { createClient } from '@libsql/client/web';

type Bindings = {
  TURSO_DB_URL: string;
  TURSO_AUTH_TOKEN: string;
  ABLY_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Helper to get Turso client from context
function getDb(c: any) {
  const url = c.env?.TURSO_DB_URL || 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io';
  const authToken = c.env?.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

// 1. Health check & DB verification
app.get('/health', async (c) => {
  try {
    const db = getDb(c);
    const result = await db.execute('SELECT count(*) as count FROM colleges;');
    const count = Number(result.rows[0]?.count ?? 0);
    return c.json({
      status: 'ok',
      collegesCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

// 2. Notices for college with Edge Cache
app.get('/notices/:collegeId', async (c) => {
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
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 3. Channels for college
app.get('/channels/:collegeId', async (c) => {
  const collegeId = c.req.param('collegeId');
  try {
    const db = getDb(c);
    const result = await db.execute({
      sql: 'SELECT * FROM channels WHERE college_id = ? ORDER BY name ASC;',
      args: [collegeId],
    });
    return c.json({ channels: result.rows });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. Messages for channel with delta sync (?since=TIMESTAMP)
app.get('/messages/:channelId', async (c) => {
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
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 5. Send message: Saves to Turso & publishes via Ably REST
app.post('/messages', async (c) => {
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
    const ablyApiKey = c.env?.ABLY_API_KEY;
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
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export const onRequest = handle(app);

