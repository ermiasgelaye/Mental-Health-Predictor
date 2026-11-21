#!/usr/bin/env python3
"""Fix Excel date corruption in Data/survey.csv (safe to re-run).

The OSMI survey's company-size answers "1-5" and "6-25" were turned into dates by Excel and saved
as "05-Jan" and "25-Jun" (452 rows). This restores the original answers in place, byte-for-byte
otherwise. Other cleaning (impossible ages, one duplicate row, World Bank regional aggregates) is
applied when building the site data — see tools/build_static.py — so the raw file stays intact.

Run:  python3 tools/clean_data.py && python3 tools/build_static.py
"""
import pathlib

SURVEY = pathlib.Path(__file__).resolve().parent.parent / "Data" / "survey.csv"
FIXES = [(b",05-Jan,", b",1-5,"), (b",25-Jun,", b",6-25,")]

data = SURVEY.read_bytes()
for wrong, right in FIXES:
    n = data.count(wrong)
    if n:
        data = data.replace(wrong, right)
        print(f"survey.csv: {wrong.decode().strip(',')} -> {right.decode().strip(',')} ({n} rows)")
SURVEY.write_bytes(data)
