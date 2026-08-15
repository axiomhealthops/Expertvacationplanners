'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveBuild, type SaveResult } from './actions';
import {
  CATEGORIES,
  computeQuote,
  lineTotal,
  money,
  money2,
  num,
  type PricingConfig,
  type QuoteItem,
} from '../../../../utils/pricing';

type Row = QuoteItem & { key: string; id?: string };

let seq = 0;
const newKey = () => `new-${seq++}`;

function blankRow(): Row {
  return {
    key: newKey(),
    category: 'Lodging',
    description: '',
    detail: '',
    qty: 1,
    unit_price: 0,
    is_optional: false,
  };
}

export default function Builder({
  trip,
  items,
  pricing,
}: {
  trip: any;
  items: any[];
  pricing: PricingConfig;
}) {
  const [rows, setRows] = useState<Row[]>(
    items.length
      ? items.map((it) => ({
          key: String(it.id),
          id: String(it.id),
          category: it.category || 'Other',
          description: it.description || '',
          detail: it.detail || '',
          qty: it.qty ?? 1,
          unit_price: it.unit_price ?? 0,
          is_optional: !!it.is_optional,
        }))
      : [blankRow()]
  );

  const [people, setPeople] = useState(String(trip.planned_travelers ?? 0));
  const [start, setStart] = useState(trip.start_date || '');
  const [end, setEnd] = useState(trip.end_date || '');
  const [fee, setFee] = useState(String(trip.evp_fee ?? 0));
  const [depositPct, setDepositPct] = useState(String(trip.deposit_pct ?? 25));
  const [summary, setSummary] = useState(trip.summary || '');
  const [quoteNotes, setQuoteNotes] = useState(trip.quote_notes || '');

  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, startTransition] = useTransition();

  const q = useMemo(
    () =>
      computeQuote(rows, pricing, {
        people: num(people),
        start,
        end,
        fee: num(fee),
        depositPct: num(depositPct),
      }),
    [rows, pricing, people, start, end, fee, depositPct]
  );

  function patch(key: string, field: keyof QuoteItem, value: any) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? [blankRow()] : prev.filter((r) => r.key !== key)));
  }

  function move(key: string, dir: -1 | 1) {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    setResult(null);
    startTransition(async () => {
      const res = await saveBuild(trip.id, trip.slug, {
        summary,
        quote_notes: quoteNotes,
        evp_fee: num(fee),
        deposit_pct: num(depositPct),
        planned_travelers: num(people),
        start_date: start || null,
        end_date: end || null,
        items: rows.map((r) => ({
          id: r.id || null,
          category: r.category,
          description: r.description,
          detail: r.detail,
          qty: num(r.qty),
          unit_price: num(r.unit_price),
          is_optional: !!r.is_optional,
        })),
      });
      setResult(res);
    });
  }

  return (
    <div className="tb">
      {result && (
        <div className={result.ok ? 'ok' : 'err'}>
          <b>{result.message}</b>
          {result.errors?.length ? (
            <ul className="tb-errs">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="tb-grid">
        {/* ---------------------------------------------------------------- */}
        <div>
          <div className="panel">
            <div className="h2row">
              <h2>Trip</h2>
              <span className="hint">drives the fee estimate</span>
            </div>
            <div className="tb-fields">
              <label>
                Travelers
                <input className="mono" value={people} onChange={(e) => setPeople(e.target.value)} inputMode="numeric" />
              </label>
              <label>
                Start
                <input type="date" value={start || ''} onChange={(e) => setStart(e.target.value)} />
              </label>
              <label>
                End
                <input type="date" value={end || ''} onChange={(e) => setEnd(e.target.value)} />
              </label>
              <label>
                Deposit %
                <input className="mono" value={depositPct} onChange={(e) => setDepositPct(e.target.value)} inputMode="numeric" />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="h2row">
              <h2>Line Items</h2>
              <span className="hint">
                {q.days} day{q.days === 1 ? '' : 's'} · {q.vendors} vendor{q.vendors === 1 ? '' : 's'}
              </span>
            </div>

            <div className="tb-head">
              <span>Category</span>
              <span>Description</span>
              <span className="r">Qty</span>
              <span className="r">Unit</span>
              <span className="r">Total</span>
              <span />
            </div>

            {rows.map((r, i) => (
              <div className={'tb-row' + (r.is_optional ? ' opt' : '')} key={r.key}>
                <select value={r.category} onChange={(e) => patch(r.key, 'category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="tb-desc">
                  <input
                    placeholder="What the client is buying"
                    value={r.description || ''}
                    onChange={(e) => patch(r.key, 'description', e.target.value)}
                  />
                  <input
                    className="sub"
                    placeholder="Detail shown under the line (optional)"
                    value={r.detail || ''}
                    onChange={(e) => patch(r.key, 'detail', e.target.value)}
                  />
                </div>

                <input
                  className="mono r"
                  value={String(r.qty ?? '')}
                  onChange={(e) => patch(r.key, 'qty', e.target.value)}
                  inputMode="decimal"
                />
                <input
                  className="mono r"
                  value={String(r.unit_price ?? '')}
                  onChange={(e) => patch(r.key, 'unit_price', e.target.value)}
                  inputMode="decimal"
                />
                <span className="mono r tb-total">{money2(lineTotal(r))}</span>

                <div className="tb-ctl">
                  <label className="tb-opt" title="Optional add-on, quoted but not in the total">
                    <input
                      type="checkbox"
                      checked={!!r.is_optional}
                      onChange={(e) => patch(r.key, 'is_optional', e.target.checked)}
                    />
                    opt
                  </label>
                  <button type="button" onClick={() => move(r.key, -1)} disabled={i === 0} aria-label="Move up">
                    {'↑'}
                  </button>
                  <button
                    type="button"
                    onClick={() => move(r.key, 1)}
                    disabled={i === rows.length - 1}
                    aria-label="Move down"
                  >
                    {'↓'}
                  </button>
                  <button type="button" onClick={() => removeRow(r.key)} aria-label="Remove line">
                    {'×'}
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="btn ghost sm" onClick={addRow}>
              Add line
            </button>
          </div>

          <div className="panel">
            <div className="h2row">
              <h2>Quote Copy</h2>
              <span className="hint">reads on the client-facing quote</span>
            </div>
            <label className="tb-block">
              Summary
              <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </label>
            <label className="tb-block">
              Notes / terms
              <textarea rows={3} value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} />
            </label>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        <aside className="tb-side">
          <div className="panel">
            <div className="h2row">
              <h2>Quote</h2>
            </div>
            <div className="tb-line">
              <span>Vendor cost</span>
              <b className="mono">{money(q.included)}</b>
            </div>
            <div className="tb-line">
              <span>EVP fee</span>
              <b className="mono">{money(q.fee)}</b>
            </div>
            <div className="tb-line tot">
              <span>Client total</span>
              <b className="mono">{money(q.clientTotal)}</b>
            </div>
            <div className="tb-line">
              <span>Per person</span>
              <b className="mono">{q.people ? money2(q.perPerson) : '--'}</b>
            </div>
            <div className="tb-line">
              <span>Deposit ({Math.round(num(depositPct))}%)</span>
              <b className="mono">{money(q.deposit)}</b>
            </div>
            <div className="tb-line">
              <span>Balance</span>
              <b className="mono">{money(q.balance)}</b>
            </div>
            {q.optional > 0 && (
              <div className="tb-line opt-note">
                <span>Optional add-ons</span>
                <b className="mono">{money(q.optional)}</b>
              </div>
            )}
            <div className="tb-take">
              Take rate <b className="mono">{q.takeRate.toFixed(1)}%</b>
            </div>
          </div>

          <div className="panel">
            <div className="h2row">
              <h2>Fee Models</h2>
            </div>
            <p className="hint tb-hint">Applies the amount to this trip. Nothing is applied automatically.</p>
            {q.options.map((o) => (
              <div className={'tb-fee' + (num(fee) === o.amount ? ' on' : '')} key={o.key}>
                <div>
                  <div className="tb-fee-l">{o.label}</div>
                  <div className="tb-fee-n">{o.note}</div>
                </div>
                <div className="tb-fee-r">
                  <b className="mono">{money(o.amount)}</b>
                  <button type="button" className="btn ghost sm" onClick={() => setFee(String(o.amount))}>
                    Apply
                  </button>
                </div>
              </div>
            ))}
            <label className="tb-block">
              EVP fee applied
              <input className="mono" value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" />
            </label>
          </div>

          <div className="panel tb-save">
            <button type="button" className="btn" onClick={save} disabled={pending}>
              {pending ? 'Saving...' : 'Save trip'}
            </button>
            <a className="btn ghost" href="/trips">
              Back to trips
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
