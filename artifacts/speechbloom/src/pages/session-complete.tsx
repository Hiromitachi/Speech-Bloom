import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Home, Star, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SessionComplete() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden p-6 justify-center">
      {/* Background celebration shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/20 rounded-full blur-2xl" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="max-w-md mx-auto w-full space-y-8 z-10"
      >
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-accent to-[#A8D8FF] rounded-full flex items-center justify-center shadow-lg mb-8 relative">
            <Trophy className="h-16 w-16 text-white" />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -right-2 bg-[#FFF6D8] p-2 rounded-full shadow-sm"
            >
              <Star className="h-6 w-6 text-primary fill-primary" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-black text-foreground">Incredible!</h1>
          <p className="text-xl text-muted-foreground">You've completed today's practice.</p>
        </div>

        <Card className="bg-white border-border shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className="p-6 text-center space-y-1 bg-[#FFFDF7]">
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Time</div>
                <div className="text-2xl font-black text-foreground">15<span className="text-sm font-medium text-muted-foreground ml-1">min</span></div>
              </div>
              <div className="p-6 text-center space-y-1 bg-[#FFFDF7]">
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">XP Earned</div>
                <div className="text-2xl font-black text-accent">+150</div>
              </div>
            </div>
            <div className="p-6 text-center bg-[#C7F1D5]/20">
              <div className="text-sm font-bold text-[#2E8B57] uppercase tracking-wider mb-2">Streak Extended</div>
              <div className="flex justify-center items-center gap-2">
                {[1,2,3,4,5].map((d, i) => (
                  <div key={d} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-[#2E8B57] text-white' : 'bg-white text-muted-foreground border border-border'}`}>
                    {['M','T','W','T','F'][i]}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 pt-4">
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
            className="w-full rounded-full h-14 text-lg font-bold bg-transparent"
          >
            <Share2 className="mr-2 h-5 w-5" /> Share Progress
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
