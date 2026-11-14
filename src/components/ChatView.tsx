import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Send,
  Video,
  Phone,
  Paperclip,
  Smile,
  MoreHorizontal,
  ChevronLeft,
  MessageSquare,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Download,
  Eye,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { downloadFile, readFileAsDataUrl, getFileType, getFileMimeType } from '../utils/fileManager';
import { FilePreviewModal } from './FilePreviewModal';
import type { Attachment } from '../types';

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
  const [chatAttachments, setChatAttachments] = useState<Attachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Live Dexie IndexedDB + Turso delta sync + Ably Realtime hook
  const { messages: realtimeMsgs, sendMessage } = useRealtimeMessages(selectedConversation?.id || '');

  const activeMessages = selectedConversation ? (directMessages[selectedConversation.id] || []) : [];
  const otherUser = selectedConversation
    ? (selectedConversation.participants.find(p => p.id !== currentUser.id) || selectedConversation.participants[0])
    : null;

  // Combined messages with deduplication
  const allMessages = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; senderId?: string; content: string; timestamp: string; attachments?: Attachment[] }[] = [];

    // Local state messages
    for (const m of activeMessages) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          timestamp: m.timestamp,
          attachments: m.attachments,
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
          senderId: rm.sender_id || (isMe ? currentUser.id : (otherUser ? otherUser.id : '')),
          content: rm.body || rm.content || '',
          timestamp: rm.created_at
            ? new Date(rm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
        });
      }
    }

    return list;
  }, [activeMessages, realtimeMsgs, currentUser, otherUser]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newAtts: Attachment[] = [];
    for (const f of files) {
      const dataUrl = await readFileAsDataUrl(f);
      newAtts.push({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        type: (getFileType(f.name) === 'presentation' ? 'ppt' : getFileType(f.name)) as any,
        mimeType: f.type || getFileMimeType(f.name),
        url: dataUrl
      });
    }
    setChatAttachments(prev => [...prev, ...newAtts]);
    if (e.target) e.target.value = '';
  };

  const removeAttachment = (attId: string) => {
    setChatAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const getAttachmentIcon = (name: string, _type?: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'cpp', 'java'].includes(ext || '')) return <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext || '')) return <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />;
    return <FileText className="w-4 h-4 text-sky-500 shrink-0" />;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && chatAttachments.length === 0) || !selectedConversation) return;
    const text = messageInput.trim();
    const attsToSend = [...chatAttachments];
    setMessageInput('');
    setChatAttachments([]);

    // Update in-memory state
    sendDirectMessage(selectedConversation.id, text, attsToSend);

    // Save to IndexedDB, push to Turso via /api/messages, and broadcast on Ably REST
    try {
      const bodyText = text || (attsToSend.length > 0 ? `[Attached ${attsToSend.length} file(s): ${attsToSend.map(a => a.name).join(', ')}]` : '');
      await sendMessage(bodyText, currentUser.name, currentUser.id);
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
      <aside className={`w-full md:w-72 bg-[#E8E9E2] border-r border-[#B2C1C5] flex flex-col shrink-0 ${
        mobileChatListOpen ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="p-3 border-b border-[#B2C1C5]">
          <h2 className="font-bold text-sm text-[#141E2B] mb-2">Direct & Group Chat</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter chats or search people..."
              className="w-full bg-white border border-[#B2C1C5] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#26394D]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/40 p-1.5 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="font-semibold text-zinc-700">No conversations yet</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">No direct messages have been started in your workspace.</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const partner =
                conv.participants.find(p => p.id !== currentUser.id) || conv.participants[0];
              const isSelected = selectedConversation?.id === conv.id;

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
            })
          )}
        </div>
      </aside>

      {/* Main Conversation Window */}
      <div className={`flex-1 flex flex-col h-full bg-[#fafafa] min-w-0 ${
        mobileChatListOpen ? 'hidden md:flex' : 'flex'
      }`}>
        {!selectedConversation || !otherUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 bg-[#E8E9E2]">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border border-[#B2C1C5] mb-4 shadow-xs">
              <MessageSquare className="w-6 h-6 text-[#26394D]" />
            </div>
            <h3 className="text-sm font-bold text-[#141E2B] mb-1">Direct & Group Messaging</h3>
            <p className="text-xs text-zinc-600 max-w-sm">
              Your chats and direct messages with colleagues, professors, and students will appear here.
            </p>
          </div>
        ) : (
          <>
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
                <button
                  onClick={() => startMeeting(`Direct Call: ${otherUser.name}`, 'Chat')}
                  className="p-2 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-[#26394D] transition-colors"
                  title="Start Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startMeeting(`Voice Call: ${otherUser.name}`, 'Chat')}
                  className="p-2 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-[#26394D] transition-colors"
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
                          ? 'bg-[#26394D] text-white rounded-br-none'
                          : 'bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-none'
                      }`}
                    >
                      {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.attachments.map(att => (
                            <div
                              key={att.id}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs ${
                                isMe
                                  ? 'bg-white/10 border-white/20 text-white'
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {getAttachmentIcon(att.name, att.type)}
                                <div className="min-w-0">
                                  <span className="font-semibold truncate block max-w-[150px] sm:max-w-[190px]" title={att.name}>
                                    {att.name}
                                  </span>
                                  <span className={`text-[10px] block ${isMe ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                    {att.size}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewAttachment(att)}
                                  className={`p-1 rounded transition-colors ${
                                    isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-zinc-200 text-zinc-700'
                                  }`}
                                  title="Preview file"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadFile(att.name, att.url)}
                                  className={`p-1 rounded transition-colors ${
                                    isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-zinc-200 text-zinc-700'
                                  }`}
                                  title="Download file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

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

            {/* Attached Pending Files Tray */}
            {chatAttachments.length > 0 && (
              <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 flex flex-wrap gap-2">
                {chatAttachments.map(att => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-300 rounded-md text-xs shadow-2xs"
                  >
                    {getAttachmentIcon(att.name, att.type)}
                    <span className="font-medium text-zinc-800 max-w-[140px] truncate">{att.name}</span>
                    <span className="text-[10px] text-zinc-400">({att.size})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-zinc-400 hover:text-rose-600 transition-colors ml-1"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="file"
                ref={chatFileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors"
                title="Attach document or media"
              >
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
                className="flex-1 bg-zinc-100 border border-zinc-200 rounded-full px-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#26394D] focus:bg-white shadow-inner"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() && chatAttachments.length === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  messageInput.trim() || chatAttachments.length > 0
                    ? 'bg-[#26394D] hover:bg-[#141E2B] text-white shadow'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        )}
      </div>

      <FilePreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        file={previewAttachment}
      />
    </div>
  );
};
