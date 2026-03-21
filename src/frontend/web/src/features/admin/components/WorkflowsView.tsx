import { useEffect, useState } from "react";
import { WorkflowKanban } from "../../workflow/components/WorkflowKanban";
import { ProcessEditorDrawer } from "./ProcessEditorDrawer";
import { DeployModal } from "./DeployModal";
import type { WorkflowProcess, WorkflowInstance } from "../../../types/workflow";

export function WorkflowsView() {
    const [processes, setProcesses]       = useState<WorkflowProcess[]>([]);
    const [selected, setSelected]         = useState<WorkflowProcess | null>(null);
    const [instances, setInstances]       = useState<WorkflowInstance[]>([]);
    const [loading, setLoading]           = useState(true);
    const [busy, setBusy]                 = useState(false);
    const [seeding, setSeeding]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [editorTarget, setEditorTarget] = useState<WorkflowProcess | null | "new">(undefined as unknown as null);
    const [deployTarget, setDeployTarget] = useState<WorkflowProcess | null>(null);
    const [deletingId, setDeletingId]     = useState<string | null>(null);

    const fetchProcesses = async () => {
        try {
            const res = await fetch("/api/workflow/processes");
            if (res.ok) {
                const data: WorkflowProcess[] = await res.json();
                setProcesses(data);
                setSelected(prev =>
                    prev ? (data.find(p => p.id === prev.id) ?? data[0] ?? null) : (data[0] ?? null)
                );
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
        if (!selected) { setInstances([]); return; }
        const load = async () => {
            try {
                const res = await fetch(`/api/workflow/instances?processId=${selected.id}`);
                if (res.ok) setInstances(await res.json());
            } catch (err) {
                console.error("Failed to fetch instances", err);
            }
        };
        load();
    }, [selected]);

    const handleMove = async (instanceId: string, targetStepId: string) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/workflow/instances/${instanceId}/move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStepId, comments: "Moved via Admin Kanban" }),
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
            if (res.ok) await fetchProcesses();
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (p: WorkflowProcess) => {
        if (!confirm(`Delete "${p.name}"? This will also delete all instances.`)) return;
        setDeletingId(p.id);
        try {
            await fetch(`/api/workflow/processes/${p.id}`, { method: "DELETE" });
            await fetchProcesses();
            if (selected?.id === p.id) setSelected(null);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
    if (error)   return <div className="alert alert-warning">{error}</div>;

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0 font-weight-bold">App Builder</h4>
                    <small className="text-muted">Create workflows, define forms, and deploy apps to tenants.</small>
                </div>
                <div className="d-flex" style={{ gap: "0.5rem" }}>
                    {processes.length === 0 && (
                        <button className="btn btn-sm btn-outline-secondary" onClick={handleSeed} disabled={seeding}>
                            {seeding
                                ? <><span className="spinner-border spinner-border-sm mr-1" />Loading…</>
                                : <><i className="bi bi-magic mr-1" />Load Demo Apps</>
                            }
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-primary font-weight-bold"
                        onClick={() => setEditorTarget("new")}
                    >
                        <i className="bi bi-plus-lg mr-1" />New App
                    </button>
                </div>
            </div>

            <div className="row">
                {/* ── Left: Process list ── */}
                <div className="col-lg-4 mb-4">
                    {processes.length === 0 ? (
                        <div className="card shadow-sm border-0">
                            <div className="card-body text-center py-5 text-muted">
                                <i className="bi bi-diagram-3 d-block mb-3" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                                <p className="small mb-3">No apps yet. Create one or load the demos.</p>
                                <button className="btn btn-sm btn-primary" onClick={() => setEditorTarget("new")}>
                                    <i className="bi bi-plus-lg mr-1" />Create App
                                </button>
                            </div>
                        </div>
                    ) : (
                        processes.map(p => (
                            <div
                                key={p.id}
                                className="card shadow-sm border-0 mb-3"
                                style={{
                                    borderLeft: `4px solid ${p.primaryColor} !important`,
                                    cursor: "pointer",
                                    outline: selected?.id === p.id ? `2px solid ${p.primaryColor}` : "none",
                                    outlineOffset: 2,
                                }}
                                onClick={() => setSelected(p)}
                            >
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-start justify-content-between">
                                        <div className="d-flex align-items-center" style={{ gap: "0.65rem" }}>
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded"
                                                style={{ width: 36, height: 36, background: p.primaryColor, color: "#fff", flexShrink: 0 }}
                                            >
                                                <i className={`bi ${p.iconClass}`} />
                                            </div>
                                            <div>
                                                <div className="font-weight-bold" style={{ fontSize: "0.95rem" }}>{p.name}</div>
                                                {p.description && (
                                                    <small className="text-muted" style={{ fontSize: "0.78rem", lineClamp: 2 }}>{p.description}</small>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex mt-2" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
                                        <span className="badge badge-light text-dark" style={{ fontSize: "0.7rem" }}>
                                            <i className="bi bi-list-ol mr-1" />{p.steps.length} steps
                                        </span>
                                        {p.appSlug && (
                                            <span className="badge badge-light" style={{ fontSize: "0.7rem", fontFamily: "monospace" }}>
                                                /{p.appSlug}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action row */}
                                    <div className="d-flex mt-3 pt-2 border-top" style={{ gap: "0.4rem" }} onClick={e => e.stopPropagation()}>
                                        <button
                                            className="btn btn-xs btn-outline-secondary"
                                            style={{ fontSize: "0.75rem" }}
                                            onClick={() => setEditorTarget(p)}
                                            title="Edit process"
                                        >
                                            <i className="bi bi-pencil mr-1" />Edit
                                        </button>
                                        <button
                                            className="btn btn-xs btn-outline-primary font-weight-bold"
                                            style={{ fontSize: "0.75rem" }}
                                            onClick={() => setDeployTarget(p)}
                                            title="Manage deployment"
                                        >
                                            <i className="bi bi-cloud-upload mr-1" />Deploy
                                        </button>
                                        <button
                                            className="btn btn-xs btn-outline-danger ml-auto"
                                            style={{ fontSize: "0.75rem" }}
                                            onClick={() => handleDelete(p)}
                                            disabled={deletingId === p.id}
                                            title="Delete process"
                                        >
                                            {deletingId === p.id
                                                ? <span className="spinner-border spinner-border-sm" />
                                                : <i className="bi bi-trash" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Right: Kanban ── */}
                <div className="col-lg-8">
                    {selected ? (
                        <>
                            <div className="d-flex align-items-center mb-3" style={{ gap: "0.65rem" }}>
                                <div
                                    className="d-flex align-items-center justify-content-center rounded"
                                    style={{ width: 36, height: 36, background: selected.primaryColor, color: "#fff" }}
                                >
                                    <i className={`bi ${selected.iconClass}`} />
                                </div>
                                <div>
                                    <h5 className="mb-0 font-weight-bold">{selected.name}</h5>
                                    {selected.description && <small className="text-muted">{selected.description}</small>}
                                </div>
                            </div>
                            <WorkflowKanban
                                process={selected}
                                instances={instances}
                                onMove={handleMove}
                                busy={busy}
                            />
                        </>
                    ) : (
                        <div className="card shadow-sm border-0">
                            <div className="card-body text-center py-5 text-muted">
                                <i className="bi bi-arrow-left-circle d-block mb-2" style={{ fontSize: "2rem", opacity: 0.3 }} />
                                <p className="mb-0 small">Select an app on the left to view its kanban board.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Process Editor Drawer */}
            {(editorTarget === "new" || (editorTarget !== null && editorTarget !== undefined)) && (
                <ProcessEditorDrawer
                    process={editorTarget === "new" ? null : editorTarget}
                    onClose={() => setEditorTarget(undefined as unknown as null)}
                    onSaved={async () => {
                        setEditorTarget(undefined as unknown as null);
                        await fetchProcesses();
                    }}
                />
            )}

            {/* Deploy Modal */}
            {deployTarget && (
                <DeployModal
                    process={deployTarget}
                    onClose={() => setDeployTarget(null)}
                />
            )}
        </div>
    );
}
