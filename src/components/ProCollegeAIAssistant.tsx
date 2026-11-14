import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isInitial?: boolean;
}

const SYSTEM_PROMPT = `You are Echo, the official, highly intelligent, and human-like AI concierge for ProCollege (procollege-app.sujan-bit-n2024.workers.dev).

## CRITICAL CONVERSATIONAL RULES:
1. MULTILINGUAL & EXACT LANGUAGE MATCHING:
   - Detect and strictly reply in the EXACT language and script the user uses.
   - If the user writes in Romanized Nepali (e.g. "k xa khabar", "namaste", "sanchai xau", "procollege k ho?"), reply warmly and naturally in Romanized Nepali! (e.g. "Sanchai chu! ProCollege bare k janna chahanu huncha?").
   - If the user writes in Nepali script (e.g. "के छ खबर"), reply in Nepali.
   - If the user writes in Hindi, reply in Hindi.
   - If in English, reply in clean, natural English.
2. BE BRIEF & ANSWER ONLY WHAT IS ASKED:
   - NEVER send long walls of text or unsolicited promotional paragraphs!
   - For greetings or small-talk (like "hi", "k xa khabar", "how are you"), reply in ONE short, friendly sentence. Do NOT dump platform feature lists on greetings.
   - For specific questions, provide a direct, crisp 1-3 sentence answer.
3. STRICT PLATFORM SCOPE & KNOWLEDGE:
   - ProCollege is a unified campus SaaS for schools (Nursery-12) & universities (Bachelor's).
   - Zero-Budget Stack: Turso SQLite edge DB, Cloudflare Workers, Ably real-time messaging, Cloudinary, Cloudflare D1 backup vaults.
   - Core Modules: Teams (channels/chats), Meet (virtual classrooms), LMS (assignments & rubrics), Cloud (document repository).
   - Attendance Lock: School level uses daily bulk roll-call. University level tracks per-subject sessions; if attendance drops below 75%, assignment submissions are automatically locked until the lecturer grants manual override permission.
   - Pricing: Starter (Free up to 100 users), Campus Pro ($6/student/mo), Enterprise University (Custom).
4. NATURAL CONVERSATIONAL CLOSING:
   - Keep any follow-up question short, friendly, and directly relevant to the user's inquiry.`;

// Automatic initial greeting from Echo
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'echo_auto_greeting',
    role: 'model',
    text: "Namaste! I'm Echo, ProCollege's AI concierge. How can I help you today?"
  }
];

const SUGGESTED_QUESTIONS = [
  'What is ProCollege?',
  'How does the 75% attendance lock work?',
  'Campus Pricing & Plans',
  'k xa khabar'
];

const GEMINI_API_KEY =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (typeof atob === 'function'
    ? atob('QVEuQWI4Uk42SzVHamVYZlFWZmV1aEl0U296MmpnZFM0RmhzMGJSN0VVQllncGxXTjFPWXc=')
    : '');

// 3D Holographic Iridescent Orb component matching exact reference image
const IridescentOrb: React.FC<{ size?: 'sm' | 'md' | 'lg'; onClick?: () => void }> = ({ size = 'md', onClick }) => {
  const dim = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';

  return (
    <div
      onClick={onClick}
      className={`relative ${dim} rounded-full overflow-hidden shadow-lg shadow-purple-500/25 shrink-0 cursor-pointer select-none`}
      title="ProCollege AI Intelligence Orb"
    >
      {/* Base vibrant gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#3b82f6] via-[#a855f7] to-[#ec4899] opacity-95 animate-pulse" />
      {/* 3D sphere volume & ambient shading */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,rgba(30,58,138,0.85),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0)_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_80%,rgba(56,189,248,0.7),transparent_55%)]" />
      {/* Specular curved glass light reflection */}
      <div className="absolute top-1 left-1.5 w-3.5 h-1.5 bg-white/80 rounded-full blur-[0.4px] transform -rotate-30" />
      <div className="absolute bottom-1 right-2 w-1.5 h-1 bg-white/40 rounded-full blur-[0.5px]" />
    </div>
  );
};

