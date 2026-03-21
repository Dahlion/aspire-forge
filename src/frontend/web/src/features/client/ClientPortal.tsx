import { useEffect, useState } from "react";
import type { MicroApp, AppSuite } from "../../types/microapp";

interface Props {
    username: string;
    tenantId: string | null;
    logout: () => void;
}

interface SuiteGroup {
    suite: AppSuite | null;   // null = ungrouped
    apps: MicroApp[];
}

export function ClientPortal({ username, tenantId, logout }: Props) {
    const [groups, setGroups]   = useState<SuiteGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [appsRes, suitesRes] = await Promise.all([
                    fetch(tenantId ? `/api/microapps?tenantId=${tenantId}&status=active` : "/api/microapps?status=active"),
                    fetch(tenantId ? `/api/appsuites?tenantId=${tenantId}` : "/api/appsuites"),
                ]);

                const apps: MicroApp[]   = appsRes.ok   ? await appsRes.json()   : [];
                const suites: AppSuite[] = suitesRes.ok ? await suitesRes.json() : [];

                // Build groups: suites (sorted by sortOrder) then ungrouped
                const result: SuiteGroup[] = suites
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(suite => ({
                        suite,
                        apps: apps.filter(a => a.appSuiteId === suite.id),
                    }))
                    .filter(g => g.apps.length > 0);

                const ungrouped = apps.filter(a => !a.appSuiteId);
                if (ungrouped.length > 0) result.push({ suite: null, apps: ungrouped });

                setGroups(result);
            } catch { /* non-fatal */ }
            finally { setLoading(false); }
        };
        load();
    }, [tenantId]);

    const totalApps = groups.reduce((sum, g) => sum + g.apps.length, 0);

    return (
        <div className="container-xl px-4 pt-4 pb-5">
            {/* Welcome banner */}
            <div
                className="card border-0 shadow-sm mb-4"
                style={{ background: "linear-gradient(135deg, #2E8B57, #1d6b40)", borderRadius: 10 }}
            >
                <div className="card-body p-4 text-white d-flex align-items-center justify-content-between flex-wrap" style={{ gap: "1rem" }}>
                    <div>
                        <h4 className="font-weight-bold mb-1">
                            <i className="bi bi-person-circle mr-2" />
                            Welcome back{username && username !== "unknown" ? `, ${username}` : ""}!
                        </h4>
                        <p className="mb-0" style={{ color: "#c8e6d6", fontSize: "0.95rem" }}>
                            {totalApps > 0
                                ? `${totalApps} app${totalApps !== 1 ? "s" : ""} available across ${groups.length} section${groups.length !== 1 ? "s" : ""}.`
                                : "Your apps are ready below."}
                        </p>
                    </div>
                    <button className="btn btn-outline-light btn-sm" onClick={logout}>
                        <i className="bi bi-box-arrow-right mr-1" />Sign Out
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-success" /></div>
            ) : totalApps === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-grid d-block mb-3" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                        <p className="mb-0">No apps have been deployed to your account yet.</p>
                        <small>Contact your administrator to get started.</small>
                    </div>
                </div>
            ) : (
                groups.map((group, gi) => (
                    <div key={gi} className="mb-5">
                        {/* Section header */}
                        {group.suite ? (
                            <div className="d-flex align-items-center mb-3" style={{ gap: "0.75rem" }}>
                                <div className="d-flex align-items-center justify-content-center rounded"
                                    style={{ width: 36, height: 36, background: group.suite.color, color: "#fff", fontSize: "1rem" }}>
                                    <i className={`bi ${group.suite.iconClass}`} />
                                </div>
                                <div>
                                    <h5 className="font-weight-bold mb-0">{group.suite.name}</h5>
                                    {group.suite.description && (
                                        <small className="text-muted">{group.suite.description}</small>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <h5 className="font-weight-bold mb-3">
                                <i className="bi bi-grid-fill mr-2" style={{ color: "#2E8B57" }} />
                                Apps
                            </h5>
                        )}

                        {/* App cards */}
                        <div className="row">
                            {group.apps.map(app => (
                                <AppCard key={app.id} app={app} />
                            ))}
                        </div>

                        {/* Linked apps callout */}
                        <LinkedAppsCallout apps={group.apps} allGroups={groups} />
                    </div>
                ))
            )}
        </div>
    );
}

