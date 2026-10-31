import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang-store";
import { synthesizeSpeech } from "@/lib/speech.functions";

export function splitSentences(text: string): string[] {
  return text.replace(/[*#_`>]/g, "").split(/(?<=[.!?۔؟])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

function makeChunks(sentences: string[], maxChars = 2400): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current}\n${sentence}` : sentence;
    if (next.length > maxChars && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

let activeStop: (() => void) | null = null;

/** Uses server-side ElevenLabs TTS only; avoids unrelated browser/system voices. */
export function ReadAloud({ text, onSentence }: { text: string; onSentence?: (i: number) => void }) {
  const [lang] = useLang();
  const labels = {
    en: { listen: "Listen", pause: "Pause", resume: "Resume", stop: "Stop" },
    ur: { listen: "سنیں", pause: "وقفہ", resume: "دوبارہ چلائیں", stop: "بند کریں" },
    roman: { listen: "Sunein", pause: "Rokein", resume: "Dobara chalayein", stop: "Band karein" },
    sd: { listen: "ٻڌو", pause: "روڪيو", resume: "ٻيهر هلايو", stop: "بند ڪريو" },
  }[lang];
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [note, setNote] = useState("");
  const [current, setCurrent] = useState(-1);
  const cancelled = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const speakOnServer = useServerFn(synthesizeSpeech);
  const sentences = splitSentences(text);

  const clearAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stop = () => {
    cancelled.current = true;
    clearAudio();
    setStatus("idle");
    setCurrent(-1);
    onSentence?.(-1);
  };

  useEffect(() => () => {
    if (activeStop === stop) activeStop = null;
    clearAudio();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { stop(); setNote(""); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps


  const playAudioChunk = async (audioBase64: string, mimeType: string) => {
    clearAudio();
    const binary = window.atob(audioBase64);
    const audioBuffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(audioBuffer);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const url = URL.createObjectURL(new Blob([audioBuffer], { type: mimeType }));
    objectUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("The generated voice audio could not be played by this browser."));
      void audio.play().catch(reject);
    });
    clearAudio();
  };

  const play = async () => {
    if (!text.trim()) return;
    activeStop?.();
    activeStop = stop;
    cancelled.current = false;
    setNote("");
    setStatus("playing");
    try {
      const chunks = makeChunks(sentences);
      for (const chunk of chunks) {
        if (cancelled.current) return;
        const result = await speakOnServer({ data: { text: chunk, lang } });
        if (cancelled.current) return;
        if (!result.ok) throw new Error(result.error);
        setNote(`Voice: ${result.voiceName}`);
        setCurrent(-1);
        onSentence?.(-1);
        await playAudioChunk(result.audioBase64, result.mimeType);
      }
      if (!cancelled.current) {
        setStatus("idle");
        setCurrent(-1);
        onSentence?.(-1);
      }
    } catch (error) {
      if (!cancelled.current) {
        setNote(error instanceof Error ? error.message : "Voice playback failed. Please try again.");
        setStatus("idle");
      }
    }
  };

  const pause = () => {
    if (audioRef.current) audioRef.current.pause();
    setStatus("paused");
  };
  const resume = () => {
    if (audioRef.current) void audioRef.current.play().catch((error: unknown) => setNote(error instanceof Error ? error.message : "Could not resume audio."));
    setStatus("playing");
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {status === "idle" && <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void play()}><Volume2 />{labels.listen}</Button>}
        {status === "playing" && <Button size="sm" variant="secondary" className="rounded-full" onClick={pause}><Pause />{labels.pause}</Button>}
        {status === "paused" && <Button size="sm" variant="secondary" className="rounded-full" onClick={resume}><Play />{labels.resume}</Button>}
        {status !== "idle" && <Button size="sm" variant="ghost" className="rounded-full" onClick={stop}><Square />{labels.stop}</Button>}
        {status !== "idle" && current >= 0 && <span className="text-xs text-muted-foreground">Sentence {current + 1} / {sentences.length}</span>}
      </div>
      {note && <p className="text-xs text-muted-foreground" role="status">{note}</p>}
    </div>
  );
}

/** Text block that highlights the sentence being read aloud. */
export function SpokenText({ text, className }: { text: string; className?: string }) {
  const [cur, setCur] = useState(-1);
  const parts = splitSentences(text);
  return (
    <div className={className}>
      <ReadAloud text={text} onSentence={setCur} />
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">
        {parts.map((sentence, index) => <span key={index} className={index === cur ? "rounded bg-accent px-0.5" : undefined}>{sentence} </span>)}
      </p>
    </div>
  );
}
