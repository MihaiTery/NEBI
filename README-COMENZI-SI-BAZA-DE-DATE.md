# README — Comenzi și baza de date NEBI

Acest document explică, pas cu pas, cum funcționează backend-ul NEBI (comenzi, plăți NETOPIA, panou
administrativ) pentru o persoană tehnică la început de drum. Presupune doar cunoștințe de bază de linie de
comandă.

---

## 1. Ce bază de date am ales

Am ales **SQLite**, folosit direct prin modulul `node:sqlite`, integrat nativ în Node.js (fără pachet npm
extern pentru baza de date).

## 2. De ce este potrivită pentru acest proiect

- Site-ul NEBI a fost, până acum, complet static (HTML/CSS/JS, găzduit tip GitHub Pages) — **fără server, fără
  bază de date**. Pentru comenzi, plăți și panou administrativ este nevoie de un server care rulează cod și
  păstrează date, deci am adăugat un director `server/` cu o aplicație Node.js (Express).
- Am încercat inițial `better-sqlite3` (biblioteca standard, foarte populară pentru SQLite în Node), dar
  instalarea ei **a eșuat pe acest mediu de dezvoltare** din lipsa Visual Studio Build Tools (necesar pentru
  compilarea codului nativ) și a unui binar precompilat pentru versiunea de Node folosită. `node:sqlite` este
  inclus direct în Node.js (≥ 22.5), nu necesită compilare, și a funcționat imediat.
- SQLite este potrivit pentru volumul de comenzi așteptat la acest stadiu (un magazin cu un singur produs
  configurabil): fișier unic, ușor de făcut backup, ușor de inspectat, fără cost de infrastructură suplimentar
  (nu necesită un server de bază de date separat).
- **Notă onestă**: `node:sqlite` este încă marcat „experimental" de echipa Node.js — API-ul se poate schimba
  în versiuni viitoare de Node. Este alegerea corectă *acum*, dată fiind infrastructura disponibilă. Dacă
  proiectul crește semnificativ (mii de comenzi/zi, mai mulți admini simultan) sau dacă hostingul final oferă
  ușor PostgreSQL gestionat, migrarea la PostgreSQL este următorul pas natural — schema din
  `server/src/db/migrations/001_init.sql` este scrisă în SQL standard, ușor de portat.

## 3. Unde se află datele

Fișierul bazei de date: `server/data/nebi.sqlite` (plus fișiere auxiliare `-wal` și `-shm`, generate automat
de SQLite în modul WAL). **Acest director este exclus din Git** (`.gitignore`) — datele comenzilor nu trebuie
urcate niciodată în repository.

## 4. Cum se configurează local

```bash
cd server
npm install
cp ../.env.example ../.env    # editează .env cu valorile tale locale (vezi secțiunea 23)
npm run migrate                # creează baza de date și aplică schema
node src/lib/hashPassword.js "o-parola-puternica-de-minim-12-caractere"
# copiază rezultatul în .env, la ADMIN_PASSWORD_HASH
npm start                      # pornește serverul (implicit pe portul 3000)
```

Deschide `http://localhost:3000/` — vei vedea site-ul NEBI, identic la vizual. Configuratorul, checkout-ul
(`/checkout/`) și panoul admin (`/admin/`) sunt acum funcționale.

## 5. Cum se configurează în producție

1. Alege un host care poate rula un proces Node.js persistent (nu găzduire strict statică precum GitHub
   Pages) — de exemplu un VPS, sau un serviciu de tip „Node app hosting". **Această alegere nu a fost făcută
   încă în acest task** — este pasul manual descris în raportul final.
2. Setează variabilele de mediu direct în panoul hostingului (nu prin fișier `.env` urcat în Git).
3. Rulează `npm install --omit=dev` și `npm run migrate` la fiecare deploy, apoi `npm start`.
4. Serverul **refuză să pornească** în producție (`NODE_ENV=production`) dacă lipsesc
   `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` sau `ADMIN_SESSION_SECRET` — o plasă de siguranță împotriva
   pornirii accidentale fără autentificare configurată.
5. Asigură-te că domeniul (`nebi.ro`) este configurat să răspundă din acest server Node (nu mai poate rămâne
   exclusiv pe GitHub Pages, pentru că paginile `/checkout/`, `/admin/` și rutele `/api/*` au nevoie de server).

## 6. Cum se rulează migrările

```bash
cd server
npm run migrate
```

