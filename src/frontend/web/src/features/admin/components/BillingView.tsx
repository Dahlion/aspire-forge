import { useEffect, useRef, useState } from "react";
import type { Invoice } from "../../../types/admin";
import { INVOICE_STATUSES } from "../api";

type Props = {
    invoices: Invoice[];
    loadingInvoices: boolean;
    busy: boolean;
    onUpdateInvoice: (invoiceId: string, input: { status?: string; paidAt?: string | null; paidAtSet?: boolean; notes?: string | null }) => void;
    onDeleteInvoice: (invoiceId: string) => void;
};

const STATUS_BADGE: Record<string, string> = {
    draft: "secondary",
    sent: "primary",
    paid: "success",
    overdue: "danger",
    void: "dark",
};

export function BillingView({ invoices, loadingInvoices, busy, onUpdateInvoice, onDeleteInvoice }: Props) {
    const [filterStatus, setFilterStatus] = useState("");
    const tableRef = useRef<HTMLTableElement>(null);
    const dtRef = useRef<unknown>(null);

    const filtered = filterStatus ? invoices.filter(i => i.status === filterStatus) : invoices;

    const fmt = (amount: number, currency: string) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

    const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

    useEffect(() => {
        const $ = (window as unknown as { $?: (...args: unknown[]) => unknown }).$;
        if (!$ || !tableRef.current || filtered.length === 0) return;

        if (dtRef.current) {
            (dtRef.current as { destroy: (b: boolean) => void }).destroy(false);
            dtRef.current = null;
        }

        dtRef.current = $(tableRef.current).DataTable({
            pageLength: 15,
            order: [[4, "desc"]],
            responsive: true,
            columnDefs: [{ orderable: false, targets: -1 }],
        });

        return () => {
            if (dtRef.current) {
                (dtRef.current as { destroy: (b: boolean) => void }).destroy(false);
                dtRef.current = null;
            }
        };
    }, [filtered]);

    const totalOutstanding = invoices
        .filter(i => i.status === "sent" || i.status === "overdue")
        .reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = invoices
        .filter(i => i.status === "paid")
        .reduce((sum, i) => sum + i.amount, 0);
    const overdueCount = invoices.filter(i => i.status === "overdue").length;

    const markPaid = (invoice: Invoice) => {
        onUpdateInvoice(invoice.id, {
            status: "paid",
            paidAt: new Date().toISOString(),
            paidAtSet: true,
        });
    };

    const markSent = (invoice: Invoice) => {
        onUpdateInvoice(invoice.id, { status: "sent" });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0">
                        <i className="bi bi-receipt mr-2" style={{ color: "#2F4F4F" }} />
                        Billing &amp; Invoices
                    </h4>
                    <small className="text-muted">Track invoices and payment status across all clients</small>
                </div>
            </div>

            {/* Summary cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Outstanding</div>
                            <div className="h4 font-weight-bold text-warning mb-0">${totalOutstanding.toLocaleString()}</div>
                            <small className="text-muted">Sent + overdue invoices</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Paid (all time)</div>
                            <div className="h4 font-weight-bold text-success mb-0">${totalPaid.toLocaleString()}</div>
                            <small className="text-muted">Collected revenue</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Overdue</div>
                            <div className={`h4 font-weight-bold ${overdueCount > 0 ? "text-danger" : "text-muted"} mb-0`}>
                                {overdueCount}
                            </div>
                            <small className="text-muted">Require attention</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="d-flex align-items-center mb-3 gap-2">
                <span className="small font-weight-bold text-muted mr-2">Filter:</span>
                <button
                    className={`btn btn-sm ${filterStatus === "" ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setFilterStatus("")}
                >All</button>
                {INVOICE_STATUSES.map(s => (
                    <button
                        key={s}
                        className={`btn btn-sm btn-${filterStatus === s ? STATUS_BADGE[s] : "outline-secondary"}`}
                        onClick={() => setFilterStatus(s === filterStatus ? "" : s)}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loadingInvoices ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"><span className="sr-only">Loading…</span></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-receipt" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No invoices found.</p>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table ref={tableRef} className="table table-sm table-hover mb-0">
                                <thead className="thead-light">
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Client</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Issued</th>
                                        <th>Due</th>
                                        <th>Paid</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(inv => (
                                        <tr key={inv.id}>
                                            <td><code>{inv.invoiceNumber}</code></td>
                                            <td>{inv.tenantName ?? <span className="text-muted">—</span>}</td>
                                            <td className="font-weight-bold">{fmt(inv.amount, inv.currency)}</td>
                                            <td>
                                                <span className={`badge badge-${STATUS_BADGE[inv.status] ?? "secondary"}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td>{fmtDate(inv.issuedAt)}</td>
                                            <td className={inv.status === "overdue" ? "text-danger font-weight-bold" : ""}>
                                                {fmtDate(inv.dueAt)}
                                            </td>
                                            <td>{fmtDate(inv.paidAt)}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    {inv.status === "draft" && (
                                                        <button className="btn btn-xs btn-outline-primary" disabled={busy}
                                                            onClick={() => markSent(inv)} title="Mark as Sent">
                                                            <i className="bi bi-send" />
                                                        </button>
                                                    )}
                                                    {(inv.status === "sent" || inv.status === "overdue") && (
                                                        <button className="btn btn-xs btn-outline-success" disabled={busy}
                                                            onClick={() => markPaid(inv)} title="Mark as Paid">
                                                            <i className="bi bi-check2-circle" />
                                                        </button>
                                                    )}
                                                    <button className="btn btn-xs btn-outline-danger" disabled={busy}
                                                        onClick={() => onDeleteInvoice(inv.id)} title="Delete">
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
