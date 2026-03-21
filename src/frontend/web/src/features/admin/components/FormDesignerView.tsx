import { useState } from "react";

function uid() { return Math.random().toString(36).slice(2, 10); }

function bumpVersion(v: string): string {
    const m = v.match(/^(v\d+\.)(\d+)$/);
    if (m) return `${m[1]}${parseInt(m[2]) + 1}`;
    const m2 = v.match(/^(\d+\.)(\d+)$/);
    if (m2) return `${m2[1]}${parseInt(m2[2]) + 1}`;
    return v + ".1";
}

type FieldType =
    | "text" | "email" | "phone" | "number" | "date"
    | "textarea" | "checkbox" | "select"
    | "readonly" | "paragraph" | "signature";

type FormField = {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    placeholder: string;
    options: string;       // for select
    content: string;       // for readonly / paragraph
    colWidth: "full" | "half";
    spacingBottom: "none" | "sm" | "md" | "lg";
};

type FormVersion = {
    versionNum: string;
    savedAt: string;
    fields: FormField[];
    status: "Draft" | "Active" | "Archived";
};

type FormDef = {
    id: string;
    name: string;
    category: string;
    status: "Draft" | "Active" | "Archived";
    version: string;
    fields: FormField[];
    updatedAt: string;
    versions: FormVersion[];
};

type FormPackage = {
    id: string;
    name: string;
    description: string;
    formIds: string[];
};

type Tab = "forms" | "packages";

function makeField(label: string, type: FieldType, required: boolean, placeholder = "", options = "", content = ""): FormField {
    return { id: uid(), label, type, required, placeholder, options, content, colWidth: "full", spacingBottom: "md" };
}

const SEED_FORMS: FormDef[] = [
    {
        id: uid(), name: "Non-Disclosure Agreement (NDA)", category: "Legal",
        status: "Active", version: "v1.0", updatedAt: "2026-03-21", versions: [],
        fields: [
            makeField("Agreement Introduction", "paragraph", false, "", "", "This Non-Disclosure Agreement (\"Agreement\") is entered into by the parties listed below. By signing this form, both parties agree to keep all shared information strictly confidential."),
            makeField("Party Name", "text", true, "Full legal name"),
            makeField("Company Name", "text", true, "Organization name"),
            makeField("Effective Date", "date", true),
            makeField("Duration (months)", "number", true, "12"),
            makeField("Scope of Confidentiality", "textarea", true, "Describe what information is covered"),
            makeField("I agree to the terms of this NDA", "checkbox", true),
            makeField("Authorized Signature", "signature", true),
        ],
    },
    {
        id: uid(), name: "Service Agreement", category: "Legal",
        status: "Active", version: "v1.0", updatedAt: "2026-03-21", versions: [],
        fields: [
            makeField("Client Name", "text", true, "Full legal name"),
            makeField("Client Email", "email", true, "email@company.com"),
            makeField("Services Description", "textarea", true, "Describe the scope of services"),
            makeField("Start Date", "date", true),
            makeField("Payment Terms", "select", true, "", "Net 15,Net 30,Net 60,Due on Receipt"),
            makeField("Total Contract Value", "number", false, "0.00"),
            makeField("I have read and agree to the terms", "checkbox", true),
            makeField("Client Signature", "signature", true),
        ],
    },
    {
        id: uid(), name: "Client Onboarding Questionnaire", category: "Onboarding",
        status: "Active", version: "v1.0", updatedAt: "2026-03-21", versions: [],
        fields: [
            makeField("Company Name", "text", true, "Legal organization name"),
            makeField("Primary Contact", "text", true, "First and last name"),
            makeField("Email", "email", true),
            makeField("Phone", "phone", false),
            makeField("Industry", "select", true, "", "Government,Healthcare,Technology,Construction,Finance,Retail,Other"),
            makeField("Primary Goals", "textarea", true, "What are you hoping to achieve?"),
            makeField("How did you hear about us", "select", false, "", "Referral,Website,LinkedIn,Cold Outreach,Event,Other"),
            makeField("Additional Comments", "textarea", false),
        ],
    },
    {
        id: uid(), name: "Change Order Request", category: "Operations",
        status: "Draft", version: "v1.0", updatedAt: "2026-03-21", versions: [],
        fields: [
            makeField("Project Name", "text", true),
            makeField("Change Order #", "text", true, "CO-001"),
            makeField("Description of Change", "textarea", true),
            makeField("Additional Cost ($)", "number", true),
            makeField("Revised Completion Date", "date", false),
            makeField("Client Approval", "checkbox", true),
        ],
    },
    {
        id: uid(), name: "Project Acceptance Sign-Off", category: "Operations",
        status: "Draft", version: "v1.0", updatedAt: "2026-03-21", versions: [],
        fields: [
            makeField("Project Name", "text", true),
            makeField("Completion Date", "date", true),
            makeField("Deliverables Reviewed", "checkbox", true),
            makeField("Client Satisfaction Rating", "select", true, "", "Excellent,Good,Satisfactory,Needs Improvement"),
            makeField("Comments", "textarea", false),
            makeField("Client Full Name (Print)", "text", true),
            makeField("Client Signature", "signature", true),
        ],
    },
];

