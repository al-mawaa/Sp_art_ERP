"use client";

import { useState, useMemo } from "react";
import { Star, Send, MessageSquareHeart } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, actions, type FeedbackRatings } from "@/store/dataStore";
import { toast } from "sonner";

const RATING_ROWS: { key: keyof FeedbackRatings; label: string }[] = [
  { key: "teaching", label: "Quality of teaching / instructors" },
  { key: "communication", label: "Communication from the center" },
  { key: "artisticGrowth", label: "Artistic growth of your child" },
  { key: "classroom", label: "Classroom environment & discipline" },
  { key: "variety", label: "Variety of art activities" },
  { key: "value", label: "Value for fees paid" },
];

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 transition-transform hover:scale-110"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star className={`w-6 h-6 ${n <= value ? "fill-secondary text-secondary" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

export default StudentFeedback;

export function StudentFeedback() {
  const me = useStore(s => s.students[0]);
  const teachers = useStore(s => s.teachers);
  const allFeedbacks = useStore(s => s.feedbacks);

  const myFeedbacks = useMemo(
    () => allFeedbacks.filter(f => f.studentId === me?.id),
    [allFeedbacks, me?.id],
  );

  const [parentName, setParentName] = useState(me?.parent || "");
  const [teacherName, setTeacherName] = useState(teachers[0]?.name || "");
  const [ratings, setRatings] = useState<FeedbackRatings>({
    teaching: 0, communication: 0, artisticGrowth: 0, classroom: 0, variety: 0, value: 0,
  });
  const [instructorImpression, setInstructorImpression] = useState("");
  const [motivated, setMotivated] = useState<"Yes" | "Sometimes" | "No">("Yes");
  const [motivatedExplain, setMotivatedExplain] = useState("");
  const [informed, setInformed] = useState<"Yes" | "No" | "Somewhat">("Yes");
  const [communicationSuggestions, setCommunicationSuggestions] = useState("");
  const [appreciate, setAppreciate] = useState("");
  const [improve, setImprove] = useState("");
  const [recommend, setRecommend] = useState<"Yes" | "Maybe" | "No">("Yes");
  const [additional, setAdditional] = useState("");

  if (!me) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        No student data is available yet. Please add a student or connect the real student dataset before using feedback.
      </div>
    );
  }

  const setRating = (k: keyof FeedbackRatings, v: number) =>
    setRatings(r => ({ ...r, [k]: v }));

  const allRated = Object.values(ratings).every(v => v > 0);

  const submit = () => {
    if (!parentName.trim()) return toast.error("Please enter parent / guardian name");
    if (!teacherName) return toast.error("Please select a teacher");
    if (!allRated) return toast.error("Please rate every category (1–5)");
    actions.submitFeedback({
      studentId: me.id,
      studentName: me.name,
      parentName: parentName.trim(),
      teacherName,
      ratings,
      instructorImpression: instructorImpression.trim(),
      motivated,
      motivatedExplain: motivatedExplain.trim(),
      informed,
      communicationSuggestions: communicationSuggestions.trim(),
      appreciate: appreciate.trim(),
      improve: improve.trim(),
      recommend,
      additional: additional.trim(),
    });
    toast.success("Thank you! Your feedback has been sent to admin 💜");
    setRatings({ teaching: 0, communication: 0, artisticGrowth: 0, classroom: 0, variety: 0, value: 0 });
    setInstructorImpression(""); setMotivatedExplain(""); setCommunicationSuggestions("");
    setAppreciate(""); setImprove(""); setAdditional("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Parent Feedback" subtitle="Help us make Little Brushes even better 🎨" />

      <div className="card-pop overflow-hidden">
        <div className="gradient-primary text-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2"><MessageSquareHeart className="w-6 h-6" /></div>
            <div>
              <div className="font-display text-xl font-bold">SP Art Hub – Parent Feedback Form</div>
              <div className="text-sm opacity-90">Dear Parent/Guardian, your feedback helps us improve our teaching methods and your child's learning experience.</div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-8">
          {/* Identity */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Parent / Guardian name</Label>
              <Input value={parentName} onChange={e => setParentName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Feedback about teacher</Label>
              <Select value={teacherName} onValueChange={setTeacherName}>
                <SelectTrigger><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => <SelectItem key={t.id} value={t.name}>{t.name} • {t.specialization}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Program Satisfaction */}
          <section className="space-y-3">
            <div>
              <h3 className="font-display font-bold text-lg">Program Satisfaction</h3>
              <p className="text-sm text-muted-foreground">Rate from 1 — Very Dissatisfied to 5 — Very Satisfied</p>
            </div>
            <div className="card-soft divide-y divide-border/60">
              {RATING_ROWS.map(row => (
                <div key={row.key} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="font-semibold text-sm">{row.label}</div>
                  <StarRow value={ratings[row.key]} onChange={v => setRating(row.key, v)} />
                </div>
              ))}
            </div>
          </section>

          {/* Instructor Feedback */}
          <section className="space-y-3">
            <h3 className="font-display font-bold text-lg">Instructor Feedback</h3>
            <div className="space-y-1.5">
              <Label>What is your impression of the instructor's skills and engagement with students?</Label>
              <Textarea value={instructorImpression} onChange={e => setInstructorImpression(e.target.value)} maxLength={1000} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Is your child motivated and excited to attend the sessions?</Label>
              <RadioGroup value={motivated} onValueChange={(v) => setMotivated(v as "Yes" | "Sometimes" | "No")} className="flex gap-4 flex-wrap">
                {["Yes", "Sometimes", "No"].map(o => (
                  <label key={o} className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value={o} />{o}</label>
                ))}
              </RadioGroup>
              <Textarea placeholder="Please explain..." value={motivatedExplain} onChange={e => setMotivatedExplain(e.target.value)} maxLength={500} rows={2} />
            </div>
          </section>

          {/* Communication & Support */}
          <section className="space-y-3">
            <h3 className="font-display font-bold text-lg">Communication & Support</h3>
            <div className="space-y-2">
              <Label>Do you feel well-informed about your child's progress?</Label>
              <RadioGroup value={informed} onValueChange={(v) => setInformed(v as "Yes" | "No" | "Somewhat")} className="flex gap-4 flex-wrap">
                {["Yes", "No", "Somewhat"].map(o => (
                  <label key={o} className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value={o} />{o}</label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Suggestions on how we can improve communication with parents</Label>
              <Textarea value={communicationSuggestions} onChange={e => setCommunicationSuggestions(e.target.value)} maxLength={1000} rows={3} />
            </div>
          </section>

          {/* Overall Experience */}
          <section className="space-y-3">
            <h3 className="font-display font-bold text-lg">Overall Experience</h3>
            <div className="space-y-1.5">
              <Label>What do you appreciate most about the center?</Label>
              <Textarea value={appreciate} onChange={e => setAppreciate(e.target.value)} maxLength={1000} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Any areas you feel we can improve?</Label>
              <Textarea value={improve} onChange={e => setImprove(e.target.value)} maxLength={1000} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Would you recommend our center to other parents?</Label>
              <RadioGroup value={recommend} onValueChange={(v) => setRecommend(v as "Yes" | "Maybe" | "No")} className="flex gap-4 flex-wrap">
                {["Yes", "Maybe", "No"].map(o => (
                  <label key={o} className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value={o} />{o}</label>
                ))}
              </RadioGroup>
            </div>
          </section>

          {/* Additional */}
          <section className="space-y-1.5">
            <Label>Additional comments</Label>
            <Textarea value={additional} onChange={e => setAdditional(e.target.value)} maxLength={1000} rows={3} />
          </section>

          <div className="flex justify-end">
            <Button onClick={submit} className="rounded-xl gradient-primary text-white border-0">
              <Send className="w-4 h-4 mr-1.5" />Submit feedback
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">Thank you for your time and support! 💜</p>
        </div>
      </div>

      {/* My past submissions */}
      {myFeedbacks.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg mb-3">My past feedback</h3>
          <div className="space-y-3">
            {myFeedbacks.map(f => {
              const avg = (Object.values(f.ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);
              return (
                <div key={f.id} className="card-soft p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">For {f.teacherName}</div>
                    <div className="text-xs text-muted-foreground">{f.submittedAt} • Avg {avg}/5 • Recommend: {f.recommend}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-soft text-success font-semibold">{f.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}