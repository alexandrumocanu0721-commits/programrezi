import { neon } from '@neondatabase/serverless';

let ready: Promise<void> | null = null;

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Lipsește variabila DATABASE_URL. Vezi README.');
  return neon(url);
}

// Creează tabelul la prima cerere, ca să nu ai nevoie de migrări.
export function ensureTable() {
  if (!ready) {
    ready = sql()`CREATE TABLE IF NOT EXISTS planners (
      username   text PRIMARY KEY,
      data       jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`.then(() => undefined).catch(e => { ready = null; throw e; });
  }
  return ready;
}
