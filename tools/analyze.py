#!/usr/bin/env python3
"""Statistical analysis behind the site: assets/data/analysis.data.js.

Survey (OSMI, 1,258 tech workers) — who has sought mental-health treatment?
  * Unadjusted odds ratios with 95% CIs (Woolf) and chi-square p-values for each workplace factor.
  * Multivariable logistic regression (adjusted odds ratios, Wald 95% CIs) on factors measured for everyone.
    "Work interference" is excluded: people without a condition answer it "NA", so it leaks the outcome.
    5-fold cross-validated AUC is reported with and without it to show the leakage.
Countries (World Bank 2000–2021; cross-section = 2017–2019 average) — what goes with higher suicide rates?
  * Population-weighted trends 2000–2021, globally, by sex and by region.
  * Share of variance explained by world region (eta squared, one-way ANOVA).
  * Each indicator's standardised association with the suicide rate, raw and adjusted for region.
  * Within-country change: two-way fixed-effects regressions (country and year), standard errors clustered by
    country — do countries' suicide rates move with their own income, alcohol use and health spending?
  * Robustness: each association re-estimated on the original 2015–2016 extract.
  * Re-analysis of prediction: repeated 5-fold cross-validated R² on all countries (median imputation),
    replacing the original single 58-country train/test split.

Run after tools/build_static.py:   python3 tools/analyze.py
"""
import json
import pathlib
import warnings

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, RidgeCV
from sklearn.model_selection import RepeatedKFold, StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = "Suicide_mortality_rate_per_100k"
CONTRASTS = [  # (field, level, reference, label)
    ("family_history", "Yes", "No", "Family history of mental illness"),
    ("Gender", "Female", "Male", "Women (vs men)"),
    ("care_options", "Yes", "No", "Knows the care options available"),
    ("benefits", "Yes", "Don't know", "Has mental-health benefits (vs doesn't know)"),
    ("obs_consequence", "Yes", "No", "Seen colleagues suffer for disclosing"),
    ("mental_health_consequence", "Yes", "No", "Expects consequences for disclosing"),
    ("anonymity", "Yes", "Don't know", "Anonymity is protected (vs doesn't know)"),
    ("wellness_program", "Yes", "No", "Employer runs a wellness programme"),
    ("seek_help", "Yes", "No", "Employer provides help resources"),
    ("remote_work", "Yes", "No", "Works remotely ≥ 50% of the time"),
    ("self_employed", "Yes", "No", "Self-employed"),
    ("tech_company", "Yes", "No", "Works at a tech company"),
]
MODEL_FIELDS = ["family_history", "Gender", "care_options", "benefits", "obs_consequence", "leave", "no_employees",
                "remote_work", "tech_company", "wellness_program", "anonymity", "seek_help"]
INDICATORS = {  # site column -> label (World Bank codes in tools/fetch_external.py)
    "GDP_per_capita": "GDP per capita (log)", "Life_expectancy_total": "Life expectancy",
    "alcohol_per_capita": "Alcohol consumption per capita", "gov_health_spending_per_capita": "Government health spending per capita (log)",
    "Labour_force_with_basic_education": "Labour-force participation, people with basic education",
    "Educational_attainment": "Completed at least primary school (25+)", "Labor_force_rate_male": "Male labour-force participation",
    "Female_employment": "Female employment", "unemployment_with_basic_education_total": "Unemployment (basic education)",
    "social_insurance": "Social insurance coverage",
}
LOG = {"GDP_per_capita", "gov_health_spending_per_capita"}
WDI = {"suicide_total": SR, "suicide_male": "Suicide_mortality_rate_per_100k_male", "suicide_female": "Suicide_mortality_rate_per_100k_female",
       "gdp_per_capita": "GDP_per_capita", "life_expectancy": "Life_expectancy_total", "alcohol_per_capita": "alcohol_per_capita",
       "gov_health_spending_per_capita": "gov_health_spending_per_capita", "lfp_basic_education": "Labour_force_with_basic_education",
       "completed_primary_25plus": "Educational_attainment", "lfp_male": "Labor_force_rate_male", "employment_female": "Female_employment",
       "unemployment_basic_education": "unemployment_with_basic_education_total", "social_insurance_coverage": "social_insurance", "population": "population"}


def woolf(a, b, c, d):
    o = (a * d) / (b * c)
    se = np.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
    return o, np.exp(np.log(o) - 1.96 * se), np.exp(np.log(o) + 1.96 * se)


