import { useState } from "react";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface QA {
  question: string;
  answer: string;
}

interface AskAIProps {
  cardType: "note" | "event" | "contact";
  cardData: any;
}

export function AskAI({ cardType, cardData }: AskAIProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QA[]>([]);

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ask-card", {
        body: { question: q, cardType, cardData },
      });
      if (error) throw error;
      setHistory((prev) => [...prev, { question: q, answer: data.answer }]);
    } catch (err: any) {
      setHistory((prev) => [...prev, { question: q, answer: `Error: ${err.message || "Failed to get answer"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {!open ? (
        <Button size="sm" variant="outline" className="w-full text-xs gap-1.5" onClick={() => setOpen(true)}>
          <MessageCircle className="w-3.5 h-3.5" />
          Ask AI about this
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border border-border/50 rounded-lg p-3 bg-muted/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ask AI</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setOpen(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {history.map((qa, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                <p className="text-xs text-primary font-medium">Q: {qa.question}</p>
                <p className="text-sm text-foreground/80 bg-background/50 rounded p-2">{qa.answer}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking...
            </div>
          )}

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="text-sm h-8"
              disabled={loading}
            />
            <Button size="sm" type="submit" disabled={loading || !question.trim()} className="h-8 px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
