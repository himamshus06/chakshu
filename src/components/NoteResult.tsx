import { motion } from "framer-motion";
import { FileText, Tag, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface NoteData {
  title: string;
  summary: string;
  key_facts: string[];
  tags: string[];
}

interface NoteResultProps {
  data: NoteData;
  onSave: (data: NoteData) => void;
}

export function NoteResult({ data: initialData, onSave }: NoteResultProps) {
  const [data, setData] = useState(initialData);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-success" />
        </div>
        <h3 className="font-display font-semibold text-foreground">Analysis Result</h3>
      </div>
      <div className="glass-card p-4 space-y-4">
        <Input
          value={data.title}
          onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
          className="font-display font-semibold text-lg bg-transparent border-none p-0 h-auto"
        />
        <Textarea
          value={data.summary}
          onChange={e => setData(prev => ({ ...prev, summary: e.target.value }))}
          className="bg-transparent border-border/50 text-sm min-h-[100px] resize-none"
        />
        {data.key_facts?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Key Facts</p>
            <ul className="space-y-1.5">
              {data.key_facts.map((fact, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {data.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
      <Button onClick={() => onSave(data)} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save Note
      </Button>
    </motion.div>
  );
}
