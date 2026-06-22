import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useUpdateSession, useLogExercise } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";
import { X, ChevronRight, Camera, ThumbsUp, Pause, Play, RotateCcw, SkipForward, SkipBack } from "lucide-react";
import { useVoiceCoach, type VoiceCommand } from "@/hooks/use-voice-coach";
import { useGestureCam } from "@/hooks/use-gesture-cam";
import { ListeningIndicator } from "@/components/listening-indicator";
import {
  phasePrompt,
  exerciseIntroPrompt,
  repStartPrompt,
  repCountPrompt,
  flashcardWordPrompt,
  flashcardNextWordPrompt,
  roundPrompt,
  breakStartPrompt,
  breakEndPrompt,
  sessionCompletePrompt,
  pauseAckPrompt,
  resumeAckPrompt,
  skipAckPrompt,
  repeatAckPrompt,
} from "@/lib/coach-prompts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = { label: string; color: string; bg: string; duration: number; hint: string; isPrompt?: boolean };

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
  rest:    { color: "#4B5563", bg: "#F3F4F6", label: "REST"    },
};

// ─── Exercise list ───────────────────────────────────────────────────────────

const EXERCISES: ExDef[] = [
  // ── 1. Abdominal Breathing — 3 rounds × (5 inhale · 15 hold · 5 exhale) ──
  {
    id: 1, name: "Abdominal Breathing", subtitle: "3 rounds · 5·15·5", icon: "🌬️",
    instruction: "Place one hand on your chest and one on your abdomen.\nBreathe using your abdomen, not your chest.",
    type: "phase-rep", reps: 3, useRoundLabel: true,
    phases: [
      { ...P.inhale, label: "INHALE", duration: 5, hint: "Breathe in slowly through your nose" },
      { ...P.hold,   label: "HOLD",   duration: 15, hint: "Hold gently — abdomen expanded" },
      { ...P.exhale, label: "EXHALE", duration: 5, hint: "Breathe out slowly through pursed lips" },
    ],
  },
  // ── 2–7. Rep-counter exercises ────────────────────────────────────────────
  { id: 2,  name: "Effortful Swallow",    icon: "💧", instruction: "Swallow hard, as if swallowing a large bite.\nFeel the muscles in your throat work.",              type: "rep-counter", reps: 6 },
  { id: 3,  name: "Masako Maneuver",      icon: "👅", instruction: "Hold your tongue gently between your teeth.\nSwallow while keeping your tongue forward.",          type: "rep-counter", reps: 6 },
  { id: 4,  name: "Tongue Side to Side",  icon: "↔️", instruction: "Move your tongue slowly from corner to corner.\nTouch the inside of each cheek.",                  type: "rep-counter", reps: 6 },
  { id: 5,  name: "Tongue Up and Down",   icon: "↕️", instruction: "Stretch your tongue up toward your nose,\nthen down toward your chin.",                          type: "rep-counter", reps: 6 },
  { id: 6,  name: "Tongue Round Movement",icon: "🔄", instruction: "Move your tongue in a full circle\naround the outside of your lips.",                            type: "rep-counter", reps: 6 },
  { id: 7,  name: "Tongue Resistance",    icon: "💪", instruction: "Press your tongue firmly against the roof of your mouth\nor against a clean spoon for resistance.", type: "rep-counter", reps: 6 },
  // ── 8. Cheek Puff — 6 reps × (5 inhale · 15 hold · 5 exhale) ───────────
  {
    id: 8, name: "Cheek Puff Breathing", icon: "🐡",
    instruction: "Fill your cheeks with air, puff both out,\nthen slowly release.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale, duration: 5, hint: "Breathe in and fill your cheeks" },
      { ...P.hold,   duration: 15, hint: "Keep cheeks puffed — hold it" },
      { ...P.exhale, duration: 5, hint: "Slowly release the air" },
    ],
  },
  // ── 9. Rep counter ────────────────────────────────────────────────────────
  { id: 9, name: "Cheek Side to Side", icon: "🔁", instruction: "Push the air from your left cheek\nover to your right cheek, back and forth.", type: "rep-counter", reps: 6 },
  // ── 10. A-I-U Sustained Phonation — 5 reps × (5 inhale · 5 Aaa · 2 transition · 5 Iii · 2 transition · 5 Uuu · 5 rest) ──
  {
    id: 10, name: "A-I-U Sustained Phonation", subtitle: "A-I-U Sequence", icon: "🗣️",
    instruction: "Take a breath (5 sec inhale).\nSustain \"Aaa...\" for 5 seconds.\nImmediately transition to \"Iii...\" for 5 seconds.\nImmediately transition to \"Uuu...\" for 5 seconds.\nThis entire sequence counts as ONE repetition.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.inhale, label: "INHALE",     duration: 5, hint: "Breathe in deeply" },
      { ...P.speak,  label: "Aaa",        duration: 5, hint: "Sustain \"Aaa\"" },
      { ...P.rest,   label: "TRANSITION", duration: 2, hint: "Transitioning to \"Iii\"" },
      { ...P.speak,  label: "Iii",        duration: 5, hint: "Sustain \"Iii\"" },
      { ...P.rest,   label: "TRANSITION", duration: 2, hint: "Transitioning to \"Uuu\"" },
      { ...P.speak,  label: "Uuu",        duration: 5, hint: "Sustain \"Uuu\"" },
      { ...P.rest,   label: "REST",       duration: 5, hint: "Relax and rest" },
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
  // ── 13. Deep Inhalation & Phonate A — 6 reps × (5 inhale · 15 phonate) ──
  {
    id: 13, name: "Deep Inhalation & Phonate A", icon: "🎤",
    instruction: "Take a deep breath, then say \"Aaaaa\" steadily\nfor as long as you can while exhaling.",
    type: "phase-rep", reps: 6,
    phases: [
      { ...P.inhale,  duration: 5, hint: "Breathe in deeply" },
      { ...P.phonate, duration: 15, hint: "\"Aaaaa\" — steady and clear" },
    ],
  },
  // ── 14. Head Tilt Left — 3 reps × (5 inhale · 15 phonate) ──────────────
  {
    id: 14, name: "Head Tilt Left & Phonate", icon: "↖️",
    instruction: "Gently tilt your head to the left.\nBreathe in, then say \"Aaaaa\" while exhaling.",
    type: "phase-rep", reps: 3,
    phases: [
      { ...P.inhale,  duration: 5, hint: "Head tilted left — breathe in" },
      { ...P.phonate, duration: 15, hint: "\"Aaaaa\" — steady tone" },
    ],
  },
  // ── 15. Head Tilt Right — 3 reps × (5 inhale · 15 phonate) ─────────────
  {
    id: 15, name: "Head Tilt Right & Phonate", icon: "↗️",
    instruction: "Gently tilt your head to the right.\nBreathe in, then say \"Aaaaa\" while exhaling.",
    type: "phase-rep", reps: 3,
    phases: [
      { ...P.inhale,  duration: 5, hint: "Head tilted right — breathe in" },
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
  // ── 19. Super-Supraglottic Swallow — 5 reps × (5 inhale · 5 hold · Swallow/Cough · 3 rest) ──
  {
    id: 19, name: "Super-Supraglottic Swallow", icon: "💧",
    instruction: "1. Take a deep breath.\n2. Hold your breath tightly.\n3. Bear down gently as if lifting something heavy.\n4. Swallow while holding your breath.\n5. Cough immediately after swallowing.\n6. Swallow again.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.inhale, label: "INHALE", duration: 5, hint: "Breathe in deeply" },
      { ...P.hold,   label: "BEAR DOWN", duration: 5, hint: "Hold breath and bear down gently" },
      { ...P.speak,  label: "SWALLOW & COUGH", duration: 0, isPrompt: true, hint: "Swallow, cough, then swallow again" },
      { ...P.rest,   label: "REST", duration: 3, hint: "Relax and rest" },
    ],
  },
  // ── 20. Front Tongue Resistance ──
  {
    id: 20, name: "Front Tongue Resistance", icon: "👅",
    instruction: "Place a spoon in front of your tongue.\nPush against the spoon with your tongue.\nHold firmly.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.hold, label: "HOLD", duration: 5, hint: "Push firmly against the spoon" },
      { ...P.rest, label: "REST", duration: 3, hint: "Relax your tongue" },
    ],
  },
  // ── 21. Side Tongue Resistance (Left) ──
  {
    id: 21, name: "Side Tongue Resistance (Left)", icon: "👈",
    instruction: "Press tongue against inside of left cheek.\nUse fingers on outside of cheek to provide resistance.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.hold, label: "HOLD", duration: 5, hint: "Press tongue against left cheek" },
      { ...P.rest, label: "REST", duration: 3, hint: "Relax your tongue" },
    ],
  },
  // ── 22. Side Tongue Resistance (Right) ──
  {
    id: 22, name: "Side Tongue Resistance (Right)", icon: "👉",
    instruction: "Press tongue against inside of right cheek.\nUse fingers on outside of cheek to provide resistance.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.hold, label: "HOLD", duration: 5, hint: "Press tongue against right cheek" },
      { ...P.rest, label: "REST", duration: 3, hint: "Relax your tongue" },
    ],
  },
  // ── 23. Spoon Bite (Left) ──
  {
    id: 23, name: "Spoon Bite (Left)", icon: "🥄",
    instruction: "Bite gently but firmly on a spoon on the left side of your mouth.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.hold, label: "BITE HOLD", duration: 3, hint: "Bite and hold spoon on left side" },
      { ...P.rest, label: "REST", duration: 2, hint: "Relax your jaw" },
    ],
  },
  // ── 24. Spoon Bite (Right) ──
  {
    id: 24, name: "Spoon Bite (Right)", icon: "🥄",
    instruction: "Bite gently but firmly on a spoon on the right side of your mouth.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.hold, label: "BITE HOLD", duration: 3, hint: "Bite and hold spoon on right side" },
      { ...P.rest, label: "REST", duration: 2, hint: "Relax your jaw" },
    ],
  },
  // ── 25. Spoon Hold (Left) ──
  {
    id: 25, name: "Spoon Hold (Left)", icon: "🥄",
    instruction: "Place spoon between teeth on the left side.\nHold steadily.",
    type: "phase-rep", reps: 1,
    phases: [
      { ...P.hold, label: "HOLD", duration: 5, hint: "Hold spoon steadily on left side" },
    ],
  },
  // ── 26. Spoon Hold (Right) ──
  {
    id: 26, name: "Spoon Hold (Right)", icon: "🥄",
    instruction: "Place spoon between teeth on the right side.\nHold steadily.",
    type: "phase-rep", reps: 1,
    phases: [
      { ...P.hold, label: "HOLD", duration: 5, hint: "Hold spoon steadily on right side" },
    ],
  },
  // ── 27. Head Turn Left & Phonate ──
  {
    id: 27, name: "Head Turn Left & Phonate", icon: "⬅️",
    instruction: "Turn head to the left side.\nSustain \"AAA\" continuously.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.phonate, label: "PHONATE", duration: 5, hint: "Sustain \"AAA\" tone" },
      { ...P.rest,    label: "REST", duration: 3, hint: "Relax and face forward" },
    ],
  },
  // ── 28. Head Turn Right & Phonate ──
  {
    id: 28, name: "Head Turn Right & Phonate", icon: "➡️",
    instruction: "Turn head to the right side.\nSustain \"AAA\" continuously.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.phonate, label: "PHONATE", duration: 5, hint: "Sustain \"AAA\" tone" },
      { ...P.rest,    label: "REST", duration: 3, hint: "Relax and face forward" },
    ],
  },
  // ── 29. Straw Blowing ──
  {
    id: 29, name: "Straw Blowing", icon: "🥤",
    instruction: "Blow steadily and continuously through a straw.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.speak, label: "BLOW", duration: 5, hint: "Blow steadily through the straw" },
      { ...P.rest,  label: "REST", duration: 3, hint: "Take a short rest" },
    ],
  },
  // ── 30. Straw Phonation (UUU) ──
  {
    id: 30, name: "Straw Phonation (UUU)", icon: "🥤",
    instruction: "Produce a continuous \"UUU\" sound through a straw.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.phonate, label: "UUU", duration: 5, hint: "Produce \"UUU\" sound through straw" },
      { ...P.rest,    label: "REST", duration: 3, hint: "Take a short rest" },
    ],
  },
  // ── 31. Wall Push with Voice ──
  {
    id: 31, name: "Wall Push with Voice", icon: "🧱",
    instruction: "Push firmly against a wall.\nProduce \"AAA\" continuously.",
    type: "phase-rep", reps: 5,
    phases: [
      { ...P.phonate, label: "PUSH & VOICE", duration: 5, hint: "Push wall and sustain \"AAA\"" },
      { ...P.rest,    label: "REST", duration: 3, hint: "Relax and rest" },
    ],
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

// ─── Voice narration (now handled by useVoiceCoach hook) ──────────────────────

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

function getSideFromName(name: string): "Left" | "Right" | null {
  const lower = name.toLowerCase();
  if (lower.includes("left")) return "Left";
  if (lower.includes("right")) return "Right";
  return null;
}

function getPhaseStartSpeech(ex: ExDef, phase: Phase, repNum: number): string {
  if (phase.label === "REST") return "Rest.";
  if (ex.type === "phase-once") return `Start. ${phasePrompt(phase.label)}`;
  const side = getSideFromName(ex.name);
  const sideStr = side ? ` ${side} side.` : "";
  return `Repetition ${repNum + 1}.${sideStr} Start. ${phasePrompt(phase.label)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Session() {
  const [, setLocation] = useLocation();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const logExercise = useLogExercise();
  const exerciseStartRef = useRef(Date.now());

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

  // ── AI Voice Coach ────────────────────────────────────────────────────────
  const voiceOnRef = useRef(true); // keep ref for backward compat with ting sounds

  const handleSilence = useCallback(() => {
    const currentEx = EXERCISES[exIdx];
    if (!currentEx) return;
    // For rep-counter: silence = user finished a rep
    if (currentEx.type === "rep-counter") {
      handleRepTapFromVoice();
    }
    // For flashcard: silence = user said the word
    if (currentEx.type === "flashcard") {
      handleFlashcardTapFromVoice();
    }
    // For prompt-based phase-rep: silence = user completed prompt phase
    if (currentEx.type === "phase-rep") {
      const currentPhase = currentEx.phases?.[phaseIdx];
      if (currentPhase?.isPrompt) {
        handlePromptPhaseDone();
      }
    }
  }, [exIdx, phaseIdx, rep]);

  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    switch (cmd) {
      case "pause":
        setIsPaused(true);
        coach.stopListening();
        coach.say(pauseAckPrompt());
        break;
      case "resume":
        setIsPaused(false);
        coach.say(resumeAckPrompt());
        break;
      case "next":
        coach.say(skipAckPrompt(), () => beginBreak());
        break;
      case "repeat":
        coach.say(repeatAckPrompt(), () => handleStart());
        break;
      case "stop":
        coach.shutUp();
        coach.stopListening();
        setLocation("/dashboard");
        break;
    }
  }, []);

  const coach = useVoiceCoach({
    onSilence: handleSilence,
    onCommand: handleVoiceCommand,
  });

  const [voiceOn, setVoiceOn] = useState(true);
  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    voiceOnRef.current = next;
    if (!next) {
      coach.shutUp();
      coach.stopListening();
    }
  }

  // ── Gesture Camera (thumbs-up = context-aware action) ──────────────────────
  const thumbsUpRef = useRef<() => void>(() => {});
  // Update every render so it always has fresh state
  thumbsUpRef.current = () => {
    if (screen === "intro") {
      handleStart();
    } else if (screen === "break") {
      advanceToNextExercise();
    } else if (screen === "exercise") {
      const currentEx = EXERCISES[exIdx];
      if (currentEx.type === "rep-counter") {
        // Thumbs up = done with all reps, move on
        setRep(currentEx.reps!);
        beginBreak();
      } else if (currentEx.type === "flashcard") {
        handleFlashcardTap();
      } else if (currentEx.type === "phase-rep" && currentEx.phases?.[phaseIdx]?.isPrompt) {
        handlePromptPhaseDone();
      } else {
        beginBreak();
      }
    }
  };
  // Stable callback that reads from ref
  const handleThumbsUp = useCallback(() => thumbsUpRef.current(), []);

  const gestureCam = useGestureCam({
    onThumbsUp: handleThumbsUp,
    cooldownMs: 2000,
  });

  const [showCamPreview, setShowCamPreview] = useState(true);

  const ex = EXERCISES[exIdx];

  // ── Init session ──────────────────────────────────────────────────────────
  useEffect(() => {
    createSession.mutate({ data: { totalExercises: TOTAL } }, {
      onSuccess: d => setSessionId(d.id),
    });
    // Auto-start gesture camera
    gestureCam.start();
    return () => gestureCam.stop();
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

  // Audio countdown for final 3 seconds of an exercise phase
  useEffect(() => {
    if (!timerOn || isPaused || screen !== "exercise" || !voiceOn) return;
    if (timeLeft > 0 && timeLeft <= 3) {
      coach.shutUp();
      coach.say(timeLeft.toString());
    }
  }, [timeLeft, timerOn, isPaused, screen, voiceOn]);

  // Audio countdown for final 3 seconds of break
  useEffect(() => {
    if (screen !== "break" || !voiceOn) return;
    if (breakLeft > 0 && breakLeft <= 3) {
      coach.shutUp();
      coach.say(breakLeft.toString());
    }
  }, [breakLeft, screen, voiceOn]);

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
        const nextPhase = phases[next];
        if (voiceOn) {
          if (nextPhase.label === "REST") {
            coach.say("Rest.");
          } else {
            const prompt = phasePrompt(nextPhase.label);
            if (prompt) coach.say(prompt);
          }
        }
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
        const nextPhase = phases[next];
        if (voiceOn) {
          if (nextPhase.label === "REST") {
            coach.say("Rest.");
          } else {
            const prompt = phasePrompt(nextPhase.label);
            if (prompt) coach.say(prompt);
          }
        }
        setPhaseIdx(next);
        if (nextPhase.isPrompt) {
          setTimeLeft(0);
          setTimerOn(false);
          coach.startListening(3000);
        } else {
          setTimeLeft(nextPhase.duration);
          setTimerOn(true);
        }
      } else {
        const nextRep = rep + 1;
        if (nextRep < ex.reps!) {
          playTing(audioCtxRef, "phase");
          if (voiceOn) {
            coach.say(getPhaseStartSpeech(ex, phases[0], nextRep));
          }
          setRep(nextRep);
          setPhaseIdx(0);
          setBuddySeed(s => s + 1);
          if (phases[0].isPrompt) {
            setTimeLeft(0);
            setTimerOn(false);
            coach.startListening(3000);
          } else {
            setTimeLeft(phases[0].duration);
            setTimerOn(true);
          }
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
        if (voiceOn) coach.say(roundPrompt(nextRound, ex.rounds!));
        setRound(nextRound);
        setBuddySeed(s => s + 1);
        setTimeLeft(ex.duration!);
        setTimerOn(true);
      } else {
        beginBreak();
      }
    }
  }

  function handlePromptPhaseDone() {
    if (screen !== "exercise") return;
    const phases = ex.phases!;
    if (phaseIdx < phases.length - 1) {
      const next = phaseIdx + 1;
      playTing(audioCtxRef, "phase");
      const nextPhase = phases[next];
      if (voiceOn) {
        if (nextPhase.label === "REST") {
          coach.say("Rest.");
        } else {
          const prompt = phasePrompt(nextPhase.label);
          if (prompt) coach.say(prompt);
        }
      }
      setPhaseIdx(next);
      if (nextPhase.isPrompt) {
        setTimeLeft(0);
        setTimerOn(false);
        coach.startListening(3000);
      } else {
        setTimeLeft(nextPhase.duration);
        setTimerOn(true);
      }
    } else {
      const nextRep = rep + 1;
      if (nextRep < ex.reps!) {
        playTing(audioCtxRef, "phase");
        if (voiceOn) {
          coach.say(getPhaseStartSpeech(ex, phases[0], nextRep));
        }
        setRep(nextRep);
        setPhaseIdx(0);
        setBuddySeed(s => s + 1);
        if (phases[0].isPrompt) {
          setTimeLeft(0);
          setTimerOn(false);
          coach.startListening(3000);
        } else {
          setTimeLeft(phases[0].duration);
          setTimerOn(true);
        }
      } else {
        beginBreak();
      }
    }
  }

  function beginBreak() {
    coach.stopListening();
    if (sessionId) {
      logExercise.mutate({
        id: sessionId,
        data: {
          exerciseId: ex.id,
          repsCompleted: ex.type === "rep-counter" ? rep : ex.reps || 1,
          durationSeconds: Math.max(1, Math.floor((Date.now() - exerciseStartRef.current) / 1000)),
        }
      });
    }
    if (exIdx >= TOTAL - 1) {
      playTing(audioCtxRef, "complete");
      if (voiceOn) coach.say(sessionCompletePrompt());
      finishSession();
      return;
    }
    playTing(audioCtxRef, "break-start");
    if (voiceOn) coach.say(breakStartPrompt());
    setBreakLeft(15);
    setScreen("break");
  }

  function advanceToNextExercise() {
    playTing(audioCtxRef, "break-end");
    if (voiceOn) coach.say(breakEndPrompt(EXERCISES[exIdx + 1]?.name ?? "Next exercise"));
    setExIdx(i => i + 1);
    setScreen("intro");
    setPhaseIdx(0);
    setRep(0);
    setRound(0);
    setItemIdx(0);
    setItemRep(0);
    setIsPaused(false);
    setBuddySeed(s => s + 1);
    exerciseStartRef.current = Date.now();
  }

  function handlePrevious() {
    if (exIdx > 0) {
      coach.shutUp();
      coach.stopListening();
      setExIdx(i => i - 1);
      setScreen("intro");
      setPhaseIdx(0);
      setRep(0);
      setRound(0);
      setItemIdx(0);
      setItemRep(0);
      setIsPaused(false);
      setBuddySeed(s => s + 1);
      exerciseStartRef.current = Date.now();
    }
  }

  function handleRestart() {
    coach.shutUp();
    coach.stopListening();
    handleStart();
  }

  function handleSkip() {
    coach.shutUp();
    coach.stopListening();
    beginBreak();
  }

  function finishSession() {
    coach.stopListening();
    gestureCam.stop();
    const dur = Math.max(1, Math.floor((Date.now() - sessionStartRef.current) / 1000));
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
    exerciseStartRef.current = Date.now();

    if (ex.type === "phase-once" || ex.type === "phase-rep") {
      const firstPhase = ex.phases![0];
      if (voiceOn) coach.say(getPhaseStartSpeech(ex, firstPhase, 0));
      if (firstPhase.isPrompt) {
        setTimeLeft(0);
        setTimerOn(false);
        coach.startListening(3000);
      } else {
        setTimeLeft(firstPhase.duration);
        setTimerOn(true);
      }
    } else if (ex.type === "countdown" || ex.type === "multi-round") {
      if (voiceOn) coach.say("Let's begin.");
      setTimeLeft(ex.duration!);
      setTimerOn(true);
    } else if (ex.type === "rep-counter") {
      const side = getSideFromName(ex.name);
      const sideStr = side ? ` ${side} side.` : "";
      if (voiceOn) coach.say(`Repetition 1.${sideStr} Start.`);
      coach.startListening(3000);
    } else if (ex.type === "flashcard") {
      if (voiceOn) coach.say(flashcardWordPrompt(ex.items![0], 0, ex.itemReps!));
      coach.startListening(2500);
    }
    setScreen("exercise");
  }

  // ── Auto-speak intro & auto-start ────────────────────────────────────────
  useEffect(() => {
    if (screen !== "intro" || !voiceOn) return;
    const introText = exerciseIntroPrompt(ex.name, ex.instruction);
    coach.say(introText, () => {
      // Auto-start after coach finishes speaking the intro
      setTimeout(() => handleStart(), 600);
    });
  }, [screen, exIdx]);

  // ── Rep counter tap (manual) ─────────────────────────────────────────────
  function handleRepTap() {
    if (repJustDoneRef.current) return;
    const next = rep + 1;
    setRep(next);
    setBuddySeed(s => s + 1);
    playTing(audioCtxRef, "phase");
    if (next >= ex.reps!) {
      repJustDoneRef.current = true;
      if (voiceOn) coach.say("Done!");
      setTimeout(() => {
        repJustDoneRef.current = false;
        beginBreak();
      }, 600);
    } else {
      if (voiceOn) {
        coach.say("Rest.");
        const side = getSideFromName(ex.name);
        const sideStr = side ? ` ${side} side.` : "";
        setTimeout(() => {
          if (screen === "exercise" && !isPaused) {
            coach.say(`Repetition ${next + 1}.${sideStr} Start.`);
          }
        }, 2000);
      }
    }
  }

  // ── Rep counter tap (from voice — silence detected) ─────────────────────
  function handleRepTapFromVoice() {
    if (repJustDoneRef.current) return;
    if (screen !== "exercise") return;
    const currentEx = EXERCISES[exIdx];
    if (!currentEx || currentEx.type !== "rep-counter") return;
    const next = rep + 1;
    setRep(next);
    setBuddySeed(s => s + 1);
    playTing(audioCtxRef, "phase");
    if (next >= currentEx.reps!) {
      repJustDoneRef.current = true;
      coach.stopListening();
      if (voiceOn) coach.say("Done!");
      setTimeout(() => {
        repJustDoneRef.current = false;
        beginBreak();
      }, 1000);
    } else {
      if (voiceOn) {
        coach.say("Rest.");
        const side = getSideFromName(currentEx.name);
        const sideStr = side ? ` ${side} side.` : "";
        coach.stopListening();
        setTimeout(() => {
          if (screen === "exercise" && !isPaused) {
            coach.say(`Repetition ${next + 1}.${sideStr} Start.`, () => {
              coach.startListening(3000);
            });
          } else {
            coach.startListening(3000);
          }
        }, 2000);
      } else {
        coach.startListening(3000);
      }
    }
  }

  // ── Flashcard rep tap (manual) ───────────────────────────────────────────
  function handleFlashcardTap() {
    const nextRep = itemRep + 1;
    playTing(audioCtxRef, "phase");
    if (nextRep >= ex.itemReps!) {
      const nextItem = itemIdx + 1;
      if (nextItem >= ex.items!.length) {
        beginBreak();
      } else {
        if (voiceOn) coach.say(flashcardNextWordPrompt(ex.items![nextItem]));
        setItemIdx(nextItem);
        setItemRep(0);
        setBuddySeed(s => s + 1);
      }
    } else {
      setItemRep(nextRep);
      if (voiceOn) coach.say(flashcardWordPrompt(ex.items![itemIdx], nextRep, ex.itemReps!));
    }
  }

  // ── Flashcard tap (from voice — silence detected) ───────────────────────
  function handleFlashcardTapFromVoice() {
    if (screen !== "exercise") return;
    const currentEx = EXERCISES[exIdx];
    if (!currentEx || currentEx.type !== "flashcard") return;
    const nextRep = itemRep + 1;
    playTing(audioCtxRef, "phase");
    if (nextRep >= currentEx.itemReps!) {
      const nextItem = itemIdx + 1;
      if (nextItem >= currentEx.items!.length) {
        coach.stopListening();
        beginBreak();
      } else {
        if (voiceOn) coach.say(flashcardNextWordPrompt(currentEx.items![nextItem]));
        setItemIdx(nextItem);
        setItemRep(0);
        setBuddySeed(s => s + 1);
        coach.startListening(2500);
      }
    } else {
      setItemRep(nextRep);
      if (voiceOn) coach.say(flashcardWordPrompt(currentEx.items![itemIdx], nextRep, currentEx.itemReps!));
      coach.startListening(2500);
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

        <div onClick={toggleVoice} className="cursor-pointer" title={voiceOn ? "Tap to mute" : "Tap to unmute"}>
          {voiceOn ? (
            <ListeningIndicator
              isListening={coach.isListening}
              isHearing={coach.isHearingUser}
              isSpeaking={coach.isSpeaking}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-black/5 flex items-center justify-center text-lg">🔇</div>
          )}
        </div>
      </header>

      {/* Camera PiP + Thumbs-up indicator */}
      <div className="px-5 pb-2 flex items-center gap-3 z-10">
        {/* Camera preview */}
        <div
          className={`relative rounded-xl overflow-hidden shadow-sm border border-border transition-all ${
            showCamPreview ? "w-20 h-15" : "w-0 h-0 opacity-0"
          }`}
          onClick={() => setShowCamPreview(p => !p)}
        >
          <video
            ref={gestureCam.videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            muted
            playsInline
          />
          {gestureCam.isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!gestureCam.isActive && !gestureCam.isLoading && (
            <div
              className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
              onClick={(e) => { e.stopPropagation(); gestureCam.start(); }}
            >
              <Camera className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Thumbs up flash */}
        <AnimatePresence>
          {gestureCam.gesture === "Thumb_Up" && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Next!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar (moved inline) */}
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
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
                          {currentPhase.isPrompt ? (
                            <div className="flex flex-col items-center justify-center gap-1 cursor-pointer" onClick={handlePromptPhaseDone}>
                              <span className="text-4xl">✓</span>
                              <div className="text-[10px] font-black tracking-widest uppercase px-2" style={{ color: currentPhase.color }}>
                                Tap when Done
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-5xl font-black" style={{ color: currentPhase.color }}>
                                {timeLeft}
                              </div>
                              <div className="text-xs font-black tracking-widest mt-1" style={{ color: currentPhase.color }}>
                                {currentPhase.label}
                              </div>
                            </>
                          )}
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

                  {currentPhase.isPrompt && (
                    <Button
                      size="lg"
                      className="rounded-full h-12 px-10 text-lg font-bold shadow-md bg-primary text-primary-foreground"
                      onClick={handlePromptPhaseDone}
                    >
                      Done ✓
                    </Button>
                  )}
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

              {/* Media Control Bar */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-11 w-11 bg-white/60 hover:bg-white/80 border-black/10"
                  onClick={handlePrevious}
                  disabled={exIdx === 0}
                  title="Previous Exercise"
                >
                  <SkipBack className="h-5 w-5 text-foreground" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-11 w-11 bg-white/60 hover:bg-white/80 border-black/10"
                  onClick={handleRestart}
                  title="Restart Exercise"
                >
                  <RotateCcw className="h-5 w-5 text-foreground" />
                </Button>

                <Button
                  variant="default"
                  size="lg"
                  className="rounded-full h-12 px-8 font-bold shadow-md min-w-[120px]"
                  onClick={() => setIsPaused(p => !p)}
                >
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4 fill-current" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4 fill-current" /> Pause
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-11 w-11 bg-white/60 hover:bg-white/80 border-black/10"
                  onClick={handleSkip}
                  title="Skip Exercise"
                >
                  <SkipForward className="h-5 w-5 text-foreground" />
                </Button>
              </div>

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
