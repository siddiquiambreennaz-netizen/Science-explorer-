import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const KEY = "sx-lang";
const EVT = "sx-lang-change";
const VALID: Lang[] = ["en", "ur", "roman", "sd"];

export function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(KEY) as Lang | null;
  return v && VALID.includes(v) ? v : "en";
}
export function saveLang(l: Lang) {
  window.localStorage.setItem(KEY, l);
  window.dispatchEvent(new Event(EVT));
}
/** The student's selected language, kept in sync across the app. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const sync = () => setLang(readLang());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return [lang, saveLang];
}

/** Instruction appended to AI prompts so answers match the selected language. */
export const LANG_INSTRUCTION: Record<Lang, string> = {
  en: "Answer in English.",
  ur: "Answer entirely in Urdu, written in Urdu (Nastaliq/Arabic) script. Keep chemical formulas and equations in standard notation.",
  roman: "Answer entirely in Roman Urdu (Urdu written with English/Latin letters). Keep chemical formulas and equations in standard notation.",
  sd: "Answer entirely in Sindhi, written in Sindhi (Arabic) script. Keep chemical formulas and equations in standard notation.",
};

/** BCP-47 voice tags to try, best first. Roman Urdu has no dedicated voice, so Urdu/Hindi/English voices are tried. */
export const VOICE_TAGS: Record<Lang, string[]> = {
  en: ["en-GB", "en-US", "en"],
  ur: ["ur-PK", "ur-IN", "ur"],
  sd: ["sd-PK", "sd-IN", "sd"],
  roman: ["ur-PK", "hi-IN", "en-IN", "en"],
};
