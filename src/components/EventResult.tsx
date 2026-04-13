import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface EventData {
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

interface EventResultProps {
  events: EventData[];
  onSave: (events: EventData[]) => void;
}

export function EventResult({ events: initialEvents, onSave }: EventResultProps) {
  const [events, setEvents] = useState(initialEvents);

  const updateEvent = (index: number, field: keyof EventData, value: string) => {
    setEvents(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const addToCalendar = (event: EventData) => {
    const startDate = event.date?.replace(/-/g, "") || "";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDate}/${startDate}&location=${encodeURIComponent(event.location || "")}&details=${encodeURIComponent(event.description || "")}`;
    window.open(url, "_blank");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-warning" />
        </div>
        <h3 className="font-display font-semibold text-foreground">Events Detected</h3>
      </div>
      {events.map((event, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <Input value={event.name} onChange={e => updateEvent(i, "name", e.target.value)} className="font-display font-semibold text-lg bg-transparent border-none p-0 h-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <Input value={event.date} onChange={e => updateEvent(i, "date", e.target.value)} className="bg-transparent border-border/50 h-8 text-sm" placeholder="Date" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <Input value={event.time} onChange={e => updateEvent(i, "time", e.target.value)} className="bg-transparent border-border/50 h-8 text-sm" placeholder="Time" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <Input value={event.location} onChange={e => updateEvent(i, "location", e.target.value)} className="bg-transparent border-border/50 h-8 text-sm" placeholder="Location" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => addToCalendar(event)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add to Calendar
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={() => onSave(events)} className="w-full">Save Events</Button>
    </motion.div>
  );
}
