import { useCallback, useState } from "react";
import { SUBSCRIPTION_STATUSES, NOTE_CATEGORIES, INVOICE_STATUSES } from "../api";
import { DataTable } from "../../../lib/DataTable";
import type { DataTableAction } from "../../../lib/DataTable";
import type {
    Subscription, TenantDetail, TenantContact, TenantNote, Invoice
} from "../../../types/admin";

type Props = {
    tenantDetail: TenantDetail | null;
    loadingTenantDetail: boolean;
    busy: boolean;
    editTenantName: string;
    setEditTenantName: (v: string) => void;
    editTenantSlug: string;
    setEditTenantSlug: (v: string) => void;
    editTenantActive: boolean;
    setEditTenantActive: (v: boolean) => void;
    subPlanName: string; setSubPlanName: (v: string) => void;
    subStatus: string; setSubStatus: (v: string) => void;
    subSeats: string; setSubSeats: (v: string) => void;
    subMonthlyPrice: string; setSubMonthlyPrice: (v: string) => void;
    subCurrency: string; setSubCurrency: (v: string) => void;
    subAutoRenew: boolean; setSubAutoRenew: (v: boolean) => void;
    subStartedAt: string; setSubStartedAt: (v: string) => void;
    subRenewsAt: string; setSubRenewsAt: (v: string) => void;
    subCancelledAt: string; setSubCancelledAt: (v: string) => void;
    onUpdateTenant: () => void;
    onDeleteTenant: () => void;
    onAddSubscription: () => void;
    onUpdateSubscriptionStatus: (sub: Subscription, nextStatus: string) => void;
    onDeleteSubscription: (subscriptionId: string) => void;
    onAddContact: (name: string, title: string, email: string, phone: string, isPrimary: boolean) => void;
    onUpdateContact: (contactId: string, name: string, title: string, email: string, phone: string, isPrimary: boolean) => void;
    onDeleteContact: (contactId: string) => void;
    onAddNote: (content: string, category: string) => void;
    onDeleteNote: (noteId: string) => void;
    onAddInvoice: (amount: number, dueAt: string, notes: string, subscriptionId: string) => void;
    onUpdateInvoice: (invoiceId: string, input: { status?: string; paidAt?: string | null; paidAtSet?: boolean }) => void;
    onDeleteInvoice: (invoiceId: string) => void;
    tenantInvoices?: Invoice[];
};

const SUB_STATUS_COLOR: Record<string, string> = {
    active: "success", trialing: "info", past_due: "warning", canceled: "secondary",
};
const INV_STATUS_COLOR: Record<string, string> = {
    draft: "secondary", sent: "primary", paid: "success", overdue: "danger", void: "dark",
};

type Tab = "profile" | "subscriptions" | "contacts" | "notes" | "invoices";

const CONTACT_EMPTY = { name: "", title: "", email: "", phone: "", isPrimary: false };

