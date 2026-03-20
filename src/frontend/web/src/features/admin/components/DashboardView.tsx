import { useEffect, useRef } from "react";
import { Chart } from "chart.js";
import { DataTable } from "../../../lib/DataTable";
import { MetricCard } from "./MetricCard";
import type { DashboardData } from "../../../types/admin";
import type { AdminRoute } from "../routing";
import type { DataTableAction } from "../../../lib/DataTable";

type DashboardViewProps = {
    dashboard: DashboardData | null;
    loadingDashboard: boolean;
    onNavigate: (route: AdminRoute) => void;
};

const STATUS_COLOR_MAP: Record<string, string> = {
    active: "success",
    trialing: "info",
    past_due: "warning",
    canceled: "secondary",
};

export function DashboardView({ dashboard, loadingDashboard, onNavigate }: DashboardViewProps) {
    const tenantChartRef = useRef<HTMLCanvasElement>(null);
    const subChartRef = useRef<HTMLCanvasElement>(null);
    const tenantChartInst = useRef<Chart | null>(null);
    const subChartInst = useRef<Chart | null>(null);

    // Tenant status doughnut
    useEffect(() => {
        if (!tenantChartRef.current || !dashboard) return;
        tenantChartInst.current?.destroy();

        tenantChartInst.current = new Chart(tenantChartRef.current, {
            type: "doughnut",
            data: {
                labels: ["Active", "Inactive"],
                datasets: [
                    {
                        data: [
                            dashboard.activeTenantCount,
                            Math.max(0, dashboard.tenantCount - dashboard.activeTenantCount),
                        ],
                        backgroundColor: ["#2E8B57", "#6c757d"],
                        borderWidth: 2,
                        borderColor: "#fff",
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" } },
            },
        });

        return () => {
            tenantChartInst.current?.destroy();
            tenantChartInst.current = null;
        };
    }, [dashboard]);

    // Subscription status doughnut
    useEffect(() => {
        if (!subChartRef.current || !dashboard) return;
        subChartInst.current?.destroy();

        const inactive = Math.max(0, dashboard.subscriptionCount - dashboard.activeSubscriptionCount);

        subChartInst.current = new Chart(subChartRef.current, {
            type: "doughnut",
            data: {
                labels: ["Active", "Other"],
                datasets: [
                    {
                        data: [dashboard.activeSubscriptionCount, inactive],
                        backgroundColor: ["#2E8B57", "#6c757d"],
                        borderWidth: 2,
                        borderColor: "#fff",
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" } },
            },
        });

        return () => {
            subChartInst.current?.destroy();
            subChartInst.current = null;
        };
    }, [dashboard]);

    const tenantsColumns = [
        { data: "name", title: "Name" },
        { data: "slug", title: "Slug" },
        {
            data: "isActive",
            title: "Status",
            render: (d: boolean) =>
                d
                    ? '<span class="badge badge-success">Active</span>'
                    : '<span class="badge badge-secondary">Inactive</span>',
        },
        { data: "subscriptionCount", title: "Subs", className: "text-center" },
        { data: "activeSubscriptionCount", title: "Active Subs", className: "text-center" },
        {
            data: "createdAt",
            title: "Created",
            render: (d: string) => new Date(d).toLocaleDateString(),
        },
        {
            data: "id",
            title: "",
            orderable: false,
            className: "text-center",
            render: (d: string) =>
                `<button class="btn btn-sm btn-outline-primary" data-action="view" data-id="${d}">
                   <i class="bi bi-arrow-right-circle"></i> View
                 </button>`,
        },
    ];

    const renewalColumns = [
        { data: "planName", title: "Plan" },
        {
            data: "renewsAt",
            title: "Renews At",
            render: (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—"),
        },
        {
            data: null,
            title: "Price",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, __: unknown, row: any) =>
                `${row.currency as string} ${(row.monthlyPrice as number).toFixed(2)}`,
        },
        {
            data: "status",
            title: "Status",
            render: (d: string) => {
                const cls = STATUS_COLOR_MAP[d] ?? "secondary";
                return `<span class="badge badge-${cls}">${d}</span>`;
            },
        },
    ];

    const handleAction = ({ action, id }: DataTableAction) => {
        if (action === "view") onNavigate({ kind: "tenant", tenantId: id });
    };

    return (
        <>
            {/* Metric cards — row 1 */}
            <div className="row mb-3">
                {[
                    { label: "Tenants", value: dashboard?.tenantCount ?? 0 },
                    { label: "Active Tenants", value: dashboard?.activeTenantCount ?? 0 },
                    { label: "Subscriptions", value: dashboard?.subscriptionCount ?? 0 },
                    { label: "Active Subs", value: dashboard?.activeSubscriptionCount ?? 0 },
                    {
                        label: "MRR",
                        value: dashboard ? `$${dashboard.monthlyRecurringRevenue.toFixed(2)}` : "$0.00",
                    },
                ].map((m) => (
                    <div key={m.label} className="col-sm-6 col-xl mb-3">
                        <MetricCard label={m.label} value={m.value} loading={loadingDashboard} />
                    </div>
                ))}
            </div>
            {/* Metric cards — row 2 */}
            <div className="row mb-4">
                {[
                    { label: "Total Leads", value: dashboard?.leadCount ?? 0 },
                    { label: "New Leads", value: dashboard?.newLeadCount ?? 0 },
                    { label: "Active Pipeline", value: dashboard?.activeLeadCount ?? 0 },
                    { label: "Overdue Invoices", value: dashboard?.overdueInvoiceCount ?? 0 },
                    {
                        label: "Outstanding",
                        value: dashboard ? `$${dashboard.outstandingRevenue.toFixed(2)}` : "$0.00",
                    },
                ].map((m) => (
                    <div key={m.label} className="col-sm-6 col-xl mb-3">
                        <MetricCard label={m.label} value={m.value} loading={loadingDashboard} />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-header font-weight-bold">
                            <i className="bi bi-building mr-2" />
                            Tenant Status
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            <canvas ref={tenantChartRef} style={{ maxHeight: "240px" }} />
                        </div>
                    </div>
                </div>
                <div className="col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-header font-weight-bold">
                            <i className="bi bi-receipt mr-2" />
                            Subscription Status
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            <canvas ref={subChartRef} style={{ maxHeight: "240px" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent tenants DataTable */}
            <div className="card shadow-sm mb-4">
                <div className="card-header">
                    <h6 className="mb-0 font-weight-bold">
                        <i className="bi bi-people-fill mr-2" />
                        Recent Tenants
                    </h6>
                    <small className="text-muted">Newest organizations</small>
                </div>
                <div className="card-body">
                    <DataTable
                        id="dt-recent-tenants"
                        columns={tenantsColumns}
                        data={dashboard?.recentTenants ?? []}
                        onAction={handleAction}
                    />
                </div>
            </div>

            {/* Upcoming renewals DataTable */}
            <div className="card shadow-sm mb-4">
                <div className="card-header">
                    <h6 className="mb-0 font-weight-bold">
                        <i className="bi bi-calendar-event mr-2" />
                        Upcoming Renewals
                    </h6>
                    <small className="text-muted">Next 10 subscriptions by renewal date</small>
                </div>
                <div className="card-body">
                    <DataTable
                        id="dt-renewals"
                        columns={renewalColumns}
                        data={dashboard?.upcomingRenewals ?? []}
                    />
                </div>
            </div>
        </>
    );
}
