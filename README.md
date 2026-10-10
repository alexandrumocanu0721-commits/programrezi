# Rezi: programe de rezidențiat

Aplicație web în care fiecare prieten își face programul pentru prima trecere prin bibliografie,
cu calendar flexibil și grile pe repetiție spațiată. Toată lumea vede și poate edita orice program
(e gândită pentru un grup de prieteni de încredere, deci nu împărți linkul public).

Stack: Next.js pe Vercel + Postgres gratuit pe Neon. Totul încape în planurile gratuite.

## Pune-o online (~15 minute, o singură dată)

1. **GitHub.** Fă-ți un repository nou (poate fi privat), apoi „Add file” → „Upload files”
   și urcă tot conținutul folderului ăstuia. Nu urca `node_modules` sau `.next` dacă apar.
2. **Vercel.** Intră pe vercel.com cu contul de GitHub → „Add New…” → „Project” →
   alege repository-ul → „Deploy”. Primul deploy merge, dar pagina va arăta o eroare
   până legi baza de date.
3. **Baza de date.** În proiectul de pe Vercel: tab-ul „Storage” → „Create Database” →
   alege **Neon** (Postgres) → planul gratuit → „Connect” la proiectul tău.
   Vercel adaugă singur variabila `DATABASE_URL`.
   *Alternativ:* fă-ți cont pe neon.tech, creează un proiect, copiază connection string-ul
   și pune-l manual în Vercel → Settings → Environment Variables, cu numele `DATABASE_URL`.
4. **Redeploy.** Tab-ul „Deployments” → ultimul deploy → „⋯” → „Redeploy”.
   Tabelul din baza de date se creează singur la prima folosire.
5. Trimite-le prietenilor linkul (`https://numele-proiectului.vercel.app`).
   Pe telefon: Share → „Add to Home Screen” și arată ca o aplicație.

## Cum e organizat codul

- `lib/catalog.ts`: tematica oficială. Toate temele, cu pagini, dificultate, zile implicite,
  „Atenție la” și cuvinte cheie pentru reordonarea din text. **Doar de aici vin temele.**
- `lib/validate.ts`: serverul respinge orice program care nu conține exact temele din
  catalog, fiecare o singură dată. Așa nu poate apărea niciun capitol inventat.
- `lib/plan.ts`: logica de calendar, grile 0-2-7-14-30-60 și împărțirea grilelor pe ponderi.
- `lib/reorder.ts`: ordinile predefinite și potrivirea din text („cardio, apoi pneumo”).
- `components/Planner.tsx`: pagina unui program. `components/ReorderPanel.tsx`: reordonarea.
- `app/api/...`: API-ul (citire, creare, salvare, ștergere).

## Când apare tematica nouă

Adaugi un catalog nou în `CATALOGS` din `lib/catalog.ts` (de ex. `'nov-2027'`) și schimbi
`DEFAULT_CATALOG`. Programele vechi rămân pe catalogul lor; cele noi pornesc pe cel nou.
Păstrează aceleași `id`-uri pentru temele care nu s-au schimbat.

## Rulare locală (opțional)

```bash
npm install
cp .env.example .env.local   # pune DATABASE_URL-ul de la Neon
npm run dev                  # http://localhost:3000
```
