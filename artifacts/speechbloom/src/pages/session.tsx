import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useUpdateSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = { label: string; color: string; bg: string; duration: number; hint: string };

type ExDef = {
  id: number;
  name: string;
  subtitle?: string;
  instruction: string;
  icon: string;
  type: "phase-once" | "rep-counter" | "countdown" | "multi-round" | "phase-rep" | "flashcard";
  phases?: Phase[];
  reps?: number;
  rounds?: number;
  duration?: number;
  items?: string[];
  itemReps?: number;
  useRoundLabel?: boolean;
  isRhythm?: boolean;
};

// ─── Phase color palette ─────────────────────────────────────────────────────

const P = {
  inhale:  { color: "#2A6FB5", bg: "#D6ECFF", label: "INHALE"  },
  hold:    { color: "#9B6F00", bg: "#FFF3C4", label: "HOLD"    },
  exhale:  { color: "#1E7A4A", bg: "#D4F5E4", label: "EXHALE"  },
  speak:   { color: "#C04B1B", bg: "#FFDFC9", label: "SPEAK"   },
  phonate: { color: "#7B3DAC", bg: "#EEE0FF", label: "PHONATE" },
};

// ─── Exercise list ───────────────────────────────────────────────────────────

const EXERCISES: ExDef[] = [
  // ── 1. Abdominal Breathing — 3 rounds × (10 inhale · 15 hold · 10 exhale) ──
  {
    id: 1, name: "Abdominal Breathing", subtitle: "3 rounds · 10·15·10", icon: "🌬️",
    instruction: "Place one hand on your chest and one on your abdomen.\nBreathe using your abdomen, not your chest.",
    type: "phase-rep", reps: 3, useRoundLabel: true,
    phases: [
      { ...P.inhale, label: "INHALE", duration: 10, hint: "Breathe in slowly through your nose" },
      { ...P.hold,   label: "HOLD",   duration: 15, hint: "Hold gently — abdomen expanded" },
      { ...P.exhale, label: "EXHALE", duration: 10, hint: "Breathe out slowly through pursed lips" },
    ],
  },
  // ── 2–7. Rep-counter exercises ────────────────────────────────────────────
  { id: 2,  name: "Effortful Swallow",    icon: "💧", instruction: "Swallow hard, as if swallowing a large bite.\nFeel the muscles in your throat work.",              type: "rep-counter", reps: 6 },
  { id: 3,  name: "Masako Maneuver",      icon: "👅", instruction: "Hold your tongue gently between your teeth.\nSwallow while keeping your tongue forward.",          type: "rep-counter", reps: 6 },
  { id: 4,  name: "Tongue Side to Side",  icon: "↔️", instruction: "Move your tongue slowly from corner to corner.\nTouch the inside of each cheek.",                  type: "rep-counter", reps: 6 },
  { id: 5,  name: "Tongue Up and Down",   icon: "↕️", instruction: "Stretch your tongue up toward your nose,\nthen down toward your chin.",                          type: "rep-counter", reps: 6 },
  { id: 6,  name: "Tongue Round Movement",icon: "🔄", instruction: "Move your tongue in a full circle\naround the outside of your lips.",                            type: "rep-counter", reps: 6 },
  { id: 7,  name: "Tongue Resistance",    icon: "💪", instruction: "Press your tongue firmly against the roof of your mouth\nor against a clean spoon for resistance.", type: "rep-counter", reps: 6 },
  // ── 8. Cheek Puff — 6 reps × (10 inhale · 15 hold · 10 exhale) ───────────
  {
    id: 8, name: "Cheek Puff Breathing", icon: "🐡",
    instruction: "Fill your cheeks with air, puff both out,\nthen slowly release.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale, duration: 10, hint: "Breathe in and fill your cheeks" },
      { ...P.hold,   duration: 15, hint: "Keep cheeks puffed — hold it" },
      { ...P.exhale, duration: 10, hint: "Slowly release the air" },
    ],
  },
  // ── 9. Rep counter ────────────────────────────────────────────────────────
  { id: 9, name: "Cheek Side to Side", icon: "🔁", instruction: "Push the air from your left cheek\nover to your right cheek, back and forth.", type: "rep-counter", reps: 6 },
  // ── 10. A · I · U — 6 reps × (10 inhale · 15 A · 5 pause · 15 I · 5 pause · 15 U) ──
  {
    id: 10, name: "Say A · I · U", icon: "🗣️",
    instruction: "Breathe in, then say A, I, U in sequence with short pauses between.\nOpen your mouth wide for each vowel sound.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale, label: "INHALE", duration: 10, hint: "Breathe in deeply" },
      { ...P.speak,  label: "Aaaaa",  duration: 15, hint: "Say \"Aaaaa\" — long and steady" },
      { ...P.hold,   label: "PAUSE",  duration: 5,  hint: "Short pause" },
      { ...P.speak,  label: "Iiiii",  duration: 15, hint: "Say \"Iiiii\" — long and steady" },
      { ...P.hold,   label: "PAUSE",  duration: 5,  hint: "Short pause" },
      { ...P.speak,  label: "Uuuuu",  duration: 15, hint: "Say \"Uuuuu\" — long and steady" },
    ],
  },
  // ── 11. Pa Pa Pa — 6 rounds × (5s speak · 3s pause) ─────────────────────
  {
    id: 11, name: "Pa Pa Pa", icon: "🔊", isRhythm: true, useRoundLabel: true,
    instruction: "Say \"Pa Pa Pa\" clearly and rhythmically.\nKeep a steady beat through each round.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.speak, label: "SPEAK", duration: 5, hint: "Pa · Pa · Pa · Pa · Pa" },
      { ...P.hold,  label: "PAUSE", duration: 3, hint: "Rest — next round coming…" },
    ],
  },
  // ── 12. Pa Da Ka — 6 rounds × (5s speak · 3s pause) ─────────────────────
  {
    id: 12, name: "Pa Da Ka", icon: "🎵", isRhythm: true, useRoundLabel: true,
    instruction: "Say \"Pa Da Ka\" clearly and rhythmically.\nKeep a steady beat through each round.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.speak, label: "SPEAK", duration: 5, hint: "Pa · Da · Ka · Pa · Da · Ka" },
      { ...P.hold,  label: "PAUSE", duration: 3, hint: "Rest — next round coming…" },
    ],
  },
  // ── 13. Deep Inhalation & Phonate A — 6 reps × (10 inhale · 15 phonate) ──
  {
    id: 13, name: "Deep Inhalation & Phonate A", icon: "🎤",
    instruction: "Take a deep breath, then say \"Aaaaa\" steadily\nfor as long as you can while exhaling.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale,  duration: 10, hint: "Breathe in deeply" },
      { ...P.phonate, duration: 15, hint: "\"Aaaaa\" — steady and clear" },
    ],
  },
  // ── 14. Head Tilt Left — 3 reps × (10 inhale · 15 phonate) ──────────────
  {
    id: 14, name: "Head Tilt Left & Phonate", icon: "↖️",
    instruction: "Gently tilt your head to the left.\nBreathe in, then say \"Aaaaa\" while exhaling.",
    type: "phase-rep", reps: 3,
    phases: [
      { ...P.inhale,  duration: 10, hint: "Head tilted left — breathe in" },
      { ...P.phonate, duration: 15, hint: "\"Aaaaa\" — steady tone" },
    ],
  },
  // ── 15. Head Tilt Right — 3 reps × (10 inhale · 15 phonate) ─────────────
  {
    id: 15, name: "Head Tilt Right & Phonate", icon: "↗️",
    instruction: "Gently tilt your head to the right.\nBreathe in, then say \"Aaaaa\" while exhaling.",
    type: "phase-rep", reps: 3,
    phases: [
      { ...P.inhale,  duration: 10, hint: "Head tilted right — breathe in" },
      { ...P.phonate, duration: 15, hint: "\"Aaaaa\" — steady tone" },
    ],
  },
  // ── 16. Tongue Trill — 6 rounds × (10s Drrrr · 5s pause) ─────────────────
  {
    id: 16, name: "Tongue Trill", subtitle: "Drrrr Sound", icon: "🌀",
    instruction: "Say \"Drrrrrr\" continuously, rolling your tongue.\nHold the trill for the full duration.",
    type: "phase-rep", reps: 6, useRoundLabel: true,
    phases: [
      { ...P.speak, label: "TRILL", duration: 10, hint: "Drrrrrr — roll your tongue continuously" },
      { ...P.hold,  label: "PAUSE", duration: 5,  hint: "Short rest between rounds" },
    ],
  },
  // ── 17. R Word Practice ────────────────────────────────────────────────────
  {
    id: 17, name: "R Word Practice", icon: "📖",
    instruction: "Say each word clearly, 3 times.\nTap \"Said it!\" after each repetition.",
    type: "flashcard", itemReps: 3,
    items: ["ring", "rock", "roof", "radio", "rabbit", "roses", "raisins", "rectangle", "red", "rain", "run", "raccoon", "rope", "rice", "rocket", "read", "remote", "robot", "ride", "rug"],
  },
  // ── 18. R Sound Practice ──────────────────────────────────────────────────
  {
    id: 18, name: "R Sound Practice", icon: "🎯",
    instruction: "Blend each R sound slowly and clearly, 3 times.\nTap \"Said it!\" after each repetition.",
    type: "flashcard", itemReps: 3,
    items: ["r...ah", "r...ay", "r...ee", "r...i", "r...o", "r...oo"],
  },
];

