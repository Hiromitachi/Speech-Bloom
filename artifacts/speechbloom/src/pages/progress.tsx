import { Layout } from "@/components/layout";
import { useGetProgressSummary, useGetWeeklyProgress, useGetCategoryStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Clock, Activity, CalendarDays, Award } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Progress() {
  const { data: summary, isLoading: summaryLoading } = useGetProgressSummary();
  const { data: weeklyData, isLoading: weeklyLoading } = useGetWeeklyProgress();
  const { data: categoryStats, isLoading: categoryLoading } = useGetCategoryStats();

  if (summaryLoading || weeklyLoading || categoryLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 pb-24 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Your Progress</h1>
          <p className="text-muted-foreground">See how far you've come.</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#FFF6D8] border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-accent">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-foreground">{summary?.totalSessions || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sessions</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#C7F1D5] border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#2E8B57]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-foreground">{summary?.totalMinutes || 0}m</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time Practiced</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', {weekday: 'short'})} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="minutesPracticed" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorMins)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Mastery */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Category Mastery</h2>
          <div className="space-y-3">
            {categoryStats?.map((stat) => (
              <div key={stat.category} className="bg-white p-4 rounded-2xl shadow-sm border border-border flex items-center gap-4">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--primary))" strokeWidth="10" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * stat.masteryPercent) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{Math.round(stat.masteryPercent)}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold capitalize">{stat.category}</h3>
                  <p className="text-sm text-muted-foreground">{stat.exercisesCompleted} exercises completed</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
