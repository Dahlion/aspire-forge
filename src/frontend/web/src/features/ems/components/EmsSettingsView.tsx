import { useEffect, useState } from 'react';
import { fetchLicenseLevels, createLicenseLevel, updateLicenseLevel, deleteLicenseLevel, fetchTags, createTag, deleteTag } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedLicenseLevel, MedTag } from '../../../types/ems';

interface Props { tenantId: string; }

type Tab = 'levels' | 'tags';

export default function EmsSettingsView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('levels');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 style={{ margin: 0, flex: 1, color: T.text, fontWeight: 700 }}>
          <i className="bi bi-gear-fill me-2" style={{ color: T.accent }} />Settings
        </h5>
      </div>

      {/* Quick links */}
      <div className="row g-2 mb-4">
        {[
          { icon: 'bi-people-fill', label: 'Personnel Roster', nav: () => navigateEms({ kind: 'personnel' }) },
          { icon: 'bi-building', label: 'Locations', nav: () => navigateEms({ kind: 'locations' }) },
          { icon: 'bi-journal-medical', label: 'Medication Catalog', nav: () => navigateEms({ kind: 'catalog' }) },
          { icon: 'bi-sliders', label: 'Agency Config', nav: () => navigateEms({ kind: 'agency-config' }) },
          { icon: 'bi-bar-chart-fill', label: 'Reports', nav: () => navigateEms({ kind: 'reports' }) },
        ].map(item => (
          <div key={item.label} className="col-6">
            <button onClick={item.nav}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, cursor: 'pointer', textAlign: 'center' }}>
              <i className={`bi ${item.icon} d-block`} style={{ fontSize: '1.5rem', color: T.accent, marginBottom: 4 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
        {(['levels', 'tags'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              color: tab === t ? T.accent : T.muted,
              borderBottom: tab === t ? `2px solid ${T.accent}` : '2px solid transparent',
              fontWeight: tab === t ? 700 : 400,
              fontSize: '0.88rem',
            }}>
            {t === 'levels' ? 'License Levels' : 'Tags'}
          </button>
        ))}
      </div>

      {tab === 'levels' && <LicenseLevelsPanel tenantId={tenantId} />}
      {tab === 'tags' && <TagsPanel tenantId={tenantId} />}
    </div>
  );
}

const LEVEL_PRESETS = [
  { name: 'Driver', rank: 0, can: [] as string[] },
  { name: 'EMT', rank: 1, can: ['canReceive', 'canStock', 'canMove', 'canPerformCheck'] },
  { name: 'AEMT', rank: 2, can: ['canReceive', 'canStock', 'canMove', 'canPerformCheck', 'canAdminister', 'canWaste', 'canWitness'] },
  { name: 'Paramedic', rank: 3, can: ['canReceive', 'canStock', 'canMove', 'canPerformCheck', 'canAdminister', 'canWaste', 'canWitness', 'canOrder'] },
  { name: 'Service Admin', rank: 4, can: ['canReceive', 'canStock', 'canMove', 'canPerformCheck', 'canAdminister', 'canWaste', 'canWitness', 'canOrder', 'canManageCatalog', 'canManageRoster', 'canManageLocations'] },
  { name: 'Medical Director', rank: 5, can: ['canReceive', 'canStock', 'canMove', 'canPerformCheck', 'canAdminister', 'canWaste', 'canWitness', 'canOrder', 'canManageCatalog', 'canManageRoster', 'canManageLocations'] },
];

const PERMISSIONS = [
  { key: 'canAdminister',     label: 'Administer medication' },
  { key: 'canWaste',          label: 'Waste medication' },
  { key: 'canWitness',        label: 'Witness waste' },
  { key: 'canStock',          label: 'Stock vials' },
  { key: 'canOrder',          label: 'Order medication' },
  { key: 'canReceive',        label: 'Receive delivery' },
  { key: 'canMove',           label: 'Move vials' },
  { key: 'canPerformCheck',   label: 'Perform drug check' },
  { key: 'canManageCatalog',  label: 'Manage catalog' },
  { key: 'canManageRoster',   label: 'Manage roster' },
  { key: 'canManageLocations','label': 'Manage locations' },
] as const;

