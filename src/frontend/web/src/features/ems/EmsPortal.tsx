import { useEffect, useState, createContext, useContext } from 'react';
import { parseEmsHashRoute, emsPath, navigateEms, type EmsRoute } from './routing';
import { fetchMyPermissions } from './api';
import { T } from './theme';
import EmsDashboard from './components/EmsDashboard';
import EmsScanView from './components/EmsScanView';
import EmsVialDetail from './components/EmsVialDetail';
import EmsVialList from './components/EmsVialList';
import EmsCheckView from './components/EmsCheckView';
import EmsCheckSessionView from './components/EmsCheckSessionView';
import EmsLocationsView from './components/EmsLocationsView';
import EmsLocationDetail from './components/EmsLocationDetail';
import EmsCatalogView from './components/EmsCatalogView';
import EmsPersonnelView from './components/EmsPersonnelView';
import EmsSettingsView from './components/EmsSettingsView';
import EmsReportsView from './components/EmsReportsView';
import EmsAgencyConfigView from './components/EmsAgencyConfigView';
import EmsSealsView from './components/EmsSealsView';
import EmsDiscrepanciesView from './components/EmsDiscrepanciesView';
import EmsHistoryReportsView from './components/EmsHistoryReportsView';
import type { EmsPermissions } from '../../types/ems';

const DEFAULT_PERMS: EmsPermissions = {
  found: false, name: '', licenseLevelName: 'Unknown', rank: -1,
  canAdminister: false, canWaste: false, canWitness: false,
  canStock: false, canOrder: false, canReceive: false, canMove: false,
  canPerformCheck: false, canManageCatalog: false, canManageRoster: false,
  canManageLocations: false, canManageSeals: false, canApplySeal: false,
  canBreakSeal: false, canResolveDiscrepancies: false, canViewReports: false,
};

export const PermissionsCtx = createContext<EmsPermissions>(DEFAULT_PERMS);
export const useEmsPermissions = () => useContext(PermissionsCtx);

interface Props { tenantId: string; username: string; logout: () => void; }

function useEmsHash(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const h = () => setHash(window.location.hash);
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return hash;
}

export default function EmsPortal({ tenantId, username, logout }: Props) {
  const hash = useEmsHash();
  const route = parseEmsHashRoute(hash);
  const [perms, setPerms] = useState<EmsPermissions>(DEFAULT_PERMS);

  useEffect(() => {
    if (!tenantId || !username) return;
    fetchMyPermissions(tenantId, username).then(setPerms).catch(() => setPerms(DEFAULT_PERMS));
  }, [tenantId, username]);

  const isAdmin = perms.canManageCatalog || perms.canManageRoster || perms.canManageLocations || perms.canManageSeals || perms.canViewReports;

  return (
    <PermissionsCtx.Provider value={perms}>
      <div data-bs-theme="dark" style={{ minHeight: '100vh', background: T.bg, paddingBottom: 72, color: T.text }}>
        <nav style={{ background: T.topBar, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 200, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigateEms({ kind: 'dashboard' })}>
            <i className="bi bi-capsule-pill" style={{ fontSize: '1.3rem', color: T.accent }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>MedTrack EMS</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {perms.found && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: T.text, fontWeight: 600, lineHeight: 1.2 }}>{perms.name}</div>
                <div style={{ fontSize: '0.65rem', color: T.muted, lineHeight: 1.2 }}>{perms.licenseLevelName}</div>
              </div>
            )}
            <button style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '4px 10px', cursor: 'pointer' }} onClick={logout} title="Sign out">
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </nav>

        <div className="container-fluid px-3 py-3" style={{ maxWidth: 920 }}>
          {route.kind === 'dashboard' && <EmsDashboard tenantId={tenantId} />}
          {route.kind === 'scan' && <EmsScanView tenantId={tenantId} mode={route.mode} />}
          {route.kind === 'vial' && <EmsVialDetail tenantId={tenantId} vialId={route.vialId} />}
          {route.kind === 'vials' && <EmsVialList tenantId={tenantId} filter={route.filter} />}
          {route.kind === 'check' && <EmsCheckView tenantId={tenantId} />}
          {route.kind === 'check-session' && <EmsCheckSessionView tenantId={tenantId} sessionId={route.sessionId} />}
          {route.kind === 'locations' && <EmsLocationsView tenantId={tenantId} />}
          {route.kind === 'location' && <EmsLocationDetail tenantId={tenantId} locationId={route.locationId} />}
          {route.kind === 'seals' && <EmsSealsView tenantId={tenantId} />}
          {route.kind === 'catalog' && <EmsCatalogView tenantId={tenantId} />}
          {route.kind === 'personnel' && <EmsPersonnelView tenantId={tenantId} />}
          {route.kind === 'settings' && <EmsSettingsView tenantId={tenantId} />}
          {route.kind === 'reports' && <EmsReportsView tenantId={tenantId} />}
          {route.kind === 'history-reports' && <EmsHistoryReportsView tenantId={tenantId} />}
          {route.kind === 'discrepancies' && <EmsDiscrepanciesView tenantId={tenantId} />}
          {route.kind === 'agency-config' && <EmsAgencyConfigView tenantId={tenantId} />}
        </div>

        <EmsBottomNav route={route} isAdmin={isAdmin} />
      </div>
    </PermissionsCtx.Provider>
  );
}

function EmsBottomNav({ route, isAdmin }: { route: EmsRoute; isAdmin: boolean }) {
  const tabs = [
    { kind: 'dashboard', icon: 'bi-house-fill', label: 'Home' },
    { kind: 'scan', icon: 'bi-qr-code-scan', label: 'Scan' },
    { kind: 'check', icon: 'bi-clipboard2-check-fill', label: 'Checks' },
    { kind: 'vials', icon: 'bi-capsule', label: 'Vials' },
    { kind: 'settings', icon: 'bi-grid-fill', label: isAdmin ? 'Manage' : 'More' },
  ] as const;

  const active = (kind: string) =>
    route.kind === kind || (kind === 'settings' && ['settings', 'agency-config', 'personnel', 'locations', 'catalog', 'reports', 'seals', 'history-reports', 'discrepancies'].includes(route.kind));

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: T.topBar, zIndex: 300, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(tab => (
        <a key={tab.kind} href={emsPath({ kind: tab.kind } as EmsRoute)} style={{ flex: 1, padding: '6px 0', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: active(tab.kind) ? T.accent : T.muted }} onClick={e => { e.preventDefault(); navigateEms({ kind: tab.kind } as EmsRoute); }}>
          <i className={`bi ${tab.icon}`} style={{ fontSize: '1.4rem' }} />
          <span style={{ fontSize: '0.63rem', marginTop: 2 }}>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