const CATEGORY_OPTIONS = ["Legal", "Onboarding", "Operations", "Finance", "HR", "Other"];
const STATUS_OPTIONS: FormDef["status"][] = ["Draft", "Active", "Archived"];
const SPACING_OPTIONS: FormField["spacingBottom"][] = ["none", "sm", "md", "lg"];
const SPACING_LABELS: Record<FormField["spacingBottom"], string> = { none: "None", sm: "Small", md: "Medium", lg: "Large" };
const SPACING_CLASSES: Record<FormField["spacingBottom"], string> = { none: "mb-0", sm: "mb-1", md: "mb-3", lg: "mb-5" };

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    text: "Text", email: "Email", phone: "Phone", number: "Number",
    date: "Date", textarea: "Text Area", checkbox: "Checkbox", select: "Dropdown",
    readonly: "Read-Only Text", paragraph: "Paragraph", signature: "Signature Block",
};

function statusBadge(status: FormDef["status"]) {
    if (status === "Active") return "success";
    if (status === "Archived") return "secondary";
    return "warning";
}

function emptyFormDef(): FormDef {
    return {
        id: uid(), name: "", category: "Legal", status: "Draft",
        version: "v1.0", fields: [], updatedAt: new Date().toISOString().slice(0, 10), versions: [],
    };
}

function emptyField(): FormField {
    return { id: uid(), label: "", type: "text", required: false, placeholder: "", options: "", content: "", colWidth: "full", spacingBottom: "md" };
}

// Group fields into grid rows
function groupIntoRows(fields: FormField[]): FormField[][] {
    const rows: FormField[][] = [];
    let i = 0;
    while (i < fields.length) {
        const f = fields[i];
        if (f.colWidth === "half" && i + 1 < fields.length && fields[i + 1].colWidth === "half") {
            rows.push([f, fields[i + 1]]);
            i += 2;
        } else {
            rows.push([f]);
            i += 1;
        }
    }
    return rows;
}

