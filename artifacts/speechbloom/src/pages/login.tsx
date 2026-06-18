import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, Mic } from "lucide-react";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Login failed");
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-secondary rounded-full opacity-60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-[#A8D8FF]/40 rounded-full opacity-50 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm space-y-8 z-10"
      >
        <div className="text-center space-y-4">
          <img src="/logo.png" alt="SpeechBloom Logo" className="w-24 h-24 mx-auto object-contain rounded-2xl shadow-md" />
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">SpeechBloom</h1>
            <p className="text-muted-foreground mt-1 font-medium">Your speech therapy companion</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Your name</label>
            <Input
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-13 rounded-2xl bg-white border-border text-base font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Email address</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-13 rounded-2xl bg-white border-border text-base font-medium"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm font-medium text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full rounded-full h-14 text-lg font-bold shadow-md mt-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Enter your email to sign in or create your free account.
        </p>
      </motion.div>
    </div>
  );
}
