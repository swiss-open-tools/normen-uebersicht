"""Screenshots (Desktop + Handy) und Browser-Smoke-Test des statischen Builds.

Aufruf:  npm run build && python3 scripts/screenshot.py
Startet selbst einen statischen Server auf dist/ (python http.server) und prüft zusätzlich file://.
Benötigt: pip install playwright && playwright install chromium
"""
import functools
import http.server
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = ROOT / "docs"
OUT.mkdir(exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

Handler = functools.partial(Quiet, directory=str(DIST))
httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{httpd.server_address[1]}/"

fails = []
def check(cond, msg):
    print(("✓ " if cond else "✗ ") + msg)
    if not cond:
        fails.append(msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    errors = []

    # Desktop: Suche nach Entwässerung, Kanton-TG-Filter sichtbar
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.goto(URL)
    pg.wait_for_selector(".item")
    total = pg.locator(".item").count()
    check(total >= 40, f"Liste geladen ({total} Einträge)")
    pg.fill("#q", "schacht")
    pg.wait_for_timeout(300)
    n = pg.locator(".item").count()
    check(0 < n < total, f"Volltextsuche «schacht» → {n} Treffer")
    pg.fill("#q", "")
    pg.select_option("#fThema", "Entwässerung")
    pg.wait_for_timeout(200)
    pg.locator(".star").first.click()
    pg.locator(".star").nth(2).click()
    check(pg.inner_text("#merkCount") == "2", "Merkliste zählt 2")
    pg.evaluate("scrollTo(0,0)")
    pg.screenshot(path=str(OUT / "screenshot-desktop.png"))
    pg.reload()
    pg.wait_for_selector(".item")
    check(pg.inner_text("#merkCount") == "2", "Merkliste bleibt nach Reload erhalten (localStorage)")
    check("thema=" in pg.url, "Filter im URL-Hash (teilbar)")
    sw = pg.evaluate("navigator.serviceWorker.ready.then(r => !!r.active)")
    check(sw, "Service Worker aktiv (offline-fähig)")
    pg.context.set_offline(True)
    pg.reload()
    pg.wait_for_selector(".item")
    check(pg.locator(".item").count() > 0, "Offline-Reload zeigt Daten aus dem Cache")
    pg.context.set_offline(False)

    # Handy: Kanton Thurgau
    m = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.on("pageerror", lambda e: errors.append(str(e)))
    m.goto(URL + "#ebene=kanton%3ATG&q=grabenprofil")
    m.wait_for_selector(".item")
    check(m.locator(".item").count() >= 4, "Handy: Hash-Filter Kanton TG + «grabenprofil»")
    overflow = m.evaluate("document.documentElement.scrollWidth > window.innerWidth")
    check(not overflow, "Handy: kein horizontales Scrollen")
    m.screenshot(path=str(OUT / "screenshot-mobile.png"))

    # file:// (Doppelklick auf dist/index.html)
    f = b.new_page()
    f.on("pageerror", lambda e: errors.append("file:// " + str(e)))
    f.goto((DIST / "index.html").as_uri())
    f.wait_for_selector(".item", timeout=5000)
    check(f.locator(".item").count() == total, "file:// funktioniert ohne Server")

    check(not errors, f"Keine JS-Fehler ({errors or 'keine'})")
    b.close()

httpd.shutdown()
print("Screenshots: docs/screenshot-desktop.png, docs/screenshot-mobile.png")
sys.exit(1 if fails else 0)
