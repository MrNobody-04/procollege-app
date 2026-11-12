import Dexie, { type Table } from 'dexie';

export interface LocalMessage {
  id: string;
  channel_id: string;
  sender_name: string;
  body: string;
  created_at: string;
  sender_id?: string;
  author_name?: string;
  content?: string;
  attachments?: string | null;
}

export class ProCollegeDatabase extends Dexie {
  messages!: Table<LocalMessage, string>;

  constructor() {
    super('ProCollegeDatabase');
    this.version(1).stores({
      messages: 'id, channel_id, sender_name, body, created_at',
    });
  }
}

export const localDb = new ProCollegeDatabase();

/**
 * Delta sync messages for a specific channel from /api/messages/:channelId?since=TIMESTAMP
 */
export async function syncChannelMessages(channelId: string): Promise<LocalMessage[]> {
  try {
    // 1. Find the latest timestamp stored locally for this channel
    const existing = await localDb.messages
      .where('channel_id')
      .equals(channelId)
      .sortBy('created_at');

    const latest = existing.length > 0 ? existing[existing.length - 1] : null;
    const sinceParam = latest?.created_at ? `?since=${encodeURIComponent(latest.created_at)}` : '';

    // 2. Fetch delta messages from backend edge endpoint
    const response = await fetch(`/api/messages/${encodeURIComponent(channelId)}${sinceParam}`);
    if (!response.ok) {
      console.warn(`[Sync] Delta sync failed for ${channelId}:`, response.statusText);
      return existing;
    }

    const json = await response.json();
    const fetched: any[] = json.messages || [];

    // 3. Cache delta rows into IndexedDB
    if (fetched.length > 0) {
      const records: LocalMessage[] = fetched.map(m => ({
        id: String(m.id),
        channel_id: String(m.channel_id),
        sender_name: String(m.sender_name || m.author_name || 'Anonymous'),
        body: String(m.body || m.content || ''),
        created_at: String(m.created_at || new Date().toISOString()),
        sender_id: m.sender_id ? String(m.sender_id) : undefined,
        author_name: m.author_name ? String(m.author_name) : undefined,
        content: m.content ? String(m.content) : undefined,
        attachments: m.attachments ? String(m.attachments) : null,
      }));

      await localDb.messages.bulkPut(records);
    }

    // 4. Return complete sorted channel messages from IndexedDB
    return await localDb.messages
      .where('channel_id')
      .equals(channelId)
      .sortBy('created_at');
  } catch (err) {
    console.error(`[Sync] Error syncing messages for channel ${channelId}:`, err);
    return await localDb.messages
      .where('channel_id')
      .equals(channelId)
      .sortBy('created_at');
  }
}

/**
 * Save a message locally to IndexedDB immediately for optimistic UI
 */
export async function saveLocalMessage(msg: LocalMessage): Promise<void> {
  await localDb.messages.put(msg);
}

/**
 * Send message to Hono backend /api/messages which stores in Turso and publishes via Ably REST
 */
export async function sendChatMessage(data: {
  channel_id: string;
  sender_name: string;
  body: string;
  sender_id?: string;
  attachments?: any[];
}): Promise<LocalMessage> {
  const localId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  const optimisticMsg: LocalMessage = {
    id: localId,
    channel_id: data.channel_id,
    sender_name: data.sender_name,
    body: data.body,
    sender_id: data.sender_id,
    created_at: createdAt,
    author_name: data.sender_name,
    content: data.body,
  };

  // Optimistic local cache
  await saveLocalMessage(optimisticMsg);

  // Send to edge backend
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimisticMsg),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.message) {
        await saveLocalMessage(result.message);
        return result.message;
      }
    }
  } catch (err) {
    console.warn('[Message] Failed to post message to /api/messages, saved offline:', err);
  }

  return optimisticMsg;
}