function LicenseLevelsPanel({ tenantId }: { tenantId: string }) {
  const [levels, setLevels] = useState<MedLicenseLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<MedLicenseLevel>>({ name: '', rank: 0 });
  const [saving, setSaving] = useState(false);

  const reload = () => fetchLicenseLevels(tenantId).then(setLevels).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { reload(); }, [tenantId]);

  function startPreset(p: typeof LEVEL_PRESETS[number]) {
    const perms: Partial<MedLicenseLevel> = {};
    PERMISSIONS.forEach(({ key }) => { (perms as any)[key] = p.can.includes(key); });
    setForm({ name: p.name, rank: p.rank, ...perms });
    setEditId(null);
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editId) await updateLicenseLevel(tenantId, editId, form as any);
      else await createLicenseLevel(tenantId, form as any);
      setShowForm(false); setEditId(null);
      await reload();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;

  return (
    <div>
      {levels.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: T.muted, fontSize: '0.82rem', marginBottom: 8 }}>Quick-start with standard EMS levels:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LEVEL_PRESETS.map(p => (
              <button key={p.name} onClick={() => startPreset(p)}
                style={{ background: 'transparent', border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 8, padding: '4px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', rank: 0 }); }}
        style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
        <i className="bi bi-plus-lg me-1" />Add Custom Level
      </button>

      {showForm && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
          <div className="row g-2 mb-3">
            <div className="col-8">
              <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Name</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 12px' }} value={form.name ?? ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-4">
              <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Rank</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 12px' }} type="number" min="0" value={form.rank ?? 0}
                onChange={e => setForm(f => ({ ...f, rank: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: T.muted, fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 8 }}>Permissions</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PERMISSIONS.map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: T.text, fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={!!(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={!form.name || saving}
              style={{ flex: 1, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {editId ? 'Save Changes' : 'Create Level'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ ...btnBackStyle, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {levels.map(l => (
          <div key={l.id} style={cardStyle}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: T.text }}>
                  {l.name}
                  <span style={{ background: '#374151', color: '#9ca3af', borderRadius: 8, fontSize: '0.65rem', padding: '1px 7px', marginLeft: 8, fontWeight: 600 }}>Rank {l.rank}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {PERMISSIONS.filter(({ key }) => (l as any)[key]).map(({ key, label }) => (
                    <span key={key} style={{ background: T.accent, color: '#fff', borderRadius: 10, fontSize: '0.62rem', padding: '1px 7px', fontWeight: 600 }}>{label}</span>
                  ))}
                  {PERMISSIONS.every(({ key }) => !(l as any)[key]) && (
                    <span style={{ color: T.muted, fontSize: '0.78rem' }}>No permissions</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => {
                  setEditId(l.id);
                  const perms: Partial<MedLicenseLevel> = {};
                  PERMISSIONS.forEach(({ key }) => { (perms as any)[key] = (l as any)[key]; });
                  setForm({ name: l.name, rank: l.rank, ...perms });
                  setShowForm(true);
                }} style={{ ...btnBackStyle, borderRadius: 6, padding: '5px 9px', cursor: 'pointer' }}>
                  <i className="bi bi-pencil" />
                </button>
                <button onClick={async () => {
                  if (!confirm(`Delete "${l.name}" license level? This cannot be undone.`)) return;
                  try { await deleteLicenseLevel(tenantId, l.id); await reload(); } catch (e: any) { alert(e.message); }
                }} style={{ background: 'transparent', border: `1px solid ${T.red}`, borderRadius: 6, color: T.red, padding: '5px 9px', cursor: 'pointer' }}>
                  <i className="bi bi-trash" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagsPanel({ tenantId }: { tenantId: string }) {
  const [tags, setTags] = useState<MedTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#17a2b8');
  const [saving, setSaving] = useState(false);

  const reload = () => fetchTags(tenantId).then(setTags).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { reload(); }, [tenantId]);

  async function add() {
    if (!name) return;
    setSaving(true);
    try { await createTag(tenantId, { name, color }); setName(''); await reload(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await deleteTag(tenantId, id); await reload(); }
    catch (e: any) { alert(e.message); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;

  return (
    <div>
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Tag Name</label>
            <input style={{ ...inputStyle, width: '100%', padding: '8px 12px' }} placeholder="e.g. Refrigeration Required"
              value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          </div>
          <div>
            <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Color</label>
            <input type="color" style={{ ...inputStyle, width: 44, height: 38, padding: 2, cursor: 'pointer' }} value={color} onChange={e => setColor(e.target.value)} />
          </div>
          <button onClick={add} disabled={!name || saving}
            style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer' }}>
            {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-plus-lg" />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: t.color, color: '#fff', borderRadius: 20, padding: '4px 10px 4px 12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.name}</span>
            <button onClick={() => remove(t.id)}
              style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem' }}>
              ✕
            </button>
          </div>
        ))}
        {tags.length === 0 && <div style={{ color: T.muted }}>No tags defined yet.</div>}
      </div>
    </div>
  );
}
