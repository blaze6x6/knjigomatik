# 📚 Knjigomatik — Vaša knjižna polica

Moderna spletna aplikacija za upravljanje vaše knjižne zbirke. Kategorizirajte, ocenjujte in spremljajte svoje branje.

## ✨ Funkcionalnosti

- **📖 Upravljanje knjig** — Dodajajte, urejajte in brišite knjige
- **🏷️ Kategorizacija** — Neprebrane, v branju, prebrane, rezervirane
- **⭐ Ocenjevanje** — Ocena od 1 do 10 z zvezdičkami
- **🎨 Barvno ozadje** — Izberite barvo ozadja za vsako knjigo
- **📊 Statistika** — Pregled napredka branja in povprečne ocene
- **🔐 Avtentikacija** — Prijavni sistem z JWT sejami
- **👥 Upravljanje uporabnikov** — Administrator dodaja nove uporabnike
- **🌍 Slovenščina** — Celoten vmesnik v slovenskem jeziku
- **📱 Odzivni dizajn** — Deluje na vseh napravah
- **🐳 Docker** — Enostavna namestitev z docker-compose

## 🚀 Namestitev z Docker Compose

```bash
# Klonirajte repozitorij
git clone <url-repozitorija>
cd knjigomatik

# Zaženite
docker-compose up -d

# Aplikacija je dostopna na http://localhost:3000
```

## 🔧 Konfiguracija

Spremenite okoliške spremenljivke v `docker-compose.yml`:

| Spremenljivka | Opis | Privzeta vrednost |
|---|---|---|
| `DATABASE_URL` | PostgreSQL povezava | `postgresql://postgres:postgres@db:5432/knjigomatik` |
| `JWT_SECRET` | Skrivni ključ za JWT | spremenite v produkciji! |

## 📋 Prva uporaba

1. Odprite aplikacijo v brskalniku
2. Pri prvem obisku se prikaže registracijski obrazec
3. **Prvi registriran uporabnik avtomatsko postane administrator**
4. Administrator lahko nato dodaja nove uporabnike v zavihku "Uporabniki"
5. Vsak uporabnik vidi in upravlja samo svoje knjige

## 🛠️ Razvoj

```bash
# Namestite odvisnosti
npm install

# Ustvarite .env datoteko
cp .env.example .env

# Zaženite PostgreSQL (ali uporabite docker)
docker-compose up db -d

# Potisnite shemo v bazo
npx drizzle-kit push

# Zaženite razvojni strežnik
npm run dev
```

## 📦 Tehnologije

- **Next.js 16** — React framework z App Router
- **PostgreSQL** — Relacijska baza podatkov
- **Drizzle ORM** — TypeScript ORM
- **Tailwind CSS 4** — Utility-first CSS
- **Jose** — JWT avtentikacija
- **Lucide React** — Ikone
- **Docker** — Kontejnerizacija
