// Quote + fee math for the Trip Builder.
//
// Pure functions only, no Supabase and no React, so the same numbers can be
// used by the builder, the printable quote and any future server-side PDF.
//
// The shape of PricingConfig mirrors pricing_settings.config in the database.
// The live row reads:
//   { model: 'hybrid', base: 500, perPerson: 25, perDay: 75, perVendor: 75,
//     floor: 750, roundTo: 25, targetPct: 15, flatPerPerson: 50,
//     tiers: [ {upTo: 10000, pct: 18}, {upTo: 25000, pct: 15}, {upTo: 1e12, pct: 12} ] }

export type PricingTier = { upTo: number; pct: number };

export type PricingConfig = {
  model?: string;
  base?: number;
  perPerson?: number;
  perDay?: number;
  perVendor?: number;
  floor?: number;
  roundTo?: number;
  targetPct?: number;
  flatPerPerson?: number;
  tiers?: PricingTier[];
};

// Used only when pricing_settings has no row. Matches the live config so a
// fresh environment prices the same way production does.
export const DEFAULT_PRICING: PricingConfig = {
  model: 'hybrid',
  base: 500,
  perPerson: 25,
  perDay: 75,
  perVendor: 75,
  floor: 750,
  roundTo: 25,
  targetPct: 15,
  flatPerPerson: 50,
  tiers: [
    { upTo: 10000, pct: 18 },
    { upTo: 25000, pct: 15 },
    { upTo: 1e12, pct: 12 },
  ],
};

export const CATEGORIES = [
  'Lodging',
  'Air',
  'Ground',
  'Activity',
  'Dining',
  'Event',
  'Insurance',
  'Other',
];

export type QuoteItem = {
  id?: string;
  sort?: number;
  category?: string;
  description?: string;
  detail?: string;
  qty?: number | string;
  unit_price?: number | string;
  is_optional?: boolean;
};

// ---------------------------------------------------------------------------
// primitives
// ---------------------------------------------------------------------------

export function num(v: any): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function money(n: number): string {
  const v = Math.round(num(n));
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US');
}

