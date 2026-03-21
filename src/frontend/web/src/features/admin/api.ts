import { apiClient } from "../../lib/apiClient";
import type {
    CreateContactInput,
    CreateInvoiceInput,
    CreateLeadInput,
    CreateNoteInput,
    CreatePlanInput,
    CreateSubscriptionInput,
    CreateTenantInput,
    DashboardData,
    Invoice,
    Lead,
    SubscriptionPlan,
    TenantDetail,
    TenantSummary,
    UpdateContactInput,
    UpdateInvoiceInput,
    UpdateLeadInput,
    UpdatePlanInput,
    UpdateSubscriptionInput,
    UpdateTenantInput,
} from "../../types/admin";
import type {
    AppSuite,
    AppDomain,
    AppLink,
    CreateMicroAppInput,
    CreateSuiteInput,
    MicroApp,
    UpdateMicroAppInput,
    UpdateSuiteInput,
} from "../../types/microapp";

export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void"] as const;
export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export const LEAD_SEGMENTS = ["government", "healthcare", "private"] as const;
export const LEAD_SOURCES = ["website", "referral", "cold-call", "event", "other"] as const;
export const NOTE_CATEGORIES = ["general", "billing", "support", "sales"] as const;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function getAdminDashboard() {
    return apiClient<DashboardData>("/api/admin/dashboard");
}

// ── Tenants ───────────────────────────────────────────────────────────────────

export function getTenants() {
    return apiClient<TenantSummary[]>("/api/admin/tenants");
}

