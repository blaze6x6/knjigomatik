# 📚 Knjigomatik 2.1

Osebna knjižna polica za vas in vašo družino ali bralni krožek. Kaj berete, kaj ste prebrali, kaj čaka na polici ali v knjižnici, z ocenami, povzetki in statistiko. Vmesnik je v slovenščini, deluje na telefonu (PWA) in v namizni različici, podatki ostanejo na vašem strežniku.

## ✨ Funkcionalnosti

- **Knjige**: status (želja, v branju, prebrana, rezervirana, ni na voljo, opuščena), ocena 1–10, žanr, leto, strani, založnik, ISBN, barva hrbta, povzetek.
- **Datumi branja**: začetek in konec se ob menjavi statusa vpišeta sami (lahko ju popravite).
- **Hitri vnos**: ISBN (10/13 števk) prek Open Library ali COBISS ID z branjem naslovnice prek Gemini (neobvezno).
- **Iskanje, filter po statusu in žanru, razvrščanje.**
- **Statistika**: prebrano po letih, strani, žanri, razporeditev ocen.
- **Uvoz in izvoz** (JSON za varnostno kopijo, CSV za Excel).
- **Uporabniki**: skrbnik dodaja račune, jih onemogoča, spreminja vloge in ponastavlja gesla; vsak uporabnik vidi samo svoje knjige.
- **Pozabljena gesla**: uporabnik si lahko geslo ponastavi sam prek e-pošte (lasten SMTP strežnik), skrbnik pa lahko ustvari enkratno povezavo; za nujno obnovo skrbnika je ukaz v ukazni vrstici.
- **Samodejne migracije baze** ob zagonu; varna nadgradnja z različice 1.x.
- **20 barvnih tem** (svetle in temne, izbira v glavi ali samodejno), spodnja navigacija na telefonu, dostopnost (tipkovnica, bralniki zaslona).

## 🚀 Namestitev (Docker Compose)

```bash
git clone https://github.com/blaze6x6/knjigomatik
cd knjigomatik

cp .env.example .env
# v .env nastavite JWT_SECRET:
openssl rand -hex 32        # rezultat prilepite za JWT_SECRET=

docker compose up -d
# Aplikacija je na http://localhost:3000
```

Pri prvem obisku se prikaže obrazec za **prvi račun, ki postane skrbnik** (priporočeno vpišite tudi e-naslov). Prijava je potem mogoča z e-naslovom ali uporabniškim imenom. Po tem je ta pot trajno zaprta; nove uporabnike dodaja skrbnik v zavihku »Uporabniki«.

### Nastavitve (`.env`)

| Spremenljivka | Opis | Privzeto |
|---|---|---|
| `JWT_SECRET` | **Obvezno.** Skrivni ključ za seje (vsaj 16 znakov, priporočeno 64) | – |
| `POSTGRES_PASSWORD` | Geslo baze (le črke in števke) | `postgres` |
| `GEMINI_API_KEY` | Neobvezno: samodejno branje naslovnic iz COBISS | prazno |
| `GEMINI_MODEL` | Model za branje naslovnic | `gemini-3.6-flash` |
| `APP_PORT` | Port na gostitelju | `3000` |
| `COOKIE_SECURE` | `auto` (po https), `true`, `false` | `auto` |
| `APP_TZ` | Časovni pas za samodejne datume | `Europe/Ljubljana` |
| `KNJIGOMATIK_VERSION` | Oznaka Docker slike | `latest` |
| `APP_URL` | Javni naslov aplikacije (za povezave v e-pošti), npr. `https://knjige.primer.si` | – |
| `SMTP_HOST`, `SMTP_PORT` | SMTP strežnik in port | –, `587` |
| `SMTP_SECURE` | `true` = implicitni TLS (465), `false` = STARTTLS (587) | `false` |
| `SMTP_USER`, `SMTP_PASS` | Prijava na SMTP (neobvezno, če strežnik ne zahteva) | – |
| `SMTP_FROM` | Pošiljatelj, npr. `Knjigomatik <knjige@primer.si>` | – |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `false` za samopodpisan certifikat | `true` |

Za dostop prek interneta postavite pred aplikacijo reverse proxy s HTTPS (Caddy, Traefik, nginx) in naj posreduje `X-Forwarded-For` ter `X-Forwarded-Proto`. Baza ni izpostavljena navzven.

## ✉️ E-pošta (neobvezno)

Če imate lasten poštni strežnik, v `.env` nastavite `APP_URL`, `SMTP_HOST`, `SMTP_FROM` (in po potrebi `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`) ter ponovno zaženite (`docker compose up -d`). E-pošta se vklopi sama, ko so nastavljeni `SMTP_HOST`, pošiljatelj in `APP_URL`. Skrbnik v zavihku »Uporabniki« vidi stanje in lahko pošlje **testno sporočilo**; napaka SMTP (npr. napačen port ali certifikat) se izpiše tam.

`APP_URL` je obvezen namenoma: povezave v e-pošti se sestavijo iz njega, ne iz zaglavja zahteve, da jih ni mogoče podtakniti z lažnim `Host`.

Kaj e-pošta omogoča:
- **»Ste pozabili geslo?«** na prijavi: uporabnik vpiše e-naslov ali uporabniško ime in dobi povezavo (velja 1 uro, enkratna). Odgovor je vedno enak, ne glede na to, ali račun obstaja; omejeno na 3 zahteve na uro za isti vnos.
- **Povabilo novega uporabnika** po e-pošti (skrbnik) in pošiljanje povezave za ponastavitev na uporabnikov naslov.
- **Obvestilo o spremembi gesla** na uporabnikov naslov.

