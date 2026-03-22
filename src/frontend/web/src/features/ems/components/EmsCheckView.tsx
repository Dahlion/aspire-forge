import { useEffect, useState } from 'react';
import { fetchLocations, fetchCheckSessions, createCheckSession, fetchPersonnel } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, cardHeaderStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedStorageLocation, MedCheckSession, MedPersonnel } from '../../../types/ems';

interface Props { tenantId: string; }

type Tab = 'new' | 'history' | 'schedule';

export default function EmsCheckView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('new');
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [inProgress, setInProgress] = useState<MedCheckSession[]>([]);
  const [history, setHistory] = useState<MedCheckSession[]>([]);
  const [personnel, setPersonnel] = useState<MedPersonnel[]>([]);
  const [selectedLoc, setSelectedLoc] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [witnessId, setWitnessId] = useState('');
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchLocations(tenantId),
      fetchCheckSessions(tenantId, { status: 'in-progress' }),
      fetchPersonnel(tenantId, true),
    ]).then(([locs, sess, pers]) => {
      setLocations(locs); setInProgress(sess); setPersonnel(pers);
    }).catch(console.error).finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    if (tab === 'history' && history.length === 0) {
      setHistoryLoading(true);
      fetchCheckSessions(tenantId, { status: 'completed' })
        .then(setHistory)
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [tab, tenantId]);

  async function startCheck() {
    if (!selectedLoc || !personnelId) return;
    setStarting(true);
    try {
      const s = await createCheckSession(tenantId, {
        storageLocationId: selectedLoc,
        personnelId,
        witnessPersonnelId: witnessId || undefined,
      });
      navigateEms({ kind: 'check-session', sessionId: s.id });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 className="mb-0 fw-bold" style={{ color: T.text }}>
          <i className="bi bi-clipboard2-check-fill me-2" style={{ color: T.accent }} />Drug Checks
        </h5>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
        {([['new', 'Start / Active'], ['schedule', 'Schedule'], ['history', 'History']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', padding: '8px 18px', cursor: 'pointer',
              color: tab === t ? T.accent : T.muted,
              borderBottom: tab === t ? `2px solid ${T.accent}` : '2px solid transparent',
              fontWeight: tab === t ? 700 : 400, fontSize: '0.88rem', marginBottom: -1,
            }}>
            {label}
            {t === 'new' && inProgress.length > 0 && (
              <span style={{ marginLeft: 6, background: T.amber, color: '#000', borderRadius: 10, fontSize: '0.62rem', padding: '1px 5px', fontWeight: 700 }}>
                {inProgress.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <>
          {/* In-progress sessions */}
          {inProgress.length > 0 && (
            <div style={{ ...cardStyle, border: `1px solid ${T.amber}`, marginBottom: 16 }}>
              <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.amber}33`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-exclamation-triangle" style={{ color: T.amber }} />
                <strong style={{ color: T.amber, fontSize: '0.88rem' }}>In-Progress Checks</strong>
              </div>
              {inProgress.map(s => (
                <button key={s.id} onClick={() => navigateEms({ kind: 'check-session', sessionId: s.id })}
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '11px 14px', textAlign: 'left', cursor: 'pointer', color: T.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.storageLocation?.name ?? 'Location'}</div>
                    <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 2 }}>
                      {s.personnel?.firstName} {s.personnel?.lastName} · Started {new Date(s.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: T.amber, color: '#000', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>Resume</span>
                    <i className="bi bi-chevron-right" style={{ color: T.muted }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Start new check */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ ...cardHeaderStyle, padding: '8px 14px' }}>
              <strong style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-plus-circle me-2" style={{ color: T.accent }} />Start New Check
              </strong>
            </div>
            <div style={{ padding: 16 }}>
              <div className="mb-3">
                <label style={lbl}>Location <span style={{ color: T.red }}>*</span></label>
                <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}
                  value={selectedLoc} onChange={e => setSelectedLoc(e.target.value)}>
                  <option value="">Select location…</option>
                  {locations.map(l => {
                    const containerCount = l.containers?.length ?? 0;
                    const vialCount = l.containers?.flatMap(c => c.vials ?? []).filter(v => v.status === 'stocked' || v.status === 'in-use').length ?? 0;
                    return (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.locationType}) — {containerCount} containers, {vialCount} vials
                      </option>
                    );
                  })}
                </select>
                {locations.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: T.amber, marginTop: 4 }}>
                    <i className="bi bi-exclamation-triangle me-1" />
                    No locations found. <button onClick={() => navigateEms({ kind: 'locations' })} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}>Add a location first.</button>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label style={lbl}>Checking Personnel <span style={{ color: T.red }}>*</span></label>
                <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}
                  value={personnelId} onChange={e => setPersonnelId(e.target.value)}>
                  <option value="">Select person…</option>
                  {personnel.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {p.licenseLevel?.name ?? 'No Level'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label style={lbl}>Witness (if required)</label>
                <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}
                  value={witnessId} onChange={e => setWitnessId(e.target.value)}>
                  <option value="">None / Not Required</option>
                  {personnel.filter(p => p.id !== personnelId).map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={startCheck}
                disabled={!selectedLoc || !personnelId || starting}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                  background: (!selectedLoc || !personnelId || starting) ? '#1f3a20' : T.green,
                  color: (!selectedLoc || !personnelId || starting) ? T.muted : '#fff',
                  fontWeight: 700, fontSize: '1rem', cursor: (!selectedLoc || !personnelId || starting) ? 'not-allowed' : 'pointer',
                }}
              >
                {starting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-play-circle-fill me-2" />}
                Begin Check
              </button>
            </div>
          </div>

          {/* Locations overview */}
          {locations.length > 0 && (
            <div style={cardStyle}>
              <div style={{ ...cardHeaderStyle, padding: '8px 14px' }}>
                <strong style={{ fontSize: '0.88rem' }}>
                  <i className="bi bi-building me-2" style={{ color: T.accent }} />Locations Overview
                </strong>
              </div>
              {locations.map(loc => {
                const containerCount = loc.containers?.length ?? 0;
                const activeVials = loc.containers?.flatMap(c => c.vials ?? []).filter(v => v.status === 'stocked' || v.status === 'in-use').length ?? 0;
                const brokenSeals = loc.containers?.filter(c => c.isSealable && !c.isSealed).length ?? 0;
                return (
                  <button key={loc.id}
                    onClick={() => navigateEms({ kind: 'location', locationId: loc.id })}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', color: T.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: T.text }}>{loc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 2 }}>
                        {containerCount} containers · {activeVials} active vials
                        {brokenSeals > 0 && <span style={{ color: T.red, marginLeft: 8, fontWeight: 700 }}>⚠ {brokenSeals} open seal{brokenSeals > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.7rem', padding: '2px 8px', color: T.muted }}>
                        {loc.locationType}
                      </span>
                      <i className="bi bi-chevron-right" style={{ color: T.muted }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'schedule' && (
        <CheckScheduleView locations={locations} onStartCheck={loc => {
          setSelectedLoc(loc.id);
          setTab('new');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
      )}

      {tab === 'history' && (
        <CheckHistory sessions={history} loading={historyLoading} tenantId={tenantId} />
      )}
    </div>
  );
}

// ── Check Schedule ────────────────────────────────────────────────────────────

function schedFreqLabel(hours: number): string {
  if (hours % 168 === 0) return `every ${hours / 168}w`;
  if (hours % 24 === 0) return `every ${hours / 24}d`;
  return `every ${hours}h`;
}

function CheckScheduleView({ locations, onStartCheck }: {
  locations: MedStorageLocation[];
  onStartCheck: (loc: MedStorageLocation) => void;
}) {
  const allContainers = locations.flatMap(loc =>
    (loc.containers ?? []).map(c => ({ ...c, locationName: loc.name, location: loc }))
  );

  if (allContainers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
        <i className="bi bi-calendar-x" style={{ fontSize: '2rem', opacity: 0.3 }} />
        <div className="mt-2">No containers configured yet.</div>
        <button onClick={() => navigateEms({ kind: 'locations' })}
          style={{ marginTop: 10, background: 'none', border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Set Up Locations
        </button>
      </div>
    );
  }

  // Group by location
  const byLocation = locations.map(loc => ({
    loc,
    containers: (loc.containers ?? []),
  })).filter(x => x.containers.length > 0);

  return (
    <div>
      <div style={{ color: T.muted, fontSize: '0.78rem', marginBottom: 12 }}>
        <i className="bi bi-info-circle me-1" />
        Check frequency and requirements are configured per-container in
        <button onClick={() => navigateEms({ kind: 'locations' })} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', padding: '0 4px', fontSize: '0.78rem' }}>
          Locations
        </button>
        and agency-wide defaults in
        <button onClick={() => navigateEms({ kind: 'agency-config' })} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', padding: '0 4px', fontSize: '0.78rem' }}>
          Agency Config
        </button>.
      </div>

      <div className="d-flex flex-column gap-3">
        {byLocation.map(({ loc, containers }) => (
          <div key={loc.id} style={cardStyle}>
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: T.text }}>{loc.name}</strong>
                <span style={{ marginLeft: 8, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.65rem', padding: '1px 7px', color: T.muted }}>{loc.locationType}</span>
              </div>
              <button onClick={() => onStartCheck(loc)}
                style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                <i className="bi bi-play-fill me-1" />Check
              </button>
            </div>
            {containers.map(c => (
              <div key={c.id} style={{ padding: '9px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{c.name}</div>
                  <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 2 }}>
                    {c.containerType} · <span style={{ color: T.cyan }}>{schedFreqLabel(c.checkFrequencyHours)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {c.checkRequiresWitness && (
                    <span style={{ background: '#2a1a40', color: '#c084fc', border: '1px solid #7c3aed55', borderRadius: 8, fontSize: '0.62rem', padding: '2px 7px', fontWeight: 600 }}>Witness req.</span>
                  )}
                  {c.isControlledSubstance && (
                    <span style={{ background: '#3d1515', color: T.amber, border: `1px solid ${T.amber}55`, borderRadius: 8, fontSize: '0.62rem', padding: '2px 7px', fontWeight: 600 }}>Controlled</span>
                  )}
                  {c.isSealable && (
                    <span style={{
                      background: c.isSealed ? `${T.green}22` : '#3d2a00',
                      color: c.isSealed ? T.green : T.amber,
                      border: `1px solid ${c.isSealed ? T.green : T.amber}55`,
                      borderRadius: 8, fontSize: '0.62rem', padding: '2px 7px', fontWeight: 600,
                    }}>
                      {c.isSealed ? '🔒 Sealed' : '🔓 Unsealed'}
                    </span>
                  )}
                  {(c.vials ?? []).filter(v => v.status === 'stocked' || v.status === 'in-use').length > 0 && (
                    <span style={{ background: `${T.accent}22`, color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, fontSize: '0.62rem', padding: '2px 7px', fontWeight: 600 }}>
                      {(c.vials ?? []).filter(v => v.status === 'stocked' || v.status === 'in-use').length} vials
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Check History ─────────────────────────────────────────────────────────────

function CheckHistory({ sessions, loading, tenantId }: { sessions: MedCheckSession[]; loading: boolean; tenantId: string }) {
  const [locationFilter, setLocationFilter] = useState('');

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;

  const locationNames = [...new Set(sessions.map(s => s.storageLocation?.name).filter(Boolean) as string[])];

  const filtered = sessions.filter(s =>
    !locationFilter || s.storageLocation?.name === locationFilter
  );

  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
        <i className="bi bi-clipboard-check" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
        <div className="mt-2">No completed check sessions yet.</div>
      </div>
    );
  }

  return (
    <div>
      {locationNames.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <select style={{ ...inputStyle, width: '100%', padding: '9px 12px' }}
            value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
            <option value="">All Locations</option>
            {locationNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      <div className="d-flex flex-column gap-2">
        {filtered.map(s => {
          const passed = s.items.filter(i => i.passed).length;
          const total = s.items.length;
          const pct = total > 0 ? Math.round((passed / total) * 100) : 100;
          const statusColor = s.status === 'completed' ? (pct >= 90 ? T.green : T.amber) : T.red;

          return (
            <div key={s.id} style={{ ...cardStyle, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: '0.9rem' }}>
                    {s.storageLocation?.name ?? 'Location'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 2 }}>
                    {s.personnel?.firstName} {s.personnel?.lastName}
                    {s.witnessPersonnel && <> · Witness: {s.witnessPersonnel.firstName} {s.witnessPersonnel.lastName}</>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 2 }}>
                    {new Date(s.startedAt).toLocaleString()}
                    {s.completedAt && <> → {new Date(s.completedAt).toLocaleTimeString()}</>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                  <span style={{ background: statusColor, color: '#fff', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', display: 'inline-block' }}>
                    {s.status}
                  </span>
                  {total > 0 && (
                    <div style={{ fontSize: '0.75rem', color: statusColor, fontWeight: 700, marginTop: 4 }}>
                      {passed}/{total} passed
                    </div>
                  )}
                </div>
              </div>
              {s.notes && (
                <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 6, fontStyle: 'italic', borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                  {s.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 6 };
const inputStyle2 = inputStyle; // re-export alias used in select elements above
void inputStyle2; // suppress unused warning
