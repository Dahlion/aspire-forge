export interface MedLicenseLevel {
  id: string;
  tenantId: string;
  name: string;
  rank: number;
  canAdminister: boolean;
  canWaste: boolean;
  canWitness: boolean;
  canStock: boolean;
  canOrder: boolean;
  canReceive: boolean;
  canMove: boolean;
  canPerformCheck: boolean;
  canManageCatalog: boolean;
  canManageRoster: boolean;
  canManageLocations: boolean;
  canManageSeals: boolean;
  canApplySeal: boolean;
  canBreakSeal: boolean;
  canResolveDiscrepancies: boolean;
  canViewReports: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedTag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedMedication {
  id: string;
  tenantId: string;
  genericName: string;
  brandName?: string;
  deaSchedule: number;
  ndcCode?: string;
  concentration?: string;
  routeOfAdministration?: string;
  formDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags: MedMedicationTag[];
  configs: MedMedicationConfig[];
}

export interface MedMedicationTag {
  medicationId: string;
  tagId: string;
  tag?: MedTag;
}

export interface MedMedicationConfig {
  id: string;
  tenantId: string;
  medicationId: string;
  requireWitnessForWaste: boolean;
  isControlledSubstance: boolean;
  requireSealedStorage: boolean;
  minCheckFrequencyHours?: number;
  requiresPhysicalCount: boolean;
  updatedAt: string;
}

export interface MedPersonnel {
  id: string;
  tenantId: string;
  licenseLevelId: string;
  firstName: string;
  lastName: string;
  badgeNumber?: string;
  email?: string;
  keycloakUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  licenseLevel?: MedLicenseLevel;
  fullName?: string;
}

export interface MedStorageLocation {
  id: string;
  tenantId: string;
  parentLocationId?: string;
  name: string;
  locationType: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentLocation?: MedStorageLocation;
  childLocations?: MedStorageLocation[];
  containers: MedContainer[];
}

export interface MedContainer {
  id: string;
  storageLocationId: string;
  name: string;
  containerType: string;
  isSealable: boolean;
  isSealed: boolean;
  sealNumber?: string;
  isMasterSeal: boolean;
  sealAppliedAt?: string;
  sealAppliedByPersonnelId?: string;
  lastSealBrokenAt?: string;
  lastSealBrokenByPersonnelId?: string;
  defaultSealLicenseLevelId?: string;
  checkFrequencyHours: number;
  checkRequiresWitness: boolean;
  isControlledSubstance: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  storageLocation?: MedStorageLocation;
  sealAppliedBy?: MedPersonnel;
  sealEvents?: MedSealEvent[];
  vials: MedVial[];
}

export interface MedSealEvent {
  id: string;
  containerId: string;
  sealNumber: string;
  eventType: string;
  personnelId?: string;
  witnessPersonnelId?: string;
  notes?: string;
  occurredAt: string;
  createdAt: string;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
}

export interface MedSealStock {
  id: string;
  tenantId: string;
  sealNumber: string;
  sealType: string;
  status: 'available' | 'applied' | 'broken' | 'void';
  assignedLicenseLevelId?: string;
  assignedContainerId?: string;
  appliedAt?: string;
  brokenAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedLicenseLevel?: MedLicenseLevel;
  assignedContainer?: MedContainer;
}

export type VialStatus =
  | 'ordered' | 'received' | 'stocked' | 'in-use'
  | 'administered' | 'wasted' | 'disposed' | 'expired';

export interface MedVial {
  id: string;
  tenantId: string;
  medicationId: string;
  containerId?: string;
  lotNumber: string;
  manufacturerBarcode?: string;
  agencyLabelCode?: string;
  totalVolumeMl: number;
  remainingVolumeMl: number;
  status: VialStatus;
  expiresAt?: string;
  orderedAt?: string;
  receivedAt?: string;
  stockedAt?: string;
  administeredAt?: string;
  wastedAt?: string;
  disposedAt?: string;
  createdAt: string;
  updatedAt: string;
  medication?: MedMedication;
  container?: MedContainer;
  events: MedVialEvent[];
}

export type VialEventType =
  | 'ordered' | 'received' | 'stocked' | 'moved'
  | 'administered' | 'wasted' | 'disposed' | 'expired'
  | 'checked' | 'seal-broken' | 'seal-applied';

export interface MedVialEvent {
  id: string;
  vialId: string;
  personnelId?: string;
  witnessPersonnelId?: string;
  eventType: VialEventType;
  notes?: string;
  incidentNumber?: string;
  patientWeightKg?: number;
  dosageAmountMl?: number;
  fromContainerId?: string;
  toContainerId?: string;
  occurredAt: string;
  createdAt: string;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
}

export interface MedCheckSession {
  id: string;
  tenantId: string;
  storageLocationId: string;
  personnelId: string;
  witnessPersonnelId?: string;
  status: 'draft' | 'in-progress' | 'completed' | 'cancelled' | 'discrepancy-open';
  notes?: string;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledByPersonnelId?: string;
  cancellationReason?: string;
  lastSavedAt?: string;
  createdAt: string;
  storageLocation?: MedStorageLocation;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
  items: MedCheckItem[];
}

export interface MedCheckItem {
  id: string;
  sessionId: string;
  containerId?: string;
  vialId?: string;
  sealIntact: boolean;
  passed: boolean;
  discrepancy?: string;
  checkType: string;
  inheritedFromSealNumber?: string;
  checkedAt: string;
  container?: MedContainer;
  vial?: MedVial;
}

export interface MedDiscrepancy {
  id: string;
  tenantId: string;
  checkSessionId?: string;
  checkItemId?: string;
  storageLocationId?: string;
  containerId?: string;
  vialId?: string;
  discrepancyType: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'under-review' | 'resolved' | 'void';
  summary: string;
  details?: string;
  openedByPersonnelId: string;
  openedAt: string;
  resolvedByPersonnelId?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  requiresSupervisorReview: boolean;
  requiresSealReplacement: boolean;
  requiresIncidentReport: boolean;
  storageLocation?: MedStorageLocation;
  container?: MedContainer;
  vial?: MedVial;
  openedByPersonnel?: MedPersonnel;
  resolvedByPersonnel?: MedPersonnel;
}

export interface CheckDueItem {
  containerId: string;
  containerName: string;
  locationId: string;
  locationName: string;
  checkFrequencyHours: number;
  checkRequiresWitness: boolean;
  isSealed: boolean;
  sealNumber?: string;
  lastCompletedAt?: string;
  dueAt: string;
  isOverdue: boolean;
}

export interface RecentCompletedCheckItem {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  locationId: string;
  locationName: string;
  personnelId: string;
  personnelName?: string;
  witnessPersonnelId?: string;
  witnessName?: string;
  itemCount: number;
}

export interface EmsDashboard {
  vialsByStatus: { status: string; count: number }[];
  expiringIn30DaysCount: number;
  checksDueCount: number;
  brokenSealsCount: number;
  openDiscrepanciesCount: number;
  checksDue: CheckDueItem[];
  recentCompletedChecks: RecentCompletedCheckItem[];
}

export interface MedAgencyConfig {
  id: string;
  tenantId: string;
  agencyName: string;
  agencyLicenseNumber: string;
  enableVialTracking: boolean;
  enableDailyChecks: boolean;
  enableControlledSubstanceLog: boolean;
  enableExpiryAlerts: boolean;
  enableSealedContainers: boolean;
  enableOpenFdaLookup: boolean;
  enableReporting: boolean;
  enforceRolePermissions: boolean;
  reportVialUsage: boolean;
  reportWasteLog: boolean;
  reportCheckCompliance: boolean;
  reportExpiryTracking: boolean;
  reportInventorySnapshot: boolean;
  defaultCheckFrequencyHours: number;
  expiryWarningDays: number;
  requireWitnessForAllWaste: boolean;
  requireWitnessForAllChecks: boolean;
  allowSealInheritance: boolean;
  updatedAt: string;
}

export interface EmsPermissions {
  found: boolean;
  personnelId?: string;
  name: string;
  licenseLevelName: string;
  rank: number;
  canAdminister: boolean;
  canWaste: boolean;
  canWitness: boolean;
  canStock: boolean;
  canOrder: boolean;
  canReceive: boolean;
  canMove: boolean;
  canPerformCheck: boolean;
  canManageCatalog: boolean;
  canManageRoster: boolean;
  canManageLocations: boolean;
  canManageSeals: boolean;
  canApplySeal: boolean;
  canBreakSeal: boolean;
  canResolveDiscrepancies: boolean;
  canViewReports: boolean;
}

export function personnelFullName(p: MedPersonnel | undefined | null): string {
  if (!p) return 'Unknown';
  return p.fullName ?? `${p.firstName} ${p.lastName}`;
}

export const LOCATION_TYPE_ICONS: Record<string, string> = {
  unit:    'bi-truck',
  truck:   'bi-truck-front',
  station: 'bi-building',
  vault:   'bi-safe',
  room:    'bi-door-closed',
  cabinet: 'bi-archive',
  shelf:   'bi-collection',
  drawer:  'bi-inbox',
};

export const DEA_SCHEDULE_LABELS: Record<number, string> = {
  0: 'Non-controlled',
  1: 'Schedule I',
  2: 'Schedule II',
  3: 'Schedule III',
  4: 'Schedule IV',
  5: 'Schedule V',
};

export interface OpenFdaLookup {
  genericName: string;
  brandName?: string;
  ndcCode: string;
  concentration?: string;
  routeOfAdministration?: string;
  formDescription?: string;
  manufacturer?: string;
  deaSchedule: number;
}
