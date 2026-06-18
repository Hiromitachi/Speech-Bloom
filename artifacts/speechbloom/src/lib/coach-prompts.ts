// ─── Coach Prompts ──────────────────────────────────────────────────────────
// Short, warm prompts. Not too chatty — just enough to guide.
// ─────────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Phase transitions (kept short) ─────────────────────────────────────────

const PHASE_PROMPTS: Record<string, string[]> = {
  INHALE: ["Breathe in.", "Inhale."],
  HOLD: ["Hold.", "Hold it."],
  EXHALE: ["Breathe out.", "Exhale."],
  PAUSE: ["Pause.", "Rest."],
  SPEAK: ["Speak.", "Go ahead."],
  PHONATE: ["Phonate. Aaaaa.", "Aaaaa."],
  TRILL: ["Trill. Drrrr.", "Drrrr."],
};

const VOWEL_PROMPTS: Record<string, string[]> = {
  Aaaaa: ['Aaaaa.', 'Say Aaaaa.'],
  Iiiii: ['Iiiii.', 'Say Iiiii.'],
  Uuuuu: ['Uuuuu.', 'Say Uuuuu.'],
};

export function phasePrompt(label: string): string {
  if (VOWEL_PROMPTS[label]) return pick(VOWEL_PROMPTS[label]);
  if (PHASE_PROMPTS[label]) return pick(PHASE_PROMPTS[label]);
  return `Say ${label}`;
}

// ─── Exercise intro (short — just name + one line) ──────────────────────────

export function exerciseIntroPrompt(name: string, _instruction: string): string {
  return pick([
    `Next: ${name}. Ready?`,
    `${name}. Let's go.`,
    `Time for ${name}.`,
  ]);
}

// ─── Rep counter ────────────────────────────────────────────────────────────

export function repStartPrompt(_name: string, totalReps: number): string {
  return `${totalReps} reps. Go.`;
}

export function repCountPrompt(current: number, total: number): string {
  if (current === total) return pick(["Done!", "All done."]);
  if (current === total - 1) return "One more.";
  return `${current}.`;
}

// ─── Flashcard ──────────────────────────────────────────────────────────────

export function flashcardWordPrompt(word: string, repNum: number, totalReps: number): string {
  if (repNum === 0) return `"${word}".`;
  if (repNum === totalReps - 1) return `"${word}", last time.`;
  return `"${word}" again.`;
}

export function flashcardNextWordPrompt(word: string): string {
  return `Next: "${word}".`;
}

// ─── Round labels ───────────────────────────────────────────────────────────

export function roundPrompt(round: number, total: number): string {
  if (round === total - 1) return "Last round.";
  return `Round ${round + 1}.`;
}

// ─── Break ──────────────────────────────────────────────────────────────────

export function breakStartPrompt(): string {
  return pick(["Good. Take a break.", "Rest.", "Nice work. Pause."]);
}

export function breakEndPrompt(nextExerciseName: string): string {
  return `Next: ${nextExerciseName}.`;
}

// ─── Session complete ───────────────────────────────────────────────────────

export function sessionCompletePrompt(): string {
  return pick(["Session complete. Well done!", "All done. Great job!"]);
}

// ─── Voice commands ─────────────────────────────────────────────────────────

export function pauseAckPrompt(): string {
  return "Paused. Say resume.";
}

export function resumeAckPrompt(): string {
  return "Resuming.";
}

export function skipAckPrompt(): string {
  return "Skipping.";
}

export function repeatAckPrompt(): string {
  return "Restarting.";
}

export function silenceNudgePrompt(): string {
  return "Ready when you are.";
}
