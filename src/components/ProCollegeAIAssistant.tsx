import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ProCollegeLogo } from './ProCollegeLogo';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_PROMPT = `You are Echo, the charismatic, highly intelligent, and articulate AI concierge for ProCollege (procollege-app.sujan-bit-n2024.workers.dev).
ProCollege is a cloud-native campus SaaS ecosystem built for schools (Nursery-12) and universities (Bachelor's programs).

Guidelines:
1. For casual greetings or small-talk (e.g., 'hi', 'k xa khabar', 'namaste'):
   Respond in 1-2 friendly, engaging sentences matching their exact language (Nepali, Romanized Nepali, or English) and offer a natural entry point into ProCollege.
2. For conceptual or complex questions (e.g., 'What actually is ProCollege?', 'What does ProCollege do for me?', 'How does the attendance lock work?'):
   Give a smart, comprehensive, and well-structured answer with clear value propositions for students, faculty, and administrators.
3. Tech specs & features:
   - High-Speed Zero-Budget Edge Stack: Turso SQLite edge DB, Cloudflare Workers, Ably WebSockets, Cloudinary CDN, Cloudflare D1 vaults.
   - Core Modules: ProCollege Teams (chat & channels), Meet (virtual lectures), LMS (grading & assignments), Cloud (syllabus & documents).
   - Smart Attendance Gatekeeper: Daily bulk roll-call for Nursery-12; per-subject session tracking for Bachelor's with automated LMS assignment locking below 75% attendance until manual faculty override.
   - Pricing: Starter (Free up to 100 users), Campus Pro ($6/student/mo), Enterprise University (Custom).
4. Always remain positive, helpful, and natural. Never say 'As an AI language model' or 'How may I assist you today?'. End with a natural conversational follow-up.`;

// Automatic initial greeting from Echo
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'echo_auto_greeting',
    role: 'model',
    text: "Namaste! I'm Echo, ProCollege's AI concierge. How can I help you today?"
  }
];

const SUGGESTED_QUESTIONS = [
  'What actually is ProCollege?',
  'How does the 75% attendance lock work?',
  'Campus Pricing & Plans'
];

const GEMINI_API_KEY =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (typeof atob === 'function'
    ? atob('QVEuQWI4Uk42SzVHamVYZlFWZmV1aEl0U296MmpnZFM0RmhzMGJSN0VVQllncGxXTjFPWXc=')
    : '');

