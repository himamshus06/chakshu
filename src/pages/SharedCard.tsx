import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Scan, FileText, Calendar, User, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SharedCard() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [cardData, setCardData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      // Get share record
      const { data: share, error: shareErr } = await supabase
        .from("shared_cards")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (shareErr || !share) {
        setLoading(false);
        return;
      }
      setShareInfo(share);

      // Fetch the actual card data via edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke("get-shared-card", {
        body: { share_token: token },
      });

      if (!error && data) {
        setCardData(data);
      }
      setLoading(false);
    })();
  }, [token]);

  const saveToMyAccount = async () => {
    if (!user || !cardData || !shareInfo) {
      toast.error("Please sign in to save this card.");
      return;
    }
    setSaving(true);
    try {
      const type = shareInfo.card_type;
      if (type === "note") {
        const { error } = await supabase.from("notes").insert({
          title: cardData.title,
          summary: cardData.summary,
          key_facts: cardData.key_facts,
          tags: cardData.tags,
          image_data: cardData.image_data,
          user_id: user.id,
        });
        if (error) throw error;
      } else if (type === "event") {
        const { error } = await supabase.from("events").insert({
          name: cardData.name,
          date: cardData.date,
          time: cardData.time,
          location: cardData.location,
          description: cardData.description,
          user_id: user.id,
        });
        if (error) throw error;
      } else if (type === "contact") {
        const { error } = await supabase.from("contacts").insert({
          name: cardData.name,
          phone: cardData.phone,
          email: cardData.email,
          company: cardData.company,
          title: cardData.title,
          user_id: user.id,
        });
        if (error) throw error;
      }

      // Track saved card
      await supabase.from("saved_cards").insert({
        card_type: type,
        original_card_id: shareInfo.card_id,
        saved_by: user.id,
      });

      toast.success("Card saved to your account!");
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.info("You've already saved this card.");
      } else {
        toast.error(err.message || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">Card not found</p>
          <p className="text-sm text-muted-foreground">This share link may have expired or been removed.</p>
          <Button onClick={() => navigate("/")} variant="outline"><ArrowLeft className="w-4 h-4 mr-1" />Go Home</Button>
        </div>
      </div>
    );
  }

  const type = shareInfo?.card_type;
  const TypeIcon = type === "note" ? FileText : type === "event" ? Calendar : User;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container max-w-2xl flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <Scan className="w-3 h-3 text-primary absolute ml-3.5 mt-3" />
            <span className="font-display font-bold text-foreground ml-1">VisionMind</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Home
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="gap-1"><TypeIcon className="w-3 h-3" />{type}</Badge>
            <span className="text-xs text-muted-foreground">Shared card</span>
          </div>

          <div className="glass-card p-5 space-y-4">
            {type === "note" && (
              <>
                <h2 className="font-display text-xl font-bold text-foreground">{cardData.title}</h2>
                {cardData.image_data && (
                  <div className="rounded-lg overflow-hidden border border-border/50">
                    <img src={cardData.image_data} alt="Note image" className="w-full max-h-64 object-contain bg-muted/30" />
                  </div>
                )}
                {cardData.summary && <p className="text-sm text-foreground/80">{cardData.summary}</p>}
                {cardData.key_facts && (cardData.key_facts as string[]).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Key Facts</p>
                    <ul className="space-y-1">
                      {(cardData.key_facts as string[]).map((f: string, i: number) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-start gap-2"><span className="text-primary">•</span>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cardData.tags && (cardData.tags as string[]).length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {(cardData.tags as string[]).map((t: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </>
            )}

            {type === "event" && (
              <>
                <h2 className="font-display text-xl font-bold text-foreground">{cardData.name}</h2>
                <div className="space-y-1 text-sm text-foreground/80">
                  {cardData.date && <p>📅 {cardData.date}</p>}
                  {cardData.time && <p>⏰ {cardData.time}</p>}
                  {cardData.location && <p>📍 {cardData.location}</p>}
                </div>
                {cardData.description && <p className="text-sm text-foreground/80">{cardData.description}</p>}
              </>
            )}

            {type === "contact" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-lg">{cardData.name?.charAt(0)}</div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{cardData.name}</h2>
                    <p className="text-sm text-muted-foreground">{[cardData.title, cardData.company].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-foreground/80">
                  {cardData.phone && <p>📞 {cardData.phone}</p>}
                  {cardData.email && <p>✉️ {cardData.email}</p>}
                  {cardData.company && <p>🏢 {cardData.company}</p>}
                </div>
              </>
            )}

            <p className="text-xs text-muted-foreground">Created: {new Date(cardData.created_at).toLocaleDateString()}</p>
          </div>

          {user && (
            <div className="mt-4">
              <Button onClick={saveToMyAccount} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save to My Account
              </Button>
            </div>
          )}

          {!user && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Sign in to save this card to your account</p>
              <Button onClick={() => navigate("/")} variant="outline">Sign In</Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
