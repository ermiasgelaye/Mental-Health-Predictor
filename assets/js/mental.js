/* Mental Health Risk Indicators — statistics and interactive charts computed from assets/data/mental.data.js.
 *
 * Two datasets:
 *   • OSMI Mental Health in Tech survey (2014–2016): 1,258 tech workers — who reports having sought treatment.
 *   • World Bank indicators 2000–2021: national suicide mortality (cross-section = 2017–2019 average) and indicators,
 *     countries only (regional and income-group aggregates are excluded).
 * Every number on the pages and in the assistant's data answers is calculated here. */
'use strict';

const Mental = (() => {
    const esc = (s) => ARC.util.escapeHtml(s);
    const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
    const pctf = (v) => `${Math.round(v * 100)}%`;

    /* ---------- Statistics (same routines as the portfolio's weather project) ---------- */
    function betacf(a, b, x) {
        const FPMIN = 1e-300; let c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
        for (let m = 1; m <= 300; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((a - 1 + m2) * (a + m2));
            d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
            aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + 1 + m2));
            d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
            const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
        }
        return h;
    }
    const lgamma = (z) => {
        const g = 7, cf = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
        z -= 1; let x = cf[0]; for (let i = 1; i < g + 2; i++) x += cf[i] / (z + i);
        const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    };
    function betai(a, b, x) {
        if (x <= 0) return 0; if (x >= 1) return 1;
        const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
        return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
    }
    function regress(xs, ys) {
        const n = xs.length, mx = mean(xs), my = mean(ys);
        let sxx = 0, syy = 0, sxy = 0;
        for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
        const r = sxy / Math.sqrt(sxx * syy), slope = sxy / sxx, df = n - 2, t = r * Math.sqrt(df / (1 - r * r));
        return { n, r, r2: r * r, slope, intercept: my - slope * mx, p: betai(df / 2, 0.5, df / (df + t * t)) };
    }
    const fmtP = (p) => (p < 0.001 ? '< 0.001' : p.toFixed(3));
    const strength = (r, p) => (p >= 0.05 ? ['none', 'Not significant'] : Math.abs(r) >= 0.5 ? ['strong', 'Strong'] : Math.abs(r) >= 0.3 ? ['moderate', 'Moderate'] : ['weak', 'Weak']);

    /* ---------- Labels ---------- */
    const FACTORS = {
        family_history: { label: 'Family history of mental illness', icon: 'people-roof', order: ['Yes', 'No'] },
        work_interfere: { label: 'Condition interferes with work', icon: 'briefcase', order: ['Often', 'Sometimes', 'Rarely', 'Never', 'No answer'], note: { 'No answer': 'No answer (no condition)' } },
        Gender: { label: 'Gender', icon: 'venus-mars', order: ['Female', 'Male'] },
        benefits: { label: 'Employer provides mental-health benefits', icon: 'hand-holding-medical', order: ['Yes', 'No', "Don't know"] },
        care_options: { label: 'Knows the care options available', icon: 'circle-info', order: ['Yes', 'Not sure', 'No'] },
        leave: { label: 'Ease of taking medical leave', icon: 'calendar-xmark', order: ['Very easy', 'Somewhat easy', 'Somewhat difficult', 'Very difficult', "Don't know"] },
        obs_consequence: { label: 'Seen colleagues suffer for disclosing', icon: 'eye', order: ['Yes', 'No'] },
        no_employees: { label: 'Company size (employees)', icon: 'building', order: ['1-5', '6-25', '26-100', '100-500', '500-1000', 'More than 1000'] },
        remote_work: { label: 'Works remotely ≥ 50% of the time', icon: 'house-laptop', order: ['Yes', 'No'] },
        tech_company: { label: 'Works at a tech company', icon: 'microchip', order: ['Yes', 'No'] }
    };
    const IND = {
        alcohol_per_capita: { label: 'Alcohol consumption per capita (litres of pure alcohol, 15+)', short: 'Alcohol per capita' },
        GDP_per_capita: { label: 'GDP per capita (US$, log scale)', short: 'GDP per capita', log: true },
        gov_health_spending_per_capita: { label: 'Government health spending per capita (US$, log scale)', short: 'Government health spending', log: true },
        Labour_force_with_basic_education: { label: 'Labour-force participation of people with only basic education (%)', short: 'Work participation, basic education' },
        Educational_attainment: { label: 'Adults 25+ who completed at least primary school (%)', short: 'Completed primary school' },
        Labor_force_rate_male: { label: 'Male labour-force participation (%)', short: 'Male labour participation' },
        Life_expectancy_total: { label: 'Life expectancy (years)', short: 'Life expectancy' },
        unemployment_with_basic_education_total: { label: 'Unemployment among people with basic education (%)', short: 'Unemployment (basic education)' },
        Female_employment: { label: 'Female employment-to-population ratio (%)', short: 'Female employment' }
    };
    // Results reported by machine_learning_analysis.ipynb (fixed outputs of the notebook, not recomputed here).
    const ML = {
        n: 58, test: 18, threshold: 11.5, baseline: 11 / 18,
        regression: [
            { model: 'Linear regression', train: 0.70, test: -0.36 },
            { model: 'Decision tree regressor', train: 1.0, test: -0.60 },
            { model: 'Support vector regression', train: 0.18, test: 0.13 }
        ],
        classification: [
            { model: 'Support vector machine (linear)', train: 0.775, test: 0.722, cv: 0.71, cvsd: 0.18, f1: 0.67 },
            { model: 'Random forest (tuned)', train: 1.0, test: 0.722, cv: 0.69, cvsd: 0.24, f1: 0.62 },
            { model: 'Decision tree', train: 0.975, test: 0.611, cv: 0.66, cvsd: 0.23, f1: null },
            { model: 'Logistic regression', train: 0.80, test: 0.444, cv: 0.67, cvsd: 0.19, f1: 0.17 }
        ]
    };

    /* ---------- Model ---------- */
    let cache = null;
    function load() {
        if (cache) return cache;
        const D = window.MENTAL_DATA;
        if (!D) throw new Error('Data not loaded');
        const S = D.survey, cat = (f) => S.categories[f], col = (f) => S.columns[f];
        const yes = cat('treatment').indexOf('Yes'), tr = col('treatment');
        const treated = tr.filter((v) => v === yes).length;

        // Treatment rate by each answer of a factor
        const byFactor = (f) => {
            const groups = cat(f).map((name, ci) => {
                let n = 0, t = 0; col(f).forEach((v, i) => { if (v === ci) { n++; if (tr[i] === yes) t++; } });
                return { name, n, rate: n ? t / n : 0 };
            }).filter((g) => g.n >= 20);
            const order = FACTORS[f]?.order || [];
            return groups.sort((a, b) => (order.indexOf(a.name) + 1 || 99) - (order.indexOf(b.name) + 1 || 99));
        };
        const ages = S.age.filter((a) => a != null).sort((a, b) => a - b);
        const countriesSurvey = new Set(col('Country')).size;
        const usShare = col('Country').filter((v) => cat('Country')[v] === 'United States').length / S.n;

        const I = D.indicators, k = (key) => I.keys.indexOf(key);
        const countries = I.countries.map((c) => {
            const o = Object.fromEntries([['name', c.name], ['code', c.code], ['region', c.region], ['series', c.s], ...I.keys.map((key, i) => [key, c.v[i]])]);
            o.change = c.s && c.s[0] != null && c.s[c.s.length - 1] != null ? c.s[c.s.length - 1] - c.s[0] : null;
            return o;
        });
        const withSuicide = countries.filter((c) => c.Suicide_mortality_rate_per_100k != null);
        const SR = 'Suicide_mortality_rate_per_100k';
        const stats = {};
        Object.keys(IND).forEach((key) => {
            const pts = withSuicide.filter((c) => c[key] != null && (!IND[key].log || c[key] > 0));
            const xs = pts.map((c) => (IND[key].log ? Math.log10(c[key]) : c[key]));
            stats[key] = pts.length > 10 ? { ...regress(xs, pts.map((c) => c[SR])), pts } : null;
        });
        const ratio = withSuicide.filter((c) => c.Suicide_mortality_rate_per_100k_female > 0).map((c) => c.Suicide_mortality_rate_per_100k_male / c.Suicide_mortality_rate_per_100k_female).sort((a, b) => a - b);
        const sorted = [...withSuicide].sort((a, b) => b[SR] - a[SR]);
        const srs = sorted.map((c) => c[SR]);
        cache = { D, S, cat, col, byFactor, treated, ages, countriesSurvey, usShare, countries, withSuicide, stats, SR, sorted,
            medianSR: srs[Math.floor(srs.length / 2)], meanSR: mean(srs), ratioMedian: ratio[Math.floor(ratio.length / 2)], k };
        return cache;
    }

    /* ---------- UI helpers ---------- */
    const failAll = () => document.querySelectorAll('[data-needs-data]').forEach((e) => { e.innerHTML = '<div class="alert err">The dataset couldn\'t be loaded. <a href="data.html">Browse the data files</a> instead.</div>'; });
    const charts = {};
    const draw = (id, cfg) => { const cv = document.getElementById(id); if (!cv || !window.Chart) return; charts[id]?.destroy(); charts[id] = new Chart(cv, cfg); };
    const axis = (c, title) => ({ title: { display: !!title, text: title, color: c.ink3 }, grid: { color: c.border }, ticks: { color: c.ink3 } });
    function chips(box, items, current, onPick) {
        box.innerHTML = items.map(([k, text, icon]) => `<button type="button" class="chip" data-k="${esc(k)}" aria-pressed="${k === current}">${icon ? `<i class="fas fa-${icon}" aria-hidden="true"></i> ` : ''}${esc(text)}</button>`).join('');
        box.addEventListener('click', (e) => {
            const b = e.target.closest('[data-k]'); if (!b) return;
            box.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            onPick(b.dataset.k);
        });
    }
    const set = (sel, v) => document.querySelectorAll(sel).forEach((e) => { e.textContent = v; });

    /** Chart.js from cdnjs (as on the portfolio), falling back to jsDelivr if that CDN is unreachable. */
    async function ensureChart() {
        if (window.Chart) return window.Chart;
        try { return await ARC.loadChartJs(); } catch { /* fallback below */ }
        return new Promise((resolve, reject) => {
            const s = Object.assign(document.createElement('script'), { src: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', crossOrigin: 'anonymous' });
            s.onload = () => resolve(window.Chart); s.onerror = () => reject(new Error('Chart.js unavailable'));
            document.head.appendChild(s);
        });
    }

    /* ---------- Real world map (Natural Earth shapes, Equal Earth projection; pre-projected by tools/build_map.py) ---------- */
    const MAP_METRICS = {
        Suicide_mortality_rate_per_100k: { label: 'Suicide rate (total)', unit: 'per 100k', dec: 1 },
        Suicide_mortality_rate_per_100k_male: { label: 'Suicide rate (men)', unit: 'per 100k', dec: 1 },
        Suicide_mortality_rate_per_100k_female: { label: 'Suicide rate (women)', unit: 'per 100k', dec: 1 },
        alcohol_per_capita: { label: 'Alcohol per capita', unit: 'litres', dec: 1 },
        change: { label: 'Change 2000–2021', unit: 'per 100k', dec: 1, diverging: true },
        GDP_per_capita: { label: 'GDP per capita', unit: 'US$', dec: 0, log: true }
    };
    function renderWorld(M, box, key, selected, onPick) {
        const W = window.WORLD_MAP;
        if (!box) return;
        if (!W) { box.innerHTML = '<div class="alert err">The map couldn\'t be loaded: please refresh the page.</div>'; return; }
        const info = MAP_METRICS[key];
        const by = Object.fromEntries(M.countries.map((c) => [c.code, c]));
        const tf = (v) => (info.log ? Math.log10(v) : v);
        const vs = M.countries.map((c) => c[key]).filter((v) => v != null && (!info.log || v > 0)).map(tf);
        const lo = Math.min(...vs), hi = Math.max(...vs);
        const fv = (v) => (info.unit === 'US$' ? `$${Math.round(v).toLocaleString()}` : `${v.toFixed(info.dec)} ${info.unit}`);
        box.innerHTML = `<svg viewBox="${W.viewBox}" class="worldmap" role="group" aria-label="World map of ${esc(info.label)}">
            <defs><pattern id="hatch-w" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="6" class="hatch-line"/></pattern></defs>
            ${W.countries.map((s) => {
                const c = by[s.iso3], v = c ? c[key] : null;
                const tip = `${c ? c.name : s.name}: ${v == null ? 'no data' : info.diverging ? `${v >= 0 ? '+' : ''}${v.toFixed(1)} per 100k since 2000` : fv(v)}`;
                const t = v == null ? null : (tf(v) - lo) / (hi - lo || 1);
                const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
                const fill = v == null ? 'url(#hatch-w)' : info.diverging ? `color-mix(in srgb, ${v >= 0 ? 'var(--danger)' : 'var(--brand)'} ${Math.round(8 + Math.min(1, Math.abs(v) / (m * 0.6)) * 85)}%, var(--surface))` : `color-mix(in srgb, var(--danger) ${Math.round(8 + t * 92)}%, var(--surface))`;
                return `<path d="${s.d}" class="ct${v == null ? ' nodata' : ''}${selected === s.iso3 ? ' on' : ''}" data-iso="${s.iso3 || ''}" style="fill:${fill}"${v == null ? '' : ' tabindex="0" role="button"'} aria-label="${esc(tip)}"><title>${esc(tip)}</title></path>`;
            }).join('')}</svg><div class="map-tip" hidden></div>`;
        const tipEl = box.querySelector('.map-tip'), svg = box.querySelector('svg');
        svg.addEventListener('mousemove', (e) => {
            const el = e.target.closest('[data-iso]'); if (!el) { tipEl.hidden = true; return; }
            tipEl.textContent = el.querySelector('title').textContent;
            const r = box.getBoundingClientRect();
            tipEl.style.left = `${Math.max(0, Math.min(e.clientX - r.left + 12, r.width - 200))}px`; tipEl.style.top = `${e.clientY - r.top + 12}px`; tipEl.hidden = false;
        });
        svg.addEventListener('mouseleave', () => { tipEl.hidden = true; });
        const pick = (el) => { if (el && !el.classList.contains('nodata') && el.dataset.iso) onPick(el.dataset.iso); };
        svg.addEventListener('click', (e) => pick(e.target.closest('[data-iso]')));
        svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e.target.closest('[data-iso]')); } });
        const sc = document.getElementById('worldMap-scale');
        if (sc) sc.innerHTML = info.diverging ? '<span>Fell</span><span class="scale-bar div"></span><span>Rose</span>'
            : `<span>${fv(info.log ? 10 ** lo : lo)}</span><span class="scale-bar red"></span><span>${fv(info.log ? 10 ** hi : hi)}</span>`;
    }
    /** Inline 2000–2021 sparkline of a country's suicide rate. */
    function spark(c) {
        const s = c.series; if (!s || s.filter((v) => v != null).length < 5) return '';
        const vs = s.filter((v) => v != null), lo = Math.min(...vs), hi = Math.max(...vs), W = 220, H = 44;
        const pts = s.map((v, i) => (v == null ? null : [(i / (s.length - 1)) * W, H - 4 - ((v - lo) / (hi - lo || 1)) * (H - 8)])).filter(Boolean);
        const d = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join('');
        const ch = c.change;
        return `<div class="spark"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" role="img" aria-label="Suicide rate 2000 to 2021"><path d="${d}" fill="none" stroke="${ch > 0 ? 'var(--danger)' : 'var(--brand)'}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
            <small>2000: ${vs[0].toFixed(1)} → 2021: ${vs[vs.length - 1].toFixed(1)}${ch != null ? ` (${ch >= 0 ? '+' : ''}${ch.toFixed(1)})` : ''}</small></div>`;
    }

    function renderCountry(M, iso) {
        const box = document.getElementById('countryCard'); if (!box) return;
        const c = M.countries.find((x) => x.code === iso); if (!c) return;
        const rank = M.sorted.indexOf(c) + 1;
        const row = (k, lab, f) => (c[k] == null ? '' : `<dt>${lab}</dt><dd>${f(c[k])}</dd>`);
        const reg = c.region || A()?.countries.regionOf[c.code];
        box.innerHTML = `<h3>${esc(c.name)}</h3>${reg ? `<p style="margin:-.2rem 0 .5rem;font-size:.82rem;color:var(--ink-3)">${esc(reg)}</p>` : ''}${c[M.SR] == null ? '<p>No suicide-rate data.</p>' : `<p><strong>${c[M.SR].toFixed(1)}</strong> suicide deaths per 100,000 (2017–19), <strong>#${rank}</strong> of ${M.withSuicide.length} countries (median ${M.medianSR.toFixed(1)}).</p>`}${spark(c)}
            <dl>${row('Suicide_mortality_rate_per_100k_male', 'Men', (v) => v.toFixed(1))}${row('Suicide_mortality_rate_per_100k_female', 'Women', (v) => v.toFixed(1))}
            ${row('GDP_per_capita', 'GDP per capita', (v) => `$${Math.round(v).toLocaleString()}`)}${row('Life_expectancy_total', 'Life expectancy', (v) => `${v.toFixed(1)} yrs`)}
            ${row('alcohol_per_capita', 'Alcohol per capita', (v) => `${v.toFixed(1)} L`)}${row('gov_health_spending_per_capita', 'Gov. health spending', (v) => `$${Math.round(v).toLocaleString()}`)}</dl>`;
    }

    /* ---------- Overview ---------- */
    async function initOverview() {
        let M;
        try { M = load(); } catch { failAll(); return; }
        set('[data-kpi="respondents"]', M.S.n.toLocaleString());
        set('[data-kpi="treated"]', pctf(M.treated / M.S.n));
        set('[data-kpi="countries"]', M.withSuicide.length);
        set('[data-kpi="median"]', M.medianSR.toFixed(1));

        renderFindings(M);
        renderCountryLists(M);
        renderMl();
        renderAssoc();
        renderCv();
        renderWithin();
        trendNote();
        addKnowledge(M);

        const world = { key: M.SR, sel: 'LTU' };
        const drawWorld = () => renderWorld(M, document.getElementById('worldMap'), world.key, world.sel, (iso) => { world.sel = iso; renderCountry(M, iso); drawWorld(); });
        chips(document.getElementById('mapChips'), Object.entries(MAP_METRICS).map(([k, f]) => [k, f.label]), world.key, (k) => { world.key = k; drawWorld(); });
        drawWorld(); renderCountry(M, world.sel);
        const missing = M.withSuicide.filter((c) => !(window.WORLD_MAP?.countries || []).some((s) => s.iso3 === c.code)).map((c) => c.name);
        const mn = document.getElementById('worldNote');
        if (mn) mn.textContent = `Darker red = higher. Click a country for its profile. Hatched: no data. ${missing.length} small states with data (e.g. ${missing.slice(0, 4).join(', ')}) are too small to show at this scale: they're in the lists below and on the Data page.`;

        const ui = { factor: 'family_history', ind: 'alcohol_per_capita' };
        chips(document.getElementById('factorChips'), Object.entries(FACTORS).map(([k, f]) => [k, f.label, f.icon]), ui.factor, (k) => { ui.factor = k; renderFactor(M, k); });
        chips(document.getElementById('indChips'), Object.entries(IND).filter(([k]) => M.stats[k]).map(([k, f]) => [k, f.short]), ui.ind, (k) => { ui.ind = k; renderIndicator(M, k); });

        try { await ensureChart(); } catch {
            document.querySelectorAll('.chart-box').forEach((b) => { b.innerHTML = '<div class="alert err">Charts couldn\'t load (no connection to the chart library). The map and tables still work.</div>'; });
            return;
        }
        let trendMode = 'sex';
        chips(document.getElementById('trendChips'), [['sex', 'By sex'], ['region', 'By region']], trendMode, (k) => { trendMode = k; renderTrend(k); });
        const redraw = () => { renderFactor(M, ui.factor); renderIndicator(M, ui.ind); renderForest(); renderRegions(); renderTrend(trendMode); };
        document.addEventListener('themechange', redraw);
        redraw();
    }

    function renderFactor(M, f) {
        const g = M.byFactor(f), c = ARC.themeColors(), overall = M.treated / M.S.n;
        const names = g.map((x) => FACTORS[f].note?.[x.name] || x.name);
        draw('factorChart', {
            type: 'bar',
            data: { labels: names, datasets: [{ label: 'Sought treatment', data: g.map((x) => x.rate * 100), backgroundColor: g.map((x) => (x.rate >= overall ? '#0a6cff' : 'rgba(100,116,139,.55)')), borderRadius: 6, maxBarThickness: 38 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toFixed(0)}% sought treatment (n = ${g[ctx.dataIndex].n})` } } },
                scales: { x: { ...axis(c, '% who have sought treatment'), min: 0, max: 100 }, y: { ...axis(c), grid: { display: false } } } }
        });
        const hi = [...g].sort((a, b) => b.rate - a.rate);
        document.getElementById('factorNote').innerHTML =
            `<strong>${esc(FACTORS[f].label)}:</strong> treatment ranges from ${pctf(hi[hi.length - 1].rate)} (${esc(FACTORS[f].note?.[hi[hi.length - 1].name] || hi[hi.length - 1].name)}, n = ${hi[hi.length - 1].n}) to ${pctf(hi[0].rate)} (${esc(FACTORS[f].note?.[hi[0].name] || hi[0].name)}, n = ${hi[0].n}). ` +
            `Overall, ${pctf(overall)} of the ${M.S.n.toLocaleString()} respondents have sought treatment. Blue bars are above that average. Groups with fewer than 20 people are hidden.`;
    }

    function renderIndicator(M, key) {
        const st = M.stats[key], c = ARC.themeColors(), info = IND[key];
        if (!st) return;
        const x = (v) => (info.log ? Math.log10(v) : v);
        const xs = st.pts.map((p) => x(p[key])), x0 = Math.min(...xs), x1 = Math.max(...xs);
        const [cls, lab] = strength(st.r, st.p);
        draw('indChart', {
            type: 'scatter',
            data: { datasets: [
                { label: 'Countries', data: st.pts.map((p) => ({ x: x(p[key]), y: p[M.SR], p })), backgroundColor: 'rgba(10,108,255,.5)', borderColor: 'rgba(10,108,255,.9)', pointRadius: 3.8, pointHoverRadius: 6 },
                { type: 'line', label: 'Least-squares fit', data: [{ x: x0, y: st.intercept + st.slope * x0 }, { x: x1, y: st.intercept + st.slope * x1 }], borderColor: '#ea580c', borderWidth: 2.5, pointRadius: 0, borderDash: st.p < 0.05 ? [] : [6, 6] }
            ] },
            options: { responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => (ctx.raw.p ? `${ctx.raw.p.name}: ${ctx.raw.p[M.SR].toFixed(1)} per 100k, ${info.log ? `$${Math.round(ctx.raw.p[key]).toLocaleString()}` : ctx.raw.p[key].toFixed(1)}` : 'Fit') } } },
                scales: { x: { ...axis(c, info.label), ticks: { color: c.ink3, callback: info.log ? (v) => `$${Math.round(10 ** v).toLocaleString()}` : undefined } }, y: { ...axis(c, 'Suicide deaths per 100,000'), min: 0 } } }
        });
        document.getElementById('indNote').innerHTML =
            `<span class="strength ${cls}">${lab}</span> r = ${st.r.toFixed(2)}, R² = ${st.r2.toFixed(2)}, p ${fmtP(st.p).startsWith('<') ? '' : '= '}${fmtP(st.p)}, ${st.n} countries. ` +
            `${info.short} explains about ${Math.round(st.r2 * 100)}% of the variation between countries. ` + adjNote(key) + ` Dashed line = not statistically significant.`;
    }

    /* ---------- Rigorous analyses (tools/analyze.py → assets/data/analysis.data.js) ---------- */
    const A = () => window.MENTAL_ANALYSIS;
    const TERM_LABELS = { family_history_Yes: 'Family history of mental illness', Gender_Male: 'Men (vs women)', care_options_Yes: 'Knows care options (vs no)',
        'care_options_Not sure': 'Unsure of care options (vs no)', benefits_Yes: "Has benefits (vs doesn't know)", benefits_No: "No benefits (vs doesn't know)",
        obs_consequence_Yes: 'Seen colleagues suffer for disclosing', 'leave_Very difficult': 'Medical leave very difficult (vs don\'t know)', 'leave_Somewhat difficult': 'Leave somewhat difficult',
        'leave_Somewhat easy': 'Leave somewhat easy', 'leave_Very easy': 'Leave very easy', remote_work_Yes: 'Works remotely ≥ 50%', tech_company_Yes: 'Works at a tech company',
        wellness_program_Yes: 'Wellness programme', anonymity_Yes: 'Anonymity protected', seek_help_Yes: 'Employer help resources', age_per_10y: 'Age (per 10 years)',
        'no_employees_More than 1000': 'Company > 1,000 staff (vs 1–5)', 'no_employees_6-25': 'Company 6–25 staff (vs 1–5)' };
    const FOREST_TERMS = ['family_history_Yes', 'Gender_Male', 'care_options_Yes', 'benefits_Yes', 'obs_consequence_Yes', 'leave_Very difficult', 'wellness_program_Yes', 'anonymity_Yes', 'age_per_10y', 'remote_work_Yes', 'tech_company_Yes', 'no_employees_More than 1000'];
    const adjNote = (key) => {
        const a = A()?.countries.assoc.find((x) => x.key === key);
        if (!a) return '';
        const held = a.adjP < 0.05;
        return `<strong>Controlling for world region</strong>, the association ${held ? 'holds' : 'disappears'} (${a.adj >= 0 ? '+' : ''}${a.adj.toFixed(2)} deaths per 100k per standard deviation, p ${fmtP(a.adjP)}${held ? '' : ', it was driven by regional differences'}). Values are ${esc(A().countries.window)} averages.`;
    };

    function renderForest() {
        const an = A(); if (!an || !document.getElementById('forestChart')) return;
        const c = ARC.themeColors();
        const rows = FOREST_TERMS.map((k) => an.survey.adjusted.find((x) => x.term === k)).filter(Boolean);
        draw('forestChart', { type: 'bar', data: { labels: rows.map((r) => TERM_LABELS[r.term] || r.term), datasets: [
            { type: 'scatter', label: 'Adjusted odds ratio', data: rows.map((r, i) => ({ x: r.aor, y: TERM_LABELS[r.term] || r.term })), backgroundColor: rows.map((r) => (r.p < 0.05 ? (r.aor > 1 ? '#0a6cff' : '#ea580c') : c.ink3)), pointRadius: 6, pointStyle: 'rectRot', order: 0 },
            { label: '95% CI', data: rows.map((r) => [r.lo, r.hi]), backgroundColor: rows.map((r) => (r.p >= 0.05 ? 'rgba(100,116,139,.25)' : r.aor > 1 ? 'rgba(10,108,255,.28)' : 'rgba(234,88,12,.3)')), barThickness: 8, borderRadius: 4, order: 1 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => { const r = rows[x.dataIndex]; return `aOR ${r.aor.toFixed(2)} [${r.lo.toFixed(2)}–${r.hi.toFixed(2)}], p ${fmtP(r.p)}`; } } } },
                scales: { x: { ...axis(c, 'Adjusted odds ratio of having sought treatment (log scale; 1 = no effect)'), type: 'logarithmic', min: 0.2, max: 8, ticks: { color: c.ink3, callback: (v) => ([0.25, 0.5, 1, 2, 4, 8].includes(v) ? v : '') } },
                    y: { ...axis(c), type: 'category', grid: { display: false } } } } });
        const s = an.survey, g = (k) => s.adjusted.find((x) => x.term === k);
        const nul = ['remote_work_Yes', 'tech_company_Yes'].map(g);
        const fh = g('family_history_Yes'), men = g('Gender_Male'), co = g('care_options_Yes'), be = g('benefits_Yes'), lv = g('leave_Very difficult');
        const el = document.getElementById('forestNote');
        if (el) el.innerHTML = `Logistic regression on ${s.n.toLocaleString()} respondents, each factor adjusted for all the others. <strong>Family history</strong> multiplies the odds of having sought treatment by ${fh.aor.toFixed(1)} (95% CI ${fh.lo.toFixed(1)}–${fh.hi.toFixed(1)}); <strong>men</strong> have ${men.aor.toFixed(2)}× the odds of women. ` +
            `Workplace support still matters after adjustment: knowing the care options (aOR ${co.aor.toFixed(1)}) and having benefits (aOR ${be.aor.toFixed(1)}). Remote work (${nul[0].aor.toFixed(2)}) and working at a tech company (${nul[1].aor.toFixed(2)}) make no difference. ` +
            `People who find medical leave "very difficult" are <em>more</em> likely to have been treated (aOR ${lv.aor.toFixed(1)}): probably because they found out by needing it (reverse causation).`;
        const lk = document.getElementById('leakNote');
        if (lk) lk.innerHTML = `<strong>Why "work interference" is left out:</strong> people without a condition answer it "NA", so it partly encodes the outcome. Including it lifts cross-validated AUC from ${s.aucClean.toFixed(2)} to ${s.aucLeaky.toFixed(2)}: target leakage, not insight. The honest model discriminates moderately well (AUC ${s.aucClean.toFixed(2)}).`;
    }

    function renderRegions() {
        const an = A(); if (!an || !document.getElementById('regionChart')) return;
        const c = ARC.themeColors(), R = an.countries.regions;
        draw('regionChart', { type: 'bar', data: { labels: R.map((r) => r.region.replace(', Afghanistan & Pakistan', ' (+AFG, PAK)')), datasets: [{ data: R.map((r) => r.mean), backgroundColor: R.map((r, i) => (i < 2 ? '#dc2626' : 'rgba(220,38,38,.45)')), borderRadius: 6, maxBarThickness: 34 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => { const r = R[x.dataIndex]; return [`Mean ${r.mean.toFixed(1)} per 100k (median ${r.median.toFixed(1)}, ${r.n} countries)`, `Men/women ratio ${r.sexRatio.toFixed(1)}× · highest: ${r.topName}`]; } } } },
                scales: { x: { ...axis(c, 'Mean suicide deaths per 100,000'), min: 0 }, y: { ...axis(c), grid: { display: false } } } } });
        const big = R.filter((r) => r.n >= 5), lo = big[big.length - 1], hi = big[0], inc = an.countries.income;
        const small = R.filter((r) => r.n < 5);
        const sa = R.find((r) => r.region === 'South Asia');
        const el = document.getElementById('regionNote');
        if (el) el.innerHTML = `World region alone explains <strong>${Math.round(an.countries.eta2 * 100)}%</strong> of the variation between countries (${esc(an.countries.window)} average; one-way ANOVA, p ${fmtP(an.countries.anovaP)}): from ${lo.mean.toFixed(1)} per 100k in ${esc(lo.region)} to ${hi.mean.toFixed(1)} in ${esc(hi.region)} (${hi.n} countries)${small.length ? `; ${small.map((r) => `${esc(r.region)} has only ${r.n} countries (${r.mean.toFixed(1)})`).join(', ')}` : ''}. ` +
            `High-income countries average ${inc.find((x) => x.income === 'High income').mean.toFixed(1)} vs ${inc.find((x) => x.income === 'Low income').mean.toFixed(1)} in low-income ones: partly real, partly better death registration. ` +
            (sa ? `The male-to-female ratio is lowest in South Asia (${sa.sexRatio.toFixed(1)}×), where women's suicide rates are unusually high.` : '');
    }

    function renderAssoc() {
        const tb = document.getElementById('indTable'), an = A(); if (!tb || !an) return;
        const rows = [...an.countries.assoc].sort((a, b) => a.adjP - b.adjP);
        const sig = (b, p) => `<span class="strength ${p < 0.05 ? (Math.abs(b) >= 2 ? 'strong' : 'moderate') : 'none'}">${p < 0.05 ? 'Significant' : 'n.s.'}</span>`;
        const eff = (b, p) => `${b >= 0 ? '+' : ''}${b.toFixed(2)} <small>p ${fmtP(p)}</small>`;
        tb.innerHTML = rows.map((a) => `<tr><th scope="row">${esc(a.label)}</th><td class="num">${a.n}</td><td class="num">${eff(a.raw, a.rawP)}</td><td class="num">${eff(a.adj, a.adjP)}</td><td>${sig(a.adj, a.adjP)}</td>` +
            `<td class="num">${a.old ? `${eff(a.old.adj, a.old.adjP)} <small>n=${a.old.n}</small>` : '<small>not in original data</small>'}</td></tr>`).join('');
        const robust = rows.filter((a) => a.adjP < 0.05 && (!a.old || a.old.adjP < 0.05)).map((a) => a.label);
        const unstable = rows.filter((a) => a.old && (a.adjP < 0.05) !== (a.old.adjP < 0.05)).map((a) => a.label);
        const gone = rows.filter((a) => a.rawP < 0.05 && a.adjP >= 0.05).map((a) => a.label);
        const el = document.getElementById('assocNote');
        if (el) el.innerHTML = `Effects are the change in suicide deaths per 100k for a one-standard-deviation higher indicator (${esc(an.countries.window)} average). <strong>Significant after controlling for region:</strong> ${esc(robust.join(', '))}. ` +
            (unstable.length ? `<strong>Not robust</strong> (significance changes between the 2015–16 and 2017–19 samples): ${esc(unstable.join(', '))}. ` : '') +
            (gone.length ? `<strong>Explained away by region:</strong> ${esc(gone.join(', '))}. ` : '') +
            `Richer, better-educated countries with higher health spending record <em>higher</em> rates: partly better death registration. Where people with only basic education are more likely to be working, rates are lower.`;
    }

    function renderTrend(mode) {
        const an = A(); if (!an || !document.getElementById('trendChart')) return;
        const c = ARC.themeColors(), T = an.countries.trend;
        const REG_COLORS = ['#0a6cff', '#dc2626', '#ea580c', '#1e3a8a', '#f59e0b', '#60a5fa', '#475569'];
        const ds = mode === 'region'
            ? Object.entries(T.regions).sort((a, b) => b[1][b[1].length - 1] - a[1][a[1].length - 1]).map(([r, v], i) => ({ label: r.replace(', Afghanistan & Pakistan', ' (+AFG, PAK)'), data: v, borderColor: REG_COLORS[i % 7], backgroundColor: REG_COLORS[i % 7], tension: .3, pointRadius: 0, borderWidth: 2.2 }))
            : [{ label: 'Men', data: T.male, borderColor: '#0a6cff', backgroundColor: '#0a6cff', tension: .3, pointRadius: 0, borderWidth: 2.2 },
               { label: 'All people', data: T.global, borderColor: c.ink, backgroundColor: c.ink, tension: .3, pointRadius: 0, borderWidth: 3 },
               { label: 'Women', data: T.female, borderColor: '#ea580c', backgroundColor: '#ea580c', tension: .3, pointRadius: 0, borderWidth: 2.2 }];
        draw('trendChart', { type: 'line', data: { labels: T.years, datasets: ds },
            options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom', labels: { color: c.ink2, usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (x) => `${x.dataset.label}: ${x.raw.toFixed(1)}` } } },
                scales: { x: axis(c), y: { ...axis(c, 'Suicide deaths per 100,000 (population-weighted)'), beginAtZero: true } } } });
    }
    function trendNote() {
        const an = A(), el = document.getElementById('trendNote'); if (!an || !el) return;
        const T = an.countries.trend, mv = an.countries.movers, ch = (a) => ((a[a.length - 1] - a[0]) / a[0]) * 100;
        const regs = Object.entries(T.regions).map(([r, v]) => ({ r, c: ch(v) })).sort((a, b) => a.c - b.c);
        const up = regs.filter((x) => x.c > 10).reverse();
        el.innerHTML = `Worldwide, the population-weighted suicide rate fell <strong>${Math.abs(ch(T.global)).toFixed(0)}%</strong> from ${T.global[0].toFixed(1)} to ${T.global[T.global.length - 1].toFixed(1)} per 100,000 (2000–2021), and fell in ${mv.nFalling} of ${mv.n} countries, for men (${ch(T.male).toFixed(0)}%) and women (${ch(T.female).toFixed(0)}%) alike. ` +
            `The steepest regional fall was ${esc(regs[0].r)} (${regs[0].c.toFixed(0)}%); the largest national falls were ${esc(mv.falls.slice(0, 3).map(([n, v]) => `${n} (${v})`).join(', '))}. ` +
            (up.length ? `Against the trend, rates <strong>rose</strong> in ${esc(up.map((x) => `${x.r} (+${x.c.toFixed(0)}%)`).join(' and '))}; the largest national rises were ${esc(mv.rises.slice(0, 3).map(([n, v]) => `${n} (+${v})`).join(', '))}.` : '');
    }

    function renderWithin() {
        const tb = document.getElementById('withinTable'), an = A(); if (!tb || !an) return;
        const W = an.countries.within;
        tb.innerHTML = W.map((w) => `<tr><th scope="row">${esc(w.label)}</th><td class="num">${w.b >= 0 ? '+' : ''}${w.b.toFixed(2)} <small>[${w.lo.toFixed(2)}, ${w.hi.toFixed(2)}]</small></td><td class="num">${fmtP(w.p)}</td><td><span class="strength ${w.p < 0.05 ? 'strong' : 'none'}">${w.p < 0.05 ? 'Significant' : 'n.s.'}</span></td><td class="num">${w.countries}</td></tr>`).join('');
        const g = W.find((w) => w.key === 'GDP_per_capita'), al = W.find((w) => w.key === 'alcohol_per_capita');
        const gx = an.countries.assoc.find((a) => a.key === 'GDP_per_capita');
        const el = document.getElementById('withinNote');
        if (el) el.innerHTML = `Two-way fixed effects (each country compared with itself over 2000–2021, net of global year-to-year shifts; standard errors clustered by country). ` +
            `<strong>The income paradox:</strong> across countries, richer ones record <em>higher</em> rates (+${gx.adj.toFixed(1)} per SD), but within a country, growing richer goes with <em>falling</em> rates, a tenfold rise in GDP per capita with ${Math.abs(g.b).toFixed(1)} fewer deaths per 100k (95% CI ${Math.abs(g.hi).toFixed(1)}–${Math.abs(g.lo).toFixed(1)}, p ${fmtP(g.p)}). ` +
            `Alcohol shows the opposite pattern: strongly linked across countries, but changes in drinking don't track changes in suicide (p ${fmtP(al.p)}), its association reflects long-standing national drinking cultures.`;
    }

    function renderCv() {
        const tb = document.getElementById('cvTable'), an = A(); if (!tb || !an) return;
        tb.innerHTML = an.countries.models.map((m) => `<tr><th scope="row">${esc(m.model)}</th><td class="num"><strong>${m.r2.toFixed(2)}</strong> <small>± ${m.sd.toFixed(2)}</small></td></tr>`).join('');
    }

    function renderCountryLists(M) {
        const hi = document.getElementById('topCountries'), lo = document.getElementById('lowCountries'); if (!hi) return;
        const max = M.sorted[0][M.SR];
        const li = (c) => `<li><span class="bar-wrap" style="--w:${(c[M.SR] / max) * 100}%"><span>${esc(c.name)}</span></span><b>${c[M.SR].toFixed(1)}</b></li>`;
        hi.innerHTML = M.sorted.slice(0, 10).map(li).join('');
        lo.innerHTML = M.sorted.slice(-10).reverse().map(li).join('');
        set('[data-kpi="ratio"]', `${M.ratioMedian.toFixed(1)}×`);
    }

    function renderFindings(M) {
        const box = document.getElementById('findings'), an = A(); if (!box) return;
        const items = [];
        if (an) {
            const g = (k) => an.survey.adjusted.find((x) => x.term === k);
            const fh = g('family_history_Yes'), men = g('Gender_Male'), co = g('care_options_Yes'), be = g('benefits_Yes');
            const C = an.countries, T = C.trend, ch = (a) => ((a[a.length - 1] - a[0]) / a[0]) * 100;
            const up = Object.entries(T.regions).filter(([, v]) => ch(v) > 10).sort((a, b) => ch(b[1]) - ch(a[1])).map(([r, v]) => `${r} (+${ch(v).toFixed(0)}%)`);
            const al = C.assoc.find((x) => x.key === 'alcohol_per_capita'), gw = C.within.find((x) => x.key === 'GDP_per_capita');
            const best = [...C.models].sort((a, b) => b.r2 - a.r2)[0];
            const nMen = M.byFactor('Gender').find((x) => x.name === 'Male').n, nWomen = M.byFactor('Gender').find((x) => x.name === 'Female').n;
            const fall = (k) => Math.abs(+C.movers.falls[k][1]).toFixed(1);
            items.push(['arrow-trend-down', `Suicide rates fell ${Math.abs(ch(T.global)).toFixed(0)}% worldwide from 2000 to 2021, but rose in ${up.join(' and ')}`,
                `They fell in ${C.movers.nFalling} of ${C.movers.n} countries, most steeply in the former Soviet Union (Russia down ${fall(0)} and Lithuania down ${fall(1)} deaths per 100,000 people).`,
                'Population-weighted World Bank / WHO estimates.']);
            items.push(['wine-bottle', 'Countries that drink more have higher suicide rates, even compared with their neighbours',
                'Of all the indicators, alcohol has the strongest link that still holds within the same world region. The link is stronger for men than for women.',
                `+${al.adj.toFixed(1)} deaths per 100k per standard deviation of alcohol, adjusted for region (p ${fmtP(al.adjP)}); r = ${C.sexAlcohol.Suicide_mortality_rate_per_100k_male.toFixed(2)} for men's rates, ${C.sexAlcohol.Suicide_mortality_rate_per_100k_female.toFixed(2)} for women's.`]);
            items.push(['scale-balanced', 'The income paradox: richer countries record more suicides, yet getting richer goes with fewer',
                'Comparing countries, wealthy ones report higher rates: partly because they record deaths more completely. But when a country\'s own income grows, its rate tends to fall.',
                `Within-country (fixed-effects) model, 2000–2021: a tenfold rise in GDP per capita goes with ${Math.abs(gw.b).toFixed(1)} fewer deaths per 100k (p ${fmtP(gw.p)}).`]);
            items.push(['people-roof', 'Family history is the strongest predictor of seeking treatment',
                `Tech workers with a family history of mental illness had about ${fh.aor.toFixed(1)} times the odds of having sought treatment, even after accounting for gender, age and workplace.`,
                `Adjusted odds ratio ${fh.aor.toFixed(1)} (95% CI ${fh.lo.toFixed(1)}–${fh.hi.toFixed(1)}); OSMI survey, ${an.survey.n.toLocaleString()} respondents.`]);
            items.push(['venus-mars', 'Men are much less likely to have sought treatment',
                `Men had less than half the odds of women of having been treated, while, worldwide, men die by suicide about ${M.ratioMedian.toFixed(1)} times as often as women.`,
                `Adjusted odds ratio ${men.aor.toFixed(2)}; men are ${Math.round((nMen / (nMen + nWomen)) * 100)}% of respondents.`]);
            items.push(['hand-holding-medical', 'Workplace support matters',
                'Knowing what mental-health care is available roughly doubles the odds of seeking treatment, and having benefits helps too. Working remotely or at a tech company makes no difference.',
                `Adjusted odds ratios ${co.aor.toFixed(1)} (knows care options) and ${be.aor.toFixed(1)} (has benefits).`]);
            items.push(['robot', 'These indicators can\'t predict a country\'s suicide rate well',
                'Tested on countries they hadn\'t seen, the models explain less than a fifth of the differences. The original "72% accurate" models were tested on only 18 countries, where always guessing "low" already scored 61%.',
                `Cross-validated R² ${best.r2.toFixed(2)} (repeated 5-fold, ${C.movers.n} countries).`]);
        }
        box.innerHTML = items.map(([i, h, p, st]) => `<li class="card"><i class="fas fa-${i}" aria-hidden="true"></i><div><strong>${esc(h)}</strong><p>${esc(p)}</p>${st ? `<p class="stat-line">${esc(st)}</p>` : ''}</div></li>`).join('');
    }

    function renderMl() {
        const tb = document.getElementById('mlTable'); if (!tb) return;
        tb.innerHTML = ML.classification.map((m) => `<tr><th scope="row">${esc(m.model)}</th><td class="num">${pctf(m.train)}</td><td class="num"><strong>${pctf(m.test)}</strong></td><td class="num">${pctf(m.cv)} ± ${Math.round(m.cvsd * 100)}</td><td class="num">${m.f1 == null ? 'n/a' : m.f1.toFixed(2)}</td></tr>`).join('') +
            `<tr><th scope="row"><em>Baseline: always guess "low"</em></th><td class="num">n/a</td><td class="num">${pctf(ML.baseline)}</td><td class="num">n/a</td><td class="num">n/a</td></tr>`;
        const rb = document.getElementById('regTable');
        if (rb) rb.innerHTML = ML.regression.map((m) => `<tr><th scope="row">${esc(m.model)}</th><td class="num">${m.train.toFixed(2)}</td><td class="num"><strong>${m.test.toFixed(2)}</strong></td></tr>`).join('');
    }

    /* ---------- Assistant safety: first-person distress always gets support info first ----------
     * Runs before knowledge-base retrieval, so it can't be outranked. Matches first-person statements
     * ("I want to die", "kill myself") — not questions about statistics ("suicide rate in Japan"). */
    const CRISIS = /\b(kill(ing)? my ?self|end(ing)? (my|it all|my own) ?life|end it all|take my (own )?life|want(ed)? to die|wish i (was|were) dead|better off dead|(don'?t|do not) want to (live|be alive|be here)|no reason to (live|go on)|hurt(ing)? my ?self|harm(ing)? my ?self|self[- ]?harm(ing)?|cut(ting)? my ?self|i('?m| am)? ?(feel(ing)? |am feeling )?suicidal|suicidal (thoughts|feelings)|i('?m| am| feel) (so |really |very )?(depressed|hopeless|worthless))\b/i;
    const SUPPORT_TEXT = "I'm really sorry you're feeling this way, thank you for saying it. You deserve support, and you don't have to go through this alone.\n\n" +
        "- **US & Canada:** call or text **988** (Suicide & Crisis Lifeline), free, confidential, 24/7\n- **UK & Ireland:** call Samaritans on **116 123**\n" +
        "- **Anywhere else:** findahelpline.com lists free services in your country\n- **If you're in immediate danger**, call your local emergency number.\n\n" +
        "Talking to someone you trust, a friend, family member or doctor, can also help. I'm only a data assistant, but I'm glad you reached out.";
    function installSafety() {
        const E = window.ARC && ARC.chatEngine;
        if (!E || E._safety) return;
        const answer = E.answer;
        E.answer = (message, session) => (CRISIS.test(String(message || ''))
            ? { text: SUPPORT_TEXT, confidence: 'high', source: 'assistant', actions: [{ label: 'Find a helpline', action: 'link:https://findahelpline.com' }] }
            : answer(message, session));
        E._safety = true;
    }

    /* ---------- Assistant knowledge generated from the data ---------- */
    let kbAdded = false;
    function addKnowledge(M) {
        installSafety();
        if (kbAdded || !window.ARC || !ARC.KB) return;
        kbAdded = true;
        Object.entries(FACTORS).forEach(([f, info]) => {
            const g = M.byFactor(f);
            ARC.KB.push({ id: `mh-f-${f}`, topic: 'project', title: `Treatment by: ${info.label}`,
                q: [`does ${info.label.toLowerCase()} affect treatment`, `treatment rate by ${info.label.toLowerCase()}`],
                k: info.label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3).concat(['treatment', 'survey']),
                a: `**${info.label}**: share of the ${M.S.n.toLocaleString()} OSMI survey respondents who have sought mental-health treatment:\n\n${g.map((x) => `- ${FACTORS[f].note?.[x.name] || x.name}: **${pctf(x.rate)}** (n = ${x.n})`).join('\n')}\n\nThese are associations in a self-selected survey of tech workers, not causal effects.`,
                actions: [{ label: 'Open the survey chart', action: 'link:index.html#survey' }] });
        });
        M.withSuicide.forEach((c) => {
            const rank = M.sorted.indexOf(c) + 1;
            const f = c.Suicide_mortality_rate_per_100k_female, m = c.Suicide_mortality_rate_per_100k_male;
            ARC.KB.push({ id: `mh-c-${c.code}`, topic: 'project', title: `${c.name}: suicide rate`,
                q: [`what is the suicide rate in ${c.name.toLowerCase()}`, `${c.name.toLowerCase()} suicide rate`],
                k: c.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !['the', 'and', 'rep', 'dem'].includes(w)),
                a: `**${c.name}**: ${c[M.SR].toFixed(1)} suicide deaths per 100,000 people (World Bank, 2017–2019 average), **#${rank} of ${M.withSuicide.length}** countries (median ${M.medianSR.toFixed(1)}).` +
                   (f != null && m != null ? `\n\n- Men: ${m.toFixed(1)} · Women: ${f.toFixed(1)}${f > 0 ? ` (${(m / f).toFixed(1)}×)` : ''}` : '') +
                   (c.GDP_per_capita ? `\n- GDP per capita: $${Math.round(c.GDP_per_capita).toLocaleString()}` : '') +
                   (c.Life_expectancy_total ? `\n- Life expectancy: ${c.Life_expectancy_total.toFixed(1)} years` : '') +
                   (c.change != null ? `\n- Change 2000–2021: ${c.change >= 0 ? '+' : ''}${c.change.toFixed(1)} per 100k` : ''),
                actions: [{ label: 'See the world map', action: 'link:index.html#worldmap' }] });
        });
        const an = A();
        if (an) {
            const s = an.survey, C = an.countries, g = (k) => s.adjusted.find((x) => x.term === k);
            ARC.KB.push({ id: 'mh-adjusted', topic: 'project', title: 'What predicts seeking treatment (adjusted)?',
                q: ['what predicts seeking treatment', 'adjusted odds ratios', 'logistic regression results', 'who is most likely to get treatment', 'does gender affect treatment after adjustment'],
                k: ['predict', 'predicts', 'adjusted', 'odds', 'logistic', 'regression', 'factors', 'treatment', 'likely'],
                a: `Multivariable logistic regression on ${s.n.toLocaleString()} survey respondents (adjusted odds ratios, 95% CI):\n\n${FOREST_TERMS.map(g).filter(Boolean).slice(0, 8).map((r) => `- ${TERM_LABELS[r.term] || r.term}: **${r.aor.toFixed(2)}** [${r.lo.toFixed(2)}–${r.hi.toFixed(2)}], p ${fmtP(r.p)}`).join('\n')}\n\nCross-validated AUC ${s.aucClean.toFixed(2)}. "Work interference" is excluded because it leaks the outcome (AUC would jump to ${s.aucLeaky.toFixed(2)}).`,
                actions: [{ label: 'See the forest plot', action: 'link:index.html#adjusted' }] });
            ARC.KB.push({ id: 'mh-region', topic: 'project', title: 'Region and suicide rates',
                q: ['which region has the highest suicide rate', 'does region explain suicide rates', 'suicide rate by region', 'is the social insurance link real', 'confounding'],
                k: ['region', 'regions', 'continent', 'europe', 'africa', 'asia', 'confounding', 'confounded', 'income', 'social insurance'],
                a: `World region explains **${Math.round(C.eta2 * 100)}%** of the variation in national suicide rates:\n\n${C.regions.map((r) => `- ${r.region}: ${r.mean.toFixed(1)} per 100k (${r.n} countries)`).join('\n')}\n\nControlling for region, ${C.assoc.filter((a) => a.rawP < 0.05 && a.adjP >= 0.05).map((a) => a.label.toLowerCase()).join(', ')} stop being significant; ${C.assoc.filter((a) => a.adjP < 0.05).map((a) => a.label.toLowerCase()).join(', ')} remain.`,
                actions: [{ label: 'See by region', action: 'link:index.html#countries' }] });
            const T = C.trend, chg = (a) => ((a[a.length - 1] - a[0]) / a[0]) * 100;
            ARC.KB.push({ id: 'mh-trend', topic: 'project', title: 'How suicide rates changed, 2000–2021',
                q: ['how have suicide rates changed', 'are suicide rates rising', 'suicide trend over time', 'which countries saw suicide rise', 'global suicide trend'],
                k: ['trend', 'trends', 'change', 'changed', 'rising', 'falling', 'over time', '2000', '2021', 'decline', 'increase'],
                a: `Population-weighted suicide rate, 2000 → 2021: **${T.global[0].toFixed(1)} → ${T.global[T.global.length - 1].toFixed(1)} per 100k (${chg(T.global).toFixed(0)}%)**; men ${chg(T.male).toFixed(0)}%, women ${chg(T.female).toFixed(0)}%. Rates fell in ${C.movers.nFalling} of ${C.movers.n} countries.\n\n**By region:**\n${Object.entries(T.regions).map(([r, v]) => `- ${r}: ${chg(v) >= 0 ? '+' : ''}${chg(v).toFixed(0)}%`).join('\n')}\n\n**Largest falls:** ${C.movers.falls.slice(0, 4).map(([n, v]) => `${n} ${v}`).join(', ')}\n**Largest rises:** ${C.movers.rises.slice(0, 4).map(([n, v]) => `${n} +${v}`).join(', ')}`,
                actions: [{ label: 'See the trends', action: 'link:index.html#trends' }] });
            const gw = C.within.find((x) => x.key === 'GDP_per_capita');
            ARC.KB.push({ id: 'mh-within', topic: 'project', title: 'Does economic growth lower suicide rates?',
                q: ['does economic growth reduce suicide', 'do richer countries have more suicide', 'income and suicide', 'does alcohol cause suicide', 'within country analysis'],
                k: ['growth', 'income', 'richer', 'wealth', 'gdp', 'alcohol', 'within', 'fixed effects', 'paradox', 'drinking'],
                a: `Across countries, richer ones record *higher* suicide rates, but within each country over 2000–2021, growing richer goes with **falling** rates: a tenfold rise in GDP per capita ≈ ${Math.abs(gw.b).toFixed(1)} fewer deaths per 100k (95% CI ${Math.abs(gw.hi).toFixed(1)}–${Math.abs(gw.lo).toFixed(1)}, p ${fmtP(gw.p)}; two-way fixed effects, clustered errors).\n\nAlcohol is the strongest cross-country correlate after controlling for region, but changes in drinking don't track changes in suicide: the link reflects long-standing national drinking cultures, not a short-term effect.`,
                actions: [{ label: 'See the analysis', action: 'link:index.html#within' }] });
            ARC.KB.push({ id: 'mh-cv', topic: 'project', title: 'Re-analysis of the prediction models',
                q: ['can suicide rates be predicted', 'cross validation results', 'how good is the improved model', 're-analysis of the models'],
                k: ['cross', 'validation', 'cv', 'r2', 'predict', 'prediction', 'reanalysis', 'improved', 'ridge'],
                a: `Re-run on all ${C.n} countries (${C.window} averages) with repeated 5-fold cross-validation (median imputation):\n\n${C.models.map((m) => `- ${m.model}: R² ${m.r2.toFixed(2)} ± ${m.sd.toFixed(2)}`).join('\n')}\n\nThe indicators explain about a fifth of the variation at best, barely more than region alone: they describe patterns but can't predict a country's rate.`,
                actions: [{ label: 'See model results', action: 'link:ml.html' }] });
        }
        const ranked = Object.entries(IND).filter(([k]) => M.stats[k]).sort((a, b) => Math.abs(M.stats[b[0]].r) - Math.abs(M.stats[a[0]].r));
        ARC.KB.push({ id: 'mh-ind', topic: 'project', title: 'Which indicators relate to suicide rates?',
            q: ['which factors are associated with suicide', 'what predicts suicide rates', 'which indicators correlate with suicide', 'does gdp affect suicide'],
            k: ['indicator', 'indicators', 'factor', 'factors', 'correlation', 'correlated', 'predict', 'gdp', 'education', 'social insurance', 'associated'],
            a: `Correlation with national suicide rates (countries, 2017–2019 average):\n\n${ranked.map(([k, f]) => `- ${f.short}: r = ${M.stats[k].r.toFixed(2)} (p ${fmtP(M.stats[k].p)}, ${M.stats[k].n} countries)`).join('\n')}\n\nNo single indicator explains more than about a quarter of the variation. Several links are confounded by region: e.g. high social-insurance coverage and high suicide rates both cluster in former Soviet states.`,
            actions: [{ label: 'Explore indicators', action: 'link:index.html#countries' }] });
        ARC.KB.push({ id: 'mh-top', topic: 'project', title: 'Highest and lowest suicide rates',
            q: ['which country has the highest suicide rate', 'countries with the lowest suicide rate', 'where are suicide rates highest'],
            k: ['highest', 'lowest', 'countries', 'country', 'rank', 'top', 'suicide rate'],
            a: `**Highest** (per 100,000, 2017–2019 average): ${M.sorted.slice(0, 6).map((c) => `${c.name} ${c[M.SR].toFixed(1)}`).join(', ')}.\n\n**Lowest:** ${M.sorted.slice(-5).reverse().map((c) => `${c.name} ${c[M.SR].toFixed(1)}`).join(', ')}.\n\nVery low figures in small island states and conflict zones may partly reflect under-reporting.`,
            actions: [{ label: 'See the map', action: 'link:index.html#worldmap' }] });
    }

    /* ---------- Pages without charts: assistant + API explorer ---------- */
    function initAssistant() {
        installSafety();
        try { addKnowledge(load()); } catch { /* the static knowledge still works */ }
    }
    function initApi() {
        initAssistant();
        const box = document.getElementById('endpoints'); if (!box) return;
        box.addEventListener('click', async (e) => {
            const cp = e.target.closest('[data-copy]');
            if (cp) { const url = new URL(cp.dataset.copy, location.href).href; try { await navigator.clipboard.writeText(url); ARC.toast('URL copied'); } catch { ARC.toast(url); } return; }
            const b = e.target.closest('[data-try]'); if (!b) return;
            const out = b.closest('.endpoint').querySelector('.endpoint-out');
            out.hidden = false; out.textContent = 'Loading…';
            try {
                const res = await fetch(b.dataset.try);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const j = await res.json();
                out.textContent = `// ${j.length.toLocaleString()} records, fields: ${Object.keys(j[0]).join(', ')}\n${JSON.stringify(j.slice(0, 2), null, 2)}\n…`;
            } catch (err) {
                out.textContent = location.protocol === 'file:' ? 'Browsers block requests from pages opened as files. Open the site from its web address (or run python3 app.py) to try the endpoints.' : `Couldn't load the endpoint (${err.message}).`;
            }
        });
    }

    /* ---------- Model results page ---------- */
    function initModels() {
        renderMl();
        renderCv();
        installSafety();
        try { addKnowledge(load()); } catch { /* assistant still has the static knowledge */ }
    }

    /* ---------- Data page ---------- */
    function initData() {
        let M;
        try { M = load(); } catch { failAll(); return; }
        initAssistant();
        const { S, cat, col } = M;
        const fields = ['Gender', 'Country', 'treatment', 'family_history', 'work_interfere', 'no_employees', 'remote_work', 'tech_company', 'benefits', 'care_options', 'leave'];
        const rows = S.age.map((age, i) => Object.fromEntries([['Age', age], ...fields.map((f) => [f, cat(f)[col(f)[i]]])]));
        const L = { treatment: 'Sought treatment', family_history: 'Family history', work_interfere: 'Work interference', no_employees: 'Company size', remote_work: 'Remote', tech_company: 'Tech company', benefits: 'Benefits', care_options: 'Care options', leave: 'Medical leave' };
        DataTable.mount(document.getElementById('surveyTable'), {
            id: 'sv', rows, fileName: 'osmi-mental-health-survey', pageSize: 25, caption: 'OSMI Mental Health in Tech survey responses',
            columns: [{ key: 'Age', label: 'Age', type: 'number' }, ...fields.map((f) => ({ key: f, label: L[f] || f, filter: ['Gender', 'treatment', 'family_history', 'no_employees'].includes(f), filterLabel: (L[f] || f).toLowerCase() }))],
            onChange: (v) => {
                set('#kResp', v.length.toLocaleString());
                set('#kTreat', v.length ? pctf(v.filter((r) => r.treatment === 'Yes').length / v.length) : '–');
                const a = v.map((r) => r.Age).filter((x) => x != null);
                set('#kAge', a.length ? mean(a).toFixed(1) : '–');
                set('#kCountry', new Set(v.map((r) => r.Country)).size);
            }
        });
        const keys = ['Suicide_mortality_rate_per_100k', 'Suicide_mortality_rate_per_100k_male', 'Suicide_mortality_rate_per_100k_female', 'change', 'GDP_per_capita', 'Life_expectancy_total', 'alcohol_per_capita', 'gov_health_spending_per_capita', 'Labour_force_with_basic_education'];
        const IL = { Suicide_mortality_rate_per_100k: 'Suicide /100k', Suicide_mortality_rate_per_100k_male: 'Male /100k', Suicide_mortality_rate_per_100k_female: 'Female /100k', change: 'Change 2000–21', GDP_per_capita: 'GDP per capita ($)', Life_expectancy_total: 'Life expectancy', alcohol_per_capita: 'Alcohol (L)', gov_health_spending_per_capita: 'Gov. health $', Labour_force_with_basic_education: 'Work particip., basic ed. %' };
        DataTable.mount(document.getElementById('indicatorTable'), {
            id: 'ind', rows: M.countries, fileName: 'world-bank-indicators-2017-2019', pageSize: 25, caption: 'World Bank indicators by country, 2017–2019 average',
            columns: [{ key: 'name', label: 'Country' }, { key: 'code', label: 'Code' }, ...keys.map((k) => ({ key: k, label: IL[k], type: 'number', format: (v) => (v == null ? 'n/a' : ['GDP_per_capita', 'gov_health_spending_per_capita'].includes(k) ? Math.round(v).toLocaleString() : `${k === 'change' && v > 0 ? '+' : ''}${v.toFixed(1)}`) })), { key: 'region', label: 'Region', filter: true, filterLabel: 'regions' }]
        });
    }

    return { load, regress, initOverview, initModels, initData, initAssistant, initApi, ML, addKnowledge: () => addKnowledge(load()) };
})();
