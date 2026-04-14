import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout
const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 minutes before expiry

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = useCallback(async () => {
    clearTimers();
    await supabase.auth.signOut();
    toast.info("You have been signed out.");
  }, []);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  };

  const resetInactivityTimer = useCallback(() => {
    if (!session) return;
    clearTimers();

    warningRef.current = setTimeout(() => {
      toast.warning("Your session will expire in 2 minutes due to inactivity.", { duration: 10000 });
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

    timeoutRef.current = setTimeout(() => {
      signOut();
      toast.error("Session expired due to inactivity.");
    }, SESSION_TIMEOUT_MS);
  }, [session, signOut]);

  // Track user activity to reset inactivity timer
  useEffect(() => {
    if (!session) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => resetInactivityTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, [session, resetInactivityTimer]);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      // Handle token refresh errors
      if (_event === "TOKEN_REFRESHED" && !session) {
        toast.error("Session could not be refreshed. Please sign in again.");
      }
      if (_event === "SIGNED_OUT") {
        clearTimers();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check token expiry on visibility change (tab focus)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && session) {
        const { data: { session: fresh }, error } = await supabase.auth.getSession();
        if (error || !fresh) {
          toast.error("Your session has expired. Please sign in again.");
          await supabase.auth.signOut();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
