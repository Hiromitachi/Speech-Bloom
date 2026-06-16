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
  {
    id: 1, name: "Abdominal Breathing", subtitle: "15 · 30 · 15", icon: "🌬️",
    instruction: "Place one hand on your chest and one on your abdomen.\nBreathe using your abdomen, not your chest.",
    type: "phase-once", rounds: 1,
    phases: [
      { ...P.inhale, label: "INHALE", duration: 15, hint: "Breathe in slowly through your nose" },
      { ...P.hold,   label: "HOLD",   duration: 30, hint: "Hold gently — abdomen expanded" },
      { ...P.exhale, label: "EXHALE", duration: 15, hint: "Breathe out slowly through pursed lips" },
    ],
  },
  { id: 2,  name: "Effortful Swallow",       icon: "💧", instruction: "Swallow hard, as if swallowing a large bite.\nFeel the muscles in your throat work.",              type: "rep-counter", reps: 6 },
  { id: 3,  name: "Masako Maneuver",          icon: "👅", instruction: "Hold your tongue gently between your teeth.\nSwallow while keeping your tongue forward.",          type: "rep-counter", reps: 6 },
  { id: 4,  name: "Tongue Side to Side",      icon: "↔️", instruction: "Move your tongue slowly from corner to corner.\nTouch the inside of each cheek.",                    type: "rep-counter", reps: 6 },
  { id: 5,  name: "Tongue Up and Down",       icon: "↕️", instruction: "Stretch your tongue up toward your nose,\nthen down toward your chin.",                            type: "rep-counter", reps: 6 },
  { id: 6,  name: "Tongue Round Movement",    icon: "🔄", instruction: "Move your tongue in a full circle\naround the outside of your lips.",                              type: "rep-counter", reps: 6 },
  { id: 7,  name: "Tongue Resistance",        icon: "💪", instruction: "Press your tongue firmly against the roof of your mouth\nor against a clean spoon for resistance.", type: "rep-counter", reps: 6 },
  {
    id: 8, name: "Cheek Puff Breathing", icon: "🐡",
    instruction: "Fill your cheeks with air, puff both out,\nthen slowly release.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale, duration: 10, hint: "Breathe in and fill your cheeks" },
      { ...P.hold,   duration: 10, hint: "Keep cheeks puffed — hold it" },
      { ...P.exhale, duration: 10, hint: "Slowly release the air" },
    ],
  },
  { id: 9, name: "Cheek Side to Side", icon: "🔁", instruction: "Push the air from your left cheek\nover to your right cheek, back and forth.", type: "rep-counter", reps: 6 },
  {
    id: 10, name: "Say A · I · U", icon: "🗣️",
    instruction: "Breathe in deeply, then say A, I, U slowly and clearly\nas you exhale. Open your mouth wide for each sound.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale, duration: 5,  hint: "Breathe in deeply" },
      { ...P.speak,  duration: 10, hint: "A … I … U — slowly and clearly" },
    ],
  },
  {
    id: 11, name: "Pa Pa Pa", subtitle: "Section 1 of 2", icon: "🔊",
    instruction: "Say \"Pa Pa Pa\" clearly and rhythmically\nuntil the timer ends. Keep going!",
    type: "countdown", duration: 20,
  },
  {
    id: 12, name: "Pa Pa Pa", subtitle: "Section 2 of 2", icon: "🔊",
    instruction: "Keep going — \"Pa Pa Pa\"\nclearly and rhythmically until the timer ends.",
    type: "countdown", duration: 20,
  },
  {
    id: 13, name: "Pa Da Ka", subtitle: "Section 1 of 2", icon: "🎵",
    instruction: "Say \"Pa Da Ka\" clearly and rhythmically\nuntil the timer ends.",
    type: "countdown", duration: 20,
  },
  {
    id: 14, name: "Pa Da Ka", subtitle: "Section 2 of 2", icon: "🎵",
    instruction: "Keep going — \"Pa Da Ka\"\nclearly and rhythmically until the timer ends.",
    type: "countdown", duration: 20,
  },
  {
    id: 15, name: "Deep Inhalation & Phonate A", icon: "🎤",
    instruction: "Take a deep breath, then say \"Aaaaa\" steadily\nfor as long as you can while exhaling.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale,  duration: 5,  hint: "Breathe in deeply" },
      { ...P.phonate, duration: 10, hint: "\"Aaaaa\" — steady and clear" },
    ],
  },
  {
    id: 16, name: "Head Tilt Left & Phonate", icon: "↖️",
    instruction: "Gently tilt your head to the left.\nBreathe in, then say \"Aaaaa\" while exhaling.",
    type: "phase-rep", reps: 3,
    phases: [
      { ...P.inhale,  duration: 5,  hint: "Head tilted left — breathe in" },
      { ...P.phonate, duration: 10, hint: "\"Aaaaa\" — steady tone" },
    ],
  },
  {
    id: 17, name: "Head Tilt Right & Phonate", icon: "↗️",
    instruction: "Gently tilt your head to the right.\nBreathe in, then say \"Aaaaa\" while exhaling.",
    type: "phase-rep", reps: 3,
    phases: [
      { ...P.inhale,  duration: 5,  hint: "Head tilted right — breathe in" },
      { ...P.phonate, duration: 10, hint: "\"Aaaaa\" — steady tone" },
    ],
  },
  {
    id: 18, name: "Tongue Trill", subtitle: "Drrrr Sound", icon: "🌀",
    instruction: "Say \"Drrrrrr\" continuously,\nrolling your tongue, until the timer ends.",
    type: "multi-round", rounds: 6, duration: 20,
  },
  {
    id: 19, name: "R Word Practice", icon: "📖",
    instruction: "Say each word clearly, 3 times.\nTap \"Said it!\" after each repetition.",
    type: "flashcard", itemReps: 3,
    items: ["ring", "rock", "roof", "radio", "rabbit", "roses", "raisins", "rectangle", "red", "rain", "run", "raccoon", "rope", "rice", "rocket", "read", "remote", "robot", "ride", "rug"],
  },
  {
    id: 20, name: "R Sound Practice", icon: "🎯",
    instruction: "Blend each R sound slowly and clearly, 3 times.\nTap \"Said it!\" after each repetition.",
    type: "flashcard", itemReps: 3,
    items: ["r...ah", "r...ay", "r...ee", "r...i", "r...o", "r...oo"],
  },
];

