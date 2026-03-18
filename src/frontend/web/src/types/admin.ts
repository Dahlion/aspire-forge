export type DashboardData = {
    tenantCount: number;
    activeTenantCount: number;
    subscriptionCount: number;
    activeSubscriptionCount: number;
    monthlyRecurringRevenue: number;
    recentTenants: TenantSummary[];
    upcomingRenewals: RenewalSummary[];
};

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

export type RenewalSummary = {
    id: string;
    tenantId: string;
    planName: string;
    status: string;
    renewsAt: string | null;
    monthlyPrice: number;
    currency: string;
};

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

export type TenantDetail = {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    subscriptions: Subscription[];
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
