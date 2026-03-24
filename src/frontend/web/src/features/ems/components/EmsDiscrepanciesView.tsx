import { useEffect, useState } from 'react';
import { fetchDiscrepancies, resolveDiscrepancy } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle, btnBackStyle, inputStyle } from '../theme';
import type { MedDiscrepancy } from '../../../types/ems';

export default function EmsDiscrepanciesView({ tenantId }: { tenantId: string }) {
  const perms = useEmsPermissions();
  const [items, setItems] = useState<MedDiscrepancy[]>([]);
  const [status, setStatus] = useState('open');
  const [resolving, setResolving] = useState<MedDiscrepancy | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  async function load() {
    setItems(await fetchDiscrepancies(tenantId, status || undefined));
  }

  useEffect(() => { load().catch(console.error); }, [tenantId, status]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="open">Open</option>
          <option value="under-review">Under review</option>
          <option value="resolved">Resolved</option>
          <option value="void">Void</option>
          <option value="">All</option>
        </select>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-exclamation-diamond me-2" style={{ color: T.accent }} />Discrepancies</strong></div>
        <div style={{ padding: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.summary}</div>
                  <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.storageLocation?.name ?? 'Unknown location'}{item.container?.name ? ` • ${item.container.name}` : ''}</div>
                  {item.details && <div style={{ fontSize: '0.82rem', marginTop: 6 }}>{item.details}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><span className="badge text-bg-danger">{item.severity}</span></div>
                  <div style={{ color: T.muted, fontSize: '0.74rem', marginTop: 6 }}>{item.status}</div>
                </div>
              </div>
              {item.status !== 'resolved' && perms.canResolveDiscrepancies && perms.personnelId && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-sm btn-outline-light" onClick={() => { setResolving(item); setResolutionNotes(''); }}>Resolve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {resolving && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
            <div className="modal-header" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h5 className="modal-title">Resolve Discrepancy</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setResolving(null)} />
            </div>
            <div className="modal-body">
              <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} style={{ ...inputStyle, width: '100%', minHeight: 120, padding: '10px 12px' }} placeholder="Resolution notes" />
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline-light" onClick={() => setResolving(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await resolveDiscrepancy(tenantId, resolving.id, { resolvedByPersonnelId: perms.personnelId!, resolutionNotes });
                setResolving(null);
                await load();
              }}>Resolve</button>
            </div>
          </div></div>
        </div>
      )}
    </div>
  );
}
