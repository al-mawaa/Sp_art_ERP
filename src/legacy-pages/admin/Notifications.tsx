"use client";

import { useState } from "react";
import { Send, MessageSquare, Mail, Smartphone, Bell as BellIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, actions } from "@/store/dataStore";
import { toast } from "sonner";

export default function Notifications() {
  const notificationLog = useStore(s => s.notifLog);
  const [channels, setChannels] = useState<Record<string, boolean>>({ SMS: true, WhatsApp: true, Email: false, Push: false });
  const [target, setTarget] = useState("parents");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Reach parents, students and staff" />
      <div className="grid lg:grid-cols-2 gap-5">
        <form
          className="card-soft p-5 space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (!message) { toast.error("Write a message"); return; }
            const ch = Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join(", ") || "SMS";
            const targetLabel = ({ parents: "All Parents", students: "All Students", staff: "Staff", class: "Specific class" } as Record<string,string>)[target] || target;
            actions.sendNotification({ target: targetLabel, channel: ch, message });
            toast.success("Notification queued! 📨");
            setMessage("");
          }}
        >
          <div className="space-y-1.5">
            <Label>Target audience</Label>
            <Select value={target} onValueChange={setTarget}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="parents">All parents</SelectItem>
                <SelectItem value="students">All students</SelectItem>
                <SelectItem value="staff">All staff</SelectItem>
                <SelectItem value="class">Specific class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Channels</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: "SMS",      icon: Smartphone },
                { k: "WhatsApp", icon: MessageSquare },
                { k: "Email",    icon: Mail },
                { k: "Push",     icon: BellIcon },
              ].map(c => (
                <label key={c.k} className="flex items-center gap-2 rounded-xl border border-border/60 p-2.5 cursor-pointer hover:bg-muted">
                  <Checkbox checked={channels[c.k]} onCheckedChange={v => setChannels(s => ({ ...s, [c.k]: !!v }))} />
                  <c.icon className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">{c.k}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea rows={4} placeholder="Type your message..." className="rounded-xl" value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Schedule (optional)</Label>
            <Input type="datetime-local" className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl gradient-primary text-white border-0">
            <Send className="w-4 h-4 mr-1.5" />Send notification
          </Button>
        </form>

        <div className="space-y-3">
          <h3 className="font-display font-bold text-lg">Recent broadcasts</h3>
          <DataTable
            columns={[
              { key: "target", header: "Target" },
              { key: "channel", header: "Channel" },
              { key: "message", header: "Message" },
              { key: "sent", header: "Sent" },
            ]}
            rows={notificationLog}
          />
        </div>
      </div>
    </div>
  );
}
