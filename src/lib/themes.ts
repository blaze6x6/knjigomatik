// SAMODEJNO GENERIRANO (tools/gen-themes.py). Ne urejajte ročno.
export type ThemeMode = "light" | "dark";
export interface ThemeInfo { id: string; name: string; mode: ThemeMode; paper: string; card: string; brand: string; brass: string; ink: string }

export const THEMES: ThemeInfo[] = [
  {
    "id": "papir",
    "name": "Papir",
    "mode": "light",
    "paper": "#f4ede1",
    "card": "#fffaf1",
    "brand": "#8c2f39",
    "brass": "#7a5e1c",
    "ink": "#2a2118"
  },
  {
    "id": "lan",
    "name": "Lan",
    "mode": "light",
    "paper": "#efeadd",
    "card": "#faf7ee",
    "brand": "#4d6b2f",
    "brass": "#755a1b",
    "ink": "#262a1f"
  },
  {
    "id": "morje",
    "name": "Morje",
    "mode": "light",
    "paper": "#e9f0f5",
    "card": "#f8fbfd",
    "brand": "#1f5f8b",
    "brass": "#7f621d",
    "ink": "#14232e"
  },
  {
    "id": "meta",
    "name": "Meta",
    "mode": "light",
    "paper": "#e6f3ef",
    "card": "#f6fbf9",
    "brand": "#0f766e",
    "brass": "#7a5e1c",
    "ink": "#12292a"
  },
  {
    "id": "lavanda",
    "name": "Lavanda",
    "mode": "light",
    "paper": "#efeaf6",
    "card": "#faf8fd",
    "brand": "#6d3fb2",
    "brass": "#755a1b",
    "ink": "#221a33"
  },
  {
    "id": "breskev",
    "name": "Breskev",
    "mode": "light",
    "paper": "#fbeee6",
    "card": "#fffaf6",
    "brand": "#b8472a",
    "brass": "#7a5e1c",
    "ink": "#33201a"
  },
  {
    "id": "med",
    "name": "Med",
    "mode": "light",
    "paper": "#f7efd6",
    "card": "#fffbea",
    "brand": "#92580b",
    "brass": "#7a5a10",
    "ink": "#2d2410"
  },
  {
    "id": "roza",
    "name": "Roza",
    "mode": "light",
    "paper": "#f9e9ee",
    "card": "#fff8fa",
    "brand": "#b0245a",
    "brass": "#7a5e1c",
    "ink": "#301620"
  },
  {
    "id": "kamen",
    "name": "Kamen",
    "mode": "light",
    "paper": "#eceef1",
    "card": "#fafbfc",
    "brand": "#3b4f8a",
    "brass": "#7a5e1c",
    "ink": "#1b1f27"
  },
  {
    "id": "sneg",
    "name": "Sneg",
    "mode": "light",
    "paper": "#ffffff",
    "card": "#ffffff",
    "brand": "#2323b4",
    "brass": "#6e5200",
    "ink": "#000000"
  },
  {
    "id": "crnilo",
    "name": "Črnilo",
    "mode": "dark",
    "paper": "#16120f",
    "card": "#211b16",
    "brand": "#b8434f",
    "brass": "#d4ad62",
    "ink": "#f1e8d8"
  },
  {
    "id": "polnoc",
    "name": "Polnoč",
    "mode": "dark",
    "paper": "#0e1522",
    "card": "#162033",
    "brand": "#3f6fd1",
    "brass": "#e0b85a",
    "ink": "#e8eefb"
  },
  {
    "id": "gozd",
    "name": "Gozd",
    "mode": "dark",
    "paper": "#0f1a14",
    "card": "#17261d",
    "brand": "#2a7d4a",
    "brass": "#d6b25a",
    "ink": "#e6f2e8"
  },
  {
    "id": "vijolica",
    "name": "Vijolica",
    "mode": "dark",
    "paper": "#1a1022",
    "card": "#25172f",
    "brand": "#8a4fd0",
    "brass": "#e0b85a",
    "ink": "#f2e9fa"
  },
  {
    "id": "oglje",
    "name": "Oglje",
    "mode": "dark",
    "paper": "#1b1b1d",
    "card": "#252528",
    "brand": "#b45f06",
    "brass": "#e6c060",
    "ink": "#f0f0f0"
  },
  {
    "id": "bordo",
    "name": "Bordo",
    "mode": "dark",
    "paper": "#1e0f12",
    "card": "#2a161a",
    "brand": "#b3323f",
    "brass": "#e0b85a",
    "ink": "#f7e8ea"
  },
  {
    "id": "globina",
    "name": "Globina",
    "mode": "dark",
    "paper": "#0b1a1c",
    "card": "#112627",
    "brand": "#0d7d78",
    "brass": "#e0b85a",
    "ink": "#e3f4f3"
  },
  {
    "id": "kava",
    "name": "Kava",
    "mode": "dark",
    "paper": "#1c1512",
    "card": "#281e19",
    "brand": "#a8632d",
    "brass": "#e0bb6a",
    "ink": "#f3e7dc"
  },
  {
    "id": "cisto-crna",
    "name": "Čisto črna",
    "mode": "dark",
    "paper": "#000000",
    "card": "#0d0d0d",
    "brand": "#2f6fe0",
    "brass": "#e6c060",
    "ink": "#f5f5f5"
  },
  {
    "id": "somrak",
    "name": "Somrak",
    "mode": "dark",
    "paper": "#171a2b",
    "card": "#20243b",
    "brand": "#c0397a",
    "brass": "#e6c060",
    "ink": "#ecebf7"
  }
];

export const DEFAULT_LIGHT = "papir";
export const DEFAULT_DARK = "crnilo";
export const THEME_STORAGE_KEY = "knjigomatik-theme";
