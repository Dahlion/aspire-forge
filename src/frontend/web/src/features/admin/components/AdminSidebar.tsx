import type { TenantSummary } from "../../../types/admin";
import { type AdminRoute } from "../routing";

type AdminSidebarProps = {
    route: AdminRoute;
    tenants: TenantSummary[];
    loadingTenants: boolean;
    onNavigate: (route: AdminRoute) => void;
};

type NavItemProps = {
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: number | string;
    badgeVariant?: string;
};

function NavItem({ icon, label, active, onClick, badge, badgeVariant = "secondary" }: NavItemProps) {
    return (
        <button
            type="button"
            className={`btn btn-block text-left px-3 py-2 mb-1 d-flex align-items-center ${
                active ? "btn-primary font-weight-bold" : "btn-light text-secondary"
            }`}
            style={{ borderRadius: 6, fontSize: "0.9rem" }}
            onClick={onClick}
        >
            <i className={`bi ${icon} mr-2`} style={{ width: 16, textAlign: "center" }} />
            <span className="flex-grow-1">{label}</span>
            {badge !== undefined && (
                <span className={`badge badge-${active ? "light" : badgeVariant} ml-1`}>{badge}</span>
            )}
        </button>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <div className="small text-muted text-uppercase font-weight-bold px-2 py-1 mb-1 mt-2">
            {label}
        </div>
    );
}

export function AdminSidebar({ route, tenants, loadingTenants, onNavigate }: AdminSidebarProps) {
    const isActive = (kind: AdminRoute["kind"]) => route.kind === kind;
    const isClientSection = isActive("client-manager") || isActive("tenant");

    return (
        <div className="d-flex flex-column gap-3">
            {/* Nav card */}
            <div className="card shadow-sm">
                <div
                    className="card-header py-2 px-3"
                    style={{ background: "#1a3a4a", borderRadius: "6px 6px 0 0" }}
                >
                    <span className="text-white font-weight-bold small text-uppercase">
                        <i className="bi bi-shield-lock-fill mr-1" /> Seacoast DevOps
                    </span>
                    <div className="text-white-50" style={{ fontSize: "0.72rem" }}>Owner Admin Dashboard</div>
                </div>
                <div className="card-body py-2 px-2">

                    <SectionLabel label="Overview" />
                    <NavItem
                        icon="bi-speedometer2"
                        label="Stats"
                        active={isActive("dashboard")}
                        onClick={() => onNavigate({ kind: "dashboard" })}
                    />

                    <SectionLabel label="Tools" />

                    <NavItem
                        icon="bi-people-fill"
                        label="Client Manager"
                        active={isClientSection}
                        badge={tenants.length}
                        onClick={() => onNavigate({ kind: "client-manager" })}
                    />

                    <NavItem
                        icon="bi-box-seam-fill"
                        label="Subscription Manager"
                        active={isActive("subscription-manager")}
                        onClick={() => onNavigate({ kind: "subscription-manager" })}
                    />

                    <NavItem
                        icon="bi-briefcase-fill"
                        label="Business Manager"
                        active={isActive("business-manager")}
                        onClick={() => onNavigate({ kind: "business-manager" })}
                    />

                    <NavItem
                        icon="bi-megaphone-fill"
                        label="Marketing Manager"
                        active={isActive("marketing-manager")}
                        onClick={() => onNavigate({ kind: "marketing-manager" })}
                    />

                    <NavItem
                        icon="bi-file-earmark-richtext-fill"
                        label="Form Designer"
                        active={isActive("form-designer")}
                        onClick={() => onNavigate({ kind: "form-designer" })}
                    />

                    <NavItem
                        icon="bi-grid-1x2-fill"
                        label="App Designer"
                        active={isActive("app-designer")}
                        onClick={() => onNavigate({ kind: "app-designer" })}
                    />

                    <SectionLabel label="Dev Tools" />
                    <NavItem
                        icon="bi-cloud-upload-fill"
                        label="Zip Deploy"
                        active={isActive("zip-deploy")}
                        onClick={() => onNavigate({ kind: "zip-deploy" })}
                    />
                    <NavItem
                        icon="bi-tools"
                        label="Toolbox"
                        active={isActive("toolbox")}
                        onClick={() => onNavigate({ kind: "toolbox" })}
                    />

                </div>
            </div>

            {/* Client quick-list — shown when in Client Manager section */}
            {isClientSection && (
                <div className="card shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center py-2 px-3">
                        <span className="small font-weight-bold text-muted text-uppercase">All Clients</span>
                        {loadingTenants && (
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="sr-only">Loading…</span>
                            </div>
                        )}
                    </div>
                    {tenants.length === 0 ? (
                        <div className="card-body text-muted small px-3 py-2">No clients yet.</div>
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
                </div>
            )}
        </div>
    );
}
