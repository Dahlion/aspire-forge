import { useEffect, useState } from 'react';
import { fetchEmsDashboard } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle } from '../theme';
import type { EmsDashboard as EmsDashboardData } from '../../../types/ems';

interface Props { tenantId: string; }

export default function EmsDashboard({ tenantId }: Props) {
  const [data, setData] = useState<EmsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const perms = useEmsPermissions();

  useEffect(() => {
    fetchEmsDashboard(tenantId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  const statusCount = (status: string) =>
    data?.vialsByStatus.find(v => v.status === status)?.count ?? 0;

  const actions = [
    { icon: 'bi-qr-code-scan',          label: 'Scan a Vial',        sub: 'Look up any med by QR or barcode',     color: T.accent,  show: true,                      onClick: () => navigateEms({ kind: 'scan' }) },
    { icon: 'bi-clipboard2-check-fill', label: 'Perform Check',      sub: 'Complete a daily drug box check',      color: T.green,   show: perms.canPerformCheck,     onClick: () => navigateEms({ kind: 'check' }) },
    { icon: 'bi-syringe',               label: 'Administer',         sub: 'Record dosage given to patient',       color: T.red,     show: perms.canAdminister,       onClick: () => navigateEms({ kind: 'scan', mode: 'administer' }) },
    { icon: 'bi-droplet-half',          label: 'Waste Medication',   sub: 'Document wasted controlled substance', color: T.amber,   show: perms.canWaste,            onClick: () => navigateEms({ kind: 'scan', mode: 'waste' }) },
    { icon: 'bi-box-arrow-in-down',     label: 'Receive Stock',      sub: 'Log incoming delivery or new vials',   color: T.violet,  show: perms.canReceive,          onClick: () => navigateEms({ kind: 'vials' }) },
    { icon: 'bi-arrow-left-right',      label: 'Move a Vial',        sub: 'Transfer vial to a new container',     color: T.cyan,    show: perms.canMove,             onClick: () => navigateEms({ kind: 'vials' }) },
    { icon: 'bi-hourglass-split',       label: 'Expiring Soon',      sub: `${data?.expiringIn30DaysCount ?? 0} vials expiring in 30 days`, color: data?.expiringIn30DaysCount ? T.amber : T.muted, show: true, badge: data?.expiringIn30DaysCount, onClick: () => navigateEms({ kind: 'vials', filter: 'expiring' }) },
    { icon: 'bi-building',              label: 'Manage Locations',   sub: 'Units, stations & drug boxes',         color: '#6b7280', show: perms.canManageLocations || !perms.found, onClick: () => navigateEms({ kind: 'locations' }) },
    { icon: 'bi-journal-medical',       label: 'Medication Catalog', sub: 'Browse & configure medications',       color: '#6b7280', show: perms.canManageCatalog || !perms.found,   onClick: () => navigateEms({ kind: 'catalog' }) },
    { icon: 'bi-people-fill',           label: 'Personnel Roster',   sub: 'Staff & license level management',     color: '#6b7280', show: perms.canManageRoster || !perms.found,    onClick: () => navigateEms({ kind: 'personnel' }) },
  ].filter(a => a.show);

  return (
    <div>
      {/* Stat cards */}
      <div className="row g-2 mb-3">
        <StatCard icon="bi-capsule"            label="Vials Stocked"  value={statusCount('stocked') + statusCount('in-use')}
          color={T.accent}
          onClick={() => navigateEms({ kind: 'vials', filter: 'stocked' })} />
        <StatCard icon="bi-clipboard2-check"   label="Checks Due"     value={data?.checksDueCount ?? 0}
          color={data?.checksDueCount ? T.red : T.green}
          onClick={() => navigateEms({ kind: 'check' })} />
        <StatCard icon="bi-hourglass-split"    label="Expiring 30d"   value={data?.expiringIn30DaysCount ?? 0}
          color={data?.expiringIn30DaysCount ? T.amber : T.green}
          onClick={() => navigateEms({ kind: 'vials', filter: 'expiring' })} />
        <StatCard icon="bi-shield-exclamation" label="Broken Seals"   value={data?.brokenSealsCount ?? 0}
          color={data?.brokenSealsCount ? T.red : T.green}
          onClick={() => navigateEms({ kind: 'locations' })} />
      </div>

      {/* I Want To… */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={cardHeaderStyle} className="px-3 py-2">
          <strong style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-lightning-fill me-2" style={{ color: T.accent }} />
            I Want To…
          </strong>
        </div>
        <div style={{ padding: '8px 10px' }}>
          <div className="row g-2">
            {actions.map(a => (
              <ActionButton key={a.label} {...a} />
            ))}
          </div>
        </div>
      </div>

      {/* Vial status summary */}
      {data && data.vialsByStatus.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2">
            <strong style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-capsule me-2" style={{ color: T.accent }} />
              Vial Status Summary
            </strong>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div className="d-flex flex-wrap gap-2">
              {data.vialsByStatus.map(s => (
                <button key={s.status} onClick={() => navigateEms({ kind: 'vials', filter: s.status })}
                  style={{
                    background: T.statusColors[s.status] ?? '#374151',
                    color: '#fff', border: 'none', borderRadius: 20,
                    padding: '5px 14px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s.count}</span>
                  {s.status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}>
          <div className="spinner-border spinner-border-sm me-2" />Loading…
        </div>
      )}

      {!loading && !perms.found && (
        <div style={{ ...cardStyle, border: `1px solid ${T.amber}`, padding: 16, fontSize: '0.82rem', color: T.muted }}>
          <i className="bi bi-info-circle me-2" style={{ color: T.amber }} />
          Your account isn't linked to a personnel record. Ask your Service Admin to add you to the roster.
        </div>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, onClick }: {
  icon: string; label: string; value: number; color: string; onClick: () => void;
}) {
  return (
    <div className="col-6">
      <button onClick={onClick} style={{
        width: '100%', background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.3rem' }} />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</span>
        </div>
        <div style={{ fontSize: '0.73rem', color: T.muted, fontWeight: 500 }}>{label}</div>
      </button>
    </div>
  );
}

// ── Action Button — 2-per-row horizontal layout ────────────────────────────────

function ActionButton({ icon, label, sub, color, onClick, badge }: {
  icon: string; label: string; sub: string; color: string;
  onClick: () => void; badge?: number;
}) {
  return (
    <div className="col-6">
      <button onClick={onClick} style={{
        width: '100%',
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        gap: 12, padding: '11px 13px', position: 'relative',
        textAlign: 'left',
      }}>
        {badge !== undefined && badge > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 8,
            background: T.red, color: '#fff',
            borderRadius: 10, fontSize: '0.62rem', fontWeight: 700,
            padding: '1px 5px', lineHeight: 1.4,
          }}>{badge}</span>
        )}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.25rem' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: T.text, lineHeight: 1.25 }}>{label}</div>
          <div style={{ fontSize: '0.71rem', color: T.muted, marginTop: 2, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
        </div>
      </button>
    </div>
  );
}
