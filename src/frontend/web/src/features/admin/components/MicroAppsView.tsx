import { useEffect, useState } from "react";
import type { MicroApp, AppDomain, AppLink } from "../../../types/microapp";
import type { TenantSummary } from "../../../types/admin";
import {
    getMicroApps, createMicroApp, updateMicroApp, deleteMicroApp,
    addDomain, deleteDomain, verifyDomain,
    addLink, deleteLink,
    getTenants,
    seedIndustryTemplates,
} from "../api";

// Workflow process list is fetched directly — lightweight fetch without hook
async function fetchProcesses() {
    const res = await fetch("/api/workflow/processes");
    return res.ok ? res.json() : [];
}

const STATUS_COLORS: Record<string, string> = {
    active:    "success",
    archived:  "secondary",
    suspended: "warning",
};

const LINK_TYPE_LABELS: Record<string, string> = {
    "related":           "Related",
    "child":             "Child",
    "data-feed":         "Data Feed",
    "workflow-handoff":  "Workflow Handoff",
};

export function MicroAppsView() {
    const [apps, setApps]             = useState<MicroApp[]>([]);
    const [tenants, setTenants]       = useState<TenantSummary[]>([]);
    const [processes, setProcesses]   = useState<{ id: string; name: string; appSlug?: string }[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [busy, setBusy]             = useState(false);

    // Filter state
    const [filterTenant, setFilterTenant] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // Create form
    const [showCreate, setShowCreate]   = useState(false);
    const [newTenantId, setNewTenantId] = useState("");
    const [newProcessId, setNewProcessId] = useState("");
    const [newDisplayName, setNewDisplayName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newPrimary, setNewPrimary]   = useState("#2F4F4F");
    const [newAccent, setNewAccent]     = useState("#4a9a9a");
    const [newIcon, setNewIcon]         = useState("bi-diagram-3-fill");

    // Expanded app detail (domains + links panel)
    const [expandedId, setExpandedId]   = useState<string | null>(null);

    // Domain add form (keyed by appId)
    const [domainHostname, setDomainHostname] = useState("");
    const [domainPrimary, setDomainPrimary]   = useState(false);

    // Link add form
    const [linkTargetId, setLinkTargetId] = useState("");
    const [linkType, setLinkType]         = useState("related");
    const [linkLabel, setLinkLabel]       = useState("");

    // Edit status dropdown
    const [editStatusId, setEditStatusId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const qs: { tenantId?: string; status?: string } = {};
            if (filterTenant) qs.tenantId = filterTenant;
            if (filterStatus) qs.status   = filterStatus;
            const [appsData, tenantsData, procsData] = await Promise.all([
                getMicroApps(filterTenant || undefined, filterStatus || undefined),
                getTenants(),
                fetchProcesses(),
            ]);
            setApps(appsData);
            setTenants(tenantsData);
            setProcesses(procsData);
        } catch {
            setError("Failed to load micro apps.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filterTenant, filterStatus]);

    const handleCreate = async () => {
        if (!newTenantId || !newProcessId || !newDisplayName.trim()) return;
        setBusy(true);
        try {
            await createMicroApp({
                tenantId: newTenantId,
                workflowProcessId: newProcessId,
                displayName: newDisplayName.trim(),
                description: newDescription || undefined,
                primaryColor: newPrimary,
                accentColor: newAccent,
                iconClass: newIcon,
            });
            setShowCreate(false);
            setNewTenantId(""); setNewProcessId(""); setNewDisplayName("");
            setNewDescription(""); setNewPrimary("#2F4F4F"); setNewAccent("#4a9a9a"); setNewIcon("bi-diagram-3-fill");
            await load();
        } catch {
            setError("Failed to create micro app.");
        } finally {
            setBusy(false);
        }
    };

    const handleStatusChange = async (app: MicroApp, status: string) => {
        setBusy(true);
        try {
            await updateMicroApp(app.id, { status: status as "active" | "archived" | "suspended" });
            setEditStatusId(null);
            await load();
        } catch {
            setError("Failed to update status.");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (app: MicroApp) => {
        if (!window.confirm(`Delete "${app.displayName}"? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await deleteMicroApp(app.id);
            if (expandedId === app.id) setExpandedId(null);
            await load();
        } catch {
            setError("Failed to delete micro app.");
        } finally {
            setBusy(false);
        }
    };

    const handleAddDomain = async (appId: string) => {
        if (!domainHostname.trim()) return;
        setBusy(true);
        try {
            await addDomain(appId, domainHostname.trim(), domainPrimary);
            setDomainHostname(""); setDomainPrimary(false);
            await load();
        } catch {
            setError("Failed to add domain.");
        } finally {
            setBusy(false);
        }
    };

    const handleVerifyDomain = async (appId: string, domainId: string) => {
        setBusy(true);
        try {
            await verifyDomain(appId, domainId);
            await load();
        } catch {
            setError("Failed to verify domain.");
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteDomain = async (appId: string, domainId: string) => {
        if (!window.confirm("Remove this domain?")) return;
        setBusy(true);
        try {
            await deleteDomain(appId, domainId);
            await load();
        } catch {
            setError("Failed to remove domain.");
        } finally {
            setBusy(false);
        }
    };

    const handleAddLink = async (appId: string) => {
        if (!linkTargetId) return;
        setBusy(true);
        try {
            await addLink(appId, linkTargetId, linkType, linkLabel || undefined);
            setLinkTargetId(""); setLinkType("related"); setLinkLabel("");
            await load();
        } catch {
            setError("Failed to add link.");
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteLink = async (appId: string, linkId: string) => {
        setBusy(true);
        try {
            await deleteLink(appId, linkId);
            await load();
        } catch {
            setError("Failed to remove link.");
        } finally {
            setBusy(false);
        }
    };

    const handleSeedIndustry = async () => {
        if (!window.confirm("Seed industry templates (EMS + Government contracts)? This creates new tenants and processes.")) return;
        setBusy(true);
        try {
            const result = await seedIndustryTemplates() as Record<string, unknown>;
            alert(`Seed complete. ${result.tenants} tenants, ${result.processes} processes, ${result.microApps} micro apps created.`);
            await load();
        } catch {
            setError("Seed failed — data may already exist.");
        } finally {
            setBusy(false);
        }
    };

    const expandedApp = apps.find(a => a.id === expandedId);

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="font-weight-bold mb-1">
                        <i className="bi bi-grid-3x3-gap-fill mr-2" style={{ color: "#2F4F4F" }} />
                        Micro Apps
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                        Deploy workflow processes as standalone apps. Assign custom domains, group into suites, and link related apps.
                    </p>
                </div>
                <div className="d-flex" style={{ gap: "0.5rem" }}>
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleSeedIndustry} disabled={busy}>
                        <i className="bi bi-database-fill-add mr-1" />Industry Seed
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)} disabled={busy}>
                        <i className="bi bi-plus-circle-fill mr-1" />{showCreate ? "Cancel" : "New Micro App"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger alert-dismissible mb-3">
                    {error}
                    <button type="button" className="close" onClick={() => setError(null)}><span>&times;</span></button>
                </div>
            )}

            {/* Create form */}
            {showCreate && (
                <div className="card border-primary shadow-sm mb-4">
                    <div className="card-header bg-primary text-white py-2">
                        <i className="bi bi-plus-circle-fill mr-2" />New Micro App
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Tenant *</label>
                                    <select className="form-control form-control-sm" value={newTenantId} onChange={e => setNewTenantId(e.target.value)}>
                                        <option value="">— Select Tenant —</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Workflow Process *</label>
                                    <select className="form-control form-control-sm" value={newProcessId} onChange={e => setNewProcessId(e.target.value)}>
                                        <option value="">— Select Process —</option>
                                        {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Display Name *</label>
                                    <input type="text" className="form-control form-control-sm" placeholder="e.g. EMS Dispatch"
                                        value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Description</label>
                                    <textarea className="form-control form-control-sm" rows={2} placeholder="Brief description shown in the client portal"
                                        value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Primary Color</label>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <input type="color" className="form-control form-control-sm" style={{ width: 48, height: 34, padding: 2 }}
                                            value={newPrimary} onChange={e => setNewPrimary(e.target.value)} />
                                        <input type="text" className="form-control form-control-sm" value={newPrimary}
                                            onChange={e => setNewPrimary(e.target.value)} style={{ fontFamily: "monospace" }} />
                                    </div>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Accent Color</label>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <input type="color" className="form-control form-control-sm" style={{ width: 48, height: 34, padding: 2 }}
                                            value={newAccent} onChange={e => setNewAccent(e.target.value)} />
                                        <input type="text" className="form-control form-control-sm" value={newAccent}
                                            onChange={e => setNewAccent(e.target.value)} style={{ fontFamily: "monospace" }} />
                                    </div>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Icon Class (Bootstrap Icons)</label>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <span style={{ fontSize: "1.4rem", color: newPrimary }}>
                                            <i className={`bi ${newIcon}`} />
                                        </span>
                                        <input type="text" className="form-control form-control-sm" placeholder="bi-diagram-3-fill"
                                            value={newIcon} onChange={e => setNewIcon(e.target.value)} style={{ fontFamily: "monospace" }} />
                                    </div>
                                </div>
                                {/* Preview */}
                                <div className="mt-3 p-2 rounded" style={{ background: newPrimary, color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <i className={`bi ${newIcon}`} style={{ fontSize: "1.5rem" }} />
                                    <div>
                                        <div className="font-weight-bold">{newDisplayName || "App Name"}</div>
                                        <small style={{ opacity: 0.8 }}>Preview</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm mt-1" onClick={handleCreate}
                            disabled={busy || !newTenantId || !newProcessId || !newDisplayName.trim()}>
                            {busy ? <span className="spinner-border spinner-border-sm mr-1" /> : <i className="bi bi-check-circle mr-1" />}
                            Create Micro App
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card shadow-sm mb-3">
                <div className="card-body py-2 px-3">
                    <div className="row align-items-center">
                        <div className="col-md-4">
                            <select className="form-control form-control-sm" value={filterTenant} onChange={e => setFilterTenant(e.target.value)}>
                                <option value="">All Tenants</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-control form-control-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div className="col-md-5 text-right text-muted small">
                            {apps.length} app{apps.length !== 1 ? "s" : ""} shown
                        </div>
                    </div>
                </div>
            </div>

            {/* App list */}
            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : apps.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-grid d-block mb-3" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                        <p className="mb-0">No micro apps yet.</p>
                        <small>Create one above or run the Industry Seed to load example apps.</small>
                    </div>
                </div>
            ) : (
                <div className="d-flex flex-column" style={{ gap: "0.75rem" }}>
                    {apps.map(app => {
                        const isExpanded = expandedId === app.id;
                        const tenant = tenants.find(t => t.id === app.tenantId);
                        return (
                            <div key={app.id} className="card shadow-sm border-0" style={{ borderLeft: `4px solid ${app.primaryColor}` }}>
                                {/* App row */}
                                <div className="card-body py-3 px-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: "0.5rem" }}>
                                        {/* Icon + name */}
                                        <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                                            <div className="d-flex align-items-center justify-content-center rounded"
                                                style={{ width: 40, height: 40, background: app.primaryColor, color: "#fff", fontSize: "1.2rem", flexShrink: 0 }}>
                                                <i className={`bi ${app.iconClass}`} />
                                            </div>
                                            <div>
                                                <div className="font-weight-bold" style={{ fontSize: "0.95rem" }}>{app.displayName}</div>
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                                                    <i className="bi bi-building mr-1" />{tenant?.name ?? app.tenantId}
                                                    {app.suite && (
                                                        <span className="ml-2">
                                                            <i className="bi bi-collection-fill mr-1" style={{ color: app.suite.color }} />
                                                            {app.suite.name}
                                                        </span>
                                                    )}
                                                    <span className="ml-2 text-monospace" style={{ fontSize: "0.75rem" }}>/{app.slug}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right controls */}
                                        <div className="d-flex align-items-center flex-wrap" style={{ gap: "0.5rem" }}>
                                            {/* Domains badges */}
                                            {(app.domains?.length ?? 0) > 0 && app.domains!.map(d => (
                                                <span key={d.id} className="badge badge-light border" style={{ fontSize: "0.75rem" }}>
                                                    <i className={`bi bi-globe mr-1 text-${d.sslStatus === "provisioned" ? "success" : "warning"}`} />
                                                    {d.hostname}
                                                </span>
                                            ))}

                                            {/* Status badge / dropdown */}
                                            {editStatusId === app.id ? (
                                                <select className="form-control form-control-sm" style={{ width: "auto" }}
                                                    value={app.status}
                                                    onChange={e => handleStatusChange(app, e.target.value)}
                                                    onBlur={() => setEditStatusId(null)}>
                                                    <option value="active">Active</option>
                                                    <option value="archived">Archived</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            ) : (
                                                <span
                                                    className={`badge badge-${STATUS_COLORS[app.status] ?? "secondary"}`}
                                                    style={{ cursor: "pointer", fontSize: "0.78rem" }}
                                                    onClick={() => setEditStatusId(app.id)}
                                                    title="Click to change status"
                                                >
                                                    {app.status}
                                                </span>
                                            )}

                                            {/* Steps count */}
                                            {app.process && (
                                                <span className="text-muted small">
                                                    <i className="bi bi-list-ol mr-1" />{app.process.steps.length} steps
                                                </span>
                                            )}

                                            <button className="btn btn-sm btn-light" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                                                <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`} />
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(app)} disabled={busy}>
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>
                                    {app.description && (
                                        <p className="text-muted mb-0 mt-2" style={{ fontSize: "0.85rem" }}>{app.description}</p>
                                    )}
                                </div>

                                {/* Expanded: Domains + Links */}
                                {isExpanded && expandedApp?.id === app.id && (
                                    <div className="card-footer bg-light px-3 py-3">
                                        <div className="row">
                                            {/* Domains panel */}
                                            <div className="col-md-6">
                                                <div className="font-weight-bold small text-uppercase text-muted mb-2">
                                                    <i className="bi bi-globe mr-1" />Custom Domains
                                                </div>
                                                {(app.domains?.length ?? 0) === 0 ? (
                                                    <p className="text-muted small mb-2">No custom domains. Apps are accessible via the main portal.</p>
                                                ) : (
                                                    <div className="mb-2">
                                                        {app.domains!.map((d: AppDomain) => (
                                                            <div key={d.id} className="d-flex align-items-center justify-content-between mb-1 p-2 bg-white rounded border">
                                                                <div>
                                                                    <code style={{ fontSize: "0.82rem" }}>{d.hostname}</code>
                                                                    {d.isPrimary && <span className="badge badge-primary ml-1" style={{ fontSize: "0.7rem" }}>Primary</span>}
                                                                    <span className={`badge badge-${d.sslStatus === "provisioned" ? "success" : d.sslStatus === "failed" ? "danger" : "warning"} ml-1`}
                                                                        style={{ fontSize: "0.7rem" }}>
                                                                        {d.sslStatus}
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex" style={{ gap: "0.25rem" }}>
                                                                    {d.sslStatus === "pending" && (
                                                                        <button className="btn btn-xs btn-outline-success py-0 px-1" style={{ fontSize: "0.75rem" }}
                                                                            onClick={() => handleVerifyDomain(app.id, d.id)} disabled={busy}>
                                                                            Verify
                                                                        </button>
                                                                    )}
                                                                    <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: "0.75rem" }}
                                                                        onClick={() => handleDeleteDomain(app.id, d.id)} disabled={busy}>
                                                                        <i className="bi bi-x" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="d-flex" style={{ gap: "0.5rem" }}>
                                                    <input type="text" className="form-control form-control-sm" placeholder="ems.cityofacme.gov"
                                                        value={domainHostname} onChange={e => setDomainHostname(e.target.value)}
                                                        style={{ fontFamily: "monospace" }} />
                                                    <div className="form-check form-check-inline mb-0 align-items-center d-flex">
                                                        <input type="checkbox" className="form-check-input" id="dom-primary"
                                                            checked={domainPrimary} onChange={e => setDomainPrimary(e.target.checked)} />
                                                        <label className="form-check-label small" htmlFor="dom-primary">Primary</label>
                                                    </div>
                                                    <button className="btn btn-sm btn-success" style={{ whiteSpace: "nowrap" }}
                                                        onClick={() => handleAddDomain(app.id)} disabled={busy || !domainHostname.trim()}>
                                                        <i className="bi bi-plus mr-1" />Add
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Links panel */}
                                            <div className="col-md-6">
                                                <div className="font-weight-bold small text-uppercase text-muted mb-2">
                                                    <i className="bi bi-link-45deg mr-1" />Linked Apps
                                                </div>
                                                {(app.outboundLinks?.length ?? 0) === 0 ? (
                                                    <p className="text-muted small mb-2">No linked apps.</p>
                                                ) : (
                                                    <div className="mb-2">
                                                        {app.outboundLinks!.map((l: AppLink) => (
                                                            <div key={l.id} className="d-flex align-items-center justify-content-between mb-1 p-2 bg-white rounded border">
                                                                <div>
                                                                    <span className="badge badge-info mr-1" style={{ fontSize: "0.7rem" }}>
                                                                        {LINK_TYPE_LABELS[l.linkType] ?? l.linkType}
                                                                    </span>
                                                                    <span style={{ fontSize: "0.85rem" }}>
                                                                        {l.target ? (
                                                                            <span>
                                                                                <i className={`bi ${l.target.iconClass} mr-1`} style={{ color: l.target.primaryColor }} />
                                                                                {l.target.displayName}
                                                                            </span>
                                                                        ) : l.targetMicroAppId}
                                                                    </span>
                                                                    {l.label && <small className="text-muted ml-1">— {l.label}</small>}
                                                                </div>
                                                                <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: "0.75rem" }}
                                                                    onClick={() => handleDeleteLink(app.id, l.id)} disabled={busy}>
                                                                    <i className="bi bi-x" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="d-flex flex-wrap" style={{ gap: "0.5rem" }}>
                                                    <select className="form-control form-control-sm" style={{ flex: "1 1 130px" }}
                                                        value={linkTargetId} onChange={e => setLinkTargetId(e.target.value)}>
                                                        <option value="">— Target App —</option>
                                                        {apps.filter(a => a.id !== app.id).map(a => (
                                                            <option key={a.id} value={a.id}>{a.displayName}</option>
                                                        ))}
                                                    </select>
                                                    <select className="form-control form-control-sm" style={{ flex: "0 0 140px" }}
                                                        value={linkType} onChange={e => setLinkType(e.target.value)}>
                                                        <option value="related">Related</option>
                                                        <option value="child">Child</option>
                                                        <option value="data-feed">Data Feed</option>
                                                        <option value="workflow-handoff">Workflow Handoff</option>
                                                    </select>
                                                    <input type="text" className="form-control form-control-sm" placeholder="Label (optional)"
                                                        style={{ flex: "1 1 120px" }} value={linkLabel} onChange={e => setLinkLabel(e.target.value)} />
                                                    <button className="btn btn-sm btn-info" onClick={() => handleAddLink(app.id)}
                                                        disabled={busy || !linkTargetId}>
                                                        <i className="bi bi-link-45deg mr-1" />Link
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Process steps read-only */}
                                        {app.process && app.process.steps.length > 0 && (
                                            <div className="mt-3">
                                                <div className="font-weight-bold small text-uppercase text-muted mb-2">
                                                    <i className="bi bi-diagram-3 mr-1" />Workflow Steps
                                                </div>
                                                <div className="d-flex flex-wrap" style={{ gap: "0.4rem" }}>
                                                    {[...app.process.steps]
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((s, i) => (
                                                            <span key={s.id} className="badge badge-light border" style={{ fontSize: "0.78rem" }}>
                                                                <span className="mr-1" style={{ color: app.accentColor }}>{i + 1}.</span>
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
