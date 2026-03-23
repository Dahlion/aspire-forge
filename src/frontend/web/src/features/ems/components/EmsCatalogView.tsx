import { useEffect, useState } from 'react';
import {
  fetchMedications, createMedication, updateMedication,
  fetchTags, addMedicationTag, removeMedicationTag,
  fetchMedConfig, upsertMedConfig, createVial, fetchLocations,
} from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedMedication, MedTag, MedMedicationConfig, MedStorageLocation } from '../../../types/ems';
import { DEA_SCHEDULE_LABELS } from '../../../types/ems';

interface Props { tenantId: string; }

const DEA_FILTER_OPTIONS = [
  { value: -1, label: 'All' },
  { value: 0,  label: 'Non-Controlled' },
  { value: 2,  label: 'Schedule II' },
  { value: 3,  label: 'Schedule III' },
  { value: 4,  label: 'Schedule IV' },
  { value: 5,  label: 'Schedule V' },
];

const ROUTES = ['IV', 'IO', 'IM', 'SQ', 'SL', 'IN', 'PO', 'ET', 'Topical', 'Other'];

export default function EmsCatalogView({ tenantId }: Props) {
  const [meds, setMeds] = useState<MedMedication[]>([]);
  const [tags, setTags] = useState<MedTag[]>([]);
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deaFilter, setDeaFilter] = useState(-1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    genericName: '', brandName: '', deaSchedule: 0, ndcCode: '',
    concentration: '', routeOfAdministration: '', formDescription: '',
  });
  const [saving, setSaving] = useState(false);

  const reload = () => Promise.all([
    fetchMedications(tenantId), fetchTags(tenantId), fetchLocations(tenantId),
  ]).then(([m, t, l]) => { setMeds(m); setTags(t); setLocations(l); }).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { reload(); }, [tenantId]);

  function startEdit(med: MedMedication) {
    setEditId(med.id);
    setForm({
      genericName: med.genericName, brandName: med.brandName ?? '',
      deaSchedule: med.deaSchedule, ndcCode: med.ndcCode ?? '',
      concentration: med.concentration ?? '', routeOfAdministration: med.routeOfAdministration ?? '',
      formDescription: med.formDescription ?? '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    setSaving(true);
    try {
      if (editId) await updateMedication(tenantId, editId, form as any);
      else await createMedication(tenantId, form as any);
      setShowForm(false); setEditId(null);
      setForm({ genericName: '', brandName: '', deaSchedule: 0, ndcCode: '', concentration: '', routeOfAdministration: '', formDescription: '' });
      await reload();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  const filtered = meds.filter(m => {
    if (deaFilter !== -1 && m.deaSchedule !== deaFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return m.genericName.toLowerCase().includes(s) || m.brandName?.toLowerCase().includes(s) ||
           m.ndcCode?.toLowerCase().includes(s) || false;
  });

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 className="mb-0 fw-bold flex-grow-1" style={{ color: T.text }}>
          <i className="bi bi-journal-medical me-2" style={{ color: T.accent }} />Catalog
          {!loading && <span style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 400, marginLeft: 8 }}>({filtered.length})</span>}
        </h5>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ genericName: '', brandName: '', deaSchedule: 0, ndcCode: '', concentration: '', routeOfAdministration: '', formDescription: '' }); }}
          style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
          <i className="bi bi-plus-lg me-1" />Add
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <span style={{ background: T.card, border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '0 12px', display: 'flex', alignItems: 'center', color: T.muted }}>
          <i className="bi bi-search" />
        </span>
        <input style={{ ...inputStyle, flex: 1, padding: '10px 12px', borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
          placeholder="Search name, brand, NDC…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* DEA Schedule filter pills */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
        {DEA_FILTER_OPTIONS.map(opt => {
          const isControlled = opt.value > 0;
          const activeColor = isControlled ? T.red : opt.value === 0 ? T.green : T.accent;
          const active = deaFilter === opt.value;
          return (
            <button key={opt.value} onClick={() => setDeaFilter(opt.value)}
              style={{
                flexShrink: 0,
                background: active ? activeColor : T.card,
                border: `1px solid ${active ? activeColor : T.border}`,
                color: active ? '#fff' : T.muted,
                borderRadius: 20, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              }}>
              {isControlled && <i className="bi bi-shield-exclamation me-1" style={{ fontSize: '0.72rem' }} />}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
          <h6 style={{ color: T.text, fontWeight: 700, marginBottom: 12 }}>
            {editId ? <><i className="bi bi-pencil me-2" style={{ color: T.accent }} />Edit Medication</> : <><i className="bi bi-plus-circle me-2" style={{ color: T.green }} />Add Medication</>}
          </h6>
          <div className="row g-2">
            <div className="col-12">
              <label style={lbl}>Generic Name *</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} placeholder="e.g. Epinephrine"
                value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))} />
            </div>
            <div className="col-6">
              <label style={lbl}>Brand Name</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="e.g. EpiPen"
                value={form.brandName} onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} />
            </div>
            <div className="col-6">
              <label style={lbl}>DEA Schedule</label>
              <select style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} value={form.deaSchedule} onChange={e => setForm(f => ({ ...f, deaSchedule: parseInt(e.target.value) }))}>
                {Object.entries(DEA_SCHEDULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label style={lbl}>NDC Code</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="e.g. 0641-6081-25"
                value={form.ndcCode} onChange={e => setForm(f => ({ ...f, ndcCode: e.target.value }))} />
            </div>
            <div className="col-6">
              <label style={lbl}>Concentration</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="e.g. 1 mg/mL"
                value={form.concentration} onChange={e => setForm(f => ({ ...f, concentration: e.target.value }))} />
            </div>
            <div className="col-6">
              <label style={lbl}>Route</label>
              <select style={{ ...inputStyle, width: '100%', padding: '8px 10px' }}
                value={form.routeOfAdministration} onChange={e => setForm(f => ({ ...f, routeOfAdministration: e.target.value }))}>
                <option value="">Select…</option>
                {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                {form.routeOfAdministration && !ROUTES.includes(form.routeOfAdministration) && (
                  <option value={form.routeOfAdministration}>{form.routeOfAdministration}</option>
                )}
              </select>
            </div>
            <div className="col-6">
              <label style={lbl}>Form / Package</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="e.g. 1 mL syringe"
                value={form.formDescription} onChange={e => setForm(f => ({ ...f, formDescription: e.target.value }))} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button onClick={save} disabled={!form.genericName || saving}
              style={{ flex: 1, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {editId ? 'Save Changes' : 'Add to Catalog'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              style={{ ...btnBackStyle, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
          <i className="bi bi-journal-medical" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <div className="mt-2">{search || deaFilter !== -1 ? 'No medications match this filter.' : 'No medications in catalog. Add one above.'}</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map(med => (
            <MedCard key={med.id} med={med} tags={tags} locations={locations} tenantId={tenantId}
              onUpdated={reload} onEdit={() => startEdit(med)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Medication card ───────────────────────────────────────────────────────────

function MedCard({ med, tags, locations, tenantId, onUpdated, onEdit }: {
  med: MedMedication; tags: MedTag[]; locations: MedStorageLocation[];
  tenantId: string; onUpdated: () => void; onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddVial, setShowAddVial] = useState(false);
  const isControlled = med.deaSchedule > 0;
  const appliedTagIds = new Set(med.tags.map(t => t.tagId));

  async function toggleTag(tagId: string) {
    try {
      if (appliedTagIds.has(tagId)) await removeMedicationTag(tenantId, med.id, tagId);
      else await addMedicationTag(tenantId, med.id, tagId);
      onUpdated();
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 8 }}>
        <button onClick={() => setExpanded(!expanded)}
          style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: T.text, fontSize: '0.95rem' }}>{med.genericName}</div>
              {med.brandName && <div style={{ fontSize: '0.8rem', color: T.muted }}>{med.brandName}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                <span style={{
                  background: isControlled ? '#3d1515' : '#374151',
                  color: isControlled ? T.amber : '#9ca3af',
                  border: isControlled ? `1px solid ${T.amber}55` : 'none',
                  borderRadius: 10, fontSize: '0.65rem', padding: '1px 7px', fontWeight: 600,
                }}>
                  {isControlled && <i className="bi bi-shield-exclamation me-1" style={{ fontSize: '0.6rem' }} />}
                  {DEA_SCHEDULE_LABELS[med.deaSchedule]}
                </span>
                {med.concentration && (
                  <span style={{ background: T.cardAlt, color: T.muted, borderRadius: 10, fontSize: '0.65rem', padding: '1px 7px' }}>
                    {med.concentration}
                  </span>
                )}
                {med.routeOfAdministration && (
                  <span style={{ background: T.cardAlt, color: T.muted, borderRadius: 10, fontSize: '0.65rem', padding: '1px 7px' }}>
                    {med.routeOfAdministration}
                  </span>
                )}
                {med.tags.map(t => (
                  <span key={t.tagId} style={{ background: t.tag?.color ?? '#17a2b8', color: '#fff', borderRadius: 10, fontSize: '0.65rem', padding: '1px 7px', fontWeight: 600 }}>
                    {t.tag?.name}
                  </span>
                ))}
              </div>
            </div>
            <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: T.muted, marginLeft: 8 }} />
          </div>
        </button>
        <button onClick={onEdit}
          style={{ ...btnBackStyle, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', flexShrink: 0 }}>
          <i className="bi bi-pencil" />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {/* Details */}
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem' }}>
            {med.ndcCode && <DetailRow icon="bi-upc" value={`NDC: ${med.ndcCode}`} />}
            {med.concentration && <DetailRow icon="bi-droplet" value={med.concentration} />}
            {med.routeOfAdministration && <DetailRow icon="bi-arrow-right-circle" value={med.routeOfAdministration} />}
            {med.formDescription && <DetailRow icon="bi-capsule" value={med.formDescription} />}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ padding: '0 16px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: T.muted, marginBottom: 6 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map(tag => {
                  const applied = appliedTagIds.has(tag.id);
                  return (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)}
                      style={{
                        background: applied ? tag.color : 'transparent',
                        border: `1px solid ${tag.color}`,
                        color: applied ? '#fff' : tag.color,
                        borderRadius: 20, fontSize: '0.75rem', padding: '3px 10px', cursor: 'pointer', fontWeight: 600,
                      }}>
                      {applied && <i className="bi bi-check me-1" />}{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medication Config */}
          <div style={{ borderTop: `1px solid ${T.border}` }}>
            <MedConfigPanel tenantId={tenantId} medId={med.id} existingConfig={med.configs?.[0]} />
          </div>

          {/* Add Vial to Inventory */}
          <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            <button onClick={() => setShowAddVial(!showAddVial)}
              style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 14px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              <i className="bi bi-plus-lg me-1" />{showAddVial ? 'Cancel' : 'Add Vial to Inventory'}
            </button>
            {showAddVial && (
              <AddVialForm tenantId={tenantId} medicationId={med.id} locations={locations}
                onDone={() => { setShowAddVial(false); onUpdated(); }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: T.muted }}>
      <i className={`bi ${icon}`} style={{ width: 14, flexShrink: 0 }} />
      <span>{value}</span>
    </div>
  );
}

// ── Medication Config Panel ───────────────────────────────────────────────────

function MedConfigPanel({ tenantId, medId, existingConfig }: {
  tenantId: string; medId: string; existingConfig?: MedMedicationConfig;
}) {
  const [cfg, setCfg] = useState<MedMedicationConfig | null>(existingConfig ?? null);
  const [loading, setLoading] = useState(!existingConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existingConfig) {
      fetchMedConfig(tenantId, medId)
        .then(setCfg)
        .catch(() => setCfg(null))
        .finally(() => setLoading(false));
    }
  }, [medId]);

  const localCfg = cfg ?? { requireWitnessForWaste: false, isControlledSubstance: false, requireSealedStorage: false, minCheckFrequencyHours: undefined, requiresPhysicalCount: false } as any;

  async function save() {
    setSaving(true);
    try {
      const updated = await upsertMedConfig(tenantId, medId, {
        requireWitnessForWaste:   localCfg.requireWitnessForWaste,
        isControlledSubstance:    localCfg.isControlledSubstance,
        requireSealedStorage:     localCfg.requireSealedStorage,
        minCheckFrequencyHours:   localCfg.minCheckFrequencyHours ?? undefined,
        requiresPhysicalCount:    localCfg.requiresPhysicalCount,
      });
      setCfg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 12, color: T.muted, fontSize: '0.8rem' }}>Loading config…</div>;

  const toggle = (key: keyof typeof localCfg, val: boolean) => setCfg(c => ({ ...c!, [key]: val }));

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: T.muted }}>
          <i className="bi bi-gear me-1" />MEDICATION CONFIGURATION
        </span>
        <button onClick={save} disabled={saving}
          style={{ background: T.accent, border: 'none', borderRadius: 6, color: '#fff', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
          {saving ? <span className="spinner-border spinner-border-sm" /> : saved ? <><i className="bi bi-check me-1" />Saved</> : 'Save'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { key: 'isControlledSubstance', label: 'Treat as Controlled Substance', desc: 'Enables extra logging and DEA tracking' },
          { key: 'requireWitnessForWaste', label: 'Require Witness for Waste', desc: 'Waste events need a witness signature' },
          { key: 'requireSealedStorage', label: 'Require Sealed Storage', desc: 'Vial must be in a sealed container' },
          { key: 'requiresPhysicalCount', label: 'Require Physical Count', desc: 'Seal inheritance does not satisfy checks for this drug — must be physically verified' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ color: T.text, fontSize: '0.82rem', fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: T.muted, fontSize: '0.72rem', marginTop: 1 }}>{item.desc}</div>
            </div>
            <button onClick={() => toggle(item.key as any, !(localCfg as any)[item.key])}
              style={{
                flexShrink: 0, width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: (localCfg as any)[item.key] ? T.green : '#374151',
                position: 'relative', transition: 'background 0.2s',
              }}>
              <span style={{
                position: 'absolute', top: 2, left: (localCfg as any)[item.key] ? 19 : 2,
                width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* Per-drug check frequency override */}
      <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
        <div style={{ color: T.text, fontSize: '0.82rem', fontWeight: 600, marginBottom: 2 }}>Min Check Frequency Override</div>
        <div style={{ color: T.muted, fontSize: '0.72rem', marginBottom: 6 }}>
          Override the agency default for this drug specifically. Leave blank to use the agency default.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min={1}
            style={{ ...inputStyle, width: 100, padding: '7px 10px', fontSize: '0.85rem' }}
            placeholder="hours"
            value={localCfg.minCheckFrequencyHours ?? ''}
            onChange={e => {
              const v = e.target.value ? parseInt(e.target.value) : null;
              setCfg(c => ({ ...c!, minCheckFrequencyHours: v ?? undefined }));
            }}
          />
          <span style={{ color: T.muted, fontSize: '0.78rem' }}>hours</span>
          {localCfg.minCheckFrequencyHours && (
            <span style={{ color: T.muted, fontSize: '0.75rem' }}>
              = {localCfg.minCheckFrequencyHours % 168 === 0 ? `${localCfg.minCheckFrequencyHours / 168}w`
                : localCfg.minCheckFrequencyHours % 24 === 0 ? `${localCfg.minCheckFrequencyHours / 24}d`
                : `${localCfg.minCheckFrequencyHours}h`}
            </span>
          )}
          {localCfg.minCheckFrequencyHours && (
            <button onClick={() => setCfg(c => ({ ...c!, minCheckFrequencyHours: undefined }))}
              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px' }}>
              <i className="bi bi-x-circle" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Vial Form ─────────────────────────────────────────────────────────────

function AddVialForm({ tenantId, medicationId, locations, onDone }: {
  tenantId: string; medicationId: string; locations: MedStorageLocation[]; onDone: () => void;
}) {
  const [form, setForm] = useState({
    lotNumber: '', expiresAt: '', totalVolumeMl: '', agencyLabelCode: '', manufacturerBarcode: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.lotNumber || !form.totalVolumeMl) { alert('Lot number and volume are required.'); return; }
    const vol = parseFloat(form.totalVolumeMl);
    if (isNaN(vol) || vol <= 0) { alert('Invalid volume.'); return; }
    setSaving(true);
    try {
      await createVial(tenantId, {
        medicationId,
        lotNumber: form.lotNumber,
        totalVolumeMl: vol,
        expiresAt: form.expiresAt || undefined,
        agencyLabelCode: form.agencyLabelCode || undefined,
        manufacturerBarcode: form.manufacturerBarcode || undefined,
      });
      onDone();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ ...cardStyle, marginTop: 12, padding: 14, border: `1px solid ${T.green}33` }}>
      <div style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 10 }}>
        Vial will be added as <strong style={{ color: T.text }}>Received</strong> status and can be stocked to a container from the Vials list.
      </div>
      <div className="row g-2">
        <div className="col-6">
          <label style={lbl}>Lot Number *</label>
          <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="e.g. A2204X"
            value={form.lotNumber} onChange={e => set('lotNumber', e.target.value)} />
        </div>
        <div className="col-6">
          <label style={lbl}>Expiry Date</label>
          <input type="date" style={{ ...inputStyle, width: '100%', padding: '8px 10px' }}
            value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
        </div>
        <div className="col-6">
          <label style={lbl}>Total Volume (mL) *</label>
          <input type="number" step="0.1" min="0.1" style={{ ...inputStyle, width: '100%', padding: '8px 10px' }}
            placeholder="e.g. 1.0" value={form.totalVolumeMl} onChange={e => set('totalVolumeMl', e.target.value)} />
        </div>
        <div className="col-6">
          <label style={lbl}>Agency Label Code</label>
          <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="Optional QR code"
            value={form.agencyLabelCode} onChange={e => set('agencyLabelCode', e.target.value)} />
        </div>
        <div className="col-12">
          <label style={lbl}>Manufacturer Barcode</label>
          <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="Optional"
            value={form.manufacturerBarcode} onChange={e => set('manufacturerBarcode', e.target.value)} />
        </div>
      </div>
      <button onClick={save} disabled={!form.lotNumber || !form.totalVolumeMl || saving}
        style={{ marginTop: 12, width: '100%', background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
        {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-plus-circle me-2" />}
        Add Vial to Inventory
      </button>
    </div>
  );
}

const lbl: React.CSSProperties = { color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 };
