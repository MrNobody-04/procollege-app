import { useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDb, syncChannelMessages, saveLocalMessage, sendChatMessage, type LocalMessage } from '../lib/localDb';
import { subscribeToRealtimeChannel } from '../lib/ably';

export function useRealtimeMessages(channelId: string) {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 1. Reactive live query directly from IndexedDB
  const messages = useLiveQuery<LocalMessage[]>(
    async () => {
      if (!channelId) return [];
      return await localDb.messages.where('channel_id').equals(channelId).sortBy('created_at');
    },
    [channelId]
  ) ?? [];

  // 2. Fetch delta sync from backend & listen to Ably Realtime updates
  useEffect(() => {
    if (!channelId) return;

    let isMounted = true;
    setIsSyncing(true);

    // Initial Delta Sync from /api/messages/:channelId?since=
    syncChannelMessages(channelId)
      .catch((e) => console.warn('[Realtime] Delta sync warning:', e))
      .finally(() => {
        if (isMounted) setIsSyncing(false);
      });

    // Ably Realtime Push Subscription
    const unsubscribe = subscribeToRealtimeChannel(channelId, (incoming) => {
      if (incoming && incoming.id) {
        saveLocalMessage({
          id: String(incoming.id),
          channel_id: String(incoming.channel_id || channelId),
          sender_name: String(incoming.sender_name || incoming.author_name || 'Anonymous'),
          body: String(incoming.body || incoming.content || ''),
          created_at: String(incoming.created_at || new Date().toISOString()),
          sender_id: incoming.sender_id,
          author_name: incoming.author_name,
          content: incoming.content,
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [channelId]);

  // 3. Action to send message
  const sendMessage = useCallback(
    async (body: string, senderName: string, senderId?: string) => {
      if (!channelId || !body.trim()) return;
      return await sendChatMessage({
        channel_id: channelId,
        body,
        sender_name: senderName,
        sender_id: senderId,
      });
    },
    [channelId]
  );

  return {
    messages,
    isSyncing,
    sendMessage,
  };
}
