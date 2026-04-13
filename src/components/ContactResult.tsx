import { motion } from "framer-motion";
import { User, Phone, Mail, Building, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ContactData {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

interface ContactResultProps {
  contacts: ContactData[];
  onSave: (contacts: ContactData[]) => void;
}

export function ContactResult({ contacts: initialContacts, onSave }: ContactResultProps) {
  const [contacts, setContacts] = useState(initialContacts);

  const updateContact = (index: number, field: keyof ContactData, value: string) => {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const downloadVCard = (contact: ContactData) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TITLE:${contact.title}
TEL:${contact.phone}
EMAIL:${contact.email}
END:VCARD`;
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contact.name.replace(/\s+/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
          <User className="w-4 h-4 text-info" />
        </div>
        <h3 className="font-display font-semibold text-foreground">Contacts Detected</h3>
      </div>
      {contacts.map((contact, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-lg">
              {contact.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              <Input value={contact.name} onChange={e => updateContact(i, "name", e.target.value)} className="font-display font-semibold bg-transparent border-none p-0 h-auto text-lg" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building className="w-3 h-3" />
                <Input value={contact.title ? `${contact.title} at ${contact.company}` : contact.company} onChange={e => updateContact(i, "company", e.target.value)} className="bg-transparent border-none p-0 h-auto text-sm text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <Input value={contact.phone} onChange={e => updateContact(i, "phone", e.target.value)} className="bg-transparent border-border/50 h-8 text-sm" placeholder="Phone" />
              {contact.phone && (
                <a href={`tel:${contact.phone}`}>
                  <Button size="sm" variant="ghost" className="h-8 px-2"><Phone className="w-3.5 h-3.5" /></Button>
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <Input value={contact.email} onChange={e => updateContact(i, "email", e.target.value)} className="bg-transparent border-border/50 h-8 text-sm" placeholder="Email" />
              {contact.email && (
                <a href={`mailto:${contact.email}`}>
                  <Button size="sm" variant="ghost" className="h-8 px-2"><Mail className="w-3.5 h-3.5" /></Button>
                </a>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => downloadVCard(contact)}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Download vCard
          </Button>
        </div>
      ))}
      <Button onClick={() => onSave(contacts)} className="w-full">Save Contacts</Button>
    </motion.div>
  );
}
