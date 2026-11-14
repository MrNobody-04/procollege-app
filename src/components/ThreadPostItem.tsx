import React, { useState } from 'react';
import {
  Smile,
  FileText,
  Download,
  Pin,
  Send,
  CornerDownRight,
  Eye,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Image as ImageIcon
} from 'lucide-react';
import type { ThreadPost, Attachment } from '../types';
import { useApp } from '../context/AppContext';
import { FilePreviewModal } from './FilePreviewModal';
import { downloadFile, getFileType } from '../utils/fileManager';

export const ThreadPostItem: React.FC<{ post: ThreadPost }> = ({ post }) => {
  const { addReply, toggleReaction, selectedChannel, selectedCourse } = useApp();
  const [replyText, setReplyText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const availableEmojis = ['👍', '❤️', '👏', '🎉', '💡', '🚀', '👀', '💯'];

  const categoryConfig: Record<string, { label: string; badgeClass: string; icon: string }> = {
    alert: { label: 'Urgent Alert', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🚨' },
    holiday: { label: 'Holiday Notice', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🏖️' },
    event: { label: 'Academic Event', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', icon: '📅' },
    'class-details': { label: 'Class Details', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📘' },
    general: { label: 'Announcement', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '📢' }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChannel?.id) return;
    addReply(selectedChannel.id, post.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className={`bg-white rounded-lg border overflow-hidden transition-all hover:border-zinc-300 ${
      post.category === 'alert'
        ? 'border-rose-300 ring-1 ring-rose-200/60'
        : post.category === 'holiday'
        ? 'border-emerald-300 ring-1 ring-emerald-200/60'
        : 'border-zinc-200'
    }`}>
      {/* Category Broadcast Pill */}
      {post.category && categoryConfig[post.category] && (
        <div className="px-4 pt-3 flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              categoryConfig[post.category].badgeClass
            }`}
          >
            <span>{categoryConfig[post.category].icon}</span>
            <span>{categoryConfig[post.category].label}</span>
          </span>
        </div>
      )}

      {/* Natural Microsoft Teams Subject / Announcement Line */}
      {post.title && (
        <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-zinc-900 leading-snug">
            {post.title}
          </h3>
          {post.pinned && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
        </div>
      )}

      {/* Main Post Body */}
      <div className="p-4">
        {/* Post Author Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-900">{post.author.name}</span>
                <span className="text-[11px] text-zinc-400 font-normal">{post.timestamp}</span>
              </div>
              <p className="text-[11px] text-zinc-500">{post.author.department}</p>
            </div>
          </div>

          {/* Quick Reaction Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <div
                className="absolute right-0 top-8 bg-white border border-zinc-200 shadow-lg rounded-full px-2 py-1 flex items-center gap-1 z-20"
                onMouseLeave={() => setShowEmojiPicker(false)}
              >
                {availableEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (selectedChannel?.id) {
                        toggleReaction(selectedChannel.id, post.id, emoji);
                      }
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform text-sm p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-2 text-xs text-zinc-800 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>

        {/* Attachments if Present */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {post.attachments.map(att => {
              const type = getFileType(att.name);
              const icon =
                type === 'pdf' ? <FileText className="w-4 h-4 text-rose-600" /> :
                type === 'image' ? <ImageIcon className="w-4 h-4 text-purple-600" /> :
                type === 'code' ? <FileCode className="w-4 h-4 text-indigo-600" /> :
                type === 'sheet' ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> :
                type === 'presentation' ? <Presentation className="w-4 h-4 text-amber-600" /> :
                type === 'archive' ? <FileArchive className="w-4 h-4 text-zinc-600" /> :
                <FileText className="w-4 h-4 text-blue-600" />;

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100/90 transition-all group"
                >
                  <div
                    onClick={() => setPreviewAttachment(att)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 group-hover:text-[#173bff] transition-colors truncate">
                        {att.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 capitalize">
                        {type} • {att.size}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={() => setPreviewAttachment(att)}
                      className="p-1.5 text-zinc-500 hover:text-[#173bff] hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Preview file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        downloadFile(att.name, att.url, {
                          courseName: selectedCourse?.name,
                          category: 'Post Attachment',
                          author: post.author.name
                        })
                      }
                      className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Emoji Reactions Pill Bar */}
        {Object.keys(post.reactions).length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {Object.entries(post.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => {
                  if (selectedChannel?.id) {
                    toggleReaction(selectedChannel.id, post.id, emoji);
                  }
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs text-zinc-700 transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-zinc-500">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread Replies List */}
        {post.replies && post.replies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-100 space-y-2.5">
            {post.replies.map(reply => (
              <div key={reply.id} className="flex items-start gap-2.5 pl-2 text-xs">
                <CornerDownRight className="w-3.5 h-3.5 text-zinc-300 mt-1 shrink-0" />
                <img
                  src={reply.author.avatar}
                  alt={reply.author.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-200 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{reply.author.name}</span>
                    <span className="text-[10px] text-zinc-400">{reply.timestamp}</span>
                  </div>
                  <p className="text-zinc-700 text-xs mt-0.5 leading-normal">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input Bar */}
        <form onSubmit={handleSendReply} className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Reply to conversation..."
            className="flex-1 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white text-xs text-zinc-800 placeholder-zinc-400 rounded-lg px-3 py-1.5 border border-zinc-200 focus:outline-none focus:border-[#26394D] transition-all"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className={`p-1.5 rounded-md transition-colors ${
              replyText.trim()
                ? 'bg-[#26394D] text-white hover:bg-[#141E2B]'
                : 'text-zinc-300 cursor-not-allowed'
            }`}
            title="Send reply"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* File Preview Modal */}
      {previewAttachment && (
        <FilePreviewModal
          file={{
            name: previewAttachment.name,
            size: previewAttachment.size,
            url: previewAttachment.url,
            uploadedBy: post.author.name,
            uploadedAt: post.timestamp,
            category: 'Post Attachment',
            courseName: selectedCourse?.name
          }}
          isOpen={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  );
};
