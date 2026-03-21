import { useState } from "react";
import { TenantsView } from "./TenantsView";
import { LeadsView } from "./LeadsView";
import type { TenantSummary, Lead } from "../../../types/admin";
import type { AdminRoute } from "../routing";

type Tab = "clients" | "leads";

type ClientManagerViewProps = {
    tenants: TenantSummary[];
    loadingTenants: boolean;
    leads: Lead[];
    loadingLeads: boolean;
    busy: boolean;
    onNavigate: (route: AdminRoute) => void;
    onCreateLead: Parameters<typeof LeadsView>[0]["onCreateLead"];
    onUpdateLead: Parameters<typeof LeadsView>[0]["onUpdateLead"];
    onDeleteLead: Parameters<typeof LeadsView>[0]["onDeleteLead"];
    newTenantName: string;
    newTenantSlug: string;
    newTenantActive: boolean;
    setNewTenantName: (value: string) => void;
    setNewTenantSlug: (value: string) => void;
    setNewTenantActive: (value: boolean) => void;
    onCreateTenant: () => void;
};

export function ClientManagerView({
    tenants,
    loadingTenants,
    leads,
    loadingLeads,
    busy,
    onNavigate,
    onCreateLead,
    onUpdateLead,
    onDeleteLead,
    newTenantName,
    newTenantSlug,
    newTenantActive,
    setNewTenantName,
    setNewTenantSlug,
    setNewTenantActive,
    onCreateTenant,
}: ClientManagerViewProps) {
    const [tab, setTab] = useState<Tab>("clients");
    const [showModal, setShowModal] = useState(false);

    const handleCreate = () => {
        onCreateTenant();
        setShowModal(false);
    };

    return (
        <div>
            {/* New Client Modal */}
            {showModal && (
                <div
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                        zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="card shadow"
                        style={{ width: "100%", maxWidth: 480 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="card-header d-flex justify-content-between align-items-center"
                            style={{ background: "#1a3a4a", color: "#fff" }}>
                            <strong><i className="bi bi-person-plus-fill mr-2" />New Client</strong>
                            <button className="btn btn-xs btn-outline-light" onClick={() => setShowModal(false)}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="form-group mb-3">
                                <label className="small font-weight-bold">Client Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Acme City Government"
                                    value={newTenantName}
                                    onChange={e => setNewTenantName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="small font-weight-bold">Slug <span className="text-muted font-weight-normal">(optional — auto-generated)</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="acme-city"
                                    value={newTenantSlug}
                                    onChange={e => setNewTenantSlug(e.target.value)}
                                />
                            </div>
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="modal-tenant-active"
                                    checked={newTenantActive}
                                    onChange={e => setNewTenantActive(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="modal-tenant-active">
                                    Active immediately
                                </label>
                            </div>
                        </div>
                        <div className="card-footer d-flex gap-2 justify-content-end">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={busy || !newTenantName.trim()}
                                onClick={handleCreate}
                            >
                                {busy
                                    ? <span className="spinner-border spinner-border-sm mr-1" role="status" />
                                    : <i className="bi bi-plus mr-1" />}
                                Create Client
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-people-fill mr-2 text-primary" />
                        Client Manager
                    </h4>
                    <small className="text-muted">
                        Onboard clients, manage subscriptions, track leads and documentation packages.
                    </small>
                </div>
                {tab === "clients" && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <i className="bi bi-person-plus-fill mr-1" />New Client
                    </button>
                )}
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "clients" ? "active" : ""}`}
                        onClick={() => setTab("clients")}
                    >
                        <i className="bi bi-building mr-1" />
                        Clients
                        <span className="badge badge-secondary ml-2">{tenants.length}</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "leads" ? "active" : ""}`}
                        onClick={() => setTab("leads")}
                    >
                        <i className="bi bi-funnel-fill mr-1" />
                        Leads / CRM
                        <span className="badge badge-secondary ml-2">{leads.length}</span>
                    </button>
                </li>
            </ul>

            {tab === "clients" && (
                <TenantsView
                    tenants={tenants}
                    loadingTenants={loadingTenants}
                    onNavigate={onNavigate}
                />
            )}

            {tab === "leads" && (
                <LeadsView
                    leads={leads}
                    loadingLeads={loadingLeads}
                    busy={busy}
                    onCreateLead={onCreateLead}
                    onUpdateLead={onUpdateLead}
                    onDeleteLead={onDeleteLead}
                />
            )}
        </div>
    );
}
