import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListExercises, useCreateSession, useLogExercise, useUpdateSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Pause, Play, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function Session() {
  const [, setLocation] = useLocation();
  const { data: exercises, isLoading: exercisesLoading } = useListExercises();
  const createSessionMutation = useCreateSession();
  const logExerciseMutation = useLogExercise();
  const updateSessionMutation = useUpdateSession();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);

  const sessionExercises = exercises?.slice(0, 10) || []; // Just take first 10 for a typical session
  const currentExercise = sessionExercises[currentIndex];

  useEffect(() => {
    if (sessionExercises.length > 0 && !sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate({ data: { totalExercises: sessionExercises.length } }, {
        onSuccess: (data) => setSessionId(data.id)
      });
    }
  }, [sessionExercises.length, sessionId, createSessionMutation]);

  useEffect(() => {
    if (currentExercise) {
      setTimeLeft(currentExercise.durationSeconds || 30);
      setCurrentReps(0);
      setIsPlaying(false);
    }
  }, [currentIndex, currentExercise]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0 && currentExercise?.exerciseType === 'timer') {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      handleExerciseComplete();
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, currentExercise]);

  const handleExerciseComplete = async () => {
    if (!sessionId || !currentExercise) return;
    
    await logExerciseMutation.mutateAsync({
      id: sessionId,
      data: {
        exerciseId: currentExercise.id,
        repsCompleted: currentReps || currentExercise.reps || 1,
        durationSeconds: currentExercise.durationSeconds ? (currentExercise.durationSeconds - timeLeft) : 30
      }
    });

    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      await updateSessionMutation.mutateAsync({
        id: sessionId,
        data: { completed: true, durationSeconds: 600 } // Mock 10 mins
      });
      setLocation("/session-complete");
    }
  };

  if (exercisesLoading || !currentExercise) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = ((currentIndex) / sessionExercises.length) * 100;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative max-w-md mx-auto w-full">
      <header className="p-6 flex items-center justify-between z-10">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/dashboard")}>
          <X className="h-6 w-6" />
        </Button>
        <div className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
          Exercise {currentIndex + 1} of {sessionExercises.length}
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 pb-2">
        <Progress value={progress} className="h-2 bg-secondary" />
      </div>

      <div className="flex-1 flex flex-col p-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentExercise.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center space-y-4 mb-8">
              <span className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {currentExercise.category}
              </span>
              <h1 className="text-3xl font-black text-foreground leading-tight">{currentExercise.name}</h1>
              <p className="text-lg text-muted-foreground">{currentExercise.instructions}</p>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              {currentExercise.exerciseType === 'timer' ? (
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <motion.div 
                    className="absolute inset-0 bg-primary/20 rounded-full"
                    animate={isPlaying ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                  <div className="w-48 h-48 bg-[#FFF6D8] rounded-full flex items-center justify-center shadow-lg border-8 border-white z-10">
                    <span className="text-6xl font-black text-primary">{timeLeft}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="text-8xl font-black text-accent">{currentReps} <span className="text-4xl text-muted-foreground">/ {currentExercise.reps}</span></div>
                  <Button 
                    size="lg" 
                    className="rounded-full h-16 w-32 text-xl font-bold bg-accent hover:bg-accent/90"
                    onClick={() => {
                      const newReps = currentReps + 1;
                      setCurrentReps(newReps);
                      if (newReps >= (currentExercise.reps || 1)) {
                        setTimeout(handleExerciseComplete, 500);
                      }
                    }}
                  >
                    +1 Rep
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-8 flex justify-center gap-6">
              {currentExercise.exerciseType === 'timer' && (
                <Button 
                  size="icon" 
                  className={`h-20 w-20 rounded-full shadow-lg transition-transform active:scale-95 ${isPlaying ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}`}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
              )}
              
              {currentExercise.exerciseType !== 'reps' && (
                <Button 
                  className="h-20 px-8 rounded-full text-lg font-bold bg-accent hover:bg-accent/90 text-white shadow-lg"
                  onClick={handleExerciseComplete}
                >
                  Skip <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
