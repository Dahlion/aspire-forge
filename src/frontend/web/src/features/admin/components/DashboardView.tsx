import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { MetricCard } from "./MetricCard";
import type { DashboardData } from "../../../types/admin";
import type { AdminRoute } from "../routing";

type DashboardViewProps = {
    dashboard: DashboardData | null;
    loadingDashboard: boolean;
    onNavigate: (route: AdminRoute) => void;
};

export function DashboardView({ dashboard, loadingDashboard, onNavigate }: DashboardViewProps) {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Tenants" value={dashboard?.tenantCount ?? 0} loading={loadingDashboard} />
                <MetricCard label="Active tenants" value={dashboard?.activeTenantCount ?? 0} loading={loadingDashboard} />
                <MetricCard label="Subscriptions" value={dashboard?.subscriptionCount ?? 0} loading={loadingDashboard} />
                <MetricCard label="Active subs" value={dashboard?.activeSubscriptionCount ?? 0} loading={loadingDashboard} />
                <MetricCard
                    label="MRR"
                    value={dashboard ? `$${dashboard.monthlyRecurringRevenue.toFixed(2)}` : "$0.00"}
                    loading={loadingDashboard}
                />
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <div>
                        <div className="text-lg font-semibold">Recent Tenants</div>
                        <div className="text-sm opacity-70">Newest organizations in your workspace</div>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                    {(dashboard?.recentTenants ?? []).map((tenant) => (
                        <button
                            key={tenant.id}
                            type="button"
                            onClick={() => onNavigate({ kind: "tenant", tenantId: tenant.id })}
                            className="flex w-full items-center justify-between rounded-xl border border-divider px-4 py-3 text-left hover:bg-content2"
                        >
                            <div>
                                <div className="font-medium">{tenant.name}</div>
                                <div className="text-sm opacity-70">Created {new Date(tenant.createdAt).toLocaleDateString()}</div>
                            </div>
                            <Chip variant="flat" color={tenant.isActive ? "success" : "default"}>
                                {tenant.subscriptionCount} subs
                            </Chip>
                        </button>
                    ))}
                </CardBody>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <div>
                        <div className="text-lg font-semibold">Upcoming Renewals</div>
                        <div className="text-sm opacity-70">Next 10 subscriptions by renewal date</div>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                    {(dashboard?.upcomingRenewals ?? []).map((renewal) => (
                        <div key={renewal.id} className="flex items-center justify-between rounded-xl border border-divider px-4 py-3">
                            <div>
                                <div className="font-medium">{renewal.planName}</div>
                                <div className="text-sm opacity-70">{new Date(renewal.renewsAt ?? "").toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">
                                    {renewal.currency} {renewal.monthlyPrice.toFixed(2)}
                                </div>
                                <Chip size="sm" variant="flat" color={renewal.status === "active" ? "success" : "warning"}>
                                    {renewal.status}
                                </Chip>
                            </div>
                        </div>
                    ))}
                </CardBody>
            </Card>
        </>
    );
}