const TOTAL = EXERCISES.length;

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

function phaseAnimation(label: string): TargetAndTransition {
  if (label === "INHALE")  return { scale: [1, 1.28], transition: { duration: 4, ease: "easeOut" as const } };
  if (label === "HOLD")    return { scale: [1.28, 1.26, 1.28], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const } };
  if (label === "EXHALE")  return { scale: [1.28, 1], transition: { duration: 4, ease: "easeIn" as const } };
  return { scale: [1.1, 1.15, 1.1], transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" as const } };
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

  // Session metadata
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionStartRef = useRef(Date.now());
  const [buddySeed, setBuddySeed] = useState(0);
  const repJustDoneRef = useRef(false);

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
        setPhaseIdx(next);
        setTimeLeft(phases[next].duration);
        setTimerOn(true);
      } else {
        const nextRep = rep + 1;
        if (nextRep < ex.reps!) {
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
      finishSession();
      return;
    }
    setBreakLeft(10);
    setScreen("break");
  }

  function advanceToNextExercise() {
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
              className="flex-1 flex flex-col items-center justify-center gap-8"
            >
              {/* Gentle pulsing orb */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#C7F1D5]/60"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                />
                <div className="w-36 h-36 rounded-full bg-[#C7F1D5] flex items-center justify-center shadow-md z-10">
                  <span className="text-5xl font-black text-[#1E7A4A]">{breakLeft}</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Relax.</h2>
                <p className="text-muted-foreground font-medium">Next exercise is coming…</p>
                {exIdx + 1 < TOTAL && (
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Up next: {EXERCISES[exIdx + 1].icon} {EXERCISES[exIdx + 1].name}
                  </p>
                )}
              </div>
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
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  {/* Animated breathing circle */}
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full opacity-40"
                      style={{ backgroundColor: currentPhase.color }}
                      key={`${exIdx}-${phaseIdx}-outer`}
                      animate={phaseAnimation(currentPhase.label)}
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

                  {/* Rep indicator for phase-rep */}
                  {ex.type === "phase-rep" && (
                    <div className="flex gap-2">
                      {Array.from({ length: ex.reps! }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full transition-all ${i < rep ? "bg-primary scale-100" : i === rep ? "bg-primary/60 scale-125" : "bg-black/15"}`}
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
