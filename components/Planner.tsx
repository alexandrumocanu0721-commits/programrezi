'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BOOKS, getCatalog, type Book, type Topic } from '@/lib/catalog';
import {
  INT, DEFAULT_WEIGHTS, DIFF, MON, addDays, compute, dayType, baseType, de, diffDays, fmtDay, fmtRange, fmtShort,
  grileFor, isDone, mondayOf, orderedTopics, pagini, reviews, studyBetween, tdays, todayISO, zile, actualDays, pace,
  type Computed, type Reviews, type UserState,
} from '@/lib/plan';
import ReorderPanel from './ReorderPanel';

type Save = 'idle' | 'saving' | 'saved' | 'error';
const c = (b: Book) => ({ ['--c' as any]: `var(--${b})` });

const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
);

function Pips({ d }: { d: number }) {
  return (
    <span className="diff"><span className="pips" aria-hidden="true">{[1, 2, 3].map(i => <b key={i} className={i <= d ? 'on' : ''} />)}</span>{DIFF[d]}</span>
  );
}

function Track({ dates, today }: { dates: (string | undefined)[]; today: string }) {
  return (
    <span className="track" aria-hidden="true">
      {INT.map((k, i) => {
        const d = dates[i];
        const cls = ['tr', d && d < today ? 'p' : '', d === today ? 't' : ''].join(' ');
        return <span key={k} className={cls} title={'ziua ' + k + (d ? ': ' + fmtDay(d) : '')}>{k}</span>;
      })}
    </span>
  );
}