export function createTenant(input: CreateTenantInput) {
    return apiClient("/api/admin/tenants", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function getTenantDetail(tenantId: string) {
    return apiClient<TenantDetail>(`/api/admin/tenants/${tenantId}`);
}

export function updateTenant(tenantId: string, input: UpdateTenantInput) {
    return apiClient(`/api/admin/tenants/${tenantId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteTenant(tenantId: string) {
    return apiClient(`/api/admin/tenants/${tenantId}`, { method: "DELETE" });
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function createSubscription(tenantId: string, input: CreateSubscriptionInput) {
    return apiClient(`/api/admin/tenants/${tenantId}/subscriptions`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateSubscription(tenantId: string, subscriptionId: string, input: UpdateSubscriptionInput) {
    return apiClient(`/api/admin/tenants/${tenantId}/subscriptions/${subscriptionId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteSubscription(tenantId: string, subscriptionId: string) {
    return apiClient(`/api/admin/tenants/${tenantId}/subscriptions/${subscriptionId}`, {
        method: "DELETE",
    });
}

// ── Subscription Plans ────────────────────────────────────────────────────────

export function getPlans() {
    return apiClient<SubscriptionPlan[]>("/api/admin/plans");
}

export function createPlan(input: CreatePlanInput) {
    return apiClient("/api/admin/plans", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updatePlan(planId: string, input: UpdatePlanInput) {
    return apiClient(`/api/admin/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deletePlan(planId: string) {
    return apiClient(`/api/admin/plans/${planId}`, { method: "DELETE" });
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export function getAllInvoices(status?: string) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient<Invoice[]>(`/api/admin/invoices${qs}`);
}

export function getTenantInvoices(tenantId: string) {
    return apiClient<Invoice[]>(`/api/admin/tenants/${tenantId}/invoices`);
}

export function createInvoice(tenantId: string, input: CreateInvoiceInput) {
    return apiClient(`/api/admin/tenants/${tenantId}/invoices`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateInvoice(invoiceId: string, input: UpdateInvoiceInput) {
    return apiClient(`/api/admin/invoices/${invoiceId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteInvoice(invoiceId: string) {
    return apiClient(`/api/admin/invoices/${invoiceId}`, { method: "DELETE" });
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export function getLeads(status?: string, segment?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (segment) params.set("segment", segment);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiClient<Lead[]>(`/api/admin/leads${qs}`);
}

export function createLead(input: CreateLeadInput) {
    return apiClient("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateLead(leadId: string, input: UpdateLeadInput) {
    return apiClient(`/api/admin/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteLead(leadId: string) {
    return apiClient(`/api/admin/leads/${leadId}`, { method: "DELETE" });
}

// ── Tenant Contacts ───────────────────────────────────────────────────────────

export function createContact(tenantId: string, input: CreateContactInput) {
    return apiClient(`/api/admin/tenants/${tenantId}/contacts`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateContact(tenantId: string, contactId: string, input: UpdateContactInput) {
    return apiClient(`/api/admin/tenants/${tenantId}/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteContact(tenantId: string, contactId: string) {
    return apiClient(`/api/admin/tenants/${tenantId}/contacts/${contactId}`, { method: "DELETE" });
}

// ── Tenant Notes ──────────────────────────────────────────────────────────────

export function createNote(tenantId: string, input: CreateNoteInput) {
    return apiClient(`/api/admin/tenants/${tenantId}/notes`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function deleteNote(tenantId: string, noteId: string) {
    return apiClient(`/api/admin/tenants/${tenantId}/notes/${noteId}`, { method: "DELETE" });
}

// ── Micro Apps ─────────────────────────────────────────────────────────────────

export function getMicroApps(tenantId?: string, status?: string) {
    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", tenantId);
    if (status)   params.set("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiClient<MicroApp[]>(`/api/microapps${qs}`);
}

export function getMicroApp(id: string) {
    return apiClient<MicroApp>(`/api/microapps/${id}`);
}

export function createMicroApp(input: CreateMicroAppInput) {
    return apiClient<MicroApp>("/api/microapps", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateMicroApp(id: string, input: UpdateMicroAppInput) {
    return apiClient<MicroApp>(`/api/microapps/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteMicroApp(id: string) {
    return apiClient(`/api/microapps/${id}`, { method: "DELETE" });
}

// ── Domains ────────────────────────────────────────────────────────────────────

export function getDomains(microAppId: string) {
    return apiClient<AppDomain[]>(`/api/microapps/${microAppId}/domains`);
}

export function addDomain(microAppId: string, hostname: string, isPrimary: boolean) {
    return apiClient<AppDomain>(`/api/microapps/${microAppId}/domains`, {
        method: "POST",
        body: JSON.stringify({ hostname, isPrimary }),
    });
}

export function verifyDomain(microAppId: string, domainId: string) {
    return apiClient<AppDomain>(`/api/microapps/${microAppId}/domains/${domainId}/verify`, {
        method: "POST",
    });
}

export function deleteDomain(microAppId: string, domainId: string) {
    return apiClient(`/api/microapps/${microAppId}/domains/${domainId}`, { method: "DELETE" });
}

// ── App Links ──────────────────────────────────────────────────────────────────

export function getLinks(microAppId: string) {
    return apiClient<AppLink[]>(`/api/microapps/${microAppId}/links`);
}

export function addLink(microAppId: string, targetMicroAppId: string, linkType: string, label?: string) {
    return apiClient<AppLink>(`/api/microapps/${microAppId}/links`, {
        method: "POST",
        body: JSON.stringify({ targetMicroAppId, linkType, label }),
    });
}

export function deleteLink(microAppId: string, linkId: string) {
    return apiClient(`/api/microapps/${microAppId}/links/${linkId}`, { method: "DELETE" });
}

// ── App Suites ─────────────────────────────────────────────────────────────────

export function getAppSuites(tenantId?: string) {
    const qs = tenantId ? `?tenantId=${tenantId}` : "";
    return apiClient<AppSuite[]>(`/api/appsuites${qs}`);
}

export function createAppSuite(input: CreateSuiteInput) {
    return apiClient<AppSuite>("/api/appsuites", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateAppSuite(id: string, input: UpdateSuiteInput) {
    return apiClient<AppSuite>(`/api/appsuites/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteAppSuite(id: string) {
    return apiClient(`/api/appsuites/${id}`, { method: "DELETE" });
}

// ── Industry Seed ──────────────────────────────────────────────────────────────

export function seedIndustryTemplates() {
    return apiClient("/api/workflow/seed-industry", { method: "POST" });
}
