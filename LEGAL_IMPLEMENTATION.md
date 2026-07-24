# LEGAL_IMPLEMENTATION.md — NEBI (nebi.ro)

Document tehnic intern, generat cu asistență AI, ca parte a implementării de conformitate juridico-tehnică
solicitată pentru site-ul NEBI, operat de **NEBO SAFETY SRL** (CUI RO 42021319, J40/17136/2019).

> **Acest document și toate paginile juridice create nu reprezintă consultanță juridică.** Ele oferă o bază
> tehnică și contractuală de conformitate. Forma finală trebuie verificată de un avocat și de persoana
> responsabilă cu fiscalitatea societății NEBO SAFETY SRL înainte de lansarea comercială.

---

## 1. Context și premisă

Cererea inițială descria o platformă de produse/servicii digitale, cu upload de materiale, procesare AI de
imagini/voce/text, conturi de utilizator și procesator de plăți activ. **Auditul read-only al proiectului a
arătat o realitate diferită**, iar implementarea a fost adaptată la aceasta (confirmat explicit de operator
înainte de implementare):

- Site **static** (HTML/CSS/JS, fără framework, fără build), găzduit pe infrastructură de tip GitHub Pages
  (dedus din fișierul `CNAME` → `nebi.ro`).
- **Zero backend, zero bază de date, zero API.** Niciun `fetch`/`XMLHttpRequest` în cod.
- **Produs fizic** — turn modular din lemn masiv de brad, livrat prin curier — nu conținut/servicii digitale.
- **Zero procesator de plăți activ.** Butonul de comandă afișează un mesaj că plata nu e încă disponibilă.
- **Zero analytics, zero pixel, zero cookie** setat de codul existent, la data auditului.
- **Zero conturi de utilizator.**
- **Zero upload de fișiere / procesare AI.**
- Un singur formular (colaborare) care, înainte de această implementare, nu transmitea date nicăieri.

Implementarea de mai jos reflectă această realitate: pagini juridice complete, adaptate la bunuri fizice
(nu conținut digital), plus infrastructură tehnică (banner cookies, checkbox-uri de checkout) pregătită să
funcționeze corect din prima zi în care vor fi conectate un backend, un procesator de plăți sau instrumente de
analiză/marketing.

---

## 2. Pagini juridice create

| Pagină | Rută | Fișier |
|---|---|---|
| Termeni și condiții | `/termeni-si-conditii/` | `termeni-si-conditii/index.html` |
| Anulare, retragere și rambursare | `/anulare-retragere-rambursare/` | `anulare-retragere-rambursare/index.html` |
| Politica de confidențialitate | `/politica-de-confidentialitate/` | `politica-de-confidentialitate/index.html` |
| Politica de cookies | `/politica-cookies/` | `politica-cookies/index.html` |
| Utilizare acceptabilă | `/utilizare-acceptabila/` | `utilizare-acceptabila/index.html` |
| Proprietate intelectuală | `/proprietate-intelectuala/` | `proprietate-intelectuala/index.html` |
| Reclamații | `/reclamatii/` | `reclamatii/index.html` |
| Contact | `/contact/` | `contact/index.html` |

Fiecare pagină folosește URL-uri curate (folder + `index.html`, servite fără extensie `.html` de GitHub Pages),
respectă identitatea vizuală existentă (nav, footer, pixel-art, tokenurile de culoare din `DESIGN.md`), și
include: eyebrow + titlu, mențiune versiune/dată, disclaimer legal vizibil, cuprins (unde documentul e lung),
conținut articol, casetă de contact cu datele firmei.

