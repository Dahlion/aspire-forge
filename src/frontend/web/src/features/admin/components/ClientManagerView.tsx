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
}: ClientManagerViewProps) {
    const [tab, setTab] = useState<Tab>("clients");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-people-fill mr-2 text-primary" />
                        Client Manager
                    </h4>
                    <small className="text-muted">
                        Onboard clients, manage subscriptions, track leads and documentation packages.
                    </small>
                </div>
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
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "docs" ? "active" : ""}`}
                        onClick={() => setTab("docs" as Tab)}
                        disabled
                        title="Coming soon"
                    >
                        <i className="bi bi-file-earmark-text mr-1" />
                        Documentation Packages
                        <span className="badge badge-warning ml-2">Soon</span>
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
