"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Mic, MicOff, Sparkles, Send, Square } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { generateAvatarUrl } from "@/lib/avatar";

interface Props {
  meetingId: string;
  meetingName: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const AITutorTile = ({ meetingId, meetingName }: Props) => {
  const trpc = useTRPC();
  const [isListening, setIsListening] = useState(true);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiSpeech, setAiSpeech] = useState("Hi! I am your AI Tutor. Speak into your mic or ask me anything!");
  const [manualInput, setManualInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const isMountedRef = useRef(true);

  // tRPC mutation to send question to Groq/Gemini backend
  const { mutate: askTutor, isPending: isThinking } = useMutation(
    trpc.meetings.askInCallTutor.mutationOptions({
      onSuccess: (data) => {
        if (!isMountedRef.current) return;
        setStatus("speaking");
        setAiSpeech(data.reply);
        setHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
        speakAloud(data.reply);
      },
      onError: (err) => {
        if (!isMountedRef.current) return;
        setStatus("idle");
        console.error("AI tutor query failed:", err);
      },
    })
  );

  // Stop / cancel current TTS speech
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setStatus("idle");
  };

  // Speak AI answer aloud with browser SpeechSynthesis
  const speakAloud = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("idle");
      return;
    }

    // Temporarily pause recognition while AI speaks to avoid hearing itself
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`~]/g, ""); // strip markdown symbols
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("David") ||
            v.name.includes("Zira"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setStatus("speaking");
    };

    const handleSpeechEnd = () => {
      isSpeakingRef.current = false;
      if (isMountedRef.current) {
        setStatus("idle");
        // Resume listening after AI finishes speaking
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      }
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

    window.speechSynthesis.speak(utterance);
  };

  // Handle submitting query (either via voice final transcript or manual text)
  const handleQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isThinking || isSpeakingRef.current) return;

    setUserTranscript(trimmed);
    setStatus("thinking");
    setHistory((prev) => [...prev, { role: "user", content: trimmed }]);

    askTutor({
      meetingId,
      message: trimmed,
      history: history.slice(-4),
    });
  };

  // Setup browser SpeechRecognition
  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return; // ignore audio while AI is talking

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptText;
          } else {
            interim += transcriptText;
          }
        }

        if (interim) {
          setStatus("listening");
          setUserTranscript(interim);
        }

        if (final.trim()) {
          setUserTranscript(final.trim());
          handleQuery(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("Speech recognition warning:", event.error);
        }
        if (event.error === "not-allowed") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart listening if user enabled it and AI is not speaking
        if (isMountedRef.current && isListening && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;

      if (isListening) {
        try {
          recognition.start();
        } catch {}
      }
    } catch (e) {
      console.warn("Could not start SpeechRecognition:", e);
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync listening toggle
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setStatus("idle");
    } else {
      setIsListening(true);
      if (!isSpeakingRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  };

  const avatarUrl = generateAvatarUrl({
    seed: meetingName || "AI Tutor",
    variant: "botttsNeutral",
  });

  return (
    <div className="flex flex-col h-full bg-[#16191c] border border-white/10 rounded-2xl p-4 overflow-hidden relative shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {meetingName} (AI Tutor)
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "speaking"
                    ? "bg-blue-400 animate-pulse"
                    : status === "thinking"
                    ? "bg-amber-400 animate-spin"
                    : status === "listening"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-zinc-500"
                }`}
              />
              <span className="text-[11px] text-zinc-400 font-medium capitalize">
                {status === "speaking"
                  ? "Speaking aloud..."
                  : status === "thinking"
                  ? "Thinking (Groq)..."
                  : status === "listening"
                  ? "Listening to you..."
                  : "Ready to help"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {status === "speaking" && (
            <button
              onClick={stopSpeaking}
              title="Stop AI speaking"
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          )}

          <button
            onClick={toggleListening}
            title={isListening ? "Mute Voice Listening" : "Enable Voice Listening"}
            className={`p-2 rounded-lg border transition ${
              isListening
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Center Stage: Animated Avatar & Voice Wave */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
        <div className="relative">
          {/* Animated Glow Rings when Speaking or Listening */}
          {status === "speaking" && (
            <>
              <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping duration-1000" />
              <div className="absolute -inset-2 rounded-full bg-blue-500/30 animate-pulse" />
            </>
          )}
          {status === "listening" && (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse duration-700" />
          )}

          {/* Avatar Tile */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-800 relative z-10 shadow-inner">
            <Image
              src={avatarUrl}
              alt="AI Tutor"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Dynamic Voice Waves indicator */}
        <div className="flex items-center gap-1 mt-4 h-6">
          {[1, 2, 3, 4, 5].map((bar) => (
            <span
              key={bar}
              className={`w-1 rounded-full transition-all duration-200 ${
                status === "speaking"
                  ? "bg-blue-400 animate-pulse"
                  : status === "listening"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-zinc-700 h-1.5"
              }`}
              style={{
                height:
                  status === "speaking"
                    ? `${Math.sin(bar * 1.5) * 12 + 14}px`
                    : status === "listening"
                    ? `${Math.cos(bar * 1.5) * 8 + 10}px`
                    : "6px",
              }}
            />
          ))}
        </div>

        {/* Live Subtitle Bubble */}
        <div className="w-full max-w-md mt-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-center">
          <p className="text-xs text-zinc-200 leading-relaxed font-normal line-clamp-3">
            {status === "thinking"
              ? "Thinking of the best explanation for you..."
              : aiSpeech}
          </p>
        </div>

        {/* User live speech transcript indicator */}
        {userTranscript && (
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1 max-w-sm text-center truncate">
            <span className="text-emerald-400 font-medium">You:</span>
            <span className="italic truncate">{userTranscript}</span>
          </div>
        )}
      </div>

      {/* Bottom Quick-Type Input (in case user mic is muted) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualInput.trim()) {
            handleQuery(manualInput);
            setManualInput("");
          }
        }}
        className="flex items-center gap-2 pt-2 border-t border-white/10"
      >
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder={
            speechSupported
              ? "Speak into mic or type a question..."
              : "Type a question for your AI Tutor..."
          }
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition"
        />
        <button
          type="submit"
          disabled={!manualInput.trim() || isThinking}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
