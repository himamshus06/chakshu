import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Scan, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { EventResult } from "@/components/EventResult";
import { ContactResult } from "@/components/ContactResult";
import { NoteResult } from "@/components/NoteResult";
import { Dashboard } from "@/components/Dashboard";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type AnalysisResult = {
  classification: "event" | "contact" | "general";
  confidence: number;
  data: any;
};

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);

  const analyzeImage = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setShowDashboard(false);
    setCurrentImageBase64(base64);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      setResult(data as AnalysisResult);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const saveEvents = async (events: any[]) => {
    if (!user) return;
    try {
      const rows = events.map(event => ({
        name: event.name,
        date: event.date || null,
        time: event.time || null,
        location: event.location || null,
        description: event.description || null,
        user_id: user.id,
      }));
      const { error } = await supabase.from("events").insert(rows);
      if (error) throw error;
      toast.success("Events saved!");
      setResult(null);
      setShowDashboard(true);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const saveContacts = async (contacts: any[]) => {
    if (!user) return;
    try {
      const rows = contacts.map(contact => ({
        name: contact.name,
        phone: contact.phone || null,
        email: contact.email || null,
        company: contact.company || null,
        title: contact.title || null,
        user_id: user.id,
      }));
      const { error } = await supabase.from("contacts").insert(rows);
      if (error) throw error;
      toast.success("Contacts saved!");
      setResult(null);
      setShowDashboard(true);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const saveNote = async (data: any) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("notes").insert({
        title: data.title,
        summary: data.summary,
        key_facts: data.key_facts,
        tags: data.tags,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Note saved!");
      setResult(null);
      setShowDashboard(true);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const overrideClassification = (newClass: "event" | "contact" | "general") => {
    if (!result) return;
    setResult({ ...result, classification: newClass });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <AuthForm onSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container max-w-2xl flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Eye className="w-5 h-5 text-primary" />
              <Scan className="w-3 h-3 text-primary absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="font-display font-bold text-foreground">VisionMind</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setResult(null); setShowDashboard(!showDashboard); }}
              className="text-xs"
            >
              {showDashboard ? "New Scan" : "Dashboard"}
            </Button>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6 space-y-6">
        {/* Upload */}
        {!showDashboard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ImageUpload onImageSelected={analyzeImage} isAnalyzing={isAnalyzing} />
          </motion.div>
        )}

        {/* Classification Override */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={result.classification === "event" ? "default" : result.classification === "contact" ? "secondary" : "outline"}>
                    {result.classification.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((result.confidence || 0) * 100)}% confidence
                  </span>
                </div>
                <div className="flex gap-1">
                  {(["event", "contact", "general"] as const).filter(c => c !== result.classification).map(c => (
                    <Button key={c} size="sm" variant="ghost" className="text-xs h-7" onClick={() => overrideClassification(c)}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result?.classification === "event" && (
            <EventResult key="event" events={result.data.events || [result.data]} onSave={saveEvents} />
          )}
          {result?.classification === "contact" && (
            <ContactResult key="contact" contacts={result.data.contacts || [result.data]} onSave={saveContacts} />
          )}
          {result?.classification === "general" && (
            <NoteResult key="general" data={result.data} onSave={saveNote} />
          )}
        </AnimatePresence>

        {/* Dashboard */}
        {showDashboard && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Dashboard />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
