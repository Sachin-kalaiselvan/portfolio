"""Renders social preview images (1200x630) and the touch icon into public/.
Run after changing project names or summaries:  python3 scripts/make-og.py
Needs Python Playwright and a Chromium/Chrome binary (CHROME env var to override)."""
import asyncio, base64, json, os, re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
NM = ROOT / "node_modules"
OUT = ROOT / "public" / "og"
OUT.mkdir(parents=True, exist_ok=True)

def font(p):
    return "data:font/woff2;base64," + base64.b64encode((NM / p).read_bytes()).decode()

FONTS = f"""
@font-face {{ font-family: G; src: url({font('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')}); font-weight: 100 900; }}
@font-face {{ font-family: M; src: url({font('@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')}); font-weight: 100 900; }}
@font-face {{ font-family: S; font-style: italic; src: url({font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}); }}
"""

src = (ROOT / "src/content/projects.ts").read_text()
cards = [{"slug": "default", "index": "", "name": "Sachin Kalaiselvan",
          "cat": "Founder, The Ingredient List", "line": "Software for manufacturers, backend systems, mobile games and an open-world game set in Bengaluru."}]
for m in re.finditer(r"\n    slug: '([^']+)',\n    index: '([^']+)',\n    name: '([^']+)',(?:\n    parent: '[^']+',)?\n    category: '([^']+)',[\s\S]*?\n    summary: '((?:[^'\\]|\\.)*)'", src):
    cards.append({"slug": m[1], "index": m[2], "name": m[3], "cat": m[4], "line": m[5].replace("\\'", "'")})

def html(c):
    big = c["slug"] == "default"
    size = 112 if big else (96 if len(c["name"]) < 14 else 78)
    return f"""<!doctype html><html><head><style>{FONTS}
    *{{margin:0;box-sizing:border-box}}
    body{{width:1200px;height:630px;background:#f3f0e8;color:#131312;font-family:G;padding:64px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden}}
    .top{{display:flex;justify-content:space-between;font-family:M;font-size:17px;letter-spacing:.06em;text-transform:uppercase;color:#5d5b55;border-top:1px solid rgba(19,19,18,.25);padding-top:18px}}
    .top b{{color:#2440d6;font-weight:500}}
    h1{{margin-top:auto;font-size:{size}px;font-weight:520;letter-spacing:-.055em;line-height:.9}}
    p{{margin-top:28px;font-size:30px;line-height:1.25;letter-spacing:-.02em;max-width:900px;color:#34332f}}
    em{{font-family:S;font-style:italic;color:#2440d6;font-weight:400}}
    .bar{{position:absolute;right:72px;top:150px;width:150px;height:150px;border:1px solid #131312;display:grid;place-items:center;font-family:M;font-size:34px;letter-spacing:.06em}}
    </style></head><body>
    <div class="top"><span>{'<b>'+c['index']+'</b> — ' if c['index'] else ''}{c['cat']}</span><span>Sachin Kalaiselvan · Bengaluru</span></div>
    {'<div class="bar">SK</div>' if big else ''}
    <h1>{c['name']}</h1><p>{c['line']}</p></body></html>"""

ICON = f"""<!doctype html><html><head><style>{FONTS}*{{margin:0}}body{{width:180px;height:180px;background:#131312;color:#f3f0e8;display:grid;place-items:center;font-family:M;font-size:64px;letter-spacing:.04em}}</style></head><body>SK</body></html>"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"))
        pg = await b.new_page(viewport={"width": 1200, "height": 630})
        for c in cards:
            await pg.set_content(html(c))
            await pg.evaluate("document.fonts.ready")
            await pg.screenshot(path=str(OUT / f"og-{c['slug']}.png"))
            print("og", c["slug"])
        await pg.set_viewport_size({"width": 180, "height": 180})
        await pg.set_content(ICON)
        await pg.evaluate("document.fonts.ready")
        await pg.screenshot(path=str(ROOT / "public" / "apple-touch-icon.png"))
        await b.close()

asyncio.run(main())
