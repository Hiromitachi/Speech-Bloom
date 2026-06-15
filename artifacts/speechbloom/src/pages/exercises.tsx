import { Layout } from "@/components/layout";
import { useListExercises } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlayCircle, Clock, RotateCw } from "lucide-react";

export default function Exercises() {
  const { data: exercises, isLoading } = useListExercises();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const groupedExercises = exercises?.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {} as Record<string, typeof exercises>) || {};

  return (
    <Layout>
      <div className="p-6 pb-24 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
          <p className="text-muted-foreground">Browse all available exercises by category.</p>
        </header>

        {Object.entries(groupedExercises).map(([category, exs]) => (
          <section key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-foreground capitalize">{category}</h2>
            <div className="grid gap-4">
              {exs.map((ex) => (
                <Card key={ex.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0">
                      <PlayCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{ex.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ex.instructions}</p>
                      
                      <div className="flex gap-4 mt-3 text-xs font-semibold text-muted-foreground">
                        {ex.durationSeconds && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {ex.durationSeconds}s
                          </div>
                        )}
                        {ex.reps && (
                          <div className="flex items-center gap-1">
                            <RotateCw className="h-3 w-3" />
                            {ex.reps} reps
                          </div>
                        )}
                        <span className="capitalize bg-muted px-2 py-0.5 rounded-full text-[10px]">
                          {ex.exerciseType}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
