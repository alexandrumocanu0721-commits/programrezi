import { BOOKS, SYSTEMS, type Topic } from './catalog';

export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export type Preset = 'tematica' | 'medicala' | 'chirurgie' | 'greu' | 'usor' | 'sisteme';
export const PRESETS: { id: Preset; label: string }[] = [
  { id: 'tematica', label: 'Ca în tematică' },
  { id: 'medicala', label: 'Medicală întâi' },
  { id: 'chirurgie', label: 'Chirurgie întâi' },
  { id: 'sisteme', label: 'Pe sisteme' },
  { id: 'greu', label: 'De la greu la ușor' },
  { id: 'usor', label: 'De la ușor la greu' },
];

export function applyPreset(p: Preset, catalogTopics: Topic[]): string[] {
  const base = catalogTopics.map((t, i) => ({ t, i }));
  const by = (f: (x: { t: Topic; i: number }) => number) => [...base].sort((a, b) => f(a) - f(b) || a.i - b.i).map(x => x.t.id);
  switch (p) {
    case 'medicala': return by(x => ({ K: 0, L: 1, S: 2 })[x.t.b]);
    case 'chirurgie': return by(x => ({ L: 0, K: 1, S: 2 })[x.t.b]);
    case 'greu': return by(x => -x.t.d);
    case 'usor': return by(x => x.t.d);
    case 'sisteme': return by(x => { const k = SYSTEMS.indexOf(x.t.sys); return k < 0 ? 99 : k; });
    default: return base.map(x => x.t.id);
  }
}

// „cardio, apoi pneumo, apoi chirurgie, restul cum era”
// Fiecare bucată de text ia temele care se potrivesc, în ordinea scrisă; restul rămân după, în ordinea curentă.
export function orderFromText(text: string, current: Topic[]) {
  const chunks = norm(text).split(/,|;|\n|→|->|\bapoi\b|\bdupa\b|\bsi\b|\+/).map(s => s.trim()).filter(Boolean);
  const hay = new Map(current.map(t => [t.id, norm(`${t.t} ${t.k} ${BOOKS[t.b].k} ${t.c}`).split(/[^a-z0-9]+/).filter(Boolean)]));
  const placed: string[] = [], used = new Set<string>(), unmatched: string[] = [];
  for (const chunk of chunks) {
    if (/^rest/.test(chunk)) continue;
    const words = chunk.split(/\s+/).filter(w => w.length >= 3 || /^\d+$/.test(w));
    if (!words.length) continue;
    const hits = current.filter(t => !used.has(t.id) && words.every(w => hay.get(t.id)!.some(h => h.startsWith(w))));
    if (!hits.length) { unmatched.push(chunk); continue; }
    hits.forEach(t => { used.add(t.id); placed.push(t.id); });
  }
  const order = [...placed, ...current.filter(t => !used.has(t.id)).map(t => t.id)];
  return { order, matched: placed.length, unmatched };
}