// Intelligent offline ProCollege answer generator (zero-latency fallback)
function getOfflineProCollegeReply(query: string): string {
  const q = query.toLowerCase().trim();

  // 1. Nepali / Romanized Nepali greetings
  if (/\b(k\s*xa|k\s*cha|khabar|sanchai|namaste|sancho|thik\s*cha|hajur)\b/i.test(q)) {
    return 'Sanchai chhu! Tapai ko k khabar chha? ProCollege ko cloud-native campus platform bare kehi bujhna chahanu huncha?';
  }

  // 2. Short English greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|yo|greetings)[\s!.]*$/i.test(q)) {
    return "Hello! I'm Echo, your ProCollege AI concierge. I'm here to help you explore our campus features, pricing, and infrastructure. What can I help you with today?";
  }

  // 3. Attendance & Gatekeeper Questions
  if (/\b(attendance|75%?|lock|gatekeeper|absent|roll[\s-]?call|minimum)\b/i.test(q)) {
    return `ProCollege features a smart, automated Attendance Gatekeeper:

• **School Level (Nursery to Class 12):** Daily bulk roll-call managed by Class Heads with automated aggregate percentage tracking.
• **University Level (Bachelor's):** Granular per-subject attendance calculated from conducted lecture sessions. If a student's attendance drops below 75%, their LMS assignment submission portal is automatically locked until the course lecturer grants a manual override.

Would you like to know how lecturers can configure or override attendance limits?`;
  }

  // 4. Pricing & Plans Questions
  if (/\b(price|pricing|cost|plan|plans|free|tier|subscription|how\s*much)\b/i.test(q)) {
    return `ProCollege offers three flexible institutional tiers:

• **Starter (Free):** Up to 100 users, core collaboration channels, and shared campus workspaces — ideal for clubs and small academic departments.
• **Campus Pro ($6/student/mo):** Full ProCollege Teams experience, HD virtual lectures (Meet), unified LMS workflows, and AI study assistance.
• **Enterprise University (Custom Pricing):** Multi-campus governance, SIS integrations, Cloudflare D1 backup vaults, and dedicated SLA support.

Would you like help choosing the best plan for your campus?`;
  }

  // 5. Broad "What is ProCollege" / Platform Overview Questions
  if (/\b(what\s*(is|actually\s*is|does)\s*procollege|about\s*procollege|who\s*are\s*you|tell\s*me\s*about|platform|features)\b/i.test(q)) {
    return `ProCollege is a cloud-native campus SaaS ecosystem designed for schools (Nursery to Class 12) and universities (Bachelor's programs).

It unifies daily campus operations into four core modules:
• **ProCollege Teams:** Real-time chat, student discussions, and departmental channels.
• **ProCollege Meet:** Built-in HD virtual lectures with calendar synchronization.
• **ProCollege LMS:** Assignment pipelines, automated grading, and our 75% attendance gatekeeper.
• **ProCollege Cloud:** Centralized repository for syllabi, study materials, and institutional records.

Powered by edge SQLite (Turso) and Cloudflare Workers, ProCollege provides instant sub-second performance with zero complex IT overhead. What specific area of campus management would you like to explore?`;
  }

  // 6. Technology & Architecture
  if (/\b(tech\s*stack|architecture|database|turso|cloudflare|ably|cloudinary|speed|edge|security)\b/i.test(q)) {
    return `ProCollege is built on a high-performance, zero-budget edge architecture:

• **Edge Database:** Distributed SQLite via Turso for single-digit millisecond latency worldwide.
• **Compute & CDN:** Cloudflare Workers & Pages for serverless scalability.
• **Real-Time Layer:** Ably WebSockets for instantaneous messaging and lecture handshakes.
• **Media & Vaults:** Cloudinary for media assets with Cloudflare D1 backup vaults.

This guarantees sub-second responsiveness, bank-grade tenant isolation, and zero server maintenance. Would you like to dive deeper into our multi-tenant data architecture?`;
  }

  // 7. General Fallback
  return `ProCollege is a unified campus management SaaS designed for schools (Nursery-12) and universities. We streamline virtual lectures (Meet), collaboration (Teams), assignments (LMS), and cloud documents with an automated 75% attendance gatekeeper.

Feel free to ask about our pricing tiers, LMS workflows, or edge architecture!`;
}

