# Mental Health Risk Indicators to Inform Suicide Prevention

## Background

Suicide remains a significant global public health concern. According to the [World Health Organization](https://www.who.int/news-room/fact-sheets/detail/suicide) (WHO), about 746,000 people die by suicide each year worldwide, with substantial variation across countries and over time. Beyond mortality, many more individuals experience suicidal ideation or attempts, underscoring the importance of prevention-focused research and policy responses.

Existing literature consistently identifies two broad domains associated with suicide mortality at the population level. The first concerns **structural and socio-economic conditions**, including income, education, employment, and social protection systems. The second focuses on **mental health–related factors**, such as the prevalence of mental disorders, access to care, and treatment availability (Li et al., 2011). Prior studies suggest that prevention strategies targeting either domain may yield comparable population-level effects.

Motivated by this evidence, this project examines how selected socio-economic and mental health indicators relate to suicide mortality rates across countries and over time. The analysis is conducted at an aggregated, population level and is intended to support prevention-oriented understanding and policy discussion. This work does **not** aim to predict individual suicide risk or support clinical decision-making.

<img src="Image/worldmentalhealthday_16x9.jpg" height="500" width="900" />

---

## Project Objectives

### Research Focus

This project addresses the following research question:

**Which population-level socio-economic and mental health indicators are most strongly associated with national suicide mortality rates across countries and years, and how can data-driven methods help identify patterns relevant to suicide prevention planning?**

---

## Indicators Examined

### Socio-Economic and Structural Indicators

The analysis includes national-level indicators (World Bank, 2000–2021), such as:

- Economic development (GDP, GDP per capita)
- Poverty and inequality measures
- Labor force participation and employment indicators
- Coverage of social insurance and social protection programs
- Education attainment
- Life expectancy and demographic structure
- Healthcare expenditure and access
- Population density and internet penetration

These indicators are sourced primarily from the World Bank World Development Indicators (WDI) database.

### Mental Health and Workplace Context Indicators

To complement macro-level indicators, the project incorporates aggregated insights from workplace mental health surveys, focusing on:

- Access to mental health services
- Insurance coverage and benefits
- Workplace openness and stigma
- Perceived consequences of disclosure
- Availability of wellness programs
- Organizational size and industry context

These data are used for descriptive and exploratory purposes and are interpreted in relation to broader national contexts.

---

## Methodology

This project integrates multiple analytical approaches:

- **Data cleaning and preprocessing**
- **Exploratory data analysis (EDA)**
- **Data visualization using Tableau**
- **Statistical analysis**
- **Machine learning models** to explore associations and relative explanatory strength

### Analytical Scope

- The analysis focuses on **population-level associations**, not causal inference.
- Models are used to explore patterns and relationships, not deterministic prediction.
- Results are interpreted with attention to contextual and data-quality limitations.

---

## Data Sources

### Data Source 1: World Development Indicators (World Bank)

The World Development Indicators dataset provides macro-level socio-economic and demographic indicators for approximately 246 countries across multiple income categories.

- Outcome variable: Suicide mortality rate (per 100,000 population)
- Explanatory variables: Selected socio-economic and structural indicators
- Country identifiers are included as key features

Selected indicators are documented in:  
`Data/raw_data/Data_Extract_From_World_Development_Indicators_metadata.csv`

### Data Source 2: OSMI Mental Health in Tech Survey

The OSMI Mental Health in Tech Survey provides aggregated survey data related to workplace mental health, access to care, and organizational culture. The dataset contains 27 variables and is used for descriptive and exploratory analysis.

<img src="Image/data_map.png" height="500" width="900" />

---

## System Architecture

<img src="Image/arctectured.png" height="500" width="900" />

---

## Deployment and Presentation

**Live site:** [ermiasgelaye.github.io/Mental-Health-Predictor](https://ermiasgelaye.github.io/Mental-Health-Predictor/) — free on GitHub Pages, no server or database, so it never sleeps or goes down.

The site uses the same design system as the [portfolio](https://ermiasgelaye.github.io/) (light/dark themes, mobile layout, project assistant with crisis-support safeguard).

| Path | What it is |
|---|---|
| `index.html` | Overview: background, real world map of suicide rates, survey explorer, findings, country indicators, model summary, corrections, methodology, references |
| `ml.html` | Machine-learning results with the notebook's figures and an honest evaluation |
| `eda.html` | The original Tableau Public dashboards (loaded on request) |
| `data.html` | Filterable/exportable survey and indicator tables, data quality & limitations |
| `api.html` | The API endpoints (`/mental_health`, `/indicator`) with live "Try it" |
| `assets/js/mental.js` | All statistics and charts, computed in the browser from `assets/data/mental.data.js` |
| `static/data/*.json` | The former `/mental_health` and `/indicator` API endpoints as static files |
| `tools/clean_data.py`, `tools/build_static.py` | Data corrections and data build |
| `tools/build_map.py` | Projects Natural Earth country shapes (`Data/geo/`, world-atlas) into `assets/data/worldmap.data.js` |
| `tools/sync_design.sh` | Re-copies the shared CSS/JS/chat from the portfolio repo |
| `app.py` | Optional: serves the site locally and keeps the old URLs working |

After editing `Data/survey.csv` or `Data/database/indicator.csv`: `python3 tools/clean_data.py && python3 tools/build_static.py`.

To publish: GitHub → *Settings → Pages* → Deploy from branch `master`, folder `/ (root)`.

### Data corrections (2026 audit)
- **Excel date corruption:** company sizes "1-5" and "6-25" were stored as "05-Jan" and "25-Jun" (452 rows) — fixed in `survey.csv`.
- **Impossible ages** (−1726, 5, 329, 99,999,999,999 …; 8 respondents) are treated as missing, and one duplicate response is dropped.
- **46 World Bank aggregates** ("World", "High income", "Euro area" …) were mixed in with 217 countries; they're flagged and excluded from country statistics.
- The original database table (`Data/database/indicator.csv`) keeps suicide rates only for **2015–2016**; the raw extract (`Data/Development_Indicators.csv`) adds 2000, 2005 and 2010. The re-analysis downloads the full **2000–2021** series (`tools/fetch_external.py`) and compares countries on their **2017–2019 average**.

### Key findings (2026 re-analysis, World Bank data 2000–2021)

| # | Finding | Evidence |
|---|---|---|
| 1 | **Suicide rates fell 27% across 185 countries from 2000 to 2021** — but rose in North America (+33%) and Latin America (+26%). | Population-weighted WHO/World Bank estimates ([`SH.STA.SUIC.P5`](https://data.worldbank.org/indicator/SH.STA.SUIC.P5)), 185 countries: 12.5 → 9.1 per 100k, matching the World Bank's own world aggregate; falling in 124 countries. Largest falls: Russia (−31.7), Lithuania (−28.3); largest rises: Lesotho, Eswatini, South Korea. |
| 2 | **Alcohol is the strongest country-level correlate that survives controlling for region.** | +1.9 deaths per 100k per SD of alcohol per capita (p < 0.001, 182 countries, 2017–19); stronger for men (r = 0.44) than women (0.29). Changes in drinking don't track changes in suicide (within-country p = 0.24). |
| 3 | **The income paradox:** richer countries record higher rates, yet getting richer lowers them. | Cross-country +1.2 per SD (region-adjusted, p = 0.03); within countries (two-way fixed effects, clustered SEs) a tenfold GDP rise ≈ −2.9 per 100k (95% CI −4.7 to −1.1, p = 0.002). |
| 4 | **Robust across samples:** where people with only basic education are more often working, rates are lower; primary-school completion and GDP go with higher recorded rates. | Significant after region control in both 2015–16 and 2017–19 samples. Social-insurance coverage and male labour participation are **not** robust (significance flips; coverage data for only 45–64 countries). |
| 5 | **World region explains 18% of differences** between countries. | One-way ANOVA (2017–19), p < 0.001; Europe & Central Asia 12.1 vs Middle East & North Africa 3.4 per 100k. |
| 6 | **Family history is the strongest predictor of having sought treatment** (OSMI survey). | Adjusted odds ratio 4.53 (95% CI 3.46–5.93), multivariable logistic regression, n = 1,258. |
| 7 | **Men have less than half the odds of women** of having sought treatment; workplace support matters, remote work doesn't. | aOR 0.45 (0.32–0.63); knows care options 2.24, benefits 1.73; remote 1.05, tech company 1.00 (n.s.). Nationally, men die by suicide ~3.3× as often as women. |
| 8 | **"Work interference" leaks the outcome** and **national rates can't be predicted well.** | AUC 0.77 without vs 0.90 with the leaky variable; cross-validated R² for national rates ≤ 0.17 (region alone 0.10). |

**Indicator definitions (corrected):** `Labour_force_with_basic_education` is *labour-force participation of people whose education stopped at basic level* (World Bank SL.TLF.BASC.ZS), not the workforce's education level; `Educational_attainment` is *adults 25+ who completed at least primary school* (SE.PRM.CUAT.ZS).

Reproduce: `python3 tools/fetch_external.py && python3 tools/clean_data.py && python3 tools/build_static.py && python3 tools/build_map.py && python3 tools/analyze.py`.

### Original model results
Only 58 countries had every indicator. Regression models failed on held-out countries (test R² −0.60 to 0.13). The best classifiers (linear SVM, tuned random forest) reached 72% test accuracy on 18 countries, against a 61% baseline of always predicting "low".

---

## Exploratory Data Analysis

Following data cleaning and integration, exploratory data analysis was conducted using Tableau. The dashboards visualize:

- Regional variation in suicide mortality rates
- Temporal trends
- Associations between suicide mortality and selected indicators

<img src="Image/dashboard1.png" />

---

## Machine Learning Analysis

Several machine learning models were applied to explore relationships between suicide mortality rates and contextual indicators, including:

- Linear Regression  
- Logistic Regression  
- Support Vector Machines  
- Decision Trees  
- Random Forests  

These models were used to compare relative performance and identify recurring patterns rather than to produce operational predictions.

---

## Data Preprocessing and Correlation Analysis

Prior to modeling, the data were cleaned, normalized, and examined for correlations.

<img src="/static/images/corrmatt.png" height="500" width="900" />

The correlation analysis identified:
- A positive association between suicide mortality rates and social insurance coverage
- A negative association between suicide mortality rates and the proportion of the population with basic education

<img src="/static/images/social_insurance.png" height="500" width="900" />
<img src="/static/images/Labour_force_with_basic_education.png" height="500" width="900" />

---

## Model Results

### Regression Models

Linear regression, decision tree regression, and support vector regression were applied to estimate suicide mortality rates. None generalised well to held-out countries: support vector regression scored highest (test R² 0.13), while decision tree regression scored lowest (−0.60) despite a perfect training fit — a sign of overfitting. *(An earlier version of this README stated the reverse.)*

Code is available at:  
https://github.com/ermiasgelaye/Mental-Health-Predictor/blob/master/machine_learning_analysis.ipynb

<img src="/static/images/Linear_re.png" height="500" width="900" />

### Classification Models

For comparative purposes, suicide mortality rates were categorized into above- and below-average groups. Classification models were evaluated to assess relative accuracy, with support vector machines demonstrating higher performance following parameter tuning (72% test accuracy on 18 countries, vs. a 61% baseline of always predicting "low").

<img src="/static/images/compare.png" height="500" width="900" />

---

## Conclusions

This project demonstrates that suicide mortality is associated with a complex interaction of socio-economic and mental health–related factors at the population level. No single indicator sufficiently explains observed patterns, reinforcing the need for multifaceted, prevention-focused approaches.

While data limitations and contextual variability constrain interpretation, population-level analysis can contribute to evidence-informed discussion and support public health planning. All findings should be interpreted as associative rather than causal.

---

## References

- Ferretti, F., & Coluccia, A. (2009). Socio-economic factors and suicide rates in European Union countries. *Legal Medicine, 11*.  
- Li, Z., Page, A., Martin, G., & Taylor, R. (2011). Attributable risk of psychiatric and socio-economic factors for suicide. *Social Science & Medicine, 72*(4), 608–616.  
- National Alliance on Mental Health. (2013). Mental Health Conditions.  
- Szanto, K. (2017). Cognitive deficits as contributors to suicide. *American Journal of Geriatric Psychiatry, 25*(6), 630–632.  
- World Bank. (2020). World Development Indicators.  
- World Health Organization. (2019). Suicide Fact Sheet.

- World Health Organization. (2020). Mental Health.  
- World Health Organization. (2017). Depression and other common mental disorders.