Rulează în siguranță de mai multe ori — ține evidența migrărilor deja aplicate într-un tabel intern
(`schema_migrations`) și aplică doar fișierele `.sql` noi din `server/src/db/migrations/`, în ordine
alfabetică, fiecare într-o tranzacție.

## 7. Cum se creează baza de date

Nu trebuie creată manual — `npm run migrate` creează fișierul `server/data/nebi.sqlite` automat, dacă nu
există deja, apoi aplică schema.

## 8. Cum se face backup

Cel mai simplu: oprește serverul (sau rulează comanda `.backup` din SQLite, care e sigură și cu serverul
pornit), apoi copiază fișierul:

```bash
sqlite3 server/data/nebi.sqlite ".backup 'server/data/backups/nebi-$(date +%Y%m%d-%H%M%S).sqlite'"
```

Dacă nu ai `sqlite3` CLI instalat, poți copia direct fișierul cât timp serverul e oprit:

```bash
cp server/data/nebi.sqlite server/data/backups/nebi-$(date +%Y%m%d-%H%M%S).sqlite
```

Recomandare: programează acest backup automat (cron / task scheduler) zilnic, și păstrează copiile într-o
locație separată de server (alt disc, storage extern).

## 9. Cum se restaurează un backup

1. Oprește serverul.
2. Redenumește/mută fișierul curent `server/data/nebi.sqlite` (nu îl șterge direct, păstrează-l ca plasă de
   siguranță).
3. Copiază fișierul de backup dorit peste `server/data/nebi.sqlite`.
4. Pornește serverul din nou (`npm start`); `npm run migrate` va detecta automat că schema e deja la zi.

## 10. Cum se deschide și inspectează baza de date

Cea mai simplă unealtă vizuală: **[DB Browser for SQLite](https://sqlitebrowser.org/)** (gratuit, Windows/
Mac/Linux) — deschide direct fișierul `server/data/nebi.sqlite`, permite navigare prin tabele, rulare de
interogări SQL și export.

Alternativ, din linia de comandă (dacă ai `sqlite3` instalat):

```bash
sqlite3 server/data/nebi.sqlite
.tables
.schema orders
SELECT public_number, payment_status, order_status, total_bani FROM orders ORDER BY created_at DESC LIMIT 10;
.quit
```

## 11. Cum se citesc tabelele

Fiecare rând dintr-un tabel reprezintă o singură înregistrare (o comandă, o piesă de comandă, o plată etc.).
Coloanele cu sufixul `_bani` sunt sume în **bani întregi** (1 leu = 100 bani) — împarte la 100 pentru lei.
Coloanele cu sufixul `_at` sunt marcaje de timp în format ISO 8601 UTC (text).

## 12. Ce înseamnă fiecare tabel

| Tabel | Conține |
|---|---|
| `orders` | O comandă completă: date client, adresă livrare/facturare, sume, statusuri, curier/AWB, versiunile documentelor legale acceptate. |
| `order_items` | Liniile unei comenzi: pachetul de bază, nivelurile suplimentare, piesele speciale (sisal/sfoară), fiecare cu preț unitar, cantitate și un „instantaneu" al configurației la momentul comenzii. |
| `payments` | Încercările de plată NETOPIA pentru o comandă: status, sumă, ID tranzacție extern, momentul inițierii/confirmării/eșecului. |
| `payment_events` | Fiecare notificare (IPN) primită de la NETOPIA, cu un identificator unic (pentru a detecta duplicate) și rezultatul procesării. |
| `audit_log` | Jurnalul acțiunilor administrative importante: cine a schimbat ce, când, valoarea veche și cea nouă. |
| `admin_sessions` | Sesiunile active ale administratorilor autentificați în panou (folosite pentru cookie-ul de sesiune). |
| `schema_migrations` | Evidența tehnică a migrărilor deja aplicate — nu se editează manual. |

Livrarea (curier, AWB, link tracking, status) este parte din tabelul `orders` (nu tabel separat), pentru
simplitate — vezi coloanele `carrier`, `awb`, `tracking_url`, `shipping_status`, `shipped_at`.

## 13. Ce înseamnă fiecare status

**Plată (`payment_status`)**: `pending` (așteaptă plata) → `processing` (plata a fost inițiată la NETOPIA) →
`paid` (confirmată) / `failed` (eșuată) / `cancelled` (anulată de client) / `expired` (a expirat) /
`partially_refunded` / `refunded`.

**Comandă (`order_status`)**: `new` → `confirmed` (după plată) → `in_production` → `ready_for_shipping` →
`shipped` → `completed`, sau `cancelled` / `returned`.

