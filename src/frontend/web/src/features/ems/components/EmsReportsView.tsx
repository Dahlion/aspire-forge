import { useState } from 'react';
import { fetchReportVialUsage, fetchReportWasteLog, fetchReportCheckCompliance, fetchReportExpiry, fetchReportInventory } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';

interface Props { tenantId: string; }

type ReportTab = 'vial-usage' | 'waste-log' | 'compliance' | 'expiry' | 'inventory';

export default function EmsReportsView({ tenantId }: Props) {
  const [tab, setTab] = useState<ReportTab>('vial-usage');

  const tabs: { key: ReportTab; label: string; icon: string }[] = [
    { key: 'vial-usage', label: 'Vial Usage', icon: 'bi-syringe' },
    { key: 'waste-log', label: 'Waste Log', icon: 'bi-droplet-half' },
    { key: 'compliance', label: 'Check Compliance', icon: 'bi-clipboard-check' },
    { key: 'expiry', label: 'Expiry', icon: 'bi-calendar-x' },
    { key: 'inventory', label: 'Inventory', icon: 'bi-boxes' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 style={{ margin: 0, flex: 1, color: T.text, fontWeight: 700 }}>
          <i className="bi bi-bar-chart-fill me-2" style={{ color: T.accent }} />Reports
        </h5>
      </div>

      {/* Tab bar — horizontal scroll */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flexShrink: 0, background: tab === t.key ? T.accent : T.card,
              border: `1px solid ${tab === t.key ? T.accent : T.border}`,
              color: tab === t.key ? '#fff' : T.muted,
              borderRadius: 20, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
            <i className={`bi ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'vial-usage'  && <VialUsageReport tenantId={tenantId} />}
      {tab === 'waste-log'   && <WasteLogReport tenantId={tenantId} />}
      {tab === 'compliance'  && <ComplianceReport tenantId={tenantId} />}
      {tab === 'expiry'      && <ExpiryReport tenantId={tenantId} />}
      {tab === 'inventory'   && <InventoryReport tenantId={tenantId} />}
    </div>
  );
}

/* ──────────── Date range picker helper ──────────── */
function DateRange({ from, to, onFrom, onTo, onRun, loading }: {
  from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void;
  onRun: () => void; loading: boolean;
}) {
  return (
    <div style={{ ...cardStyle, padding: 14, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={{ color: T.muted, fontSize: '0.75rem', display: 'block', marginBottom: 3 }}>From</label>
        <input type="date" style={{ ...inputStyle, width: '100%', padding: '7px 10px' }} value={from} onChange={e => onFrom(e.target.value)} />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={{ color: T.muted, fontSize: '0.75rem', display: 'block', marginBottom: 3 }}>To</label>
        <input type="date" style={{ ...inputStyle, width: '100%', padding: '7px 10px' }} value={to} onChange={e => onTo(e.target.value)} />
      </div>
      <button onClick={onRun} disabled={loading}
        style={{ background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
        {loading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-play-fill me-1" />Run</>}
      </button>
    </div>
  );
}

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

/* ──────────── Vial Usage ──────────── */
function VialUsageReport({ tenantId }: { tenantId: string }) {
  const [from, setFrom] = useState(defaultRange().from);
  const [to, setTo] = useState(defaultRange().to);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    try { setData(await fetchReportVialUsage(tenantId, from, to)); setRan(true); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <>
      <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} onRun={run} loading={loading} />
      {ran && data.length === 0 && <EmptyState label="No administration events in this period." />}
      {data.map((row: any) => (
        <div key={row.medicationId} style={{ ...cardStyle, marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>{row.genericName}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: T.muted }}>
            <span><i className="bi bi-hash me-1" /><strong style={{ color: T.text }}>{row.administrationCount}</strong> administrations</span>
            <span><i className="bi bi-droplet me-1" /><strong style={{ color: T.text }}>{row.totalMlAdministered?.toFixed(2)}</strong> mL total</span>
          </div>
        </div>
      ))}
    </>
  );
}

/* ──────────── Waste Log ──────────── */
function WasteLogReport({ tenantId }: { tenantId: string }) {
  const [from, setFrom] = useState(defaultRange().from);
  const [to, setTo] = useState(defaultRange().to);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    try { setData(await fetchReportWasteLog(tenantId, from, to)); setRan(true); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <>
      <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} onRun={run} loading={loading} />
      {ran && data.length === 0 && <EmptyState label="No waste events in this period." />}
      {data.map((row: any, i: number) => (
        <div key={i} style={{ ...cardStyle, marginBottom: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: '0.9rem' }}>{row.genericName}</div>
              <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 2 }}>
                {row.amountMl} mL · {row.personnelName ?? 'Unknown'}
                {row.witnessName && <> · Witness: {row.witnessName}</>}
              </div>
              {row.notes && <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 2, fontStyle: 'italic' }}>{row.notes}</div>}
            </div>
            <span style={{ fontSize: '0.72rem', color: T.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>
              {new Date(row.occurredAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

/* ──────────── Check Compliance ──────────── */
function ComplianceReport({ tenantId }: { tenantId: string }) {
  const [from, setFrom] = useState(defaultRange().from);
  const [to, setTo] = useState(defaultRange().to);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    try { setData(await fetchReportCheckCompliance(tenantId, from, to)); setRan(true); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <>
      <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} onRun={run} loading={loading} />
      {ran && data.length === 0 && <EmptyState label="No check sessions in this period." />}
      {data.map((row: any) => {
        const pct = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
        const color = pct >= 90 ? T.green : pct >= 70 ? T.amber : T.red;
        return (
          <div key={row.locationId} style={{ ...cardStyle, marginBottom: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: T.text }}>{row.locationName}</div>
              <span style={{ color, fontWeight: 700, fontSize: '1.1rem' }}>{pct}%</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 8 }}>
              {row.completed} / {row.total} sessions completed · {row.aborted ?? 0} aborted
            </div>
            <div style={{ height: 8, background: T.input, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ──────────── Expiry ──────────── */
function ExpiryReport({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try { setData(await fetchReportExpiry(tenantId)); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  const groups = [
    { key: 'expired',  label: 'Expired',            color: T.red },
    { key: 'critical', label: 'Critical (≤7 days)',  color: '#f97316' },
    { key: 'warning',  label: 'Warning (≤30 days)',  color: T.amber },
    { key: 'ok',       label: 'OK',                  color: T.green },
  ];

  return (
    <>
      <div style={{ ...cardStyle, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={run} disabled={loading}
          style={{ background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
          {loading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-play-fill me-1" />Run</>}
        </button>
      </div>

      {data && groups.map(g => {
        const rows: any[] = data[g.key] ?? [];
        return (
          <div key={g.key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: g.color, display: 'inline-block' }} />
              <span style={{ fontWeight: 700, color: T.text, fontSize: '0.88rem' }}>{g.label}</span>
              <span style={{ background: g.color, color: '#fff', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px' }}>{rows.length}</span>
            </div>
            {rows.length === 0 && <div style={{ color: T.muted, fontSize: '0.8rem', marginLeft: 20 }}>None</div>}
            {rows.map((row: any) => (
              <div key={row.vialId} style={{ ...cardStyle, padding: 10, marginBottom: 6, marginLeft: 8, border: `1px solid ${g.color}` }}>
                <div style={{ fontWeight: 600, color: T.text, fontSize: '0.88rem' }}>{row.genericName}</div>
                <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 2 }}>
                  Lot: {row.lotNumber} · {row.locationName} → {row.containerName}
                  {row.expiresAt && <> · Exp: {new Date(row.expiresAt).toLocaleDateString()}</>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

/* ──────────── Inventory ──────────── */
function InventoryReport({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    try { setData(await fetchReportInventory(tenantId)); setRan(true); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <>
      <div style={{ ...cardStyle, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={run} disabled={loading}
          style={{ background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
          {loading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-play-fill me-1" />Run</>}
        </button>
      </div>

      {ran && data.length === 0 && <EmptyState label="No active inventory found." />}
      {data.map((row: any) => (
        <div key={row.medicationId} style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontWeight: 700, color: T.text }}>{row.genericName}</div>
            <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 2 }}>
              <strong style={{ color: T.text }}>{row.totalVials}</strong> vials ·
              <strong style={{ color: T.text }}> {row.totalVolumeMl?.toFixed(2)}</strong> mL total
            </div>
          </div>
          {(row.locations ?? []).map((loc: any) => (
            <div key={loc.locationId} style={{ padding: '6px 14px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '0.8rem', color: T.muted }}>
                <i className="bi bi-geo-alt me-1" />
                <span style={{ color: T.text, fontWeight: 600 }}>{loc.locationName}</span>
                <span style={{ marginLeft: 8 }}>{loc.vialCount} vials · {loc.volumeMl?.toFixed(2)} mL</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
      <i className="bi bi-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
      <div style={{ marginTop: 8 }}>{label}</div>
    </div>
  );
}
