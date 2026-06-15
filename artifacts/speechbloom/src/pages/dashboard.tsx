import { useGetMe, useGetProgressSummary, useListAchievements } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Play, Flame, Trophy, Quote } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: summary, isLoading: summaryLoading } = useGetProgressSummary();
  const { data: achievements } = useListAchievements();

  if (userLoading || summaryLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const earnedAchievements = achievements?.filter(a => a.earned) || [];
  const recentAchievement = earnedAchievements[earnedAchievements.length - 1];

  return (
    <Layout>
      <div className="p-6 space-y-8 pb-24">
        <header className="flex justify-between items-center pt-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hi, {user.name}</h1>
            <p className="text-muted-foreground">Ready for today's practice?</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border-2 border-background shadow-sm">
            <span className="text-xl">😊</span>
          </div>
        </header>

        {/* Streak Card */}
        <Card className="bg-gradient-to-br from-primary to-[#FFCA28] border-none text-primary-foreground shadow-md relative overflow-hidden">
          <div className="absolute right-[-20%] top-[-20%] w-[50%] h-[150%] bg-white/20 rounded-full blur-2xl" />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-primary-foreground/80 font-medium">Current Streak</p>
              <div className="text-4xl font-black flex items-baseline gap-2">
                {summary?.currentStreak || 0} <span className="text-xl font-semibold">days</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Flame className="h-8 w-8 text-white fill-white" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold">Today's Goal</h2>
            <span className="text-sm font-semibold text-accent">{Math.round(summary?.todayCompletionPercent || 0)}% Complete</span>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border flex items-center justify-between gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              {/* Simple SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--secondary))" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--accent))" strokeWidth="8" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 - (251.2 * (summary?.todayCompletionPercent || 0)) / 100} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{Math.round(summary?.todayCompletionPercent || 0)}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground font-medium">Continue your path to better speech.</p>
              <Button onClick={() => setLocation("/session")} className="w-full rounded-full shadow-sm bg-accent hover:bg-accent/90 text-white font-bold h-12">
                <Play className="mr-2 h-5 w-5 fill-current" /> Start Session
              </Button>
            </div>
          </div>
        </section>

        {/* Daily Quote */}
        <Card className="bg-secondary/50 border-none shadow-none">
          <CardContent className="p-6 text-center space-y-3">
            <Quote className="h-8 w-8 text-primary/50 mx-auto" />
            <p className="text-foreground/80 font-medium italic">"Small steps every day lead to big changes."</p>
          </CardContent>
        </Card>

        {/* Recent Achievement */}
        {recentAchievement && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Recent Achievement</h2>
            <Card className="border-border shadow-sm bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#FFF6D8] flex items-center justify-center text-2xl">
                  {recentAchievement.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{recentAchievement.name}</h3>
                  <p className="text-sm text-muted-foreground">{recentAchievement.description}</p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
}
