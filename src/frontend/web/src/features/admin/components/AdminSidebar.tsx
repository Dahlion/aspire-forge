import type { TenantSummary } from "../../../types/admin";
import { type AdminRoute } from "../routing";

type AdminSidebarProps = {
    route: AdminRoute;
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

type NavItemProps = {
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: number;
};

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
    return (
        <button
            type="button"
            className={`btn btn-block text-left px-3 py-2 mb-1 d-flex align-items-center ${
                active
                    ? "btn-primary font-weight-bold"
                    : "btn-light text-secondary"
            }`}
            style={{ borderRadius: 6, fontSize: "0.9rem" }}
            onClick={onClick}
        >
            <i className={`bi ${icon} mr-2`} style={{ width: 16, textAlign: "center" }} />
            <span className="flex-grow-1">{label}</span>
            {badge !== undefined && (
                <span className={`badge badge-${active ? "light" : "secondary"} ml-1`}>{badge}</span>
            )}
        </button>
    );
}

export function AdminSidebar({
    route,
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
    const isActive = (kind: AdminRoute["kind"]) => route.kind === kind;

    return (
        <div className="d-flex flex-column gap-3">
            {/* Nav card */}
            <div className="card shadow-sm">
                <div
                    className="card-header py-2 px-3"
                    style={{ background: "#2F4F4F", borderRadius: "6px 6px 0 0" }}
                >
                    <span className="text-white font-weight-bold small text-uppercase">
                        <i className="bi bi-shield-lock-fill mr-1" /> Admin Portal
                    </span>
                </div>
                <div className="card-body py-2 px-2">
                    <div className="small text-muted text-uppercase font-weight-bold px-2 py-1 mb-1">Overview</div>
                    <NavItem icon="bi-speedometer2" label="Dashboard" active={isActive("dashboard")}
                        onClick={() => onNavigate({ kind: "dashboard" })} />

                    <div className="small text-muted text-uppercase font-weight-bold px-2 py-1 mb-1 mt-2">Clients</div>
                    <NavItem icon="bi-building" label="Tenants" active={isActive("tenants") || isActive("tenant")}
                        badge={tenants.length} onClick={() => onNavigate({ kind: "tenants" })} />
                    <NavItem icon="bi-funnel-fill" label="Leads / CRM" active={isActive("leads")}
                        onClick={() => onNavigate({ kind: "leads" })} />

                    <div className="small text-muted text-uppercase font-weight-bold px-2 py-1 mb-1 mt-2">Billing</div>
                    <NavItem icon="bi-receipt" label="Invoices" active={isActive("billing")}
                        onClick={() => onNavigate({ kind: "billing" })} />
                    <NavItem icon="bi-box-seam-fill" label="Plans" active={isActive("plans")}
                        onClick={() => onNavigate({ kind: "plans" })} />

                    <div className="small text-muted text-uppercase font-weight-bold px-2 py-1 mb-1 mt-2">App Builder</div>
                    <NavItem icon="bi-diagram-3-fill" label="Workflows" active={isActive("workflows")}
                        onClick={() => onNavigate({ kind: "workflows" })} />
                    <NavItem icon="bi-grid-3x3-gap-fill" label="Micro Apps" active={isActive("microapps")}
                        onClick={() => onNavigate({ kind: "microapps" })} />
                    <NavItem icon="bi-collection-fill" label="App Suites" active={isActive("suites")}
                        onClick={() => onNavigate({ kind: "suites" })} />

                    <div className="small text-muted text-uppercase font-weight-bold px-2 py-1 mb-1 mt-2">Dev Tools</div>
                    <NavItem icon="bi-tools" label="Toolbox" active={isActive("toolbox")}
                        onClick={() => onNavigate({ kind: "toolbox" })} />

                </div>
            </div>

            {/* Tenant quick-list (shown when on tenants/tenant routes) */}
            {(isActive("tenants") || isActive("tenant")) && (
                <div className="card shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center py-2 px-3">
                        <span className="small font-weight-bold text-muted text-uppercase">All Tenants</span>
                        {loadingTenants && (
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="sr-only">Loading…</span>
                            </div>
                        )}
                    </div>
                    {tenants.length === 0 ? (
                        <div className="card-body text-muted small px-3 py-2">No tenants yet.</div>
                    ) : (
                        <div className="list-group list-group-flush" style={{ maxHeight: "280px", overflowY: "auto" }}>
                            {tenants.map(tenant => (
                                <button
                                    key={tenant.id}
                                    type="button"
                                    className={`list-group-item list-group-item-action py-2 px-3 d-flex justify-content-between align-items-center ${
                                        route.kind === "tenant" && route.tenantId === tenant.id ? "active" : ""
                                    }`}
                                    onClick={() => onNavigate({ kind: "tenant", tenantId: tenant.id })}
                                >
                                    <div className="text-left overflow-hidden">
                                        <div className="font-weight-medium" style={{ fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {tenant.name}
                                        </div>
                                        <small className="text-muted" style={{ fontSize: "0.78rem" }}>{tenant.slug}</small>
                                    </div>
                                    <span className={`badge badge-${tenant.isActive ? "success" : "secondary"} badge-pill ml-2`}>
                                        {tenant.subscriptionCount}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick create tenant */}
                    <div className="card-footer py-2 px-3">
                        <div className="small font-weight-bold text-muted mb-2">
                            <i className="bi bi-plus-circle mr-1" />Quick Create
                        </div>
                        <div className="form-group mb-2">
                            <input type="text" className="form-control form-control-sm" placeholder="Tenant name"
                                value={newTenantName} onChange={e => setNewTenantName(e.target.value)} />
                        </div>
                        <div className="form-group mb-2">
                            <input type="text" className="form-control form-control-sm" placeholder="Slug (optional)"
                                value={newTenantSlug} onChange={e => setNewTenantSlug(e.target.value)} />
                        </div>
                        <div className="form-check mb-2">
                            <input type="checkbox" className="form-check-input" id="new-tenant-active"
                                checked={newTenantActive} onChange={e => setNewTenantActive(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="new-tenant-active">Active</label>
                        </div>
                        <button className="btn btn-primary btn-sm btn-block" disabled={busy || !newTenantName.trim()}
                            onClick={onCreateTenant}>
                            {busy ? <span className="spinner-border spinner-border-sm mr-1" role="status" /> : <i className="bi bi-plus mr-1" />}
                            Create
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
