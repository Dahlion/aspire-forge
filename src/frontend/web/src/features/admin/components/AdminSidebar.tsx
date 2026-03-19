import type { TenantSummary } from "../../../types/admin";
import { type AdminRoute } from "../routing";

type AdminSidebarProps = {
    tenants: TenantSummary[];
    loadingTenants: boolean;
    busy: boolean;
    newTenantName: string;
    newTenantSlug: string;
    newTenantActive: boolean;
    setNewTenantName: (value: string) => void;
    setNewTenantSlug: (value: string) => void;
    setNewTenantActive: (value: boolean) => void;
    onCreateTenant: () => void;
    onNavigate: (route: AdminRoute) => void;
};

export function AdminSidebar({
    tenants,
    loadingTenants,
    busy,
    newTenantName,
    newTenantSlug,
    newTenantActive,
    setNewTenantName,
    setNewTenantSlug,
    setNewTenantActive,
    onCreateTenant,
    onNavigate,
}: AdminSidebarProps) {
    return (
        <div className="d-flex flex-column gap-3">
            {/* Tenant list */}
            <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span className="text-muted text-uppercase small font-weight-bold">Tenants</span>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onNavigate({ kind: "dashboard" })}
                    >
                        <i className="bi bi-speedometer2 mr-1" />
                        Overview
                    </button>
                </div>

                {loadingTenants ? (
                    <div className="card-body text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="sr-only">Loading…</span>
                        </div>
                    </div>
                ) : tenants.length === 0 ? (
                    <div className="card-body text-muted small">No tenants yet.</div>
                ) : (
                    <div className="list-group list-group-flush" style={{ maxHeight: "360px", overflowY: "auto" }}>
                        {tenants.map((tenant) => (
                            <button
                                key={tenant.id}
                                type="button"
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                onClick={() => onNavigate({ kind: "tenant", tenantId: tenant.id })}
                            >
                                <div className="text-left">
                                    <div className="font-weight-medium">{tenant.name}</div>
                                    <small className="text-muted">{tenant.slug}</small>
                                </div>
                                <span
                                    className={`badge badge-${tenant.isActive ? "success" : "secondary"} badge-pill`}
                                >
                                    {tenant.subscriptionCount}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Create tenant form */}
            <div className="card shadow-sm">
                <div className="card-header">
                    <span className="text-muted text-uppercase small font-weight-bold">
                        <i className="bi bi-plus-circle mr-1" />
                        Create Tenant
                    </span>
                </div>
                <div className="card-body">
                    <div className="form-group mb-2">
                        <label className="small font-weight-bold mb-1">Name</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Acme Corp"
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-2">
                        <label className="small font-weight-bold mb-1">Slug (optional)</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="acme-corp"
                            value={newTenantSlug}
                            onChange={(e) => setNewTenantSlug(e.target.value)}
                        />
                    </div>
                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="new-tenant-active"
                            checked={newTenantActive}
                            onChange={(e) => setNewTenantActive(e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="new-tenant-active">
                            Active tenant
                        </label>
                    </div>
                    <button
                        className="btn btn-primary btn-sm btn-block"
                        disabled={busy || !newTenantName.trim()}
                        onClick={onCreateTenant}
                    >
                        {busy ? (
                            <span className="spinner-border spinner-border-sm mr-1" role="status" />
                        ) : (
                            <i className="bi bi-plus mr-1" />
                        )}
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
