export type OfflineQuestion = {
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
};

export type OfflineGame = {
  mechanic: "sequence" | "sort" | "match";
  items: { id: string; label: string; icon: string; correctTarget: string; hint: string; feedback: string }[];
  targets: { id: string; label: string; icon: string; hint: string }[];
  hints: string[];
  reward: string;
};

export type OfflineActivity =
  | { kind: "molecule"; equation?: { equation: string; coefficients: number[]; balanced: number[]; fact: string }; challenges: { formula: string; name: string; atoms: Record<string, number>; fact: string }[] }
  | { kind: "equation"; equation: string; coefficients: number[]; balanced: number[]; fact: string }
  | { kind: "magnet"; challenges: { north: "N" | "S"; south: "N" | "S"; material: string; magnetic: boolean; distance: number; explanation: string }[] }
  | { kind: "planet-order"; planets: { name: string; emoji: string; order: number }[] }
  | { kind: "cell-sort"; parts: { name: string; function: string; zone: string }[] };

export type OfflinePack = {
  id: string;
  title: string;
  subject: string;
  icon: string;
  theme: string;
  description: string;
  story: string;
  objective: string;
  facts: string[];
  questions: OfflineQuestion[];
  game?: OfflineGame;
  activity?: OfflineActivity;
  contentType?: "game" | "lesson" | "note";
  lessonSections?: { title: string; body: string }[];
  savedAt: number;
  lastScore?: number;
  lastTotal?: number;
  lastPlayedAt?: number;
};

const DB_NAME = "science-explorer-offline";
const STORE_NAME = "packs";
const FALLBACK_KEY = "sx-offline-packs-v1";
const CHANGE_EVENT = "sx-offline-packs-change";

function fallbackRead(): OfflinePack[] {
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as OfflinePack[]) : [];
  } catch {
    return [];
  }
}

function fallbackWrite(packs: OfflinePack[]) {
  window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(packs));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function listOfflinePacks(): Promise<OfflinePack[]> {
  const db = await openDatabase();
  if (!db) return fallbackRead();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      db.close();
      const merged = new Map<string, OfflinePack>();
      for (const pack of fallbackRead()) merged.set(pack.id, pack);
      for (const pack of request.result as OfflinePack[]) merged.set(pack.id, pack);
      resolve([...merged.values()].sort((a, b) => b.savedAt - a.savedAt));
    };
    request.onerror = () => { db.close(); resolve(fallbackRead()); };
  });
}

export async function saveOfflinePack(pack: OfflinePack): Promise<void> {
  const current = await listOfflinePacks();
  const next = [...current.filter((item) => item.id !== pack.id), { ...pack, savedAt: Date.now() }];
  const db = await openDatabase();
  if (!db) {
    fallbackWrite(next);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ ...pack, savedAt: Date.now() });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }).catch(() => fallbackWrite(next)).finally(() => db.close());
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export async function removeOfflinePack(id: string): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    fallbackWrite(fallbackRead().filter((item) => item.id !== id));
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).catch(() => fallbackWrite(fallbackRead().filter((item) => item.id !== id))).finally(() => db.close());
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeOfflinePacks(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
