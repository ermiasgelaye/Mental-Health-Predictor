"""Optional local/legacy server for Mind Your Health.

The site is fully static: index.html, eda.html, ml.html and data.html sit at the repo root and the
data endpoints are pre-built JSON files in static/data/ (see tools/build_static.py). GitHub Pages
hosts it with no server at all. This tiny Flask app only exists so the old URLs (/eda, /ml, /data,
/mental_health, /indicator) keep working if you run it locally or on another host. No database.

    python3 app.py        # then open http://localhost:5000
"""
import os
import pathlib

from flask import Flask, send_from_directory

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / "static" / "data"

app = Flask(__name__, static_folder="static")

PAGES = {"/": "index.html", "/eda": "eda.html", "/ml": "ml.html", "/data": "data.html"}
for url, page in PAGES.items():
    app.add_url_rule(url, page, (lambda p=page: send_from_directory(ROOT, p)))


@app.route("/<page>.html")
def html_page(page):
    return send_from_directory(ROOT, f"{page}.html")


@app.route("/mental_health")
def mental_health():
    return send_from_directory(DATA, "mental_health.json", mimetype="application/json")


@app.route("/indicator")
def indicator():
    return send_from_directory(DATA, "indicator.json", mimetype="application/json")


@app.route("/health")
def health_check():
    return {"status": "healthy", "mode": "static"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
