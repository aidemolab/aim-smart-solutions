// Illustrative data for a fictional UK home services business. Generated from a
// fixed seed so every visitor sees the same numbers. Not real results.

export const BUSINESS_NAME = "Brightwell Home Services (fictional)";

export const MONTHS = ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026"];

type Line = { id: string; name: string; baseEnquiries: number; season: number[]; conversion: number; jobValue: number; responseHours: number };

const LINES: Line[] = [
  { id: "boiler", name: "Boiler servicing", baseEnquiries: 46, season: [1.35, 1.45, 1.5, 1.3, 1.05, 0.85, 0.7, 0.6, 0.6, 0.7, 0.95, 1.2], conversion: 0.58, jobValue: 95, responseHours: 5 },
  { id: "plumbing", name: "Plumbing repairs", baseEnquiries: 38, season: [1.05, 1.15, 1.2, 1.1, 1, 0.95, 0.9, 0.9, 0.95, 0.95, 1, 1.05], conversion: 0.47, jobValue: 180, responseHours: 7 },
  { id: "bathroom", name: "Bathroom fitting", baseEnquiries: 12, season: [0.8, 0.55, 0.9, 1, 1.15, 1.25, 1.3, 1.2, 1.05, 0.95, 1.05, 0.9], conversion: 0.22, jobValue: 5400, responseHours: 20 },
  { id: "emergency", name: "Emergency call-outs", baseEnquiries: 24, season: [1.3, 1.6, 1.55, 1.3, 1, 0.8, 0.7, 0.65, 0.7, 0.75, 0.95, 1.15], conversion: 0.81, jobValue: 140, responseHours: 1.5 },
];

// Small deterministic random number generator (mulberry32).
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Row = { month: number; service: string; enquiries: number; won: number; revenue: number; responseHours: number };

export const SERVICE_LINES = LINES.map(({ id, name }) => ({ id, name }));

export const ROWS: Row[] = (() => {
  const rand = seeded(20261022);
  const jitter = (spread: number) => 1 + (rand() * 2 - 1) * spread;
  const rows: Row[] = [];
  MONTHS.forEach((_, month) => {
    for (const line of LINES) {
      const enquiries = Math.max(1, Math.round(line.baseEnquiries * line.season[month] * jitter(0.12)));
      const won = Math.max(0, Math.round(enquiries * line.conversion * jitter(0.15)));
      const revenue = Math.round(won * line.jobValue * jitter(0.1));
      const responseHours = Math.round(line.responseHours * jitter(0.25) * 10) / 10;
      rows.push({ month, service: line.id, enquiries, won, revenue, responseHours });
    }
  });
  return rows;
})();
