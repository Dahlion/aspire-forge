import { useEffect, useState } from 'react';
import { fetchPersonnel, fetchLicenseLevels, createPersonnel, updatePersonnel, deletePersonnel } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedPersonnel, MedLicenseLevel } from '../../../types/ems';
import { personnelFullName } from '../../../types/ems';

interface Props { tenantId: string; }

export default function EmsPersonnelView({ tenantId }: Props) {
  const [people, setPeople] = useState<MedPersonnel[]>([]);
  const [levels, setLevels] = useState<MedLicenseLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', licenseLevelId: '', badgeNumber: '', email: '', keycloakUserId: '' });
  const [saving, setSaving] = useState(false);

  const reload = () => Promise.all([fetchPersonnel(tenantId), fetchLicenseLevels(tenantId)])
    .then(([p, l]) => { setPeople(p); setLevels(l); }).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { reload(); }, [tenantId]);

  async function save() {
    if (!form.firstName || !form.lastName || !form.licenseLevelId) { alert('Name and license level required.'); return; }
    setSaving(true);
    try {
      if (editId) await updatePersonnel(tenantId, editId, form as any);
      else await createPersonnel(tenantId, form as any);
      setShowForm(false); setEditId(null);
      setForm({ firstName: '', lastName: '', licenseLevelId: '', badgeNumber: '', email: '', keycloakUserId: '' });
      await reload();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  async function deactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They will no longer appear in active dropdowns.`)) return;
    try { await deletePersonnel(tenantId, id); await reload(); } catch (e: any) { alert(e.message); }
  }

  async function reactivate(p: MedPersonnel) {
    try {
      await updatePersonnel(tenantId, p.id, {
        firstName: p.firstName, lastName: p.lastName,
        licenseLevelId: p.licenseLevelId,
        badgeNumber: p.badgeNumber, email: p.email,
        keycloakUserId: p.keycloakUserId,
        isActive: true,
      } as any);
      await reload();
    } catch (e: any) { alert(e.message); }
  }

  function startEdit(p: MedPersonnel) {
    setEditId(p.id);
    setForm({ firstName: p.firstName, lastName: p.lastName, licenseLevelId: p.licenseLevelId, badgeNumber: p.badgeNumber ?? '', email: p.email ?? '', keycloakUserId: p.keycloakUserId ?? '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const displayPeople = people
    .filter(p => showInactive ? true : p.isActive)
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return personnelFullName(p).toLowerCase().includes(s) ||
             p.email?.toLowerCase().includes(s) ||
             p.badgeNumber?.toLowerCase().includes(s) ||
             p.licenseLevel?.name.toLowerCase().includes(s) ||
             false;
    });

  const activeCount = people.filter(p => p.isActive).length;
  const inactiveCount = people.filter(p => !p.isActive).length;

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 className="mb-0 fw-bold flex-grow-1" style={{ color: T.text }}>
          <i className="bi bi-people-fill me-2" style={{ color: T.accent }} />Personnel
          <span style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 400, marginLeft: 8 }}>
            {activeCount} active{inactiveCount > 0 ? `, ${inactiveCount} inactive` : ''}
          </span>
        </h5>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ firstName: '', lastName: '', licenseLevelId: levels[0]?.id ?? '', badgeNumber: '', email: '', keycloakUserId: '' }); }}
          style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <i className="bi bi-plus-lg me-1" />Add
        </button>
      </div>

      {/* Search + inactive toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <span style={{ background: T.card, border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '0 12px', display: 'flex', alignItems: 'center', color: T.muted }}>
            <i className="bi bi-search" />
          </span>
          <input style={{ ...inputStyle, flex: 1, padding: '9px 12px', borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
            placeholder="Search name, badge, email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {inactiveCount > 0 && (
          <button onClick={() => setShowInactive(!showInactive)}
            style={{
              background: showInactive ? '#374151' : T.card,
              border: `1px solid ${showInactive ? '#6b7280' : T.border}`,
              color: showInactive ? '#fff' : T.muted,
              borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
            }}>
            <i className="bi bi-eye me-1" />
            {showInactive ? 'Hide Inactive' : `Inactive (${inactiveCount})`}
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
          <h6 style={{ color: T.text, fontWeight: 700, marginBottom: 12 }}>
            {editId ? 'Edit Personnel Record' : 'Add New Personnel'}
          </h6>
          <div className="row g-2">
            <div className="col-6">
              <label style={lbl}>First Name *</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="col-6">
              <label style={lbl}>Last Name *</label>
              <input style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div className="col-12">
              <label style={lbl}>License Level *</label>
              <select style={{ ...inputStyle, width: '100%', padding: '10px 12px' }} value={form.licenseLevelId} onChange={e => setForm(f => ({ ...f, licenseLevelId: e.target.value }))}>
                <option value="">Select level…</option>
                {levels.map(l => (
                  <option key={l.id} value={l.id}>{l.name} (Rank {l.rank})</option>
                ))}
              </select>
              {levels.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: T.amber, marginTop: 4 }}>
                  <i className="bi bi-exclamation-triangle me-1" />
                  No license levels defined. <button onClick={() => navigateEms({ kind: 'settings' })} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}>Set them up first.</button>
                </div>
              )}
            </div>
            <div className="col-6">
              <label style={lbl}>Badge Number</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="e.g. 4421" value={form.badgeNumber} onChange={e => setForm(f => ({ ...f, badgeNumber: e.target.value }))} />
            </div>
            <div className="col-6">
              <label style={lbl}>Email</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} type="email" placeholder="For notifications" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-12">
              <label style={lbl}>Login Username</label>
              <input style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} placeholder="Matches their MedTrack login (for role-based access)"
                value={form.keycloakUserId} onChange={e => setForm(f => ({ ...f, keycloakUserId: e.target.value }))} />
              <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 3 }}>
                <i className="bi bi-info-circle me-1" />Links this record to a login account so permissions are applied automatically.
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button onClick={save} disabled={saving}
              style={{ flex: 1, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {editId ? 'Save Changes' : 'Add Personnel'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              style={{ ...btnBackStyle, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {displayPeople.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>
          <i className="bi bi-people" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <div className="mt-2">{search ? 'No personnel match this search.' : 'No personnel added yet.'}</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {displayPeople.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              levels={levels}
              onEdit={() => startEdit(p)}
              onDeactivate={() => deactivate(p.id, personnelFullName(p))}
              onReactivate={() => reactivate(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ person, levels, onEdit, onDeactivate, onReactivate }: {
  person: MedPersonnel;
  levels: MedLicenseLevel[];
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}) {
  const level = person.licenseLevel ?? levels.find(l => l.id === person.licenseLevelId);
  const isInactive = !person.isActive;

  return (
    <div style={{ ...cardStyle, opacity: isInactive ? 0.65 : 1 }}>
      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: isInactive ? '#374151' : T.cardAlt,
          border: `2px solid ${isInactive ? '#4b5563' : T.accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: isInactive ? '#6b7280' : T.accent, fontSize: '1rem',
        }}>
          {person.firstName[0]}{person.lastName[0]}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: T.text }}>{personnelFullName(person)}</span>
            {person.badgeNumber && (
              <span style={{ fontSize: '0.72rem', color: T.muted }}>#{person.badgeNumber}</span>
            )}
            {isInactive && (
              <span style={{ background: '#374151', color: '#9ca3af', borderRadius: 10, fontSize: '0.62rem', padding: '1px 7px', fontWeight: 600 }}>INACTIVE</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: isInactive ? '#374151' : T.accent,
              color: isInactive ? '#9ca3af' : '#fff',
              borderRadius: 10, fontSize: '0.67rem', padding: '1px 8px', fontWeight: 600,
            }}>
              {level?.name ?? 'No Level'}
            </span>
            {level && (
              <span style={{ background: T.cardAlt, color: T.muted, borderRadius: 10, fontSize: '0.62rem', padding: '1px 6px' }}>
                Rank {level.rank}
              </span>
            )}
            {person.email && (
              <span style={{ fontSize: '0.72rem', color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {person.email}
              </span>
            )}
          </div>
          {person.keycloakUserId && (
            <div style={{ fontSize: '0.68rem', color: T.muted, marginTop: 2 }}>
              <i className="bi bi-person-badge me-1" />Login: {person.keycloakUserId}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit}
            style={{ ...btnBackStyle, borderRadius: 6, padding: '5px 9px', cursor: 'pointer' }}>
            <i className="bi bi-pencil" />
          </button>
          {person.isActive ? (
            <button onClick={onDeactivate}
              style={{ background: 'transparent', border: `1px solid ${T.red}`, borderRadius: 6, color: T.red, padding: '5px 9px', cursor: 'pointer' }}
              title="Deactivate">
              <i className="bi bi-person-dash" />
            </button>
          ) : (
            <button onClick={onReactivate}
              style={{ background: 'transparent', border: `1px solid ${T.green}`, borderRadius: 6, color: T.green, padding: '5px 9px', cursor: 'pointer' }}
              title="Reactivate">
              <i className="bi bi-person-check" />
            </button>
          )}
        </div>
      </div>

      {/* Permission chips for admins */}
      {level && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[
            { key: 'canAdminister', label: 'Administer' },
            { key: 'canWaste', label: 'Waste' },
            { key: 'canWitness', label: 'Witness' },
            { key: 'canPerformCheck', label: 'Check' },
            { key: 'canStock', label: 'Stock' },
            { key: 'canReceive', label: 'Receive' },
            { key: 'canMove', label: 'Move' },
            { key: 'canOrder', label: 'Order' },
            { key: 'canManageCatalog', label: 'Catalog' },
            { key: 'canManageRoster', label: 'Roster' },
            { key: 'canManageLocations', label: 'Locations' },
          ].filter(p => (level as any)[p.key]).map(p => (
            <span key={p.key} style={{
              background: `${T.accent}22`, color: T.accent,
              border: `1px solid ${T.accent}44`,
              borderRadius: 8, fontSize: '0.6rem', padding: '1px 6px', fontWeight: 600,
            }}>{p.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 4 };
