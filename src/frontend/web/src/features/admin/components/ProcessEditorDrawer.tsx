import { useEffect, useRef, useState } from "react";
import type { WorkflowProcess, FormField, FormFieldType } from "../../../types/workflow";

type StepDraft = {
    _id: string; // local key for React
    name: string;
    defaultAssigneeRole: string;
    allowBacktracking: boolean;
    canSkip: boolean;
};

type Props = {
    process: WorkflowProcess | null; // null = create mode
    onClose: () => void;
    onSaved: () => void;
};

const ICON_OPTIONS = [
    "bi-diagram-3-fill", "bi-kanban-fill", "bi-person-badge-fill", "bi-briefcase-fill",
    "bi-gear-fill", "bi-clipboard-check-fill", "bi-house-fill", "bi-building",
    "bi-bank", "bi-shield-fill", "bi-trophy-fill", "bi-graph-up",
    "bi-lightning-fill", "bi-chat-dots-fill", "bi-envelope-fill", "bi-tools",
];

const FIELD_TYPES: FormFieldType[] = ["text", "number", "textarea", "select", "date", "email"];

function uid() {
    return Math.random().toString(36).slice(2);
}

export function ProcessEditorDrawer({ process, onClose, onSaved }: Props) {
    const isEdit = process !== null;

    const [name, setName]               = useState(process?.name ?? "");
    const [description, setDescription] = useState(process?.description ?? "");
    const [primaryColor, setPrimary]    = useState(process?.primaryColor ?? "#2F4F4F");
    const [accentColor, setAccent]      = useState(process?.accentColor ?? "#4a9a9a");
    const [iconClass, setIconClass]     = useState(process?.iconClass ?? "bi-diagram-3-fill");
    const [appSlug, setAppSlug]         = useState(process?.appSlug ?? "");
    const [steps, setSteps]             = useState<StepDraft[]>(() => {
        if (!process?.steps.length) return [{ _id: uid(), name: "", defaultAssigneeRole: "", allowBacktracking: true, canSkip: false }];
        return [...process.steps]
            .sort((a, b) => a.order - b.order)
            .map(s => ({
                _id: uid(),
                name: s.name,
                defaultAssigneeRole: s.defaultAssigneeRole ?? "",
                allowBacktracking: s.allowBacktracking,
                canSkip: s.canSkip,
            }));
    });
    const [fields, setFields] = useState<FormField[]>(() => {
        if (!process?.formSchema) return [];
        try { return JSON.parse(process.formSchema); } catch { return []; }
    });
    const [activeTab, setActiveTab] = useState<"basic" | "steps" | "form">("basic");
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState<string | null>(null);

    // ── Drag-to-reorder steps ─────────────────────────────────────────────
    const dragIdx = useRef<number | null>(null);

    const onDragStart = (idx: number) => { dragIdx.current = idx; };
    const onDragOver  = (e: React.DragEvent) => e.preventDefault();
    const onDrop      = (targetIdx: number) => {
        if (dragIdx.current === null || dragIdx.current === targetIdx) return;
        const reordered = [...steps];
        const [moved]   = reordered.splice(dragIdx.current, 1);
        reordered.splice(targetIdx, 0, moved);
        setSteps(reordered);
        dragIdx.current = null;
    };

    // ── Step helpers ──────────────────────────────────────────────────────
    const addStep = () =>
        setSteps(prev => [...prev, { _id: uid(), name: "", defaultAssigneeRole: "", allowBacktracking: true, canSkip: false }]);

    const removeStep = (idx: number) =>
        setSteps(prev => prev.filter((_, i) => i !== idx));

    const updateStep = (idx: number, patch: Partial<StepDraft>) =>
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

    // ── Form field helpers ────────────────────────────────────────────────
    const addField = () =>
        setFields(prev => [...prev, { key: uid(), label: "", type: "text", required: false }]);

    const removeField = (idx: number) =>
        setFields(prev => prev.filter((_, i) => i !== idx));

    const updateField = (idx: number, patch: Partial<FormField>) =>
        setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!name.trim()) { setError("Name is required."); return; }
        if (steps.some(s => !s.name.trim())) { setError("All steps must have a name."); return; }

        setSaving(true);
        setError(null);
        try {
            const body = {
                name:         name.trim(),
                description:  description.trim() || null,
                tenantId:     process?.tenantId ?? null,
                primaryColor,
                accentColor,
                iconClass,
                appSlug:      appSlug.trim() || null,
                formSchema:   fields.length > 0 ? JSON.stringify(fields) : null,
                steps:        steps.map(s => ({
                    name:                s.name.trim(),
                    defaultAssigneeRole: s.defaultAssigneeRole.trim() || null,
                    allowBacktracking:   s.allowBacktracking,
                    canSkip:             s.canSkip,
                })),
            };

            const url    = isEdit ? `/api/workflow/processes/${process!.id}` : "/api/workflow/processes";
            const method = isEdit ? "PUT" : "POST";
            const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

            if (!res.ok) { setError("Failed to save. Please try again."); return; }
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    // Auto-generate slug from name
    useEffect(() => {
        if (!isEdit && !appSlug) {
            setAppSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
        }
    }, [name]);

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1040 }}
                onClick={onClose}
            />

            {/* Drawer */}
            <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "min(680px, 100vw)",
                backgroundColor: "#0d1720",
                backgroundImage: "linear-gradient(0deg, rgba(150, 190, 170, 0.18) 0%, #0d1720 100%)",
                color: "#f3f7f5",
                zIndex: 1050,
                display: "flex",
                flexDirection: "column",
                boxShadow: "-8px 0 28px rgba(0,0,0,0.35)",
            }}>
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between p-4 border-bottom" style={{ flexShrink: 0 }}>
                    <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                        <div
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{ width: 40, height: 40, background: primaryColor, color: "#fff", fontSize: "1.2rem" }}
                        >
                            <i className={`bi ${iconClass}`} />
                        </div>
                        <div>
                            <h5 className="mb-0 font-weight-bold">{isEdit ? `Edit: ${process!.name}` : "New App"}</h5>
                            <small className="text-muted">Workflow process configuration</small>
                        </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Tabs */}
                <ul className="nav nav-tabs px-4 pt-2" style={{ flexShrink: 0 }}>
                    {(["basic", "steps", "form"] as const).map(tab => (
                        <li key={tab} className="nav-item">
                            <button
                                className={`nav-link ${activeTab === tab ? "active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                                style={{ border: "none", background: "none" }}
                            >
                                {tab === "basic" ? <><i className="bi bi-info-circle mr-1" />Basic</> :
                                 tab === "steps" ? <><i className="bi bi-list-ol mr-1" />Steps ({steps.length})</> :
                                                   <><i className="bi bi-ui-checks mr-1" />Form Fields ({fields.length})</>}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Body */}
                <div className="p-4 overflow-auto flex-grow-1">
                    {error && <div className="alert alert-danger py-2 small">{error}</div>}

                    {/* ── Basic Tab ── */}
                    {activeTab === "basic" && (
                        <div>
                            <div className="form-group">
                                <label className="font-weight-bold small">App Name *</label>
                                <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hire, Support Ticket" />
                            </div>
                            <div className="form-group">
                                <label className="font-weight-bold small">Description</label>
                                <textarea className="form-control" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description shown to users" />
                            </div>
                            <div className="form-group">
                                <label className="font-weight-bold small">URL Slug</label>
                                <input className="form-control" value={appSlug} onChange={e => setAppSlug(e.target.value)} placeholder="e.g. hire, support-ticket" />
                                <small className="text-muted">Used in client portal URL: /client/app/<strong>{appSlug || "slug"}</strong></small>
                            </div>

                            <div className="row">
                                <div className="col-6">
                                    <div className="form-group">
                                        <label className="font-weight-bold small">Primary Color</label>
                                        <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                            <input type="color" className="form-control p-1" style={{ width: 44, height: 38 }} value={primaryColor} onChange={e => setPrimary(e.target.value)} />
                                            <input className="form-control" value={primaryColor} onChange={e => setPrimary(e.target.value)} style={{ fontFamily: "monospace" }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="form-group">
                                        <label className="font-weight-bold small">Accent Color</label>
                                        <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
                                            <input type="color" className="form-control p-1" style={{ width: 44, height: 38 }} value={accentColor} onChange={e => setAccent(e.target.value)} />
                                            <input className="form-control" value={accentColor} onChange={e => setAccent(e.target.value)} style={{ fontFamily: "monospace" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="font-weight-bold small">Icon</label>
                                <div className="d-flex flex-wrap" style={{ gap: "0.4rem" }}>
                                    {ICON_OPTIONS.map(ic => (
                                        <button
                                            key={ic}
                                            type="button"
                                            title={ic}
                                            onClick={() => setIconClass(ic)}
                                            className="btn btn-sm"
                                            style={{
                                                width: 38, height: 38,
                                                background: iconClass === ic ? primaryColor : "#f4f4f4",
                                                color:      iconClass === ic ? "#fff" : "#555",
                                                border:     iconClass === ic ? `2px solid ${primaryColor}` : "2px solid transparent",
                                                borderRadius: 6,
                                            }}
                                        >
                                            <i className={`bi ${ic}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Steps Tab ── */}
                    {activeTab === "steps" && (
                        <div>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-grip-vertical mr-1" />Drag rows to reorder steps.
                            </p>
                            {steps.map((step, idx) => (
                                <div
                                    key={step._id}
                                    draggable
                                    onDragStart={() => onDragStart(idx)}
                                    onDragOver={onDragOver}
                                    onDrop={() => onDrop(idx)}
                                    className="card border mb-2"
                                    style={{ cursor: "grab" }}
                                >
                                    <div className="card-body p-3">
                                        <div className="d-flex align-items-center mb-2" style={{ gap: "0.5rem" }}>
                                            <i className="bi bi-grip-vertical text-muted" style={{ fontSize: "1.1rem", cursor: "grab" }} />
                                            <span
                                                className="badge badge-pill font-weight-bold"
                                                style={{ background: primaryColor, color: "#fff", minWidth: 24 }}
                                            >
                                                {idx + 1}
                                            </span>
                                            <input
                                                className="form-control form-control-sm flex-grow-1"
                                                placeholder="Step name"
                                                value={step.name}
                                                onChange={e => updateStep(idx, { name: e.target.value })}
                                            />
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeStep(idx)}
                                                disabled={steps.length <= 1}
                                                title="Remove step"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                        <div className="d-flex align-items-center" style={{ gap: "1rem", paddingLeft: "2.4rem" }}>
                                            <input
                                                className="form-control form-control-sm"
                                                placeholder="Assignee role (optional)"
                                                value={step.defaultAssigneeRole}
                                                onChange={e => updateStep(idx, { defaultAssigneeRole: e.target.value })}
                                                style={{ maxWidth: 200 }}
                                            />
                                            <label className="mb-0 small d-flex align-items-center" style={{ gap: "0.3rem", cursor: "pointer" }}>
                                                <input type="checkbox" checked={step.allowBacktracking} onChange={e => updateStep(idx, { allowBacktracking: e.target.checked })} />
                                                Allow backtrack
                                            </label>
                                            <label className="mb-0 small d-flex align-items-center" style={{ gap: "0.3rem", cursor: "pointer" }}>
                                                <input type="checkbox" checked={step.canSkip} onChange={e => updateStep(idx, { canSkip: e.target.checked })} />
                                                Can skip
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-sm btn-outline-primary mt-1" onClick={addStep}>
                                <i className="bi bi-plus-lg mr-1" />Add Step
                            </button>
                        </div>
                    )}

                    {/* ── Form Fields Tab ── */}
                    {activeTab === "form" && (
                        <div>
                            <p className="text-muted small mb-3">
                                Define the fields users fill in when creating a new item in this app. A <strong>Title</strong> field is always included automatically.
                            </p>
                            {fields.map((field, idx) => (
                                <div key={idx} className="card border mb-2">
                                    <div className="card-body p-3">
                                        <div className="d-flex" style={{ gap: "0.5rem", marginBottom: "0.5rem" }}>
                                            <input
                                                className="form-control form-control-sm"
                                                placeholder="Label (shown to user)"
                                                value={field.label}
                                                onChange={e => updateField(idx, { label: e.target.value })}
                                            />
                                            <input
                                                className="form-control form-control-sm"
                                                placeholder="Key (unique identifier)"
                                                value={field.key.startsWith("_") ? "" : field.key}
                                                onChange={e => updateField(idx, { key: e.target.value })}
                                                style={{ maxWidth: 160, fontFamily: "monospace" }}
                                            />
                                            <select
                                                className="form-control form-control-sm"
                                                value={field.type}
                                                onChange={e => updateField(idx, { type: e.target.value as FormFieldType })}
                                                style={{ maxWidth: 120 }}
                                            >
                                                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeField(idx)}
                                                title="Remove field"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                        <div className="d-flex align-items-center" style={{ gap: "1rem" }}>
                                            <label className="mb-0 small d-flex align-items-center" style={{ gap: "0.3rem", cursor: "pointer" }}>
                                                <input type="checkbox" checked={!!field.required} onChange={e => updateField(idx, { required: e.target.checked })} />
                                                Required
                                            </label>
                                            {field.type === "select" && (
                                                <div className="flex-grow-1">
                                                    <input
                                                        className="form-control form-control-sm"
                                                        placeholder="Options — comma separated (e.g. Low, Medium, High)"
                                                        value={field.options?.join(", ") ?? ""}
                                                        onChange={e => updateField(idx, { options: e.target.value.split(",").map(o => o.trim()).filter(Boolean) })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-sm btn-outline-primary mt-1" onClick={addField}>
                                <i className="bi bi-plus-lg mr-1" />Add Field
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-top d-flex justify-content-end" style={{ gap: "0.5rem", flexShrink: 0 }}>
                    <button className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button
                        className="btn font-weight-bold"
                        style={{ background: primaryColor, color: "#fff", border: "none" }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <><span className="spinner-border spinner-border-sm mr-1" />Saving…</>
                            : <><i className="bi bi-check2 mr-1" />{isEdit ? "Save Changes" : "Create App"}</>
                        }
                    </button>
                </div>
            </div>
        </>
    );
}