export default function Planner({ username }: { username: string }) {
  const router = useRouter();
  const [st, setSt] = useState<UserState | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [save, setSave] = useState<Save>('idle');
  const [saveErr, setSaveErr] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [gDate, setGDate] = useState<string | null>(null);
  const [reorder, setReorder] = useState(false);
  const dirty = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((m: string) => {
    setToastMsg(m); setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2600);
  }, []);

  // încărcare
  useEffect(() => {
    let alive = true;
    fetch('/api/users/' + encodeURIComponent(username)).then(async r => {
      const d = await r.json();
      if (!alive) return;
      if (r.status === 404) setPhase('missing');
      else if (!r.ok) setPhase('error');
      else { setSt(d.state); setPhase('ready'); }
    }).catch(() => alive && setPhase('error'));
    return () => { alive = false; };
  }, [username]);

  // salvare automată, la 800 ms după ultima modificare
  useEffect(() => {
    if (!st || !dirty.current) return;
    setSave('saving');
    const t = setTimeout(async () => {
      dirty.current = false;
      try {
        const r = await fetch('/api/users/' + encodeURIComponent(username), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: st }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { setSave('error'); setSaveErr(d.error || 'Nu s-a salvat.'); }
        else { setSave('saved'); setSaveErr(''); }
      } catch { setSave('error'); setSaveErr('Fără conexiune. Modificarea se salvează la următoarea schimbare.'); dirty.current = true; }
    }, 800);
    return () => clearTimeout(t);
  }, [st, username]);

  const mut = useCallback((fn: (s: UserState) => void) => {
    setSt(prev => { if (!prev) return prev; const n: UserState = JSON.parse(JSON.stringify(prev)); fn(n); dirty.current = true; return n; });
  }, []);

  const today = todayISO();
  const list = useMemo(() => (st ? orderedTopics(st) : []), [st]);
  const C = useMemo(() => (st ? compute(st, list) : null), [st, list]);
  const RV = useMemo(() => (st && C ? reviews(st, list, C) : null), [st, list, C]);

  if (phase === 'loading') return <main><p className="hint">Se încarcă programul…</p></main>;
  if (phase === 'missing') return <main><h1>Nu există programul „{username}”</h1><p className="sub">Poate numele e scris altfel. Îl poți crea de pe pagina principală.</p><Link className="btn" href="/">Înapoi la toate programele</Link></main>;
  if (phase === 'error' || !st || !C || !RV) return <main><h1>Programul nu s-a încărcat</h1><p className="sub">Serverul nu a răspuns. Reîncarcă pagina peste câteva secunde.</p></main>;

  const s = st;
  const remaining = list.filter(t => !isDone(s, t));
  const cur = remaining[0];

  // ---------- acțiuni ----------
  // Ziua 0 a grilelor = ziua în care ai terminat tema.
  // „Am terminat tema” din cardul de sus folosește mereu azi.
  // Bifa din listă: dacă planul zicea că tema se termina deja în trecut, presupunem că bifezi
  // retroactiv și folosim ziua din plan. Data se poate corecta oricând din temă.
  const toggleDone = (t: Topic, now = false) => {
    const sp = C.spans[t.id];
    const planned = sp?.length ? sp[sp.length - 1] : null;
    const when = !now && planned && planned < today ? planned : today;
    // Începutul real = prima zi planificată pentru temă (ziua de după tema anterioară).
    const began = sp?.length && sp[0] < when ? sp[0] : when;
    mut(n => {
      const x = (n.topics[t.id] ||= {});
      if (x.done) { delete x.done; delete x.doneDate; delete x.startDate; toast('Ai debifat: ' + t.t); }
      else {
        x.done = true; x.doneDate = when; x.startDate = began;
        toast(when === today ? 'Bifat: ' + t.t + '. Grilele pornesc de azi.' : 'Bifat cu data ' + fmtDay(when) + '. O poți schimba din temă.');
      }
    });
  };
  const setDates = (t: Topic, a: string, d: string) => {
    if (!a || !d || d > today) { toast('Alege date de azi sau din trecut.'); return; }
    if (a > d) { toast('Începutul trebuie să fie înainte de final.'); return; }
    mut(n => { const x = (n.topics[t.id] ||= {}); x.done = true; x.startDate = a; x.doneDate = d; });
    toast('Salvat: ' + fmtRange(a, d) + '. Grilele și ritmul s-au recalculat.');
  };
  const P = pace(s, list);
  const applyPace = () => {
    mut(n => { P.suggest.forEach(r => r.remaining.forEach(t => { (n.topics[t.id] ||= {}).days = Math.min(15, Math.max(1, Math.round(tdays(n, t) * r.ratio))); })); });
    toast('Am ajustat zilele temelor rămase după ritmul tău.');
  };
  const stepDays = (t: Topic, dlt: number) => mut(n => {
    const v = Math.min(15, Math.max(1, tdays(n, t) + dlt));
    (n.topics[t.id] ||= {}).days = v;
  });
  const tapDay = (d: string) => {
    if (d < s.settings.start) return;
    mut(n => {
      const base = baseType(n, d), o = n.overrides[d];
      if (base === 'study') {
        if (o === 'blocked') { delete n.overrides[d]; toast(fmtDay(d) + ' e din nou zi de studiu.'); }
        else { n.overrides[d] = 'blocked'; toast(fmtDay(d) + ' e indisponibilă. Planul s-a mutat.'); }
      } else {
        if (o === 'study') { delete n.overrides[d]; toast(fmtDay(d) + ' a revenit la normal.'); }
        else { n.overrides[d] = 'study'; toast(fmtDay(d) + ' devine zi de studiu.'); }
      }
    });
  };
  const toggleIn = (key: 'excluded' | 'boost', id: string) => mut(n => {
    const arr = n.grile[key]; const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
  });

  // ---------- antet ----------
  const totalP = list.reduce((a, t) => a + t.n, 0);
  const doneP = list.filter(t => isDone(s, t)).reduce((a, t) => a + t.n, 0);
  const doneN = list.length - remaining.length;
  let statusLine: React.ReactNode;
  if (!cur) statusLine = <>Ai terminat prima trecere. Felicitări!</>;
  else {
    const dd = diffDays(C.end!, s.settings.target);
    statusLine = dd >= 0
      ? <>Termini pe {fmtDay(C.end!)}, {dd === 0 ? 'exact în ziua țintă' : `cu ${zile(dd)} înainte de țintă (${fmtShort(s.settings.target)})`}.</>
      : <><span className="late">Termini pe {fmtDay(C.end!)}, cu {zile(-dd)} după țintă ({fmtShort(s.settings.target)}).</span> Fă din câteva sâmbete zile de studiu sau scade o zi la temele mai ușoare.</>;
  }
  const need = remaining.reduce((a, t) => a + tdays(s, t), 0);
  const avail = studyBetween(s, C.firstFree, s.settings.target);

  return (
    <main>
      <div className="topbar">
        <Link href="/">‹ Toate programele</Link>
        <span className={'saved' + (save === 'error' ? ' err' : '')} aria-live="polite">
          {save === 'saving' ? 'Se salvează…' : save === 'saved' ? 'Salvat' : save === 'error' ? saveErr : ''}
        </span>
      </div>

      <header>
        <h1>Programul lui {username}</h1>
        <p className="sub">{getCatalog(s.catalog).label}</p>
        <div className="bar" role="img" aria-label={`Progres: ${doneP} din ${totalP} pagini`}>
          {(['L', 'K', 'S'] as Book[]).map(b => {
            const ts = list.filter(t => t.b === b);
            const bp = ts.reduce((a, t) => a + t.n, 0), dp = ts.filter(t => isDone(s, t)).reduce((a, t) => a + t.n, 0);
            return <div key={b} className="seg" style={{ ...c(b), flex: bp }}><i style={{ width: (dp / bp * 100).toFixed(1) + '%' }} /></div>;
          })}
        </div>
        <p className="status">{statusLine}
          <small>{doneN} din {list.length} {de(list.length)}teme, {doneP} din {pagini(totalP)}.{cur && <> Mai ai {zile(need)} de studiu; până la țintă sunt {zile(avail)} libere în calendar.</>}</small>
        </p>
      </header>

      {cur && <NowCard s={s} cur={cur} next={remaining[1]} C={C} today={today} onDone={() => toggleDone(cur, true)} onStep={d => stepDays(cur, d)} onReplan={() => { mut(n => { n.replanFrom = todayISO(); }); toast('Planul pornește de azi.'); }} />}

      <GrileCard s={s} RV={RV} today={today} gDate={gDate} setGDate={setGDate} onTotal={v => mut(n => { n.grile.total = v; })} />

      <Calendar s={s} C={C} today={today} onTap={tapDay} />

      {P.measured > 0 && <PaceCard P={P} onApply={applyPace} />}

      <section className="topics" aria-label="Teme">
        <div className="sechead">
          <h2>{reorder ? 'Schimbă ordinea' : 'Temele în ordinea ta'}</h2>
          <button className="btn" onClick={() => setReorder(r => !r)}>{reorder ? 'Gata' : 'Schimbă ordinea'}</button>
        </div>
        {reorder ? (
          <ReorderPanel list={list} catalogTopics={getCatalog(s.catalog).topics} onChange={(order, msg) => { mut(n => { n.order = order; }); if (msg) toast(msg); }} />
        ) : (
          <ol className="tl">
            {list.map(t => {
              const done = isDone(s, t), open = expanded.has(t.id), sp = C.spans[t.id];
              const ds = RV.R[t.id];
              const ni = ds ? ds.findIndex(x => !!x && x >= today) : -1;
              const excluded = s.grile.excluded.includes(t.id), boosted = s.grile.boost.includes(t.id);
              return (
                <li key={t.id} className={'topic' + (done ? ' done' : '') + (cur?.id === t.id ? ' current' : '')} style={c(t.b)}>
                  <button className="check" onClick={() => toggleDone(t)} aria-pressed={done} aria-label={(done ? 'Debifează ' : 'Bifează ') + t.t}>{CHECK}</button>
                  <div>
                    <button className="ttitle" aria-expanded={open} onClick={() => setExpanded(p => { const n = new Set(p); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n; })}>{t.t}</button>
                    <div className="meta"><span className="book">{BOOKS[t.b].name}</span><span>{t.c}, p. {t.p}</span><span>{pagini(t.n)}</span><Pips d={t.d} /><span>{zile(tdays(s, t))}</span></div>
                    <div className="when2">{done ? <DoneLine s={s} t={t} /> : sp?.length ? fmtRange(sp[0], sp[sp.length - 1]) : ''}</div>
                    {ds && (
                      <div className="trow"><Track dates={ds} today={today} />
                        <span>{excluded ? 'scoasă din grile' : ni < 0 ? 'grile terminate' : ds[ni] === today ? 'grile azi, ziua ' + INT[ni] : 'grile ziua ' + INT[ni] + ', ' + fmtDay(ds[ni]!)}{boosted && !excluded ? ', prioritate ×2' : ''}</span>
                      </div>
                    )}
                    {open && (
                      <div className="more">
                        <p className="tip">Atenție la {t.tip}</p>
                        {done && <DoneDates start={s.topics[t.id]?.startDate || s.topics[t.id]?.doneDate || today} end={s.topics[t.id]?.doneDate || today} max={today} onSave={(a, d) => setDates(t, a, d)} />}
                        {!done && (
                          <div className="stepper"><button onClick={() => stepDays(t, -1)} aria-label="O zi în minus">−</button><span>{zile(tdays(s, t))}</span><button onClick={() => stepDays(t, 1)} aria-label="O zi în plus">+</button></div>
                        )}
                        <div className="toggles">
                          <label><input type="checkbox" checked={!excluded} onChange={() => toggleIn('excluded', t.id)} />Include în grile</label>
                          <label><input type="checkbox" checked={boosted} disabled={excluded} onChange={() => toggleIn('boost', t.id)} />Prioritate ×2 la grile</label>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Settings s={s} username={username} mut={mut} toast={toast} onDeleted={() => router.push('/')} />

      <div className={'toast' + (toastOn ? ' show' : '')} role="status" aria-live="polite">{toastMsg}</div>
    </main>
  );
}

// ---------- data terminării ----------
function DoneDates({ start, end, max, onSave }: { start: string; end: string; max: string; onSave: (a: string, d: string) => void }) {
  const [a, setA] = useState(start);
  const [d, setD] = useState(end);
  useEffect(() => { setA(start); setD(end); }, [start, end]);
  return (
    <div style={{ marginTop: 4 }}>
      <label className="field" style={{ paddingTop: 0 }}>Am început-o pe<input type="date" value={a} max={max} onChange={e => setA(e.target.value)} /></label>
      <label className="field">Am terminat-o pe<input type="date" value={d} max={max} onChange={e => setD(e.target.value)} /></label>
      <div className="field" style={{ justifyContent: 'flex-end', borderBottom: 0 }}>
        <button className="btn" disabled={a === start && d === end} onClick={() => onSave(a, d)}>Salvează datele temei</button>
      </div>
    </div>
  );
}

function DoneLine({ s, t }: { s: UserState; t: Topic }) {
  const x = s.topics[t.id];
  const ad = actualDays(s, t), p = tdays(s, t);
  const end = x?.doneDate ? fmtDay(x.doneDate) : '';
  if (ad == null) return <>Terminată {end}</>;
  const dlt = ad - p;
  return (
    <>Terminată {end}, în {zile(ad)}{dlt !== 0 && <> <span className={'delta ' + (dlt > 0 ? 'up' : 'down')}>{dlt > 0 ? '+' : '−'}{zile(Math.abs(dlt))} față de plan</span></>}</>
  );
}

const DIFF_PL = ['', 'ușoare', 'medii', 'grele'];
function PaceCard({ P, onApply }: { P: ReturnType<typeof pace>; onApply: () => void }) {
  const head = P.delta === 0 ? 'Ești exact pe ritmul planului.'
    : P.delta > 0 ? `Până acum ți-a luat cu ${zile(P.delta)} mai mult decât planul.`
    : `Până acum ai fost cu ${zile(-P.delta)} mai rapid decât planul.`;
  return (
    <section className="pace" aria-label="Ritmul tău">
      <h2>Ritmul tău</h2>
      <p className="status" style={{ marginTop: 4 }}>{head}
        <small>{P.measured} {P.measured === 1 ? 'temă măsurată' : de(P.measured) + 'teme măsurate'}: {P.longer} mai {P.longer === 1 ? 'lungă' : 'lungi'}, {P.shorter} mai {P.shorter === 1 ? 'scurtă' : 'scurte'}, restul la timp.</small>
      </p>
      <ul className="pl">
        {P.rows.filter(r => r.n > 0).map(r => {
          const pct = Math.round((r.ratio - 1) * 100);
          return (
            <li key={r.d}><Pips d={r.d} /><span>{r.actual} din {zile(r.planned)} planificate{pct !== 0 && <>, <span className={'delta ' + (pct > 0 ? 'up' : 'down')}>{pct > 0 ? '+' : '−'}{Math.abs(pct)}%</span></>}</span></li>
          );
        })}
      </ul>
      {P.suggest.length > 0 && (
        <div className="suggest">
          <p>{P.suggest.map(r => `Temele ${DIFF_PL[r.d]} îți iau ${r.ratio > 1 ? 'cu ' + Math.round((r.ratio - 1) * 100) + '% mai mult' : 'cu ' + Math.round((1 - r.ratio) * 100) + '% mai puțin'}; la cele ${r.remaining.length} rămase ar însemna ${r.extra > 0 ? '+' : '−'}${zile(Math.abs(r.extra))}.`).join(' ')}</p>
          <button className="btn" onClick={onApply}>Ajustează temele rămase după ritmul meu</button>
        </div>
      )}
    </section>
  );
}

// ---------- tema curentă ----------
function NowCard({ s, cur, next, C, today, onDone, onStep, onReplan }: { s: UserState; cur: Topic; next?: Topic; C: Computed; today: string; onDone: () => void; onStep: (d: number) => void; onReplan: () => void }) {
  const sp = C.spans[cur.id] || [];
  const last = sp[sp.length - 1];
  const idx = sp.indexOf(today);
  const when = sp[0] > today
    ? 'Începi ' + fmtDay(sp[0]) + (sp.length > 1 ? ', până ' + fmtDay(last) : '') + '.'
    : fmtRange(sp[0], last) + (idx >= 0 ? ', ziua ' + (idx + 1) + ' din ' + sp.length : '') + '.';
  return (
    <>
      {last < today && (
        <div className="behind">
          <p>Planul zicea că termini <strong>{cur.t}</strong> până {fmtDay(last)}. Mută tot restul planului de azi încolo, sau marchează în calendar zilele pierdute.</p>
          <button className="btn" onClick={onReplan}>Replanifică de azi</button>
        </div>
      )}
      <section className="now" style={c(cur.b)} aria-label="Tema curentă">
        <p className="src">{BOOKS[cur.b].name}, {cur.c}, p. {cur.p}</p>
        <h2>{cur.t}</h2>
        <p className="when">{when} {pagini(cur.n)}, {DIFF[cur.d]}.</p>
        <p className="tip">Atenție la {cur.tip}</p>
        <div className="row">
          <button className="btn primary" onClick={onDone}>Am terminat tema</button>
          <div className="stepper"><button onClick={() => onStep(-1)} aria-label="O zi în minus">−</button><span>{zile(tdays(s, cur))}</span><button onClick={() => onStep(1)} aria-label="O zi în plus">+</button></div>
        </div>
        {next && C.spans[next.id] && <p className="next">Urmează: {next.t} ({BOOKS[next.b].name}), din {fmtDay(C.spans[next.id][0])}.</p>}
      </section>
    </>
  );
}

// ---------- grile ----------
function GrileCard({ s, RV, today, gDate, setGDate, onTotal }: { s: UserState; RV: Reviews; today: string; gDate: string | null; setGDate: (d: string | null) => void; onTotal: (v: number) => void }) {
  const gd = gDate || today;
  const items = grileFor(s, RV, gd);
  const study = dayType(s, gd) === 'study';
  const N = s.grile.total;
  const [draft, setDraft] = useState(String(N));
  useEffect(() => setDraft(String(N)), [N]);
  const commit = (v: string) => { const n = Math.max(0, Math.min(1000, Math.round(Number(v) || 0))); onTotal(n); setDraft(String(n)); };
  const move = (k: number) => { const n = addDays(gd, k); setGDate(n === today ? null : n); };
  const firstDue = Object.keys(RV.byDate).sort().find(d => d > gd);
  return (
    <section className="grile" aria-label="Grile">
      <div className="ghead">
        <div>
          <h2>Grile {gd === today ? 'azi' : 'pe ' + fmtDay(gd)}</h2>
          <p>{gd === today ? fmtDay(gd) : <button onClick={() => setGDate(null)} style={{ textDecoration: 'underline' }}>înapoi la azi</button>}</p>
        </div>
        <div className="gnav"><button onClick={() => move(-1)} aria-label="Ziua anterioară">‹</button><button onClick={() => move(1)} aria-label="Ziua următoare">›</button></div>
      </div>
      {items.length > 0 ? (
        <>
          <p className="gtotal">{N} <small>{de(N)}grile din {items.length === 1 ? 'o temă' : items.length + ' ' + de(items.length) + 'teme'}{study ? '' : ', zi fără învățare'}</small></p>
          <ul className="gl">
            {items.map(x => (
              <li key={x.t.id + x.s} style={c(x.t.b)}>
                <span className="cb" />
                <div><div className="gt">{x.t.t}</div><div className="gs"><Track dates={RV.R[x.t.id]} today={gd} /><span>ziua {INT[x.s]}{x.boosted ? ', ×2' : ''}</span></div></div>
                <span className="gn">{x.count}</span>
              </li>
            ))}
          </ul>
        </>
      ) : !study ? (
        <p className="gempty">Zi fără învățare: grile mixte din ce ai parcurs până acum.</p>
      ) : (
        <p className="gempty">Nicio temă programată la grile în ziua asta.{firstDue && gd < s.settings.start ? ' Primele grile: ' + fmtDay(firstDue) + '.' : ''}</p>
      )}
      <p className="hint" style={{ margin: '10px 0 0' }}>Ziua 0 e ziua în care termini tema; ziua 2, 7, 14, 30, 60 se numără doar în zile de învățare de atunci. Pentru temele neterminate, grilele urmează planul și se mută odată cu el.</p>
      <div className="gcfg">
        <label htmlFor="g-total">Grile pe zi</label>
        <div className="stepper">
          <button onClick={() => commit(String(N - 5))} aria-label="5 grile mai puțin">−</button>
          <input id="g-total" inputMode="numeric" value={draft} onChange={e => setDraft(e.target.value.replace(/\D/g, ''))} onBlur={e => commit(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
          <button onClick={() => commit(String(N + 5))} aria-label="5 grile mai mult">+</button>
        </div>
      </div>
    </section>
  );
}

// ---------- calendar ----------
function Calendar({ s, C, today, onTap }: { s: UserState; C: Computed; today: string; onTap: (d: string) => void }) {
  const from = mondayOf(s.settings.start);
  let until = C.end && C.end > s.settings.target ? C.end : s.settings.target;
  until = addDays(mondayOf(until), 6);
  const rows: React.ReactNode[] = [];
  let w = from, row = 0;
  while (w <= until && row < 60) {
    let label = '';
    for (let i = 0; i < 7; i++) { const d = addDays(w, i); if (d.slice(8) === '01' || (row === 0 && i === 0)) label = MON[+d.slice(5, 7) - 1]; }
    rows.push(<span key={'m' + w} className="mo">{label}</span>);
    for (let i = 0; i < 7; i++) {
      const d = addDays(w, i);
      const typ = dayType(s, d);
      const cls = ['d'];
      let style: React.CSSProperties = {};
      let aria = fmtDay(d);
      if (d < s.settings.start) cls.push('pre');
      else {
        cls.push(typ);
        const m = C.map[d], dn = C.doneMap[d];
        if (m) { cls.push('sch'); if (m.k === 1) cls.push('first'); style = c(m.t.b); aria += `, ${BOOKS[m.t.b].name}: ${m.t.t}, ziua ${m.k} din ${m.n}`; }
        else if (dn) { cls.push('dn'); style = c(dn.b); aria += ', terminat: ' + dn.t; }
        else aria += typ === 'buf' ? ', zi tampon' : typ === 'blk' ? ', indisponibilă' : typ === 'hol' ? ', pauză de sărbători' : typ === 'off' ? ', liberă' : '';
      }
      if (d === today) { cls.push('today'); aria += ', azi'; }
      rows.push(<button key={d} className={cls.join(' ')} style={style} onClick={() => onTap(d)} title={aria} aria-label={aria}>{+d.slice(8)}</button>);
    }
    w = addDays(w, 7); row++;
  }
  return (
    <section className="cal">
      <h2>Calendarul</h2>
      <p className="hint" style={{ marginTop: 4 }}>Atinge o zi ca s-o marchezi indisponibilă (gardă, stagiu) și planul se mută singur. Atinge o sâmbătă sau o zi liberă ca s-o faci zi de studiu.</p>
      <div className="grid">
        <span />
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i} className="dh">{x}</span>)}
        {rows}
      </div>
      <div className="legend">
        <span><i className="sw" style={{ background: 'var(--L)' }} />Lawrence</span>
        <span><i className="sw" style={{ background: 'var(--K)' }} />Kumar</span>
        <span><i className="sw" style={{ background: 'var(--S)' }} />Sinopsis</span>
        <span><i className="sw" style={{ border: '1px dashed var(--muted)' }} />sâmbătă tampon</span>
        <span><i className="sw" style={{ background: 'repeating-linear-gradient(135deg,var(--muted) 0 2px,transparent 2px 5px)' }} />indisponibilă</span>
        <span><i className="sw" style={{ background: 'color-mix(in srgb,var(--warn) 25%,transparent)' }} />sărbători</span>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>Culoarea plină înseamnă temă terminată; bara din stânga marchează prima zi a unei teme. La fiecare temă, căsuțele 0, 2, 7, 14, 30, 60 sunt rundele de grile, numărate în zile de învățare: pline = făcute, conturate portocaliu = azi.</p>
    </section>
  );
}

// ---------- setări ----------
function Settings({ s, username, mut, toast, onDeleted }: { s: UserState; username: string; mut: (fn: (n: UserState) => void) => void; toast: (m: string) => void; onDeleted: () => void }) {
  const [start, setStart] = useState(s.settings.start);
  const [target, setTarget] = useState(s.settings.target);
  const [armed, setArmed] = useState<'' | 'reset' | 'delete'>('');
  useEffect(() => { setStart(s.settings.start); setTarget(s.settings.target); }, [s.settings.start, s.settings.target]);

  const applyDates = () => {
    if (!start || !target) { toast('Alege ambele date.'); return; }
    mut(n => { n.settings.start = start; n.settings.target = target; n.replanFrom = null; });
    toast(`Start: ${fmtDay(start)}, țintă: ${fmtDay(target)}.`);
  };
  const setWeight = (i: number, v: string) => mut(n => { n.grile.weights[i] = Math.max(0, Math.min(1000, Math.round(Number(v) || 0))); });

  async function del() {
    const r = await fetch('/api/users/' + encodeURIComponent(username), { method: 'DELETE' });
    if (r.ok) onDeleted(); else toast('Nu am putut șterge programul.');
  }

  return (
    <details className="settings">
      <summary>Setări</summary>
      <label className="field">Încep pe<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label className="field">Vreau să termin până pe<input type="date" value={target} onChange={e => setTarget(e.target.value)} /></label>
      <div className="field" style={{ justifyContent: 'flex-end' }}>
        <button className="btn primary" style={{ ['--c' as any]: 'var(--K)' }} onClick={applyDates} disabled={start === s.settings.start && target === s.settings.target}>Salvează datele</button>
      </div>
      <label className="field">Pauză de sărbători, 24 dec – 3 ian<input type="checkbox" checked={s.settings.xmas} onChange={e => mut(n => { n.settings.xmas = e.target.checked; })} /></label>
      <label className="field">Toate sâmbetele sunt zile de studiu<input type="checkbox" checked={s.settings.sat} onChange={e => mut(n => { n.settings.sat = e.target.checked; })} /></label>

      <p className="hint" style={{ margin: '14px 0 0' }}>Ponderile grilelor pe runde. Contează proporția dintre ele, nu suma.</p>
      <div className="weights">
        {INT.map((k, i) => (
          <label key={k}>ziua {k}
            <input inputMode="numeric" defaultValue={s.grile.weights[i]} key={s.grile.weights[i]} onBlur={e => setWeight(i, e.target.value)} />
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={() => { mut(n => { n.grile.weights = [...DEFAULT_WEIGHTS]; }); toast('Ponderile au revenit la 20, 15, 10, 7, 4, 2.'); }}>Ponderile implicite</button>
        <button className="btn" onClick={() => { mut(n => { n.overrides = {}; }); toast('Zilele marcate au fost șterse.'); }}>Șterge zilele marcate</button>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn danger" onClick={() => {
          if (armed !== 'reset') { setArmed('reset'); return; }
          setArmed('');
          mut(n => { n.topics = {}; n.overrides = {}; n.replanFrom = null; n.order = getCatalog(n.catalog).topics.map(t => t.id); n.grile = { total: 75, weights: [...DEFAULT_WEIGHTS], excluded: [], boost: [] }; });
          toast('Programul a fost resetat.');
        }}>{armed === 'reset' ? 'Apasă din nou ca să resetezi' : 'Resetează programul'}</button>
        <button className="btn danger" onClick={() => { if (armed !== 'delete') { setArmed('delete'); return; } del(); }}>{armed === 'delete' ? 'Apasă din nou ca să ștergi definitiv' : 'Șterge programul'}</button>
      </div>
    </details>
  );
}
