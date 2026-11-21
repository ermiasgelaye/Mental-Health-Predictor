#!/usr/bin/env python3
"""Build the site's data files, so the site needs no database or server.

Writes
  static/data/mental_health.json  — the OSMI survey (the former /mental_health API endpoint)
  static/data/indicator.json      — World Bank indicators (the former /indicator endpoint)
  static/data/indicators_2000_2021.json — World Bank indicators 2000–2021 (from tools/fetch_external.py)
  assets/data/mental.data.js      — a compact, pre-shaped copy the web pages load (works from disk too)

Cleaning applied here (the raw CSVs are left untouched):
  * Ages outside 15–100 (e.g. -1726, 5, 329, 99999999999) are set to null — 8 respondents.
  * One exact duplicate survey response is dropped.
  * World Bank regional/income aggregates ("World", "High income", "Euro area", ...) are flagged with
    "type": "aggregate" and kept out of country-level statistics, which they would double-count.
Run tools/clean_data.py first (it fixes Excel-corrupted company sizes in survey.csv).

    python3 tools/build_static.py
"""
import json
import pathlib

import numpy as np
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "data"

# World Bank aggregate codes (regions, income groups, lending groups, demographic groups).
AGGREGATES = set("""ARB CSS CEB EAR EAS EAP TEA EMU ECS ECA TEC EUU FCS HPC HIC IBD IBT IDB IDX IDA LTE LCN LAC TLA
LDC LMY LIC LMC MEA MNA TMN MIC NAC INX OED OSS PSS PST PRE SST SAS TSA SSF SSA TSS UMC WLD AFE AFW""".split())

SURVEY_FIELDS = ["Gender", "Country", "self_employed", "family_history", "treatment", "work_interfere", "no_employees",
                 "remote_work", "tech_company", "benefits", "care_options", "wellness_program", "seek_help", "anonymity",
                 "leave", "mental_health_consequence", "phys_health_consequence", "coworkers", "supervisor",
                 "mental_vs_physical", "obs_consequence"]
# World Bank 2000–2021 refresh (Data/external/wdi_2000_2021.csv): fetch name -> column name used by the site.
WDI = {"suicide_total": "Suicide_mortality_rate_per_100k", "suicide_male": "Suicide_mortality_rate_per_100k_male",
       "suicide_female": "Suicide_mortality_rate_per_100k_female", "gdp_per_capita": "GDP_per_capita",
       "life_expectancy": "Life_expectancy_total", "alcohol_per_capita": "alcohol_per_capita",
       "gov_health_spending_per_capita": "gov_health_spending_per_capita", "lfp_basic_education": "Labour_force_with_basic_education",
       "completed_primary_25plus": "Educational_attainment", "lfp_male": "Labor_force_rate_male", "employment_female": "Female_employment",
       "unemployment_basic_education": "unemployment_with_basic_education_total", "social_insurance_coverage": "social_insurance"}
WINDOW = (2017, 2019)  # latest three pre-COVID years: cross-sectional averages

INDICATORS_ORIGINAL = ["Suicide_mortality_rate_per_100k", "Suicide_mortality_rate_per_100k_female", "Suicide_mortality_rate_per_100k_male",
              "GDP_per_capita", "Life_expectancy_total", "life_expectancy_female", "social_insurance", "social_protection",
              "unemployment_benefits", "Educational_attainment", "Female_employment", "Male_employment",
              "Labor_force_rate_female", "Labor_force_rate_male", "Labor_force_total", "Labour_force_with_basic_education",
              "Labour_force_with_basic_education_female", "unemployment_with_basic_education_total",
              "Unemployment_with_basic_education_female", "Unemployment_with_basic_education_male", "Total_population"]


def records(df):
    return json.loads(df.to_json(orient="records"))  # NaN -> null


def load_survey():
    s = pd.read_csv(ROOT / "Data" / "survey.csv", encoding="utf-8-sig")
    s.loc[(s["Age"] < 15) | (s["Age"] > 100), "Age"] = np.nan
    return s.drop_duplicates().reset_index(drop=True)


def load_indicators():
    d = pd.read_csv(ROOT / "Data" / "database" / "indicator.csv", encoding="utf-8-sig")
    d.insert(2, "type", np.where(d["country_code"].isin(AGGREGATES), "aggregate", "country"))
    return d


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    print(f"{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")


def main():
    survey, ind = load_survey(), load_indicators()
    write(OUT / "mental_health.json", json.dumps(records(survey), separators=(",", ":"), ensure_ascii=False))
    write(OUT / "indicator.json", json.dumps(records(ind), separators=(",", ":"), ensure_ascii=False))

    # Compact survey: categorical answers coded as indexes into a per-field list of categories.
    cats, cols = {}, {}
    for f in SURVEY_FIELDS:
        v = survey[f].fillna("No answer").astype(str)
        cats[f] = sorted(v.unique().tolist())
        lookup = {c: i for i, c in enumerate(cats[f])}
        cols[f] = [lookup[x] for x in v]
    ages = [None if pd.isna(a) else int(a) for a in survey["Age"]]

    # Countries: World Bank 2000–2021. Cross-section = 2017–2019 average; plus each country's suicide series.
    w = pd.read_csv(ROOT / "Data" / "external" / "wdi_2000_2021.csv")
    meta = pd.read_csv(ROOT / "Data" / "external" / "wb_country_metadata.csv").set_index("code")
    wide = w.pivot_table(index=["country", "year"], columns="indicator", values="value").reset_index()
    write(OUT / "indicators_2000_2021.json", json.dumps(records(wide.rename(columns=WDI).join(meta[["name", "region", "income_group"]], on="country")),
                                                         separators=(",", ":"), ensure_ascii=False))
    win = wide[wide.year.between(*WINDOW)].groupby("country").mean(numeric_only=True)
    keys = list(WDI.values())
    years = list(range(2000, 2022))
    series = wide.pivot_table(index="country", columns="year", values="suicide_total")
    countries = []
    for code, r in win.iterrows():
        if code not in meta.index:
            continue
        s = series.loc[code] if code in series.index else None
        countries.append({"name": meta.at[code, "name"], "code": code, "region": meta.at[code, "region"], "income": meta.at[code, "income_group"],
                          "v": [None if pd.isna(r.get(k)) else round(float(r[k]), 3) for k in WDI],
                          "s": None if s is None else [None if pd.isna(s.get(y)) else round(float(s[y]), 2) for y in years]})

    payload = {
        "survey": {"n": len(survey), "fields": SURVEY_FIELDS, "categories": cats, "columns": cols, "age": ages,
                   "dates": [str(survey["Timestamp"].min())[:10], str(survey["Timestamp"].max())[:10]]},
        "indicators": {"keys": keys, "window": f"{WINDOW[0]}–{WINDOW[1]} average", "years": years, "countries": countries},
    }
    write(ROOT / "assets" / "data" / "mental.data.js",
          "/* Generated by tools/build_static.py — do not edit by hand. */\n"
          f"window.MENTAL_DATA = {json.dumps(payload, separators=(',', ':'), ensure_ascii=False)};\n")


if __name__ == "__main__":
    main()