const TOTAL = EXERCISES.length;

const BREAK_MESSAGES = [
  { icon: "💧", text: "Take a sip of water" },
  { icon: "🙆", text: "Roll your shoulders back" },
  { icon: "👐", text: "Shake out your hands gently" },
  { icon: "😮‍💨", text: "Let out a long, slow breath" },
  { icon: "😌", text: "Let your jaw unclench" },
  { icon: "🧘", text: "Close your eyes for a moment" },
  { icon: "💆", text: "Drop your shoulders down" },
  { icon: "🌿", text: "You're doing so well" },
  { icon: "🫁", text: "Breathe naturally for a second" },
  { icon: "✨", text: "Relax — you've earned this break" },
];

const BUDDY = [
  "Nice and slow. 🌿",
  "You're doing great! ✨",
  "Almost there.",
  "Relax your shoulders. 😌",
  "Take your time.",
  "Breathe deeply.",
  "You've got this! 💛",
  "Feeling good?",
  "Stay with it.",
  "You're making progress! 🌱",
  "Every rep counts.",
  "So proud of you.",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buddy(seed: number) { return BUDDY[seed % BUDDY.length]; }

// ─── Audio helpers ────────────────────────────────────────────────────────────

function getOrCreateCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  try {
    if (!ref.current) ref.current = new AudioContext();
    if (ref.current.state === "suspended") ref.current.resume();
    return ref.current;
  } catch { return null; }
}

