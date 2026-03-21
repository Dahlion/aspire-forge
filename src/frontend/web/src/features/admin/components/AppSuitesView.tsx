import { useEffect, useState } from "react";
import type { AppSuite, MicroApp } from "../../../types/microapp";
import type { TenantSummary } from "../../../types/admin";
import { getAppSuites, createAppSuite, updateAppSuite, deleteAppSuite, getTenants } from "../api";

export function AppSuitesView() {
    const [suites, setSuites]     = useState<AppSuite[]>([]);
    const [tenants, setTenants]   = useState<TenantSummary[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [busy, setBusy]         = useState(false);

    const [filterTenant, setFilterTenant] = useState("");
    const [expandedId, setExpandedId]     = useState<string | null>(null);

    // Create form
    const [showCreate, setShowCreate]         = useState(false);
    const [newTenantId, setNewTenantId]       = useState("");
    const [newName, setNewName]               = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newIcon, setNewIcon]               = useState("bi-grid-fill");
    const [newColor, setNewColor]             = useState("#2F4F4F");

    // Edit state
    const [editId, setEditId]               = useState<string | null>(null);
    const [editName, setEditName]           = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editIcon, setEditIcon]           = useState("");
    const [editColor, setEditColor]         = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const [suitesData, tenantsData] = await Promise.all([
                getAppSuites(filterTenant || undefined),
                getTenants(),
            ]);
            setSuites(suitesData);
            setTenants(tenantsData);
        } catch {
            setError("Failed to load suites.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filterTenant]);

    const handleCreate = async () => {
        if (!newTenantId || !newName.trim()) return;
        setBusy(true);
        try {
            await createAppSuite({
                tenantId: newTenantId,
                name: newName.trim(),
                description: newDescription || undefined,
                iconClass: newIcon,
                color: newColor,
            });
            setShowCreate(false);
            setNewTenantId(""); setNewName(""); setNewDescription("");
            setNewIcon("bi-grid-fill"); setNewColor("#2F4F4F");
            await load();
        } catch {
            setError("Failed to create suite.");
        } finally {
            setBusy(false);
        }
    };

    const startEdit = (s: AppSuite) => {
        setEditId(s.id);
        setEditName(s.name);
        setEditDescription(s.description ?? "");
        setEditIcon(s.iconClass);
        setEditColor(s.color);
    };

    const handleUpdate = async (suite: AppSuite) => {
        setBusy(true);
        try {
            await updateAppSuite(suite.id, {
                tenantId: suite.tenantId,
                name: editName.trim(),
                description: editDescription || undefined,
                iconClass: editIcon,
                color: editColor,
            });
            setEditId(null);
            await load();
        } catch {
            setError("Failed to update suite.");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (suite: AppSuite) => {
        if (!window.confirm(`Delete suite "${suite.name}"? Apps will be unlinked but not deleted.`)) return;
        setBusy(true);
        try {
            await deleteAppSuite(suite.id);
            if (expandedId === suite.id) setExpandedId(null);
            await load();
        } catch {
            setError("Failed to delete suite.");
        } finally {
            setBusy(false);
        }
    };

    const tenantName = (id: string) => tenants.find(t => t.id === id)?.name ?? id;

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="font-weight-bold mb-1">
                        <i className="bi bi-collection-fill mr-2" style={{ color: "#2F4F4F" }} />
                        App Suites
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                        Group related micro apps into suites shown as sections in the client portal.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)} disabled={busy}>
                    <i className="bi bi-plus-circle-fill mr-1" />{showCreate ? "Cancel" : "New Suite"}
                </button>
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
                        <i className="bi bi-plus-circle-fill mr-2" />New App Suite
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
                                    <label className="form-label small font-weight-bold">Suite Name *</label>
                                    <input type="text" className="form-control form-control-sm" placeholder="e.g. EMS Operations"
                                        value={newName} onChange={e => setNewName(e.target.value)} />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Description</label>
                                    <textarea className="form-control form-control-sm" rows={2}
                                        value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Icon Class</label>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <span style={{ fontSize: "1.4rem", color: newColor }}><i className={`bi ${newIcon}`} /></span>
                                        <input type="text" className="form-control form-control-sm" value={newIcon}
                                            onChange={e => setNewIcon(e.target.value)} style={{ fontFamily: "monospace" }} />
                                    </div>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small font-weight-bold">Color</label>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <input type="color" className="form-control form-control-sm" style={{ width: 48, height: 34, padding: 2 }}
                                            value={newColor} onChange={e => setNewColor(e.target.value)} />
                                        <input type="text" className="form-control form-control-sm" value={newColor}
                                            onChange={e => setNewColor(e.target.value)} style={{ fontFamily: "monospace" }} />
                                    </div>
                                </div>
                                {/* Preview */}
                                <div className="p-2 rounded" style={{ background: newColor, color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <i className={`bi ${newIcon}`} style={{ fontSize: "1.4rem" }} />
                                    <span className="font-weight-bold">{newName || "Suite Name"}</span>
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm mt-1" onClick={handleCreate}
                            disabled={busy || !newTenantId || !newName.trim()}>
                            {busy ? <span className="spinner-border spinner-border-sm mr-1" /> : <i className="bi bi-check-circle mr-1" />}
                            Create Suite
                        </button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="card shadow-sm mb-3">
                <div className="card-body py-2 px-3 d-flex align-items-center" style={{ gap: "1rem" }}>
                    <select className="form-control form-control-sm" style={{ maxWidth: 240 }}
                        value={filterTenant} onChange={e => setFilterTenant(e.target.value)}>
                        <option value="">All Tenants</option>
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <span className="text-muted small ml-auto">{suites.length} suite{suites.length !== 1 ? "s" : ""}</span>
                </div>
            </div>

            {/* Suite list */}
            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : suites.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-collection d-block mb-3" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                        <p className="mb-0">No suites yet.</p>
                        <small>Create a suite, then assign micro apps to it from the Micro Apps view.</small>
                    </div>
                </div>
            ) : (
                <div className="d-flex flex-column" style={{ gap: "0.75rem" }}>
                    {suites.map(suite => {
                        const isExpanded = expandedId === suite.id;
                        const isEditing  = editId === suite.id;
                        return (
                            <div key={suite.id} className="card shadow-sm border-0"
                                style={{ borderLeft: `4px solid ${suite.color}` }}>
                                <div className="card-body py-3 px-3">
                                    {isEditing ? (
                                        /* Edit inline */
                                        <div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group mb-2">
                                                        <label className="form-label small font-weight-bold">Name</label>
                                                        <input type="text" className="form-control form-control-sm"
                                                            value={editName} onChange={e => setEditName(e.target.value)} />
                                                    </div>
                                                    <div className="form-group mb-2">
                                                        <label className="form-label small font-weight-bold">Description</label>
                                                        <input type="text" className="form-control form-control-sm"
                                                            value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group mb-2">
                                                        <label className="form-label small font-weight-bold">Icon</label>
                                                        <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                                            <span style={{ color: editColor }}><i className={`bi ${editIcon}`} /></span>
                                                            <input type="text" className="form-control form-control-sm"
                                                                value={editIcon} onChange={e => setEditIcon(e.target.value)} style={{ fontFamily: "monospace" }} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group mb-2">
                                                        <label className="form-label small font-weight-bold">Color</label>
                                                        <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                                            <input type="color" style={{ width: 36, height: 30, padding: 2, border: "1px solid #ccc" }}
                                                                value={editColor} onChange={e => setEditColor(e.target.value)} />
                                                            <input type="text" className="form-control form-control-sm"
                                                                value={editColor} onChange={e => setEditColor(e.target.value)} style={{ fontFamily: "monospace" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="d-flex" style={{ gap: "0.5rem" }}>
                                                <button className="btn btn-sm btn-success" onClick={() => handleUpdate(suite)} disabled={busy || !editName.trim()}>
                                                    <i className="bi bi-check-circle mr-1" />Save
                                                </button>
                                                <button className="btn btn-sm btn-light" onClick={() => setEditId(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Display row */
                                        <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: "0.5rem" }}>
                                            <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                                                <div className="d-flex align-items-center justify-content-center rounded"
                                                    style={{ width: 40, height: 40, background: suite.color, color: "#fff", fontSize: "1.2rem", flexShrink: 0 }}>
                                                    <i className={`bi ${suite.iconClass}`} />
                                                </div>
                                                <div>
                                                    <div className="font-weight-bold" style={{ fontSize: "0.95rem" }}>{suite.name}</div>
                                                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                                                        <i className="bi bi-building mr-1" />{tenantName(suite.tenantId)}
                                                        <span className="ml-2">
                                                            <i className="bi bi-grid mr-1" />{suite.microApps?.length ?? 0} apps
                                                        </span>
                                                    </div>
                                                    {suite.description && (
                                                        <div className="text-muted" style={{ fontSize: "0.82rem" }}>{suite.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                                <button className="btn btn-sm btn-light" onClick={() => setExpandedId(isExpanded ? null : suite.id)}>
                                                    <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`} />
                                                </button>
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(suite)} disabled={busy}>
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(suite)} disabled={busy}>
                                                    <i className="bi bi-trash" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Expanded: member apps */}
                                {isExpanded && !isEditing && (
                                    <div className="card-footer bg-light text-dark px-3 py-2">
                                        <div className="small font-weight-bold text-uppercase text-muted mb-2">
                                            <i className="bi bi-grid-fill mr-1" />Member Apps
                                        </div>
                                        {(suite.microApps?.length ?? 0) === 0 ? (
                                            <p className="text-muted small mb-0">
                                                No apps in this suite yet. Assign apps from the Micro Apps view.
                                            </p>
                                        ) : (
                                            <div className="d-flex flex-wrap" style={{ gap: "0.5rem" }}>
                                                {suite.microApps!.map((app: MicroApp) => (
                                                    <div key={app.id} className="d-flex align-items-center p-2 bg-white rounded border"
                                                        style={{ gap: "0.5rem", fontSize: "0.85rem" }}>
                                                        <span style={{ color: app.primaryColor }}>
                                                            <i className={`bi ${app.iconClass}`} />
                                                        </span>
                                                        <span>{app.displayName}</span>
                                                        <span className={`badge badge-${app.status === "active" ? "success" : "secondary"}`} style={{ fontSize: "0.7rem" }}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                ))}
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
