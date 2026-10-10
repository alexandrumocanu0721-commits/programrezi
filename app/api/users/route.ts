import { NextResponse } from 'next/server';
import { sql, ensureTable } from '@/lib/db';
import { defaultState, summary, type UserState } from '@/lib/plan';
import { normalizeUsername, ValidationError } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// Lista tuturor programelor, cu un rezumat pentru pagina principală.
export async function GET() {
  try {
    await ensureTable();
    const rows = (await sql()`SELECT username, data, updated_at FROM planners ORDER BY updated_at DESC`) as { username: string; data: UserState; updated_at: string }[];
    return NextResponse.json({ users: rows.map(r => ({ username: r.username, updatedAt: r.updated_at, ...summary(r.data) })) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Eroare de server.' }, { status: 500 });
  }
}

// Creează un program nou cu setările implicite.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body.username);
    await ensureTable();
    const rows = await sql()`INSERT INTO planners (username, data) VALUES (${username}, ${JSON.stringify(defaultState())}::jsonb)
      ON CONFLICT (username) DO NOTHING RETURNING username`;
    if (!rows.length) return NextResponse.json({ error: `Numele „${username}” e deja luat.` }, { status: 409 });
    return NextResponse.json({ username }, { status: 201 });
  } catch (e: any) {
    const status = e instanceof ValidationError ? 400 : 500;
    return NextResponse.json({ error: e.message || 'Eroare de server.' }, { status });
  }
}
