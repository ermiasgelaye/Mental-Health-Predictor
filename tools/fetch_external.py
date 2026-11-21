#!/usr/bin/env python3
"""Download the World Bank data used by the country analysis (only needed to refresh; outputs are committed).

1. Country metadata (region, income group)  -> Data/external/wb_country_metadata.csv
2. World Development Indicators, 2000–2021  -> Data/external/wdi_2000_2021.csv  (code, indicator, country, year, value)
   2021 is the latest year with suicide-mortality estimates (WHO Global Health Estimates, published by the World Bank).

Source: World Bank API v2, https://api.worldbank.org/v2/
Run:    python3 tools/fetch_external.py
Uses Python's HTTPS client; if that can't verify certificates on your machine it falls back to curl
(which also verifies them). Certificate checking is never disabled.
"""
import csv
import json
import pathlib
import subprocess
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXT = ROOT / "Data" / "external"
API = "https://api.worldbank.org/v2"
YEARS = (2000, 2021)
INDICATORS = {  # World Bank code -> column name used by the site
    "SH.STA.SUIC.P5": "suicide_total", "SH.STA.SUIC.MA.P5": "suicide_male", "SH.STA.SUIC.FE.P5": "suicide_female",
    "NY.GDP.PCAP.CD": "gdp_per_capita", "SP.DYN.LE00.IN": "life_expectancy",
    "SH.ALC.PCAP.LI": "alcohol_per_capita", "SH.XPD.GHED.PC.CD": "gov_health_spending_per_capita",
    "SL.TLF.BASC.ZS": "lfp_basic_education", "SE.PRM.CUAT.ZS": "completed_primary_25plus",
    "SL.TLF.CACT.MA.NE.ZS": "lfp_male", "SL.EMP.TOTL.SP.FE.NE.ZS": "employment_female",
    "SL.UEM.BASC.ZS": "unemployment_basic_education", "per_si_allsi.cov_pop_tot": "social_insurance_coverage",
    "SP.POP.TOTL": "population",
}


def get_json(url):
    try:
        with urllib.request.urlopen(url, timeout=90) as res:
            return json.load(res)
    except OSError:  # e.g. certificate store unavailable to Python
        out = subprocess.run(["curl", "-sfL", "--max-time", "120", url], check=True, capture_output=True)
        return json.loads(out.stdout)


def main():
    EXT.mkdir(parents=True, exist_ok=True)
    meta = get_json(f"{API}/country?format=json&per_page=400")[1]
    countries = sorted((c["id"], c["name"], c["region"]["value"].strip(), c["incomeLevel"]["value"].strip())
                       for c in meta if c["region"]["value"].strip() != "Aggregates")
    with (EXT / "wb_country_metadata.csv").open("w", newline="") as f:
        w = csv.writer(f); w.writerow(["code", "name", "region", "income_group"]); w.writerows(countries)
    keep = {c[0] for c in countries}
    rows = []
    for code, name in INDICATORS.items():
        data = get_json(f"{API}/country/all/indicator/{code}?format=json&per_page=20000&date={YEARS[0]}:{YEARS[1]}")
        n = 0
        for r in (data[1] if len(data) > 1 and data[1] else []):
            if r["countryiso3code"] in keep and r["value"] is not None:
                rows.append((code, name, r["countryiso3code"], int(r["date"]), r["value"])); n += 1
        print(f"  {code:28s} {name:32s} {n:5d} values")
    rows.sort()
    with (EXT / "wdi_2000_2021.csv").open("w", newline="") as f:
        w = csv.writer(f); w.writerow(["code", "indicator", "country", "year", "value"]); w.writerows(rows)
    print(f"Data/external/wb_country_metadata.csv  {len(countries)} countries")
    print(f"Data/external/wdi_2000_2021.csv        {len(rows)} values")


if __name__ == "__main__":
    main()
