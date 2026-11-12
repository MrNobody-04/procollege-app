import Ably from 'ably';

const subscribeKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ABLY_SUBSCRIBE_KEY) ||
  'wbIoLQ.X8L0qQ:LYTf7p-Isq-UIhJoZ-xv9-JqwkwmQd5v6Awwb8GC-jw';

let client: Ably.Realtime | null = null;

export function getAblyRealtime(): Ably.Realtime | null {
  if (typeof window === 'undefined') return null;
  if (!client) {
    try {
      client = new Ably.Realtime({
        key: subscribeKey,
        autoConnect: true,
      });
    } catch (err) {
      console.error('[Ably] Failed to initialize Realtime client:', err);
    }
  }
  return client;
}

/**
 * Subscribe to Ably channel messages with automatic cleanup
 */
export function subscribeToRealtimeChannel(
  channelId: string,
  onMessageReceived: (messageData: any) => void
): () => void {
  const rt = getAblyRealtime();
  if (!rt) return () => {};

  const channel = rt.channels.get(channelId);
  const handler = (msg: Ably.Message) => {
    if (msg && msg.data) {
      onMessageReceived(msg.data);
    }
  };

  channel.subscribe('chat-message', handler);

  return () => {
    try {
      channel.unsubscribe('chat-message', handler);
    } catch (e) {
      // Ignore unsubscribe errors on unmount
    }
  };
}

