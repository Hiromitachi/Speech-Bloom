import { useRef, useState, useCallback, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type VoiceCommand = "pause" | "resume" | "next" | "repeat" | "stop";

interface UseVoiceCoachOptions {
  /** Called when silence is detected after speech. */
  onSilence?: () => void;
  /** Called when a recognized voice command is detected. */
  onCommand?: (cmd: VoiceCommand) => void;
  /** Called when any speech is first detected. */
  onSpeechStart?: () => void;
}

interface VoiceCoachReturn {
  // State
  isListening: boolean;
  isSpeaking: boolean;
  isHearingUser: boolean;
  transcript: string;
  isSupported: boolean;

  // Controls
  startListening: (silenceTimeoutMs?: number) => void;
  stopListening: () => void;
  say: (text: string, onEnd?: () => void) => void;
  shutUp: () => void;
}

// ─── Voice command keywords ─────────────────────────────────────────────────

const COMMAND_MAP: Record<string, VoiceCommand> = {
  pause: "pause",
  stop: "stop",
  halt: "stop",
  resume: "resume",
  continue: "resume",
  "go on": "resume",
  next: "next",
  skip: "next",
  "move on": "next",
  repeat: "repeat",
  again: "repeat",
  redo: "repeat",
};

function detectCommand(transcript: string): VoiceCommand | null {
  const lower = transcript.toLowerCase().trim();
  // Check exact matches first, then substring
  for (const [keyword, cmd] of Object.entries(COMMAND_MAP)) {
    if (lower === keyword || lower.endsWith(keyword)) return cmd;
  }
  return null;
}

// ─── Pick a natural-sounding voice ──────────────────────────────────────────

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer these warm / natural English voices
  const preferred = [
    "Google UK English Female",
    "Google US English",
    "Microsoft Zira",
    "Samantha",         // macOS
    "Karen",            // macOS AU
    "Daniel",           // macOS UK
    "Google UK English Male",
  ];

  for (const name of preferred) {
    const v = voices.find(
      (voice) => voice.name.includes(name) && voice.lang.startsWith("en"),
    );
    if (v) return v;
  }

  // Fallback: any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVoiceCoach(options: UseVoiceCoachOptions = {}): VoiceCoachReturn {
  const { onSilence, onCommand, onSpeechStart } = options;

  // Stable refs for callbacks so they don't cause re-subscriptions
  const onSilenceRef = useRef(onSilence);
  const onCommandRef = useRef(onCommand);
  const onSpeechStartRef = useRef(onSpeechStart);
  useEffect(() => { onSilenceRef.current = onSilence; }, [onSilence]);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onSpeechStartRef.current = onSpeechStart; }, [onSpeechStart]);

  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHearingUser, setIsHearingUser] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimeoutMsRef = useRef(2500);
  const isListeningRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const speechQueueRef = useRef<Array<{ text: string; onEnd?: () => void }>>([]);
  const isSpeakingRef = useRef(false);

  // Feature detection
  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const isSupported = !!SpeechRecognitionCtor && "speechSynthesis" in (typeof window !== "undefined" ? window : {});

  // ─── Initialize voice ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSupported) return;

    // Voices may load asynchronously
    const loadVoice = () => { voiceRef.current = pickVoice(); };
    loadVoice();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
    };
  }, [isSupported]);

  // ─── Silence timer management ─────────────────────────────────────────────

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        setIsHearingUser(false);
        onSilenceRef.current?.();
      }
    }, silenceTimeoutMsRef.current);
  }, [clearSilenceTimer]);

  // ─── Speech Recognition ───────────────────────────────────────────────────

  const createRecognition = useCallback(() => {
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      setIsHearingUser(true);
      onSpeechStartRef.current?.();
      resetSilenceTimer();

      // Get latest transcript
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const latestText = finalTranscript || interimTranscript;
      setTranscript(latestText);

      // Check for voice commands in final transcript
      if (finalTranscript) {
        const cmd = detectCommand(finalTranscript);
        if (cmd) {
          onCommandRef.current?.(cmd);
        }
      }
    };

    recognition.onspeechend = () => {
      setIsHearingUser(false);
      resetSilenceTimer();
    };

    recognition.onerror = (event: any) => {
      // "no-speech" is normal — user just isn't talking yet
      if (event.error === "no-speech") return;
      // "aborted" happens when we intentionally stop
      if (event.error === "aborted") return;
      console.warn("[VoiceCoach] Recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      // Auto-restart if we should still be listening
      if (shouldRestartRef.current) {
        try {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch {
          // Browser may block rapid restarts
        }
      }
    };

    return recognition;
  }, [SpeechRecognitionCtor, resetSilenceTimer]);

  const startListening = useCallback(
    (silenceTimeoutMs = 2500) => {
      if (!SpeechRecognitionCtor) return;

      silenceTimeoutMsRef.current = silenceTimeoutMs;
      shouldRestartRef.current = true;

      // If already listening, just reset the silence timer with the new timeout and return
      if (isListeningRef.current && recognitionRef.current) {
        resetSilenceTimer();
        return;
      }

      // Stop existing recognition if any
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = createRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;

      try {
        recognition.start();
        // Start initial silence timer
        resetSilenceTimer();
      } catch (e) {
        console.warn("[VoiceCoach] Could not start recognition:", e);
      }
    },
    [SpeechRecognitionCtor, createRecognition, resetSilenceTimer],
  );

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    clearSilenceTimer();
    setIsHearingUser(false);
    setTranscript("");

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
  }, [clearSilenceTimer]);

  // ─── Speech Synthesis (Speaking) ──────────────────────────────────────────

  const processQueue = useCallback(() => {
    if (isSpeakingRef.current) return;
    const next = speechQueueRef.current.shift();
    if (!next) return;

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(next.text);
      utt.rate = 0.92;
      utt.pitch = 1.05;
      utt.volume = 1.0;
      if (voiceRef.current) utt.voice = voiceRef.current;

      utt.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        next.onEnd?.();
        // Process next in queue
        processQueue();
      };
      utt.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        next.onEnd?.();
        processQueue();
      };

      window.speechSynthesis.speak(utt);
    } catch {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      next.onEnd?.();
    }
  }, []);

  const say = useCallback(
    (text: string, onEnd?: () => void) => {
      speechQueueRef.current.push({ text, onEnd });
      processQueue();
    },
    [processQueue],
  );

  const shutUp = useCallback(() => {
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    try { window.speechSynthesis.cancel(); } catch {}
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      clearSilenceTimer();
      try { recognitionRef.current?.stop(); } catch {}
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, [clearSilenceTimer]);

  return {
    isListening,
    isSpeaking,
    isHearingUser,
    transcript,
    isSupported,
    startListening,
    stopListening,
    say,
    shutUp,
  };
}