**Livrare (`shipping_status`)**: `not_prepared` → `ready` → `handed_to_gls` → `in_transit` → `delivered`, sau
`delivery_exception` / `returned`.

`payment_status = paid` **nu poate fi setat manual** din ecranul obișnuit de editare a comenzii — vine doar din
NETOPIA (notificare verificată) sau dintr-o acțiune administrativă excepțională, separată, care cere un motiv
scris și este înregistrată explicit în `audit_log` (vezi secțiunea 19).

## 14. Cum se pornește panoul admin

Panoul este parte din același server: `http://localhost:3000/admin/` (sau `https://nebi.ro/admin/` în
producție). Nu necesită pornire separată — pornește odată cu `npm start`.

## 15. Cum se configurează accesul administratorului

Nu există cont hardcodat. Configurezi prin variabile de mediu:

```bash
cd server
node src/lib/hashPassword.js "parola-ta-puternica"
```

Copiază rezultatul (`scrypt:...`) în `.env`:

```env
ADMIN_USERNAME=numele-tau-de-utilizator
ADMIN_PASSWORD_HASH=scrypt:...............
ADMIN_SESSION_SECRET=un-string-lung-si-aleator
```

Poți genera un `ADMIN_SESSION_SECRET` aleator cu:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sesiunea admin folosește un cookie `HttpOnly`, `SameSite=Strict`, și `Secure` automat în producție. Login-ul
este limitat la 10 încercări la 5 minute per adresă IP.

## 16. Cum se caută o comandă

În `/admin/`, câmpul „Căutare" din partea de sus a listei caută după număr de comandă, e-mail, nume sau
denumire firmă. Poți combina cu filtrele de status (plată / comandă / livrare) și sortarea după dată.

## 17. Cum se adaugă un AWB

Deschide comanda din listă (click pe rând) → completează câmpurile „AWB GLS" și „URL tracking" din
formularul „Actualizare" → „Salvează modificările". Poți actualiza în același pas și statusul de livrare
(de exemplu, la `handed_to_gls`).

## 18. Cum se exportă comenzile

Butonul „⬇ Export CSV" din panoul admin exportă comenzile care corespund filtrelor active în acel moment,
ca fișier CSV descărcabil (nume, status-uri, total, AWB etc.).

## 19. Cum se verifică o plată NETOPIA

- **Automat**: la fiecare notificare (IPN) primită de la NETOPIA pe `/api/payments/netopia/ipn`, serverul
  **nu are încredere în conținutul notificării** — apelează înapoi NETOPIA (server-to-server, cu propria
  cheie API) pentru a confirma statusul real, verifică suma și moneda față de comandă, și abia apoi
  actualizează baza de date.
- **Manual**: în `/admin/`, deschide comanda → secțiunea „Istoric plăți" arată toate încercările de plată și
  statusul lor. Secțiunea „Jurnal (audit log)" arată orice acțiune administrativă asupra comenzii.
- **Excepțional** (ex: clientul a plătit dar notificarea NETOPIA nu a ajuns din motive tehnice): folosește
  „⚠ Marchează manual ca plătită" — cere obligatoriu un motiv de minimum 10 caractere și este înregistrat
  distinct în `audit_log` cu acțiunea `mark_paid_manually`.

## 20. Cum se recunoaște o notificare duplicată

Fiecare notificare NETOPIA primește un identificator de idempotență (`event_uid`, calculat din ID-ul
tranzacției NETOPIA și un hash al conținutului), salvat unic în tabelul `payment_events`. Dacă exact aceeași
notificare ajunge de mai multe ori (NETOPIA poate retrimite dacă nu primește confirmare la timp), serverul
recunoaște duplicatul și răspunde imediat cu `{"status": "duplicate-ignored"}`, fără a reprocesa sau a
schimba din nou statusul comenzii.

## 21. Cum se rulează testele

```bash
cd server
npm test
```

Rulează testele native Node.js (`node --test`) pentru: regulile de preț/configurator, validarea datelor de
checkout, hash-ul de parole, și un set de teste de integrare care pornesc efectiv serverul (pe un port
temporar, cu o bază de date SQLite temporară) și verifică fluxul de comenzi + autentificarea admin +
protecția statusului `paid`.

## 22. Cum se trece din Sandbox în Live

