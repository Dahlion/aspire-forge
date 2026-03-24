import { useEffect, useState } from 'react';
import { createSeal, fetchLicenseLevels, fetchSeals, voidSeal } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, cardHeaderStyle, btnBackStyle, inputStyle } from '../theme';
import type { MedLicenseLevel, MedSealStock } from '../../../types/ems';

export default function EmsSealsView({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<MedSealStock[]>([]);
  const [levels, setLevels] = useState<MedLicenseLevel[]>([]);
  const [status, setStatus] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [sealType, setSealType] = useState('standard');
  const [assignedLicenseLevelId, setAssignedLicenseLevelId] = useState('');

  async function load() {
    const [seals, licenseLevels] = await Promise.all([
      fetchSeals(tenantId, { status: status || undefined }),
      fetchLicenseLevels(tenantId),
    ]);
    setItems(seals);
    setLevels(licenseLevels);
  }

  useEffect(() => { load().catch(console.error); }, [tenantId, status]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="applied">Applied</option>
          <option value="broken">Broken</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-plus-circle me-2" style={{ color: T.accent }} />Add Seal</strong></div>
        <div style={{ padding: 12 }} className="row g-2">
          <div className="col-md-4"><input value={sealNumber} onChange={e => setSealNumber(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="Seal number" /></div>
          <div className="col-md-3"><input value={sealType} onChange={e => setSealType(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="Type" /></div>
          <div className="col-md-3">
            <select value={assignedLicenseLevelId} onChange={e => setAssignedLicenseLevelId(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="">Any level</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button className="btn btn-primary" onClick={async () => {
              await createSeal(tenantId, { sealNumber, sealType, assignedLicenseLevelId: assignedLicenseLevelId || undefined });
              setSealNumber('');
              await load();
            }}>Add</button>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-shield-lock me-2" style={{ color: T.accent }} />Seal Inventory</strong></div>
        <div style={{ padding: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.sealNumber}</div>
                <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.sealType} • {item.assignedLicenseLevel?.name ?? 'Any level'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge text-bg-secondary">{item.status}</span>
                {item.status !== 'void' && <button className="btn btn-sm btn-outline-danger" onClick={() => voidSeal(tenantId, item.id).then(load)}>Void</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
