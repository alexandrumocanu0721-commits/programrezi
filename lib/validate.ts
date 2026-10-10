import { CATALOGS, DEFAULT_CATALOG } from './catalog';
import { DEFAULT_WEIGHTS, type UserState } from './plan';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isISO = (x: unknown): x is string => typeof x === 'string' && ISO.test(x) && !isNaN(Date.parse(x));
const int = (x: unknown, lo: number, hi: number, dflt: number) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

export class ValidationError extends Error {}

export function normalizeUsername(raw: unknown): string {
  const u = String(raw ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9][a-z0-9_-]{1,23}$/.test(u)) throw new ValidationError('Numele trebuie să aibă 2–24 de caractere: litere, cifre, - sau _.');
  return u;
}

// Serverul acceptă doar teme din tematica oficială: ordinea trebuie să conțină
// exact temele din catalog, fiecare o singură dată. Orice altceva e respins.
export function sanitize(input: any): UserState {
  if (!input || typeof input !== 'object') throw new ValidationError('Date lipsă.');
  const catalog = CATALOGS[input.catalog] ? input.catalog : DEFAULT_CATALOG;
  const ids = CATALOGS[catalog].topics.map(t => t.id);
  const idSet = new Set(ids);

  const order: unknown = input.order;
  if (!Array.isArray(order) || order.length !== ids.length || new Set(order).size !== ids.length || !order.every(x => typeof x === 'string' && idSet.has(x)))
    throw new ValidationError('Ordinea trebuie să conțină exact temele din tematică, fiecare o singură dată.');

  const topics: UserState['topics'] = {};
  for (const [id, v] of Object.entries(input.topics || {})) {
    if (!idSet.has(id) || !v || typeof v !== 'object') continue;
    const o: any = v; const t: any = {};
    if (o.days != null) t.days = int(o.days, 1, 15, 1);
    if (o.done === true) { t.done = true; if (isISO(o.doneDate)) t.doneDate = o.doneDate; }
    if (Object.keys(t).length) topics[id] = t;
  }

  const overrides: UserState['overrides'] = {};
  for (const [d, v] of Object.entries(input.overrides || {}).slice(0, 2000)) {
    if (isISO(d) && (v === 'blocked' || v === 'study')) overrides[d] = v;
  }

  const s = input.settings || {};
  const g = input.grile || {};
  const weights = Array.isArray(g.weights) && g.weights.length === 6 ? g.weights.map((w: unknown) => int(w, 0, 1000, 0)) : [...DEFAULT_WEIGHTS];
  const pick = (arr: unknown) => (Array.isArray(arr) ? Array.from(new Set(arr.filter((x): x is string => typeof x === 'string' && idSet.has(x)))) : []);

  return {
    v: 2,
    catalog,
    settings: {
      start: isISO(s.start) ? s.start : '2026-10-12',
      target: isISO(s.target) ? s.target : '2027-02-05',
      xmas: s.xmas !== false,
      sat: s.sat === true,
    },
    order: order as string[],
    topics,
    overrides,
    replanFrom: isISO(input.replanFrom) ? input.replanFrom : null,
    grile: { total: int(g.total, 0, 1000, 75), weights, excluded: pick(g.excluded), boost: pick(g.boost) },
  };
}