1. Creează un cont de comerciant NETOPIA Payments și obține accesul la contul Sandbox.
2. În `.env`, setează `NETOPIA_ENV=sandbox` și completează `NETOPIA_API_KEY`, `NETOPIA_POS_SIGNATURE`,
   `NETOPIA_RETURN_URL` (ex: `https://nebi.ro/plata/succes/`), `NETOPIA_NOTIFY_URL`
   (ex: `https://nebi.ro/api/payments/netopia/ipn` — trebuie să fie public accesibil, nu `localhost`).
3. Testează întregul flux (comandă → plată Sandbox → IPN → status `paid`) cu cardurile de test NETOPIA.
4. **Abia după testare completă și aprobarea comercială**, schimbă `NETOPIA_ENV=live` și înlocuiește cheile
   cu cele de producție, obținute după aprobarea contului de comerciant live de către NETOPIA. Acest pas
   **nu a fost făcut** în acest task — necesită aprobare explicită și un cont NETOPIA real.

## 23. Ce variabile de mediu sunt necesare

Vezi `.env.example` (la rădăcina proiectului) pentru lista completă, cu explicații. Pe scurt:

| Variabilă | Scop |
|---|---|
| `PORT`, `NODE_ENV`, `TRUST_PROXY` | Configurare server |
| `DB_FILE` | Cale către fișierul SQLite (opțional, are valoare implicită) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `ADMIN_SESSION_TTL_MINUTES` | Acces panou admin |
| `NETOPIA_ENV`, `NETOPIA_API_KEY`, `NETOPIA_POS_SIGNATURE`, `NETOPIA_PUBLIC_KEY`, `NETOPIA_PRIVATE_KEY`, `NETOPIA_RETURN_URL`, `NETOPIA_NOTIFY_URL` | Integrare NETOPIA Payments |

## 24. Ce nu trebuie urcat niciodată în Git

- `.env` (deja în `.gitignore`)
- `server/data/*.sqlite*` (baza de date reală, cu date de clienți — deja în `.gitignore`)
- `server/node_modules/` (deja în `.gitignore`)
- Orice cheie NETOPIA reală, parolă în clar, sau token — acestea există **doar** ca variabile de mediu, nu
  scrise nicăieri în cod sau în commit-uri.

## 25. Cum se rotește o cheie compromisă

1. **NETOPIA**: generează o nouă cheie API din panoul de administrare NETOPIA Payments, actualizează
   `NETOPIA_API_KEY` (și, dacă e cazul, `NETOPIA_POS_SIGNATURE`) în variabilele de mediu de producție, apoi
   repornește serverul. Cheia veche trebuie revocată din panoul NETOPIA imediat ce cea nouă e confirmată
   funcțională.
2. **Parola de admin**: generează un hash nou (`node server/src/lib/hashPassword.js "parola-noua"`),
   actualizează `ADMIN_PASSWORD_HASH`, repornește serverul. Toate sesiunile admin existente pot fi invalidate
   manual golind tabelul `admin_sessions` (`DELETE FROM admin_sessions;` din `sqlite3`) dacă suspectezi acces
   neautorizat.
3. **`ADMIN_SESSION_SECRET`**: schimbă valoarea și repornește — invalidează implicit toate sesiunile active
   (deconectează pe toată lumea, inclusiv un eventual atacator).

## 26. Cum se verifică logurile fără a expune date sensibile

Serverul scrie în consolă (stdout/stderr) doar: erori tehnice generale, coduri de eroare NETOPIA (nu
payload-uri complete), și mesaje de pornire. **Nu loghează niciodată**: date de card, chei API complete,
semnături, sau conținutul integral al notificărilor de plată — vezi `payment_events.payload_hash`, care
stochează doar un hash SHA-256 al notificării, nu conținutul ei. Pentru investigarea unei notificări, folosește
înregistrarea din `payment_events` (tip eveniment, rezultat procesare, marcaje de timp) coroborată cu
`payments` și `audit_log`, nu loguri brute.

## 27. Ce pași urmează ulterior (e-mail și facturare)

Nu sunt implementate în acest task, conform cerinței explicite. Arhitectura este pregătită pentru ele:

- **E-mailuri tranzacționale**: tabelul `orders` are deja toate datele necesare (e-mail client, status,
  număr public); rămâne de ales un furnizor (ex: un serviciu SMTP transactional) și de adăugat un declanșator
  la schimbarea statusului plății.
- **Facturare automată**: modelul de date (`orders`, `order_items`, datele de facturare persoană fizică/
  juridică) este suficient pentru generarea unei facturi; rămâne de ales un furnizor/serviciu de facturare și
  de adăugat generarea + stocarea seriei/numărului de factură.
