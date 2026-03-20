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
                background: "#fff",
                borderRadius: 10,
                zIndex: 1050,
                boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                maxHeight: "80vh",
            }}>
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
                    <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                        <div
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{ width: 36, height: 36, background: process.primaryColor, color: "#fff" }}
                        >
                            <i className={`bi ${process.iconClass}`} />
                        </div>
                        <div>
                            <h5 className="mb-0 font-weight-bold">Deploy "{process.name}"</h5>
                            <small className="text-muted">Toggle access per tenant</small>
                        </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-auto flex-grow-1 p-3">
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
                                        background:  isDeployed ? `${process.primaryColor}12` : "#f8f9fa",
                                        border:      `1.5px solid ${isDeployed ? process.primaryColor : "#dee2e6"}`,
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
                <div className="p-4 border-top d-flex justify-content-between align-items-center">
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
