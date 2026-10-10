import { getCatalog, DEFAULT_CATALOG, type Topic } from './catalog';

export interface TopicState { days?: number; done?: boolean; doneDate?: string }

export interface UserState {
  v: 2;
  catalog: string;
  settings: { start: string; target: string; xmas: boolean; sat: boolean };
  order: string[];
  topics: Record<string, TopicState>;
  overrides: Record<string, 'blocked' | 'study'>;
  replanFrom: string | null;
  grile: { total: number; weights: number[]; excluded: string[]; boost: string[] };
}

export const INT = [0, 2, 7, 14, 30, 60];
export const DEFAULT_WEIGHTS = [20, 15, 10, 7, 4, 2];

export function defaultState(catalogId = DEFAULT_CATALOG): UserState {
  const cat = getCatalog(catalogId);
  return {
    v: 2,
    catalog: catalogId,
    settings: { start: '2026-10-12', target: '2027-02-05', xmas: true, sat: false },
    order: cat.topics.map(t => t.id),
    topics: {},
    overrides: {},
    replanFrom: null,
    grile: { total: 75, weights: [...DEFAULT_WEIGHTS], excluded: [], boost: [] },
  };
}

// ---------- date ----------
export const MON = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export const DOW = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
const pad = (n: number) => String(n).padStart(2, '0');
export const D = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => iso(D(s) + n * 864e5);
export const dowOf = (s: string) => new Date(D(s)).getUTCDay();
export const diffDays = (a: string, b: string) => Math.round((D(b) - D(a)) / 864e5);
export const todayISO = () => { const t = new Date(); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); };
export const mondayOf = (s: string) => addDays(s, -((dowOf(s) + 6) % 7));
export const fmtDay = (s: string) => { const d = new Date(D(s)); return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
export const fmtShort = (s: string) => { const d = new Date(D(s)); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
export function fmtRange(a: string, b: string) {
  if (a === b) return fmtDay(a);
  const x = new Date(D(a)), y = new Date(D(b));
  if (x.getUTCMonth() === y.getUTCMonth()) return x.getUTCDate() + '–' + y.getUTCDate() + ' ' + MON[y.getUTCMonth()];
  return fmtShort(a) + ' – ' + fmtShort(b);
}

// ---------- română ----------
export const de = (n: number) => { const r = n % 100; return n !== 0 && (r === 0 || r >= 20) ? 'de ' : ''; };
export const zile = (n: number) => (n === 1 ? 'o zi' : n + ' ' + de(n) + 'zile');
export const pagini = (n: number) => (n === 1 ? 'o pagină' : n + ' ' + de(n) + 'pagini');
export const DIFF = ['', 'ușor', 'mediu', 'greu'];

// ---------- plan ----------
export function orderedTopics(state: UserState): Topic[] {
  const cat = getCatalog(state.catalog);
  const byId = new Map(cat.topics.map(t => [t.id, t]));
  const seen = new Set<string>();
  const out: Topic[] = [];
  for (const id of state.order) { const t = byId.get(id); if (t && !seen.has(id)) { out.push(t); seen.add(id); } }
  for (const t of cat.topics) if (!seen.has(t.id)) out.push(t);
  return out;
}

export const tdays = (s: UserState, t: Topic) => s.topics[t.id]?.days || t.days;
export const isDone = (s: UserState, t: Topic) => !!s.topics[t.id]?.done;

export type DayType = 'study' | 'buf' | 'off' | 'hol' | 'blk';
export function baseType(s: UserState, d: string): DayType {
  const md = d.slice(5);
  if (s.settings.xmas && (md >= '12-24' || md <= '01-03')) return 'hol';
  const w = dowOf(d);
  if (w === 0) return 'off';
  if (w === 6) return s.settings.sat ? 'study' : 'buf';
  return 'study';
}
export function dayType(s: UserState, d: string): DayType {
  const o = s.overrides[d];
  if (o === 'blocked') return 'blk';
  if (o === 'study') return 'study';
  return baseType(s, d);
}
function nextStudy(s: UserState, d: string) { let i = 0; while (dayType(s, d) !== 'study' && i < 500) { d = addDays(d, 1); i++; } return d; }
export function studyBetween(s: UserState, a: string, b: string) {
  let n = 0, i = 0;
  for (let d = a; d <= b && i < 800; d = addDays(d, 1), i++) if (dayType(s, d) === 'study') n++;
  return n;
}

export interface Computed {
  map: Record<string, { t: Topic; k: number; n: number }>;
  spans: Record<string, string[]>;
  doneMap: Record<string, Topic>;
  end: string | null;
  firstFree: string;
}

export function compute(s: UserState, list: Topic[]): Computed {
  const st = s.settings;
  let cursor = st.start;
  let lastDone: string | null = null;
  const done = list.filter(t => isDone(s, t) && s.topics[t.id]?.doneDate)
    .sort((a, b) => (s.topics[a.id].doneDate! < s.topics[b.id].doneDate! ? -1 : 1));
  done.forEach(t => { const d = s.topics[t.id].doneDate!; if (!lastDone || d > lastDone) lastDone = d; });
  if (lastDone && addDays(lastDone, 1) > cursor) cursor = addDays(lastDone, 1);
  if (s.replanFrom && s.replanFrom > cursor) cursor = s.replanFrom;
  const firstFree = cursor;
  const map: Computed['map'] = {}, spans: Computed['spans'] = {};
  let end: string | null = lastDone;
  list.forEach(t => {
    if (isDone(s, t)) return;
    const n = tdays(s, t), dates: string[] = [];
    for (let k = 0; k < n; k++) {
      cursor = nextStudy(s, cursor);
      dates.push(cursor); map[cursor] = { t, k: k + 1, n }; end = cursor;
      cursor = addDays(cursor, 1);
    }
    spans[t.id] = dates;
  });
  const doneMap: Computed['doneMap'] = {};
  let prev = addDays(st.start, -1);
  done.forEach(t => {
    const dd = s.topics[t.id].doneDate!;
    let d = addDays(prev, 1); if (d < st.start) d = st.start;
    let i = 0;
    while (d <= dd && i < 400) { if (dayType(s, d) === 'study' && !map[d]) doneMap[d] = t; d = addDays(d, 1); i++; }
    if (dd > prev) prev = dd;
  });
  return { map, spans, doneMap, end, firstFree };
}

// ---------- grile: repetiție spațiată ----------
export interface Reviews { R: Record<string, (string | undefined)[]>; byDate: Record<string, { t: Topic; s: number }[]> }

export function reviews(s: UserState, list: Topic[], C: Computed): Reviews {
  let begin = s.settings.start;
  list.forEach(t => { const x = s.topics[t.id]; if (x?.done && x.doneDate && x.doneDate < begin) begin = x.doneDate; });
  const days: string[] = [], idx: Record<string, number> = {};
  let d = begin;
  for (let i = 0; i < 1200; i++) { if (dayType(s, d) === 'study') { idx[d] = days.length; days.push(d); } d = addDays(d, 1); }
  const lastIdx = (a: string) => { let x = a; for (let i = 0; i < 20; i++) { if (idx[x] != null) return idx[x]; x = addDays(x, -1); } return -1; };
  const R: Reviews['R'] = {}, byDate: Reviews['byDate'] = {};
  list.forEach(t => {
    const x = s.topics[t.id];
    let a: string | null = null;
    if (x?.done && x.doneDate) a = x.doneDate; else { const sp = C.spans[t.id]; if (sp?.length) a = sp[sp.length - 1]; }
    if (!a) return;
    const base = lastIdx(a);
    const dates = INT.map(k => (k === 0 ? a! : days[base + k]));
    R[t.id] = dates;
    dates.forEach((dd, st) => { if (dd) (byDate[dd] ||= []).push({ t, s: st }); });
  });
  return { R, byDate };
}

// Împarte totalul proporțional cu ponderile (metoda celui mai mare rest), ca suma să iasă exact.
export function alloc(weights: number[], N: number): number[] {
  const tot = weights.reduce((a, b) => a + b, 0);
  if (!tot) return weights.map(() => 0);
  const raw = weights.map(w => (N * w) / tot);
  const out = raw.map(Math.floor);
  let rem = N - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rem > 0) { out[i]++; rem--; } });
  return out;
}

export function grileFor(s: UserState, RV: Reviews, date: string) {
  const items = (RV.byDate[date] || [])
    .filter(x => !s.grile.excluded.includes(x.t.id))
    .sort((a, b) => a.s - b.s || s.order.indexOf(a.t.id) - s.order.indexOf(b.t.id));
  const w = items.map(x => (s.grile.weights[x.s] ?? 0) * (s.grile.boost.includes(x.t.id) ? 2 : 1));
  const counts = alloc(w, s.grile.total);
  return items.map((x, i) => ({ ...x, count: counts[i], boosted: s.grile.boost.includes(x.t.id) }));
}

export function summary(s: UserState) {
  const list = orderedTopics(s);
  const doneT = list.filter(t => isDone(s, t));
  const totalP = list.reduce((a, t) => a + t.n, 0);
  const doneP = doneT.reduce((a, t) => a + t.n, 0);
  const cur = list.find(t => !isDone(s, t));
  return { done: doneT.length, total: list.length, doneP, totalP, current: cur ? cur.t : null, currentBook: cur ? cur.b : null };
}
