import { useEffect, useState } from "react";
import type { WorkflowProcess, WorkflowDeployment } from "../../../types/workflow";

type Tenant = { id: string; name: string; slug: string; isActive: boolean };

type Props = {
    process: WorkflowProcess;
    onClose: () => void;
};

export function DeployModal({ process, onClose }: Props) {
    const [tenants, setTenants]         = useState<Tenant[]>([]);
    const [deployments, setDeployments] = useState<WorkflowDeployment[]>([]);
    const [loading, setLoading]         = useState(true);
    const [busy, setBusy]               = useState<string | null>(null); // tenantId being toggled

    const deployedTenantIds = new Set(deployments.map(d => d.tenantId));

    useEffect(() => {
        const load = async () => {
            const [tenantsRes, deploymentsRes] = await Promise.all([
                fetch("/api/admin/tenants"),
                fetch(`/api/workflow/deployments?processId=${process.id}`),
            ]);
            if (tenantsRes.ok)     setTenants(await tenantsRes.json());
            if (deploymentsRes.ok) setDeployments(await deploymentsRes.json());
            setLoading(false);
        };
        load();
    }, [process.id]);

    const toggle = async (tenant: Tenant) => {
        setBusy(tenant.id);
        try {
            const existing = deployments.find(d => d.tenantId === tenant.id);
            if (existing) {
                // Undeploy
                const res = await fetch(`/api/workflow/deployments/${existing.id}`, { method: "DELETE" });
                if (res.ok) setDeployments(prev => prev.filter(d => d.id !== existing.id));
            } else {
                // Deploy
                const res = await fetch("/api/workflow/deployments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workflowProcessId: process.id, tenantId: tenant.id }),
                });
                if (res.ok) {
                    const deployment: WorkflowDeployment = await res.json();
                    setDeployments(prev => [...prev, deployment]);
                }
            }
        } finally {
            setBusy(null);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1040 }}
                onClick={onClose}
            />

            {/* Modal */}
            <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(560px, 96vw)",
                backgroundColor: "#0d1720",
                backgroundImage: "linear-gradient(0deg, rgba(150, 190, 170, 0.18) 0%, #0d1720 100%)",
                border: "1px solid rgba(255, 255, 255, 0.95)",
                borderRadius: 16,
                overflow: "hidden",
                zIndex: 1050,
                boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                color: "#f3f7f5",
                display: "flex",
                flexDirection: "column",
                maxHeight: "80vh",
            }}>
                {/* Header */}
                <div
                    className="d-flex align-items-center justify-content-between p-3"
                    style={{
                        background: "linear-gradient(180deg, #3f8b79 0%, #2f6f62 100%)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.95)",
                    }}
                >
                    <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                        <div>
                            <h5 className="mb-0 font-weight-bold d-flex align-items-center" style={{ gap: "0.6rem", color: "#f3f7f5" }}>
                                <img src="/seacoastlogo.png" alt="Seacoast" style={{ width: 26, height: 26, objectFit: "contain" }} />
                                <span>Deploy "{process.name}"</span>
                            </h5>
                            <small className="text-muted">Toggle access per tenant</small>
                        </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Body */}
                <div
                    className="overflow-auto flex-grow-1 p-3"
                    style={{
                        backgroundColor: "#0d1720",
                        backgroundImage: "linear-gradient(0deg, rgba(150, 190, 170, 0.18) 0%, #0d1720 100%)",
                    }}
                >
                    {loading ? (
                        <div className="text-center py-4"><div className="spinner-border text-primary spinner-border-sm" /></div>
                    ) : tenants.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-building d-block mb-2" style={{ fontSize: "2rem", opacity: 0.3 }} />
                            No tenants found. Create tenants first.
                        </div>
                    ) : (
                        tenants.map(tenant => {
                            const isDeployed = deployedTenantIds.has(tenant.id);
                            const isBusy     = busy === tenant.id;
                            return (
                                <div
                                    key={tenant.id}
                                    className="d-flex align-items-center justify-content-between p-3 rounded mb-2"
                                    style={{
                                        background: isDeployed ? "rgba(63, 139, 121, 0.2)" : "rgba(13, 23, 32, 0.55)",
                                        border: `1px solid ${isDeployed ? process.primaryColor : "rgba(255,255,255,0.95)"}`,
                                        transition:  "all 0.15s",
                                    }}
                                >
                                    <div>
                                        <div className="font-weight-bold" style={{ fontSize: "0.95rem" }}>{tenant.name}</div>
                                        <small className="text-muted">/{tenant.slug}</small>
                                    </div>
                                    <button
                                        className={`btn btn-sm font-weight-bold ${isDeployed ? "btn-danger" : "btn-success"}`}
                                        style={{ minWidth: 100 }}
                                        onClick={() => toggle(tenant)}
                                        disabled={isBusy}
                                    >
                                        {isBusy ? (
                                            <span className="spinner-border spinner-border-sm" />
                                        ) : isDeployed ? (
                                            <><i className="bi bi-cloud-slash mr-1" />Undeploy</>
                                        ) : (
                                            <><i className="bi bi-cloud-upload mr-1" />Deploy</>
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div
                    className="p-3 border-top d-flex flex-column align-items-center"
                    style={{
                        background: "linear-gradient(180deg, #3f8b79 0%, #2f6f62 100%)",
                        borderTop: "1px solid rgba(255, 255, 255, 0.95)",
                        gap: "0.75rem",
                    }}
                >
                    <small className="text-muted">
                        <i className="bi bi-check2-circle mr-1 text-success" />
                        {deployments.length} tenant{deployments.length !== 1 ? "s" : ""} have access
                    </small>
                    <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Done</button>
                </div>
            </div>
        </>
    );
}
