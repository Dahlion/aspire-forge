import { useEffect, useState } from "react";
import type { MicroApp, AppSuite } from "../../../types/microapp";
import type { SubscriptionPlan } from "../../../types/admin";
import { updateMicroApp, getPlans, getTenants } from "../api";
import type { TenantSummary } from "../../../types/admin";

type Tab = "apps" | "suites";

// ── Visibility badge ─────────────────────────────────────────────────────────
function VisiBadge({ label, on }: { label: string; on: boolean }) {
    return (
        <span className={`badge badge-${on ? "success" : "secondary"} mr-1`} style={{ fontSize: "0.72rem" }}>
            {label}
        </span>
    );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
let _toggleId = 0;
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    const [id] = useState(() => `toggle-${++_toggleId}`);
    return (
        <div className="custom-control custom-switch" style={{ display: "inline-block" }}>
            <input
                type="checkbox"
                className="custom-control-input"
                id={id}
                checked={checked}
                disabled={disabled}
                onChange={e => onChange(e.target.checked)}
            />
            <label className="custom-control-label" htmlFor={id} style={{ cursor: disabled ? "not-allowed" : "pointer" }} />
        </div>
    );
}

// ── Apps tab ─────────────────────────────────────────────────────────────────
function AppsTab({ plans }: { plans: SubscriptionPlan[] }) {
    const [apps, setApps]       = useState<MicroApp[]>([]);
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [filter, setFilter]   = useState("");
    const [busy, setBusy]       = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/microapps").then(r => r.ok ? r.json() : []),
            getTenants(),
        ]).then(([a, t]) => { setApps(a); setTenants(t as TenantSummary[]); }).finally(() => setLoading(false));
    }, []);

    const tenantName = (id: string) => tenants.find(t => t.id === id)?.name ?? id.slice(0, 8);

    const patch = async (app: MicroApp, changes: Partial<Pick<MicroApp, "isPublic" | "showInDashboard" | "requiredPlanSlug">>) => {
        setBusy(app.id);
        const updated: MicroApp = { ...app, ...changes };
        await updateMicroApp(app.id, {
            isPublic:        updated.isPublic,
            showInDashboard: updated.showInDashboard,
            requiredPlanSlug: updated.requiredPlanSlug ?? undefined,
        });
        setApps(prev => prev.map(a => a.id === app.id ? { ...a, ...changes } : a));
        setBusy(null);
    };

    const filtered = apps.filter(a =>
        !filter || a.displayName.toLowerCase().includes(filter.toLowerCase()) || tenantName(a.tenantId).toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div>;

    return (
        <div>
            <div className="d-flex align-items-center mb-3" style={{ gap: "0.5rem" }}>
                <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: 260 }}
                    placeholder="Filter by name or tenant…"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
                <small className="text-muted ml-auto">{filtered.length} app{filtered.length !== 1 ? "s" : ""}</small>
            </div>

            <div className="table-responsive">
                <table className="table table-sm table-hover mb-0">
                    <thead className="thead-light">
                        <tr>
                            <th>App</th>
                            <th>Tenant</th>
                            <th style={{ whiteSpace: "nowrap" }}>
                                <i className="bi bi-globe mr-1 text-info" title="Publicly listed" />Public
                            </th>
                            <th style={{ whiteSpace: "nowrap" }}>
                                <i className="bi bi-broadcast mr-1 text-success" title="Show in dashboard" />Dashboard
                            </th>
                            <th>Required Plan</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(app => (
                            <tr key={app.id} style={{ opacity: busy === app.id ? 0.5 : 1 }}>
                                <td>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <span style={{ color: app.primaryColor, fontSize: "1.1rem" }}>
                                            <i className={`bi ${app.iconClass}`} />
                                        </span>
                                        <div>
                                            <div className="font-weight-medium" style={{ fontSize: "0.88rem" }}>{app.displayName}</div>
                                            <small className="text-muted">/{app.slug}</small>
                                        </div>
                                    </div>
                                </td>
                                <td><small className="text-muted">{tenantName(app.tenantId)}</small></td>
                                <td>
                                    <Toggle
                                        checked={app.isPublic}
                                        disabled={busy === app.id}
                                        onChange={v => patch(app, { isPublic: v })}
                                    />
                                </td>
                                <td>
                                    <Toggle
                                        checked={app.showInDashboard}
                                        disabled={busy === app.id || !app.isPublic}
                                        onChange={v => patch(app, { showInDashboard: v })}
                                    />
                                    {!app.isPublic && <small className="text-muted ml-1">(public first)</small>}
                                </td>
                                <td>
                                    <select
                                        className="form-control form-control-sm"
                                        style={{ minWidth: 140 }}
                                        value={app.requiredPlanSlug ?? ""}
                                        disabled={busy === app.id}
                                        onChange={e => patch(app, { requiredPlanSlug: e.target.value || undefined })}
                                    >
                                        <option value="">— none —</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.slug}>{p.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <span className={`badge badge-${app.status === "active" ? "success" : "secondary"}`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className="text-center text-muted py-3">No apps found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <small className="text-muted d-block mt-2">
                <i className="bi bi-info-circle mr-1" />
                Manage app details (domains, branding, links) in <strong>App Designer → Micro Apps</strong>.
            </small>
        </div>
    );
}

// ── Suites tab ────────────────────────────────────────────────────────────────
function SuitesTab({ plans }: { plans: SubscriptionPlan[] }) {
    const [suites, setSuites]   = useState<AppSuite[]>([]);
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [filter, setFilter]   = useState("");
    const [busy, setBusy]       = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/appsuites").then(r => r.ok ? r.json() : []),
            getTenants(),
        ]).then(([s, t]) => { setSuites(s); setTenants(t as TenantSummary[]); }).finally(() => setLoading(false));
    }, []);

    const tenantName = (id: string) => tenants.find(t => t.id === id)?.name ?? id.slice(0, 8);

    const patch = async (suite: AppSuite, changes: Partial<Pick<AppSuite, "isPublic" | "showInDashboard" | "requiredPlanSlug">>) => {
        setBusy(suite.id);
        const updated: AppSuite = { ...suite, ...changes };
        await fetch(`/api/appsuites/${suite.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tenantId:        suite.tenantId,
                name:            suite.name,
                isPublic:        updated.isPublic,
                showInDashboard: updated.showInDashboard,
                requiredPlanSlug: updated.requiredPlanSlug,
            }),
        });
        setSuites(prev => prev.map(s => s.id === suite.id ? { ...s, ...changes } : s));
        setBusy(null);
    };

    const filtered = suites.filter(s =>
        !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || tenantName(s.tenantId).toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div>;

    return (
        <div>
            <div className="d-flex align-items-center mb-3" style={{ gap: "0.5rem" }}>
                <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: 260 }}
                    placeholder="Filter by name or tenant…"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
                <small className="text-muted ml-auto">{filtered.length} suite{filtered.length !== 1 ? "s" : ""}</small>
            </div>

            <div className="table-responsive">
                <table className="table table-sm table-hover mb-0">
                    <thead className="thead-light">
                        <tr>
                            <th>Suite</th>
                            <th>Tenant</th>
                            <th>Apps</th>
                            <th style={{ whiteSpace: "nowrap" }}>
                                <i className="bi bi-globe mr-1 text-info" />Public
                            </th>
                            <th style={{ whiteSpace: "nowrap" }}>
                                <i className="bi bi-broadcast mr-1 text-success" />Dashboard
                            </th>
                            <th>Required Plan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(suite => (
                            <tr key={suite.id} style={{ opacity: busy === suite.id ? 0.5 : 1 }}>
                                <td>
                                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                        <span style={{ color: suite.color, fontSize: "1.1rem" }}>
                                            <i className={`bi ${suite.iconClass}`} />
                                        </span>
                                        <div>
                                            <div className="font-weight-medium" style={{ fontSize: "0.88rem" }}>{suite.name}</div>
                                            <small className="text-muted">/{suite.slug}</small>
                                        </div>
                                    </div>
                                </td>
                                <td><small className="text-muted">{tenantName(suite.tenantId)}</small></td>
                                <td><span className="badge badge-light">{suite.microApps?.length ?? 0}</span></td>
                                <td>
                                    <Toggle
                                        checked={suite.isPublic}
                                        disabled={busy === suite.id}
                                        onChange={v => patch(suite, { isPublic: v })}
                                    />
                                </td>
                                <td>
                                    <Toggle
                                        checked={suite.showInDashboard}
                                        disabled={busy === suite.id || !suite.isPublic}
                                        onChange={v => patch(suite, { showInDashboard: v })}
                                    />
                                    {!suite.isPublic && <small className="text-muted ml-1">(public first)</small>}
                                </td>
                                <td>
                                    <select
                                        className="form-control form-control-sm"
                                        style={{ minWidth: 140 }}
                                        value={suite.requiredPlanSlug ?? ""}
                                        disabled={busy === suite.id}
                                        onChange={e => patch(suite, { requiredPlanSlug: e.target.value || undefined })}
                                    >
                                        <option value="">— none —</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.slug}>{p.name}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className="text-center text-muted py-3">No suites found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <small className="text-muted d-block mt-2">
                <i className="bi bi-info-circle mr-1" />
                Manage suite contents (add/remove apps) in <strong>App Designer → App Suites</strong>.
            </small>
        </div>
    );
}

// ── Main export ──────────────────────────────────────────────────────────────
export function AppManagerView() {
    const [tab, setTab]     = useState<Tab>("apps");
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

    useEffect(() => {
        getPlans().then(p => setPlans(p as SubscriptionPlan[])).catch(() => {});
    }, []);

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-boxes mr-2 text-primary" />
                        App Manager
                    </h4>
                    <small className="text-muted">
                        Control app visibility, dashboard display, and subscription requirements for all deployed apps and suites.
                    </small>
                </div>
            </div>

            {/* Legend */}
            <div className="alert alert-light border py-2 px-3 mb-3 d-flex flex-wrap" style={{ gap: "1rem", fontSize: "0.82rem" }}>
                <span><VisiBadge label="Public" on={true} /> Listed on the public landing page</span>
                <span><VisiBadge label="Dashboard" on={true} /> Shown in the public app feed (requires Public)</span>
                <span><i className="bi bi-lock-fill text-warning mr-1" />Required Plan gates tenant access</span>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${tab === "apps" ? "active" : ""}`} onClick={() => setTab("apps")}>
                        <i className="bi bi-grid-3x3-gap-fill mr-1" />Micro Apps
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "suites" ? "active" : ""}`} onClick={() => setTab("suites")}>
                        <i className="bi bi-collection-fill mr-1" />App Suites
                    </button>
                </li>
            </ul>

            {tab === "apps"   && <AppsTab  plans={plans} />}
            {tab === "suites" && <SuitesTab plans={plans} />}
        </div>
    );
}
