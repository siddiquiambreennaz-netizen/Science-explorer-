import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, History, ImageUp, Loader2, RefreshCw, Save, ScanLine, Trash2, X } from "lucide-react";
import { AppShell, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Mascot, useMascot } from "@/components/Mascot";
import { SpokenText } from "@/components/ReadAloud";
import { AskAboutTopic } from "@/components/AskAboutTopic";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { scanImage } from "@/lib/learn.functions";
import { useLang } from "@/lib/lang-store";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/scanner")({
  head: () => ({
    meta: [
      { title: "Scan & Learn — SCIENCE EXPLORER" },
      { name: "description", content: "Photograph a textbook page, diagram or equation and get a step-by-step explanation of what's actually in it." },
      { property: "og:title", content: "Scan & Learn — SCIENCE EXPLORER" },
      { property: "og:description", content: "Scan a page, diagram or equation and get a clear explanation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScannerPage,
});

const MAX_BYTES = 4_500_000;

function ScannerPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [lang] = useLang();
  const scan = useServerFn(scanImage);
  const qc = useQueryClient();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mascot, react] = useMascot("idle");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const history = useQuery({
    queryKey: ["scan-history", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("scan_history").select("id,title,result,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const pick = (f: File | undefined) => {
    setResult(null); setErr(null); setSaveMsg("");
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErr("Please choose an image file (photo or screenshot)."); react("error"); return; }
    if (f.size > MAX_BYTES) { setErr("That image is too large — please use one under about 4 MB."); react("error"); return; }
    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result as string); react("happy", 1200); };
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!preview || busy) return;
    setBusy(true); react("scanning", 0); setErr(null); setResult(null); setSaveMsg("");
    try {
      const r = await scan({ data: { imageDataUrl: preview, lang } });
      if (r.ok) { setResult(r.answer); react("explaining", 2500); }
      else { setErr(r.error); react("error", 2000); }
    } catch {
      setErr("Couldn't reach the scanner service. Check your connection and try again.");
      react("error", 2000);
    }
    setBusy(false);
  };

  const saveResult = async () => {
    if (!result || saving) return;
    setSaving(true);
    const title = (result.split("\n").find((l) => l.trim() && !/what i see/i.test(l)) ?? "Scan").replace(/[#*]/g, "").trim().slice(0, 100) || "Scan";
    const { error } = await supabase.from("scan_history").insert({ user_id: user.id, title, result, lang });
    setSaving(false);
    if (error) { setSaveMsg("Couldn’t save this scan. Please try again."); react("error"); return; }
    setSaveMsg("Saved to your scan history."); react("happy");
    qc.invalidateQueries({ queryKey: ["scan-history", user.id] });
  };

  const removeHistory = async (id: string) => {
    const { error } = await supabase.from("scan_history").delete().eq("id", id);
    if (!error) qc.invalidateQueries({ queryKey: ["scan-history", user.id] });
  };

  const clear = () => { setPreview(null); setResult(null); setErr(null); setSaveMsg(""); [camRef, galRef].forEach((r) => { if (r.current) r.current.value = ""; }); };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-6">
        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <Mascot state={busy ? "scanning" : mascot} className="w-24 shrink-0" />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Scan & Learn <span className="align-middle rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">Beta</span></h1>
            <p className="mt-1 text-muted-foreground">Photograph a textbook page, diagram or equation — the AI reads the actual image and explains it step by step.</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={cn(cardCls, "space-y-4")}>
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Take a photo" onChange={(e) => pick(e.target.files?.[0])} />
            <input ref={galRef} type="file" accept="image/*" className="hidden" aria-label="Upload from gallery" onChange={(e) => pick(e.target.files?.[0])} />
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl">
                <img src={preview} alt="Selected scan" className="mx-auto max-h-72 rounded-2xl border-2 border-input object-contain" />
                {busy && <span className="scan-line absolute inset-x-4 h-1 rounded-full bg-primary/70" />}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => camRef.current?.click()} className="grid place-items-center gap-2 rounded-3xl border-2 border-dashed border-input bg-background/60 px-4 py-10 transition hover:border-primary/60"><Camera className="h-9 w-9 text-primary" /><span className="font-bold">Take a photo</span></button>
                <button onClick={() => galRef.current?.click()} className="grid place-items-center gap-2 rounded-3xl border-2 border-dashed border-input bg-background/60 px-4 py-10 transition hover:border-primary/60"><ImageUp className="h-9 w-9 text-primary" /><span className="font-bold">Upload from gallery</span></button>
                <p className="text-center text-xs text-muted-foreground sm:col-span-2">Textbook page · diagram · equation (max ~4 MB)</p>
              </div>
            )}
            {preview && !busy && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="rounded-full" onClick={() => camRef.current?.click()}><RefreshCw />Retake</Button>
                <Button variant="secondary" className="rounded-full" onClick={() => galRef.current?.click()}><ImageUp />Replace</Button>
                <Button variant="ghost" className="rounded-full" onClick={clear}><X />Cancel</Button>
              </div>
            )}
            <Button onClick={analyze} disabled={!preview || busy} className="h-12 w-full rounded-full">
              {busy ? <><Loader2 className="animate-spin" /> Scanning…</> : <><ScanLine /> {result || err ? "Scan again" : "Explain this image"}</>}
            </Button>
          </section>

          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">Explanation</h2>
            {!result && !err && !busy && <p className="text-sm text-muted-foreground">Your explanation will appear here, in your selected language. The scanner only describes what it can actually see in your image.</p>}
            {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading text, equations and diagrams…</p>}
            {err && <div role="alert" className="space-y-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"><p>{err}</p>{preview && <Button size="sm" variant="secondary" className="rounded-full" onClick={analyze}>Retry</Button>}</div>}
            {result && <>
              <SpokenText text={result} className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-foreground" />
              <div className="flex items-center gap-3"><Button variant="secondary" className="rounded-full" disabled={saving || !!saveMsg.startsWith("Saved")} onClick={() => void saveResult()}><Save />Save to history</Button>{saveMsg && <span className="text-sm font-bold">{saveMsg}</span>}</div>
              <p className="text-xs text-muted-foreground">3D molecule views appear only for compounds in the Compounds library; scans don’t generate 3D models.</p>
            </>}
          </section>
        </div>

        {result && <AskAboutTopic topic="Scanned image" context={result} onMascot={react} />}

        <section className={cn(cardCls, "space-y-3")}>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><History className="h-5 w-5 text-primary" />Scan history</h2>
          {history.isError && <p role="alert" className="text-sm text-destructive">Your scan history couldn’t load. Please refresh.</p>}
          {history.data?.length === 0 && <p className="text-sm text-muted-foreground">No saved scans yet.</p>}
          {history.data?.map((h) => (
            <details key={h.id} className="rounded-2xl bg-background/60 p-3">
              <summary className="flex cursor-pointer items-center justify-between gap-2 font-bold"><span>{h.title}</span><span className="text-xs font-normal text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span></summary>
              <SpokenText text={h.result} className="mt-2 text-sm" />
              <Button size="sm" variant="ghost" className="mt-2 rounded-full text-destructive" onClick={() => void removeHistory(h.id)}><Trash2 />Delete</Button>
            </details>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
