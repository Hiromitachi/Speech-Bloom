import { db, exercisesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export const SEED_EXERCISES = [
  {
    id: 1,
    name: "Abdominal Breathing",
    category: "breathing",
    instructions: "Place one hand on your chest and one on your abdomen. Breathe using your abdomen, not your chest.",
    reps: 3,
    durationSeconds: 25,
    exerciseType: "timer",
    sortOrder: 1,
  },
  {
    id: 2,
    name: "Effortful Swallow",
    category: "swallowing",
    instructions: "Swallow hard, as if swallowing a large bite. Feel the muscles in your throat work.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 2,
  },
  {
    id: 3,
    name: "Masako Maneuver",
    category: "swallowing",
    instructions: "Hold your tongue gently between your teeth. Swallow while keeping your tongue forward.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 3,
  },
  {
    id: 4,
    name: "Tongue Side to Side",
    category: "tongue",
    instructions: "Move your tongue slowly from corner to corner. Touch the inside of each cheek.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 4,
  },
  {
    id: 5,
    name: "Tongue Up and Down",
    category: "tongue",
    instructions: "Stretch your tongue up toward your nose, then down toward your chin.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 5,
  },
  {
    id: 6,
    name: "Tongue Round Movement",
    category: "tongue",
    instructions: "Move your tongue in a full circle around the outside of your lips.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 6,
  },
  {
    id: 7,
    name: "Tongue Resistance",
    category: "tongue",
    instructions: "Press your tongue firmly against the roof of your mouth or against a clean spoon for resistance.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 7,
  },
  {
    id: 8,
    name: "Cheek Puff Breathing",
    category: "breathing",
    instructions: "Fill your cheeks with air, puff both out, then slowly release.",
    reps: 6,
    durationSeconds: 25,
    exerciseType: "timer",
    sortOrder: 8,
  },
  {
    id: 9,
    name: "Cheek Side to Side",
    category: "vocal",
    instructions: "Push the air from your left cheek over to your right cheek, back and forth.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 9,
  },
  {
    id: 10,
    name: "A-I-U Sustained Phonation",
    category: "vocal",
    instructions: "Take a breath (5 sec inhale). Sustain \"Aaa...\" for 5 seconds. Immediately transition to \"Iii...\" for 5 seconds. Immediately transition to \"Uuu...\" for 5 seconds. This entire sequence counts as ONE repetition.",
    reps: 5,
    durationSeconds: 29,
    exerciseType: "timer",
    sortOrder: 10,
  },
  {
    id: 11,
    name: "Pa Pa Pa",
    category: "vocal",
    instructions: "Say \"Pa Pa Pa\" clearly and rhythmically. Keep a steady beat through each round.",
    reps: 6,
    durationSeconds: 8,
    exerciseType: "timer",
    sortOrder: 11,
  },
  {
    id: 12,
    name: "Pa Da Ka",
    category: "vocal",
    instructions: "Say \"Pa Da Ka\" clearly and rhythmically. Keep a steady beat through each round.",
    reps: 6,
    durationSeconds: 8,
    exerciseType: "timer",
    sortOrder: 12,
  },
  {
    id: 13,
    name: "Deep Inhalation & Phonate A",
    category: "vocal",
    instructions: "Take a deep breath, then say \"Aaaaa\" steadily for as long as you can while exhaling.",
    reps: 6,
    durationSeconds: 20,
    exerciseType: "timer",
    sortOrder: 13,
  },
  {
    id: 14,
    name: "Head Tilt Left & Phonate",
    category: "vocal",
    instructions: "Gently tilt your head to the left. Breathe in, then say \"Aaaaa\" while exhaling.",
    reps: 3,
    durationSeconds: 20,
    exerciseType: "timer",
    sortOrder: 14,
  },
  {
    id: 15,
    name: "Head Tilt Right & Phonate",
    category: "vocal",
    instructions: "Gently tilt your head to the right. Breathe in, then say \"Aaaaa\" while exhaling.",
    reps: 3,
    durationSeconds: 20,
    exerciseType: "timer",
    sortOrder: 15,
  },
  {
    id: 16,
    name: "Tongue Trill",
    category: "vocal",
    instructions: "Say \"Drrrrrr\" continuously, rolling your tongue. Hold the trill for the full duration.",
    reps: 6,
    durationSeconds: 15,
    exerciseType: "timer",
    sortOrder: 16,
  },
  {
    id: 17,
    name: "R Word Practice",
    category: "vocal",
    instructions: "Say each word clearly, 3 times. Tap \"Said it!\" after each repetition.",
    reps: 20,
    exerciseType: "reps",
    sortOrder: 17,
  },
  {
    id: 18,
    name: "R Sound Practice",
    category: "vocal",
    instructions: "Blend each R sound slowly and clearly, 3 times. Tap \"Said it!\" after each repetition.",
    reps: 6,
    exerciseType: "reps",
    sortOrder: 18,
  },
  {
    id: 19,
    name: "Super-Supraglottic Swallow",
    category: "swallowing",
    instructions: "1. Take a deep breath.\n2. Hold your breath tightly.\n3. Bear down gently as if lifting something heavy.\n4. Swallow while holding your breath.\n5. Cough immediately after swallowing.\n6. Swallow again.",
    reps: 5,
    durationSeconds: 13,
    exerciseType: "timer",
    sortOrder: 19,
  },
  {
    id: 20,
    name: "Front Tongue Resistance",
    category: "tongue",
    instructions: "Place a spoon in front of your tongue. Push against the spoon with your tongue. Hold firmly.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "timer",
    sortOrder: 20,
  },
  {
    id: 21,
    name: "Side Tongue Resistance (Left)",
    category: "tongue",
    instructions: "Press tongue against inside of left cheek. Use fingers on outside of cheek to provide resistance.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "bilateral",
    sortOrder: 21,
  },
  {
    id: 22,
    name: "Side Tongue Resistance (Right)",
    category: "tongue",
    instructions: "Press tongue against inside of right cheek. Use fingers on outside of cheek to provide resistance.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "bilateral",
    sortOrder: 22,
  },
  {
    id: 23,
    name: "Spoon Bite (Left)",
    category: "jaw",
    instructions: "Bite gently but firmly on a spoon on the left side of your mouth.",
    reps: 5,
    durationSeconds: 5,
    exerciseType: "bilateral",
    sortOrder: 23,
  },
  {
    id: 24,
    name: "Spoon Bite (Right)",
    category: "jaw",
    instructions: "Bite gently but firmly on a spoon on the right side of your mouth.",
    reps: 5,
    durationSeconds: 5,
    exerciseType: "bilateral",
    sortOrder: 24,
  },
  {
    id: 25,
    name: "Spoon Hold (Left)",
    category: "jaw",
    instructions: "Place spoon between teeth on the left side. Hold steadily.",
    reps: 1,
    durationSeconds: 5,
    exerciseType: "bilateral",
    sortOrder: 25,
  },
  {
    id: 26,
    name: "Spoon Hold (Right)",
    category: "jaw",
    instructions: "Place spoon between teeth on the right side. Hold steadily.",
    reps: 1,
    durationSeconds: 5,
    exerciseType: "bilateral",
    sortOrder: 26,
  },
  {
    id: 27,
    name: "Head Turn Left & Phonate",
    category: "vocal",
    instructions: "Turn head to the left side. Sustain \"AAA\" continuously.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "bilateral",
    sortOrder: 27,
  },
  {
    id: 28,
    name: "Head Turn Right & Phonate",
    category: "vocal",
    instructions: "Turn head to the right side. Sustain \"AAA\" continuously.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "bilateral",
    sortOrder: 28,
  },
  {
    id: 29,
    name: "Straw Blowing",
    category: "sovt",
    instructions: "Blow steadily and continuously through a straw.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "timer",
    sortOrder: 29,
  },
  {
    id: 30,
    name: "Straw Phonation (UUU)",
    category: "sovt",
    instructions: "Produce a continuous \"UUU\" sound through a straw.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "timer",
    sortOrder: 30,
  },
  {
    id: 31,
    name: "Wall Push with Voice",
    category: "pushing",
    instructions: "Push firmly against a wall. Produce \"AAA\" continuously.",
    reps: 5,
    durationSeconds: 8,
    exerciseType: "timer",
    sortOrder: 31,
  },
];

export async function seedExercises() {
  try {
    logger.info("Checking database exercise definitions...");
    const existing = await db.select().from(exercisesTable);
    const existingMap = new Map(existing.map(e => [e.id, e]));

    for (const ex of SEED_EXERCISES) {
      const exist = existingMap.get(ex.id);
      if (exist) {
        // Update if anything changed
        if (
          exist.name !== ex.name ||
          exist.category !== ex.category ||
          exist.instructions !== ex.instructions ||
          exist.reps !== ex.reps ||
          exist.durationSeconds !== ex.durationSeconds ||
          exist.exerciseType !== ex.exerciseType ||
          exist.sortOrder !== ex.sortOrder
        ) {
          logger.info(`Updating exercise ID ${ex.id} (${ex.name})...`);
          await db
            .update(exercisesTable)
            .set({
              name: ex.name,
              category: ex.category,
              instructions: ex.instructions,
              reps: ex.reps,
              durationSeconds: ex.durationSeconds,
              exerciseType: ex.exerciseType,
              sortOrder: ex.sortOrder,
            })
            .where(eq(exercisesTable.id, ex.id));
        }
      } else {
        logger.info(`Inserting new exercise ID ${ex.id} (${ex.name})...`);
        await db.insert(exercisesTable).values(ex);
      }
    }
    logger.info("Exercises seeded and synchronized successfully!");
  } catch (err) {
    logger.error({ err }, "Failed to seed exercises");
  }
}