type TingType = "phase" | "break-start" | "break-end" | "complete";

function playTing(ref: React.MutableRefObject<AudioContext | null>, type: TingType = "phase") {
  const ctx = getOrCreateCtx(ref);
  if (!ctx) return;
  const now = ctx.currentTime;
  const configs: Record<TingType, Array<{ freq: number; t: number; vol: number }>> = {
    "phase":       [{ freq: 880,  t: 0,    vol: 0.22 }],
    "break-start": [{ freq: 880,  t: 0,    vol: 0.18 }, { freq: 1100, t: 0.28, vol: 0.14 }],
    "break-end":   [{ freq: 1100, t: 0,    vol: 0.18 }, { freq: 880,  t: 0.28, vol: 0.14 }],
    "complete":    [{ freq: 880,  t: 0,    vol: 0.18 }, { freq: 1100, t: 0.28, vol: 0.18 }, { freq: 1320, t: 0.56, vol: 0.14 }],
  };
  for (const { freq, t, vol } of configs[type]) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.9);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + 1.0);
  }
}

function phaseAnimation(label: string, duration = 4): TargetAndTransition {
  if (label === "INHALE")  return { scale: [1, 1.28],         transition: { duration, ease: "easeOut" as const } };
  if (label === "HOLD")    return { scale: [1.28, 1.26, 1.28], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const } };
  if (label === "EXHALE")  return { scale: [1.28, 1],          transition: { duration, ease: "easeIn" as const } };
  if (label === "PAUSE")   return { scale: [1.05, 1.03, 1.05], transition: { repeat: Infinity, duration: 1.8, ease: "easeInOut" as const } };
  // SPEAK, PHONATE, Aaaaa, Iiiii, Uuuuu, TRILL, etc.
  return { scale: [1.1, 1.16, 1.1], transition: { repeat: Infinity, duration: 0.44, ease: "easeInOut" as const } };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Session() {
  const [, setLocation] = useLocation();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const [screen, setScreen] = useState<"intro" | "exercise" | "break">("intro");
  const [exIdx, setExIdx] = useState(0);

  // Exercise timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [rep, setRep] = useState(0);
  const [round, setRound] = useState(0);

  // Flashcard state
  const [itemIdx, setItemIdx] = useState(0);
  const [itemRep, setItemRep] = useState(0);

  // Break state
  const [breakLeft, setBreakLeft] = useState(10);
  const [breakMsgIdx, setBreakMsgIdx] = useState(0);

  // Session metadata
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionStartRef = useRef(Date.now());
  const [buddySeed, setBuddySeed] = useState(0);
  const repJustDoneRef = useRef(false);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopMusicRef = useRef<(() => void) | null>(null);

  const ex = EXERCISES[exIdx];

  // ── Init session ──────────────────────────────────────────────────────────
  useEffect(() => {
    createSession.mutate({ data: { totalExercises: TOTAL } }, {
      onSuccess: d => setSessionId(d.id),
    });
  }, []);

  // Rotate buddy message every 13s
  useEffect(() => {
    const id = setInterval(() => setBuddySeed(s => s + 1), 13000);
    return () => clearInterval(id);
  }, []);

  // ── Exercise countdown timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!timerOn || isPaused || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timerOn, isPaused, timeLeft]);

  // ── Break countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "break" || breakLeft <= 0) return;
    const id = setTimeout(() => setBreakLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [screen, breakLeft]);

  // ── Break message cycling (every 3.5s) ───────────────────────────────────
  useEffect(() => {
    if (screen !== "break") return;
    setBreakMsgIdx(0);
    const id = setInterval(() => setBreakMsgIdx(i => i + 1), 3500);
    return () => clearInterval(id);
  }, [screen, exIdx]);

  // ── Ambient music during break ────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "break") {
      stopMusicRef.current?.();
      stopMusicRef.current = null;
      return;
    }
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 2);
      master.connect(ctx.destination);

      // Soft major 7th chord: C4 · E4 · G4 · B4 (very gentle)
      const freqs = [261.63, 329.63, 392.0, 493.88];
      const oscs = freqs.map((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        // Slight detune per voice for warmth
        osc.detune.value = (i % 2 === 0 ? 1 : -1) * 2;

        const g = ctx.createGain();
        g.gain.value = 0.25;
        osc.connect(g);
        g.connect(master);
        osc.start();
        return osc;
      });

      stopMusicRef.current = () => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
        setTimeout(() => oscs.forEach(o => { try { o.stop(); } catch {} }), 1400);
      };
    } catch {
      // AudioContext blocked (e.g. browser policy) — silently skip
    }

    return () => {
      stopMusicRef.current?.();
      stopMusicRef.current = null;
    };
  }, [screen]);

  // ── Handle timer hitting 0 ────────────────────────────────────────────────
  useEffect(() => {
    if (!timerOn || timeLeft > 0) return;
    setTimerOn(false);
    handleTimerExpire();
  }, [timerOn, timeLeft]);

  // ── Handle break hitting 0 ────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "break" || breakLeft > 0) return;
    advanceToNextExercise();
  }, [screen, breakLeft]);

  // ── Timer expire handler ─────────────────────────────────────────────────
  function handleTimerExpire() {
    if (ex.type === "phase-once") {
      const phases = ex.phases!;
      if (phaseIdx < phases.length - 1) {
        const next = phaseIdx + 1;
        playTing(audioCtxRef, "phase");
        setPhaseIdx(next);
        setBuddySeed(s => s + 1);
        setTimeLeft(phases[next].duration);
        setTimerOn(true);
      } else {
        beginBreak();
      }
    } else if (ex.type === "phase-rep") {
      const phases = ex.phases!;
      if (phaseIdx < phases.length - 1) {
        const next = phaseIdx + 1;
        playTing(audioCtxRef, "phase");
        setPhaseIdx(next);
        setTimeLeft(phases[next].duration);
        setTimerOn(true);
      } else {
        const nextRep = rep + 1;
        if (nextRep < ex.reps!) {
          playTing(audioCtxRef, "phase");
          setRep(nextRep);
          setPhaseIdx(0);
          setBuddySeed(s => s + 1);
          setTimeLeft(phases[0].duration);
          setTimerOn(true);
        } else {
          beginBreak();
        }
      }
    } else if (ex.type === "countdown") {
      beginBreak();
    } else if (ex.type === "multi-round") {
      const nextRound = round + 1;
      if (nextRound < ex.rounds!) {
        playTing(audioCtxRef, "phase");
        setRound(nextRound);
        setBuddySeed(s => s + 1);
        setTimeLeft(ex.duration!);
        setTimerOn(true);
      } else {
        beginBreak();
      }
    }
  }

  function beginBreak() {
    if (exIdx >= TOTAL - 1) {
      playTing(audioCtxRef, "complete");
      finishSession();
      return;
    }
    playTing(audioCtxRef, "break-start");
    setBreakLeft(15);
    setScreen("break");
  }

  function advanceToNextExercise() {
    playTing(audioCtxRef, "break-end");
    setExIdx(i => i + 1);
    setScreen("intro");
    setPhaseIdx(0);
    setRep(0);
    setRound(0);
    setItemIdx(0);
    setItemRep(0);
    setIsPaused(false);
    setBuddySeed(s => s + 1);
  }

  function finishSession() {
    const dur = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    if (sessionId) {
      updateSession.mutate({ id: sessionId, data: { completed: true, durationSeconds: dur } });
    }
    setLocation(`/session-complete?dur=${dur}&ex=${TOTAL}`);
  }

  // ── Start exercise (from intro) ──────────────────────────────────────────
  function handleStart() {
    setPhaseIdx(0); setRep(0); setRound(0);
    setItemIdx(0); setItemRep(0);
    setIsPaused(false);
    setBuddySeed(s => s + 1);

    if (ex.type === "phase-once" || ex.type === "phase-rep") {
      setTimeLeft(ex.phases![0].duration);
      setTimerOn(true);
    } else if (ex.type === "countdown" || ex.type === "multi-round") {
      setTimeLeft(ex.duration!);
      setTimerOn(true);
    }
    setScreen("exercise");
  }

  // ── Rep counter tap ──────────────────────────────────────────────────────
  function handleRepTap() {
    if (repJustDoneRef.current) return;
    const next = rep + 1;
    setRep(next);
    setBuddySeed(s => s + 1);
    if (next >= ex.reps!) {
      repJustDoneRef.current = true;
      setTimeout(() => {
        repJustDoneRef.current = false;
        beginBreak();
      }, 600);
    }
  }

  // ── Flashcard rep tap ────────────────────────────────────────────────────
  function handleFlashcardTap() {
    const nextRep = itemRep + 1;
    if (nextRep >= ex.itemReps!) {
      const nextItem = itemIdx + 1;
      if (nextItem >= ex.items!.length) {
        beginBreak();
      } else {
        setItemIdx(nextItem);
        setItemRep(0);
        setBuddySeed(s => s + 1);
      }
    } else {
      setItemRep(nextRep);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const progress = (exIdx / TOTAL) * 100;
  const currentPhase = ex.phases?.[phaseIdx];
  const bgColor = screen === "exercise" && currentPhase ? currentPhase.bg : "#FFFDF7";

  return (
    <motion.div
      className="min-h-[100dvh] flex flex-col max-w-md mx-auto w-full relative overflow-hidden"
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2 z-10">
        <Button
          variant="ghost" size="icon"
          className="rounded-full bg-black/5 hover:bg-black/10 h-10 w-10"
          onClick={() => setLocation("/dashboard")}
        >
          <X className="h-5 w-5 text-foreground" />
        </Button>

        <div className="text-center">
          <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Exercise {exIdx + 1} of {TOTAL}
          </div>
        </div>

        <div className="w-10" />
      </header>

      {/* Progress bar */}
      <div className="px-5 pb-1">
        <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-8 z-10">
        <AnimatePresence mode="wait">

          {/* ── INTRO SCREEN ────────────────────────────────────────── */}
          {screen === "intro" && (
            <motion.div
              key={`intro-${exIdx}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-between py-6"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{ex.icon}</span>
                  <div>
                    <h1 className="text-2xl font-black text-foreground leading-tight">{ex.name}</h1>
                    {ex.subtitle && <p className="text-sm font-semibold text-muted-foreground">{ex.subtitle}</p>}
                  </div>
                </div>

                <div className="bg-white/70 rounded-3xl p-5 shadow-sm border border-white">
                  <p className="text-base text-foreground leading-relaxed whitespace-pre-line font-medium">
                    {ex.instruction}
                  </p>
                </div>

                {/* Exercise info chips */}
                <div className="flex flex-wrap gap-2">
                  {ex.reps && (
                    <span className="bg-primary/20 text-primary-foreground/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      {ex.reps} repetitions
                    </span>
                  )}
                  {ex.rounds && ex.type === "multi-round" && (
                    <span className="bg-primary/20 text-primary-foreground/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      {ex.rounds} rounds × {ex.duration}s
                    </span>
                  )}
                  {ex.type === "countdown" && (
                    <span className="bg-primary/20 text-primary-foreground/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      {ex.duration} seconds
                    </span>
                  )}
                  {ex.type === "phase-once" && ex.phases && (
                    <span className="bg-primary/20 text-primary-foreground/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      {ex.phases.map(p => `${p.label} ${p.duration}s`).join(" · ")}
                    </span>
                  )}
                  {ex.type === "phase-rep" && ex.reps && ex.phases && (
                    <span className="bg-primary/20 text-primary-foreground/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      {ex.reps} × ({ex.phases.map(p => `${p.duration}s`).join("+")}s)
                    </span>
                  )}
                  {ex.items && (
                    <span className="bg-primary/20 text-primary-foreground/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      {ex.items.length} {ex.type === "flashcard" ? "words" : "sounds"} · {ex.itemReps}×
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full rounded-full h-14 text-lg font-bold shadow-md mt-6"
                onClick={handleStart}
              >
                Let's Go <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* ── BREAK SCREEN ────────────────────────────────────────── */}
          {screen === "break" && (
            <motion.div
              key="break"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center gap-7"
            >
              {/* Gentle pulsing orb with countdown */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#C7F1D5]/50"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full bg-[#C7F1D5]/40"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.4 }}
                />
                <div className="w-32 h-32 rounded-full bg-[#C7F1D5] flex flex-col items-center justify-center shadow-md z-10 gap-0.5">
                  <span className="text-4xl font-black text-[#1E7A4A]">{breakLeft}</span>
                  <span className="text-xs font-bold text-[#1E7A4A]/60 tracking-wider uppercase">sec</span>
                </div>
              </div>

              {/* Cycling break message */}
              <div className="text-center space-y-2 px-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={breakMsgIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-4xl">{BREAK_MESSAGES[breakMsgIdx % BREAK_MESSAGES.length].icon}</span>
                    <p className="text-xl font-bold text-foreground">
                      {BREAK_MESSAGES[breakMsgIdx % BREAK_MESSAGES.length].text}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Music indicator */}
              <div className="flex items-center gap-1.5 text-[#1E7A4A]/50">
                {[0,1,2,3,4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-[#1E7A4A]/40"
                    animate={{ height: ["8px", `${14 + i * 4}px`, "8px"] }}
                    transition={{ repeat: Infinity, duration: 0.9 + i * 0.15, ease: "easeInOut", delay: i * 0.12 }}
                  />
                ))}
                <span className="text-xs font-medium ml-1 text-[#1E7A4A]/40">calm music</span>
              </div>

              {/* Next exercise preview */}
              {exIdx + 1 < TOTAL && (
                <div className="bg-white/60 rounded-2xl px-5 py-3 text-center border border-[#C7F1D5]">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Up next</p>
                  <p className="text-sm font-bold text-foreground">
                    {EXERCISES[exIdx + 1].icon} {EXERCISES[exIdx + 1].name}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── EXERCISE SCREEN ─────────────────────────────────────── */}
          {screen === "exercise" && (
            <motion.div
              key={`ex-${exIdx}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col py-4"
            >
              {/* Exercise name */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-black/8 rounded-full px-4 py-1.5">
                  <span className="text-lg">{ex.icon}</span>
                  <span className="text-sm font-bold text-foreground">{ex.name}</span>
                </div>
              </div>

              {/* ── Phase timer (phase-once / phase-rep) ── */}
              {(ex.type === "phase-once" || ex.type === "phase-rep") && currentPhase && (
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  {/* Round / rep label */}
                  {ex.type === "phase-rep" && (
                    <div className="text-sm font-bold text-muted-foreground tracking-wider">
                      {ex.useRoundLabel
                        ? `Round ${rep + 1} of ${ex.reps}`
                        : `Rep ${rep + 1} of ${ex.reps}`}
                    </div>
                  )}

                  {/* Animated breathing circle */}
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full opacity-40"
                      style={{ backgroundColor: currentPhase.color }}
                      key={`${exIdx}-${phaseIdx}-outer`}
                      animate={phaseAnimation(currentPhase.label, currentPhase.duration)}
                    />
                    <motion.div
                      className="w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-lg z-10"
                      style={{ backgroundColor: currentPhase.bg, border: `3px solid ${currentPhase.color}30` }}
                      key={`${exIdx}-${phaseIdx}-inner`}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${phaseIdx}-${timeLeft}`}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center"
                        >
                          <div className="text-5xl font-black" style={{ color: currentPhase.color }}>
                            {timeLeft}
                          </div>
                          <div className="text-xs font-black tracking-widest mt-1" style={{ color: currentPhase.color }}>
                            {currentPhase.label}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Phase hint */}
                  <p className="text-center text-base font-medium text-foreground/70 px-4">
                    {currentPhase.hint}
                  </p>

                  {/* Rhythm beat bars for Pa Pa Pa / Pa Da Ka / Tongue Trill */}
                  {ex.isRhythm && currentPhase.label === "SPEAK" && (
                    <div className="flex gap-2 items-end h-10">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          className="w-2.5 rounded-full"
                          style={{ backgroundColor: currentPhase.color + "99" }}
                          animate={{ height: ["10px", `${18 + (i % 3) * 10}px`, "10px"] }}
                          transition={{ repeat: Infinity, duration: 0.46, delay: i * 0.08, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Rep dots */}
                  {ex.type === "phase-rep" && !ex.useRoundLabel && (
                    <div className="flex gap-2">
                      {Array.from({ length: ex.reps! }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full transition-all ${i < rep ? "bg-primary scale-100" : i === rep ? "bg-primary/60 scale-125" : "bg-black/15"}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Round dots for round-label exercises */}
                  {ex.type === "phase-rep" && ex.useRoundLabel && (
                    <div className="flex gap-2">
                      {Array.from({ length: ex.reps! }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full transition-all ${i < rep ? "w-4 bg-primary" : i === rep ? "w-4 bg-primary/60" : "w-2 bg-black/15"}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pause */}
                  <Button
                    variant="outline"
                    className="rounded-full h-11 px-6 font-semibold bg-white/60"
                    onClick={() => setIsPaused(p => !p)}
                  >
                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                  </Button>
                </div>
              )}

              {/* ── Simple countdown (countdown / multi-round) ── */}
              {(ex.type === "countdown" || ex.type === "multi-round") && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  {ex.type === "multi-round" && (
                    <div className="text-sm font-bold text-muted-foreground tracking-wider">
                      Round {round + 1} of {ex.rounds}
                    </div>
                  )}

                  <div className="relative w-56 h-56 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/15"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                    <div className="w-44 h-44 rounded-full bg-[#FFF8D6] border-4 border-primary/30 flex items-center justify-center shadow-md z-10">
                      <motion.span
                        key={timeLeft}
                        initial={{ opacity: 0.7, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-6xl font-black text-primary"
                      >
                        {timeLeft}
                      </motion.span>
                    </div>
                  </div>

                  {ex.type === "multi-round" && (
                    <div className="flex gap-2">
                      {Array.from({ length: ex.rounds! }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full transition-all ${i < round ? "bg-primary" : i === round ? "bg-primary/60 scale-125" : "bg-black/15"}`}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-center text-sm font-medium text-muted-foreground px-6">
                    {ex.instruction.split("\n")[0]}
                  </p>

                  <Button
                    variant="outline"
                    className="rounded-full h-11 px-6 font-semibold bg-white/60"
                    onClick={() => setIsPaused(p => !p)}
                  >
                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                  </Button>
                </div>
              )}

              {/* ── Rep counter ── */}
              {ex.type === "rep-counter" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                  {/* Counter display */}
                  <div className="text-center">
                    <motion.div
                      key={rep}
                      initial={{ scale: 1.4, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-8xl font-black text-foreground tabular-nums"
                    >
                      {rep}
                    </motion.div>
                    <div className="text-lg font-semibold text-muted-foreground">of {ex.reps}</div>
                  </div>

                  {/* Dot progress */}
                  <div className="flex gap-2">
                    {Array.from({ length: ex.reps! }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={i < rep ? { scale: 1, backgroundColor: "#F8D979" } : i === rep ? { scale: 1.3, backgroundColor: "#F8D979aa" } : { scale: 1, backgroundColor: "#00000015" }}
                        className="h-3 w-3 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Tap button */}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    className="w-40 h-40 rounded-full bg-primary shadow-lg flex flex-col items-center justify-center gap-1 select-none active:shadow-md"
                    onClick={handleRepTap}
                    disabled={rep >= ex.reps!}
                  >
                    <span className="text-3xl font-black text-primary-foreground">Done</span>
                    <span className="text-xs font-semibold text-primary-foreground/70">tap to count</span>
                  </motion.button>
                </div>
              )}

              {/* ── Flashcard ── */}
              {ex.type === "flashcard" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="text-sm font-semibold text-muted-foreground">
                    Word {itemIdx + 1} of {ex.items!.length}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={itemIdx}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full bg-white rounded-3xl shadow-md border border-border p-8 text-center"
                    >
                      <div className="text-5xl font-black text-foreground tracking-wide">
                        {ex.items![itemIdx]}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Rep dots for this item */}
                  <div className="flex gap-3">
                    {Array.from({ length: ex.itemReps! }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={i < itemRep ? { scale: 1, backgroundColor: "#F8D979" } : i === itemRep ? { scale: 1.3, backgroundColor: "#F8D979aa" } : { scale: 1, backgroundColor: "#00000015" }}
                        className="h-3 w-8 rounded-full"
                      />
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className="rounded-full h-14 px-10 text-lg font-bold shadow-md"
                    onClick={handleFlashcardTap}
                  >
                    Said it! ✓
                  </Button>

                  {itemIdx + 1 < ex.items!.length && (
                    <p className="text-xs text-muted-foreground/60">
                      Next: {ex.items![itemIdx + 1]}
                    </p>
                  )}
                </div>
              )}

              {/* ── Buddy message (all exercise types) ── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={buddySeed}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center pt-4"
                >
                  <span className="text-sm font-semibold text-muted-foreground">{buddy(buddySeed)}</span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
