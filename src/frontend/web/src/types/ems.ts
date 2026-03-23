// ─────────────────────────────────────────────────────────────────────────────
// EMS Medication Tracker — TypeScript domain types
// Mirrors the C# entity models returned by /api/med/*
// ─────────────────────────────────────────────────────────────────────────────

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
  deaSchedule: number;   // 0=non-controlled, 2-5=controlled
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
  minCheckFrequencyHours?: number;   // null = use agency default
  requiresPhysicalCount: boolean;    // overrides seal inheritance for this drug
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
  fullName?: string;  // computed client-side
}

export interface MedStorageLocation {
  id: string;
  tenantId: string;
  parentLocationId?: string;
  name: string;
  locationType: string;  // unit | truck | station | vault | room | cabinet | shelf | drawer
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
  isMasterSeal: boolean;         // seal covers all child vials (no need to check individually)
  sealAppliedAt?: string;
  sealAppliedByPersonnelId?: string;
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
  eventType: string;  // applied | broken
  personnelId?: string;
  witnessPersonnelId?: string;
  notes?: string;
  occurredAt: string;
  createdAt: string;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
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
  status: 'in-progress' | 'completed' | 'aborted';
  notes?: string;
  startedAt: string;
  completedAt?: string;
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
  checkType: string;                  // physical | seal-verified | inherited
  inheritedFromSealNumber?: string;   // populated when checkType = 'inherited'
  checkedAt: string;
  container?: MedContainer;
  vial?: MedVial;
}

export interface EmsDashboard {
  vialsByStatus: { status: string; count: number }[];
  expiringIn30DaysCount: number;
  checksDueCount: number;
  brokenSealsCount: number;
}

export interface MedAgencyConfig {
  id: string;
  tenantId: string;
  agencyName: string;
  agencyLicenseNumber: string;
  // Feature toggles
  enableVialTracking: boolean;
  enableDailyChecks: boolean;
  enableControlledSubstanceLog: boolean;
  enableExpiryAlerts: boolean;
  enableSealedContainers: boolean;
  enableOpenFdaLookup: boolean;
  enableReporting: boolean;
  enforceRolePermissions: boolean;
  // Report toggles
  reportVialUsage: boolean;
  reportWasteLog: boolean;
  reportCheckCompliance: boolean;
  reportExpiryTracking: boolean;
  reportInventorySnapshot: boolean;
  // Workflow defaults
  defaultCheckFrequencyHours: number;
  expiryWarningDays: number;
  requireWitnessForAllWaste: boolean;
  requireWitnessForAllChecks: boolean;
  allowSealInheritance: boolean;  // master seal on a container auto-satisfies child vial checks
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
}

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

// ── UI helpers ────────────────────────────────────────────────────────────────

export const VIAL_STATUS_COLORS: Record<VialStatus, string> = {
  ordered:      'secondary',
  received:     'info',
  stocked:      'primary',
  'in-use':     'warning',
  administered: 'success',
  wasted:       'dark',
  disposed:     'light',
  expired:      'danger',
};

export const DEA_SCHEDULE_LABELS: Record<number, string> = {
  0: 'Non-Controlled',
  2: 'Schedule II',
  3: 'Schedule III',
  4: 'Schedule IV',
  5: 'Schedule V',
};

export const LOCATION_TYPE_ICONS: Record<string, string> = {
  unit:    'bi-truck',
  truck:   'bi-truck',
  station: 'bi-building',
  vault:   'bi-safe',
  room:    'bi-door-open',
  cabinet: 'bi-archive',
  shelf:   'bi-list-columns',
  drawer:  'bi-inbox',
};

export function personnelFullName(p: MedPersonnel): string {
  return `${p.firstName} ${p.lastName}`.trim();
}
