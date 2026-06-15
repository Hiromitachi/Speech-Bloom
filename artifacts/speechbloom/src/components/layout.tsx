import { Link, useLocation } from "wouter";
import { Home, List, PlayCircle, BarChart2, Users } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Exercises", href: "/exercises", icon: List },
    { name: "R-Practice", href: "/r-practice", icon: PlayCircle },
    { name: "Progress", href: "/progress", icon: BarChart2 },
  ];

  if (user?.role === "therapist") {
    navItems.push({ name: "Patients", href: "/therapist", icon: Users });
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-16 md:pb-0 md:flex-row">
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl relative min-h-[100dvh]">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                  <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
