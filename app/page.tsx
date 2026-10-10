'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { de, pagini } from '@/lib/plan';

type Row = { username: string; done: number; total: number; doneP: number; totalP: number; current: string | null; currentBook: string | null; updatedAt: string };

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState<Row[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => {
      if (d.error) setLoadErr(d.error); else setUsers(d.users);
    }).catch(() => setLoadErr('Nu am putut încărca lista. Verifică conexiunea și reîncarcă pagina.'));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Nu am putut crea programul.'); return; }
      router.push('/u/' + d.username);
    } catch { setErr('Nu am putut crea programul. Verifică conexiunea.'); }
    finally { setBusy(false); }
  }

  return (
    <main>
      <h1>Programe de rezidențiat</h1>
      <p className="sub">Prima trecere prin bibliografie, cu grile pe repetiție spațiată. Fiecare își face programul lui și le poate vedea pe ale celorlalți.</p>

      <form className="create" onSubmit={create}>
        <input aria-label="Numele tău" placeholder="Numele tău, ex. andrei" value={name} onChange={e => setName(e.target.value)} autoCapitalize="none" autoCorrect="off" maxLength={24} />
        <button className="btn primary" style={{ ['--c' as any]: 'var(--K)' }} disabled={busy || name.trim().length < 2}>Creează programul</button>
      </form>
      {err && <p className="err">{err}</p>}

      {loadErr && <p className="err" style={{ marginTop: 24 }}>{loadErr}</p>}
      {users && users.length === 0 && <p className="hint" style={{ marginTop: 28 }}>Încă nu are nimeni program. Fă-l tu pe primul.</p>}
      {users && users.length > 0 && (
        <ul className="people">
          {users.map(u => (
            <li key={u.username}>
              <Link className="person" href={'/u/' + u.username}>
                <div className="pname">{u.username}</div>
                <div className="pline">
                  {u.done} din {u.total} {de(u.total)}teme, {u.doneP} din {pagini(u.totalP)}
                  {u.current ? <>. Acum: {u.current}</> : <>. Prima trecere terminată.</>}
                </div>
                <div className="bar"><div className="seg" style={{ ['--c' as any]: `var(--${u.currentBook || 'K'})`, flex: 1 }}><i style={{ width: (u.doneP / u.totalP * 100).toFixed(1) + '%' }} /></div></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!users && !loadErr && <p className="hint" style={{ marginTop: 28 }}>Se încarcă…</p>}
    </main>
  );
}
