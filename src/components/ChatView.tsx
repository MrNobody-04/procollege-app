import React, { useState, useMemo } from 'react';
import { Search, Send, Video, Phone, Paperclip, Smile, MoreHorizontal, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';

export const ChatView: React.FC = () => {
  const {
    currentUser,
    conversations,
    selectedConversation,
    setSelectedConversation,
    directMessages,
    sendDirectMessage,
    startMeeting
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [mobileChatListOpen, setMobileChatListOpen] = useState(false);

  // Live Dexie IndexedDB + Turso delta sync + Ably Realtime hook
  const { messages: realtimeMsgs, isSyncing, sendMessage } = useRealtimeMessages(selectedConversation.id);

  const activeMessages = directMessages[selectedConversation.id] || [];
  const otherUser =
    selectedConversation.participants.find(p => p.id !== currentUser.id) ||
    selectedConversation.participants[0];

  // Combined messages with deduplication
  const allMessages = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; senderId?: string; content: string; timestamp: string }[] = [];

    // Local state messages
    for (const m of activeMessages) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          timestamp: m.timestamp,
        });
      }
    }

    // Live Dexie/Turso/Ably messages
    for (const rm of realtimeMsgs) {
      if (!seen.has(rm.id)) {
        seen.add(rm.id);
        const isMe = rm.sender_id === currentUser.id || rm.sender_name === currentUser.name;
        list.push({
          id: rm.id,
          senderId: rm.sender_id || (isMe ? currentUser.id : otherUser.id),
          content: rm.body || rm.content || '',
          timestamp: rm.created_at
            ? new Date(rm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
        });
      }
    }

    return list;
  }, [activeMessages, realtimeMsgs, currentUser, otherUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput('');

    // Update in-memory state
    sendDirectMessage(selectedConversation.id, text);

    // Save to IndexedDB, push to Turso via /api/messages, and broadcast on Ably REST
    try {
      await sendMessage(text, currentUser.name, currentUser.id);
    } catch (err) {
      console.warn('Realtime message dispatch warning:', err);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.participants.some(p => p.name.toLowerCase().includes(filterQuery.toLowerCase())) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex h-full bg-white select-none overflow-hidden">
      {/* Chats List Sidebar */}
      <aside className={`w-full md:w-72 bg-[#f5f5f5] border-r border-[#e0e0e0] flex flex-col shrink-0 ${
        mobileChatListOpen ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="p-3 border-b border-[#e5e5e5]">
          <h2 className="font-bold text-sm text-zinc-900 mb-2">Direct & Group Chat</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter chats or search people..."
              className="w-full bg-white border border-zinc-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#5b5fc7]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/40 p-1.5 space-y-0.5">
          {filteredConversations.map(conv => {
            const partner =
              conv.participants.find(p => p.id !== currentUser.id) || conv.participants[0];
            const isSelected = selectedConversation.id === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv);
                  setMobileChatListOpen(false);
                }}
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-white shadow-xs border border-zinc-200' : 'hover:bg-zinc-200/50'
                }`}
              >
                <div className="relative">
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-200"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                      partner.status === 'available'
                        ? 'bg-emerald-500'
                        : partner.status === 'in-call'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-xs text-zinc-900 truncate">
                      {partner.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Conversation Window */}
      <div className={`flex-1 flex flex-col h-full bg-[#fafafa] min-w-0 ${
        mobileChatListOpen ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Chat Header */}
        <header className="h-14 bg-white border-b border-zinc-200 px-3 sm:px-6 flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileChatListOpen(true)}
              className="md:hidden p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-0.5 transition-colors shrink-0"
              title="Back to Conversations"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Chats</span>
            </button>

            <img
              src={otherUser.avatar}
              alt=""
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-1 ring-zinc-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 truncate">{otherUser.name}</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium capitalize shrink-0">
                  {otherUser.role}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">{otherUser.email} • {otherUser.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isSyncing ? 'Syncing...' : 'Live Realtime (Ably + Turso)'}
            </div>
            <button
              onClick={() => startMeeting(`Direct Call: ${otherUser.name}`, 'Chat')}
              className="p-2 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-[#5b5fc7] transition-colors"
              title="Start Video Call"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => startMeeting(`Voice Call: ${otherUser.name}`, 'Chat')}
              className="p-2 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-[#5b5fc7] transition-colors"
              title="Start Audio Call"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-md hover:bg-zinc-100 text-zinc-500">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ProCollege End-to-End Encrypted Campus Chat
            </div>
          </div>

          {allMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <img
                    src={otherUser.avatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                  />
                )}
                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                    isMe
                      ? 'bg-[#5b5fc7] text-white rounded-br-none'
                      : 'bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right ${
                      isMe ? 'text-indigo-200' : 'text-zinc-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input Composer */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0"
        >
          <button type="button" className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500">
            <Paperclip className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500">
            <Smile className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            placeholder={`Message ${otherUser.name}...`}
            className="flex-1 bg-zinc-100 border border-zinc-200 rounded-full px-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#5b5fc7] focus:bg-white shadow-inner"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              messageInput.trim()
                ? 'bg-[#5b5fc7] hover:bg-[#4f52b2] text-white shadow'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