**Notă privind ordinea numerotată a secțiunilor legale**: fiecare document folosește clauze numerotate (1, 2,
3…), cu trimiteri încrucișate în text (ex: „conform secțiunii 8"). Aceasta este convenția standard pentru
documente contractuale/juridice, nu un artificiu vizual de tip AI — a fost păstrată intenționat.

---

## 3. Componente și fișiere create/modificate

### Fișiere noi
- `cookie-consent.js` — logica bannerului de cookies, persistență locală, stub Consent Mode v2.
- 8 foldere/pagini juridice (tabelul de mai sus).
- `LEGAL_IMPLEMENTATION.md` (acest fișier).

### Fișiere modificate
| Fișier | Modificare |
|---|---|
| `style.css` | Adăugat: footer extins (`.footer-brand`, `.footer-links`, `.footer-meta`, `.footer-contact`), sistem complet pentru pagini juridice (`.legal-*`), banner de cookies (`.cookie-*`), checkbox-uri obligatorii (`.legal-checkbox-*`), casetă informativă checkout (`.checkout-info`). Reguli responsive adăugate în cele două `@media` existente. |
| `index.html`, `magazin.html`, `colaborari.html` | Footer înlocuit cu versiunea extinsă (linkuri legale, mențiune firmă, contact); adăugat banner de cookies; adăugat `<script src="cookie-consent.js">`. |
| `magazin.html` | Secțiunea de sumar comandă: casetă `checkout-info` (produs, caracter fizic, TVA, monedă, plată, livrare, comerciant, link politică rambursare), bifă obligatorie Termeni + Rambursare (nebifată implicit), mesaj de eroare asociat, buton redenumit din „🛒 Comandă acum" în „Comandă și plătește". |
| `configurator.js` | `setupBuyButton()`: validează bifa obligatorie înainte de a continua; fără bifă, afișează eroare inline și mută focusul pe checkbox, fără să permită „comanda". |
| `script.js` | **Fix**: `init()` se oprea complet dacă lipsea mascota `#cat` (bug preexistent — orice pagină fără pisică pierdea și meniul mobil). Restructurat ca funcțiile independente de mascotă (nav-toggle, scroll-fade, formulare) să ruleze mereu. Adăugat `setupContactForm()` pentru noul formular de pe `/contact/`. |
| `sitemap.xml` | Adăugate cele 8 pagini juridice (unde relevant) + `/contact/`; `lastmod` actualizat. |

Toate cele 8 pagini juridice + cele 3 pagini existente conțin footer-ul și bannerul de cookies identice, cu
linkuri absolute (`/termeni-si-conditii/` etc.) — funcționează corect indiferent de adâncimea paginii curente.

---

## 4. Bannerul de cookies și Consent Mode

- **Nimic pornește înainte de alegere.** Google Consent Mode e setat implicit pe `denied` pentru toate cele 4
  semnale (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) înainte de orice interacțiune.
- Trei opțiuni **vizibile și echivalente**: „Accept toate" / „Respinge opționale" / „Personalizează" — toate
  butoane `.pixel-btn`, aceeași ierarhie vizuală.
- Nicio categorie opțională nu e bifată implicit.
- Categoria „Strict necesare" e mereu activă și dezactivată la togglere (checkbox `disabled`).
- „Setări cookies" apare permanent în footer pe toate paginile, deschide același panel, permite modificarea
  și retragerea alegerii oricând.
- **Focus trap** implementat manual (Tab/Shift+Tab captiv în banner cât timp e vizibil); Escape închide panelul
  doar dacă o alegere a fost deja făcută anterior (la prima vizită, alegerea e obligatorie).
- Nu blochează nicio funcționalitate esențială a site-ului — site-ul funcționează identic indiferent de alegere.

## 5. Stocarea consimțământului (decizie confirmată cu operatorul)

Conform confirmării explicite din timpul implementării: **stocarea este client-side only, fără backend**, pentru
ambele fluxuri:

- **Alegerea privind cookie-urile** — stocată în `localStorage`, cheia `nebi_cookie_consent`, conținând
  `{ version, timestamp, necesare, analiza, marketing }`. Este singura persistență reală disponibilă azi;
  documentată explicit ca stocare locală, nu evidență server-side.
- **Bifa obligatorie de la checkout** (Termeni + Rambursare) — validată și blochează UI-ul corect, dar **nu este
  persistată nicăieri**, deoarece butonul „Comandă și plătește" nu transmite încă nicio comandă reală (nu există
  backend/procesator de plăți). Când va fi conectat un backend real, această bifă trebuie salvată împreună cu:
  textul/versiunea consimțământului, versiunea Termenilor și a Politicii de rambursare, data și ora, ID-ul
  comenzii, utilizatorul/e-mailul, și — doar dacă e justificat și documentat — IP-ul și user-agent-ul.

