import { useState } from 'react';
import EmsReportsView from './EmsReportsView';
import EmsDiscrepanciesView from './EmsDiscrepanciesView';
import { navigateEms } from '../routing';
import { T, btnBackStyle } from '../theme';

export default function EmsHistoryReportsView({ tenantId }: { tenantId: string }) {
  const [tab, setTab] = useState<'reports' | 'discrepancies'>('reports');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" style={{ background: tab === 'reports' ? T.accent : T.card, color: '#fff' }} onClick={() => setTab('reports')}>Reports</button>
          <button className="btn btn-sm" style={{ background: tab === 'discrepancies' ? T.accent : T.card, color: '#fff' }} onClick={() => setTab('discrepancies')}>Discrepancies</button>
        </div>
      </div>
      {tab === 'reports' ? <EmsReportsView tenantId={tenantId} /> : <EmsDiscrepanciesView tenantId={tenantId} />}
    </div>
  );
}
