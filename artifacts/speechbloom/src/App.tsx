import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import RPractice from "@/pages/r-practice";
import Session from "@/pages/session";
import SessionComplete from "@/pages/session-complete";
import Progress from "@/pages/progress";
import Achievements from "@/pages/achievements";
import Therapist from "@/pages/therapist";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (error && typeof error === "object" && "status" in error) {
          const status = (error as { status: number }).status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useGetMe();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || error) {
    return <Login />;
  }

  if (!user.onboardingComplete) {
    return <Onboarding />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      )} />
      <Route path="/dashboard" component={() => (
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      )} />
      <Route path="/exercises" component={() => (
        <AuthGuard>
          <Exercises />
        </AuthGuard>
      )} />
      <Route path="/r-practice" component={() => (
        <AuthGuard>
          <RPractice />
        </AuthGuard>
      )} />
      <Route path="/session" component={() => (
        <AuthGuard>
          <Session />
        </AuthGuard>
      )} />
      <Route path="/session-complete" component={() => (
        <AuthGuard>
          <SessionComplete />
        </AuthGuard>
      )} />
      <Route path="/progress" component={() => (
        <AuthGuard>
          <Progress />
        </AuthGuard>
      )} />
      <Route path="/achievements" component={() => (
        <AuthGuard>
          <Achievements />
        </AuthGuard>
      )} />
      <Route path="/therapist" component={() => (
        <AuthGuard>
          <Therapist />
        </AuthGuard>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
