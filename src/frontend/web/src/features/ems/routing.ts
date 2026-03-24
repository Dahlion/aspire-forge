export type EmsRoute =
  | { kind: 'dashboard' }
  | { kind: 'scan'; mode?: 'receive' | 'stock' | 'administer' | 'waste' }
  | { kind: 'vial'; vialId: string }
  | { kind: 'vials'; filter?: string }
  | { kind: 'check' }
  | { kind: 'check-session'; sessionId: string }
  | { kind: 'locations' }
  | { kind: 'location'; locationId: string }
  | { kind: 'seals' }
  | { kind: 'catalog' }
  | { kind: 'personnel' }
  | { kind: 'settings' }
  | { kind: 'reports' }
  | { kind: 'history-reports' }
  | { kind: 'discrepancies' }
  | { kind: 'agency-config' };

export function parseEmsHashRoute(hash: string): EmsRoute {
  const path = hash.replace(/^#\/ems\/?/, '');
  const parts = path.split('/').filter(Boolean);

  switch (parts[0]) {
    case 'scan': return { kind: 'scan', mode: parts[1] as any };
    case 'vials': return parts[1] === 'list' ? { kind: 'vials', filter: parts[2] } : parts[1] ? { kind: 'vial', vialId: parts[1] } : { kind: 'vials' };
    case 'check': return parts[1] ? { kind: 'check-session', sessionId: parts[1] } : { kind: 'check' };
    case 'locations': return parts[1] ? { kind: 'location', locationId: parts[1] } : { kind: 'locations' };
    case 'seals': return { kind: 'seals' };
    case 'catalog': return { kind: 'catalog' };
    case 'personnel': return { kind: 'personnel' };
    case 'settings': return { kind: 'settings' };
    case 'reports': return { kind: 'reports' };
    case 'history-reports': return { kind: 'history-reports' };
    case 'discrepancies': return { kind: 'discrepancies' };
    case 'agency-config': return { kind: 'agency-config' };
    default: return { kind: 'dashboard' };
  }
}

export function emsPath(route: EmsRoute): string {
  switch (route.kind) {
    case 'dashboard': return '#/ems';
    case 'scan': return route.mode ? `#/ems/scan/${route.mode}` : '#/ems/scan';
    case 'vials': return route.filter ? `#/ems/vials/list/${route.filter}` : '#/ems/vials';
    case 'vial': return `#/ems/vials/${route.vialId}`;
    case 'check': return '#/ems/check';
    case 'check-session': return `#/ems/check/${route.sessionId}`;
    case 'locations': return '#/ems/locations';
    case 'location': return `#/ems/locations/${route.locationId}`;
    case 'seals': return '#/ems/seals';
    case 'catalog': return '#/ems/catalog';
    case 'personnel': return '#/ems/personnel';
    case 'settings': return '#/ems/settings';
    case 'reports': return '#/ems/reports';
    case 'history-reports': return '#/ems/history-reports';
    case 'discrepancies': return '#/ems/discrepancies';
    case 'agency-config': return '#/ems/agency-config';
  }
}

export function navigateEms(route: EmsRoute): void {
  window.location.hash = emsPath(route).replace(/^#/, '');
}
