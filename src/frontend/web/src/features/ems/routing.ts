// ─────────────────────────────────────────────────────────────────────────────
// EMS Medication Tracker — hash-based routing
// Pattern: #/ems/<section>[/<id>]
// ─────────────────────────────────────────────────────────────────────────────

export type EmsRoute =
  | { kind: 'dashboard' }
  | { kind: 'scan'; mode?: 'administer' | 'waste' | 'stock' }
  | { kind: 'vial'; vialId: string }
  | { kind: 'vials'; filter?: string }
  | { kind: 'check' }
  | { kind: 'check-session'; sessionId: string }
  | { kind: 'locations' }
  | { kind: 'location'; locationId: string }
  | { kind: 'catalog' }
  | { kind: 'personnel' }
  | { kind: 'settings' }
  | { kind: 'reports' }
  | { kind: 'agency-config' };

export function parseEmsHashRoute(hash: string): EmsRoute {
  const path = hash.replace(/^#\/ems\/?/, '');
  const parts = path.split('/').filter(Boolean);

  switch (parts[0]) {
    case 'scan':       return { kind: 'scan', mode: parts[1] as EmsRoute & { kind: 'scan' }['mode'] };
    case 'vials':      return parts[1] ? { kind: 'vial', vialId: parts[1] } : { kind: 'vials', filter: parts[2] };
    case 'check':      return parts[1] ? { kind: 'check-session', sessionId: parts[1] } : { kind: 'check' };
    case 'locations':  return parts[1] ? { kind: 'location', locationId: parts[1] } : { kind: 'locations' };
    case 'catalog':       return { kind: 'catalog' };
    case 'personnel':     return { kind: 'personnel' };
    case 'settings':      return { kind: 'settings' };
    case 'reports':       return { kind: 'reports' };
    case 'agency-config': return { kind: 'agency-config' };
    default:              return { kind: 'dashboard' };
  }
}

export function emsPath(route: EmsRoute): string {
  switch (route.kind) {
    case 'dashboard':     return '#/ems';
    case 'scan':          return route.mode ? `#/ems/scan/${route.mode}` : '#/ems/scan';
    case 'vials':         return route.filter ? `#/ems/vials/list/${route.filter}` : '#/ems/vials';
    case 'vial':          return `#/ems/vials/${route.vialId}`;
    case 'check':         return '#/ems/check';
    case 'check-session': return `#/ems/check/${route.sessionId}`;
    case 'locations':     return '#/ems/locations';
    case 'location':      return `#/ems/locations/${route.locationId}`;
    case 'catalog':       return '#/ems/catalog';
    case 'personnel':     return '#/ems/personnel';
    case 'settings':      return '#/ems/settings';
    case 'reports':       return '#/ems/reports';
    case 'agency-config': return '#/ems/agency-config';
  }
}

export function navigateEms(route: EmsRoute): void {
  window.location.hash = emsPath(route).replace(/^#/, '');
}
