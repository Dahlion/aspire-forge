import { useCallback } from "react";
import { SUBSCRIPTION_STATUSES } from "../api";
import { DataTable } from "../../../lib/DataTable";
import type { DataTableAction } from "../../../lib/DataTable";
import type { Subscription, TenantDetail } from "../../../types/admin";

type TenantDetailViewProps = {
    tenantDetail: TenantDetail | null;
    loadingTenantDetail: boolean;
    busy: boolean;
    editTenantName: string;
    setEditTenantName: (value: string) => void;
    editTenantSlug: string;
    setEditTenantSlug: (value: string) => void;
    editTenantActive: boolean;
    setEditTenantActive: (value: boolean) => void;
    subPlanName: string;
    setSubPlanName: (value: string) => void;
    subStatus: string;
    setSubStatus: (value: string) => void;
    subSeats: string;
    setSubSeats: (value: string) => void;
    subMonthlyPrice: string;
    setSubMonthlyPrice: (value: string) => void;
    subCurrency: string;
    setSubCurrency: (value: string) => void;
    subAutoRenew: boolean;
    setSubAutoRenew: (value: boolean) => void;
    subStartedAt: string;
    setSubStartedAt: (value: string) => void;
    subRenewsAt: string;
    setSubRenewsAt: (value: string) => void;
    subCancelledAt: string;
    setSubCancelledAt: (value: string) => void;
    onUpdateTenant: () => void;
    onDeleteTenant: () => void;
    onAddSubscription: () => void;
    onUpdateSubscriptionStatus: (subscription: Subscription, nextStatus: string) => void;
    onDeleteSubscription: (subscriptionId: string) => void;
};

const STATUS_COLOR: Record<string, string> = {
    active: "success",
    trialing: "info",
    past_due: "warning",
    canceled: "secondary",
};

