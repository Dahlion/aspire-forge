import { useEffect, useState } from "react";
import type { WorkflowDeployment } from "../../types/workflow";

interface Props {
    username: string;
    tenantId: string | null;
    logout: () => void;
}

export function ClientPortal({ username, tenantId, logout }: Props) {
    const [deployments, setDeployments] = useState<WorkflowDeployment[]>([]);
    const [loading, setLoading]         = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const url = tenantId
                    ? `/api/workflow/deployments?tenantId=${tenantId}`
                    : "/api/workflow/deployments";
                const res = await fetch(url);
                if (res.ok) setDeployments(await res.json());
            } catch { /* non-fatal */ }
            finally { setLoading(false); }
        };
        load();
    }, [tenantId]);

    return (
        <div className="container-xl px-4 pb-5">
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
                            Your apps are ready below.
                        </p>
                    </div>
                    <button className="btn btn-outline-light btn-sm" onClick={logout}>
                        <i className="bi bi-box-arrow-right mr-1" />Sign Out
                    </button>
                </div>
            </div>

            {/* App Launcher */}
            <h5 className="font-weight-bold mb-3">
                <i className="bi bi-grid-fill mr-2" style={{ color: "#2E8B57" }} />
                Your Apps
            </h5>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-success" /></div>
            ) : deployments.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-grid d-block mb-3" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                        <p className="mb-0">No apps have been deployed to your account yet.</p>
                        <small>Contact your administrator to get started.</small>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {deployments.map(dep => {
                        const p = dep.process;
                        if (!p) return null;
                        const slug = p.appSlug ?? p.id;
                        return (
                            <div key={dep.id} className="col-md-4 mb-4">
                                <div
                                    className="card border-0 shadow-sm h-100"
                                    style={{ borderRadius: 10, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                                    onClick={() => { window.location.hash = `/client/app/${slug}`; }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                                >
                                    <div
                                        className="card-header border-0 d-flex align-items-center"
                                        style={{ background: p.primaryColor, borderRadius: "10px 10px 0 0", padding: "1rem 1.25rem", gap: "0.75rem" }}
                                    >
                                        <div
                                            className="d-flex align-items-center justify-content-center rounded"
                                            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "1.2rem" }}
                                        >
                                            <i className={`bi ${p.iconClass}`} />
                                        </div>
                                        <h5 className="mb-0 font-weight-bold text-white">{p.name}</h5>
                                    </div>
                                    <div className="card-body">
                                        {p.description && (
                                            <p className="text-muted mb-3" style={{ fontSize: "0.88rem" }}>{p.description}</p>
                                        )}
                                        <div className="d-flex justify-content-between align-items-center">
                                            <small className="text-muted">
                                                <i className="bi bi-list-ol mr-1" />{p.steps.length} stages
                                            </small>
                                            <span
                                                className="btn btn-sm font-weight-bold"
                                                style={{ background: p.accentColor, color: "#fff", border: "none", borderRadius: 6 }}
                                            >
                                                Open <i className="bi bi-arrow-right ml-1" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
