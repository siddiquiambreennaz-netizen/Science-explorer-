import { createFileRoute, useRouteContext, Link } from "@tanstack/react-router";
import { Atom, ArrowRight, Calculator, Camera, Code2, Compass, Dna, HeartPulse, Leaf, Rocket, Sparkles, Download, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { AppShell, studentNav, teacherNav } from "@/components/AppShell";
import { useMe } from "@/lib/use-me";
import { useLang } from "@/lib/lang-store";
import { getOfflinePackSeed } from "@/lib/offline-content";
import { listOfflinePacks, saveOfflinePack } from "@/lib/offline-downloads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/games/")({
  head: () => ({
    meta: [
      { title: "Science Games — SCIENCE EXPLORER" },
      { name: "description", content: "Explore interactive missions in science, coding, mathematics, geography and real-world discovery." },
      { property: "og:title", content: "Science Games — SCIENCE EXPLORER" },
      { property: "og:description", content: "Choose a subject and start exploring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesHub,
});

type SubjectCard = {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  icon: typeof Atom;
  color: string;
  gameId?: string;
  route?: "/app/games/chemistry" | "/app/games/physics" | "/app/scanner";
};

const subjects: SubjectCard[] = [
  { id: "chemistry", title: { en: "Chemistry Lab", ur: "کیمیا لیب", roman: "Chemistry Lab", sd: "ڪيميا ليب" }, description: { en: "Build molecules, balance formulas and explore safe virtual reactions.", ur: "مالیکیول بنائیں، فارمولے متوازن کریں اور محفوظ ورچوئل تجربے کریں۔", roman: "Molecules banayein, formulas balance karein aur safe virtual reactions explore karein.", sd: "ماليڪيول ٺاهيو، فارمولا برابر ڪريو ۽ محفوظ ورچوئل تجربا ڪريو." }, icon: Atom, color: "bg-cyan-500/15 text-cyan-600", route: "/app/games/chemistry" },
  { id: "physics", title: { en: "Physics Power Lab", ur: "فزکس پاور لیب", roman: "Physics Power Lab", sd: "فزڪس پاور ليب" }, description: { en: "Experiment with circuits, forces, motion, magnets and light.", ur: "سرکٹ، قوت، حرکت، مقناطیس اور روشنی کے تجربے کریں۔", roman: "Circuits, forces, motion, magnets aur light ke experiments karein.", sd: "سرڪٽ، قوت، حرڪت، مقناطيس ۽ روشني جا تجربا ڪريو." }, icon: Rocket, color: "bg-amber-500/15 text-amber-600", route: "/app/games/physics" },
  { id: "biology", title: { en: "Build the Cell", ur: "خلیہ بنائیں", roman: "Build the Cell", sd: "سيل ٺاهيو" }, description: { en: "Drag organelles to the right jobs and build a working cell.", ur: "خلیے کے حصوں کو ان کے درست کام سے ملائیں۔", roman: "Organelles ko unke sahi kaam se match karke cell banayein.", sd: "سيل جي حصن کي سندن صحيح ڪم سان ملايو." }, icon: Dna, color: "bg-emerald-500/15 text-emerald-600", gameId: "build-the-cell" },
  { id: "human-body", title: { en: "Body Detective", ur: "باڈی ڈیٹیکٹو", roman: "Body Detective", sd: "باڊي ڊيٽيڪٽو" }, description: { en: "Identify organs and discover how body systems work together.", ur: "اعضاء پہچانیں اور جسم کے نظام سیکھیں۔", roman: "Organs pehchanein aur body systems kaise kaam karte hain seekhein.", sd: "عضوا سڃاڻو ۽ جسم جا نظام سکو." }, icon: HeartPulse, color: "bg-rose-500/15 text-rose-600", gameId: "body-detective" },
  { id: "space", title: { en: "Space Mission", ur: "خلائی مشن", roman: "Space Mission", sd: "خلائي مشن" }, description: { en: "Travel across the Solar System and discover the planets.", ur: "نظامِ شمسی میں سفر کریں اور سیارے دریافت کریں۔", roman: "Solar System ka safar karein aur planets discover karein.", sd: "شمسي نظام جو سفر ڪريو ۽ سيارا دريافت ڪريو." }, icon: Rocket, color: "bg-violet-500/15 text-violet-600", gameId: "space-mission" },
  { id: "eco", title: { en: "Eco Rescue", ur: "ماحول بچاؤ", roman: "Eco Rescue", sd: "ماحول بچايو" }, description: { en: "Sort waste, make greener choices and protect our planet.", ur: "فضلہ الگ کریں اور زمین کی حفاظت کے بہتر طریقے سیکھیں۔", roman: "Waste sort karein aur planet ke liye behtar choices karein.", sd: "فضول شيون الڳ ڪريو ۽ ڌرتي بچائڻ جا طريقا سکو." }, icon: Leaf, color: "bg-lime-500/15 text-lime-700", gameId: "eco-rescue" },
  { id: "maths", title: { en: "Math Adventures", ur: "ریاضی مہم", roman: "Math Adventures", sd: "رياضي مهم" }, description: { en: "Solve number, fraction, shape and pattern challenges.", ur: "اعداد، کسر، اشکال اور پیٹرن کے سوال حل کریں۔", roman: "Numbers, fractions, shapes aur patterns ke challenges hal karein.", sd: "انگن، ڪسرن، شڪلين ۽ نمونن جا سوال حل ڪريو." }, icon: Calculator, color: "bg-orange-500/15 text-orange-600", gameId: "math-quest" },
  { id: "cs", title: { en: "Code Logic Lab", ur: "کوڈ لاجک لیب", roman: "Code Logic Lab", sd: "ڪوڊ لاجڪ ليب" }, description: { en: "Build code-block algorithms, use loops and debug a robot maze.", ur: "کوڈ بلاکس، لوپس اور روبوٹ میز کے ذریعے لاجک سیکھیں۔", roman: "Code blocks, loops aur robot maze se logic aur debugging seekhein.", sd: "ڪوڊ بلاڪ، لوپ ۽ روبوٽ ميز سان لاجڪ سکو." }, icon: Code2, color: "bg-sky-500/15 text-sky-600", gameId: "code-logic" },
  { id: "geography", title: { en: "Geography Explorer", ur: "جغرافیہ ایکسپلورر", roman: "Geography Explorer", sd: "جاگرافي ايڪسپلورر" }, description: { en: "Explore maps, directions, continents, oceans and landforms.", ur: "نقشے، سمتیں، براعظم، سمندر اور زمینی ساخت دریافت کریں۔", roman: "Maps, directions, continents, oceans aur landforms explore karein.", sd: "نقشا، طرفون، کنڊ، سمنڊ ۽ زميني بناوتون ڄاڻو." }, icon: Compass, color: "bg-blue-500/15 text-blue-600", gameId: "geography-explorer" },
  { id: "hunt", title: { en: "Real-World Science Hunt", ur: "حقیقی سائنس کی تلاش", roman: "Real-World Science Hunt", sd: "حقيقي سائنس جي ڳولا" }, description: { en: "Complete safe observation missions and analyze photos with Scan & Learn.", ur: "محفوظ مشاہداتی مشن مکمل کریں اور اسکینر سے تصاویر سمجھیں۔", roman: "Safe observation missions karein aur Scan & Learn se photos samjhein.", sd: "محفوظ مشاهدي جا مشن ڪريو ۽ اسڪينر سان تصويرون سمجھو." }, icon: Camera, color: "bg-fuchsia-500/15 text-fuchsia-600", gameId: "real-world-science-hunt" },
  { id: "other", title: { en: "Word Wizard", ur: "ورڈ وزرڈ", roman: "Word Wizard", sd: "ورڊ وزرڊ" }, description: { en: "Practise vocabulary, grammar and sentence building.", ur: "الفاظ، گرامر اور جملے بنانے کی مشق کریں۔", roman: "Vocabulary, grammar aur sentences banane ki practice karein.", sd: "لفظ، گرامر ۽ جملا ٺاهڻ جي مشق ڪريو." }, icon: Sparkles, color: "bg-pink-500/15 text-pink-600", gameId: "english-words" },
];

const copy = {
  en: { eyebrow: "Your discovery adventure", title: "Science Games", intro: "Choose one subject to start a hands-on learning mission.", start: "Start adventure", continue: "Continue Playing", saved: "Physics missions saved" },
  ur: { eyebrow: "آپ کی دریافت کا سفر", title: "سائنس گیمز", intro: "عملی سیکھنے کے لیے ایک مضمون منتخب کریں۔", start: "کھیل شروع کریں", continue: "کھیل جاری رکھیں", saved: "فزکس مشنز محفوظ ہیں" },
  roman: { eyebrow: "Aap ka discovery adventure", title: "Science Games", intro: "Hands-on learning mission ke liye ek subject chunein.", start: "Adventure shuru karein", continue: "Khel jari rakhein", saved: "Physics missions saved" },
  sd: { eyebrow: "توهان جي دريافت جو سفر", title: "سائنس رانديون", intro: "عملي سکيا لاءِ هڪ مضمون چونڊيو.", start: "راند شروع ڪريو", continue: "راند جاري رکو", saved: "فزڪس مشن محفوظ آهن" },
} as const;

function GamesHub() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [lang] = useLang();
  const t = copy[lang];
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState("");
  useEffect(() => {
    void listOfflinePacks().then((packs) => setDownloadedIds(packs.map((pack) => pack.id)));
  }, []);
  const downloadSubject = async (id: string) => {
    const seed = getOfflinePackSeed(id);
    if (!seed || savingId) return;
    setSavingId(id); setDownloadMessage("");
    try {
      await saveOfflinePack({ ...seed, savedAt: Date.now() });
      setDownloadedIds((current) => current.includes(id) ? current : [...current, id]);
      setDownloadMessage(`${seed.title} is saved on this device. Open My Downloads to play it offline.`);
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        registration?.active?.postMessage({ type: "CACHE_APP_SHELL", paths: ["/app/downloads", "/app/games/physics", "/app/games/chemistry"] });
      }
    } catch {
      setDownloadMessage("Could not save this pack. Check the available storage on this device.");
    } finally { setSavingId(null); }
  };
  const progress = useQuery({
    queryKey: ["topic-progress", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_slug,completed_at").eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
  });
  const missions = (progress.data ?? []).filter((p) => p.topic_slug.startsWith("physics-playlab-"));

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="relative isolate space-y-6 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-400/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-72 -z-10 h-72 w-72 rounded-full bg-gradient-to-br from-sky-500/10 via-emerald-400/10 to-transparent blur-3xl" />
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 font-bold text-primary">{t.eyebrow}</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.intro}</p>
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> 11 interactive missions · touch-friendly · student-safe</p>
          {missions.length > 0 && <Button asChild className="mt-4 rounded-full"><Link to="/app/games/physics">{t.continue}<ArrowRight /></Link></Button>}
          </div>
          <Mascot state="idle" className="w-24 sm:w-40" />
        </header>
        {progress.isError && <p role="alert" className="text-destructive">Your saved game progress couldn’t load. Please refresh.</p>}
        <Link to="/app/games/$gameId" params={{ gameId: "custom-topic-game" }} className="group block">
          <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition hover:border-primary/40 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 -z-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-4xl">🎮</div>
              <div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">AI GAME CREATOR · CLASS 5–10</p><h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Create a game from your topic</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Enter Gravity, Photosynthesis, Fractions, Chemical Bonding—or any school topic. AI builds a story, hands-on drag-and-drop mission, hints, rewards and a short quiz at the end.</p></div>
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition group-hover:opacity-90">Create my game <ArrowRight className="h-4 w-4" /></span>
            </div>
          </div>
        </Link>
        {downloadMessage && <p role="status" className="rounded-2xl border border-success/20 bg-success/10 p-3 text-sm font-semibold text-success">{downloadMessage}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            const themes: Record<string, { bg: string; glow: string; emoji: string; world: string }> = {
              chemistry: { bg: "from-slate-950 via-cyan-950 to-emerald-950", glow: "bg-cyan-400/25", emoji: "⚗️", world: "Molecular lab" },
              physics: { bg: "from-slate-950 via-blue-950 to-indigo-950", glow: "bg-blue-400/25", emoji: "🧲", world: "Physics power world" },
              biology: { bg: "from-slate-950 via-emerald-950 to-lime-950", glow: "bg-lime-400/25", emoji: "🧬", world: "Microscopic world" },
              "human-body": { bg: "from-slate-950 via-rose-950 to-orange-950", glow: "bg-rose-400/25", emoji: "❤️", world: "Human body mission" },
              space: { bg: "from-slate-950 via-indigo-950 to-violet-950", glow: "bg-violet-400/25", emoji: "🪐", world: "Space explorer" },
              eco: { bg: "from-slate-950 via-green-950 to-teal-950", glow: "bg-emerald-400/25", emoji: "🌍", world: "Eco rescue world" },
              maths: { bg: "from-slate-950 via-amber-950 to-orange-950", glow: "bg-amber-400/25", emoji: "📐", world: "Math puzzle world" },
              cs: { bg: "from-slate-950 via-sky-950 to-fuchsia-950", glow: "bg-sky-400/25", emoji: "🤖", world: "Code logic lab" },
              geography: { bg: "from-slate-950 via-blue-950 to-teal-950", glow: "bg-sky-400/25", emoji: "🧭", world: "Planet explorer" },
              hunt: { bg: "from-slate-950 via-fuchsia-950 to-violet-950", glow: "bg-fuchsia-400/25", emoji: "🔎", world: "Real-world discovery" },
              other: { bg: "from-slate-950 via-pink-950 to-violet-950", glow: "bg-pink-400/25", emoji: "✨", world: "Word wizard world" },
            };
            const theme = themes[subject.id] ?? themes.other!;
            const card = (
              <div className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="flex h-full min-h-[170px] flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", subject.color)}><Icon className="h-6 w-6" /></span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{theme.world}</span>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-extrabold">{subject.title[lang]}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subject.description[lang]}</p>
                  {subject.id === "physics" && missions.length > 0 && <p className="mt-2 text-xs font-bold text-primary">{missions.length}/6 {t.saved}</p>}
                  <div className="mt-auto flex items-center justify-between pt-4 text-sm font-bold text-primary"><span>{t.start}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                </div>
              </div>
            );
            const destination = subject.route
              ? <Link to={subject.route} className="block">{card}</Link>
              : <Link to="/app/games/$gameId" params={{ gameId: subject.gameId! }} className="block">{card}</Link>;
            const packExists = Boolean(getOfflinePackSeed(subject.id));
            const isSaved = downloadedIds.includes(subject.id);
            return <article key={subject.id} className="flex flex-col gap-2">
              {destination}
              {packExists && <Button type="button" variant="outline" disabled={savingId === subject.id} className="w-full rounded-full border-dashed" onClick={() => void downloadSubject(subject.id)}>
                {savingId === subject.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isSaved ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Download className="h-4 w-4" />}
                {savingId === subject.id ? "Saving pack…" : isSaved ? "Saved for offline · Save again" : "Save learning pack for offline"}
              </Button>}
            </article>;
          })}
        </div>
      </div>
    </AppShell>
  );
}
