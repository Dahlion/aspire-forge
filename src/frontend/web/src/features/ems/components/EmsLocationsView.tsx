import { useEffect, useState } from 'react';
import { fetchLocations, createLocation, updateLocation } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, cardHeaderStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedStorageLocation } from '../../../types/ems';
import { LOCATION_TYPE_ICONS } from '../../../types/ems';

interface Props { tenantId: string; }

export default function EmsLocationsView({ tenantId }: Props) {
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', locationType: 'unit', description: '' });
  const [saving, setSaving] = useState(false);

  const reload = () => fetchLocations(tenantId).then(setLocations).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { reload(); }, [tenantId]);

  async function save() {
    setSaving(true);
    try {
      if (editId) await updateLocation(tenantId, editId, form as any);
      else await createLocation(tenantId, form as any);
      setShowForm(false); setEditId(null); setForm({ name: '', locationType: 'unit', description: '' });
      await reload();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  function startEdit(loc: MedStorageLocation) {
    setEditId(loc.id);
    setForm({ name: loc.name, locationType: loc.locationType, description: loc.description ?? '' });
    setShowForm(true);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 className="mb-0 fw-bold flex-grow-1" style={{ color: T.text }}>
          <i className="bi bi-building me-2" style={{ color: T.accent }} />Locations
        </h5>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', locationType: 'unit', description: '' }); }}
          style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <i className="bi bi-plus-lg me-1" />Add
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ padding: 16 }}>
            <h6 style={{ color: T.text, fontWeight: 700, marginBottom: 12 }}>{editId ? 'Edit Location' : 'New Location'}</h6>
            <div className="mb-3">
              <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Name</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} placeholder="e.g. Medic 3"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Type</label>
              <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}
                value={form.locationType} onChange={e => setForm(f => ({ ...f, locationType: e.target.value }))}>
                <option value="unit">Unit / Ambulance</option>
                <option value="truck">Truck</option>
                <option value="station">Station</option>
                <option value="vault">Vault</option>
              </select>
            </div>
            <div className="mb-3">
              <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Description (optional)</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="d-flex gap-2">
              <button onClick={save} disabled={!form.name || saving}
                style={{ flex: 1, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {editId ? 'Save Changes' : 'Create Location'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: '10px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
          <i className="bi bi-building" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <div className="mt-2">No locations yet. Add your first above.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {locations.map(loc => {
            const activeVials = loc.containers.flatMap(c => c.vials ?? []).filter(v => v.status === 'stocked' || v.status === 'in-use').length;
            const brokenSeal = loc.containers.filter(c => c.isSealable && !c.isSealed).length;
            return (
              <div key={loc.id} style={cardStyle}>
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => navigateEms({ kind: 'location', locationId: loc.id })}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1, textAlign: 'left' }}
                  >
                    <i className={`bi ${LOCATION_TYPE_ICONS[loc.locationType] ?? 'bi-building'}`}
                      style={{ fontSize: '1.8rem', color: T.accent }} />
                    <div>
                      <div style={{ fontWeight: 700, color: T.text }}>{loc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: T.muted }}>
                        {loc.containers.length} containers · {activeVials} active vials
                        {brokenSeal > 0 && (
                          <span style={{ color: T.red, marginLeft: 8, fontWeight: 700 }}>
                            ⚠ {brokenSeal} broken seal{brokenSeal > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => startEdit(loc)}
                    style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, padding: '5px 9px', cursor: 'pointer' }}>
                    <i className="bi bi-pencil" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
