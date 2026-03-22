import { useEffect, useState } from 'react';
import {
  fetchVial, administerVial, wasteVial, disposeVial, expireVial,
  fetchPersonnel, fetchLocations, stockVial, moveVial, receiveVial,
} from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedVial, MedPersonnel, MedStorageLocation } from '../../../types/ems';
import { personnelFullName, DEA_SCHEDULE_LABELS } from '../../../types/ems';

interface Props { tenantId: string; vialId: string; }

type Modal = 'administer' | 'waste' | 'dispose' | 'expire' | 'receive' | 'stock' | 'move' | null;

export default function EmsVialDetail({ tenantId, vialId }: Props) {
  const [vial, setVial] = useState<MedVial | null>(null);
  const [personnel, setPersonnel] = useState<MedPersonnel[]>([]);
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchVial(tenantId, vialId),
      fetchPersonnel(tenantId, true),
      fetchLocations(tenantId),
    ]).then(([v, p, l]) => { setVial(v); setPersonnel(p); setLocations(l); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId, vialId]);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;
  if (error) return <div style={{ color: T.red, padding: 16, background: T.card, borderRadius: 12 }}>{error}</div>;
  if (!vial) return <div style={{ color: T.amber, padding: 16 }}>Vial not found.</div>;

  const med = vial.medication;
  const isActive = !['administered', 'wasted', 'disposed', 'expired'].includes(vial.status);
  const daysUntilExpiry = vial.expiresAt
    ? Math.ceil((new Date(vial.expiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const statusBg = T.statusColors[vial.status as keyof typeof T.statusColors] ?? T.accent;
  const volumePct = Math.min(100, (vial.remainingVolumeMl / vial.totalVolumeMl) * 100);

  const reload = async () => {
    setModal(null);
    const [v, p, l] = await Promise.all([
      fetchVial(tenantId, vialId),
      fetchPersonnel(tenantId, true),
      fetchLocations(tenantId),
    ]);
    setVial(v); setPersonnel(p); setLocations(l);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'vials' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 style={{ margin: 0, flex: 1, color: T.text, fontWeight: 700 }}>{med?.genericName ?? 'Vial Detail'}</h5>
      </div>

      {/* Header card */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: T.text }}>{med?.genericName}</div>
            {med?.brandName && <div style={{ fontSize: '0.82rem', color: T.muted }}>{med.brandName}</div>}
            {med && (
              <span style={{
                background: med.deaSchedule > 0 ? '#3d1515' : '#374151',
                color: med.deaSchedule > 0 ? T.amber : '#9ca3af',
                borderRadius: 10, fontSize: '0.68rem', padding: '1px 8px', fontWeight: 600, marginTop: 4, display: 'inline-block',
                border: med.deaSchedule > 0 ? `1px solid ${T.amber}` : 'none',
              }}>
                {med.deaSchedule > 0 && <i className="bi bi-shield-exclamation me-1" />}
                {DEA_SCHEDULE_LABELS[med.deaSchedule]}
              </span>
            )}
          </div>
          <span style={{ background: statusBg, color: '#fff', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px' }}>
            {vial.status.toUpperCase()}
          </span>
        </div>

        {/* Volume bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>
            <span>Volume Remaining</span>
            <strong style={{ color: T.text }}>{vial.remainingVolumeMl} / {vial.totalVolumeMl} mL</strong>
          </div>
          <div style={{ height: 10, background: T.input, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${volumePct}%`, background: volumePct < 20 ? T.amber : T.accent, borderRadius: 5, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem' }}>
          <InfoRow icon="bi-upc" label="Lot Number" value={vial.lotNumber} />
          {vial.agencyLabelCode && <InfoRow icon="bi-qr-code" label="Agency Code" value={vial.agencyLabelCode} />}
          {vial.manufacturerBarcode && <InfoRow icon="bi-barcode" label="Mfr Barcode" value={vial.manufacturerBarcode} />}
          {vial.expiresAt && (
            <InfoRow
              icon="bi-calendar-x" label="Expires"
              value={`${new Date(vial.expiresAt).toLocaleDateString()}${daysUntilExpiry !== null ? ` (${daysUntilExpiry < 0 ? 'EXPIRED' : `${daysUntilExpiry}d remaining`})` : ''}`}
              valueColor={daysUntilExpiry !== null && daysUntilExpiry < 0 ? T.red : daysUntilExpiry !== null && daysUntilExpiry < 30 ? T.amber : T.text}
            />
          )}
          {vial.container?.storageLocation && (
            <InfoRow icon="bi-geo-alt" label="Location" value={`${vial.container.storageLocation.name} → ${vial.container.name}`} />
          )}
          {med?.concentration && <InfoRow icon="bi-droplet" label="Concentration" value={med.concentration} />}
          {med?.routeOfAdministration && <InfoRow icon="bi-arrow-right-circle" label="Route" value={med.routeOfAdministration} />}
          {med?.formDescription && <InfoRow icon="bi-capsule" label="Form" value={med.formDescription} />}
        </div>
      </div>

      {/* Action buttons */}
      {isActive && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.muted, fontSize: '0.78rem', letterSpacing: '0.05em' }}>ACTIONS</div>
          <div style={{ padding: 12 }}>
            <div className="row g-2">

              {/* ORDERED → Receive */}
              {vial.status === 'ordered' && (
                <ActionBtn color={T.cyan} icon="bi-box-arrow-in-down" label="Receive" onClick={() => setModal('receive')} />
              )}

              {/* RECEIVED → Stock into container */}
              {vial.status === 'received' && (
                <ActionBtn color={T.violet} icon="bi-box-seam" label="Stock to Container" onClick={() => setModal('stock')} />
              )}

              {/* STOCKED / IN-USE → Administer */}
              {(vial.status === 'stocked' || vial.status === 'in-use' || vial.status === 'received') && (
                <ActionBtn color={T.red} icon="bi-syringe" label="Administer" onClick={() => setModal('administer')} />
              )}

              {/* STOCKED / IN-USE → Waste */}
              {(vial.status === 'stocked' || vial.status === 'in-use') && (
                <ActionBtn color={T.amber} icon="bi-droplet-half" label="Waste" dark onClick={() => setModal('waste')} />
              )}

              {/* STOCKED / IN-USE → Move */}
              {(vial.status === 'stocked' || vial.status === 'in-use') && (
                <ActionBtn color={T.cyan} icon="bi-arrow-left-right" label="Move" onClick={() => setModal('move')} />
              )}

              {/* WASTED or EXPIRED → Dispose */}
              {(vial.status === 'wasted' || (daysUntilExpiry !== null && daysUntilExpiry < 0)) && (
                <ActionBtn color="#374151" icon="bi-trash" label="Dispose" onClick={() => setModal('dispose')} />
              )}

              {/* Past expiry, not expired → Mark Expired */}
              {daysUntilExpiry !== null && daysUntilExpiry < 0 && vial.status !== 'expired' && (
                <ActionBtn color={T.red} icon="bi-x-octagon" label="Mark Expired" outline onClick={() => setModal('expire')} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event history */}
      {vial.events.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.muted, fontSize: '0.78rem', letterSpacing: '0.05em' }}>
            <i className="bi bi-clock-history me-2" />EVENT HISTORY
          </div>
          {vial.events.map(ev => (
            <div key={ev.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <span style={{ background: T.accent, color: '#fff', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', marginRight: 6 }}>{ev.eventType}</span>
                  {ev.personnel && <span style={{ fontSize: '0.8rem', color: T.muted }}>{personnelFullName(ev.personnel)}</span>}
                  {ev.witnessPersonnel && (
                    <span style={{ fontSize: '0.78rem', color: T.muted, marginLeft: 6 }}>(Witness: {personnelFullName(ev.witnessPersonnel)})</span>
                  )}
                  {ev.dosageAmountMl != null && (
                    <div style={{ fontSize: '0.78rem', color: T.text, marginTop: 2 }}>
                      <strong>{ev.dosageAmountMl} mL</strong>
                      {ev.incidentNumber && ` · Incident: ${ev.incidentNumber}`}
                      {ev.patientWeightKg && ` · Pt weight: ${ev.patientWeightKg} kg`}
                    </div>
                  )}
                  {ev.notes && <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: 2, fontStyle: 'italic' }}>{ev.notes}</div>}
                </div>
                <span style={{ fontSize: '0.7rem', color: T.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {new Date(ev.occurredAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'receive' && (
        <ReceiveModal tenantId={tenantId} vial={vial} personnel={personnel} onClose={() => setModal(null)} onDone={reload} />
      )}
      {modal === 'stock' && (
        <StockModal tenantId={tenantId} vial={vial} personnel={personnel} locations={locations} onClose={() => setModal(null)} onDone={reload} />
      )}
      {modal === 'move' && (
        <MoveModal tenantId={tenantId} vial={vial} personnel={personnel} locations={locations} onClose={() => setModal(null)} onDone={reload} />
      )}
      {modal === 'administer' && (
        <AdministerModal tenantId={tenantId} vial={vial} personnel={personnel} onClose={() => setModal(null)} onDone={reload} />
      )}
      {modal === 'waste' && (
        <WasteModal tenantId={tenantId} vial={vial} personnel={personnel} onClose={() => setModal(null)} onDone={reload} />
      )}
      {modal === 'dispose' && (
        <SimpleModal
          title="Dispose Vial" icon="bi-trash" color={T.muted}
          message="Confirm disposal of this vial. This marks it permanently removed from inventory."
          personnel={personnel}
          onClose={() => setModal(null)}
          onDone={async (personnelId, notes) => { await disposeVial(tenantId, vialId, { personnelId, notes }); await reload(); }}
        />
      )}
      {modal === 'expire' && (
        <SimpleModal
          title="Mark as Expired" icon="bi-x-octagon" color={T.red}
          message="Mark this vial as expired and remove it from active inventory."
          personnel={personnel}
          onClose={() => setModal(null)}
          onDone={async (personnelId, notes) => { await expireVial(tenantId, vialId, { personnelId, notes }); await reload(); }}
        />
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function ActionBtn({ color, icon, label, onClick, outline, dark }: {
  color: string; icon: string; label: string; onClick: () => void; outline?: boolean; dark?: boolean;
}) {
  return (
    <div className="col-6">
      <button
        style={{
          width: '100%', padding: '13px 0', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
          border: outline ? `1px solid ${color}` : 'none',
          background: outline ? 'transparent' : color,
          color: outline ? color : (dark ? '#000' : '#fff'),
          fontWeight: 700,
        }}
        onClick={onClick}
      >
        <i className={`bi ${icon} d-block`} style={{ fontSize: '1.5rem', marginBottom: 4 }} />
        <span style={{ fontSize: '0.85rem' }}>{label}</span>
      </button>
    </div>
  );
}

function InfoRow({ icon, label, value, valueColor = '' }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <i className={`bi ${icon}`} style={{ color: T.muted, width: 16, flexShrink: 0 }} />
      <span style={{ color: T.muted, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: valueColor || T.text }}>{value}</span>
    </div>
  );
}

function PersonnelSelect({ personnel, value, onChange, placeholder = 'Select person…' }: {
  personnel: MedPersonnel[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <select style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 4 }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {personnel.map(p => (
        <option key={p.id} value={p.id}>{personnelFullName(p)} ({p.licenseLevel?.name ?? 'No Level'})</option>
      ))}
    </select>
  );
}

function BottomSheet({ title, icon, accentColor, onClose, children }: {
  title: string; icon: string; accentColor: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <h6 style={{ margin: 0, fontWeight: 700, color: T.text }}>
            <i className={`bi ${icon} me-2`} style={{ color: accentColor }} />{title}
          </h6>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Receive Modal ─────────────────────────────────────────────────────────────

function ReceiveModal({ tenantId, vial, personnel, onClose, onDone }: {
  tenantId: string; vial: MedVial; personnel: MedPersonnel[];
  onClose: () => void; onDone: () => void;
}) {
  const [lotNumber, setLotNumber] = useState(vial.lotNumber);
  const [expiresAt, setExpiresAt] = useState(vial.expiresAt ? vial.expiresAt.split('T')[0] : '');
  const [totalVolumeMl, setTotalVolumeMl] = useState(vial.totalVolumeMl.toString());
  const [personnelId, setPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    const vol = parseFloat(totalVolumeMl);
    if (!lotNumber || isNaN(vol) || vol <= 0) { setErr('Lot number and volume are required.'); return; }
    setSaving(true);
    try {
      await receiveVial(tenantId, vial.id, {
        lotNumber, expiresAt: expiresAt || undefined, totalVolumeMl: vol,
        personnelId: personnelId || undefined, notes: notes || undefined,
      });
      onDone();
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <BottomSheet title="Receive Vial" icon="bi-box-arrow-in-down" accentColor={T.cyan} onClose={onClose}>
      {err && <ErrBox msg={err} />}
      <label style={labelStyle}>Lot Number *</label>
      <input style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
      <label style={labelStyle}>Expiry Date</label>
      <input type="date" style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
      <label style={labelStyle}>Total Volume (mL) *</label>
      <input type="number" step="0.1" min="0.1" style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} value={totalVolumeMl} onChange={e => setTotalVolumeMl(e.target.value)} />
      <label style={labelStyle}>Received By</label>
      <PersonnelSelect personnel={personnel} value={personnelId} onChange={setPersonnelId} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Notes</label>
      <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: 16 }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <SubmitBtn label="Confirm Receipt" color={T.cyan} saving={saving} onClick={submit} />
    </BottomSheet>
  );
}

// ── Stock Modal ───────────────────────────────────────────────────────────────

function StockModal({ tenantId, vial, personnel, locations, onClose, onDone }: {
  tenantId: string; vial: MedVial; personnel: MedPersonnel[]; locations: MedStorageLocation[];
  onClose: () => void; onDone: () => void;
}) {
  const [containerId, setContainerId] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const allContainers = locations.flatMap(loc =>
    loc.containers.map(c => ({ ...c, locationName: loc.name }))
  );

  async function submit() {
    if (!containerId) { setErr('Please select a container.'); return; }
    setSaving(true);
    try {
      await stockVial(tenantId, vial.id, { containerId, personnelId: personnelId || undefined, notes: notes || undefined });
      onDone();
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <BottomSheet title="Stock Vial to Container" icon="bi-box-seam" accentColor={T.violet} onClose={onClose}>
      {err && <ErrBox msg={err} />}
      <label style={labelStyle}>Select Container *</label>
      <select style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} value={containerId} onChange={e => setContainerId(e.target.value)}>
        <option value="">Choose a container…</option>
        {allContainers.map(c => (
          <option key={c.id} value={c.id}>{c.locationName} → {c.name} ({c.containerType})</option>
        ))}
      </select>
      {allContainers.length === 0 && (
        <div style={{ fontSize: '0.8rem', color: T.amber, marginBottom: 12 }}>
          <i className="bi bi-exclamation-triangle me-1" />No containers found. Add a container to a location first.
        </div>
      )}
      <label style={labelStyle}>Stocked By</label>
      <PersonnelSelect personnel={personnel} value={personnelId} onChange={setPersonnelId} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Notes</label>
      <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: 16 }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <SubmitBtn label="Stock Vial" color={T.violet} saving={saving} onClick={submit} />
    </BottomSheet>
  );
}

// ── Move Modal ────────────────────────────────────────────────────────────────

function MoveModal({ tenantId, vial, personnel, locations, onClose, onDone }: {
  tenantId: string; vial: MedVial; personnel: MedPersonnel[]; locations: MedStorageLocation[];
  onClose: () => void; onDone: () => void;
}) {
  const [toContainerId, setToContainerId] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const allContainers = locations.flatMap(loc =>
    loc.containers
      .filter(c => c.id !== vial.containerId)
      .map(c => ({ ...c, locationName: loc.name }))
  );

  async function submit() {
    if (!toContainerId) { setErr('Please select a destination container.'); return; }
    setSaving(true);
    try {
      await moveVial(tenantId, vial.id, { toContainerId, personnelId: personnelId || undefined, notes: notes || undefined });
      onDone();
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <BottomSheet title="Move Vial" icon="bi-arrow-left-right" accentColor={T.cyan} onClose={onClose}>
      {vial.container && (
        <div style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.82rem', color: T.muted }}>
          <i className="bi bi-geo-alt me-2" style={{ color: T.accent }} />
          Current: <strong style={{ color: T.text }}>{vial.container.storageLocation?.name} → {vial.container.name}</strong>
        </div>
      )}
      {err && <ErrBox msg={err} />}
      <label style={labelStyle}>Move To *</label>
      <select style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} value={toContainerId} onChange={e => setToContainerId(e.target.value)}>
        <option value="">Select destination…</option>
        {allContainers.map(c => (
          <option key={c.id} value={c.id}>{c.locationName} → {c.name}</option>
        ))}
      </select>
      {allContainers.length === 0 && (
        <div style={{ fontSize: '0.8rem', color: T.amber, marginBottom: 12 }}>
          <i className="bi bi-exclamation-triangle me-1" />No other containers available.
        </div>
      )}
      <label style={labelStyle}>Moved By</label>
      <PersonnelSelect personnel={personnel} value={personnelId} onChange={setPersonnelId} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Notes</label>
      <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: 16 }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <SubmitBtn label="Confirm Move" color={T.cyan} saving={saving} onClick={submit} />
    </BottomSheet>
  );
}

// ── Administer Modal ──────────────────────────────────────────────────────────

function AdministerModal({ tenantId, vial, personnel, onClose, onDone }: {
  tenantId: string; vial: MedVial; personnel: MedPersonnel[];
  onClose: () => void; onDone: () => void;
}) {
  const [dosage, setDosage] = useState('');
  const [incident, setIncident] = useState('');
  const [weight, setWeight] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!dosage || !incident) { setErr('Dosage and incident number are required.'); return; }
    const d = parseFloat(dosage);
    if (d <= 0 || d > vial.remainingVolumeMl) { setErr(`Dosage must be between 0 and ${vial.remainingVolumeMl} mL.`); return; }
    setSaving(true);
    try {
      await administerVial(tenantId, vial.id, {
        dosageAmountMl: d, incidentNumber: incident,
        patientWeightKg: weight ? parseFloat(weight) : undefined,
        personnelId: personnelId || undefined, notes: notes || undefined,
      });
      onDone();
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <BottomSheet title="Administer Medication" icon="bi-syringe" accentColor={T.red} onClose={onClose}>
      {err && <ErrBox msg={err} />}
      <label style={labelStyle}>Dosage (mL) *</label>
      <input style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} type="number" step="0.1" min="0.1" max={vial.remainingVolumeMl}
        placeholder={`Max: ${vial.remainingVolumeMl} mL`} value={dosage} onChange={e => setDosage(e.target.value)} />
      <label style={labelStyle}>Incident / Call Number *</label>
      <input style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} placeholder="e.g. 2026-04-001" value={incident} onChange={e => setIncident(e.target.value)} />
      <label style={labelStyle}>Patient Weight (kg)</label>
      <input style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 12 }} type="number" step="0.1" placeholder="Optional" value={weight} onChange={e => setWeight(e.target.value)} />
      <label style={labelStyle}>Administered By</label>
      <PersonnelSelect personnel={personnel} value={personnelId} onChange={setPersonnelId} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Notes</label>
      <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: 16 }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <SubmitBtn label="Confirm Administration" color={T.red} saving={saving} onClick={submit} />
    </BottomSheet>
  );
}

// ── Waste Modal ───────────────────────────────────────────────────────────────

function WasteModal({ tenantId, vial, personnel, onClose, onDone }: {
  tenantId: string; vial: MedVial; personnel: MedPersonnel[];
  onClose: () => void; onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [witnessId, setWitnessId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const cfg = vial.medication?.configs?.[0];
  const requiresWitness = cfg?.requireWitnessForWaste ?? false;

  async function submit() {
    if (!amount) { setErr('Amount is required.'); return; }
    if (requiresWitness && !witnessId) { setErr('A witness is required for this controlled substance.'); return; }
    const a = parseFloat(amount);
    if (a <= 0 || a > vial.remainingVolumeMl) { setErr(`Amount must be between 0 and ${vial.remainingVolumeMl} mL.`); return; }
    setSaving(true);
    try {
      await wasteVial(tenantId, vial.id, {
        dosageAmountMl: a, personnelId: personnelId || undefined,
        witnessPersonnelId: witnessId || undefined, notes: notes || undefined,
      });
      onDone();
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <BottomSheet title="Waste Medication" icon="bi-droplet-half" accentColor={T.amber} onClose={onClose}>
      {requiresWitness && (
        <div style={{ background: '#2a1a0e', border: `1px solid ${T.amber}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: T.amber, fontSize: '0.85rem' }}>
          <i className="bi bi-shield-exclamation me-2" /><strong>Controlled substance</strong> — witness signature required
        </div>
      )}
      {err && <ErrBox msg={err} />}
      <label style={labelStyle}>Amount to Waste (mL) *</label>
      <input style={{ ...inputStyle, width: '100%', padding: '10px 12px', marginBottom: 4 }} type="number" step="0.1" min="0.1" max={vial.remainingVolumeMl}
        placeholder={`Max: ${vial.remainingVolumeMl} mL`} value={amount} onChange={e => setAmount(e.target.value)} />
      {amount && (
        <div style={{ fontSize: '0.78rem', color: T.muted, marginBottom: 12 }}>
          After waste: <strong style={{ color: T.text }}>{Math.max(0, vial.remainingVolumeMl - parseFloat(amount || '0')).toFixed(2)} mL</strong> remaining
        </div>
      )}
      <label style={labelStyle}>Wasted By</label>
      <PersonnelSelect personnel={personnel} value={personnelId} onChange={setPersonnelId} />
      <label style={{ ...labelStyle, marginTop: 12 }}>
        Witness {requiresWitness && <span style={{ color: T.red }}>*</span>}
      </label>
      <PersonnelSelect personnel={personnel.filter(p => p.id !== personnelId)} value={witnessId} onChange={setWitnessId} placeholder="Select witness…" />
      <label style={{ ...labelStyle, marginTop: 12 }}>Notes</label>
      <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: 16 }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <SubmitBtn label="Confirm Waste" color={T.amber} dark saving={saving} onClick={submit} />
    </BottomSheet>
  );
}

// ── Simple Modal (dispose / expire) ───────────────────────────────────────────

function SimpleModal({ title, icon, color, message, personnel, onClose, onDone }: {
  title: string; icon: string; color: string; message: string;
  personnel: MedPersonnel[];
  onClose: () => void; onDone: (personnelId?: string, notes?: string) => Promise<void>;
}) {
  const [personnelId, setPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <BottomSheet title={title} icon={icon} accentColor={color} onClose={onClose}>
      <p style={{ color: T.muted, fontSize: '0.88rem', marginBottom: 16 }}>{message}</p>
      <label style={labelStyle}>Performed By</label>
      <PersonnelSelect personnel={personnel} value={personnelId} onChange={setPersonnelId} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Notes</label>
      <textarea style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: 16 }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <SubmitBtn label="Confirm" color={color} saving={saving} onClick={async () => { setSaving(true); await onDone(personnelId || undefined, notes || undefined); setSaving(false); }} />
    </BottomSheet>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = { color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 };

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#2a0e0e', border: `1px solid ${T.red}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: T.red, fontSize: '0.85rem' }}>
      <i className="bi bi-exclamation-circle me-2" />{msg}
    </div>
  );
}

function SubmitBtn({ label, color, saving, onClick, dark }: { label: string; color: string; saving: boolean; onClick: () => void; dark?: boolean }) {
  return (
    <button
      style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: color, color: dark ? '#000' : '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
      onClick={onClick} disabled={saving}
    >
      {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-circle me-2" />}
      {label}
    </button>
  );
}
