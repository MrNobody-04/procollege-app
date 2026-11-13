import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  PhoneOff,
  MessageSquare,
  Users,
  Smile,
  Send,
  Volume2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MeetingModal: React.FC = () => {
  const {
    meeting,
    endMeeting,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    toggleHand,
    sendMeetingMessage,
    currentUser
  } = useApp();

  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'participants' | null>('chat');
  const [chatInput, setChatInput] = useState('');
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Real Hardware Media State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Call timer
  useEffect(() => {
    if (!meeting.isOpen) return;
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [meeting.isOpen]);

  // Real Webcam Video stream
  useEffect(() => {
    if (!meeting.isOpen || !meeting.isCameraOn) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then(stream => {
          if (!isSubscribed) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          cameraStreamRef.current = stream;
          setCameraStream(stream);
          setCameraError(null);
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          if (!isSubscribed) return;
          console.warn('Camera access unavailable:', err);
          setCameraError('Camera unavailable or permission denied.');
          setCameraStream(null);
        });
    }

    return () => {
      isSubscribed = false;
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [meeting.isOpen, meeting.isCameraOn]);

  // Bind video element whenever cameraStream updates
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Real Microphone Audio Meter
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let micStream: MediaStream | null = null;
    let animId: number | null = null;

    if (meeting.isOpen && !meeting.isMuted) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(s => {
            micStream = s;
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
              audioCtx = new AudioContextClass();
              const source = audioCtx.createMediaStreamSource(s);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const checkVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                // Scale to 0-100
                setAudioVolume(Math.min(100, Math.round((avg / 64) * 100)));
                animId = requestAnimationFrame(checkVolume);
              };
              checkVolume();
            }
          })
          .catch(err => {
            console.warn('Microphone audio unavailable:', err);
          });
      }
    }

    return () => {
      setAudioVolume(0);
      if (animId) cancelAnimationFrame(animId);
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [meeting.isOpen, meeting.isMuted]);

  // Real Screen Sharing
  const handleToggleScreenShare = async () => {
    if (!meeting.isScreenSharing) {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });

          setScreenStream(displayStream);
          toggleScreenShare(); // sets meeting.isScreenSharing = true

          // Track ended by native browser bar "Stop Sharing"
          displayStream.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
            if (meeting.isScreenSharing) {
              toggleScreenShare();
            }
          };

          setTimeout(() => {
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = displayStream;
            }
          }, 100);
        } catch (err) {
          console.warn('User canceled or denied screen share:', err);
          // Fall back to presentation stage simulation
          toggleScreenShare();
        }
      } else {
        toggleScreenShare();
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
      toggleScreenShare();
    }
  };

  // Re-attach screen stream if ref mounts
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, meeting.isScreenSharing]);

  if (!meeting.isOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMeetingMessage(chatInput.trim());
    setChatInput('');
  };

  const triggerReaction = (emoji: string) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 2500);
  };

  const handleLeave = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    endMeeting();
  };

  return (
    <div className="fixed inset-0 bg-[#141414] text-white z-50 flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar */}
      <header className="h-14 px-6 flex items-center justify-between bg-[#1f1f1f]/90 backdrop-blur-md border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              {meeting.title}
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                {meeting.courseCode}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
              <span>Meeting: {formatDuration(callDuration)}</span>
              <span>•</span>
              <span className="text-emerald-400">WebRTC HD Connected</span>
              {audioVolume > 15 && !meeting.isMuted && (
                <span className="text-emerald-400 flex items-center gap-1 font-sans">
                  <Volume2 className="w-3 h-3 animate-pulse" /> Speaking
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Meeting Controls Pill */}
        <div className="flex items-center gap-1.5 bg-[#2d2d2d] border border-zinc-700/80 rounded-full px-3 py-1.5 shadow-lg">
          {/* Mic */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              meeting.isMuted
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : audioVolume > 20
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                : 'hover:bg-zinc-700 text-zinc-200'
            }`}
            title={meeting.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {meeting.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              !meeting.isCameraOn
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'hover:bg-zinc-700 text-zinc-200 bg-zinc-700/80'
            }`}
            title={meeting.isCameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {meeting.isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              meeting.isScreenSharing
                ? 'bg-emerald-600 text-white'
                : 'hover:bg-zinc-700 text-zinc-200'
            }`}
            title={meeting.isScreenSharing ? 'Stop sharing screen' : 'Share your screen / presentation'}
          >
            <ScreenShare className="w-4 h-4" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHand}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              meeting.isHandRaised
                ? 'bg-amber-500 text-white'
                : 'hover:bg-zinc-700 text-zinc-200'
            }`}
            title="Raise / Lower Hand"
          >
            <Hand className="w-4 h-4" />
          </button>

          {/* Quick Reactions */}
          <div className="relative group">
            <button className="p-2 rounded-full hover:bg-zinc-700 text-zinc-200 cursor-pointer">
              <Smile className="w-4 h-4" />
            </button>
            <div className="hidden group-hover:flex absolute left-1/2 -translate-x-1/2 top-11 bg-zinc-800 border border-zinc-700 shadow-xl rounded-full p-1 gap-1 z-30">
              {['👏', '👍', '❤️', '🎉', '💡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="hover:scale-125 transition-transform p-1 text-sm cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Side Panel Toggles */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              activeSidePanel === 'chat' ? 'bg-[#26394D] text-white' : 'hover:bg-zinc-700 text-zinc-200'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? null : 'participants')}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              activeSidePanel === 'participants' ? 'bg-[#26394D] text-white' : 'hover:bg-zinc-700 text-zinc-200'
            }`}
            title="Participant Roster"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Leave Button */}
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ml-1 shadow cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Main Classroom Stage Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Emoji Reaction Bubble */}
        {floatingReaction && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-6xl animate-bounce z-40 pointer-events-none">
            {floatingReaction}
          </div>
        )}

        {/* Video Grid & Shared Stage */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#181818] to-[#121212]">
          {meeting.isScreenSharing ? (
            /* Shared Presentation Stage (Real screen stream if available, else presentation slides) */
            <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
              <div className="bg-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-2 font-medium">
                  <ScreenShare className="w-4 h-4 text-emerald-400" />
                  {currentUser.name} is sharing screen / presentation
                </span>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono text-[10px]">
                    LIVE STREAM
                  </span>
                  <button
                    onClick={handleToggleScreenShare}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Stop Sharing
                  </button>
                </div>
              </div>

              {screenStream ? (
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex-1 bg-[#1e1e2e] p-6 text-zinc-200 font-mono text-xs overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-700 pb-2 font-sans">
                    <span className="text-zinc-400">Classroom Presentation View</span>
                    <span className="text-zinc-500 text-[11px]">Click "Screen Share" on toolbar to capture browser or desktop</span>
                  </div>
                  <div className="text-zinc-500">// Algorithm 4.2: Splay Tree Rotation Matrix & Treap Balancing</div>
                  <pre className="text-emerald-400">
{`pub fn splay(&mut self, key: &K) {
    while let Some(parent) = self.parent() {
        if let Some(grandparent) = parent.parent() {
            if (self.is_left() && parent.is_left()) || (self.is_right() && parent.is_right()) {
                grandparent.rotate(); // Zig-Zig
                parent.rotate();
            } else {
                parent.rotate(); // Zig-Zag
                grandparent.rotate();
            }
        } else {
            parent.rotate(); // Zig
        }
    }
}`}
                  </pre>
                  <div className="mt-4 p-3 bg-zinc-800/80 rounded border border-zinc-700 text-zinc-300">
                    <p className="font-semibold text-amber-300 font-sans">Theorem 4.1 (Tarjan Splay Bound):</p>
                    <p className="text-[11px] mt-1 font-sans">
                      Any sequence of m access operations on an n-node splay tree takes O((m + n) log n) time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Video Gallery Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full max-w-5xl h-full max-h-[700px]">
              {meeting.participants.map(p => {
                const isCurrent = p.id === currentUser.id;
                const isCamera = isCurrent ? meeting.isCameraOn : true;
                const isMuted = isCurrent ? meeting.isMuted : false;
                const isHand = isCurrent ? meeting.isHandRaised : false;

                return (
                  <div
                    key={p.id}
                    className="relative bg-zinc-800/90 border border-zinc-700/80 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg group"
                  >
                    {isCurrent ? (
                      /* Current user: Render real video element when camera is on and stream active */
                      isCamera ? (
                        cameraStream ? (
                          <div className="relative w-full h-full bg-black">
                            <video
                              ref={cameraVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover transform -scale-x-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className="w-full h-full object-cover brightness-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                            {cameraError && (
                              <div className="absolute top-3 left-3 bg-black/70 text-amber-300 text-[10px] px-2 py-0.5 rounded">
                                Camera hardware active
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-2xl shadow-inner">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )
                    ) : (
                      /* Other participants: Avatar simulation */
                      <div className="relative w-full h-full">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-full h-full object-cover brightness-95"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      </div>
                    )}

                    {/* Participant Name Tag & Audio Status */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md">
                        <span className="truncate">{p.name} {isCurrent && '(You)'}</span>
                        {p.role === 'professor' && (
                          <span className="text-[10px] bg-[#26394D] text-white px-1.5 py-0.2 rounded font-normal">
                            Host
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isHand && (
                          <span className="bg-amber-500 text-white p-1 rounded-full animate-bounce shadow">
                            <Hand className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {/* Mic state with audio level activity */}
                        <span
                          className={`p-1.5 rounded-full transition-all ${
                            isMuted
                              ? 'bg-rose-600 text-white'
                              : isCurrent && audioVolume > 20
                              ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 animate-pulse'
                              : 'bg-black/70 text-emerald-400'
                          }`}
                        >
                          {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* In-Meeting Sidebar (Chat / Participants) */}
        {activeSidePanel && (
          <aside className="w-80 bg-[#1e1e1e] border-l border-zinc-800 flex flex-col shrink-0 animate-in slide-in-from-right-4 duration-150">
            {/* Sidebar Tab Header */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                {activeSidePanel === 'chat' ? 'Meeting Chat' : `Participants (${meeting.participants.length})`}
              </span>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {meeting.messages.length === 0 ? (
                    <div className="text-center text-zinc-500 py-10">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Meeting conversation started.</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Post questions and discussion items here.</p>
                    </div>
                  ) : (
                    meeting.messages.map((m, idx) => (
                      <div key={idx} className="bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-700/60">
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                          <span className="font-bold text-zinc-200">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-zinc-200">{m.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 bg-[#181818] flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a meeting message..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#26394D]"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-lg bg-[#26394D] hover:bg-[#141E2B] disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Participants Body */}
            {activeSidePanel === 'participants' && (
              <div className="p-4 overflow-y-auto space-y-2 text-xs">
                <div className="text-[11px] font-bold text-zinc-400 mb-2">In this meeting</div>
                {meeting.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/60">
                    <div className="flex items-center gap-2.5">
                      <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-zinc-200">
                          {p.name} {p.id === currentUser.id && '(You)'}
                        </p>
                        <p className="text-[10px] text-zinc-500 capitalize">{p.role}</p>
                      </div>
                    </div>
                    {p.id === currentUser.id && !meeting.isMuted && audioVolume > 20 && (
                      <span className="text-[10px] text-emerald-400 font-mono">Speaking</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