def survey_analysis():
    s = pd.read_csv(ROOT / "Data/survey.csv", encoding="utf-8-sig")
    s.loc[(s.Age < 15) | (s.Age > 100), "Age"] = np.nan
    s = s.drop_duplicates().reset_index(drop=True)
    y = (s.treatment == "Yes").astype(int)
    uni = []
    for f, lv, ref, lab in CONTRASTS:
        t = pd.crosstab(s[f], y)
        o, lo, hi = woolf(t.loc[lv, 1], t.loc[lv, 0], t.loc[ref, 1], t.loc[ref, 0])
        p = stats.chi2_contingency(pd.crosstab(s[f].fillna("No answer"), y))[1]
        uni.append({"field": f, "label": lab, "level": lv, "ref": ref, "or": round(o, 3), "lo": round(lo, 3), "hi": round(hi, 3), "p": float(p),
                    "rateLevel": round(float(y[s[f] == lv].mean()), 3), "rateRef": round(float(y[s[f] == ref].mean()), 3),
                    "nLevel": int((s[f] == lv).sum()), "nRef": int((s[f] == ref).sum())})

    X = pd.get_dummies(s[MODEL_FIELDS].fillna("No answer"), drop_first=True).astype(float)
    X["age_per_10y"] = s.Age.fillna(s.Age.median()) / 10
    X = X.loc[:, X.std() > 0]
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    auc = lambda XX: float(cross_val_score(LogisticRegression(max_iter=3000), XX, y, cv=cv, scoring="roc_auc").mean())
    leak = pd.concat([X, pd.get_dummies(s.work_interfere.fillna("No answer"), prefix="work_interfere", drop_first=True).astype(float)], axis=1)
    m = LogisticRegression(penalty=None, max_iter=5000).fit(X, y)
    Xd = np.column_stack([np.ones(len(X)), X.values])
    pr = m.predict_proba(X)[:, 1]
    cov = np.linalg.inv(Xd.T @ (Xd * (pr * (1 - pr))[:, None]))
    se = np.sqrt(np.diag(cov))[1:]
    b = m.coef_[0]
    adj = [{"term": c, "aor": round(float(np.exp(bi)), 3), "lo": round(float(np.exp(bi - 1.96 * si)), 3), "hi": round(float(np.exp(bi + 1.96 * si)), 3),
            "p": float(2 * stats.norm.sf(abs(bi / si)))} for c, bi, si in zip(X.columns, b, se)]
    return {"n": int(len(s)), "treated": round(float(y.mean()), 3), "univariate": uni, "adjusted": adj,
            "aucClean": round(auc(X), 3), "aucLeaky": round(auc(leak), 3)}


def ols(y, X, cluster=None):
    """OLS coefficients and standard errors (classical, or clustered by group)."""
    X = np.column_stack([np.ones(len(y)), X])
    XtX_inv = np.linalg.pinv(X.T @ X)
    beta = XtX_inv @ X.T @ y
    e = y - X @ beta
    if cluster is None:
        V = (e @ e / (len(y) - X.shape[1])) * XtX_inv
    else:
        meat = sum(np.outer(X[g].T @ e[g], X[g].T @ e[g]) for g in pd.Series(range(len(y))).groupby(np.asarray(cluster)).indices.values())
        G = len(set(cluster)); n, k = X.shape
        V = (G / (G - 1)) * ((n - 1) / (n - k)) * XtX_inv @ meat @ XtX_inv
    return beta, np.sqrt(np.diag(V))


