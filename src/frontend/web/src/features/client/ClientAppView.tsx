import { useEffect, useState } from "react";
import { WorkflowKanban } from "../workflow/components/WorkflowKanban";
import type { WorkflowProcess, WorkflowInstance, FormField } from "../../types/workflow";
import { parseFormSchema } from "../../types/workflow";

interface Props {
    slug: string;
    tenantId: string | null;
    username: string;
    logout: () => void;
}

// ── Dynamic instance creation modal ───────────────────────────────────────────

function NewInstanceModal({
    process,
    tenantId,
    onClose,
    onCreated,
}: {
    process: WorkflowProcess;
    tenantId: string | null;
    onClose: () => void;
    onCreated: (instance: WorkflowInstance) => void;
}) {
    const fields  = parseFormSchema(process);
    const [title, setTitle]             = useState("");
    const [values, setValues]           = useState<Record<string, string>>({});
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState<string | null>(null);

    const setValue = (key: string, val: string) =>
        setValues(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        if (!title.trim()) { setError("Title is required."); return; }

        const missing = fields.filter(f => f.required && !values[f.key]?.trim());
        if (missing.length) {
            setError(`Required: ${missing.map(f => f.label).join(", ")}`);
            return;
        }

        if (!tenantId) { setError("No tenant ID — contact your administrator."); return; }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/workflow/instances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    workflowProcessId: process.id,
                    title: title.trim(),
                    dataJson: Object.keys(values).length > 0 ? JSON.stringify(values) : null,
                }),
            });
            if (!res.ok) { setError("Failed to create. Please try again."); return; }
            const created: WorkflowInstance = await res.json();
            onCreated(created);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1040 }} onClick={onClose} />
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
                maxHeight: "85vh",
            }}>
                {/* Header */}
                <div
                    className="d-flex align-items-center justify-content-between p-4"
                    style={{ background: process.primaryColor, borderRadius: "10px 10px 0 0" }}
                >
                    <h5 className="mb-0 font-weight-bold text-white">
                        <i className={`bi ${process.iconClass} mr-2`} />
                        New {process.name}
                    </h5>
                    <button
                        className="btn btn-sm"
                        style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none" }}
                        onClick={onClose}
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 overflow-auto flex-grow-1">
                    {error && <div className="alert alert-danger py-2 small">{error}</div>}

                    {/* Always-present title field */}
                    <div className="form-group">
                        <label className="font-weight-bold small">Title *</label>
                        <input
                            className="form-control"
                            placeholder={`Name this ${process.name.toLowerCase()} item`}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {fields.map(field => (
                        <FormFieldInput
                            key={field.key}
                            field={field}
                            value={values[field.key] ?? ""}
                            onChange={val => setValue(field.key, val)}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-top d-flex justify-content-end" style={{ gap: "0.5rem" }}>
                    <button className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button
                        className="btn font-weight-bold"
                        style={{ background: process.accentColor, color: "#fff", border: "none" }}
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving
                            ? <><span className="spinner-border spinner-border-sm mr-1" />Creating…</>
                            : <><i className="bi bi-plus-lg mr-1" />Create</>
                        }
                    </button>
                </div>
            </div>
        </>
    );
}

function FormFieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (v: string) => void }) {
    const label = <label className="font-weight-bold small">{field.label}{field.required && " *"}</label>;

    if (field.type === "textarea") return (
        <div className="form-group">
            {label}
            <textarea className="form-control" rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
        </div>
    );

    if (field.type === "select") return (
        <div className="form-group">
            {label}
            <select className="form-control" value={value} onChange={e => onChange(e.target.value)}>
                <option value="">— select —</option>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    return (
        <div className="form-group">
            {label}
            <input
                className="form-control"
                type={field.type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={field.placeholder}
            />
        </div>
    );
}

// ── Main App View ──────────────────────────────────────────────────────────────

export function ClientAppView({ slug, tenantId, username, logout }: Props) {
    const [process, setProcess]     = useState<WorkflowProcess | null>(null);
    const [instances, setInstances] = useState<WorkflowInstance[]>([]);
    const [loading, setLoading]     = useState(true);
    const [busy, setBusy]           = useState(false);
    const [showNew, setShowNew]     = useState(false);
    const [error, setError]         = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/workflow/processes");
                if (!res.ok) { setError("Failed to load apps."); return; }
                const all: WorkflowProcess[] = await res.json();
                const found = all.find(p => p.appSlug === slug || p.id === slug);
                if (!found) { setError("App not found."); return; }
                setProcess(found);

                const iRes = await fetch(
                    `/api/workflow/instances?processId=${found.id}${tenantId ? `&tenantId=${tenantId}` : ""}`
                );
                if (iRes.ok) setInstances(await iRes.json());
            } catch {
                setError("Connection error.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug, tenantId]);

    const handleMove = async (instanceId: string, targetStepId: string) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/workflow/instances/${instanceId}/move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStepId, comments: `Moved by ${username}` }),
            });
            if (res.ok) {
                const updated: WorkflowInstance = await res.json();
                setInstances(prev => prev.map(i => i.id === updated.id ? updated : i));
            }
        } finally {
            setBusy(false);
        }
    };

    const handleCreated = (instance: WorkflowInstance) => {
        setInstances(prev => [instance, ...prev]);
        setShowNew(false);
    };

    return (
        <div className="container-xl px-4 pb-5">
            {/* Top bar */}
            <div
                className="card border-0 shadow-sm mb-4"
                style={{ background: process ? `linear-gradient(135deg, ${process.primaryColor}, ${process.accentColor})` : "#2E8B57", borderRadius: 10 }}
            >
                <div className="card-body p-4 text-white d-flex align-items-center justify-content-between flex-wrap" style={{ gap: "1rem" }}>
                    <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                        <button
                            className="btn btn-sm"
                            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none" }}
                            onClick={() => { window.location.hash = "/client"; }}
                            title="Back to portal"
                        >
                            <i className="bi bi-arrow-left" />
                        </button>
                        {process && (
                            <div
                                className="d-flex align-items-center justify-content-center rounded"
                                style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", fontSize: "1.2rem" }}
                            >
                                <i className={`bi ${process.iconClass}`} />
                            </div>
                        )}
                        <div>
                            <h4 className="mb-0 font-weight-bold">{process?.name ?? "Loading…"}</h4>
                            {process?.description && (
                                <p className="mb-0" style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>{process.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                        {process && tenantId && (
                            <button
                                className="btn btn-sm font-weight-bold"
                                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                                onClick={() => setShowNew(true)}
                            >
                                <i className="bi bi-plus-lg mr-1" />New {process.name}
                            </button>
                        )}
                        <button className="btn btn-outline-light btn-sm" onClick={logout}>
                            <i className="bi bi-box-arrow-right mr-1" />Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border" style={{ color: process?.primaryColor ?? "#2E8B57" }} /></div>
            ) : error ? (
                <div className="alert alert-warning">
                    {error}
                    <button className="btn btn-sm btn-outline-secondary ml-3" onClick={() => { window.location.hash = "/client"; }}>
                        <i className="bi bi-arrow-left mr-1" />Back to Portal
                    </button>
                </div>
            ) : process ? (
                <WorkflowKanban process={process} instances={instances} onMove={handleMove} busy={busy} />
            ) : null}

            {showNew && process && (
                <NewInstanceModal
                    process={process}
                    tenantId={tenantId}
                    onClose={() => setShowNew(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}
