"""Optional local/legacy server for Mental Health Risk Indicators.

The site is fully static (index.html, ml.html, eda.html, data.html, assets/, static/) and is hosted
on GitHub Pages with no server. This tiny Flask app only exists so you can run it locally and so the
old Flask URLs (/eda, /ml, /data, /mental_health, /indicator) keep working on any other host.
No database.

    python3 app.py        # then open http://localhost:5000
"""
import os
import pathlib

from flask import Flask, abort, send_from_directory

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / "static" / "data"
WEB_TYPES = {".html", ".js", ".css", ".json", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"}
PAGES = {"": "index.html", "eda": "eda.html", "ml": "ml.html", "data": "data.html"}
API = {"mental_health": "mental_health.json", "indicator": "indicator.json"}

app = Flask(__name__, static_folder=None)


@app.route("/")
@app.route("/<path:path>")
def files(path=""):
    if path in PAGES:
        return send_from_directory(ROOT, PAGES[path])
    if path in API:
        return send_from_directory(DATA, API[path], mimetype="application/json")
    if path == "health":
        return {"status": "healthy", "mode": "static"}
    target = (ROOT / path).resolve()
    if ROOT in target.parents and target.is_file() and target.suffix.lower() in WEB_TYPES:
        return send_from_directory(ROOT, path)
    abort(404)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