def country_analysis():
    meta = pd.read_csv(ROOT / "Data/external/wb_country_metadata.csv").set_index("code")
    w = pd.read_csv(ROOT / "Data/external/wdi_2000_2021.csv")
    P = w.pivot_table(index=["country", "year"], columns="indicator", values="value").reset_index().rename(columns=WDI)
    P = P[P.country.isin(meta.index)].join(meta[["region", "income_group", "name"]], on="country")
    for c in LOG:
        P[c] = np.log10(P[c])

    # ---- Trends 2000–2021 (population-weighted) ----
    s = P.dropna(subset=[SR, "population"])
    wavg = lambda d, col: float(np.average(d[col], weights=d.population))
    years = sorted(s.year.unique())
    trend = {"years": [int(y) for y in years],
             "global": [round(wavg(s[s.year == y], SR), 2) for y in years],
             "male": [round(wavg(s[s.year == y].dropna(subset=["Suicide_mortality_rate_per_100k_male"]), "Suicide_mortality_rate_per_100k_male"), 2) for y in years],
             "female": [round(wavg(s[s.year == y].dropna(subset=["Suicide_mortality_rate_per_100k_female"]), "Suicide_mortality_rate_per_100k_female"), 2) for y in years],
             "regions": {r: [round(wavg(g[g.year == y], SR), 2) for y in years] for r, g in s.groupby("region")}}
    wide = s.pivot(index="country", columns="year", values=SR)
    ch = (wide[2021] - wide[2000]).dropna()
    movers = {"falls": [[meta.at[c, "name"], round(float(v), 1)] for c, v in ch.nsmallest(6).items()],
              "rises": [[meta.at[c, "name"], round(float(v), 1)] for c, v in ch.nlargest(6).items()],
              "nFalling": int((ch < 0).sum()), "n": int(len(ch))}

    # ---- Cross-section: 2017–2019 average ----
    x = P[P.year.between(2017, 2019)].groupby("country").mean(numeric_only=True).join(meta)
    x = x[x[SR].notna()].copy()
    groups = [g[SR].values for _, g in x.groupby("region")]
    eta2 = sum(len(g) * (g.mean() - x[SR].mean()) ** 2 for g in groups) / ((x[SR] - x[SR].mean()) ** 2).sum()
    region = []
    for r, g in x.groupby("region"):
        ratio = (g.Suicide_mortality_rate_per_100k_male / g.Suicide_mortality_rate_per_100k_female).replace(np.inf, np.nan)
        region.append({"region": r, "n": int(len(g)), "mean": round(float(g[SR].mean()), 2), "median": round(float(g[SR].median()), 2),
                       "sexRatio": round(float(ratio.median()), 2), "topName": str(g.loc[g[SR].idxmax(), "name"])})
    income = [{"income": i, "n": int(len(g)), "mean": round(float(g[SR].mean()), 2)} for i, g in x.groupby("income_group")]
    R = pd.get_dummies(x.region, drop_first=True).astype(float)

    # robustness sample: the original 2015–2016 extract
    old = pd.read_csv(ROOT / "Data/database/indicator.csv", encoding="utf-8-sig")
    old = old[old.Year.isin([2015, 2016])].groupby("country_code").mean(numeric_only=True).join(meta, how="inner")
    old = old[old[SR].notna()].copy()
    old["GDP_per_capita"] = np.log10(old["GDP_per_capita"])
    Rold = pd.get_dummies(old.region, drop_first=True).astype(float)

    def assoc_for(df, Rm, col):
        if col not in df:
            return None
        sub = df[[col, SR]].dropna()
        if len(sub) < 20:
            return None
        z = ((sub[col] - sub[col].mean()) / sub[col].std()).values
        out = {"n": int(len(sub))}
        for key, X in (("raw", z[:, None]), ("adj", np.column_stack([z, Rm.loc[sub.index].values]))):
            keep = np.r_[True, X[:, 1:].std(0) > 0] if X.shape[1] > 1 else np.array([True])
            b, se = ols(sub[SR].values, X[:, keep])
            dfree = len(sub) - X[:, keep].shape[1] - 1
            out[key] = round(float(b[1]), 3); out[key + "P"] = float(2 * stats.t.sf(abs(b[1] / se[1]), dfree))
        return out

    assoc = []
    for col, lab in INDICATORS.items():
        a = assoc_for(x, R, col)
        if a:
            o = assoc_for(old, Rold, col)
            assoc.append({"key": col, "label": lab, **a, "old": o})
    sexAlc = {k: round(float(stats.pearsonr(*x[["alcohol_per_capita", k]].dropna().values.T)[0]), 3)
              for k in ("Suicide_mortality_rate_per_100k_male", "Suicide_mortality_rate_per_100k_female")}

    # ---- Within-country change (two-way fixed effects, errors clustered by country) ----
    within = []
    for col, lab in [("GDP_per_capita", "GDP per capita (log10)"), ("alcohol_per_capita", "Alcohol per capita (litres)"),
                     ("gov_health_spending_per_capita", "Government health spending (log10)"), ("Life_expectancy_total", "Life expectancy (years)")]:
        d = P.dropna(subset=[SR, col])[["country", "year", SR, col]].copy()
        for v in (SR, col):
            d[v + "_w"] = d[v] - d.groupby("country")[v].transform("mean") - d.groupby("year")[v].transform("mean") + d[v].mean()
        b, se = ols(d[SR + "_w"].values, d[[col + "_w"]].values, cluster=d.country.values)
        G = d.country.nunique()
        within.append({"key": col, "label": lab, "b": round(float(b[1]), 3), "lo": round(float(b[1] - 1.96 * se[1]), 3), "hi": round(float(b[1] + 1.96 * se[1]), 3),
                       "p": float(2 * stats.t.sf(abs(b[1] / se[1]), G - 1)), "n": int(len(d)), "countries": int(G)})

    # ---- Prediction: repeated 5-fold CV on the 2017–2019 cross-section ----
    feats = ["GDP_per_capita", "Life_expectancy_total", "alcohol_per_capita", "gov_health_spending_per_capita", "Labour_force_with_basic_education",
             "Educational_attainment", "Labor_force_rate_male", "Female_employment"]
    cv = RepeatedKFold(n_splits=5, n_repeats=10, random_state=0)
    ridge = lambda: RidgeCV(alphas=np.logspace(-2, 3, 20))
    pipe = lambda est: make_pipeline(SimpleImputer(strategy="median", add_indicator=True), StandardScaler(), est)
    models = []
    for name, est, XX in [("Region only (ridge)", ridge(), R), ("Indicators (ridge)", pipe(ridge()), x[feats]),
                          ("Indicators + region (ridge)", pipe(ridge()), pd.concat([x[feats], R], axis=1)),
                          ("Indicators + region (random forest)", pipe(RandomForestRegressor(300, min_samples_leaf=3, random_state=0)), pd.concat([x[feats], R], axis=1))]:
        sc = cross_val_score(est, XX, x[SR], cv=cv, scoring="r2")
        models.append({"model": name, "r2": round(float(sc.mean()), 3), "sd": round(float(sc.std()), 3)})

    return {"window": "2017–2019", "n": int(len(x)), "eta2": round(float(eta2), 3), "anovaP": float(stats.f_oneway(*groups).pvalue),
            "regions": sorted(region, key=lambda r: -r["mean"]), "income": sorted(income, key=lambda r: -r["mean"]), "assoc": assoc,
            "sexAlcohol": sexAlc, "within": within, "models": models, "trend": trend, "movers": movers,
            "regionOf": {c: r for c, r in meta.region.items()}}