function printForm(form: FormDef) {
    const w = window.open("", "_blank", "width=850,height=1000");
    if (!w) return;
    const renderField = (f: FormField) => {
        if (f.type === "paragraph") return `<p style="font-size:0.95rem;color:#333">${f.content || ""}</p>`;
        if (f.type === "readonly") return `<div style="background:#f8f9fa;color:#212529;border:1px solid #dee2e6;padding:6px 10px;border-radius:4px;font-size:0.9rem">${f.content || ""}</div>`;
        if (f.type === "signature") return `<div style="border:1px solid #aaa;height:70px;border-radius:4px;margin-bottom:4px"></div><div style="display:flex;justify-content:space-between"><small>${f.label || "Signature"}</small><small>Date: ___________</small></div>`;
        if (f.type === "checkbox") return `<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" disabled /> ${f.label}${f.required ? " *" : ""}</label>`;
        if (f.type === "textarea") return `<textarea style="width:100%;border:1px solid #dee2e6;padding:6px;border-radius:4px;resize:none;height:80px" placeholder="${f.placeholder}" disabled></textarea>`;
        if (f.type === "select") return `<select style="width:100%;padding:6px;border:1px solid #dee2e6;border-radius:4px" disabled><option>— Select —</option>${f.options.split(",").filter(Boolean).map(o => `<option>${o.trim()}</option>`).join("")}</select>`;
        return `<input type="${f.type === "phone" ? "tel" : f.type}" style="width:100%;padding:6px;border:1px solid #dee2e6;border-radius:4px" placeholder="${f.placeholder}" disabled />`;
    };

    const rows = groupIntoRows(form.fields);
    const body = rows.map(row => {
        if (row.length === 2) {
            return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${row.map(f => `<div class="mb-3"><label style="display:block;font-weight:600;font-size:0.85rem;margin-bottom:4px">${f.type !== "checkbox" && f.type !== "paragraph" && f.type !== "signature" ? (f.label || "Untitled") + (f.required ? " *" : "") : ""}</label>${renderField(f)}</div>`).join("")}</div>`;
        }
        const f = row[0];
        return `<div class="mb-3"><label style="display:block;font-weight:600;font-size:0.85rem;margin-bottom:4px">${f.type !== "checkbox" && f.type !== "paragraph" && f.type !== "signature" ? (f.label || "Untitled") + (f.required ? " *" : "") : ""}</label>${renderField(f)}</div>`;
    }).join("");

    w.document.write(`<!DOCTYPE html><html><head><title>${form.name}</title><style>body{font-family:Arial,sans-serif;padding:32px;max-width:720px;margin:auto}h4{margin-bottom:4px}hr{margin:12px 0}.mb-3{margin-bottom:12px}@media print{body{padding:16px}}</style></head><body><h4>${form.name}</h4><small style="color:#666">Version ${form.version} — ${form.updatedAt} | ${form.category}</small><hr>${body}<hr><div style="display:flex;justify-content:space-between;margin-top:24px"><div style="font-size:0.85rem;color:#666">Generated by Seacoast DevOps Form Designer</div><div style="font-size:0.85rem;color:#666">Page 1</div></div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
}

// ——— Single field preview ———
function FieldPreview({ field }: { field: FormField }) {
    const label = field.label || <em className="text-muted">Untitled</em>;
    const cls = SPACING_CLASSES[field.spacingBottom];

    if (field.type === "paragraph") {
        return (
            <div className={cls}>
                <p className="small mb-0" style={{ color: "#333" }}>{field.content || <em className="text-muted">Paragraph text goes here.</em>}</p>
            </div>
        );
    }
    if (field.type === "readonly") {
        return (
            <div className={`form-group ${cls}`}>
                <label className="small font-weight-bold">{label}</label>
                <div className="form-control form-control-sm bg-light text-dark">{field.content || <em className="text-muted">Read-only content</em>}</div>
            </div>
        );
    }
    if (field.type === "signature") {
        return (
            <div className={cls}>
                <label className="small font-weight-bold">{label}{field.required && <span className="text-danger ml-1">*</span>}</label>
                <div style={{ border: "1px solid #dee2e6", borderRadius: 4, height: 70, background: "#fafafa", color: "#212529", display: "flex", alignItems: "flex-end", padding: "0.5rem" }}>
                    <small className="text-muted">Sign above this line</small>
                </div>
                <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">{field.label || "Signature"}</small>
                    <small className="text-muted">Date: ___________</small>
                </div>
            </div>
        );
    }
    if (field.type === "checkbox") {
        return (
            <div className={`form-check ${cls}`}>
                <input className="form-check-input" type="checkbox" disabled />
                <label className="form-check-label small">{label}{field.required && <span className="text-danger ml-1">*</span>}</label>
            </div>
        );
    }
    return (
        <div className={`form-group ${cls}`}>
            <label className="small font-weight-bold">
                {label}{field.required && <span className="text-danger ml-1">*</span>}
            </label>
            {field.type === "textarea" && (
                <textarea className="form-control form-control-sm" rows={3} placeholder={field.placeholder} disabled />
            )}
            {field.type === "select" && (
                <select className="form-control form-control-sm" disabled>
                    <option value="">— Select —</option>
                    {field.options.split(",").filter(Boolean).map(o => (
                        <option key={o.trim()}>{o.trim()}</option>
                    ))}
                </select>
            )}
            {field.type !== "textarea" && field.type !== "select" && (
                <input
                    type={field.type === "phone" ? "tel" : field.type}
                    className="form-control form-control-sm"
                    placeholder={field.placeholder}
                    disabled
                />
            )}
        </div>
    );
}

// ——— Form Preview overlay ———
function FormPreview({ form, onClose }: { form: FormDef; onClose: () => void }) {
    const rows = groupIntoRows(form.fields);
    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}
        >
            <div className="card shadow" style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
                onClick={e => e.stopPropagation()}>
                <div className="card-header d-flex justify-content-between align-items-center"
                    style={{ background: "#1a3a4a", color: "#fff" }}>
                    <strong><i className="bi bi-eye mr-2" />{form.name}</strong>
                    <div className="d-flex gap-2">
                        <button className="btn btn-xs btn-outline-light" onClick={() => printForm(form)} title="Print / Save as PDF">
                            <i className="bi bi-printer mr-1" />Print / PDF
                        </button>
                        <button className="btn btn-xs btn-outline-light" onClick={onClose}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <span className="badge badge-secondary mr-1">{form.category}</span>
                        <span className="badge badge-info mr-1">{form.version}</span>
                        <span className={`badge badge-${statusBadge(form.status)}`}>{form.status}</span>
                    </div>
                    {form.fields.length === 0 && (
                        <p className="text-muted text-center py-3">No fields defined.</p>
                    )}
                    {rows.map((row, i) => (
                        <div key={i} className={row.length === 2 ? "row" : ""}>
                            {row.map(field => (
                                <div key={field.id} className={row.length === 2 ? "col-6" : ""}>
                                    <FieldPreview field={field} />
                                </div>
                            ))}
                        </div>
                    ))}
                    <button className="btn btn-primary btn-sm w-100 mt-2" disabled>Submit Form</button>
                </div>
            </div>
        </div>
    );
}

// ——— Version History overlay ———
function VersionHistoryModal({ form, onClose, onPreviewVersion }: {
    form: FormDef;
    onClose: () => void;
    onPreviewVersion: (snapshot: FormDef) => void;
}) {
    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}
        >
            <div className="card shadow" style={{ width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}
                onClick={e => e.stopPropagation()}>
                <div className="card-header d-flex justify-content-between align-items-center"
                    style={{ background: "#1a3a4a", color: "#fff" }}>
                    <strong><i className="bi bi-clock-history mr-2" />{form.name} — Version History</strong>
                    <button className="btn btn-xs btn-outline-light" onClick={onClose}><i className="bi bi-x-lg" /></button>
                </div>
                <div className="card-body p-0">
                    {form.versions.length === 0 ? (
                        <div className="text-muted text-center py-4">
                            <i className="bi bi-clock-history d-block mb-2" style={{ fontSize: "1.5rem", opacity: 0.4 }} />
                            No version history yet. Versions are created automatically when an Active form is saved.
                        </div>
                    ) : (
                        <table className="table table-sm mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Version</th>
                                    <th>Saved</th>
                                    <th>Status</th>
                                    <th>Fields</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Current version first */}
                                <tr className="table-active">
                                    <td><span className="badge badge-primary">{form.version}</span> <small className="text-muted">(current)</small></td>
                                    <td className="small text-muted">{form.updatedAt}</td>
                                    <td><span className={`badge badge-${statusBadge(form.status)}`}>{form.status}</span></td>
                                    <td className="small text-muted">{form.fields.length}</td>
                                    <td></td>
                                </tr>
                                {/* Historical versions, newest first */}
                                {[...form.versions].reverse().map(v => (
                                    <tr key={v.versionNum}>
                                        <td><span className="badge badge-info">{v.versionNum}</span></td>
                                        <td className="small text-muted">{v.savedAt}</td>
                                        <td><span className={`badge badge-${statusBadge(v.status)}`}>{v.status}</span></td>
                                        <td className="small text-muted">{v.fields.length}</td>
                                        <td>
                                            <button className="btn btn-xs btn-outline-secondary"
                                                onClick={() => onPreviewVersion({
                                                    ...form,
                                                    version: v.versionNum,
                                                    fields: v.fields,
                                                    status: v.status,
                                                    updatedAt: v.savedAt,
                                                    versions: [],
                                                })}>
                                                <i className="bi bi-eye mr-1" />Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ——— FormEditor inline card ———
function FormEditor({ initial, onSave, onCancel, onPreview }: {
    initial: FormDef;
    onSave: (f: FormDef) => void;
    onCancel: () => void;
    onPreview: (f: FormDef) => void;
}) {
    const [form, setForm] = useState<FormDef>({ ...initial, fields: initial.fields.map(f => ({ ...f })) });

    const setMeta = (patch: Partial<FormDef>) => setForm(f => ({ ...f, ...patch }));
    const setField = (id: string, patch: Partial<FormField>) =>
        setForm(f => ({ ...f, fields: f.fields.map(ff => ff.id === id ? { ...ff, ...patch } : ff) }));
    const addField = () => setForm(f => ({ ...f, fields: [...f.fields, emptyField()] }));
    const removeField = (id: string) => setForm(f => ({ ...f, fields: f.fields.filter(ff => ff.id !== id) }));
    const moveField = (idx: number, dir: -1 | 1) => {
        setForm(f => {
            const fields = [...f.fields];
            const target = idx + dir;
            if (target < 0 || target >= fields.length) return f;
            [fields[idx], fields[target]] = [fields[target], fields[idx]];
            return { ...f, fields };
        });
    };
    const handleSave = () => {
        if (!form.name.trim()) return;
        onSave({ ...form, updatedAt: new Date().toISOString().slice(0, 10) });
    };

    const needsContent = (t: FieldType) => t === "readonly" || t === "paragraph";
    const needsOptions = (t: FieldType) => t === "select";
    const needsPlaceholder = (t: FieldType) => !["checkbox", "select", "readonly", "paragraph", "signature"].includes(t);

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex justify-content-between align-items-center"
                style={{ background: "#1a3a4a", color: "#fff" }}>
                <strong>
                    <i className="bi bi-pencil-square mr-2" />
                    {initial.name ? "Edit Form" : "New Form"}
                </strong>
                <div className="d-flex gap-2">
                    <button className="btn btn-xs btn-outline-light" onClick={() => onPreview(form)}>
                        <i className="bi bi-eye mr-1" />Preview
                    </button>
                    <button className="btn btn-xs btn-outline-light" onClick={() => printForm(form)}>
                        <i className="bi bi-printer mr-1" />Print
                    </button>
                    <button className="btn btn-xs btn-light" onClick={handleSave} disabled={!form.name.trim()}>
                        <i className="bi bi-floppy mr-1" />Save
                    </button>
                </div>
            </div>
            <div className="card-body">
                {/* Metadata row */}
                <div className="row mb-3">
                    <div className="col-md-5">
                        <label className="small font-weight-bold">Form Name *</label>
                        <input className="form-control form-control-sm" value={form.name}
                            onChange={e => setMeta({ name: e.target.value })} placeholder="Form name" />
                    </div>
                    <div className="col-md-3">
                        <label className="small font-weight-bold">Category</label>
                        <select className="form-control form-control-sm" value={form.category}
                            onChange={e => setMeta({ category: e.target.value })}>
                            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="small font-weight-bold">Version</label>
                        <input className="form-control form-control-sm" value={form.version} readOnly
                            style={{ background: "#f8f9fa", color: "#212529" }} title="Auto-incremented when an Active form is saved" />
                    </div>
                    <div className="col-md-2">
                        <label className="small font-weight-bold">Status</label>
                        <select className="form-control form-control-sm" value={form.status}
                            onChange={e => setMeta({ status: e.target.value as FormDef["status"] })}>
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="font-weight-bold small mb-2">
                    <i className="bi bi-list-ul mr-1" />Fields
                </div>

                {form.fields.length === 0 ? (
                    <div className="border rounded text-center text-muted py-4 mb-3" style={{ borderStyle: "dashed" }}>
                        <i className="bi bi-plus-circle d-block mb-1" style={{ fontSize: "1.5rem", opacity: 0.4 }} />
                        No fields yet. Click "Add Field" to begin.
                    </div>
                ) : (
                    <div className="mb-3">
                        {form.fields.map((field, idx) => (
                            <div key={field.id} className="border rounded p-2 mb-2" style={{ background: "#f8f9fa", color: "#212529" }}>
                                {/* Row 1: move | label | type | options/placeholder/content | required | delete */}
                                <div className="d-flex align-items-start gap-2 flex-wrap">
                                    <div className="d-flex flex-column gap-1" style={{ minWidth: 28 }}>
                                        <button className="btn btn-xs btn-outline-secondary" disabled={idx === 0}
                                            onClick={() => moveField(idx, -1)}><i className="bi bi-chevron-up" /></button>
                                        <button className="btn btn-xs btn-outline-secondary" disabled={idx === form.fields.length - 1}
                                            onClick={() => moveField(idx, 1)}><i className="bi bi-chevron-down" /></button>
                                    </div>
                                    <div className="col-md-3" style={{ minWidth: 110 }}>
                                        <label className="small text-muted mb-1">Label</label>
                                        <input className="form-control form-control-sm" value={field.label}
                                            placeholder={field.type === "paragraph" ? "Paragraph (no label)" : "Field label"}
                                            onChange={e => setField(field.id, { label: e.target.value })} />
                                    </div>
                                    <div style={{ minWidth: 130 }}>
                                        <label className="small text-muted mb-1">Type</label>
                                        <select className="form-control form-control-sm" value={field.type}
                                            onChange={e => setField(field.id, { type: e.target.value as FieldType })}>
                                            <optgroup label="Input Fields">
                                                {(["text", "email", "phone", "number", "date", "textarea", "checkbox", "select"] as FieldType[]).map(t => (
                                                    <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Display Elements">
                                                {(["readonly", "paragraph", "signature"] as FieldType[]).map(t => (
                                                    <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                    {needsOptions(field.type) && (
                                        <div className="flex-grow-1" style={{ minWidth: 150 }}>
                                            <label className="small text-muted mb-1">Options (comma-separated)</label>
                                            <input className="form-control form-control-sm" value={field.options}
                                                placeholder="Option A,Option B" onChange={e => setField(field.id, { options: e.target.value })} />
                                        </div>
                                    )}
                                    {needsPlaceholder(field.type) && (
                                        <div className="flex-grow-1" style={{ minWidth: 120 }}>
                                            <label className="small text-muted mb-1">Placeholder</label>
                                            <input className="form-control form-control-sm" value={field.placeholder}
                                                placeholder="Placeholder text" onChange={e => setField(field.id, { placeholder: e.target.value })} />
                                        </div>
                                    )}
                                    {needsContent(field.type) && (
                                        <div className="flex-grow-1" style={{ minWidth: 160 }}>
                                            <label className="small text-muted mb-1">Content</label>
                                            <textarea className="form-control form-control-sm" rows={2} value={field.content}
                                                placeholder={field.type === "paragraph" ? "Paragraph text displayed in form" : "Read-only text content"}
                                                onChange={e => setField(field.id, { content: e.target.value })} />
                                        </div>
                                    )}
                                    {field.type !== "paragraph" && field.type !== "signature" && (
                                        <div className="d-flex flex-column align-items-center" style={{ minWidth: 40, paddingTop: 18 }}>
                                            <label className="small text-muted mb-1">Req</label>
                                            <input type="checkbox" checked={field.required}
                                                onChange={e => setField(field.id, { required: e.target.checked })} />
                                        </div>
                                    )}
                                    <div className="d-flex align-items-end" style={{ paddingTop: 20 }}>
                                        <button className="btn btn-xs btn-outline-danger" onClick={() => removeField(field.id)}>
                                            <i className="bi bi-trash" />
                                        </button>
                                    </div>
                                </div>
                                {/* Row 2: grid width + spacing */}
                                <div className="d-flex gap-2 mt-2 pl-4" style={{ paddingLeft: "2.5rem" }}>
                                    <div>
                                        <label className="small text-muted mr-1">Width:</label>
                                        <div className="btn-group btn-group-sm">
                                            <button className={`btn btn-xs ${field.colWidth === "full" ? "btn-secondary" : "btn-outline-secondary"}`}
                                                onClick={() => setField(field.id, { colWidth: "full" })}>
                                                <i className="bi bi-layout-text-window-reverse mr-1" />Full
                                            </button>
                                            <button className={`btn btn-xs ${field.colWidth === "half" ? "btn-secondary" : "btn-outline-secondary"}`}
                                                onClick={() => setField(field.id, { colWidth: "half" })}>
                                                <i className="bi bi-layout-split mr-1" />Half
                                            </button>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        <label className="small text-muted mb-0 mr-1">Spacing:</label>
                                        <select className="form-control form-control-sm" style={{ width: "auto" }}
                                            value={field.spacingBottom}
                                            onChange={e => setField(field.id, { spacingBottom: e.target.value as FormField["spacingBottom"] })}>
                                            {SPACING_OPTIONS.map(s => <option key={s} value={s}>{SPACING_LABELS[s]}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-sm btn-outline-secondary" onClick={addField}>
                    <i className="bi bi-plus mr-1" />Add Field
                </button>
            </div>
            <div className="card-footer d-flex gap-2 justify-content-end">
                <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.name.trim()}>
                    <i className="bi bi-floppy mr-1" />Save Form
                </button>
            </div>
        </div>
    );
}

// ——— Main export ———
export function FormDesignerView() {
    const [tab, setTab] = useState<Tab>("forms");
    const [forms, setForms] = useState<FormDef[]>(SEED_FORMS);
    const [editingForm, setEditingForm] = useState<FormDef | null>(null);
    const [previewForm, setPreviewForm] = useState<FormDef | null>(null);
    const [historyForm, setHistoryForm] = useState<FormDef | null>(null);

    const [packages, setPackages] = useState<FormPackage[]>([]);
    const [editingPkg, setEditingPkg] = useState<FormPackage | null>(null);

    const switchTab = (t: Tab) => { setTab(t); setEditingForm(null); };
    const startNewForm = () => setEditingForm(emptyFormDef());
    const startEditForm = (f: FormDef) => setEditingForm({ ...f, fields: f.fields.map(ff => ({ ...ff })), versions: f.versions });
    const deleteForm = (id: string) => setForms(fs => fs.filter(f => f.id !== id));

    const saveForm = (f: FormDef) => {
        setForms(fs => {
            const existing = fs.find(x => x.id === f.id);
            if (existing && existing.status === "Active") {
                // Snapshot old state when saving an Active form
                const snapshot: FormVersion = {
                    versionNum: existing.version,
                    savedAt: existing.updatedAt,
                    fields: existing.fields.map(ff => ({ ...ff })),
                    status: existing.status,
                };
                const updated: FormDef = {
                    ...f,
                    version: bumpVersion(existing.version),
                    versions: [...(existing.versions || []), snapshot],
                    updatedAt: new Date().toISOString().slice(0, 10),
                };
                return fs.map(x => x.id === f.id ? updated : x);
            }
            const updated = { ...f, updatedAt: new Date().toISOString().slice(0, 10) };
            return existing ? fs.map(x => x.id === f.id ? updated : x) : [...fs, updated];
        });
        setEditingForm(null);
    };

    // Packages
    const emptyPkg = (): FormPackage => ({ id: uid(), name: "", description: "", formIds: [] });
    const startNewPkg = () => setEditingPkg(emptyPkg());
    const startEditPkg = (p: FormPackage) => setEditingPkg({ ...p, formIds: [...p.formIds] });
    const deletePkg = (id: string) => setPackages(ps => ps.filter(p => p.id !== id));
    const savePkg = (p: FormPackage) => {
        setPackages(ps => {
            const existing = ps.find(x => x.id === p.id);
            return existing ? ps.map(x => x.id === p.id ? p : x) : [...ps, p];
        });
        setEditingPkg(null);
    };
    const togglePkgForm = (pkg: FormPackage, formId: string) => {
        const ids = pkg.formIds.includes(formId)
            ? pkg.formIds.filter(id => id !== formId)
            : [...pkg.formIds, formId];
        setEditingPkg({ ...pkg, formIds: ids });
    };

    return (
        <div>
            {previewForm && <FormPreview form={previewForm} onClose={() => setPreviewForm(null)} />}
            {historyForm && (
                <VersionHistoryModal
                    form={historyForm}
                    onClose={() => setHistoryForm(null)}
                    onPreviewVersion={snap => { setHistoryForm(null); setPreviewForm(snap); }}
                />
            )}

            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-file-earmark-richtext-fill mr-2 text-primary" />
                        Form Designer
                    </h4>
                    <small className="text-muted">
                        Create, version, and package electronic forms — NDAs, agreements, and onboarding documents.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${tab === "forms" ? "active" : ""}`} onClick={() => switchTab("forms")}>
                        <i className="bi bi-file-earmark-text mr-1" />Forms Library
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "packages" ? "active" : ""}`} onClick={() => switchTab("packages")}>
                        <i className="bi bi-archive mr-1" />Form Packages
                    </button>
                </li>
            </ul>

            {/* ——— Forms Library ——— */}
            {tab === "forms" && (
                <div>
                    {editingForm ? (
                        <FormEditor
                            initial={editingForm}
                            onSave={saveForm}
                            onCancel={() => setEditingForm(null)}
                            onPreview={setPreviewForm}
                        />
                    ) : (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center"
                                style={{ background: "#1a3a4a", color: "#fff" }}>
                                <strong><i className="bi bi-collection mr-2" />Form Library</strong>
                                <button className="btn btn-sm btn-light" onClick={startNewForm}>
                                    <i className="bi bi-plus mr-1" />New Form
                                </button>
                            </div>
                            {forms.length === 0 ? (
                                <div className="card-body text-center text-muted py-5">
                                    <i className="bi bi-file-earmark-text" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                                    <p className="mt-3 mb-0">No forms yet. Click "New Form" to create one.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th>Form Name</th>
                                                <th>Category</th>
                                                <th>Fields</th>
                                                <th>Version</th>
                                                <th>Status</th>
                                                <th>Updated</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {forms.map(f => (
                                                <tr key={f.id}>
                                                    <td>
                                                        <i className="bi bi-file-earmark-text mr-2 text-muted" />
                                                        {f.name}
                                                    </td>
                                                    <td><span className="badge badge-secondary">{f.category}</span></td>
                                                    <td className="text-muted">{f.fields.length}</td>
                                                    <td>
                                                        <span className="badge badge-info">{f.version}</span>
                                                        {f.versions.length > 0 && (
                                                            <span className="badge badge-light text-dark border ml-1" title="Has version history">
                                                                {f.versions.length} prev
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-${statusBadge(f.status)}`}>{f.status}</span>
                                                    </td>
                                                    <td className="text-muted small">{f.updatedAt}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-xs btn-outline-secondary"
                                                                onClick={() => setPreviewForm(f)} title="Preview">
                                                                <i className="bi bi-eye" />
                                                            </button>
                                                            <button className="btn btn-xs btn-outline-secondary"
                                                                onClick={() => setHistoryForm(f)} title="Version History"
                                                                disabled={f.versions.length === 0}>
                                                                <i className="bi bi-clock-history" />
                                                            </button>
                                                            <button className="btn btn-xs btn-outline-secondary"
                                                                onClick={() => startEditForm(f)} title="Edit">
                                                                <i className="bi bi-pencil" />
                                                            </button>
                                                            <button className="btn btn-xs btn-outline-danger"
                                                                onClick={() => deleteForm(f.id)} title="Delete">
                                                                <i className="bi bi-trash" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ——— Form Packages ——— */}
            {tab === "packages" && (
                <div>
                    {editingPkg && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center"
                                style={{ background: "#1a3a4a", color: "#fff" }}>
                                <strong>
                                    <i className="bi bi-archive mr-2" />
                                    {packages.find(p => p.id === editingPkg.id) ? "Edit Package" : "New Package"}
                                </strong>
                            </div>
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-md-5">
                                        <label className="small font-weight-bold">Package Name *</label>
                                        <input className="form-control form-control-sm" value={editingPkg.name}
                                            onChange={e => setEditingPkg(p => p ? { ...p, name: e.target.value } : p)}
                                            placeholder="e.g. New Client Onboarding" />
                                    </div>
                                    <div className="col-md-7">
                                        <label className="small font-weight-bold">Description</label>
                                        <input className="form-control form-control-sm" value={editingPkg.description}
                                            onChange={e => setEditingPkg(p => p ? { ...p, description: e.target.value } : p)}
                                            placeholder="Brief description" />
                                    </div>
                                </div>
                                <label className="small font-weight-bold mb-2">Include Forms</label>
                                <div className="border rounded p-2" style={{ maxHeight: 260, overflowY: "auto" }}>
                                    {forms.length === 0 && (
                                        <p className="text-muted small mb-0 text-center py-2">No forms in library yet.</p>
                                    )}
                                    {forms.map(f => (
                                        <div key={f.id} className="form-check mb-1">
                                            <input className="form-check-input" type="checkbox"
                                                id={`pkg-form-${f.id}`}
                                                checked={editingPkg.formIds.includes(f.id)}
                                                onChange={() => togglePkgForm(editingPkg, f.id)} />
                                            <label className="form-check-label small" htmlFor={`pkg-form-${f.id}`}>
                                                {f.name}
                                                <span className="badge badge-secondary ml-2">{f.category}</span>
                                                <span className="badge badge-info ml-1">{f.version}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card-footer d-flex gap-2 justify-content-end">
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingPkg(null)}>Cancel</button>
                                <button className="btn btn-primary btn-sm"
                                    disabled={!editingPkg.name.trim()}
                                    onClick={() => savePkg(editingPkg)}>
                                    <i className="bi bi-floppy mr-1" />Save Package
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="font-weight-bold text-muted small">
                            <i className="bi bi-archive mr-1" />{packages.length} package{packages.length !== 1 ? "s" : ""}
                        </span>
                        {!editingPkg && (
                            <button className="btn btn-primary btn-sm" onClick={startNewPkg}>
                                <i className="bi bi-plus mr-1" />New Package
                            </button>
                        )}
                    </div>

                    {packages.length === 0 ? (
                        <div className="card shadow-sm">
                            <div className="card-body text-center text-muted py-5">
                                <i className="bi bi-archive" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                                <p className="mt-3 mb-0">No packages yet. Bundle forms into packages for easy delivery to clients.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="row">
                            {packages.map(pkg => {
                                const included = forms.filter(f => pkg.formIds.includes(f.id));
                                return (
                                    <div key={pkg.id} className="col-md-6 mb-3">
                                        <div className="card shadow-sm h-100">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6 className="font-weight-bold mb-1">
                                                            <i className="bi bi-archive mr-2 text-muted" />{pkg.name}
                                                        </h6>
                                                        {pkg.description && <p className="small text-muted mb-2">{pkg.description}</p>}
                                                        <span className="badge badge-info">{included.length} form{included.length !== 1 ? "s" : ""}</span>
                                                    </div>
                                                    <div className="d-flex gap-1">
                                                        <button className="btn btn-xs btn-outline-secondary" onClick={() => startEditPkg(pkg)}>
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                        <button className="btn btn-xs btn-outline-danger" onClick={() => deletePkg(pkg.id)}>
                                                            <i className="bi bi-trash" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {included.length > 0 && (
                                                    <ul className="small text-muted mb-0 mt-2 pl-3">
                                                        {included.map(f => <li key={f.id}>{f.name} <span className="badge badge-info">{f.version}</span></li>)}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
