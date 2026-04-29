"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const JOB_ROLES = [
  "software engineering",
  "machine learning",
  "data science",
  "data analyst",
];

export default function InterviewSimulator() {
  const [jobRole, setJobRole] = useState(JOB_ROLES[0]);
  const [isRoleSelected, setIsRoleSelected] = useState(false);

  const [session, setSession] = useState<{ id: string; currentQuestion: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string; audioUrl?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // session is "active" if role selected + not completed
  const interviewActive = isRoleSelected && !completed;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const globalStreamRef = useRef<MediaStream | null>(null);
  const isEndingRef = useRef(false);
  const endingSessionRef = useRef<string | null>(null);

  const BACKEND_URL = "http://localhost:8000";

  const router = useRouter();

  const stopLocalMedia = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  
    const stream = globalStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      globalStreamRef.current = null;
    }
  
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);
  
  const endInterviewRemote = useCallback(
    (sessionId?: string | null) => {
      if (!sessionId) return;
  
      const payload = JSON.stringify({ session_id: sessionId });
      const url = `${BACKEND_URL}/api/end`;
  
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    },
    []
  );

  const requestNavigation = useCallback(
    (path: string) => {
      if (!interviewActive) {
        router.push(path);
        return;
      }
      setPendingPath(path);
      setConfirmOpen(true);
    },
    [interviewActive, router]
  );
  
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.close();
    audioUnlockedRef.current = true;
  };

  const startInterview = async () => {
    unlockAudio();
    setLoading(true);
    
    // Request permissions upfront
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      globalStreamRef.current = stream;
    } catch (err) {
      console.error(err);
      alert("Camera or Microphone access denied. This simulator requires both.");
      setLoading(false);
      return; // Do not proceed
    }

    setIsRoleSelected(true); // move past selection screen
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_role: jobRole }),
      });
      const data = await res.json();
      setSession({ id: data.session_id, currentQuestion: data.question });
      setMessages([{ role: "ai", text: data.question }]);
    } catch (error) {
      console.error(error);
      alert("Failed to start. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRoleSelected && globalStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = globalStreamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isRoleSelected]);

  useEffect(() => {
    return () => {
      stopLocalMedia(); // unmount only
    };
  }, [stopLocalMedia]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!interviewActive) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [interviewActive]);

  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      if (!interviewActive) return;
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!href.startsWith("/")) return;
      if (href === window.location.pathname) return;

      e.preventDefault();
      requestNavigation(href);
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [interviewActive, requestNavigation]);

  const recordingStartTime = useRef<number>(0);

  const startRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    
    const stream = globalStreamRef.current;
    if (!stream) {
      alert("Camera stream not available.");
      return;
    }

    try {
      // Record audio only for the blob, capturing video individually
      // Safari/iOS have quirks with MediaRecorder processing both, so we track Audio chunks.
      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if(isEndingRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const duration = Date.now() - recordingStartTime.current;
        if (duration < 500 || audioChunksRef.current.length === 0) {
          console.warn("Recording too short, ignoring.");
          return;
        }
        
        let base64Image = "";
        // Capture a frame from the video
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Get base64 without prefix
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            base64Image = dataUrl.split(",")[1];
          }
        }
        
        // Stop all tracks completely, thus turning off camera light
        // We removed stream.getTracks().forEach(t => t.stop()); so the camera stays on!

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioSubmit(audioBlob, base64Image);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Camera or Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob, base64Image: string) => {
    if (!session) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("current_question", session.currentQuestion);
    formData.append("session_id", session.id);
    if (base64Image) {
      formData.append("video_frame", base64Image);
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "user", text: data.user_transcript },
        { role: "ai", text: data.ai_response, audioUrl: data.audio_url ? `${BACKEND_URL}${data.audio_url}` : undefined },
      ]);
      setSession((prev) => prev ? { ...prev, currentQuestion: data.ai_response } : null);

      if (data.completed) {
        setCompleted(true);
        stopLocalMedia(); // backend already ended it in /api/chat
      }

      if (data.audio_url) {
        const audio = new Audio(`${BACKEND_URL}${data.audio_url}`);
        audio.play().catch(() => {});
      }
    } catch (error) {
      console.error(error);
      alert("Error sending audio/video to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEndInterview = () => {
    isEndingRef.current = true;
    endingSessionRef.current = session?.id ?? null;

    stopLocalMedia();
    endInterviewRemote(endingSessionRef.current);

    const destination = pendingPath ?? "/dashboard";
    setPendingPath(null);
    setConfirmOpen(false);
    setCompleted(true);
    router.push(destination);
  };

  const handleCancelEndInterview = () => {
    setPendingPath(null);
    setConfirmOpen(false);
  };

  // Pre-interview screen
  if (!isRoleSelected) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-4">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-lg text-center w-full">
            <h2 className="text-3xl font-semibold mb-2 text-white">Customize Interview</h2>
            <p className="text-slate-400 mb-8">Select the domain you want to practice for.</p>
            
            <div className="space-y-4 mb-8 text-left">
              <label className="block text-sm font-medium text-slate-300 ml-1">Job Role</label>
              <select 
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
              >
                {JOB_ROLES.map(role => (
                   <option key={role} value={role}>{role.replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full relative overflow-hidden py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 rounded-xl text-lg font-bold text-white transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="py-4 border-b border-slate-800 text-center shadow-md bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          {jobRole.replace(/\b\w/g, l => l.toUpperCase())} Interview
        </h1>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Chat feed */}
        <div className="flex-1 flex flex-col bg-slate-800/50 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden relative min-h-[500px]">
             
          <div className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth">
            {messages.map((msg, idx) => (
               <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
               <div className="flex gap-4 max-w-[85%]">
                 {msg.role === "ai" && (
                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                     <span className="text-xs font-bold text-white">AI</span>
                   </div>
                 )}
                 <div
                   className={`rounded-3xl px-6 py-4 shadow-md ${
                     msg.role === "user"
                       ? "bg-blue-600 text-white rounded-tr-none"
                       : "bg-slate-700 text-slate-100 rounded-tl-none border border-slate-600"
                   }`}
                 >
                   <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                   {msg.role === "ai" && msg.audioUrl && (
                     <audio controls src={msg.audioUrl} className="mt-4 w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
                   )}
                 </div>
               </div>
             </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 opacity-70">
                      <span className="text-xs font-bold text-white">AI</span>
                    </div>
                    <div className="bg-slate-700 text-slate-400 rounded-3xl rounded-tl-none px-6 py-4 flex items-center gap-2 border border-slate-600">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
            )}

            {completed && (
              <div className="mt-8 text-center bg-teal-900/40 border border-teal-500/50 p-6 rounded-2xl mx-auto max-w-md animate-in fade-in zoom-in">
                 <h3 className="text-2xl font-bold text-teal-400 mb-2">Interview Completed</h3>
                 <p className="text-slate-300">Thank you for your time. Your final feedback is above.</p>
              </div>
            )}
          </div>
          
          {/* Bottom Control Bar */}
          {!completed && (
            <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col items-center justify-center gap-4 relative z-10">
              <button
                onClick={startRecording}
                disabled={loading}
                className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                  isRecording
                  ? "bg-rose-500 scale-110 shadow-[0_0_40px_rgba(244,63,94,0.6)]"
                  : "bg-teal-500 hover:bg-teal-400 hover:scale-105 shadow-lg shadow-teal-500/20"
                } disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-teal-500`}
              >
                {isRecording && (
                  <>
                    <span className="absolute w-full h-full rounded-full bg-rose-400 animate-ping opacity-75" />
                    <span className="absolute inset-0 rounded-full bg-rose-500 blur-md opacity-50 animate-pulse" />
                  </>
                )}
                <svg className="w-8 h-8 text-white z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isRecording ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="currentColor"/>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>
              <div className="text-xs text-slate-400 font-medium">
                {isRecording ? "Recording... Click to stop & evaluate" : "Click to start recording answer"}
              </div>

              <button
                onClick={() => {
                  requestNavigation("/dashboard");
                }}
                disabled={loading || isRecording}
                className="mt-1 px-4 py-2 rounded-lg border border-rose-500/50 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
              >
                End Interview
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Camera / Additional Info */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
           <div className="bg-slate-800 rounded-3xl p-4 shadow-xl border border-slate-700">
             <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Your Camera</h3>
             <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center">
               <video 
                 ref={videoRef} 
                 className="absolute inset-0 w-full h-full object-cover opacity-100" 
                 muted 
                 playsInline 
               />
               <canvas ref={canvasRef} className="hidden" />
               {isRecording && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
               )}
             </div>
             <p className="mt-3 text-xs text-slate-400 leading-relaxed">
               When you answer, the AI analyzes your facial expressions and tone to provide soft-skills feedback.
             </p>
           </div>
        </div>

      </main>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">End interview?</h3>
            <p className="mt-2 text-sm text-slate-300">
              {pendingPath
                ? "Your interview is still active. Leave this page and end the session?"
                : "Your current interview session will end immediately."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelEndInterview}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndInterview}
                className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-300 hover:bg-rose-500/10"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
