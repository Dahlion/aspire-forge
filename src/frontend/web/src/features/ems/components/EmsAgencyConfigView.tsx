import { useEffect, useState } from 'react';
import { fetchAgencyConfig, updateAgencyConfig } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedAgencyConfig } from '../../../types/ems';

interface Props { tenantId: string; }

export default function EmsAgencyConfigView({ tenantId }: Props) {
  const [cfg, setCfg] = useState<MedAgencyConfig | null>(null);
  const [form, setForm] = useState<MedAgencyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAgencyConfig(tenantId)
      .then(c => { setCfg(c); setForm(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const updated = await updateAgencyConfig(tenantId, form);
      setCfg(updated); setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>;
  if (!form) return null;

  const set = (key: keyof MedAgencyConfig, val: any) => setForm(f => f ? { ...f, [key]: val } : f);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'settings' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 style={{ margin: 0, flex: 1, color: T.text, fontWeight: 700 }}>
          <i className="bi bi-sliders me-2" style={{ color: T.accent }} />Agency Configuration
        </h5>
        <button onClick={save} disabled={saving}
          style={{ background: T.green, border: 'none', borderRadius: 8, color: '#fff', padding: '6px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
          {saving ? <span className="spinner-border spinner-border-sm" /> : saved ? <><i className="bi bi-check me-1" />Saved!</> : <><i className="bi bi-floppy me-1" />Save</>}
        </button>
      </div>

      {/* Agency Info */}
      <Section title="Agency Information" icon="bi-building">
        <Field label="Agency Name">
          <input style={{ ...inputStyle, width: '100%', padding: '8px 12px' }}
            value={form.agencyName} onChange={e => set('agencyName', e.target.value)} />
        </Field>
        <Field label="License Number">
          <input style={{ ...inputStyle, width: '100%', padding: '8px 12px' }}
            value={form.agencyLicenseNumber} onChange={e => set('agencyLicenseNumber', e.target.value)} />
        </Field>
      </Section>

      {/* Feature Toggles */}
      <Section title="Feature Toggles" icon="bi-toggle-on">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'enableVialTracking',           label: 'Vial Tracking',             desc: 'Track individual vials with lot/expiry' },
            { key: 'enableDailyChecks',             label: 'Daily Drug Checks',         desc: 'Require regular check sessions' },
            { key: 'enableControlledSubstanceLog',  label: 'Controlled Substance Log',  desc: 'Extra logging for DEA-scheduled drugs' },
            { key: 'enableExpiryAlerts',            label: 'Expiry Alerts',             desc: 'Warn on approaching or past expiry' },
            { key: 'enableSealedContainers',        label: 'Sealed Containers',         desc: 'Tamper-evident seal tracking' },
            { key: 'enableOpenFdaLookup',           label: 'OpenFDA Lookup',            desc: 'Barcode scan against FDA database' },
            { key: 'enableReporting',               label: 'Reports',                   desc: 'Access to the reports section' },
            { key: 'enforceRolePermissions',        label: 'Enforce Role Permissions',  desc: 'Restrict actions based on license level' },
          ].map(item => (
            <ToggleRow key={item.key} label={item.label} desc={item.desc}
              value={(form as any)[item.key]} onChange={v => set(item.key as any, v)} />
          ))}
        </div>
      </Section>

      {/* Report Toggles */}
      <Section title="Reports Available" icon="bi-bar-chart">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'reportVialUsage',       label: 'Vial Usage Report' },
            { key: 'reportWasteLog',        label: 'Waste Log Report' },
            { key: 'reportCheckCompliance', label: 'Check Compliance Report' },
            { key: 'reportExpiryTracking',  label: 'Expiry Tracking Report' },
            { key: 'reportInventorySnapshot', label: 'Inventory Snapshot Report' },
          ].map(item => (
            <ToggleRow key={item.key} label={item.label}
              value={(form as any)[item.key]} onChange={v => set(item.key as any, v)} />
          ))}
        </div>
      </Section>

      {/* Workflow Defaults */}
      <Section title="Workflow Defaults" icon="bi-gear">
        <Field label="Default Check Frequency (hours)">
          <input type="number" min={1} style={{ ...inputStyle, width: '100%', padding: '8px 12px' }}
            value={form.defaultCheckFrequencyHours}
            onChange={e => set('defaultCheckFrequencyHours', parseInt(e.target.value) || 24)} />
        </Field>
        <Field label="Expiry Warning Days">
          <input type="number" min={1} style={{ ...inputStyle, width: '100%', padding: '8px 12px' }}
            value={form.expiryWarningDays}
            onChange={e => set('expiryWarningDays', parseInt(e.target.value) || 30)} />
        </Field>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <ToggleRow label="Require Witness for All Waste" desc="Overrides per-medication config"
            value={form.requireWitnessForAllWaste} onChange={v => set('requireWitnessForAllWaste', v)} />
          <ToggleRow label="Require Witness for All Checks" desc="All check sessions need a witness"
            value={form.requireWitnessForAllChecks} onChange={v => set('requireWitnessForAllChecks', v)} />
        </div>
      </Section>

      {cfg?.updatedAt && (
        <div style={{ textAlign: 'center', color: T.muted, fontSize: '0.75rem', marginTop: 8 }}>
          Last saved: {new Date(cfg.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={`bi ${icon}`} style={{ color: T.accent }} />
        <span style={{ fontWeight: 700, color: T.text, fontSize: '0.9rem' }}>{title}</span>
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: T.muted, fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ color: T.text, fontSize: '0.88rem', fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ color: T.muted, fontSize: '0.75rem', marginTop: 1 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{
          flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: value ? T.green : '#374151',
          position: 'relative', transition: 'background 0.2s',
        }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
