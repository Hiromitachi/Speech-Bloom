import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

interface ListeningIndicatorProps {
  isListening: boolean;
  isHearing: boolean;
  isSpeaking: boolean;
}

export function ListeningIndicator({ isListening, isHearing, isSpeaking }: ListeningIndicatorProps) {
  // Determine state for visual
  const state = isSpeaking ? "speaking" : isHearing ? "hearing" : isListening ? "idle" : "off";

  const colors = {
    off: "bg-black/5 text-muted-foreground",
    idle: "bg-emerald-100 text-emerald-600",
    hearing: "bg-emerald-500 text-white",
    speaking: "bg-blue-100 text-blue-600",
  };

  const labels = {
    off: "Mic off",
    idle: "Listening",
    hearing: "Hearing you",
    speaking: "Speaking",
  };

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="relative">
        {/* Pulse rings when hearing */}
        <AnimatePresence>
          {state === "hearing" && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
              <motion.div
                key="ring2"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut", delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
            </>
          )}

          {/* Subtle pulse when idle listening */}
          {state === "idle" && (
            <motion.div
              key="idle-pulse"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-emerald-300"
            />
          )}

          {/* Pulse when coach is speaking */}
          {state === "speaking" && (
            <motion.div
              key="speak-pulse"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-blue-300"
            />
          )}
        </AnimatePresence>

        {/* Icon button */}
        <div
          className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300 ${colors[state]}`}
          aria-label={labels[state]}
          role="status"
        >
          {state === "off" ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Waveform bars when hearing user */}
      <AnimatePresence>
        {state === "hearing" && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-0.5 overflow-hidden"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-emerald-500"
                animate={{ height: ["6px", `${12 + i * 3}px`, "6px"] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5 + i * 0.1,
                  ease: "easeInOut",
                  delay: i * 0.08,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Speaker icon bars when coach is speaking */}
        {state === "speaking" && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-0.5 overflow-hidden"
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-blue-400"
                animate={{ height: ["4px", `${10 + i * 2}px`, "4px"] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.7 + i * 0.12,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
