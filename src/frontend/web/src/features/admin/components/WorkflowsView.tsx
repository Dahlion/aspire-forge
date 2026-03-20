import { useEffect, useState } from "react";
import { WorkflowKanban } from "../../workflow/components/WorkflowKanban";
import type { WorkflowProcess, WorkflowInstance } from "../../../types/workflow";

export function WorkflowsView() {
    const [processes, setProcesses] = useState<WorkflowProcess[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<WorkflowProcess | null>(null);
    const [instances, setInstances] = useState<WorkflowInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProcesses = async () => {
        try {
            const res = await fetch("/api/workflow/processes");
            if (res.ok) {
                const data: WorkflowProcess[] = await res.json();
                setProcesses(data);
                if (data.length > 0) setSelectedProcess(prev => prev ? (data.find(p => p.id === prev.id) ?? data[0]) : data[0]);
            } else {
                setError("Failed to load workflow processes.");
            }
        } catch {
            setError("Connection error while fetching workflows.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProcesses(); }, []);

    useEffect(() => {
        if (!selectedProcess) return;
        const fetchInstances = async () => {
            try {
                const res = await fetch(`/api/workflow/instances?processId=${selectedProcess.id}`);
                if (res.ok) setInstances(await res.json());
            } catch (err) {
                console.error("Failed to fetch workflow instances", err);
            }
        };
        fetchInstances();
    }, [selectedProcess]);

    const handleMove = async (instanceId: string, targetStepId: string) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/workflow/instances/${instanceId}/move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStepId, comments: "Moved via Admin Kanban" })
            });
            if (res.ok) {
                const updated: WorkflowInstance = await res.json();
                setInstances(prev => prev.map(i => i.id === updated.id ? updated : i));
            }
        } finally {
            setBusy(false);
        }
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await fetch("/api/workflow/seed", { method: "POST" });
            if (res.ok) {
                await fetchProcesses();
            }
        } finally {
            setSeeding(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
    if (error) return <div className="alert alert-warning">{error}</div>;

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                    {selectedProcess && (
                        <div
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{
                                width: 40, height: 40,
                                background: selectedProcess.primaryColor,
                                color: "#fff",
                                fontSize: "1.1rem",
                                flexShrink: 0
                            }}
                        >
                            <i className={`bi ${selectedProcess.iconClass}`} />
                        </div>
                    )}
                    <div>
                        <h4 className="mb-0">
                            {selectedProcess?.name ?? "Workflows"}
                        </h4>
                        {selectedProcess?.description && (
                            <small className="text-muted">{selectedProcess.description}</small>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                    {processes.length === 0 ? (
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleSeed}
                            disabled={seeding}
                        >
                            {seeding
                                ? <><span className="spinner-border spinner-border-sm mr-1" />Seeding…</>
                                : <><i className="bi bi-magic mr-1" />Load Demo Apps</>
                            }
                        </button>
                    ) : (
                        <>
                            <select
                                className="form-control form-control-sm"
                                value={selectedProcess?.id || ""}
                                onChange={e => setSelectedProcess(processes.find(p => p.id === e.target.value) ?? null)}
                                style={{ minWidth: "200px" }}
                            >
                                {processes.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>

            {/* App badges for quick switching */}
            {processes.length > 1 && (
                <div className="d-flex mb-3" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                    {processes.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            className="btn btn-sm d-flex align-items-center"
                            style={{
                                gap: "0.35rem",
                                background: selectedProcess?.id === p.id ? p.primaryColor : "transparent",
                                color: selectedProcess?.id === p.id ? "#fff" : p.primaryColor,
                                border: `2px solid ${p.primaryColor}`,
                                borderRadius: 20,
                                fontWeight: selectedProcess?.id === p.id ? 600 : 400
                            }}
                            onClick={() => setSelectedProcess(p)}
                        >
                            <i className={`bi ${p.iconClass}`} style={{ fontSize: "0.85rem" }} />
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {selectedProcess ? (
                <WorkflowKanban
                    process={selectedProcess}
                    instances={instances}
                    onMove={handleMove}
                    busy={busy}
                />
            ) : (
                <div className="card shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-diagram-3 d-block mb-3" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                        <h5>No Workflow Templates Found</h5>
                        <p className="small mb-3">Get started by loading the demo apps or creating a new workflow process.</p>
                        <button className="btn btn-primary btn-sm" onClick={handleSeed} disabled={seeding}>
                            {seeding
                                ? <><span className="spinner-border spinner-border-sm mr-1" />Seeding…</>
                                : <><i className="bi bi-magic mr-1" />Load Demo Apps</>
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