E-naslov nastavi uporabnik v »Moj račun« (za spremembo je potrebno geslo) ali skrbnik pri uporabniku. En naslov lahko pripada samo enemu računu. Brez nastavljenega SMTP vse deluje kot prej, prek povezav, ki jih ustvari skrbnik.

## 👥 Uporabniki in pozabljena gesla

**Nov uporabnik** (skrbnik → Uporabniki → Nov uporabnik): izberete povezavo za nastavitev gesla (priporočeno; uporabnik si geslo izbere sam) ali začasno geslo.

**Uporabnik je pozabil geslo**: lahko si ga ponastavi sam prek e-pošte (glejte zgoraj). Sicer skrbnik pri uporabniku klikne ikono ključa, ustvari se enkratna povezava `…/reset?token=…`, ki jo pošlje osebi. Povezava velja 24 ur, deluje enkrat, nova povezava razveljavi prejšnjo, ob uporabi pa uporabnika prijavi in odjavi vse njegove druge seje. V bazi se hrani le zgoščena vrednost žetona.

**Skrbnik je pozabil geslo** (ali ni nobenega drugega skrbnika):

```bash
docker compose exec app node scripts/reset-password.mjs ime_uporabnika
# dodatno --admin: uporabnika naredi skrbnika in ga odblokira
```

Izpiše novo začasno geslo; po prijavi ga spremenite v meniju »Moj račun«.

Dodatno: skrbnik lahko račune onemogoči (takojšnja odjava, knjige ostanejo), spremeni ime in vlogo; sebe ne more izbrisati ali onemogočiti. Vsak uporabnik si lahko sam spremeni ime in geslo.

## ⬆️ Nadgradnja z 1.x

1. **Varnostna kopija** (priporočeno pred vsako nadgradnjo):
   ```bash
   docker compose exec db pg_dump -U postgres knjigomatik > knjigomatik-$(date +%F).sql
   ```
2. Zamenjajte datoteke z 2.0 (ali `git pull`), ustvarite `.env` in nastavite `JWT_SECRET`. **Aplikacija se brez njega namenoma ne zažene**; stara privzeta vrednost v `docker-compose.yml` ni več sprejeta.
3. Če je v starem `docker-compose.yml` vaše lastno geslo baze, ga prepišite v `POSTGRES_PASSWORD` v `.env` (obstoječa baza ohrani staro geslo).
4. `docker compose pull && docker compose up -d`.

Kaj se zgodi: ob zagonu se samodejno izvedejo migracije iz mape `migrations/`. Vaši uporabniki, knjige, ocene in povzetki ostanejo nespremenjeni; dodajo se novi stolpci (datuma branja, onemogočen račun …) in tabela za ponastavitev gesel. Migracije so ponovljive in jih izvede vsaka različica le enkrat (tabela `schema_migrations`). Starejše sheme (stolpec `notes`, `google_books_id`) se prav tako uredijo.

Opombe:
- Vsi uporabniki se morajo **enkrat znova prijaviti** (nov način sej).
- Javna registracija prek API-ja je odpravljena; račune ustvarja skrbnik.
- Port 5432 baze ni več objavljen navzven.
- `init.sql` ni več potreben (shemo upravljajo migracije).
- Neuporabljen stolpec `google_books_id` se odstrani (migracija 0003).
- Datumov branja za že prebrane knjige ni mogoče zanesljivo uganiti, zato ostanejo prazni; dopolnite jih po želji. Statistika po letih šteje samo knjige z datumom.

## 💾 Varnostne kopije

- V aplikaciji: meni → **Uvoz in izvoz** (JSON/CSV, samo vaše knjige).
- Cela baza: `docker compose exec db pg_dump -U postgres knjigomatik > kopija.sql`
- Obnovitev: `cat kopija.sql | docker compose exec -T db psql -U postgres knjigomatik`

## 🎨 Barvne teme

Ikona palete v glavi odpre izbirnik 20 tem; »Samodejno« sledi napravi. Izbira velja za ta brskalnik. Nove teme ali spremembe barv: uredite palete v `tools/gen-themes.py` in zaženite `python3 tools/gen-themes.py .` (ustvari `src/app/themes.css` in `src/lib/themes.ts` ter preveri kontrast).

## 🛠️ Razvoj

```bash
npm install
cp .env.example .env            # nastavite JWT_SECRET (v razvoju ni obvezen)
docker compose -f docker-compose.dev.yml up db -d
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/knjigomatik
npm run migrate                 # uporabi migrations/*.sql
npm run dev
```

Nova sprememba sheme: dodajte `migrations/0003_opis.sql` (naslednja zaporedna številka, pisati idempotentno) in uskladite `src/db/schema.ts`. Uporabljenih migracij ne spreminjajte.

Preverjanje: `npm run typecheck`, `npm run lint`.

## 🔐 Varnost (povzetek)

- Seje: podpisan JWT v `httpOnly` piškotku (`SameSite=Lax`, `Secure` po https); ob vsaki zahtevi se preveri stanje računa, zato onemogočitev, sprememba gesla ali odvzem pravic delujejo takoj.
- Gesla: bcrypt (strošek 12), najmanj 8 znakov.
- Omejitev poskusov prijave in ponastavitve (v pomnilniku; ob več replikah uporabite omejitev na reverse proxyju).
- Iskanje po ISBN/COBISS zahteva prijavo.
- Pozabljeno geslo ne razkrije, ali račun obstaja; žetoni v bazi so zgoščeni (SHA-256); povezave v e-pošti temeljijo na `APP_URL`.
- Glave `X-Frame-Options`, `nosniff`, `Referrer-Policy`.

## 📦 Tehnologije

Next.js 16 (App Router) · React 19 · PostgreSQL 16 · Drizzle ORM · Tailwind CSS 4 · jose · bcryptjs · Nodemailer · Lucide · Docker

## Licenca

Glejte `LICENSE`.
