import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, FileText, Trash2, ChevronDown, Pencil, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
            <div className="pt-3 border-t border-border/50 mt-3" onClick={e => e.stopPropagation()}>
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

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadVCard(contact: any) {
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name || ""}\nORG:${contact.company || ""}\nTITLE:${contact.title || ""}\nTEL:${contact.phone || ""}\nEMAIL:${contact.email || ""}\nEND:VCARD`;
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(contact.name || "contact").replace(/\s+/g, "_")}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadICS(event: any) {
  const startDate = (event.date || "").replace(/-/g, "");
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.name || ""}\nDTSTART:${startDate}\nLOCATION:${event.location || ""}\nDESCRIPTION:${event.description || ""}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(event.name || "event").replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
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

  const updateNote = useMutation({
    mutationFn: async (note: any) => {
      const { error } = await supabase.from("notes").update({ title: note.title, summary: note.summary, key_facts: note.key_facts, tags: note.tags }).eq("id", note.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); toast.success("Note updated"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateEvent = useMutation({
    mutationFn: async (event: any) => {
      const { error } = await supabase.from("events").update({ name: event.name, date: event.date, time: event.time, location: event.location, description: event.description }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Event updated"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateContact = useMutation({
    mutationFn: async (contact: any) => {
      const { error } = await supabase.from("contacts").update({ name: contact.name, phone: contact.phone, email: contact.email, company: contact.company, title: contact.title }).eq("id", contact.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contacts"] }); toast.success("Contact updated"); },
    onError: (err: any) => toast.error(err.message),
  });

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="w-full bg-muted/50 mb-4">
        <TabsTrigger value="notes" className="flex-1 gap-1.5"><FileText className="w-3.5 h-3.5" />Notes ({notes.length})</TabsTrigger>
        <TabsTrigger value="events" className="flex-1 gap-1.5"><Calendar className="w-3.5 h-3.5" />Events ({events.length})</TabsTrigger>
        <TabsTrigger value="contacts" className="flex-1 gap-1.5"><User className="w-3.5 h-3.5" />Contacts ({contacts.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        {notes.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No notes yet. Upload an image to get started!</p>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {notes.map((note) => (
              <motion.div key={note.id} variants={item}>
                <NoteCard note={note} onDelete={() => deleteNote.mutate(note.id)} onUpdate={(d) => updateNote.mutate(d)} />
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
                <EventCard event={event} onDelete={() => deleteEvent.mutate(event.id)} onUpdate={(d) => updateEvent.mutate(d)} />
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
                <ContactCard contact={contact} onDelete={() => deleteContact.mutate(contact.id)} onUpdate={(d) => updateContact.mutate(d)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function NoteCard({ note, onDelete, onUpdate }: { note: any; onDelete: () => void; onUpdate: (d: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);

  const startEdit = () => { setDraft({ ...note }); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => { onUpdate(draft); setEditing(false); };

  return (
    <ExpandableCard
      preview={
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-display font-semibold text-foreground">{note.title}</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.summary}</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadJSON({ title: note.title, summary: note.summary, key_facts: note.key_facts, tags: note.tags }, `${note.title || "note"}.json`); }} className="text-muted-foreground"><Download className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      }
    >
      {editing ? (
        <div className="space-y-3">
          <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="font-semibold" />
          <Textarea value={draft.summary || ""} onChange={e => setDraft({ ...draft, summary: e.target.value })} placeholder="Summary" className="min-h-[80px] resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" />Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          {note.summary && <p className="text-sm text-foreground/80 mb-3">{note.summary}</p>}
          {note.key_facts && (note.key_facts as string[]).length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Key Facts</p>
              <ul className="space-y-1">
                {(note.key_facts as string[]).map((fact, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>{fact}</span></li>
                ))}
              </ul>
            </div>
          )}
          {note.tags && (note.tags as string[]).length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {(note.tags as string[]).map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</p>
            <Button size="sm" variant="ghost" onClick={startEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
          </div>
        </>
      )}
    </ExpandableCard>
  );
}

function EventCard({ event, onDelete, onUpdate }: { event: any; onDelete: () => void; onUpdate: (d: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(event);

  const startEdit = () => { setDraft({ ...event }); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => { onUpdate(draft); setEditing(false); };

  return (
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
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadICS(event); }} className="text-muted-foreground"><Download className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      }
    >
      {editing ? (
        <div className="space-y-3">
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Event name" className="font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={draft.date || ""} onChange={e => setDraft({ ...draft, date: e.target.value })} placeholder="Date" />
            <Input value={draft.time || ""} onChange={e => setDraft({ ...draft, time: e.target.value })} placeholder="Time" />
          </div>
          <Input value={draft.location || ""} onChange={e => setDraft({ ...draft, location: e.target.value })} placeholder="Location" />
          <Textarea value={draft.description || ""} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="min-h-[60px] resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" />Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          {event.time && <p className="text-sm text-foreground/80">⏰ {event.time}</p>}
          {event.description && <p className="text-sm text-foreground/80 mt-1">{event.description}</p>}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleDateString()}</p>
            <Button size="sm" variant="ghost" onClick={startEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
          </div>
        </>
      )}
    </ExpandableCard>
  );
}

function ContactCard({ contact, onDelete, onUpdate }: { contact: any; onDelete: () => void; onUpdate: (d: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(contact);

  const startEdit = () => { setDraft({ ...contact }); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => { onUpdate(draft); setEditing(false); };

  return (
    <ExpandableCard
      preview={
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary">{contact.name?.charAt(0)}</div>
            <div>
              <h4 className="font-display font-semibold text-foreground">{contact.name}</h4>
              <p className="text-xs text-muted-foreground">{[contact.title, contact.company].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadVCard(contact); }} className="text-muted-foreground"><Download className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      }
    >
      {editing ? (
        <div className="space-y-3">
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className="font-semibold" />
          <Input value={draft.phone || ""} onChange={e => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
          <Input value={draft.email || ""} onChange={e => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
          <Input value={draft.company || ""} onChange={e => setDraft({ ...draft, company: e.target.value })} placeholder="Company" />
          <Input value={draft.title || ""} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" />Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1 text-sm text-foreground/80">
            {contact.phone && <p>📞 {contact.phone}</p>}
            {contact.email && <p>✉️ {contact.email}</p>}
            {contact.company && <p>🏢 {contact.company}</p>}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">{new Date(contact.created_at).toLocaleDateString()}</p>
            <Button size="sm" variant="ghost" onClick={startEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
          </div>
        </>
      )}
    </ExpandableCard>
  );
}
