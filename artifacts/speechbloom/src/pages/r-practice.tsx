import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const R_WORDS = [
  "Ring", "Rock", "Roof", "Radio", "Rabbit", 
  "Roses", "Raisins", "Rectangle", "Red", "Rain", 
  "Run", "Raccoon", "Rope", "Rice", "Rocket", 
  "Read", "Remote", "Robot", "Ride", "Rug"
];

const ADVANCED_R = ["R + AH", "R + AY", "R + EE", "R + I", "R + O", "R + OO"];

export default function RPractice() {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [reps, setReps] = useState(0);

  const openCard = (word: string) => {
    setActiveWord(word);
    setReps(0);
  };

  return (
    <Layout>
      <div className="p-6 pb-24 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">R-Sound Practice</h1>
          <p className="text-muted-foreground">Master the tricky R-sound with targeted flashcards.</p>
        </header>

        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="words" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Words</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="words" className="mt-0">
            <div className="grid grid-cols-2 gap-4">
              {R_WORDS.map((word) => (
                <Card 
                  key={word} 
                  className="cursor-pointer hover:shadow-md transition-all active:scale-95 border-none shadow-sm bg-[#FFFDF7]"
                  onClick={() => openCard(word)}
                >
                  <CardContent className="p-6 text-center">
                    <span className="font-bold text-lg text-foreground">{word}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-0">
            <div className="grid grid-cols-2 gap-4">
              {ADVANCED_R.map((combo) => (
                <Card 
                  key={combo} 
                  className="cursor-pointer hover:shadow-md transition-all active:scale-95 border-none shadow-sm bg-[#FFF6D8]"
                  onClick={() => openCard(combo)}
                >
                  <CardContent className="p-6 text-center">
                    <span className="font-bold text-lg text-foreground">{combo}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Flashcard Modal */}
        <AnimatePresence>
          {activeWord && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setActiveWord(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl border border-border text-center space-y-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Practice</div>
                <div className="text-5xl font-black text-primary">{activeWord}</div>
                
                <div className="space-y-4">
                  <div className="text-6xl font-black text-accent">{reps}</div>
                  <div className="text-sm font-semibold text-muted-foreground uppercase">Reps completed</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveWord(null)}
                    className="py-4 rounded-xl font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    Done
                  </button>
                  <button 
                    onClick={() => setReps(r => r + 1)}
                    className="py-4 rounded-xl font-bold bg-accent text-white shadow-sm hover:opacity-90 transition-opacity active:scale-95"
                  >
                    +1 Rep
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
