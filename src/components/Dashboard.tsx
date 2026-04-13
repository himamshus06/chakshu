import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, FileText, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function ExpandableCard({ children, preview }: { children: React.ReactNode; preview: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card p-4 hover-lift cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {preview}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-border/50 mt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-center mt-2">
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => { await supabase.from("notes").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); toast.success("Note deleted"); },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => { await supabase.from("events").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Event deleted"); },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => { await supabase.from("contacts").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contacts"] }); toast.success("Contact deleted"); },
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="w-full bg-muted/50 mb-4">
        <TabsTrigger value="notes" className="flex-1 gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Notes ({notes.length})
        </TabsTrigger>
        <TabsTrigger value="events" className="flex-1 gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Events ({events.length})
        </TabsTrigger>
        <TabsTrigger value="contacts" className="flex-1 gap-1.5">
          <User className="w-3.5 h-3.5" />
          Contacts ({contacts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        {notes.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No notes yet. Upload an image to get started!</p>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {notes.map((note) => (
              <motion.div key={note.id} variants={item}>
                <ExpandableCard
                  preview={
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-foreground">{note.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.summary}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteNote.mutate(note.id); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                >
                  {note.summary && <p className="text-sm text-foreground/80 mb-3">{note.summary}</p>}
                  {note.key_facts && (note.key_facts as string[]).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Key Facts</p>
                      <ul className="space-y-1">
                        {(note.key_facts as string[]).map((fact, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {note.tags && (note.tags as string[]).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {(note.tags as string[]).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
                </ExpandableCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </TabsContent>

      <TabsContent value="events">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No events detected yet.</p>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {events.map((event) => (
              <motion.div key={event.id} variants={item}>
                <ExpandableCard
                  preview={
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-semibold text-foreground">{event.name}</h4>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          {event.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>}
                          {event.location && <span className="flex items-center gap-1">📍 {event.location}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteEvent.mutate(event.id); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                >
                  {event.time && <p className="text-sm text-foreground/80">⏰ {event.time}</p>}
                  {event.description && <p className="text-sm text-foreground/80 mt-1">{event.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(event.created_at).toLocaleDateString()}</p>
                </ExpandableCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </TabsContent>

      <TabsContent value="contacts">
        {contacts.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No contacts detected yet.</p>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {contacts.map((contact) => (
              <motion.div key={contact.id} variants={item}>
                <ExpandableCard
                  preview={
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary">
                          {contact.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-foreground">{contact.name}</h4>
                          <p className="text-xs text-muted-foreground">{[contact.title, contact.company].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteContact.mutate(contact.id); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                >
                  <div className="space-y-1 text-sm text-foreground/80">
                    {contact.phone && <p>📞 {contact.phone}</p>}
                    {contact.email && <p>✉️ {contact.email}</p>}
                    {contact.company && <p>🏢 {contact.company}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(contact.created_at).toLocaleDateString()}</p>
                </ExpandableCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </TabsContent>
    </Tabs>
  );
}