export function TenantDetailView({
    tenantDetail,
    loadingTenantDetail,
    busy,
    editTenantName,
    setEditTenantName,
    editTenantSlug,
    setEditTenantSlug,
    editTenantActive,
    setEditTenantActive,
    subPlanName,
    setSubPlanName,
    subStatus,
    setSubStatus,
    subSeats,
    setSubSeats,
    subMonthlyPrice,
    setSubMonthlyPrice,
    subCurrency,
    setSubCurrency,
    subAutoRenew,
    setSubAutoRenew,
    subStartedAt,
    setSubStartedAt,
    subRenewsAt,
    setSubRenewsAt,
    subCancelledAt,
    setSubCancelledAt,
    onUpdateTenant,
    onDeleteTenant,
    onAddSubscription,
    onUpdateSubscriptionStatus,
    onDeleteSubscription,
}: TenantDetailViewProps) {
    const subscriptions = tenantDetail?.subscriptions ?? [];

    const subscriptionColumns = [
        { data: "planName", title: "Plan" },
        {
            data: "status",
            title: "Status",
            render: (d: string) => {
                const cls = STATUS_COLOR[d] ?? "secondary";
                return `<span class="badge badge-${cls}">${d}</span>`;
            },
        },
        { data: "seats", title: "Seats", className: "text-center" },
        {
            data: null,
            title: "Price",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, __: unknown, row: any) =>
                `${row.currency as string} ${(row.monthlyPrice as number).toFixed(2)}`,
        },
        {
            data: "autoRenew",
            title: "Auto Renew",
            className: "text-center",
            render: (d: boolean) =>
                d
                    ? '<i class="bi bi-check-circle-fill text-success"></i>'
                    : '<i class="bi bi-x-circle text-muted"></i>',
        },
        {
            data: "startedAt",
            title: "Started",
            render: (d: string) => new Date(d).toLocaleDateString(),
        },
        {
            data: "renewsAt",
            title: "Renews",
            render: (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—"),
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, __: unknown, row: any) => {
                const sub = row as Subscription;
                let html = "";
                if (sub.status !== "active") {
                    html += `<button class="btn btn-sm btn-outline-success mr-1" data-action="activate" data-id="${sub.id}">
                               <i class="bi bi-check-lg"></i> Activate
                             </button>`;
                }
                if (sub.status !== "canceled") {
                    html += `<button class="btn btn-sm btn-outline-warning mr-1" data-action="cancel" data-id="${sub.id}">
                               <i class="bi bi-x-lg"></i> Cancel
                             </button>`;
                }
                html += `<button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${sub.id}">
                           <i class="bi bi-trash"></i>
                         </button>`;
                return html;
            },
        },
    ];

    const handleSubAction = useCallback(
        ({ action, id }: DataTableAction) => {
            const sub = subscriptions.find((s) => s.id === id);
            if (action === "activate" && sub) {
                onUpdateSubscriptionStatus(sub, "active");
            } else if (action === "cancel" && sub) {
                onUpdateSubscriptionStatus(sub, "canceled");
            } else if (action === "delete") {
                onDeleteSubscription(id);
            }
        },
        [subscriptions, onUpdateSubscriptionStatus, onDeleteSubscription]
    );

    if (!tenantDetail) {
        return (
            <div className="card shadow-sm">
                <div className="card-body text-center text-muted py-5">
                    <i className="bi bi-arrow-left-circle display-4 d-block mb-3" />
                    Select a tenant from the sidebar to view details.
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column gap-4">
            {/* Tenant profile card */}
            <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0 font-weight-bold">
                            <i className="bi bi-building mr-2" />
                            {tenantDetail.name}
                        </h6>
                        <small className="text-muted">Manage tenant profile</small>
                    </div>
                    {loadingTenantDetail && (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="sr-only">Loading…</span>
                        </div>
                    )}
                </div>
                <div className="card-body">
                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label className="small font-weight-bold">Tenant Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={editTenantName}
                                onChange={(e) => setEditTenantName(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-6">
                            <label className="small font-weight-bold">Slug</label>
                            <input
                                type="text"
                                className="form-control"
                                value={editTenantSlug}
                                onChange={(e) => setEditTenantSlug(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="edit-tenant-active"
                            checked={editTenantActive}
                            onChange={(e) => setEditTenantActive(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="edit-tenant-active">
                            Active tenant
                        </label>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-primary"
                            disabled={busy}
                            onClick={onUpdateTenant}
                        >
                            {busy && (
                                <span className="spinner-border spinner-border-sm mr-1" role="status" />
                            )}
                            <i className="bi bi-save mr-1" />
                            Save Tenant
                        </button>
                        <button
                            className="btn btn-outline-danger"
                            disabled={busy}
                            onClick={onDeleteTenant}
                        >
                            <i className="bi bi-trash mr-1" />
                            Delete Tenant
                        </button>
                    </div>
                </div>
            </div>

            {/* Add subscription card */}
            <div className="card shadow-sm">
                <div className="card-header">
                    <h6 className="mb-0 font-weight-bold">
                        <i className="bi bi-plus-circle mr-2" />
                        Add Subscription
                    </h6>
                </div>
                <div className="card-body">
                    <div className="form-row">
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Plan</label>
                            <input
                                type="text"
                                className="form-control"
                                value={subPlanName}
                                onChange={(e) => setSubPlanName(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Status</label>
                            <select
                                className="form-control"
                                value={subStatus}
                                onChange={(e) => setSubStatus(e.target.value)}
                            >
                                {SUBSCRIPTION_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Seats</label>
                            <input
                                type="number"
                                className="form-control"
                                min="1"
                                value={subSeats}
                                onChange={(e) => setSubSeats(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Monthly Price</label>
                            <input
                                type="number"
                                className="form-control"
                                step="0.01"
                                min="0"
                                value={subMonthlyPrice}
                                onChange={(e) => setSubMonthlyPrice(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Currency</label>
                            <input
                                type="text"
                                className="form-control"
                                maxLength={3}
                                value={subCurrency}
                                onChange={(e) => setSubCurrency(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Start Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={subStartedAt}
                                onChange={(e) => setSubStartedAt(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Renews At</label>
                            <input
                                type="date"
                                className="form-control"
                                value={subRenewsAt}
                                onChange={(e) => setSubRenewsAt(e.target.value)}
                            />
                        </div>
                        <div className="form-group col-md-4">
                            <label className="small font-weight-bold">Cancelled At</label>
                            <input
                                type="date"
                                className="form-control"
                                value={subCancelledAt}
                                onChange={(e) => setSubCancelledAt(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="sub-auto-renew"
                            checked={subAutoRenew}
                            onChange={(e) => setSubAutoRenew(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sub-auto-renew">
                            Auto renew
                        </label>
                    </div>
                    <button
                        className="btn btn-secondary"
                        disabled={busy || !subPlanName.trim()}
                        onClick={onAddSubscription}
                    >
                        {busy && (
                            <span className="spinner-border spinner-border-sm mr-1" role="status" />
                        )}
                        <i className="bi bi-plus mr-1" />
                        Add Subscription
                    </button>
                </div>
            </div>

            {/* Subscriptions DataTable */}
            <div className="card shadow-sm">
                <div className="card-header">
                    <h6 className="mb-0 font-weight-bold">
                        <i className="bi bi-receipt mr-2" />
                        Subscriptions
                        <span className="badge badge-secondary ml-2">{subscriptions.length}</span>
                    </h6>
                </div>
                <div className="card-body">
                    {subscriptions.length === 0 ? (
                        <p className="text-muted mb-0">No subscriptions yet.</p>
                    ) : (
                        <DataTable
                            id="dt-subscriptions"
                            columns={subscriptionColumns}
                            data={subscriptions}
                            onAction={handleSubAction}
                            options={{ pageLength: 5, lengthMenu: [5, 10, 25] }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
