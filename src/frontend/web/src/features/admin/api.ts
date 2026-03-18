import { apiClient } from "../../lib/apiClient";
import type {
    CreateSubscriptionInput,
    CreateTenantInput,
    DashboardData,
    TenantDetail,
    TenantSummary,
    UpdateSubscriptionInput,
    UpdateTenantInput,
} from "../../types/admin";

export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;

export function getAdminDashboard() {
    return apiClient<DashboardData>("/api/admin/dashboard");
}

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
