import { useEffect, useMemo, useState } from 'react';
import { fetchEmsDashboard } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle } from '../theme';
import type { EmsDashboard as EmsDashboardData } from '../../../types/ems';

interface Props { tenantId: string; }

export default function EmsDashboard({ tenantId }: Props) {
  const perms = useEmsPermissions();
  const [data, setData] = useState<EmsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEmsDashboard(tenantId, onlyMine ? perms.personnelId : undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId, onlyMine, perms.personnelId]);

  const statusCount = (status: string) => data?.vialsByStatus.find(v => v.status === status)?.count ?? 0;

  const actions = useMemo(() => [
    { icon: 'bi-qr-code-scan', label: 'Scan a Vial', sub: 'Look up any med by QR or barcode', color: T.accent, show: true, onClick: () => navigateEms({ kind: 'scan' }) },
    { icon: 'bi-clipboard2-check-fill', label: 'Start New Check', sub: 'Open a card-based check workflow', color: T.green, show: perms.canPerformCheck, onClick: () => navigateEms({ kind: 'check' }) },
    { icon: 'bi-syringe', label: 'Administer', sub: 'Record dosage given to patient', color: T.red, show: perms.canAdminister, onClick: () => navigateEms({ kind: 'scan', mode: 'administer' }) },
    { icon: 'bi-droplet-half', label: 'Waste Medication', sub: 'Document wasted controlled substance', color: T.amber, show: perms.canWaste, onClick: () => navigateEms({ kind: 'scan', mode: 'waste' }) },
    { icon: 'bi-building', label: 'Manage Locations', sub: 'Units, stations and boxes', color: '#6b7280', show: perms.canManageLocations || !perms.found, onClick: () => navigateEms({ kind: 'locations' }) },
    { icon: 'bi-shield-lock', label: 'Manage Seals', sub: 'Seal stock, assigned seals and history', color: '#7c3aed', show: perms.canManageSeals || !perms.found, onClick: () => navigateEms({ kind: 'seals' }) },
    { icon: 'bi-exclamation-diamond', label: 'Discrepancies', sub: `${data?.openDiscrepanciesCount ?? 0} open issues`, color: data?.openDiscrepanciesCount ? T.red : T.muted, show: true, onClick: () => navigateEms({ kind: 'discrepancies' }) },
    { icon: 'bi-clock-history', label: 'History & Reports', sub: 'Completed checks, seal history and reports', color: '#0891b2', show: true, onClick: () => navigateEms({ kind: 'history-reports' }) },
  ].filter(a => a.show), [perms, data]);

  return (
    <div>
      <div className="row g-2 mb-3">
        <SquareStat icon="bi-capsule" label="Vials Stocked" value={statusCount('stocked') + statusCount('in-use')} color={T.accent} onClick={() => navigateEms({ kind: 'vials', filter: 'stocked' })} />
        <SquareStat icon="bi-clipboard2-check" label="Checks Due" value={data?.checksDueCount ?? 0} color={data?.checksDueCount ? T.red : T.green} onClick={() => navigateEms({ kind: 'check' })} />
        <SquareStat icon="bi-hourglass-split" label="Expiring 30d" value={data?.expiringIn30DaysCount ?? 0} color={data?.expiringIn30DaysCount ? T.amber : T.green} onClick={() => navigateEms({ kind: 'vials', filter: 'expiring' })} />
        <SquareStat icon="bi-shield-exclamation" label="Broken Seals" value={data?.brokenSealsCount ?? 0} color={data?.brokenSealsCount ? T.red : T.green} onClick={() => navigateEms({ kind: 'seals' })} />
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-lightning-fill me-2" style={{ color: T.accent }} />I Want To…</strong></div>
        <div style={{ padding: 12 }}>
          <div className="row g-2">
            {actions.map(a => <SquareAction key={a.label} {...a} />)}
          </div>
        </div>
      </div>

      <Section title="Checks Due" icon="bi bi-alarm-fill">
        {(data?.checksDue?.length ?? 0) === 0 && <EmptyText text="No checks are due right now." />}
        {(data?.checksDue ?? []).map(item => (
          <RowCard key={item.containerId} onClick={() => navigateEms({ kind: 'check' })}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.locationName}</div>
              <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.containerName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: item.isOverdue ? T.red : T.amber, fontWeight: 700 }}>{item.isOverdue ? 'Overdue' : 'Due Soon'}</div>
              <div style={{ color: T.muted, fontSize: '0.75rem' }}>{item.isSealed ? `Seal ${item.sealNumber ?? ''}` : 'Unsealed'}</div>
            </div>
          </RowCard>
        ))}
      </Section>

      <Section title="Checks Completed" icon="bi bi-check2-square">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: T.muted, fontSize: '0.8rem' }}>
          <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
          Only checks I was involved in
        </label>
        {(data?.recentCompletedChecks?.length ?? 0) === 0 && <EmptyText text="No completed checks found." />}
        {(data?.recentCompletedChecks ?? []).map(item => (
          <RowCard key={item.id} onClick={() => navigateEms({ kind: 'check-session', sessionId: item.id })}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.locationName}</div>
              <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.personnelName ?? 'Unknown'}{item.witnessName ? ` • witness ${item.witnessName}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: item.status === 'discrepancy-open' ? T.red : T.green, fontWeight: 700 }}>{item.status}</div>
              <div style={{ color: T.muted, fontSize: '0.75rem' }}>{item.itemCount} items</div>
            </div>
          </RowCard>
        ))}
      </Section>

      {loading && <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}><div className="spinner-border spinner-border-sm me-2" />Loading…</div>}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className={`${icon} me-2`} style={{ color: T.accent }} />{title}</strong></div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div style={{ color: T.muted, fontSize: '0.82rem' }}>{text}</div>;
}

function RowCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>{children}</button>;
}

function SquareStat({ icon, label, value, color, onClick }: { icon: string; label: string; value: number; color: string; onClick: () => void }) {
  return (
    <div className="col-6 col-md-3">
      <button onClick={onClick} style={{ width: '100%', aspectRatio: '1 / 1', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 6 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize: '1.5rem' }} />
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: '0.74rem', color: T.muted }}>{label}</div>
      </button>
    </div>
  );
}

function SquareAction({ icon, label, sub, color, onClick }: { icon: string; label: string; sub: string; color: string; onClick: () => void }) {
  return (
    <div className="col-6 col-md-3">
      <button onClick={onClick} style={{ width: '100%', aspectRatio: '1 / 1', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.35rem' }} />
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.text }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 4 }}>{sub}</div>
      </button>
    </div>
  );
}
