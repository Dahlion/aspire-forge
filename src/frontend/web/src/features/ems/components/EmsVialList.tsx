import { useEffect, useState } from 'react';
import { fetchVials, fetchLocations } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, btnBackStyle, inputStyle } from '../theme';
import type { MedVial, MedStorageLocation } from '../../../types/ems';

interface Props { tenantId: string; filter?: string; }

const STATUSES = ['ordered', 'received', 'stocked', 'in-use', 'administered', 'wasted', 'disposed', 'expired'];

export default function EmsVialList({ tenantId, filter: initialFilter }: Props) {
  const [vials, setVials] = useState<MedVial[]>([]);
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    initialFilter && STATUSES.includes(initialFilter) ? initialFilter : 'active'
  );
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchLocations(tenantId).then(setLocations).catch(console.error);
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter === 'expiring') {
      params.filter = 'expiring';
    } else if (statusFilter === 'active') {
      params.filter = 'active';
    } else if (statusFilter !== 'all' && statusFilter) {
      params.status = statusFilter;
    }
    if (locationFilter) params.locationId = locationFilter;
    fetchVials(tenantId, params as any)
      .then(setVials)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId, statusFilter, locationFilter]);

  const filtered = vials.filter(v => {
    if (!search) return true;
    const s = search.toLowerCase();
    return v.medication?.genericName.toLowerCase().includes(s) ||
           v.lotNumber.toLowerCase().includes(s) ||
           v.agencyLabelCode?.toLowerCase().includes(s) ||
           v.container?.storageLocation?.name.toLowerCase().includes(s) ||
           false;
  });

  const filterOptions = [
    { value: 'active',       label: 'Active',       color: T.accent },
    { value: 'ordered',      label: 'Ordered',      color: '#6b7280' },
    { value: 'received',     label: 'Received',     color: '#0891b2' },
    { value: 'stocked',      label: 'Stocked',      color: '#2563eb' },
    { value: 'in-use',       label: 'In Use',       color: '#d97706' },
    { value: 'expiring',     label: 'Expiring',     color: T.amber },
    { value: 'administered', label: 'Administered', color: '#16a34a' },
    { value: 'wasted',       label: 'Wasted',       color: '#374151' },
    { value: 'disposed',     label: 'Disposed',     color: '#4b5563' },
    { value: 'expired',      label: 'Expired',      color: T.red },
    { value: 'all',          label: 'All',          color: T.muted },
  ];

  const activeOption = filterOptions.find(f => f.value === statusFilter);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 className="mb-0 fw-bold flex-grow-1" style={{ color: T.text }}>
          <i className="bi bi-capsule me-2" style={{ color: T.accent }} />
          Vials
          {filtered.length > 0 && <span style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 400, marginLeft: 8 }}>({filtered.length})</span>}
        </h5>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <span style={{ background: T.card, border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '0 12px', display: 'flex', alignItems: 'center', color: T.muted }}>
          <i className="bi bi-search" />
        </span>
        <input
          style={{ ...inputStyle, flex: 1, padding: '10px 12px', borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
          placeholder="Search medication, lot #, code, location…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, scrollbarWidth: 'none' }}>
        {filterOptions.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            style={{
              flexShrink: 0,
              background: statusFilter === f.value ? f.color : T.card,
              border: `1px solid ${statusFilter === f.value ? f.color : T.border}`,
              color: statusFilter === f.value ? '#fff' : T.muted,
              borderRadius: 20, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Location filter */}
      {locations.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <select
            style={{ ...inputStyle, width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
            value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name} ({loc.locationType})</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
          <i className="bi bi-capsule" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <div className="mt-2">No vials match this filter.</div>
          {statusFilter !== 'all' && (
            <button onClick={() => setStatusFilter('all')}
              style={{ marginTop: 12, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, padding: '6px 16px', cursor: 'pointer', fontSize: '0.82rem' }}>
              Show all vials
            </button>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map(v => <VialCard key={v.id} vial={v} />)}
        </div>
      )}
    </div>
  );
}

function VialCard({ vial }: { vial: MedVial }) {
  const statusColor = T.statusColors[vial.status] ?? '#6b7280';
  const expiring = vial.expiresAt && new Date(vial.expiresAt) < new Date(Date.now() + 30 * 86400000);
  const expired = vial.expiresAt && new Date(vial.expiresAt) < new Date();

  return (
    <button
      onClick={() => navigateEms({ kind: 'vial', vialId: vial.id })}
      style={{ ...cardStyle, width: '100%', textAlign: 'left', cursor: 'pointer', padding: '11px 14px', display: 'block' }}
    >
      <div className="d-flex align-items-start justify-content-between">
        <div className="flex-grow-1">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>{vial.medication?.genericName}</div>
          <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 1 }}>
            Lot: {vial.lotNumber}
            {vial.agencyLabelCode && <span style={{ marginLeft: 8 }}>Code: {vial.agencyLabelCode}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: 10, flexShrink: 0 }}>
          <span style={{ background: statusColor, color: '#fff', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, padding: '2px 9px', display: 'inline-block' }}>
            {vial.status}
          </span>
          <div style={{ fontSize: '0.73rem', color: T.muted, marginTop: 3 }}>
            {vial.remainingVolumeMl} / {vial.totalVolumeMl} mL
          </div>
        </div>
      </div>
      <div className="d-flex gap-3 mt-1 flex-wrap" style={{ fontSize: '0.73rem', color: T.muted }}>
        {vial.container?.storageLocation && (
          <span><i className="bi bi-geo-alt me-1" />{vial.container.storageLocation.name} → {vial.container.name}</span>
        )}
        {vial.expiresAt && (
          <span style={{ color: expired ? T.red : expiring ? T.amber : T.muted, fontWeight: (expired || expiring) ? 700 : undefined }}>
            <i className="bi bi-calendar-x me-1" />
            {new Date(vial.expiresAt).toLocaleDateString()}
            {expired && ' ⚠ EXPIRED'}
            {!expired && expiring && ' ⚠ Soon'}
          </span>
        )}
      </div>
    </button>
  );
}
