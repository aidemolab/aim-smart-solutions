"use client";

// Business Performance Dashboard demo. Fictional business, illustrative data,
// everything calculated in the browser.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import DemoBadge from "../DemoBadge";
import { BUSINESS_NAME, MONTHS, ROWS, SERVICE_LINES, type Row } from "./dashboardData";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-GB");
const shortMonth = (label: string) => label.slice(0, 3);
const compactGbp = (value: number) => value >= 1000 ? `£${Math.round(value / 1000)}k` : `£${value}`;

function totals(rows: Row[]) {
  const enquiries = rows.reduce((s, r) => s + r.enquiries, 0);
  const won = rows.reduce((s, r) => s + r.won, 0);
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const response = enquiries ? rows.reduce((s, r) => s + r.responseHours * r.enquiries, 0) / enquiries : 0;
  return { enquiries, won, revenue, conversion: enquiries ? won / enquiries : 0, response };
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="chart-table">
      <summary>Show the data</summary>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

// Charts are drawn at their real on-screen width, so text stays readable on phones.
const H = 240, PAD = { l: 46, r: 10, t: 14, b: 30 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(260, Math.round(el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= value / 4)! * pow;
  return Math.ceil(value / step) * step;
}

function Gridlines({ W, max, format }: { W: number; max: number; format: (v: number) => string }) {
  const plotH = H - PAD.t - PAD.b;
  return <g className="chart-grid">{[0, 0.25, 0.5, 0.75, 1].map((f) => {
    const y = PAD.t + plotH * (1 - f);
    return <g key={f}><line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} /><text x={PAD.l - 6} y={y + 4} textAnchor="end">{format(max * f)}</text></g>;
  })}</g>;
}

// On narrow charts, label every other month.
const showLabel = (i: number, W: number) => W >= 460 || i % 2 === 0;

function RevenueBars({ values, selected }: { values: number[]; selected: number | null }) {
  const { ref, width: W } = useWidth();
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const max = niceMax(Math.max(...values));
  const slot = plotW / values.length;
  return (
    <div ref={ref} className="chart-frame">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Revenue by month. Highest: ${MONTHS[values.indexOf(Math.max(...values))]} at ${gbp.format(Math.max(...values))}.`}>
        <Gridlines W={W} max={max} format={compactGbp} />
        {values.map((v, i) => {
          const h = (v / max) * plotH;
          return <g key={i}>
            <rect x={PAD.l + i * slot + slot * 0.18} y={PAD.t + plotH - h} width={slot * 0.64} height={h} rx={3} className={selected === null || selected === i ? "bar" : "bar is-dim"}><title>{`${MONTHS[i]}: ${gbp.format(v)}`}</title></rect>
            {showLabel(i, W) && <text x={PAD.l + i * slot + slot / 2} y={H - 10} textAnchor="middle" className="chart-axis">{shortMonth(MONTHS[i])}</text>}
          </g>;
        })}
      </svg>
    </div>
  );
}

function EnquiryLines({ enquiries, won, selected }: { enquiries: number[]; won: number[]; selected: number | null }) {
  const { ref, width: W } = useWidth();
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const max = niceMax(Math.max(...enquiries));
  const slot = plotW / enquiries.length;
  const x = (i: number) => PAD.l + i * slot + slot / 2;
  const y = (v: number) => PAD.t + plotH * (1 - v / max);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <div ref={ref} className="chart-frame">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Enquiries and jobs won by month, shown as two lines.">
        <Gridlines W={W} max={max} format={(v) => num.format(Math.round(v))} />
        {selected !== null && <rect x={PAD.l + selected * slot} y={PAD.t} width={slot} height={plotH} className="chart-highlight" />}
        <path d={path(enquiries)} className="line line-a" />
        <path d={path(won)} className="line line-b" />
        {enquiries.map((v, i) => <circle key={`a${i}`} cx={x(i)} cy={y(v)} r={3.5} className="dot dot-a"><title>{`${MONTHS[i]}: ${v} enquiries`}</title></circle>)}
        {won.map((v, i) => <circle key={`b${i}`} cx={x(i)} cy={y(v)} r={3.5} className="dot dot-b"><title>{`${MONTHS[i]}: ${v} jobs won`}</title></circle>)}
        {enquiries.map((_, i) => showLabel(i, W) && <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="chart-axis">{shortMonth(MONTHS[i])}</text>)}
      </svg>
    </div>
  );
}

function ServiceBars({ items, selected }: { items: { id: string; name: string; value: number }[]; selected: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const largest = [...items].sort((a, b) => b.value - a.value)[0];
  return (
    <ul className="hbars" aria-label={`Revenue by service line. Largest: ${largest?.name}.`}>
      {items.map((item) => (
        <li key={item.id} className={selected === "all" || selected === item.id ? undefined : "is-dim"}>
          <span className="hbar-label">{item.name}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ width: `${Math.max((item.value / max) * 100, 1)}%` }} /></span>
          <span className="hbar-value">{gbp.format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BusinessDashboard() {
  const uid = useId();
  const [month, setMonth] = useState<number | null>(null);
  const [service, setService] = useState("all");

  const byService = useMemo(() => ROWS.filter((r) => service === "all" || r.service === service), [service]);
  const inView = useMemo(() => byService.filter((r) => month === null || r.month === month), [byService, month]);
  const kpi = totals(inView);
  const previous = month !== null && month > 0 ? totals(byService.filter((r) => r.month === month - 1)) : null;

  const monthly = MONTHS.map((_, m) => totals(byService.filter((r) => r.month === m)));
  const lines = SERVICE_LINES.map((line) => ({ ...line, value: totals(ROWS.filter((r) => r.service === line.id && (month === null || r.month === month))).revenue }));

  const change = (now: number, before: number | undefined, invert = false) => {
    if (before === undefined || before === 0) return null;
    const pct = ((now - before) / before) * 100;
    const good = invert ? pct < 0 : pct > 0;
    return <span className={`kpi-change ${good ? "is-up" : "is-down"}`}>{pct > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% vs previous month</span>;
  };

  const periodLabel = month === null ? "Last 12 months" : MONTHS[month];
  const serviceLabel = service === "all" ? "All services" : SERVICE_LINES.find((s) => s.id === service)?.name;

  return (
    <div className="demo-app dashboard" aria-labelledby={`${uid}-title`}>
      <div className="demo-app-head">
        <DemoBadge kind="Illustrative data" />
        <h3 id={`${uid}-title`}>Business Performance Dashboard</h3>
        <p><strong>{BUSINESS_NAME}</strong> is a made-up business with 12 months of illustrative data. Use the filters to explore it the way an owner would.</p>
      </div>

      <div className="dash-filters">
        <label>Month
          <select value={month ?? "all"} onChange={(e) => setMonth(e.target.value === "all" ? null : Number(e.target.value))}>
            <option value="all">All 12 months</option>
            {MONTHS.map((label, i) => <option key={label} value={i}>{label}</option>)}
          </select>
        </label>
        <label>Service line
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="all">All services</option>
            {SERVICE_LINES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <p className="dash-scope" aria-live="polite">Showing: <strong>{periodLabel}</strong> · <strong>{serviceLabel}</strong></p>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><span>Revenue</span><strong>{gbp.format(kpi.revenue)}</strong>{change(kpi.revenue, previous?.revenue)}</div>
        <div className="kpi"><span>Enquiries</span><strong>{num.format(kpi.enquiries)}</strong>{change(kpi.enquiries, previous?.enquiries)}</div>
        <div className="kpi"><span>Conversion rate</span><strong>{(kpi.conversion * 100).toFixed(1)}%</strong>{change(kpi.conversion, previous?.conversion)}</div>
        <div className="kpi"><span>Average response time</span><strong>{kpi.response.toFixed(1)} hrs</strong>{change(kpi.response, previous?.response, true)}</div>
      </div>

      <div className="chart-grid-layout">
        <figure className="chart-card">
          <figcaption>Revenue by month <small>{serviceLabel}</small></figcaption>
          <RevenueBars values={monthly.map((m) => m.revenue)} selected={month} />
          <DataTable caption="Revenue by month" head={["Month", "Revenue"]} rows={monthly.map((m, i) => [MONTHS[i], gbp.format(m.revenue)])} />
        </figure>
        <figure className="chart-card">
          <figcaption>Enquiries and jobs won <small>{serviceLabel}</small></figcaption>
          <p className="chart-legend"><span className="key key-a" /> Enquiries <span className="key key-b" /> Jobs won</p>
          <EnquiryLines enquiries={monthly.map((m) => m.enquiries)} won={monthly.map((m) => m.won)} selected={month} />
          <DataTable caption="Enquiries and jobs won by month" head={["Month", "Enquiries", "Jobs won", "Conversion"]} rows={monthly.map((m, i) => [MONTHS[i], m.enquiries, m.won, `${(m.conversion * 100).toFixed(1)}%`])} />
        </figure>
        <figure className="chart-card chart-wide">
          <figcaption>Revenue by service line <small>{periodLabel}</small></figcaption>
          <ServiceBars items={lines} selected={service} />
          <DataTable caption="Revenue by service line" head={["Service line", "Revenue"]} rows={lines.map((l) => [l.name, gbp.format(l.value)])} />
        </figure>
      </div>
      <p className="demo-small">All figures are fictional and for illustration only. A real dashboard would connect to your own systems and spreadsheets.</p>
    </div>
  );
}
