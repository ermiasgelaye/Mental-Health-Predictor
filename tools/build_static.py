#!/usr/bin/env python3
"""Export the two data endpoints as static JSON files, so the site needs no database or server.

/mental_health and /indicator used to be read from a database on every request. The data never
changes, so this script writes them once from the same CSVs the database was loaded from
(Data/database/loadData.ipynb) into static/data/*.json, in the same record format the API returned.

Run it after editing Data/survey.csv or Data/database/indicator.csv:
    python3 tools/build_static.py
"""
import json
import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "data"
SOURCES = {
    "mental_health": ROOT / "Data" / "survey.csv",
    "indicator": ROOT / "Data" / "database" / "indicator.csv",
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        df = pd.read_csv(src, encoding="utf-8-sig")
        # to_json turns NaN into null (valid JSON), unlike json.dumps.
        records = json.loads(df.to_json(orient="records"))
        path = OUT / f"{name}.json"
        path.write_text(json.dumps(records, separators=(",", ":"), ensure_ascii=False))
        print(f"{path.relative_to(ROOT)}  {len(records)} records  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