def main():
    out = {"survey": survey_analysis(), "countries": country_analysis()}
    path = ROOT / "assets/data/analysis.data.js"
    path.write_text("/* Generated by tools/analyze.py — do not edit by hand. */\n"
                    f"window.MENTAL_ANALYSIS = {json.dumps(out, separators=(',', ':'), ensure_ascii=False)};\n")
    s, c = out["survey"], out["countries"]
    print(f"{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")
    print(f"  survey n={s['n']} AUC clean={s['aucClean']} leaky={s['aucLeaky']}")
    for a in sorted(s["adjusted"], key=lambda a: a["p"])[:8]:
        print(f"  aOR {a['term']:30s} {a['aor']:.2f} [{a['lo']:.2f},{a['hi']:.2f}] p={a['p']:.3g}")
    print(f"  countries n={c['n']} region eta2={c['eta2']} p={c['anovaP']:.2g}")
    for a in c["assoc"]:
        o = a["old"]
        print(f"  {a['label']:55s} n={a['n']:3d} raw {a['raw']:+.2f} (p={a['rawP']:.3f}) adj {a['adj']:+.2f} (p={a['adjP']:.3f})" + (f" | 2015-16 adj {o['adj']:+.2f} (p={o['adjP']:.3f}, n={o['n']})" if o else ""))
    for wv in c["within"]:
        print(f"  within {wv['label']:38s} b={wv['b']:+.2f} [{wv['lo']:+.2f},{wv['hi']:+.2f}] p={wv['p']:.4f} ({wv['countries']} countries)")
    print("  global", c["trend"]["global"][0], "->", c["trend"]["global"][-1], "falling", c["movers"]["nFalling"], "/", c["movers"]["n"], "sex/alcohol", c["sexAlcohol"])
    for m in c["models"]:
        print(f"  {m['model']:38s} CV R² {m['r2']:.3f} ± {m['sd']:.3f}")


if __name__ == "__main__":
    main()