**De implementat la conectarea unui backend real** (nu face parte din acest task, pentru că nu există server):
migrația unei tabele `checkout_consent` sau echivalent, cu câmpurile de mai sus.

## 6. Furnizori terți identificați în cod

| Furnizor | Rol | Status |
|---|---|---|
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Fonturi web (Nunito, Jersey 10, VT323) | **Activ** — transmite IP-ul vizitatorului către Google la fiecare încărcare de pagină |
| Găzduire (dedusă din `CNAME` → `nebi.ro`, stil GitHub Pages) | Hosting site static | De confirmat explicit înainte de lansare |

Niciun alt furnizor (plăți, e-mail, analytics, AI) nu este integrat în cod la data acestei implementări. Toate
sunt marcate cu placeholder explicit `[DE COMPLETAT]` în Politica de confidențialitate, nu au fost inventate.

## 7. Cookie-uri identificate

| Denumire | Tip | Categorie | Status |
|---|---|---|---|
| `nebi_cookie_consent` | localStorage, first-party | Strict necesară | Activ |

**Niciun alt cookie sau tehnologie de stocare nu este folosit** de codul site-ului la data auditului. Tabelul din
`/politica-cookies/` reflectă exact acest lucru — nu conține cookie-uri ipotetice (ex: `_ga`), pentru că
Google Analytics/Meta Pixel/TikTok Pixel nu sunt instalate.

## 8. Variabile de mediu relevante

**Nu se aplică.** Site-ul este 100% static, fără build step, fără fișiere `.env`, fără secrete în cod.

## 9. Migrații de bază de date

**Nu se aplică** — nu există bază de date. A se vedea secțiunea 5 pentru ce va trebui migrat la conectarea unui
backend real.

## 10. Teste efectuate

| # | Test | Rezultat |
|---|---|---|
| 1 | Brace-balance CSS (`style.css`) după toate modificările | ✅ OK (304 `{` / 304 `}`) |
| 2 | Sintaxă JS (`node --check`) pentru `script.js`, `configurator.js`, `cookie-consent.js` | ✅ OK, fără erori |
| 3 | Echilibru `<div>`/`</div>` pentru toate cele 11 pagini HTML (3 existente + 8 noi) | ✅ OK pe toate |
| 4 | Verificare că bannerul de cookies nu pornește niciun tracker înainte de consimțământ | ✅ Consent Mode setat pe `denied` implicit; niciun script de tracking nu există în cod care ar putea porni oricum |
| 5 | Verificare că butonul „Comandă și plătește" blochează corect fără bifa Termenilor | ✅ `setupBuyButton()` întrerupe fluxul și afișează eroare inline dacă bifa nu e bifată |
| 6 | Bifa Termenilor nu e combinată cu newsletter/marketing | ✅ Nu există newsletter pe site; bifa este separată, exclusiv pentru Termeni + Rambursare |
| 7 | Linkurile din footer folosesc căi absolute, funcționale la orice adâncime | ✅ Verificat manual pe structura de foldere |
| 8 | Fix regresie `script.js` (nav-toggle mort pe pagini fără `#cat`) | ✅ Verificat: `init()` rulează acum `setupNavToggle()`/`setupScrollAnimations()`/formularele indiferent de prezența mascotei |

**Netestat — necesită acces la browser, indisponibil în acest mediu de lucru:**
- Randare vizuală reală (screenshot) a bannerului, paginilor legale și checkout-ului.
- Navigare completă cu tastatura / focus trap în browser real.
- Testare pe dispozitive mobile reale (doar verificat structural prin `@media`).
- Testare `prefers-reduced-motion` (nu au fost adăugate animații noi care să necesite asta).

