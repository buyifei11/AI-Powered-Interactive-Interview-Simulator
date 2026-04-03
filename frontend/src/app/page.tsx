"use client";

import { useState, useRef } from "react";

export default function InterviewSimulator() {
  const [session, setSession] = useState<{ id: string; currentQuestion: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string; audioUrl?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const BACKEND_URL = "http://localhost:8000";

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_role: "software engineering" }),
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

  const recordingStartTime = useRef<number>(0);

  const startRecording = async () => {
    if (isRecording) {
      // Toggle off: stop recording
      stopRecording();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - recordingStartTime.current;
        if (duration < 500 || audioChunksRef.current.length === 0) {
          // Too short — ignore
          console.warn("Recording too short, ignoring.");
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioSubmit(audioBlob);
      };

      // timeslice=100ms so chunks are generated every 100ms while recording
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    if (!session) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("current_question", session.currentQuestion);
    formData.append("session_id", session.id);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "user", text: data.user_transcript },
        { role: "ai", text: data.ai_response, audioUrl: `${BACKEND_URL}${data.audio_url}` },
      ]);
      setSession((prev) => prev ? { ...prev, currentQuestion: data.ai_response } : null);

      if (data.audio_url) {
        const audio = new Audio(`${BACKEND_URL}${data.audio_url}`);
        audio.play();
      }
    } catch (error) {
      console.error(error);
      alert("Error sending audio to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="py-6 border-b border-slate-800 text-center shadow-md bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          AI Interview Simulator
        </h1>
        <p className="text-slate-400 mt-2 text-sm tracking-wide">Practice verbally with real-time AI feedback</p>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col">
        {!session ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-lg text-center">
              <h2 className="text-2xl font-semibold mb-4 text-white">Ready for your interview?</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                You will be connected to an AI interviewer. Please ensure your microphone is enabled.
                Hold the microphone button to speak, and release it to submit your answer.
              </p>
              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 rounded-xl text-lg font-bold text-white transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  "Start Interview"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-800/50 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden relative">
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
            </div>

            {/* Bottom Control Bar */}
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
                {isRecording ? "Recording... Click to stop & send" : "Click to start speaking"}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
