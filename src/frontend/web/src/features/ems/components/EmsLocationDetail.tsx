import { useEffect, useState } from 'react';
import { fetchLocation, createContainer, updateContainer, breakSeal, applySeal, fetchPersonnel, fetchContainerDetail } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, cardHeaderStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedStorageLocation, MedContainer, MedPersonnel } from '../../../types/ems';

type ContainerCheckInfo = { lastCheckedAt: string | null; nextDueAt: string; isOverdue: boolean };

interface Props { tenantId: string; locationId: string; }

const CONTAINER_TYPES = [
  { value: 'drug-box', label: 'Drug Box' },
  { value: 'bag', label: 'Bag' },
  { value: 'vault-drawer', label: 'Vault Drawer' },
  { value: 'cabinet', label: 'Cabinet' },
];

const emptyContainerForm = () => ({
  name: '', containerType: 'drug-box', isSealable: true,
  isSealed: false, sealNumber: '', checkFrequencyHours: 24,
  checkRequiresWitness: false, isControlledSubstance: false,
});

export default function EmsLocationDetail({ tenantId, locationId }: Props) {
  const [location, setLocation] = useState<MedStorageLocation | null>(null);
  const [personnel, setPersonnel] = useState<MedPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContainerForm, setShowContainerForm] = useState(false);
  const [editContainerId, setEditContainerId] = useState<string | null>(null);
  const [containerForm, setContainerForm] = useState(emptyContainerForm());
  const [saving, setSaving] = useState(false);
  const [sealModal, setSealModal] = useState<{ container: MedContainer; action: 'break' | 'apply' } | null>(null);
  const [checkInfo, setCheckInfo] = useState<Record<string, ContainerCheckInfo>>({});

  const reload = async () => {
    const [loc, pers] = await Promise.all([
      fetchLocation(tenantId, locationId),
      fetchPersonnel(tenantId, true),
    ]).catch(e => { console.error(e); return [null, []]; }) as [MedStorageLocation | null, MedPersonnel[]];
    if (loc) {
      setLocation(loc);
      setPersonnel(pers);
      // Fetch check schedule for each container in parallel
      const infos = await Promise.all(
        loc.containers.map(c => fetchContainerDetail(c.id).catch(() => null))
      );
      const infoMap: Record<string, ContainerCheckInfo> = {};
      loc.containers.forEach((c, i) => {
        if (infos[i]) infoMap[c.id] = infos[i]!;
      });
      setCheckInfo(infoMap);
    }
    setLoading(false);
  };

  useEffect(() => { reload(); }, [locationId]);

  function startEditContainer(c: MedContainer) {
    setEditContainerId(c.id);
    setContainerForm({
      name: c.name,
      containerType: c.containerType,
      isSealable: c.isSealable,
      isSealed: c.isSealed,
      sealNumber: c.sealNumber ?? '',
      checkFrequencyHours: c.checkFrequencyHours,
      checkRequiresWitness: c.checkRequiresWitness,
      isControlledSubstance: c.isControlledSubstance,
    });
    setShowContainerForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveContainer() {
    if (!containerForm.name) { alert('Container name required.'); return; }
    setSaving(true);
    try {
      if (editContainerId) {
        await updateContainer(editContainerId, containerForm as any);
      } else {
        await createContainer(locationId, containerForm as any);
      }
      setShowContainerForm(false);
      setEditContainerId(null);
      setContainerForm(emptyContainerForm());
      await reload();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;
  if (!location) return <div style={{ color: T.amber, padding: 16 }}>Location not found.</div>;

  const activeVialCount = location.containers.flatMap(c => c.vials ?? []).filter(v => v.status === 'stocked' || v.status === 'in-use').length;
  const brokenSeals = location.containers.filter(c => c.isSealable && !c.isSealed).length;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'locations' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5 className="mb-0 fw-bold" style={{ color: T.text }}>{location.name}</h5>
          <div style={{ fontSize: '0.75rem', color: T.muted }}>
            {location.locationType} · {location.containers.length} containers · {activeVialCount} active vials
            {brokenSeals > 0 && <span style={{ color: T.red, marginLeft: 8 }}>⚠ {brokenSeals} open seal{brokenSeals > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <button
          onClick={() => { setShowContainerForm(!showContainerForm); setEditContainerId(null); setContainerForm(emptyContainerForm()); }}
          style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}
        >
          <i className="bi bi-plus-lg me-1" />Container
        </button>
      </div>

      {/* Container form */}
      {showContainerForm && (
        <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
          <h6 style={{ color: T.text, fontWeight: 700, marginBottom: 12 }}>
            {editContainerId ? <><i className="bi bi-pencil me-2" style={{ color: T.accent }} />Edit Container</> : <><i className="bi bi-plus-circle me-2" style={{ color: T.green }} />Add Container</>}
          </h6>

          <div className="row g-2">
            <div className="col-8">
              <label style={lbl}>Name *</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} placeholder="e.g. ALS Drug Box A"
                value={containerForm.name} onChange={e => setContainerForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-4">
              <label style={lbl}>Type</label>
              <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}
                value={containerForm.containerType} onChange={e => setContainerForm(f => ({ ...f, containerType: e.target.value }))}>
                {CONTAINER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label style={lbl}>Check Frequency (hours)</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} type="number" min="1"
                value={containerForm.checkFrequencyHours}
                onChange={e => setContainerForm(f => ({ ...f, checkFrequencyHours: parseInt(e.target.value) || 24 }))} />
              <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: 3 }}>
                = {freqLabel(containerForm.checkFrequencyHours)} · Common: 24h (daily), 168h (weekly)
              </div>
            </div>
            <div className="col-6" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
            {[
              { key: 'isSealable', label: 'Tamper-Evident Seal', desc: 'Container uses numbered seals' },
              { key: 'isControlledSubstance', label: 'Controlled Substance Container', desc: 'Contains DEA-scheduled drugs' },
              { key: 'checkRequiresWitness', label: 'Checks Require Witness', desc: 'Container-level override' },
            ].map(c => (
              <label key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ color: T.text, fontSize: '0.82rem', fontWeight: 600 }}>{c.label}</div>
                  <div style={{ color: T.muted, fontSize: '0.72rem' }}>{c.desc}</div>
                </div>
                <input type="checkbox" checked={(containerForm as any)[c.key]}
                  onChange={e => setContainerForm(f => ({ ...f, [c.key]: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: T.accent }} />
              </label>
            ))}
          </div>

          <div className="d-flex gap-2">
            <button onClick={saveContainer} disabled={!containerForm.name || saving}
              style={{ flex: 1, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {editContainerId ? 'Save Changes' : 'Add Container'}
            </button>
            <button onClick={() => { setShowContainerForm(false); setEditContainerId(null); }}
              style={{ ...btnBackStyle, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {location.containers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
          <i className="bi bi-box" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <div className="mt-2">No containers yet. Add one above.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {location.containers.map(c => (
            <ContainerCard
              key={c.id}
              container={c}
              checkInfo={checkInfo[c.id] ?? null}
              onEdit={() => startEditContainer(c)}
              onBreakSeal={() => setSealModal({ container: c, action: 'break' })}
              onApplySeal={() => setSealModal({ container: c, action: 'apply' })}
            />
          ))}
        </div>
      )}

      {sealModal && (
        <SealActionModal
          action={sealModal.action}
          container={sealModal.container}
          personnel={personnel}
          onClose={() => setSealModal(null)}
          onDone={async () => { setSealModal(null); await reload(); }}
        />
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function freqLabel(hours: number): string {
  if (hours % 168 === 0) return `${hours / 168}w`;
  if (hours % 24 === 0) return `${hours / 24}d`;
  return `${hours}h`;
}

// ── Container Card ────────────────────────────────────────────────────────────

function ContainerCard({ container, checkInfo, onEdit, onBreakSeal, onApplySeal }: {
  container: MedContainer; checkInfo: ContainerCheckInfo | null;
  onEdit: () => void; onBreakSeal: () => void; onApplySeal: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeVials = container.vials.filter(v => v.status === 'stocked' || v.status === 'in-use');
  const allVials = container.vials;
  const sealColor = container.isSealed ? T.green : (container.isSealable ? T.amber : T.border);
  const isOverdue = checkInfo?.isOverdue ?? false;
  const nextDue = checkInfo?.nextDueAt ? new Date(checkInfo.nextDueAt) : null;
  const lastChecked = checkInfo?.lastCheckedAt ? new Date(checkInfo.lastCheckedAt) : null;

  return (
    <div style={{ ...cardStyle, border: `1px solid ${isOverdue ? T.red : sealColor}` }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, color: T.text }}>{container.name}</div>
              <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 2 }}>
                {container.containerType} · {activeVials.length} active / {allVials.length} total vials
                {container.checkRequiresWitness && <span style={{ marginLeft: 6, color: T.amber }}>· Witness req.</span>}
              </div>
              {/* Check schedule */}
              <div style={{ fontSize: '0.72rem', marginTop: 3 }}>
                <span style={{ color: isOverdue ? T.red : T.muted }}>
                  <i className={`bi ${isOverdue ? 'bi-exclamation-circle' : 'bi-clock'} me-1`} />
                  {!checkInfo ? `Check: every ${freqLabel(container.checkFrequencyHours)}` :
                    isOverdue ? `Overdue! (every ${freqLabel(container.checkFrequencyHours)})` :
                    nextDue ? `Next check: ${nextDue.toLocaleDateString()} ${nextDue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                    `Check: every ${freqLabel(container.checkFrequencyHours)}`
                  }
                </span>
                {lastChecked && (
                  <span style={{ color: T.muted, marginLeft: 8 }}>
                    Last: {lastChecked.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isOverdue && (
            <span style={{ background: T.red, color: '#fff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px' }}>
              DUE
            </span>
          )}
          {container.isSealable && (
            <span style={{
              background: container.isSealed ? T.green : '#3d2a00',
              color: container.isSealed ? '#fff' : T.amber,
              border: `1px solid ${container.isSealed ? T.green : T.amber}`,
              borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
            }}>
              {container.isSealed ? `🔒 ${container.sealNumber ?? 'Sealed'}` : '🔓 Unsealed'}
            </span>
          )}
          {container.isControlledSubstance && (
            <span style={{ background: '#3d1515', color: T.amber, border: `1px solid ${T.amber}55`, borderRadius: 8, fontSize: '0.65rem', padding: '2px 6px', fontWeight: 600 }}>RX</span>
          )}
          <button onClick={onEdit}
            style={{ ...btnBackStyle, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
            <i className="bi bi-pencil" style={{ fontSize: '0.75rem' }} />
          </button>
          <button onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: '4px' }}>
            <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.border}` }}>
          {/* Seal actions */}
          {container.isSealable && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
              {container.isSealed ? (
                <button onClick={onBreakSeal}
                  style={{ background: T.red, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  <i className="bi bi-unlock me-1" />Break Seal
                </button>
              ) : (
                <button onClick={onApplySeal}
                  style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  <i className="bi bi-lock me-1" />Apply Seal
                </button>
              )}
            </div>
          )}

          {/* Vials */}
          {activeVials.length === 0 ? (
            <div style={{ color: T.muted, fontSize: '0.85rem', paddingTop: container.isSealable ? 0 : 12 }}>
              No active vials in this container.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: container.isSealable ? 0 : 12 }}>
              <div style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 600, marginBottom: 2 }}>
                Active Vials ({activeVials.length})
              </div>
              {activeVials.map(v => (
                <button key={v.id} onClick={() => navigateEms({ kind: 'vial', vialId: v.id })}
                  style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: T.text }}>{v.medication?.genericName}</div>
                    <div style={{ fontSize: '0.73rem', color: T.muted, marginTop: 1 }}>
                      Lot: {v.lotNumber} · {v.remainingVolumeMl}/{v.totalVolumeMl} mL
                      {v.expiresAt && (
                        <span style={{ marginLeft: 8, color: new Date(v.expiresAt) < new Date() ? T.red : new Date(v.expiresAt) < new Date(Date.now() + 30 * 86400000) ? T.amber : T.muted }}>
                          Exp: {new Date(v.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <i className="bi bi-chevron-right" style={{ color: T.muted }} />
                </button>
              ))}
            </div>
          )}

          {/* Non-active vials count */}
          {allVials.length > activeVials.length && (
            <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 8 }}>
              +{allVials.length - activeVials.length} historical vials (wasted/disposed/expired)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Seal Action Modal ─────────────────────────────────────────────────────────

function SealActionModal({ action, container, personnel, onClose, onDone }: {
  action: 'break' | 'apply';
  container: MedContainer;
  personnel: MedPersonnel[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [personnelId, setPersonnelId] = useState('');
  const [witnessId, setWitnessId] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      if (action === 'break') {
        await breakSeal(container.id, { personnelId, witnessPersonnelId: witnessId || undefined, notes: notes || undefined });
      } else {
        if (!sealNumber) { alert('Seal number required.'); setSaving(false); return; }
        await applySeal(container.id, { sealNumber, personnelId });
      }
      onDone();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <h6 style={{ margin: 0, fontWeight: 700, color: T.text }}>
            {action === 'break' ? '🔓 Break Seal' : '🔒 Apply Seal'} — {container.name}
          </h6>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          {action === 'apply' && (
            <div className="mb-3">
              <label style={lbl}>New Seal Number *</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} placeholder="e.g. A-2204" value={sealNumber} onChange={e => setSealNumber(e.target.value)} />
            </div>
          )}
          <div className="mb-3">
            <label style={lbl}>Performed By</label>
            <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} value={personnelId} onChange={e => setPersonnelId(e.target.value)}>
              <option value="">Select person…</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.licenseLevel?.name}</option>)}
            </select>
          </div>
          {action === 'break' && (
            <>
              <div className="mb-3">
                <label style={lbl}>Witness</label>
                <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} value={witnessId} onChange={e => setWitnessId(e.target.value)}>
                  <option value="">None</option>
                  {personnel.filter(p => p.id !== personnelId).map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label style={lbl}>Reason / Notes *</label>
                <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none' }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="State reason for breaking seal…" />
              </div>
            </>
          )}
          <button onClick={submit} disabled={saving || (action === 'break' && !notes)}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', fontWeight: 700,
              background: (saving || (action === 'break' && !notes)) ? '#1a1a2e' : (action === 'break' ? T.red : T.green),
              color: (saving || (action === 'break' && !notes)) ? T.muted : '#fff',
              cursor: (saving || (action === 'break' && !notes)) ? 'not-allowed' : 'pointer', fontSize: '1rem',
            }}>
            {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {action === 'break' ? 'Confirm Break Seal' : 'Apply Seal'}
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 };