Recomandăm o trecere manuală prin `/impeccable audit` sau testare directă în browser înainte de lansare.

## 11. Elemente rămase de completat

### Date lipsă (marcate `[DE COMPLETAT]` în pagini)
- Adresa completă a sediului social (doar „București, Sector 1" a fost furnizat).
- Numele responsabilului GDPR (dacă va fi numit).
- Programul de suport (dacă există unul stabilit).
- Confirmarea dacă prețurile afișate în configurator includ sau nu TVA.
- Zonele de livrare acoperite și costurile de livrare.
- Termenul estimat de procesare/livrare a unei comenzi.
- Metodele de plată acceptate.
- Termenele interne estimative de răspuns la reclamații.

### Decizii comerciale
- Dacă va exista newsletter (nu a fost implementat — nu exista niciunul de adaptat).
- Dacă și cum va fi introdus un sistem de conturi de utilizator.
- Dacă și când va fi introdusă o funcționalitate de upload/personalizare cu materiale ale clientului.

### Configurări externe
- Alegerea și integrarea unui procesator de plăți (Stripe, Netopia, PayU etc.) — cu verificarea semnăturii
  webhook-urilor la integrare.
- Alegerea unui furnizor de e-mail tranzacțional pentru confirmarea comenzilor.
- Confirmarea explicită a furnizorului de hosting și a locației serverelor.
- Integrarea efectivă a unui instrument de analiză (Google Analytics) sau marketing (Meta/TikTok Pixel) —
  banner-ul și Consent Mode sunt deja pregătite să le gateze corect.

### Verificări juridice (obligatorii înainte de lansare)
- Confirmarea de către avocat a regimului de retragere aplicabil configuratorului NEBI (excepția pentru bunuri
  personalizate, art. 16 lit. c din OUG 34/2014) — implementarea aplică, implicit, dreptul integral de retragere,
  până la această confirmare.
- Verificarea completă a tuturor celor 8 documente juridice.
- Confirmarea necesității de a numi un responsabil GDPR (DPO), conform art. 37 GDPR.
- Confirmarea tratamentului fiscal corect al TVA-ului afișat în configurator.

### Aspecte ce nu pot fi confirmate din cod
- Dacă societatea intenționează să introducă vânzarea de conținut digital în viitor (ceea ce ar schimba
  fundamental regimul de retragere aplicabil acelor produse).
- Volumul real de date pe care backend-ul viitor le va colecta (depinde de arhitectura aleasă).
- Orice acord contractual existent cu furnizori externi, neidentificat în codul public al site-ului.

## 12. Riscuri rămase

- **Risc juridic**: până la confirmarea de avocat, site-ul aplică cel mai protector regim pentru consumator
  (retragere integrală de 14 zile), ceea ce e sigur din perspectiva conformității, dar poate fi mai generos decât
  strict necesar dacă excepția de personalizare se dovedește aplicabilă.
- **Risc tehnic**: bifa de la checkout nu este încă persistată nicăieri (nu există backend) — până la conectarea
  unui backend real, nu există dovadă server-side a consimțământului dat la o eventuală comandă reală.
- **Risc de conformitate cookie-uri**: dacă echipa adaugă direct un script Google Analytics/Meta Pixel fără să
  treacă prin `window.NebiCookieConsent`/evenimentul `nebi:consent-updated`, tracker-ul ar putea porni fără
  consimțământ — integrarea corectă a oricărui tracker viitor trebuie să respecte acest contract.
- **Risc de date incomplete**: toate placeholderele `[DE COMPLETAT]` trebuie rezolvate înainte de lansare;
  publicarea cu placeholdere vizibile în producție ar fi ea însăși o problemă de conformitate.

---

## 13. Surse juridice și verificare

Verificate live, la data implementării (18 iulie 2026):

- **Platforma ODR (Online Dispute Resolution) a Comisiei Europene** — confirmat, prin fetch direct pe
  `ec.europa.eu/consumers/odr` (redirect către `consumer-redress.ec.europa.eu/site-relocation_en`):
  **platforma a fost desființată la 20 iulie 2025**, ca urmare a Regulamentului (UE) 2024/3228. Nu a fost
  referențiată ca mecanism activ în niciun document; a fost înlocuită cu trimiteri către portalul „Consumer
  Redress in the EU" al Comisiei Europene și platforma SAL a ANPC.
- **ANPC** — confirmat, prin fetch direct pe `anpc.ro`: canalul oficial de reclamații este
  `eservicii.anpc.ro`, telefonul „Telefonul Consumatorului" este 021 9551, iar platforma națională SAL este
  `reclamatiisal.anpc.ro`.

Surse statutare folosite ca bază (citate prin denumire, nu copiate integral), verificate ca fiind actele
normative curente relevante la data redactării, fără fetch live individual pentru fiecare (numere de acte
stabile, neschimbate recent, conform cunoștințelor disponibile la data redactării):

- **OUG nr. 34/2014** privind drepturile consumatorilor în cadrul contractelor încheiate cu profesioniștii
  (transpune Directiva 2011/83/UE) — contracte la distanță, dreptul de retragere de 14 zile, informațiile
  obligatorii la checkout.
- **Legea nr. 296/2004** privind Codul consumului (republicată).
- **Legea nr. 208/2022** privind unele aspecte referitoare la contractele de vânzare de bunuri (transpune
  Directiva (UE) 2019/771) — garanția legală de conformitate.
- **Regulamentul (UE) 2016/679 (GDPR)**.
- **Legea nr. 506/2004** privind prelucrarea datelor cu caracter personal și protecția vieții private în
  sectorul comunicațiilor electronice, cu modificările ulterioare (transpune Directiva 2002/58/CE, „legea
  cookie-urilor").
- **Legea nr. 365/2002** privind comerțul electronic.
- **Legea contabilității nr. 82/1991** — termenele de arhivare a documentelor financiar-contabile.

> **Notă:** aceste acte normative trebuie reconfirmate de avocat la data lansării comerciale efective, pentru a
> capta orice modificare legislativă intervenită ulterior redactării acestui document.

---

## CHECKLIST ÎNAINTE DE LANSARE

- [ ] Completarea adresei integrale a sediului social (toate paginile o marchează cu placeholder).
- [ ] Confirmarea procesatorului de plăți ales și integrarea sa (inclusiv verificarea semnăturii webhook-urilor).
- [ ] Confirmarea furnizorului de hosting (dedus din `CNAME`, dar neconfirmat explicit).
- [ ] Confirmarea furnizorilor AI, dacă vor fi introduși vreodată (niciunul folosit azi).
- [ ] Confirmarea duratelor de păstrare a datelor (secțiunea 6 din Politica de confidențialitate).
- [ ] Verificarea prețurilor afișate și confirmarea dacă includ sau nu TVA.
- [ ] Verificarea fluxului de facturare (emiterea documentelor fiscale la comandă).
- [ ] Testarea retragerii consimțământului cookie-urilor („Setări cookies" din footer) în browser real.
- [ ] Testarea blocării trackerelor înainte de consimțământ, cu un tracker real instalat (ex: GA de test).
- [ ] Testarea completă a checkout-ului în browser (desktop + mobil).
- [ ] Testarea bifelor obligatorii (blocare corectă, mesaj de eroare, focus).
- [ ] Testarea e-mailului de confirmare a comenzii (după integrarea unui serviciu de e-mail).
- [ ] Testarea solicitărilor GDPR (acces, ștergere, portabilitate) prin canalul de e-mail descris.
- [ ] **Verificarea juridică finală a tuturor celor 8 documente, de către un avocat.**

---

**Implementarea oferă o bază tehnică și contractuală de conformitate, dar textele și fluxurile trebuie verificate
de un avocat și de persoana responsabilă cu fiscalitatea societății înainte de lansarea comercială.**

Acest proiect **nu este „100% conform legal"** în urma acestei implementări, iar auditul tehnic realizat aici
**nu înlocuiește consultanța juridică**.
