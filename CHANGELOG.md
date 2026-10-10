# Spremembe

## 2.3.0

- Aplikacijo je mogoče **namestiti kot PWA** (Android/Chrome: »Namesti« v Mojem računu ali v meniju brskalnika; iOS Safari: Deli → Dodaj na začetni zaslon).
- Servisni delavec `public/sw.js`: hitrejše nalaganje statičnih datotek, brez povezave se prikaže `offline.html`. API-jev in strani ne shranjuje v predpomnilnik (podatki so zasebni).
- Manifest z `id`, `scope`, ločenima namenoma ikon `any` in `maskable`. Nova komponenta `InstallApp`, registracija v `PwaRegister`.
- Namestitev zahteva **HTTPS** (ali `localhost`). Registracija servisnega delavca teče samo v produkcijski gradnji.

## 2.2.0

- 20 barvnih tem (10 svetlih, 10 temnih), izbirnik z ikono palete v glavi (tudi na prijavni strani) in možnost »Samodejno« (sledi svetli/temni nastavitvi naprave). Izbira se pomni v brskalniku.
- Teme: Papir, Lan, Morje, Meta, Lavanda, Breskev, Med, Roza, Kamen, Sneg · Črnilo, Polnoč, Gozd, Vijolica, Oglje, Bordo, Globina, Kava, Čisto črna, Somrak.
- Barve so ob generiranju samodejno preverjene po WCAG (besedilo ≥ 4,5:1, bel napis na gumbih, značke statusa).
- Stara izbira »svetla/temna« se prenese (Papir/Črnilo).
- `tools/gen-themes.py`: vir palet; po spremembi zaženite `python3 tools/gen-themes.py .`

## 2.1.1

- Prijava z e-naslovom **ali** uporabniškim imenom (eno polje). Uporabniško ime ne more vsebovati `@`, zato ni dvoumnosti.
- Prvi skrbnik lahko ob namestitvi vpiše e-naslov.

## 2.1.0

- E-naslov uporabnika (Moj račun, skrbnik pri uporabniku, pri ustvarjanju računa); en naslov = en račun.
- Samostojna ponastavitev gesla prek lastnega SMTP strežnika (»Ste pozabili geslo?«), enotni odgovor ne glede na obstoj računa, omejitev zahtev, povezava velja 1 uro.
- Povabilo novega uporabnika in povezava za ponastavitev po e-pošti, obvestilo o spremembi gesla.
- Skrbniški pregled SMTP nastavitev in pošiljanje testnega sporočila.
- Migracija 0003: stolpec `users.email` (enolični, brez razlike velikih/malih črk); odstranjen neuporabljen `books.google_books_id`.
- Nov paket `nodemailer`.

## 2.0.0

**Novo**
- Nov dizajn: topla »knjižna« tema (svetla/temna), serifni naslovi, naslovnice z lastno platnico, spodnja navigacija in gumb za dodajanje na telefonu, dialogi namesto `confirm()`.
- Ponastavitev gesel prek enkratnih povezav, povabila novih uporabnikov, onemogočanje računov, urejanje imen in vlog, lastno spreminjanje imena in gesla, `scripts/reset-password.mjs` za nujno obnovo.
- SQL migracije z lastnim izvajalcem (`scripts/migrate.mjs`), ki se zažene ob vsakem startu; podpora za nadgradnjo starih shem.
- Datuma začetka/konca branja (samodejno), razvrščanje, filter po žanru, hiter prehod »Začni brati« / »Prebrano«.
- Statistika po letih, žanrih in ocenah, štetje strani; upošteva tudi status »opuščena«.
- Uvoz in izvoz (JSON, CSV).
- Iskanje po ISBN (Open Library) poleg COBISS + Gemini; model nastavljiv z `GEMINI_MODEL`.
- Polja ISBN, strani, založnik in barva hrbta so zdaj v vmesniku.

**Popravki**
- Urejanje knjige ne briše več barve in drugih polj; posodobitve so delne.
- Statistika ne ignorira več statusa »opuščena«.
- Manjkajoče ikone PWA (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).
- `cobiss` iskanje zahteva prijavo (prej je bilo odprto in je trošilo Gemini kvoto).
- Registracija po prvem uporabniku ni več odprta prek API-ja; tekmovalni pogoj pri ustvarjanju prvega skrbnika odpravljen (advisory lock).
- Napaka pri migraciji ne ostane več neopažena (prej `|| true`).
- Nepotrebni paketi odstranjeni (`cheerio`, `dotenv`, `@types/bcryptjs`, `drizzle-kit`).

**Varnost**
- `JWT_SECRET` je obvezen, privzete vrednosti niso sprejete.
- Seje se preverjajo v bazi; skrajšane na 14 dni.
- Omejitev poskusov prijave, enak čas odgovora za neobstoječega uporabnika.
- Piškotek `Secure` glede na https; varnostne glave HTTP.
- Validacija vseh vnosov na strežniku; geslo vsaj 8 znakov.
- Baza ni več izpostavljena na hostu.
