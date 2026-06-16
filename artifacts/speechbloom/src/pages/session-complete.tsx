import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Home, Star } from "lucide-react";
import { motion } from "framer-motion";

function parseStats() {
  const params = new URLSearchParams(window.location.search);
  const dur = parseInt(params.get("dur") || "0", 10);
  const ex = parseInt(params.get("ex") || "20", 10);
  const mins = Math.max(1, Math.round(dur / 60));
  return { mins, ex };
}

const MESSAGES = [
  "Great job! You completed today's full speech therapy routine.",
  "Incredible dedication! Your voice is getting stronger every session.",
  "You showed up today — that's everything. Well done!",
];

export default function SessionComplete() {
  const [, setLocation] = useLocation();
  const { mins, ex } = parseStats();
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden p-6 justify-center">
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#A8D8FF]/30 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C7F1D5]/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        className="max-w-sm mx-auto w-full space-y-8 z-10"
      >
        {/* Trophy */}
        <div className="text-center space-y-5">
          <div className="relative inline-block">
            <motion.div
              initial={{ rotate: -15, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="w-28 h-28 mx-auto bg-gradient-to-br from-primary to-[#FFCA28] rounded-full flex items-center justify-center shadow-xl"
            >
              <Trophy className="h-14 w-14 text-white" />
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.55, type: "spring" }}
              className="absolute -top-1 -right-1 bg-white p-1.5 rounded-full shadow-md"
            >
              <Star className="h-5 w-5 text-primary fill-primary" />
            </motion.div>
          </div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-4xl font-black text-foreground"
            >
              Incredible! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-muted-foreground mt-2 font-medium leading-relaxed px-2"
            >
              {message}
            </motion.p>
          </div>
        </div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white border-border shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-6 text-center space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</div>
                  <div className="text-3xl font-black text-foreground">
                    {mins}<span className="text-base font-semibold text-muted-foreground ml-1">min</span>
                  </div>
                </div>
                <div className="p-6 text-center space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exercises</div>
                  <div className="text-3xl font-black text-foreground">
                    {ex}<span className="text-base font-semibold text-muted-foreground ml-1">done</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-[#C7F1D5]/30 text-center border-t border-border">
                <p className="text-sm font-bold text-[#1E7A4A]">🌱 Keep it up — your streak is building!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="space-y-3"
        >
          <Button
            size="lg"
            className="w-full rounded-full h-14 text-lg font-bold shadow-md"
            onClick={() => setLocation("/dashboard")}
          >
            <Home className="mr-2 h-5 w-5" /> Back to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-full h-14 text-lg font-bold"
            onClick={() => setLocation("/session")}
          >
            🔁 Do it again
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