// ── App Card ──────────────────────────────────────────────────────────────────

function AppCard({ app }: { app: MicroApp }) {
    const stepCount = app.process?.steps.length ?? 0;
    const domain    = app.domains?.find(d => d.isPrimary) ?? app.domains?.[0];

    const handleOpen = () => {
        if (domain && domain.sslStatus === "provisioned") {
            window.open(`https://${domain.hostname}`, "_blank");
        } else {
            window.location.hash = `/client/app/${app.slug}`;
        }
    };

    return (
        <div className="col-md-4 mb-4">
            <div
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: 10, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                onClick={handleOpen}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
            >
                <div
                    className="card-header border-0 d-flex align-items-center"
                    style={{ background: app.primaryColor, borderRadius: "10px 10px 0 0", padding: "1rem 1.25rem", gap: "0.75rem" }}
                >
                    <div
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "1.2rem" }}
                    >
                        <i className={`bi ${app.iconClass}`} />
                    </div>
                    <h5 className="mb-0 font-weight-bold text-white">{app.displayName}</h5>
                </div>
                <div className="card-body">
                    {app.description && (
                        <p className="text-muted mb-3" style={{ fontSize: "0.88rem" }}>{app.description}</p>
                    )}
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex flex-column" style={{ gap: "0.2rem" }}>
                            {stepCount > 0 && (
                                <small className="text-muted">
                                    <i className="bi bi-list-ol mr-1" />{stepCount} stages
                                </small>
                            )}
                            {domain && (
                                <small className={`text-${domain.sslStatus === "provisioned" ? "success" : "muted"}`}>
                                    <i className="bi bi-globe mr-1" />{domain.hostname}
                                </small>
                            )}
                        </div>
                        <span
                            className="btn btn-sm font-weight-bold"
                            style={{ background: app.accentColor, color: "#fff", border: "none", borderRadius: 6 }}
                        >
                            Open <i className="bi bi-arrow-right ml-1" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Linked Apps Callout ───────────────────────────────────────────────────────
// Shows workflow-handoff links at the bottom of a suite section so users know
// which apps can be continued into.

function LinkedAppsCallout({ apps, allGroups }: { apps: MicroApp[]; allGroups: SuiteGroup[] }) {
    const handoffs = apps.flatMap(app =>
        (app.outboundLinks ?? [])
            .filter(l => l.linkType === "workflow-handoff" && l.target)
            .map(l => ({ source: app, link: l }))
    );

    if (handoffs.length === 0) return null;

    const allApps = allGroups.flatMap(g => g.apps);

    return (
        <div className="mt-1">
            {handoffs.map(({ source, link }) => {
                const targetApp = allApps.find(a => a.id === link.targetMicroAppId);
                if (!targetApp) return null;
                return (
                    <div
                        key={link.id}
                        className="d-flex align-items-center p-2 rounded border mb-1"
                        style={{ background: "#f8f9fa", fontSize: "0.85rem", gap: "0.5rem" }}
                    >
                        <i className={`bi ${source.iconClass}`} style={{ color: source.primaryColor }} />
                        <span className="text-muted">{source.displayName}</span>
                        <i className="bi bi-arrow-right text-muted" />
                        <i className={`bi ${targetApp.iconClass}`} style={{ color: targetApp.primaryColor }} />
                        <span
                            className="font-weight-medium"
                            style={{ cursor: "pointer", color: targetApp.primaryColor }}
                            onClick={() => { window.location.hash = `/client/app/${targetApp.slug}`; }}
                        >
                            {link.label ?? targetApp.displayName}
                        </span>
                        <span className="badge badge-light border ml-1" style={{ fontSize: "0.7rem" }}>handoff</span>
                    </div>
                );
            })}
        </div>
    );
}
