import { NextResponse } from 'next/server';
import { sql, ensureTable } from '@/lib/db';
import { normalizeUsername, sanitize, ValidationError } from '@/lib/validate';

export const dynamic = 'force-dynamic';
type Ctx = { params: { username: string } };

function fail(e: any) {
  const status = e instanceof ValidationError ? 400 : 500;
  return NextResponse.json({ error: e.message || 'Eroare de server.' }, { status });
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const u = normalizeUsername(params.username);
    await ensureTable();
    const rows = (await sql()`SELECT data, updated_at FROM planners WHERE username = ${u}`) as { data: any; updated_at: string }[];
    if (!rows.length) return NextResponse.json({ error: 'Programul nu există.' }, { status: 404 });
    // Trece și datele vechi prin validare, ca să fie mereu în formatul curent.
    return NextResponse.json({ username: u, state: sanitize(rows[0].data), updatedAt: rows[0].updated_at });
  } catch (e) { return fail(e); }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const u = normalizeUsername(params.username);
    const body = await req.json().catch(() => null);
    const state = sanitize(body?.state);
    await ensureTable();
    const rows = (await sql()`UPDATE planners SET data = ${JSON.stringify(state)}::jsonb, updated_at = now()
      WHERE username = ${u} RETURNING updated_at`) as { updated_at: string }[];
    if (!rows.length) return NextResponse.json({ error: 'Programul nu există.' }, { status: 404 });
    return NextResponse.json({ ok: true, updatedAt: rows[0].updated_at });
  } catch (e) { return fail(e); }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const u = normalizeUsername(params.username);
    await ensureTable();
    await sql()`DELETE FROM planners WHERE username = ${u}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
