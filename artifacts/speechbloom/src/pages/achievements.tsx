import { Layout } from "@/components/layout";
import { useListAchievements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Award, Lock } from "lucide-react";

export default function Achievements() {
  const { data: achievements, isLoading } = useListAchievements();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const earned = achievements?.filter(a => a.earned) || [];
  const locked = achievements?.filter(a => !a.earned) || [];

  return (
    <Layout>
      <div className="p-6 pb-24 space-y-8">
        <header className="space-y-2">
          <div className="w-16 h-16 bg-[#FFF6D8] rounded-full flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
          <p className="text-muted-foreground">Celebrate your milestones.</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Earned ({earned.length})</h2>
          <div className="grid grid-cols-2 gap-4">
            {earned.map((ach) => (
              <Card key={ach.id} className="bg-gradient-to-b from-white to-[#FFFDF7] border-accent/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                  <div className="text-4xl">{ach.icon}</div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">{ach.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ach.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {earned.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground bg-muted/50 rounded-2xl">
                Keep practicing to earn your first achievement!
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-muted-foreground">Locked</h2>
          <div className="grid grid-cols-2 gap-4">
            {locked.map((ach) => (
              <Card key={ach.id} className="bg-muted/30 border-none shadow-none opacity-60 grayscale hover:opacity-100 transition-opacity">
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                  <div className="text-4xl relative">
                    {ach.icon}
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-muted-foreground">{ach.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ach.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
