import { useState } from "react";
import type { CreateLeadInput, Lead, UpdateLeadInput } from "../../../types/admin";
import { LEAD_SEGMENTS, LEAD_SOURCES, LEAD_STATUSES } from "../api";

type Props = {
    leads: Lead[];
    loadingLeads: boolean;
    busy: boolean;
    onCreateLead: (input: CreateLeadInput) => void;
    onUpdateLead: (leadId: string, input: UpdateLeadInput) => void;
    onDeleteLead: (leadId: string) => void;
};

const STATUS_COLOR: Record<string, string> = {
    new: "info",
    contacted: "primary",
    qualified: "warning",
    proposal: "secondary",
    won: "success",
    lost: "danger",
};

const STATUS_ORDER = ["new", "contacted", "qualified", "proposal", "won", "lost"];

const EMPTY_FORM: CreateLeadInput = {
    companyName: "", contactName: "", email: "", phone: "",
    status: "new", source: "", segment: "", estimatedValue: null, notes: "", followUpAt: null,
};

export function LeadsView({ leads, loadingLeads, busy, onCreateLead, onUpdateLead, onDeleteLead }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateLeadInput>(EMPTY_FORM);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSegment, setFilterSegment] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const startCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
    const startEdit = (lead: Lead) => {
        setForm({
            companyName: lead.companyName,
            contactName: lead.contactName,
            email: lead.email ?? "",
            phone: lead.phone ?? "",
            status: lead.status,
            source: lead.source ?? "",
            segment: lead.segment ?? "",
            estimatedValue: lead.estimatedValue,
            notes: lead.notes ?? "",
            followUpAt: lead.followUpAt,
        });
        setEditingId(lead.id);
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (!form.companyName?.trim() || !form.contactName?.trim()) return;
        const input = {
            ...form,
            email: (form.email as string) || null,
            phone: (form.phone as string) || null,
            source: (form.source as string) || null,
            segment: (form.segment as string) || null,
            notes: (form.notes as string) || null,
        };
        if (editingId) {
            onUpdateLead(editingId, input as UpdateLeadInput);
        } else {
            onCreateLead(input);
        }
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const quickStatusUpdate = (lead: Lead, nextStatus: string) => {
        onUpdateLead(lead.id, { status: nextStatus });
    };

    const filtered = leads.filter(l => {
        if (filterStatus && l.status !== filterStatus) return false;
        if (filterSegment && l.segment !== filterSegment) return false;
        return true;
    });

    // Count leads per pipeline stage
    const pipelineCounts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
        acc[s] = leads.filter(l => l.status === s).length;
        return acc;
    }, {});

    const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

    const fmtValue = (v: number | null) =>
        v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : null;

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0">
                        <i className="bi bi-funnel-fill mr-2" style={{ color: "#2F4F4F" }} />
                        Leads &amp; CRM
                    </h4>
                    <small className="text-muted">Track potential clients through your sales pipeline</small>
                </div>
                <button className="btn btn-primary btn-sm" onClick={startCreate} disabled={busy}>
                    <i className="bi bi-person-plus-fill mr-1" />
                    Add Lead
                </button>
            </div>

            {/* Pipeline overview */}
            <div className="row mb-4">
                {STATUS_ORDER.map(s => (
                    <div key={s} className="col mb-2">
                        <div
                            className={`card shadow-sm border-0 text-center p-2 ${filterStatus === s ? "border border-dark" : ""}`}
                            style={{ cursor: "pointer", borderTop: `3px solid var(--${STATUS_COLOR[s]}, #aaa)` }}
                            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                        >
                            <div className="small text-muted text-uppercase font-weight-bold">{s}</div>
                            <div className={`h5 mb-0 font-weight-bold text-${STATUS_COLOR[s]}`}>
                                {pipelineCounts[s] ?? 0}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lead form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#2F4F4F", color: "#fff" }}>
                        <strong>{editingId ? "Edit Lead" : "Add New Lead"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Company Name *</label>
                                    <input className="form-control form-control-sm" value={form.companyName as string}
                                        onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
                                </div>
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Contact Name *</label>
                                    <input className="form-control form-control-sm" value={form.contactName as string}
                                        onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Email</label>
                                            <input type="email" className="form-control form-control-sm" value={(form.email as string) ?? ""}
                                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Phone</label>
                                            <input className="form-control form-control-sm" value={(form.phone as string) ?? ""}
                                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Status</label>
                                            <select className="form-control form-control-sm" value={form.status as string}
                                                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Segment</label>
                                            <select className="form-control form-control-sm" value={(form.segment as string) ?? ""}
                                                onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                                                <option value="">— None —</option>
                                                {LEAD_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Source</label>
                                            <select className="form-control form-control-sm" value={(form.source as string) ?? ""}
                                                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                                                <option value="">— None —</option>
                                                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Est. Value ($)</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={form.estimatedValue ?? ""}
                                                onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value ? Number(e.target.value) : null }))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Follow Up Date</label>
                                    <input type="date" className="form-control form-control-sm"
                                        value={form.followUpAt ? form.followUpAt.toString().substring(0, 10) : ""}
                                        onChange={e => setForm(f => ({ ...f, followUpAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
                                </div>
                            </div>
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">Notes</label>
                            <textarea className="form-control form-control-sm" rows={2} value={(form.notes as string) ?? ""}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm" disabled={busy || !form.companyName || !form.contactName} onClick={handleSubmit}>
                                {busy ? <span className="spinner-border spinner-border-sm mr-1" role="status" /> : null}
                                {editingId ? "Save Changes" : "Add Lead"}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Segment filter pills */}
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <span className="small font-weight-bold text-muted">Segment:</span>
                <button className={`btn btn-sm ${filterSegment === "" ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setFilterSegment("")}>All</button>
                {LEAD_SEGMENTS.map(s => (
                    <button key={s} className={`btn btn-sm ${filterSegment === s ? "btn-dark" : "btn-outline-secondary"}`}
                        onClick={() => setFilterSegment(filterSegment === s ? "" : s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leads list */}
            {loadingLeads ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"><span className="sr-only">Loading…</span></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-funnel" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No leads found.</p>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="list-group list-group-flush">
                        {filtered.map(lead => (
                            <div key={lead.id} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1" style={{ cursor: "pointer" }}
                                        onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <strong>{lead.companyName}</strong>
                                            <span className={`badge badge-${STATUS_COLOR[lead.status]}`}>{lead.status}</span>
                                            {lead.segment && (
                                                <span className="badge badge-light border">{lead.segment}</span>
                                            )}
                                            {fmtValue(lead.estimatedValue) && (
                                                <span className="badge badge-outline-success text-success border border-success small">
                                                    {fmtValue(lead.estimatedValue)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="small text-muted mt-1">
                                            <i className="bi bi-person mr-1" />{lead.contactName}
                                            {lead.email && <><span className="mx-2">·</span><i className="bi bi-envelope mr-1" />{lead.email}</>}
                                            {lead.phone && <><span className="mx-2">·</span><i className="bi bi-telephone mr-1" />{lead.phone}</>}
                                            {lead.followUpAt && (
                                                <><span className="mx-2">·</span>
                                                    <i className="bi bi-calendar-event mr-1 text-warning" />
                                                    Follow up: {fmtDate(lead.followUpAt)}</>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex gap-1 ml-2">
                                        <button className="btn btn-xs btn-outline-secondary" onClick={() => startEdit(lead)} disabled={busy}>
                                            <i className="bi bi-pencil" />
                                        </button>
                                        <button className="btn btn-xs btn-outline-danger" onClick={() => onDeleteLead(lead.id)} disabled={busy}>
                                            <i className="bi bi-trash" />
                                        </button>
                                    </div>
                                </div>

                                {expandedId === lead.id && (
                                    <div className="mt-3 pt-3 border-top">
                                        {lead.notes && (
                                            <p className="small mb-2"><i className="bi bi-sticky mr-1 text-muted" />{lead.notes}</p>
                                        )}
                                        <div className="d-flex flex-wrap gap-1">
                                            <span className="small text-muted mr-2 font-weight-bold">Move to:</span>
                                            {LEAD_STATUSES.filter(s => s !== lead.status).map(s => (
                                                <button key={s} disabled={busy}
                                                    className={`btn btn-xs btn-outline-${STATUS_COLOR[s]}`}
                                                    onClick={() => quickStatusUpdate(lead, s)}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
