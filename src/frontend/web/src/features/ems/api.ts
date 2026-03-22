import type {
  EmsDashboard, MedLicenseLevel, MedTag, MedMedication, MedMedicationConfig,
  MedPersonnel, MedStorageLocation, MedContainer, MedVial, MedVialEvent,
  MedCheckSession, MedCheckItem, OpenFdaLookup, MedAgencyConfig, EmsPermissions,
} from '../../types/ems';

const BASE = 'http://localhost:5236/api/med';

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) =>
  '?' + Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchEmsDashboard = (tenantId: string) =>
  req<EmsDashboard>(`${BASE}/dashboard${qs({ tenantId })}`);

// ── License Levels ────────────────────────────────────────────────────────────
export const fetchLicenseLevels = (tenantId: string) =>
  req<MedLicenseLevel[]>(`${BASE}/license-levels${qs({ tenantId })}`);

export const createLicenseLevel = (tenantId: string, body: Partial<MedLicenseLevel>) =>
  req<MedLicenseLevel>(`${BASE}/license-levels${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updateLicenseLevel = (tenantId: string, id: string, body: Partial<MedLicenseLevel>) =>
  req<MedLicenseLevel>(`${BASE}/license-levels/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteLicenseLevel = (tenantId: string, id: string) =>
  req<void>(`${BASE}/license-levels/${id}${qs({ tenantId })}`, { method: 'DELETE' });

// ── Tags ──────────────────────────────────────────────────────────────────────
export const fetchTags = (tenantId: string) =>
  req<MedTag[]>(`${BASE}/tags${qs({ tenantId })}`);

export const createTag = (tenantId: string, body: { name: string; color: string }) =>
  req<MedTag>(`${BASE}/tags${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updateTag = (tenantId: string, id: string, body: { name: string; color: string }) =>
  req<MedTag>(`${BASE}/tags/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteTag = (tenantId: string, id: string) =>
  req<void>(`${BASE}/tags/${id}${qs({ tenantId })}`, { method: 'DELETE' });

// ── Medications ───────────────────────────────────────────────────────────────
export const fetchMedications = (tenantId: string, params?: { search?: string; schedule?: number; tagId?: string }) =>
  req<MedMedication[]>(`${BASE}/medications${qs({ tenantId, ...params })}`);

export const fetchMedication = (tenantId: string, id: string) =>
  req<MedMedication>(`${BASE}/medications/${id}${qs({ tenantId })}`);

export const createMedication = (tenantId: string, body: Partial<MedMedication>) =>
  req<MedMedication>(`${BASE}/medications${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updateMedication = (tenantId: string, id: string, body: Partial<MedMedication>) =>
  req<MedMedication>(`${BASE}/medications/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

export const addMedicationTag = (tenantId: string, medId: string, tagId: string) =>
  req<void>(`${BASE}/medications/${medId}/tags${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify({ tagId }) });

export const removeMedicationTag = (tenantId: string, medId: string, tagId: string) =>
  req<void>(`${BASE}/medications/${medId}/tags/${tagId}${qs({ tenantId })}`, { method: 'DELETE' });

export const lookupBarcode = (barcode: string) =>
  req<OpenFdaLookup>(`${BASE}/medications/lookup-barcode${qs({ barcode })}`);

// ── Med Config ────────────────────────────────────────────────────────────────
export const fetchMedConfig = (tenantId: string, medId: string) =>
  req<MedMedicationConfig>(`${BASE}/medications/${medId}/config${qs({ tenantId })}`);

export const upsertMedConfig = (tenantId: string, medId: string, body: Partial<MedMedicationConfig>) =>
  req<MedMedicationConfig>(`${BASE}/medications/${medId}/config${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

// ── Personnel ─────────────────────────────────────────────────────────────────
export const fetchPersonnel = (tenantId: string, active?: boolean) =>
  req<MedPersonnel[]>(`${BASE}/personnel${qs({ tenantId, active })}`);

export const createPersonnel = (tenantId: string, body: Partial<MedPersonnel>) =>
  req<MedPersonnel>(`${BASE}/personnel${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updatePersonnel = (tenantId: string, id: string, body: Partial<MedPersonnel>) =>
  req<MedPersonnel>(`${BASE}/personnel/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

export const deletePersonnel = (tenantId: string, id: string) =>
  req<void>(`${BASE}/personnel/${id}${qs({ tenantId })}`, { method: 'DELETE' });

// ── Locations ─────────────────────────────────────────────────────────────────
export const fetchLocations = (tenantId: string) =>
  req<MedStorageLocation[]>(`${BASE}/locations${qs({ tenantId })}`);

export const fetchLocation = (tenantId: string, id: string) =>
  req<MedStorageLocation>(`${BASE}/locations/${id}${qs({ tenantId })}`);

export const createLocation = (tenantId: string, body: Partial<MedStorageLocation>) =>
  req<MedStorageLocation>(`${BASE}/locations${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updateLocation = (tenantId: string, id: string, body: Partial<MedStorageLocation>) =>
  req<MedStorageLocation>(`${BASE}/locations/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

// ── Containers ────────────────────────────────────────────────────────────────
export const fetchContainers = (locationId: string) =>
  req<MedContainer[]>(`${BASE}/locations/${locationId}/containers`);

export const fetchContainerDetail = (id: string) =>
  req<{ container: MedContainer; lastCheckedAt: string | null; nextDueAt: string; isOverdue: boolean }>(`${BASE}/containers/${id}`);

export const createContainer = (locationId: string, body: Partial<MedContainer>) =>
  req<MedContainer>(`${BASE}/locations/${locationId}/containers`, { method: 'POST', body: JSON.stringify(body) });

export const updateContainer = (id: string, body: Partial<MedContainer>) =>
  req<MedContainer>(`${BASE}/containers/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const breakSeal = (id: string, body: { personnelId: string; witnessPersonnelId?: string; notes?: string }) =>
  req<MedContainer>(`${BASE}/containers/${id}/break-seal`, { method: 'POST', body: JSON.stringify(body) });

export const applySeal = (id: string, body: { sealNumber: string; personnelId: string }) =>
  req<MedContainer>(`${BASE}/containers/${id}/apply-seal`, { method: 'POST', body: JSON.stringify(body) });

// ── Vials ─────────────────────────────────────────────────────────────────────
export const fetchVials = (tenantId: string, params?: {
  status?: string; containerId?: string; locationId?: string; medicationId?: string; filter?: string;
}) => req<MedVial[]>(`${BASE}/vials${qs({ tenantId, ...params })}`);

export const scanVial = (tenantId: string, code: string) =>
  req<MedVial>(`${BASE}/vials/scan${qs({ tenantId, code })}`);

export const fetchVial = (tenantId: string, id: string) =>
  req<MedVial>(`${BASE}/vials/${id}${qs({ tenantId })}`);

export const createVial = (tenantId: string, body: {
  medicationId: string; lotNumber: string; manufacturerBarcode?: string;
  agencyLabelCode?: string; totalVolumeMl: number; expiresAt?: string;
  personnelId?: string; notes?: string;
}) => req<MedVial>(`${BASE}/vials${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const receiveVial = (tenantId: string, id: string, body: {
  lotNumber: string; expiresAt?: string; totalVolumeMl: number; personnelId?: string; notes?: string;
}) => req<MedVial>(`${BASE}/vials/${id}/receive${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const stockVial = (tenantId: string, id: string, body: { containerId: string; personnelId?: string; notes?: string }) =>
  req<MedVial>(`${BASE}/vials/${id}/stock${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const moveVial = (tenantId: string, id: string, body: { toContainerId: string; personnelId?: string; notes?: string }) =>
  req<MedVial>(`${BASE}/vials/${id}/move${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const administerVial = (tenantId: string, id: string, body: {
  dosageAmountMl: number; incidentNumber: string; patientWeightKg?: number;
  personnelId?: string; occurredAt?: string; notes?: string;
}) => req<MedVial>(`${BASE}/vials/${id}/administer${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const wasteVial = (tenantId: string, id: string, body: {
  dosageAmountMl: number; personnelId?: string; witnessPersonnelId?: string;
  occurredAt?: string; notes?: string;
}) => req<MedVial>(`${BASE}/vials/${id}/waste${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const disposeVial = (tenantId: string, id: string, body: { personnelId?: string; notes?: string }) =>
  req<MedVial>(`${BASE}/vials/${id}/dispose${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const expireVial = (tenantId: string, id: string, body: { personnelId?: string; notes?: string }) =>
  req<MedVial>(`${BASE}/vials/${id}/expire${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const fetchVialEvents = (tenantId: string, id: string) =>
  req<MedVialEvent[]>(`${BASE}/vials/${id}/events${qs({ tenantId })}`);

// ── Check Sessions ────────────────────────────────────────────────────────────
export const fetchCheckSessions = (tenantId: string, params?: { locationId?: string; status?: string }) =>
  req<MedCheckSession[]>(`${BASE}/checks${qs({ tenantId, ...params })}`);

export const createCheckSession = (tenantId: string, body: {
  storageLocationId: string; personnelId: string; witnessPersonnelId?: string;
}) => req<MedCheckSession>(`${BASE}/checks${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const fetchCheckSession = (tenantId: string, id: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}${qs({ tenantId })}`);

export const addCheckItem = (tenantId: string, sessionId: string, body: Partial<MedCheckItem>) =>
  req<MedCheckItem>(`${BASE}/checks/${sessionId}/items${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const completeCheckSession = (tenantId: string, id: string, notes?: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}/complete${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify({ notes }) });

export const abortCheckSession = (tenantId: string, id: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}/abort${qs({ tenantId })}`, { method: 'POST', body: '{}' });

// ── Agency Config ──────────────────────────────────────────────────────────────
export const fetchAgencyConfig = (tenantId: string) =>
  req<MedAgencyConfig>(`${BASE}/agency-config${qs({ tenantId })}`);

export const updateAgencyConfig = (tenantId: string, body: MedAgencyConfig) =>
  req<MedAgencyConfig>(`${BASE}/agency-config${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

// ── Permissions ────────────────────────────────────────────────────────────────
export const fetchMyPermissions = (tenantId: string, username: string) =>
  req<EmsPermissions>(`${BASE}/my-permissions${qs({ tenantId, username })}`);

// ── Reports ────────────────────────────────────────────────────────────────────
export const fetchReportVialUsage = (tenantId: string, from?: string, to?: string) =>
  req<any[]>(`${BASE}/reports/vial-usage${qs({ tenantId, from, to })}`);

export const fetchReportWasteLog = (tenantId: string, from?: string, to?: string) =>
  req<any[]>(`${BASE}/reports/waste-log${qs({ tenantId, from, to })}`);

export const fetchReportCheckCompliance = (tenantId: string, from?: string, to?: string) =>
  req<any>(`${BASE}/reports/check-compliance${qs({ tenantId, from, to })}`);

export const fetchReportExpiry = (tenantId: string, warningDays?: number) =>
  req<any>(`${BASE}/reports/expiry${qs({ tenantId, warningDays })}`);

export const fetchReportInventory = (tenantId: string) =>
  req<any[]>(`${BASE}/reports/inventory${qs({ tenantId })}`);

export const fetchEmsAdminSummary = (tenantId: string) =>
  req<any>(`${BASE}/admin-summary${qs({ tenantId })}`);