// Clean and extract fluent conversational summary for spoken audio
function cleanPhonetics(str: string): string {
  return str
    .replace(/\bLMS\b/g, 'L M S')
    .replace(/\bAI\b/g, 'A I')
    .replace(/\bSaaS\b/g, 'sass')
    .replace(/(\d+)%/g, '$1 percent')
    .replace(/\bNursery-12\b/g, 'Nursery to 12')
    .replace(/\bN-12\b/g, 'Nursery to 12')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSpokenSummary(text: string): string {
  // 1. Remove markdown formatting, hashes, brackets, bullets, headers
  let cleaned = text
    .replace(/^#+\s.*$/gm, '')
    .replace(/[*#_`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/^\s*[•\-\*\d\.]+\s+/gm, '')
    .trim();

  // If text is short (< 160 chars), speak as is
  if (cleaned.length <= 160) {
    return cleanPhonetics(cleaned);
  }

  // Otherwise, split by real sentence boundaries (. ! ?)
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  let summary = '';
  for (const s of sentences) {
    const candidate = s.trim();
    if (!candidate || /^\d+\.?$/.test(candidate)) continue;
    if ((summary + ' ' + candidate).trim().length <= 180) {
      summary = (summary + ' ' + candidate).trim();
    } else {
      break;
    }
  }

  if (!summary) {
    summary = sentences[0] || cleaned.slice(0, 140);
  }

  return cleanPhonetics(summary.replace(/\s+\d+\.?$/, ''));
}

// Strictly find and lock a consistent natural MALE voice
function getConsistentMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Prioritize premier natural male neural voices
  const maleKeywords = [
    'christopher online (natural)',
    'guy online (natural)',
    'eric online (natural)',
    'roger online (natural)',
    'google us english male',
    'google us english',
    'david desktop',
    'david',
    'george',
    'daniel',
    'arthur',
    'ryan',
    'aaron'
  ];

  for (const kw of maleKeywords) {
    const match = voices.find(v => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  // 2. Fallback: Any English voice with "Male" in name
  const femaleKeywords = ['female', 'zira', 'jenny', 'aria', 'hazel', 'susan', 'catherine', 'samantha', 'victoria', 'karen', 'helena', 'linda'];
  const maleVoice = voices.find(v => {
    const n = v.name.toLowerCase();
    const isMale = n.includes('male') || n.includes('guy') || n.includes('david') || n.includes('george');
    const isNotFemale = !femaleKeywords.some(f => n.includes(f));
    return v.lang.startsWith('en') && isMale && isNotFemale;
  });
  if (maleVoice) return maleVoice;

  // 3. Fallback: English voice not explicitly female
  const neutralVoice = voices.find(v => {
    const n = v.name.toLowerCase();
    return v.lang.startsWith('en') && !femaleKeywords.some(f => n.includes(f));
  });
  if (neutralVoice) return neutralVoice;

  return voices[0] || null;
}

export const ProCollegeAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSpokenGreeting = useRef<boolean>(false);
  const lockedMaleVoice = useRef<SpeechSynthesisVoice | null>(null);

  // Initialize and lock male voice consistently
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const setupVoice = () => {
      const v = getConsistentMaleVoice();
      if (v) {
        lockedMaleVoice.current = v;
      }
    };

    setupVoice();
    window.speechSynthesis.onvoiceschanged = setupVoice;
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speak = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();

      // Extract spoken summary for natural, fluent delivery
      const spokenText = extractSpokenSummary(text);
      if (!spokenText) return;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 1.0; // 100% natural conversational human tempo
      utterance.pitch = 1.0; // 100% native natural pitch (no synthetic distortion)

      if (!lockedMaleVoice.current) {
        lockedMaleVoice.current = getConsistentMaleVoice();
      }

      if (lockedMaleVoice.current) {
        utterance.voice = lockedMaleVoice.current;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech error gracefully
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Automatic Voice Greeting when opened for the first time
  useEffect(() => {
    if (isOpen && !hasSpokenGreeting.current) {
      hasSpokenGreeting.current = true;
      const timer = setTimeout(() => {
        speak(INITIAL_MESSAGES[0].text);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll down when there are user interactions/subsequent messages
  useEffect(() => {
    if (isOpen) {
      if (messages.length > 1) {
        scrollToBottom();
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const userQuery = (textToSend || inputValue).trim();
    if (!userQuery || isLoading) return;

    stopSpeaking();

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
      let replyText = '';

      // 1. First attempt: Dedicated Backend Worker with Model Cascade
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
          if (backendData.reply && backendData.reply.trim().length > 0) {
            replyText = backendData.reply.trim();
          }
        }
      } catch {
        // Fallback to client-side direct cascade
      }

      // 2. Second attempt: Client-side Gemini Multi-Model Cascade
      if (!replyText && GEMINI_API_KEY) {
        const modelsToTry = [
          'gemini-3-flash-preview',
          'gemini-flash-lite-latest',
          'gemini-flash-latest',
          'gemini-2.5-flash'
        ];

        const contents = newHistory.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        for (const model of modelsToTry) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
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

            if (res.ok) {
              const data = await res.json();
              const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate && candidate.trim().length > 0) {
                replyText = candidate.trim();
                break;
              }
            }
          } catch {
            // Continue to next model
          }
        }
      }

      // 3. Third attempt: Zero-Latency Intelligent Offline Knowledge Engine
      if (!replyText) {
        replyText = getOfflineProCollegeReply(userQuery);
      }

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'model',
        text: replyText
      };

      setMessages(prev => [...prev, aiMsg]);
      speak(replyText);
    } catch (err) {
      console.error('Echo Assistant Error:', err);
      const fallbackReply = getOfflineProCollegeReply(userQuery);
      const errorMsg: ChatMessage = {
        id: `msg_fallback_${Date.now()}`,
        role: 'model',
        text: fallbackReply
      };
      setMessages(prev => [...prev, errorMsg]);
      speak(fallbackReply);
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
    stopSpeaking();
    setMessages(INITIAL_MESSAGES);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    speak(INITIAL_MESSAGES[0].text);
  };

  return (
    <>
      {/* Floating Launcher Button on Website (When Closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in select-none">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-950/85 hover:bg-slate-900/95 backdrop-blur-2xl border border-white/25 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 cursor-pointer"
          >
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 group-hover:opacity-60 blur-md transition duration-500" />
            <div className="relative flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#141E2B] border border-white/30 flex items-center justify-center p-1.5 shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                <ProCollegeLogo size="sm" variant="mark-only" />
              </div>
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

      {/* Same-to-Same Frosted Glass Chat Window (Crisp Opaque Header, No Bleed, Full Visibility) */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[9999] w-[92vw] sm:w-[395px] h-[520px] max-h-[calc(100vh-4.5rem)] flex flex-col rounded-[28px] overflow-hidden backdrop-blur-2xl bg-[#090D16]/95 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.25)] select-none animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle Frosted Aurora Highlights Behind Messages */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -left-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Opaque Header: Solid Background So No Messages Bleed Behind It */}
          <div className="relative z-30 px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#0B1120] shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#141E2B] border border-white/20 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                <ProCollegeLogo size="sm" variant="mark-only" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-white tracking-tight leading-none">
                  ProCollege AI
                </h2>
                <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  Official AI Concierge
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Mute / Unmute Button */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isMuted ? 'text-zinc-500 hover:text-white bg-white/5' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                }`}
                title={isMuted ? 'Unmute voice' : 'Mute voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Reset Conversation */}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Prominent Labeled Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-rose-600/80 hover:border-rose-400/50 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-white/25 shadow-sm"
                title="Close chat window"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Body: Ample Top Padding So Initial Message Is 100% Fully Visible */}
          <div
            ref={scrollContainerRef}
            className="relative flex-1 overflow-y-auto px-4 pt-4 pb-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
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

              // AI (Echo) message bubble with official ProCollege logo badge
              return (
                <div key={msg.id} className="flex items-start gap-2.5 max-w-[90%] animate-fade-in">
                  <div className="w-7 h-7 rounded-full bg-[#141E2B] border border-white/25 flex items-center justify-center p-1 shrink-0 mt-0.5 shadow-xs overflow-hidden">
                    <ProCollegeLogo size="sm" variant="mark-only" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-md border border-white/40 text-slate-900 font-normal px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-sm text-[13px] leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Quick Starter Chips on initial greeting */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 flex flex-wrap gap-1.5 animate-fade-in pl-9">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] bg-white/15 hover:bg-white/25 text-white/90 border border-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* AI Loading Bubble with Logo Badge */}
            {isLoading && (
              <div className="flex items-start gap-2.5 max-w-[85%] animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-[#141E2B] border border-white/25 flex items-center justify-center p-1 shrink-0 mt-0.5 shadow-xs overflow-hidden">
                  <ProCollegeLogo size="sm" variant="mark-only" />
                </div>
                <div className="bg-white/75 backdrop-blur-md border border-white/40 px-4 py-3 rounded-2xl rounded-tl-xs shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Capsule / Pill Input Bar at Bottom */}
          <div className="relative px-4 pb-4 pt-1.5 shrink-0 bg-[#090D16]/90 border-t border-white/5">
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
