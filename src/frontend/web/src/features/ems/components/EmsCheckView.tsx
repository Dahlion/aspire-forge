import { useEffect, useMemo, useState } from 'react';
import { fetchLocations, fetchCheckSessions, createCheckSession, fetchPersonnel, fetchChecksDue, cancelCheckSession } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedStorageLocation, MedCheckSession, MedPersonnel, CheckDueItem } from '../../../types/ems';

interface Props { tenantId: string; }
type Tab = 'new' | 'due' | 'completed';

export default function EmsCheckView({ tenantId }: Props) {
  const perms = useEmsPermissions();
  const [tab, setTab] = useState<Tab>('new');
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [personnel, setPersonnel] = useState<MedPersonnel[]>([]);
  const [completed, setCompleted] = useState<MedCheckSession[]>([]);
  const [checksDue, setChecksDue] = useState<CheckDueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MedStorageLocation | null>(null);
  const [personnelId, setPersonnelId] = useState('');
  const [witnessPersonnelId, setWitnessPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);

  const effectivePersonnelId = perms.personnelId ?? personnelId;

  async function load() {
    setLoading(true);
    try {
      const [locs, people, due, done] = await Promise.all([
        fetchLocations(tenantId),
        fetchPersonnel(tenantId),
        fetchChecksDue(tenantId),
        fetchCheckSessions(tenantId, { status: 'completed', involvedPersonnelId: onlyMine ? perms.personnelId : undefined }),
      ]);
      setLocations(locs.filter(x => x.isActive));
      setPersonnel(people.filter(x => x.isActive));
      setChecksDue(due);
      setCompleted(done);
      if (!personnelId && perms.personnelId) setPersonnelId(perms.personnelId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load().catch(console.error); }, [tenantId, onlyMine, perms.personnelId]);

  const dueLocationIds = useMemo(() => new Set(checksDue.map(x => x.locationId)), [checksDue]);

  async function doSaveDraft() {
    if (!selectedLocation || !effectivePersonnelId) return;
    setSaving(true);
    try {
      const session = await createCheckSession(tenantId, {
        storageLocationId: selectedLocation.id,
        personnelId: effectivePersonnelId,
        witnessPersonnelId: witnessPersonnelId || undefined,
        notes: notes || undefined,
        saveAsDraft: true,
      });
      setShowModal(false);
      navigateEms({ kind: 'check-session', sessionId: session.id });
    } finally { setSaving(false); }
  }

  async function doStartNow() {
    if (!selectedLocation || !effectivePersonnelId) return;
    setSaving(true);
    try {
      const session = await createCheckSession(tenantId, {
        storageLocationId: selectedLocation.id,
        personnelId: effectivePersonnelId,
        witnessPersonnelId: witnessPersonnelId || undefined,
        notes: notes || undefined,
        saveAsDraft: false,
      });
      setShowModal(false);
      navigateEms({ kind: 'check-session', sessionId: session.id });
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['new', 'due', 'completed'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ border: `1px solid ${tab === t ? T.accent : T.border}`, background: tab === t ? `${T.accent}22` : T.card, color: tab === t ? T.accent : T.text, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>{t === 'new' ? 'New Check' : t === 'due' ? 'Checks Due' : 'Checks Completed'}</button>
          ))}
        </div>
      </div>

      {tab === 'new' && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: T.accent }} />Select a Location</strong></div>
          <div style={{ padding: 12 }}>
            <div className="row g-2">
              {locations.map(loc => (
                <div className="col-6 col-md-4" key={loc.id}>
                  <button onClick={() => { setSelectedLocation(loc); setShowModal(true); }} style={{ width: '100%', aspectRatio: '1 / 1', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    {dueLocationIds.has(loc.id) && <span style={{ position: 'absolute', top: 8, right: 8, background: T.red, color: '#fff', borderRadius: 12, fontSize: '0.65rem', padding: '2px 7px', fontWeight: 700 }}>Due</span>}
                    <i className="bi bi-building" style={{ color: T.accent, fontSize: '1.45rem', marginBottom: 10 }} />
                    <div style={{ fontWeight: 700 }}>{loc.name}</div>
                    <div style={{ color: T.muted, fontSize: '0.74rem', marginTop: 4 }}>{loc.locationType}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'due' && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-alarm me-2" style={{ color: T.accent }} />Checks Due</strong></div>
          <div style={{ padding: 12 }}>
            {checksDue.length === 0 && <div style={{ color: T.muted }}>Nothing is due right now.</div>}
            {checksDue.map(item => (
              <button key={item.containerId} onClick={() => {
                const loc = locations.find(x => x.id === item.locationId) ?? null;
                setSelectedLocation(loc); setShowModal(true);
              }} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', marginBottom: 8, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.locationName}</div>
                  <div style={{ fontSize: '0.78rem', color: T.muted }}>{item.containerName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: item.isOverdue ? T.red : T.amber, fontWeight: 700 }}>{item.isOverdue ? 'Overdue' : 'Due'}</div>
                  <div style={{ fontSize: '0.74rem', color: T.muted }}>{item.isSealed ? `Seal ${item.sealNumber ?? ''}` : 'Unsealed'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'completed' && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-check2-square me-2" style={{ color: T.accent }} />Checks Completed</strong></div>
          <div style={{ padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontSize: '0.8rem', marginBottom: 10 }}>
              <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
              Only checks I was involved in
            </label>
            {completed.map(s => (
              <button key={s.id} onClick={() => navigateEms({ kind: 'check-session', sessionId: s.id })} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', marginBottom: 8, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.storageLocation?.name ?? 'Unknown location'}</div>
                  <div style={{ fontSize: '0.78rem', color: T.muted }}>{s.personnel ? `${s.personnel.firstName} ${s.personnel.lastName}` : 'Unknown'}{s.witnessPersonnel ? ` • witness ${s.witnessPersonnel.firstName} ${s.witnessPersonnel.lastName}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: s.status === 'discrepancy-open' ? T.red : T.green, fontWeight: 700 }}>{s.status}</div>
                  <div style={{ fontSize: '0.74rem', color: T.muted }}>{s.items?.length ?? 0} items</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showModal && selectedLocation && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
            <div className="modal-header" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h5 className="modal-title">Start check for {selectedLocation.name}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
            </div>
            <div className="modal-body">
              {!perms.personnelId && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>Performed By</label>
                  <select value={personnelId} onChange={e => setPersonnelId(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}>
                    <option value="">Select personnel</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>Witness</label>
                <select value={witnessPersonnelId} onChange={e => setWitnessPersonnelId(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}>
                  <option value="">No witness</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, width: '100%', minHeight: 100, padding: '10px 12px' }} />
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: `1px solid ${T.border}`, justifyContent: 'center' }}>
              <button className="btn btn-outline-light" onClick={() => setShowModal(false)}>Cancel Check</button>
              <button className="btn btn-secondary" disabled={!effectivePersonnelId || saving} onClick={doSaveDraft}>Save Draft</button>
              <button className="btn btn-primary" disabled={!effectivePersonnelId || saving} onClick={doStartNow}>Save</button>
            </div>
          </div></div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>}
    </div>
  );
}
