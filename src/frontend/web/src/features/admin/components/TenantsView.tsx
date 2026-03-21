import type { TenantSummary } from "../../../types/admin";
import type { AdminRoute } from "../routing";

type Props = {
    tenants: TenantSummary[];
    loadingTenants: boolean;
    onNavigate: (route: AdminRoute) => void;
};

export function TenantsView({ tenants, loadingTenants, onNavigate }: Props) {
    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (loadingTenants) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"><span className="sr-only">Loading…</span></div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0">
                        <i className="bi bi-building mr-2" style={{ color: "#2F4F4F" }} />
                        Tenants
                    </h4>
                    <small className="text-muted">All managed client organizations</small>
                </div>
                <span className="badge badge-secondary badge-pill" style={{ fontSize: "1rem", padding: "6px 14px" }}>
                    {tenants.length} total
                </span>
            </div>

            {tenants.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-building" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No clients yet. Click "New Client" above to get started.</p>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {tenants.map(tenant => (
                        <div key={tenant.id} className="col-md-6 col-lg-4 mb-3">
                            <div
                                className="card shadow-sm border-0 h-100"
                                style={{
                                    borderLeft: `4px solid ${tenant.isActive ? "#2F4F4F" : "#aaa"}`,
                                    cursor: "pointer",
                                    transition: "transform 0.1s",
                                }}
                                onClick={() => onNavigate({ kind: "tenant", tenantId: tenant.id })}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0 font-weight-bold">{tenant.name}</h6>
                                        <span className={`badge badge-${tenant.isActive ? "success" : "secondary"}`}>
                                            {tenant.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <code className="small text-muted d-block mb-3">{tenant.slug}</code>
                                    <div className="row text-center">
                                        <div className="col-6">
                                            <div className="h5 mb-0 font-weight-bold" style={{ color: "#2F4F4F" }}>
                                                {tenant.subscriptionCount}
                                            </div>
                                            <small className="text-muted">Subscriptions</small>
                                        </div>
                                        <div className="col-6">
                                            <div className="h5 mb-0 font-weight-bold text-success">
                                                {tenant.activeSubscriptionCount}
                                            </div>
                                            <small className="text-muted">Active</small>
                                        </div>
                                    </div>
                                    <hr className="my-2" />
                                    <small className="text-muted">Created {fmtDate(tenant.createdAt)}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