export function TenantDetailView({
    tenantDetail, loadingTenantDetail, busy,
    editTenantName, setEditTenantName,
    editTenantSlug, setEditTenantSlug,
    editTenantActive, setEditTenantActive,
    subPlanName, setSubPlanName, subStatus, setSubStatus,
    subSeats, setSubSeats, subMonthlyPrice, setSubMonthlyPrice,
    subCurrency, setSubCurrency, subAutoRenew, setSubAutoRenew,
    subStartedAt, setSubStartedAt, subRenewsAt, setSubRenewsAt,
    subCancelledAt, setSubCancelledAt,
    onUpdateTenant, onDeleteTenant,
    onAddSubscription, onUpdateSubscriptionStatus, onDeleteSubscription,
    onAddContact, onUpdateContact, onDeleteContact,
    onAddNote, onDeleteNote,
    onAddInvoice, onUpdateInvoice, onDeleteInvoice,
    tenantInvoices = [],
}: Props) {
    const [tab, setTab] = useState<Tab>("profile");

    // Contact form
    const [contactForm, setContactForm] = useState(CONTACT_EMPTY);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);

    // Note form
    const [noteContent, setNoteContent] = useState("");
    const [noteCategory, setNoteCategory] = useState("general");

    // Invoice form
    const [invAmount, setInvAmount] = useState("");
    const [invDueAt, setInvDueAt] = useState("");
    const [invNotes, setInvNotes] = useState("");
    const [invSubId, setInvSubId] = useState("");

    const subscriptions = tenantDetail?.subscriptions ?? [];
    const contacts = tenantDetail?.contacts ?? [];
    const notes = tenantDetail?.notes ?? [];

    // Subscription DataTable
    const subscriptionColumns = [
        { data: "planName", title: "Plan" },
        {
            data: "status", title: "Status",
            render: (d: string) => `<span class="badge badge-${SUB_STATUS_COLOR[d] ?? "secondary"}">${d}</span>`,
        },
        { data: "seats", title: "Seats", className: "text-center" },
        {
            data: null, title: "Price",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, __: unknown, row: any) =>
                `${row.currency as string} ${(row.monthlyPrice as number).toFixed(2)}`,
        },
        {
            data: "autoRenew", title: "Auto Renew", className: "text-center",
            render: (d: boolean) =>
                d ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle text-muted"></i>',
        },
        { data: "startedAt", title: "Started", render: (d: string) => new Date(d).toLocaleDateString() },
        { data: "renewsAt", title: "Renews", render: (d: string | null) => d ? new Date(d).toLocaleDateString() : "—" },
        {
            data: null, title: "Actions", orderable: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, __: unknown, row: any) => {
                const sub = row as Subscription;
                let html = "";
                if (sub.status !== "active")
                    html += `<button class="btn btn-xs btn-outline-success mr-1" data-action="activate" data-id="${sub.id}"><i class="bi bi-check-lg"></i></button>`;
                if (sub.status !== "canceled")
                    html += `<button class="btn btn-xs btn-outline-warning mr-1" data-action="cancel" data-id="${sub.id}"><i class="bi bi-x-lg"></i></button>`;
                html += `<button class="btn btn-xs btn-outline-danger" data-action="delete" data-id="${sub.id}"><i class="bi bi-trash"></i></button>`;
                return html;
            },
        },
    ];

    const handleSubAction = useCallback(({ action, id }: DataTableAction) => {
        const sub = subscriptions.find(s => s.id === id);
        if (action === "activate" && sub) onUpdateSubscriptionStatus(sub, "active");
        else if (action === "cancel" && sub) onUpdateSubscriptionStatus(sub, "canceled");
        else if (action === "delete") onDeleteSubscription(id);
    }, [subscriptions, onUpdateSubscriptionStatus, onDeleteSubscription]);

    const startEditContact = (c: TenantContact) => {
        setContactForm({ name: c.name, title: c.title ?? "", email: c.email ?? "", phone: c.phone ?? "", isPrimary: c.isPrimary });
        setEditingContactId(c.id);
    };

    const submitContact = () => {
        if (!contactForm.name.trim()) return;
        if (editingContactId) {
            onUpdateContact(editingContactId, contactForm.name, contactForm.title, contactForm.email, contactForm.phone, contactForm.isPrimary);
        } else {
            onAddContact(contactForm.name, contactForm.title, contactForm.email, contactForm.phone, contactForm.isPrimary);
        }
        setContactForm(CONTACT_EMPTY);
        setEditingContactId(null);
    };

    const submitNote = () => {
        if (!noteContent.trim()) return;
        onAddNote(noteContent, noteCategory);
        setNoteContent("");
        setNoteCategory("general");
    };

    const submitInvoice = () => {
        const amount = Number(invAmount);
        if (!Number.isFinite(amount) || amount <= 0) return;
        onAddInvoice(amount, invDueAt, invNotes, invSubId);
        setInvAmount(""); setInvDueAt(""); setInvNotes(""); setInvSubId("");
    };

    const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

    if (!tenantDetail) {
        return (
            <div className="card shadow-sm">
                <div className="card-body text-center text-muted py-5">
                    <i className="bi bi-arrow-left-circle" style={{ fontSize: "3rem", opacity: 0.3 }} />
                    <p className="mt-3 mb-0">Select a tenant from the sidebar to view details.</p>
                </div>
            </div>
        );
    }

    const tabClass = (t: Tab) =>
        `nav-link ${tab === t ? "active font-weight-bold" : "text-muted"}`;

    return (
        <div>
            {/* Tenant header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h5 className="mb-0 font-weight-bold">
                        <i className="bi bi-building mr-2" style={{ color: "#2F4F4F" }} />
                        {tenantDetail.name}
                    </h5>
                    <small className="text-muted">
                        <code>{tenantDetail.slug}</code>
                        <span className={`badge badge-${tenantDetail.isActive ? "success" : "secondary"} ml-2`}>
                            {tenantDetail.isActive ? "Active" : "Inactive"}
                        </span>
                    </small>
                </div>
                {loadingTenantDetail && (
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="sr-only">Loading…</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                {([
                    ["profile", "bi-person-lines-fill", "Profile"],
                    ["subscriptions", "bi-collection-fill", `Subscriptions (${subscriptions.length})`],
                    ["invoices", "bi-receipt", `Invoices (${tenantInvoices.length})`],
                    ["contacts", "bi-people-fill", `Contacts (${contacts.length})`],
                    ["notes", "bi-sticky-fill", `Notes (${notes.length})`],
                ] as [Tab, string, string][]).map(([t, icon, label]) => (
                    <li key={t} className="nav-item">
                        <button className={tabClass(t)} onClick={() => setTab(t)} style={{ cursor: "pointer", background: "none", border: "none" }}>
                            <i className={`bi ${icon} mr-1`} />
                            {label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* ── Profile tab ────────────────────────────────────────────────────── */}
            {tab === "profile" && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group col-md-6">
                                <label className="small font-weight-bold">Tenant Name</label>
                                <input type="text" className="form-control" value={editTenantName}
                                    onChange={e => setEditTenantName(e.target.value)} />
                            </div>
                            <div className="form-group col-md-6">
                                <label className="small font-weight-bold">Slug</label>
                                <input type="text" className="form-control" value={editTenantSlug}
                                    onChange={e => setEditTenantSlug(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-check mb-3">
                            <input type="checkbox" className="form-check-input" id="edit-active"
                                checked={editTenantActive} onChange={e => setEditTenantActive(e.target.checked)} />
                            <label className="form-check-label" htmlFor="edit-active">Active tenant</label>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-primary" disabled={busy} onClick={onUpdateTenant}>
                                {busy && <span className="spinner-border spinner-border-sm mr-1" role="status" />}
                                <i className="bi bi-save mr-1" />Save
                            </button>
                            <button className="btn btn-outline-danger" disabled={busy} onClick={onDeleteTenant}>
                                <i className="bi bi-trash mr-1" />Delete Tenant
                            </button>
                        </div>
                        <hr />
                        <div className="row text-muted small">
                            <div className="col-md-6">
                                <strong>Created:</strong> {fmtDate(tenantDetail.createdAt)}
                            </div>
                            <div className="col-md-6">
                                <strong>Last updated:</strong> {fmtDate(tenantDetail.updatedAt)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Subscriptions tab ───────────────────────────────────────────────── */}
            {tab === "subscriptions" && (
                <div className="d-flex flex-column gap-3">
                    {/* Add Subscription form */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h6 className="mb-0 font-weight-bold"><i className="bi bi-plus-circle mr-2" />Add Subscription</h6>
                        </div>
                        <div className="card-body">
                            <div className="form-row">
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Plan</label>
                                    <input type="text" className="form-control" value={subPlanName}
                                        onChange={e => setSubPlanName(e.target.value)} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Status</label>
                                    <select className="form-control" value={subStatus} onChange={e => setSubStatus(e.target.value)}>
                                        {SUBSCRIPTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Seats</label>
                                    <input type="number" className="form-control" min="1" value={subSeats}
                                        onChange={e => setSubSeats(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Monthly Price</label>
                                    <input type="number" className="form-control" step="0.01" min="0" value={subMonthlyPrice}
                                        onChange={e => setSubMonthlyPrice(e.target.value)} />
                                </div>
                                <div className="form-group col-md-2">
                                    <label className="small font-weight-bold">Currency</label>
                                    <input type="text" className="form-control" maxLength={3} value={subCurrency}
                                        onChange={e => setSubCurrency(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Start Date</label>
                                    <input type="date" className="form-control" value={subStartedAt}
                                        onChange={e => setSubStartedAt(e.target.value)} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Renews At</label>
                                    <input type="date" className="form-control" value={subRenewsAt}
                                        onChange={e => setSubRenewsAt(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-check mb-3">
                                <input type="checkbox" className="form-check-input" id="sub-auto-renew"
                                    checked={subAutoRenew} onChange={e => setSubAutoRenew(e.target.checked)} />
                                <label className="form-check-label" htmlFor="sub-auto-renew">Auto renew</label>
                            </div>
                            <button className="btn btn-secondary" disabled={busy || !subPlanName.trim()} onClick={onAddSubscription}>
                                {busy && <span className="spinner-border spinner-border-sm mr-1" role="status" />}
                                <i className="bi bi-plus mr-1" />Add Subscription
                            </button>
                        </div>
                    </div>

                    {/* Subscription list */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h6 className="mb-0 font-weight-bold">
                                <i className="bi bi-collection mr-2" />Subscriptions
                                <span className="badge badge-secondary ml-2">{subscriptions.length}</span>
                            </h6>
                        </div>
                        <div className="card-body">
                            {subscriptions.length === 0 ? (
                                <p className="text-muted mb-0">No subscriptions yet.</p>
                            ) : (
                                <DataTable
                                    id="dt-subscriptions"
                                    columns={subscriptionColumns}
                                    data={subscriptions}
                                    onAction={handleSubAction}
                                    options={{ pageLength: 5, lengthMenu: [5, 10, 25] }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Invoices tab ────────────────────────────────────────────────────── */}
            {tab === "invoices" && (
                <div className="d-flex flex-column gap-3">
                    {/* Create Invoice form */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h6 className="mb-0 font-weight-bold"><i className="bi bi-plus-circle mr-2" />Create Invoice</h6>
                        </div>
                        <div className="card-body">
                            <div className="form-row">
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Amount ($) *</label>
                                    <input type="number" min="0" step="0.01" className="form-control" value={invAmount}
                                        onChange={e => setInvAmount(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Due Date</label>
                                    <input type="date" className="form-control" value={invDueAt}
                                        onChange={e => setInvDueAt(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Linked Subscription</label>
                                    <select className="form-control" value={invSubId} onChange={e => setInvSubId(e.target.value)}>
                                        <option value="">— None —</option>
                                        {subscriptions.map(s => (
                                            <option key={s.id} value={s.id}>{s.planName} ({s.status})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Notes</label>
                                    <input className="form-control" value={invNotes} onChange={e => setInvNotes(e.target.value)} />
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-sm" disabled={busy || !invAmount} onClick={submitInvoice}>
                                <i className="bi bi-plus mr-1" />Create Invoice
                            </button>
                        </div>
                    </div>

                    {/* Invoice list */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h6 className="mb-0 font-weight-bold">
                                <i className="bi bi-receipt mr-2" />Invoices
                                <span className="badge badge-secondary ml-2">{tenantInvoices.length}</span>
                            </h6>
                        </div>
                        <div className="card-body p-0">
                            {tenantInvoices.length === 0 ? (
                                <p className="text-muted p-3 mb-0">No invoices yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th>Invoice #</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Issued</th>
                                                <th>Due</th>
                                                <th>Paid</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tenantInvoices.map(inv => (
                                                <tr key={inv.id}>
                                                    <td><code>{inv.invoiceNumber}</code></td>
                                                    <td className="font-weight-bold">${inv.amount.toFixed(2)}</td>
                                                    <td><span className={`badge badge-${INV_STATUS_COLOR[inv.status] ?? "secondary"}`}>{inv.status}</span></td>
                                                    <td>{fmtDate(inv.issuedAt)}</td>
                                                    <td>{fmtDate(inv.dueAt)}</td>
                                                    <td>{fmtDate(inv.paidAt)}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            {(inv.status === "sent" || inv.status === "overdue") && (
                                                                <button className="btn btn-xs btn-outline-success" disabled={busy}
                                                                    onClick={() => onUpdateInvoice(inv.id, { status: "paid", paidAt: new Date().toISOString(), paidAtSet: true })}
                                                                    title="Mark Paid">
                                                                    <i className="bi bi-check2-circle" />
                                                                </button>
                                                            )}
                                                            {inv.status === "draft" && (
                                                                <button className="btn btn-xs btn-outline-primary" disabled={busy}
                                                                    onClick={() => onUpdateInvoice(inv.id, { status: "sent" })}
                                                                    title="Send">
                                                                    <i className="bi bi-send" />
                                                                </button>
                                                            )}
                                                            <button className="btn btn-xs btn-outline-danger" disabled={busy}
                                                                onClick={() => onDeleteInvoice(inv.id)}>
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
                    </div>
                </div>
            )}

            {/* ── Contacts tab ────────────────────────────────────────────────────── */}
            {tab === "contacts" && (
                <div className="d-flex flex-column gap-3">
                    {/* Contact form */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h6 className="mb-0 font-weight-bold">
                                <i className="bi bi-person-plus-fill mr-2" />
                                {editingContactId ? "Edit Contact" : "Add Contact"}
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="form-row">
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Name *</label>
                                    <input className="form-control form-control-sm" value={contactForm.name}
                                        onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Title</label>
                                    <input className="form-control form-control-sm" value={contactForm.title}
                                        onChange={e => setContactForm(f => ({ ...f, title: e.target.value }))} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Email</label>
                                    <input type="email" className="form-control form-control-sm" value={contactForm.email}
                                        onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label className="small font-weight-bold">Phone</label>
                                    <input className="form-control form-control-sm" value={contactForm.phone}
                                        onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-check mb-3">
                                <input type="checkbox" className="form-check-input" id="contact-primary"
                                    checked={contactForm.isPrimary}
                                    onChange={e => setContactForm(f => ({ ...f, isPrimary: e.target.checked }))} />
                                <label className="form-check-label small" htmlFor="contact-primary">Primary contact</label>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary btn-sm" disabled={busy || !contactForm.name.trim()} onClick={submitContact}>
                                    {busy && <span className="spinner-border spinner-border-sm mr-1" role="status" />}
                                    {editingContactId ? "Save" : "Add Contact"}
                                </button>
                                {editingContactId && (
                                    <button className="btn btn-secondary btn-sm"
                                        onClick={() => { setContactForm(CONTACT_EMPTY); setEditingContactId(null); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact list */}
                    {contacts.length === 0 ? (
                        <div className="card shadow-sm">
                            <div className="card-body text-center text-muted py-4">No contacts yet.</div>
                        </div>
                    ) : (
                        <div className="card shadow-sm">
                            <div className="list-group list-group-flush">
                                {contacts.map((c: TenantContact) => (
                                    <div key={c.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="font-weight-bold">
                                                {c.name}
                                                {c.isPrimary && <span className="badge badge-primary ml-2 small">Primary</span>}
                                            </div>
                                            <div className="small text-muted">
                                                {c.title && <span className="mr-2">{c.title}</span>}
                                                {c.email && <><i className="bi bi-envelope mr-1" />{c.email}</>}
                                                {c.phone && <><span className="mx-2">·</span><i className="bi bi-telephone mr-1" />{c.phone}</>}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-xs btn-outline-secondary" disabled={busy}
                                                onClick={() => startEditContact(c)}>
                                                <i className="bi bi-pencil" />
                                            </button>
                                            <button className="btn btn-xs btn-outline-danger" disabled={busy}
                                                onClick={() => onDeleteContact(c.id)}>
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Notes tab ───────────────────────────────────────────────────────── */}
            {tab === "notes" && (
                <div className="d-flex flex-column gap-3">
                    {/* Add note form */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h6 className="mb-0 font-weight-bold"><i className="bi bi-plus-circle mr-2" />Add Note</h6>
                        </div>
                        <div className="card-body">
                            <div className="form-row">
                                <div className="form-group col-md-3">
                                    <label className="small font-weight-bold">Category</label>
                                    <select className="form-control form-control-sm" value={noteCategory}
                                        onChange={e => setNoteCategory(e.target.value)}>
                                        {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-md-9">
                                    <label className="small font-weight-bold">Note *</label>
                                    <textarea className="form-control form-control-sm" rows={2} value={noteContent}
                                        onChange={e => setNoteContent(e.target.value)}
                                        placeholder="Add a note about this tenant..." />
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-sm" disabled={busy || !noteContent.trim()} onClick={submitNote}>
                                <i className="bi bi-sticky mr-1" />Add Note
                            </button>
                        </div>
                    </div>

                    {/* Note list */}
                    {notes.length === 0 ? (
                        <div className="card shadow-sm">
                            <div className="card-body text-center text-muted py-4">No notes yet.</div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {notes.map((n: TenantNote) => (
                                <div key={n.id} className="card shadow-sm">
                                    <div className="card-body py-2 px-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <p className="mb-1">{n.content}</p>
                                                <small className="text-muted">
                                                    {n.category && <span className="badge badge-light text-dark border mr-2">{n.category}</span>}
                                                    {n.createdBy && <><i className="bi bi-person mr-1" />{n.createdBy} · </>}
                                                    {fmtDate(n.createdAt)}
                                                </small>
                                            </div>
                                            <button className="btn btn-xs btn-outline-danger ml-2" disabled={busy}
                                                onClick={() => onDeleteNote(n.id)}>
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