export function money2(n: number): string {
  return '$' + num(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function roundTo(value: number, step: number): number {
  const s = num(step);
  if (s <= 0) return num(value);
  return Math.round(num(value) / s) * s;
}

export function lineTotal(item: QuoteItem): number {
  return num(item.qty) * num(item.unit_price);
}

/** Nights between two ISO dates, floored at 1 so a same-day trip still prices. */
export function tripDays(start?: string | null, end?: string | null): number {
  if (!start || !end) return 1;
  const a = Date.parse(String(start));
  const b = Date.parse(String(end));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  const days = Math.round((b - a) / 86400000);
  return Math.max(1, days);
}

/** Distinct categories in play, used as the vendor-count proxy for the fee. */
export function vendorCount(items: QuoteItem[]): number {
  const set = new Set<string>();
  for (const it of items) {
    const c = String(it.category || 'Other').trim();
    if (c) set.add(c);
  }
  return Math.max(1, set.size);
}

// ---------------------------------------------------------------------------
// totals
// ---------------------------------------------------------------------------

export type QuoteTotals = {
  included: number;   // non-optional vendor cost
  optional: number;   // optional add-ons, quoted but not counted in the total
  vendorCost: number; // === included
  people: number;
  days: number;
  vendors: number;
};

export function quoteTotals(
  items: QuoteItem[],
  opts: { people?: number; start?: string | null; end?: string | null } = {}
): QuoteTotals {
  let included = 0;
  let optional = 0;
  for (const it of items) {
    const t = lineTotal(it);
    if (it.is_optional) optional += t;
    else included += t;
  }
  return {
    included,
    optional,
    vendorCost: included,
    people: Math.max(0, Math.round(num(opts.people))),
    days: tripDays(opts.start, opts.end),
    vendors: vendorCount(items),
  };
}

// ---------------------------------------------------------------------------
// fee models
//
// The spec (EVP_SYSTEM.md section 1.5) describes the house model as
// "hybrid (base + per-person + per-day + per-vendor) anchored ~15%, compared vs
// %-of-cost / tiered / per-person". The three comparison models exist to sanity
// check the hybrid number, not to be applied automatically.
// ---------------------------------------------------------------------------

export function hybridFee(cfg: PricingConfig, t: { people: number; days: number; vendors: number }): number {
  const raw =
    num(cfg.base) +
    num(cfg.perPerson) * t.people +
    num(cfg.perDay) * t.days +
    num(cfg.perVendor) * t.vendors;
  return roundTo(Math.max(raw, num(cfg.floor)), num(cfg.roundTo));
}

export function pctOfCostFee(cfg: PricingConfig, vendorCost: number): number {
  return roundTo((vendorCost * num(cfg.targetPct)) / 100, num(cfg.roundTo));
}

export function tieredFee(cfg: PricingConfig, vendorCost: number): number {
  const tiers = (cfg.tiers || []).slice().sort((a, b) => num(a.upTo) - num(b.upTo));
  const hit = tiers.find((t) => vendorCost <= num(t.upTo)) || tiers[tiers.length - 1];
  if (!hit) return 0;
  return roundTo((vendorCost * num(hit.pct)) / 100, num(cfg.roundTo));
}

export function perPersonFee(cfg: PricingConfig, people: number): number {
  return roundTo(num(cfg.flatPerPerson) * people, num(cfg.roundTo));
}

export type FeeOption = { key: string; label: string; amount: number; note: string };

export function feeOptions(cfg: PricingConfig, t: QuoteTotals): FeeOption[] {
  return [
    {
      key: 'hybrid',
      label: 'Hybrid',
      amount: hybridFee(cfg, t),
      note: `${money(num(cfg.base))} base + ${money(num(cfg.perPerson))}/person + ${money(num(cfg.perDay))}/day + ${money(num(cfg.perVendor))}/vendor`,
    },
    {
      key: 'pct',
      label: 'Percent of cost',
      amount: pctOfCostFee(cfg, t.vendorCost),
      note: `${num(cfg.targetPct)}% of ${money(t.vendorCost)}`,
    },
    {
      key: 'tiered',
      label: 'Tiered',
      amount: tieredFee(cfg, t.vendorCost),
      note: 'rate steps down as trip cost rises',
    },
    {
      key: 'perPerson',
      label: 'Per person',
      amount: perPersonFee(cfg, t.people),
      note: `${money(num(cfg.flatPerPerson))} x ${t.people} traveler${t.people === 1 ? '' : 's'}`,
    },
  ];
}

/** Effective take rate: fee as a share of what the client pays in total. */
export function takeRate(fee: number, vendorCost: number): number {
  const total = num(fee) + num(vendorCost);
  if (total <= 0) return 0;
  return (num(fee) / total) * 100;
}

export function perPersonPrice(total: number, people: number): number {
  const p = Math.max(0, Math.round(num(people)));
  if (p <= 0) return 0;
  return num(total) / p;
}

// ---------------------------------------------------------------------------
// one call the UI can use for every figure on screen
// ---------------------------------------------------------------------------

export function computeQuote(
  items: QuoteItem[],
  cfg: PricingConfig,
  opts: { people?: number; start?: string | null; end?: string | null; fee?: number; depositPct?: number }
) {
  const totals = quoteTotals(items, opts);
  const fee = num(opts.fee);
  const clientTotal = totals.included + fee;
  const depositPct = num(opts.depositPct);
  return {
    ...totals,
    fee,
    clientTotal,
    perPerson: perPersonPrice(clientTotal, totals.people),
    takeRate: takeRate(fee, totals.vendorCost),
    deposit: (clientTotal * depositPct) / 100,
    balance: clientTotal - (clientTotal * depositPct) / 100,
    options: feeOptions(cfg, totals),
  };
}