export const ProCollegeAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSuggestion, setActiveSuggestion] = useState<string>('Would you like to see the class schedule?');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const userQuery = (textToSend || inputValue).trim();
    if (!userQuery || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text: userQuery
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // 1. Attempt edge backend proxy /api/ai/chat
      let replyText = '';
      try {
        const backendRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory.map(m => ({ role: m.role, text: m.text }))
          })
        });

        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData.reply) {
            replyText = backendData.reply;
          }
        }
      } catch {
        // Fall back to direct Gemini API call
      }

      // 2. Direct client fallback with user's Gemini API Key
      if (!replyText) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const contents = newHistory.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        if (!res.ok) {
          throw new Error(`Gemini request failed: ${res.statusText}`);
        }

        const data = await res.json();
        replyText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'I am here to guide you through ProCollege campus operations. What would you like to explore next?';
      }

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'model',
        text: replyText
      };

      setMessages(prev => [...prev, aiMsg]);

      // Cycle next helpful suggestion chip
      const nextIndex = Math.floor(Math.random() * SUGGESTED_QUESTIONS.length);
      setActiveSuggestion(SUGGESTED_QUESTIONS[nextIndex]);
    } catch (err) {
      console.error('Echo Assistant Error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        text: 'ProCollege Echo is momentarily connecting to our edge infrastructure. Feel free to ask about our LMS, attendance gates, or campus pricing!'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setActiveSuggestion('Would you like to see the class schedule?');
  };

  return (
    <>
      {/* Floating Launcher Button on Website (When Closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in select-none">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-950/75 hover:bg-slate-900/90 backdrop-blur-2xl border border-white/25 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 cursor-pointer"
          >
            {/* Ambient pulsating glow */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 group-hover:opacity-60 blur-md transition duration-500" />
            <div className="relative flex items-center gap-2.5">
              <IridescentOrb size="md" />
              <div className="text-left">
                <span className="block text-xs font-bold text-white tracking-wide leading-tight">
                  ProCollege AI
                </span>
                <span className="block text-[10px] text-purple-200/80 font-medium">
                  Chat with Echo
                </span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Same-to-Same Frosted Glass Chat Window (Matching Reference Image) */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[min(560px,calc(100vh-100px))] flex flex-col rounded-[32px] overflow-hidden backdrop-blur-2xl bg-slate-950/65 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.25)] select-none animate-in fade-in zoom-in-95 duration-200">
          {/* Ethereal Frosted Aurora Glows Behind Content */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -left-12 w-48 h-48 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header with proper height and padding */}
          <div className="relative px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-xs">
                ProCollege AI
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <IridescentOrb size="md" />
              <button
                onClick={handleResetChat}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Minimize assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="relative flex-1 overflow-y-auto px-5 py-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end animate-fade-in">
                    <div className="bg-[#c2dcfe]/90 text-slate-900 font-normal px-4 py-2.5 rounded-2xl rounded-br-xs shadow-sm max-w-[85%] text-[13px] leading-relaxed relative border border-blue-200/40">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // AI (Echo) message bubble with "AI" badge
              return (
                <div key={msg.id} className="flex items-end gap-2 max-w-[90%] animate-fade-in">
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0 self-end mb-0.5 shadow-2xs">
                    AI
                  </div>
                  <div className="bg-white/80 backdrop-blur-md border border-white/40 text-slate-900 font-normal px-4 py-2.5 rounded-2xl rounded-bl-xs shadow-sm text-[13px] leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Quick Starter Chips on initial greeting */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 flex flex-wrap gap-1.5 animate-fade-in">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="text-[11.5px] bg-white/15 hover:bg-white/25 text-white/90 border border-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* AI Loading Bubble */}
            {isLoading && (
              <div className="flex items-end gap-2 max-w-[85%] animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0 self-end mb-0.5 shadow-2xs">
                  AI
                </div>
                <div className="bg-white/75 backdrop-blur-md border border-white/40 px-4 py-3 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Interactive Contextual Follow-up Suggestion Bubble (Matching User's Mockup) */}
            {!isLoading && activeSuggestion && (
              <div className="flex justify-end pt-1 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleSendMessage(activeSuggestion)}
                  className="bg-[#c2dcfe]/90 hover:bg-[#b0d2fc] text-slate-900 text-[12.5px] font-normal px-4 py-2 rounded-2xl rounded-br-xs shadow-sm border border-blue-200/40 cursor-pointer transition-all hover:scale-[1.02] text-right"
                  title="Click to ask Echo this question"
                >
                  {activeSuggestion}
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Capsule / Pill Input Bar at Bottom (Exact Reference Match) */}
          <div className="relative px-5 pb-5 pt-2 shrink-0">
            <div className="relative rounded-full bg-white/95 backdrop-blur-md border border-white/70 shadow-lg px-4 py-2.5 flex items-center justify-between gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Echo a question..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-slate-800 text-xs sm:text-[13px] placeholder:text-zinc-400 placeholder:font-light font-normal"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-1 text-zinc-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
                title="Send message"
              >
                {/* Minimalist slanted paper airplane matching exact photo angle */}
                <svg
                  className="w-5 h-5 transition-transform hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
