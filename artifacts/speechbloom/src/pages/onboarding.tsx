import { useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useOnboardUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mic, Activity, Wind, Speech, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const onboardMutation = useOnboardUser();
  const [step, setStep] = useState(1);

  // Form state
  const [goals, setGoals] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(10);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">SpeechBloom</h1>
          <p className="text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  if (user.onboardingComplete) {
    setLocation("/dashboard");
    return null;
  }

  const handleNext = () => setStep((s) => Math.min(4, s + 1));
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleComplete = async () => {
    try {
      await onboardMutation.mutateAsync({
        data: {
          name: user.name || "User",
          goals,
          dailyMinutes
        }
      });
      setLocation("/dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden p-6">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary rounded-full opacity-50 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#A8D8FF] rounded-full opacity-30 blur-3xl" />

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 text-center">
              <img src="/logo.png" alt="SpeechBloom Logo" className="w-32 h-32 mx-auto object-contain rounded-2xl shadow-md mb-8" />
              <h1 className="text-3xl font-bold text-foreground">Welcome to SpeechBloom</h1>
              <p className="text-muted-foreground text-lg">Your warm, encouraging, and therapeutic speech therapy companion.</p>
              <Button size="lg" className="w-full rounded-full h-14 text-lg font-bold shadow-md" onClick={handleNext}>
                Get Started
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">What would you like to improve?</h2>
                <p className="text-muted-foreground">Select all that apply.</p>
              </div>

              <div className="grid gap-3">
                {[
                  { id: "R pronunciation", icon: Speech },
                  { id: "Speech clarity", icon: Mic },
                  { id: "Tongue mobility", icon: Activity },
                  { id: "Voice strength", icon: Volume2 },
                  { id: "Breathing control", icon: Wind }
                ].map((item) => (
                  <Card key={item.id} className={`cursor-pointer transition-all ${goals.includes(item.id) ? 'border-accent bg-accent/10 shadow-sm' : 'border-transparent bg-white shadow-sm'}`} onClick={() => toggleGoal(item.id)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-full ${goals.includes(item.id) ? 'bg-accent text-white' : 'bg-secondary text-primary'}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-lg">{item.id}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" size="lg" className="flex-1 rounded-full h-14" onClick={handlePrev}>Back</Button>
                <Button size="lg" className="flex-1 rounded-full h-14" onClick={handleNext} disabled={goals.length === 0}>Next</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">How much time can you practice daily?</h2>
                <p className="text-muted-foreground">Consistency is key.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[5, 10, 15, 20].map((mins) => (
                  <Card key={mins} className={`cursor-pointer transition-all ${dailyMinutes === mins ? 'border-accent bg-accent/10 shadow-sm' : 'border-transparent bg-white shadow-sm'}`} onClick={() => setDailyMinutes(mins)}>
                    <CardContent className="p-6 text-center space-y-2">
                      <div className="text-3xl font-bold">{mins}</div>
                      <div className="text-muted-foreground font-medium">minutes</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" size="lg" className="flex-1 rounded-full h-14" onClick={handlePrev}>Back</Button>
                <Button size="lg" className="flex-1 rounded-full h-14" onClick={handleNext}>Next</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center">
              <div className="w-24 h-24 bg-[#C7F1D5] rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Activity className="h-12 w-12 text-[#2E8B57]" />
              </div>
              <h2 className="text-3xl font-bold">You're all set!</h2>
              <p className="text-muted-foreground text-lg">We've personalized your therapy plan for {dailyMinutes} minutes a day.</p>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 text-left border border-border">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Goals</div>
                  <div className="font-semibold text-lg">{goals.join(", ")}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Daily Practice</div>
                  <div className="font-semibold text-lg">{dailyMinutes} minutes</div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" size="lg" className="flex-1 rounded-full h-14" onClick={handlePrev}>Back</Button>
                <Button size="lg" className="flex-1 rounded-full h-14" onClick={handleComplete} disabled={onboardMutation.isPending}>
                  {onboardMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Journey"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
