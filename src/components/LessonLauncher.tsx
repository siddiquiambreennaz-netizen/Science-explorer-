import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LESSON_SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "Earth & Space", "Environmental Science"] as const;
const sel = "h-12 rounded-2xl border-2 border-input bg-background/70 px-3 text-sm font-bold outline-none focus:border-primary";

/** Start an interactive lesson on any subject, topic, grade and level. */
export function LessonLauncher() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<string>("Mathematics");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(9);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  return (
    <form className="glass space-y-3 rounded-[2rem] p-5" onSubmit={(e) => { e.preventDefault(); if (topic.trim().length >= 2) navigate({ to: "/app/lesson", search: { subject, topic: topic.trim(), grade, level } }); }}>
      <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><Sparkles className="h-5 w-5 text-primary" />Learn any topic</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto_auto]">
        <select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={sel}>{LESSON_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select>
        <input aria-label="Topic" required minLength={2} maxLength={120} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fractions, Photosynthesis, Loops" className={sel} />
        <select aria-label="Grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))} className={sel}>{Array.from({ length: 6 }, (_, i) => i + 5).map((g) => <option key={g} value={g}>{g === 10 ? "Class 10 · Matric" : `Class ${g}`}</option>)}</select>
        <select aria-label="Difficulty" value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={sel}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        <Button type="submit" className="h-12 rounded-full" disabled={topic.trim().length < 2}>Start lesson</Button>
      </div>
    </form>
  );
}
