import { useEffect, useState } from 'react';
import { fetchCheckSession, addCheckItem, completeCheckSession, abortCheckSession } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle } from '../theme';
import type { MedCheckSession, MedContainer, MedVial } from '../../../types/ems';

interface Props { tenantId: string; sessionId: string; }

export default function EmsCheckSessionView({ tenantId, sessionId }: Props) {
  const [session, setSession] = useState<MedCheckSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const reload = () =>
    fetchCheckSession(tenantId, sessionId)
      .then(setSession)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { reload(); }, [sessionId]);

  async function complete() {
    setCompleting(true);
    try {
      await completeCheckSession(tenantId, sessionId, notes || undefined);
      navigateEms({ kind: 'check' });
    } catch (e: any) { setError(e.message); } finally { setCompleting(false); }
  }

  async function abort() {
    if (!confirm('Abort this check session?')) return;
    await abortCheckSession(tenantId, sessionId);
    navigateEms({ kind: 'check' });
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;
  if (error) return <div style={{ color: T.red, padding: 16, background: T.card, borderRadius: 12 }}>{error}</div>;
  if (!session) return <div style={{ color: T.amber, padding: 16 }}>Session not found.</div>;

  const loc = session.storageLocation;
  const containers = loc?.containers ?? [];

  const checkedContainerIds = new Set(session.items.filter(i => i.containerId && !i.vialId).map(i => i.containerId!));
  const checkedVialIds = new Set(session.items.filter(i => i.vialId).map(i => i.vialId!));

  const allContainersHandled = containers.every(c => {
    if (c.isSealed) return checkedContainerIds.has(c.id);
    const activeVials = c.vials.filter(v => v.status === 'stocked' || v.status === 'in-use');
    return activeVials.every(v => checkedVialIds.has(v.id));
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={abort}
          style={{ background: 'transparent', border: `1px solid ${T.red}`, borderRadius: 8, color: T.red, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
          <i className="bi bi-x-circle me-1" />Abort
        </button>
        <h5 style={{ margin: 0, flex: 1, textAlign: 'center', color: T.text, fontSize: '1rem', fontWeight: 700 }}>
          {loc?.name ?? 'Check Session'}
        </h5>
        <span style={{ background: T.amber, color: '#000', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px' }}>
          {session.status}
        </span>
      </div>

      <div style={{ background: '#0c2a40', border: `1px solid ${T.cyan}`, borderRadius: 10, padding: '8px 12px', marginBottom: 16, fontSize: '0.82rem', color: T.cyan }}>
        <i className="bi bi-person-check me-2" />
        <strong>{session.personnel?.firstName} {session.personnel?.lastName}</strong>
        {session.witnessPersonnel && (
          <> · Witness: <strong>{session.witnessPersonnel.firstName} {session.witnessPersonnel.lastName}</strong></>
        )}
      </div>

      {containers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>No containers at this location.</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {containers.map(c => (
            <ContainerCheckCard
              key={c.id}
              container={c}
              tenantId={tenantId}
              sessionId={sessionId}
              checkedContainerIds={checkedContainerIds}
              checkedVialIds={checkedVialIds}
              onChecked={reload}
            />
          ))}
        </div>
      )}

      <div style={{ ...cardStyle, marginTop: 16, padding: 16 }}>
        <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
        <textarea style={{ ...inputStyle, width: '100%', padding: '8px 12px', resize: 'none', marginBottom: 12 }}
          rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        <button onClick={complete} disabled={completing}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: allContainersHandled ? T.green : T.accent,
            color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          }}>
          {completing ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-circle-fill me-2" />}
          {allContainersHandled ? 'Complete Check ✓' : `Complete Check (${session.items.length} logged)`}
        </button>
      </div>
    </div>
  );
}

function ContainerCheckCard({ container, tenantId, sessionId, checkedContainerIds, checkedVialIds, onChecked }: {
  container: MedContainer; tenantId: string; sessionId: string;
  checkedContainerIds: Set<string>; checkedVialIds: Set<string>; onChecked: () => void;
}) {
  const [expanded, setExpanded] = useState(!container.isSealed);
  const [saving, setSaving] = useState<string | null>(null);
  const [discrepancy, setDiscrepancy] = useState('');

  const isContainerChecked = checkedContainerIds.has(container.id);
  const activeVials = container.vials.filter(v => v.status === 'stocked' || v.status === 'in-use');
  const borderColor = isContainerChecked ? T.green : T.border;

  async function checkSealedContainer(sealIntact: boolean) {
    setSaving(container.id);
    try {
      await addCheckItem(tenantId, sessionId, { containerId: container.id, sealIntact, passed: sealIntact, discrepancy: sealIntact ? undefined : 'Seal broken or missing' });
      if (sealIntact) {
        for (const v of activeVials) {
          await addCheckItem(tenantId, sessionId, { vialId: v.id, containerId: container.id, sealIntact: true, passed: true });
        }
      }
      onChecked();
    } finally { setSaving(null); }
  }

  async function checkVial(vial: MedVial, passed: boolean) {
    setSaving(vial.id);
    try {
      await addCheckItem(tenantId, sessionId, { vialId: vial.id, containerId: container.id, sealIntact: false, passed, discrepancy: passed ? undefined : discrepancy || 'Issue noted' });
      setDiscrepancy('');
      onChecked();
    } finally { setSaving(null); }
  }

  return (
    <div style={{ ...cardStyle, border: `1px solid ${borderColor}` }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: T.text }}>{container.name}</div>
          <div style={{ fontSize: '0.75rem', color: T.muted }}>{activeVials.length} active vials</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {container.isSealed && (
            <span style={{ background: T.green, color: '#fff', borderRadius: 8, fontSize: '0.7rem', padding: '2px 8px', fontWeight: 600 }}>
              🔒 Sealed
            </span>
          )}
          {container.isControlledSubstance && (
            <span style={{ background: T.amber, color: '#000', borderRadius: 8, fontSize: '0.65rem', padding: '2px 6px', fontWeight: 600 }}>Controlled</span>
          )}
          {isContainerChecked && <i className="bi bi-check-circle-fill" style={{ color: T.green, fontSize: '1.1rem' }} />}
          <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: T.muted }} />
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.border}` }}>
          {container.isSealed && !isContainerChecked ? (
            <div style={{ paddingTop: 12 }}>
              {container.sealNumber && (
                <div style={{ background: '#0c2a40', border: `1px solid ${T.cyan}`, borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', color: T.cyan, marginBottom: 12 }}>
                  <i className="bi bi-shield-check me-2" />Seal #: <strong>{container.sealNumber}</strong>
                </div>
              )}
              <p style={{ fontSize: '0.88rem', color: T.muted, marginBottom: 12 }}>
                Is the tamper-evident seal <strong style={{ color: T.text }}>intact and unbroken</strong>?
              </p>
              <div className="row g-2">
                <div className="col-6">
                  <button onClick={() => checkSealedContainer(true)} disabled={saving === container.id}
                    style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: T.green, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                    {saving === container.id ? <span className="spinner-border spinner-border-sm" /> : '✓ Seal OK'}
                  </button>
                </div>
                <div className="col-6">
                  <button onClick={() => checkSealedContainer(false)} disabled={saving === container.id}
                    style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: T.red, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                    ✗ Seal Issue
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              {activeVials.length === 0 ? (
                <p style={{ color: T.muted, textAlign: 'center', padding: '8px 0' }}>No active vials</p>
              ) : (
                activeVials.map(v => {
                  const checked = checkedVialIds.has(v.id);
                  return (
                    <div key={v.id} style={{ background: T.cardAlt, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>{v.medication?.genericName}</div>
                          <div style={{ fontSize: '0.73rem', color: T.muted }}>Lot: {v.lotNumber} · {v.remainingVolumeMl} mL</div>
                          {v.expiresAt && (
                            <div style={{ fontSize: '0.73rem', color: new Date(v.expiresAt) < new Date() ? T.red : T.muted }}>
                              Exp: {new Date(v.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {checked && <i className="bi bi-check-circle-fill" style={{ color: T.green, fontSize: '1.2rem' }} />}
                      </div>
                      {!checked && (
                        <div className="row g-2 mt-1">
                          <div className="col-6">
                            <button onClick={() => checkVial(v, true)} disabled={saving === v.id}
                              style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: T.green, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                              {saving === v.id ? <span className="spinner-border spinner-border-sm" /> : '✓ OK'}
                            </button>
                          </div>
                          <div className="col-6">
                            <button onClick={() => checkVial(v, false)} disabled={saving === v.id}
                              style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: T.red, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                              ✗ Problem
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
