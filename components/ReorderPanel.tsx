'use client';
import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BOOKS, type Topic } from '@/lib/catalog';
import { PRESETS, applyPreset, orderFromText } from '@/lib/reorder';

const GRIP = (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="5.5" cy="3.5" r="1.4" /><circle cx="10.5" cy="3.5" r="1.4" /><circle cx="5.5" cy="8" r="1.4" /><circle cx="10.5" cy="8" r="1.4" /><circle cx="5.5" cy="12.5" r="1.4" /><circle cx="10.5" cy="12.5" r="1.4" />
  </svg>
);

function Item({ t, pos }: { t: Topic; pos: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  return (
    <li ref={setNodeRef} className={'ri' + (isDragging ? ' dragging' : '')} style={{ transform: CSS.Transform.toString(transform), transition, ['--c' as any]: `var(--${t.b})` }}>
      <span className="pos">{pos}</span>
      <span className="cb" />
      <span className="rt">{t.t}<small>{BOOKS[t.b].name}, {t.c}</small></span>
      <button ref={setActivatorNodeRef} className="handle" aria-label={'Mută ' + t.t} {...attributes} {...listeners}>{GRIP}</button>
    </li>
  );
}

export default function ReorderPanel({ list, catalogTopics, onChange }: { list: Topic[]; catalogTopics: Topic[]; onChange: (order: string[], msg?: string) => void }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = list.map(t => t.id);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  const applyText = () => {
    if (!text.trim()) return;
    const r = orderFromText(text, list);
    if (!r.matched) { setNote('Nu am găsit nicio temă pentru ce ai scris. Încearcă nume de capitole sau sisteme: cardio, pneumo, diabet, ortopedie, pediatrie.'); return; }
    setNote(r.unmatched.length ? 'Nu am recunoscut: ' + r.unmatched.join(', ') + '. Restul l-am aplicat.' : '');
    onChange(r.order, `Am pus ${r.matched} ${r.matched === 1 ? 'temă' : 'teme'} în față, în ordinea scrisă.`);
  };

  return (
    <div className="reorder">
      <p className="hint" style={{ marginTop: 4 }}>Poți alege doar teme din tematică. Le poți rearanja, dar nu poți adăuga sau scoate capitole.</p>
      <div className="presets">
        {PRESETS.map(p => <button key={p.id} className="btn" onClick={() => onChange(applyPreset(p.id, catalogTopics), 'Ordine aplicată: ' + p.label.toLowerCase() + '.')}>{p.label}</button>)}
      </div>
      <div className="textorder">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') applyText(); }} placeholder="ex. cardio, apoi pneumo, apoi chirurgie" aria-label="Scrie ordinea dorită" />
        <button className="btn" onClick={applyText}>Aplică</button>
      </div>
      {note ? <p className="err">{note}</p> : <p className="hint">Scrie sistemele sau capitolele în ordinea dorită. Restul temelor rămân după ele, în ordinea de acum.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="rl">{list.map((t, i) => <Item key={t.id} t={t} pos={i + 1} />)}</ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
