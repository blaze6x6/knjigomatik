#!/usr/bin/env python3
"""Generira src/app/themes.css in src/lib/themes.ts iz spodnjih palet in preveri kontrast (WCAG).
Uporaba: python3 tools/gen-themes.py <koren projekta>
Barve, ki ne dosegajo praga, se samodejno popravijo (potemnijo/posvetlijo) in izpišejo."""
import sys, pathlib, json

def h2r(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def r2h(c): return '#%02x%02x%02x' % tuple(max(0,min(255,round(x))) for x in c)
def lum(c):
    def f(v):
        v/=255; return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b=[f(x) for x in c]; return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    la,lb=lum(h2r(a)),lum(h2r(b)); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def mix(a,b,t): ca,cb=h2r(a),h2r(b); return r2h([x*(1-t)+y*t for x,y in zip(ca,cb)])

changes=[]
def fit(name, tid, color, bgs, minimum, toward):
    """premakne barvo proti 'toward' (#000000/#ffffff), dokler ni kontrast do vseh ozadij >= minimum"""
    orig=color
    for _ in range(60):
        if all(cr(color,b)>=minimum for b in bgs): break
        color=mix(color,toward,0.04)
    if color!=orig: changes.append(f'{tid:10s} {name:11s} {orig} -> {color}')
    return color

# (id, ime, način, paper, card, sunk, ink, ink2, muted, faint, line, brand, brandText, brass)
T = [
 ("papir","Papir","light","#f4ede1","#fffaf1","#ebe2d2","#2a2118","#4a3d2f","#6e5f4e","#a39380","#dccfba","#8c2f39","#8c2f39","#8a6a1f"),
 ("lan","Lan","light","#efeadd","#faf7ee","#e3dcc9","#262a1f","#444a38","#646a54","#8f9580","#d3ccb4","#4d6b2f","#4d6b2f","#8a6a1f"),
 ("morje","Morje","light","#e9f0f5","#f8fbfd","#dbe6ee","#14232e","#34495a","#55697a","#8497a6","#c3d4e0","#1f5f8b","#1f5f8b","#8a6a1f"),
 ("meta","Meta","light","#e6f3ef","#f6fbf9","#d5e8e2","#12292a","#2f4b4b","#4f6b69","#7f9a96","#bcd8d0","#0f766e","#0f766e","#8a6a1f"),
 ("lavanda","Lavanda","light","#efeaf6","#faf8fd","#e2daee","#221a33","#433858","#66597c","#9488aa","#d3c9e3","#6d3fb2","#6d3fb2","#8a6a1f"),
 ("breskev","Breskev","light","#fbeee6","#fffaf6","#f3dfd2","#33201a","#573a2f","#7a5a4c","#ad8d7e","#ead2c2","#b8472a","#b8472a","#8a6a1f"),
 ("med","Med","light","#f7efd6","#fffbea","#eee2bd","#2d2410","#4f4220","#6f5f30","#a39460","#e0d09a","#92580b","#92580b","#7a5a10"),
 ("roza","Roza","light","#f9e9ee","#fff8fa","#f1d9e1","#301620","#542b3b","#7a4d5e","#aa8594","#e8c8d3","#b0245a","#b0245a","#8a6a1f"),
 ("kamen","Kamen","light","#eceef1","#fafbfc","#dfe2e7","#1b1f27","#3a4150","#596273","#8b93a3","#cfd3db","#3b4f8a","#3b4f8a","#8a6a1f"),
 ("sneg","Sneg","light","#ffffff","#ffffff","#f1f1f3","#000000","#26262b","#4b4b55","#80808c","#d4d4da","#2323b4","#2323b4","#6e5200"),
 ("crnilo","Črnilo","dark","#16120f","#211b16","#2b231c","#f1e8d8","#d6c9b3","#a39580","#7a6d5b","#3a3027","#b8434f","#e0818a","#d4ad62"),
 ("polnoc","Polnoč","dark","#0e1522","#162033","#1e2b42","#e8eefb","#c3cee6","#8fa0c0","#65759a","#283853","#3f6fd1","#8db0f5","#e0b85a"),
 ("gozd","Gozd","dark","#0f1a14","#17261d","#1f3327","#e6f2e8","#c0d6c5","#8fae97","#67856f","#28402f","#2a7d4a","#7ccf9a","#d6b25a"),
 ("vijolica","Vijolica","dark","#1a1022","#25172f","#301f3d","#f2e9fa","#d5c4e6","#a995c0","#7f6c98","#3d2a4d","#8a4fd0","#c4a0f0","#e0b85a"),
 ("oglje","Oglje","dark","#1b1b1d","#252528","#2f2f33","#f0f0f0","#d0d0d4","#a0a0a8","#76767e","#3a3a40","#b45f06","#f0a24a","#e6c060"),
 ("bordo","Bordo","dark","#1e0f12","#2a161a","#381e23","#f7e8ea","#e0c4c9","#b595a0","#8c6c77","#46262d","#b3323f","#f08a96","#e0b85a"),
 ("globina","Globina","dark","#0b1a1c","#112627","#183436","#e3f4f3","#bcdad8","#86aaa8","#5f8582","#1f4042","#0d7d78","#5fd1c9","#e0b85a"),
 ("kava","Kava","dark","#1c1512","#281e19","#352822","#f3e7dc","#dac7b6","#ab9582","#826e5d","#43332b","#a8632d","#e8a46a","#e0bb6a"),
 ("cisto-crna","Čisto črna","dark","#000000","#0d0d0d","#1a1a1a","#f5f5f5","#d4d4d4","#a3a3a3","#737373","#2a2a2a","#2f6fe0","#7fb0ff","#e6c060"),
 ("somrak","Somrak","dark","#171a2b","#20243b","#2a2f4b","#ecebf7","#cac9e6","#9a99c4","#7270a0","#343a5e","#c0397a","#f08ac0","#e6c060"),
]
TONES = {"light": dict(moss="#3f7a4a", sky="#2f6c8f", plum="#7a4b8a", rust="#b0452f", stone="#6f685c"),
         "dark":  dict(moss="#6fb27b", sky="#6fb0d6", plum="#b78ac6", rust="#e08467", stone="#a39b8e")}

out=[]; meta=[]
for (tid,name,mode,paper,card,sunk,ink,ink2,muted,faint,line,brand,brandText,brass) in T:
    black,white="#000000","#ffffff"
    away = black if mode=="light" else white   # smer za večji kontrast z ozadjem
    bgs=[paper,card,sunk]
    ink  = fit("ink",tid,ink,bgs,10,away)
    ink2 = fit("ink2",tid,ink2,bgs,7,away)
    muted= fit("muted",tid,muted,bgs,4.5,away)
    faint= fit("faint",tid,faint,[paper,card],3,away)
    brand= fit("brand",tid,brand,[],0,black)
    # bel tekst na gumbu
    c=brand
    for _ in range(60):
        if cr(c,white)>=4.5: break
        c=mix(c,black,0.04)
    if c!=brand: changes.append(f'{tid:10s} brand       {brand} -> {c}'); brand=c
    hover=mix(brand,black,0.14)
    brandText=fit("brandText",tid,brandText,bgs,4.5,away)
    brass= fit("brass",tid,brass,bgs,4.5,away)
    tones={}
    for k,v in TONES[mode].items():
        blend=lambda base: mix(base,v,0.12)
        tones[k]=fit(k,tid,v,[blend(card),blend(paper),blend(sunk)],4.5,away)
    backdrop = "rgba(42, 33, 24, 0.55)" if mode=="light" else "rgba(0, 0, 0, 0.7)"
    shadow = ("0 1px 2px rgba(60, 40, 20, 0.08), 0 8px 24px -12px rgba(60, 40, 20, 0.25)" if mode=="light"
              else "0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -12px rgba(0, 0, 0, 0.6)")
    vars_=dict(paper=paper,card=card,sunk=sunk,ink=ink,**{"ink-2":ink2},muted=muted,faint=faint,line=line,brand=brand,
               **{"brand-hover":hover,"brand-text":brandText},brass=brass,backdrop=backdrop,**tones,shadow=shadow)
    sel = f'html[data-theme="{tid}"]' if tid!="papir" else ':root,\nhtml[data-theme="papir"]'
    body="\n".join(f"  --{k}: {v};" for k,v in vars_.items())
    out.append(f"{sel} {{\n{body}\n  color-scheme: {mode};\n}}\n")
    meta.append(dict(id=tid,name=name,mode=mode,paper=paper,card=card,brand=brand,brass=brass,ink=ink))

root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.')
(root/'src/app/themes.css').write_text("/* SAMODEJNO GENERIRANO (tools/gen-themes.py). Ne urejajte ročno. */\n\n"+"\n".join(out))
ts = '''// SAMODEJNO GENERIRANO (tools/gen-themes.py). Ne urejajte ročno.
export type ThemeMode = "light" | "dark";
export interface ThemeInfo { id: string; name: string; mode: ThemeMode; paper: string; card: string; brand: string; brass: string; ink: string }

export const THEMES: ThemeInfo[] = %s;

export const DEFAULT_LIGHT = "papir";
export const DEFAULT_DARK = "crnilo";
export const THEME_STORAGE_KEY = "knjigomatik-theme";
''' % json.dumps(meta, ensure_ascii=False, indent=2)
(root/'src/lib/themes.ts').write_text(ts)
print("tem:",len(T)); print("\n".join(changes) if changes else "brez popravkov")
