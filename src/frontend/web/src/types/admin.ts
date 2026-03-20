// ── Dashboard ─────────────────────────────────────────────────────────────────

export type DashboardData = {
    tenantCount: number;
    activeTenantCount: number;
    subscriptionCount: number;
    activeSubscriptionCount: number;
    monthlyRecurringRevenue: number;
    leadCount: number;
    newLeadCount: number;
    activeLeadCount: number;
    overdueInvoiceCount: number;
    outstandingRevenue: number;
    recentTenants: TenantSummary[];
    upcomingRenewals: RenewalSummary[];
};

// ── Tenants ───────────────────────────────────────────────────────────────────

export type TenantSummary = {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    subscriptionCount: number;
    activeSubscriptionCount: number;
};

export type TenantDetail = {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    subscriptions: Subscription[];
    contacts: TenantContact[];
    notes: TenantNote[];
};

export type CreateTenantInput = {
    name: string;
    slug?: string | null;
    isActive?: boolean;
};

export type UpdateTenantInput = {
    name?: string;
    slug?: string;
    isActive?: boolean;
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export type Subscription = {
    id: string;
    planName: string;
    status: string;
    seats: number;
    monthlyPrice: number;
    currency: string;
    autoRenew: boolean;
    startedAt: string;
    renewsAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type RenewalSummary = {
    id: string;
    tenantId: string;
    planName: string;
    status: string;
    renewsAt: string | null;
    monthlyPrice: number;
    currency: string;
};

export type CreateSubscriptionInput = {
    planName: string;
    status: string;
    seats: number;
    monthlyPrice: number;
    currency: string;
    autoRenew: boolean;
    startedAt: string;
    renewsAt: string | null;
    cancelledAt: string | null;
};

export type UpdateSubscriptionInput = {
    status?: string;
    renewsAt?: string | null;
    renewsAtSet?: boolean;
    cancelledAt?: string | null;
    cancelledAtSet?: boolean;
};

// ── Subscription Plans ────────────────────────────────────────────────────────

export type SubscriptionPlan = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    monthlyPrice: number;
    currency: string;
    maxSeats: number;
    features: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreatePlanInput = {
    name: string;
    slug?: string | null;
    description?: string | null;
    monthlyPrice: number;
    currency?: string;
    maxSeats?: number;
    features?: string | null;
    isActive?: boolean;
};

export type UpdatePlanInput = {
    name?: string;
    slug?: string;
    description?: string | null;
    monthlyPrice?: number;
    currency?: string;
    maxSeats?: number;
    features?: string | null;
    isActive?: boolean;
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export type Invoice = {
    id: string;
    invoiceNumber: string;
    tenantId: string;
    tenantName?: string;
    subscriptionId: string | null;
    amount: number;
    currency: string;
    status: string;
    issuedAt: string;
    dueAt: string;
    paidAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateInvoiceInput = {
    amount: number;
    currency?: string;
    status?: string;
    subscriptionId?: string | null;
    issuedAt?: string | null;
    dueAt?: string | null;
    paidAt?: string | null;
    notes?: string | null;
};

export type UpdateInvoiceInput = {
    status?: string;
    amount?: number;
    currency?: string;
    dueAt?: string | null;
    paidAt?: string | null;
    paidAtSet?: boolean;
    notes?: string | null;
};

// ── Leads ─────────────────────────────────────────────────────────────────────

export type Lead = {
    id: string;
    companyName: string;
    contactName: string;
    email: string | null;
    phone: string | null;
    status: string;
    source: string | null;
    segment: string | null;
    estimatedValue: number | null;
    notes: string | null;
    followUpAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateLeadInput = {
    companyName: string;
    contactName: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
    source?: string | null;
    segment?: string | null;
    estimatedValue?: number | null;
    notes?: string | null;
    followUpAt?: string | null;
};

export type UpdateLeadInput = {
    companyName?: string;
    contactName?: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
    source?: string | null;
    segment?: string | null;
    estimatedValue?: number | null;
    notes?: string | null;
    followUpAt?: string | null;
    followUpAtSet?: boolean;
};

// ── Tenant Contacts ───────────────────────────────────────────────────────────

export type TenantContact = {
    id: string;
    name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
    createdAt: string;
};

export type CreateContactInput = {
    name: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
};

export type UpdateContactInput = {
    name?: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
};

// ── Tenant Notes ──────────────────────────────────────────────────────────────

export type TenantNote = {
    id: string;
    content: string;
    category: string | null;
    createdBy: string | null;
    createdAt: string;
};

export type CreateNoteInput = {
    content: string;
    category?: string | null;
};
