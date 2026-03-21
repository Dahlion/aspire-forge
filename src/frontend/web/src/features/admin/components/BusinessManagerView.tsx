import { useState } from "react";
import { BillingView } from "./BillingView";
import type { Invoice } from "../../../types/admin";

function uid() { return Math.random().toString(36).slice(2, 10); }

type Tab = "invoices" | "assets" | "reports";
type AssetSubTab = "assets" | "expenses";

// ——— Asset types ———
type AssetCategory = "Hardware" | "Software" | "Vehicle" | "Equipment" | "Subscription" | "Other";
type AssetStatus = "Active" | "Retired" | "Sold";
type Asset = { id: string; name: string; category: AssetCategory; value: number; acquiredAt: string; status: AssetStatus; notes: string; };

// ——— Expense types ———
type ExpenseCategory = "Software" | "Hardware" | "Office" | "Travel" | "Marketing" | "Professional Services" | "Utilities" | "Other";
type Expense = { id: string; vendor: string; category: ExpenseCategory; amount: number; date: string; notes: string; };

const ASSET_CATEGORIES: AssetCategory[] = ["Hardware", "Software", "Vehicle", "Equipment", "Subscription", "Other"];
const ASSET_STATUSES: AssetStatus[] = ["Active", "Retired", "Sold"];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Software", "Hardware", "Office", "Travel", "Marketing", "Professional Services", "Utilities", "Other"];

const ASSET_ICONS: Record<AssetCategory, string> = {
    Hardware: "bi-cpu",
    Software: "bi-code-square",
    Vehicle: "bi-truck",
    Equipment: "bi-tools",
    Subscription: "bi-arrow-repeat",
    Other: "bi-box",
};

const ASSET_STATUS_BADGE: Record<AssetStatus, string> = {
    Active: "success",
    Retired: "secondary",
    Sold: "warning",
};

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const fmtDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// ——— Empty forms ———
const emptyAsset = (): Omit<Asset, "id"> => ({
    name: "", category: "Hardware", value: 0, acquiredAt: new Date().toISOString().slice(0, 10), status: "Active", notes: "",
});
const emptyExpense = (): Omit<Expense, "id"> => ({
    vendor: "", category: "Software", amount: 0, date: new Date().toISOString().slice(0, 10), notes: "",
});

// ——— Assets sub-panel ———
function AssetsPanel() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyAsset());
    const [filterCategory, setFilterCategory] = useState<AssetCategory | "">("");

    const startCreate = () => { setForm(emptyAsset()); setEditingId(null); setShowForm(true); };
    const startEdit = (a: Asset) => {
        setForm({ name: a.name, category: a.category, value: a.value, acquiredAt: a.acquiredAt, status: a.status, notes: a.notes });
        setEditingId(a.id);
        setShowForm(true);
    };
    const cancelForm = () => { setShowForm(false); setEditingId(null); };

    const handleSave = () => {
        if (!form.name.trim()) return;
        if (editingId) {
            setAssets(as => as.map(a => a.id === editingId ? { ...form, id: editingId } : a));
        } else {
            setAssets(as => [...as, { ...form, id: uid() }]);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(emptyAsset());
    };

    const deleteAsset = (id: string) => setAssets(as => as.filter(a => a.id !== id));

    const activeAssets = assets.filter(a => a.status === "Active");
    const totalValue = activeAssets.reduce((s, a) => s + a.value, 0);
    const categories = [...new Set(assets.map(a => a.category))];

    const filtered = filterCategory ? assets.filter(a => a.category === filterCategory) : assets;

    return (
        <div>
            {/* Summary cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Total Asset Value</div>
                            <div className="h4 font-weight-bold mb-0">{fmtCurrency(totalValue)}</div>
                            <small className="text-muted">Active assets only</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Total Assets</div>
                            <div className="h4 font-weight-bold mb-0">{assets.length}</div>
                            <small className="text-muted">All statuses</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Categories</div>
                            <div className="h4 font-weight-bold mb-0">{categories.length}</div>
                            <small className="text-muted">Distinct categories</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Asset form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                        <strong>{editingId ? "Edit Asset" : "Add Asset"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row mb-2">
                            <div className="col-md-5">
                                <label className="small font-weight-bold">Asset Name *</label>
                                <input className="form-control form-control-sm" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="col-md-3">
                                <label className="small font-weight-bold">Category</label>
                                <select className="form-control form-control-sm" value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as AssetCategory }))}>
                                    {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Status</label>
                                <select className="form-control form-control-sm" value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as AssetStatus }))}>
                                    {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Value ($)</label>
                                <input type="number" min="0" className="form-control form-control-sm" value={form.value}
                                    onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Acquired Date</label>
                                <input type="date" className="form-control form-control-sm" value={form.acquiredAt}
                                    onChange={e => setForm(f => ({ ...f, acquiredAt: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">Notes</label>
                            <textarea className="form-control form-control-sm" rows={2} value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.name.trim()}>
                                {editingId ? "Save Changes" : "Add Asset"}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelForm}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header + button */}
            {!showForm && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="small font-weight-bold text-muted">Category:</span>
                        <button className={`btn btn-sm ${filterCategory === "" ? "btn-dark" : "btn-outline-secondary"}`}
                            onClick={() => setFilterCategory("")}>All</button>
                        {ASSET_CATEGORIES.map(c => (
                            <button key={c} className={`btn btn-sm ${filterCategory === c ? "btn-dark" : "btn-outline-secondary"}`}
                                onClick={() => setFilterCategory(filterCategory === c ? "" : c)}>
                                <i className={`bi ${ASSET_ICONS[c]} mr-1`} />{c}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={startCreate}>
                        <i className="bi bi-plus mr-1" />Add Asset
                    </button>
                </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-building-check" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No assets logged yet.</p>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Asset Name</th>
                                    <th>Category</th>
                                    <th>Value</th>
                                    <th>Acquired</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <i className={`bi ${ASSET_ICONS[a.category]} mr-2 text-muted`} />
                                            {a.name}
                                        </td>
                                        <td><span className="badge badge-secondary">{a.category}</span></td>
                                        <td className="font-weight-bold">{fmtCurrency(a.value)}</td>
                                        <td className="small text-muted">{fmtDate(a.acquiredAt)}</td>
                                        <td>
                                            <span className={`badge badge-${ASSET_STATUS_BADGE[a.status]}`}>{a.status}</span>
                                        </td>
                                        <td className="small text-muted" style={{ maxWidth: 180 }}>
                                            <span title={a.notes}>{a.notes.length > 40 ? a.notes.slice(0, 40) + "…" : a.notes}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-xs btn-outline-secondary" onClick={() => startEdit(a)}>
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button className="btn btn-xs btn-outline-danger" onClick={() => deleteAsset(a.id)}>
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
            )}
        </div>
    );
}

// ——— Expenses sub-panel ———
function ExpensesPanel() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyExpense());
    const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "">("");

    const startCreate = () => { setForm(emptyExpense()); setEditingId(null); setShowForm(true); };
    const startEdit = (e: Expense) => {
        setForm({ vendor: e.vendor, category: e.category, amount: e.amount, date: e.date, notes: e.notes });
        setEditingId(e.id);
        setShowForm(true);
    };
    const cancelForm = () => { setShowForm(false); setEditingId(null); };

    const handleSave = () => {
        if (!form.vendor.trim()) return;
        if (editingId) {
            setExpenses(es => es.map(e => e.id === editingId ? { ...form, id: editingId } : e));
        } else {
            setExpenses(es => [...es, { ...form, id: uid() }]);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(emptyExpense());
    };

    const deleteExpense = (id: string) => setExpenses(es => es.filter(e => e.id !== id));

    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
    const thisMonthKey = new Date().toISOString().slice(0, 7);
    const totalThisMonth = expenses.filter(e => e.date.slice(0, 7) === thisMonthKey).reduce((s, e) => s + e.amount, 0);

    const filtered = filterCategory ? expenses.filter(e => e.category === filterCategory) : expenses;
    const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

    return (
        <div>
            {/* Summary cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Total Logged</div>
                            <div className="h4 font-weight-bold mb-0">{fmtCurrency(totalAll)}</div>
                            <small className="text-muted">All time</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">This Month</div>
                            <div className="h4 font-weight-bold mb-0">{fmtCurrency(totalThisMonth)}</div>
                            <small className="text-muted">{new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Currently Showing</div>
                            <div className="h4 font-weight-bold mb-0">{fmtCurrency(totalFiltered)}</div>
                            <small className="text-muted">{filterCategory || "All categories"}</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Log expense form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                        <strong>{editingId ? "Edit Expense" : "Log Expense"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Vendor / Payee *</label>
                                    <input className="form-control form-control-sm" value={form.vendor}
                                        onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
                                </div>
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Notes</label>
                                    <textarea className="form-control form-control-sm" rows={3} value={form.notes}
                                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Category</label>
                                    <select className="form-control form-control-sm" value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Amount ($)</label>
                                    <input type="number" min="0" step="0.01" className="form-control form-control-sm" value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
                                </div>
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Date</label>
                                    <input type="date" className="form-control form-control-sm" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.vendor.trim()}>
                                {editingId ? "Save Changes" : "Log Expense"}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelForm}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header + button */}
            {!showForm && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="small font-weight-bold text-muted">Category:</span>
                        <button className={`btn btn-sm ${filterCategory === "" ? "btn-dark" : "btn-outline-secondary"}`}
                            onClick={() => setFilterCategory("")}>All</button>
                        {EXPENSE_CATEGORIES.map(c => (
                            <button key={c} className={`btn btn-sm ${filterCategory === c ? "btn-dark" : "btn-outline-secondary"}`}
                                onClick={() => setFilterCategory(filterCategory === c ? "" : c as ExpenseCategory)}>
                                {c}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={startCreate}>
                        <i className="bi bi-plus mr-1" />Log Expense
                    </button>
                </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-cash-coin" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No expenses logged yet.</p>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Vendor</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(e => (
                                    <tr key={e.id}>
                                        <td className="font-weight-bold">{e.vendor}</td>
                                        <td><span className="badge badge-secondary">{e.category}</span></td>
                                        <td>{fmtCurrency(e.amount)}</td>
                                        <td className="small text-muted">{fmtDate(e.date)}</td>
                                        <td className="small text-muted" style={{ maxWidth: 200 }}>
                                            {e.notes.length > 50 ? e.notes.slice(0, 50) + "…" : e.notes}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-xs btn-outline-secondary" onClick={() => startEdit(e)}>
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button className="btn btn-xs btn-outline-danger" onClick={() => deleteExpense(e.id)}>
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
            )}
        </div>
    );
}

// ——— Tax & Reports panel ———
function TaxReportsPanel({ invoices }: { invoices: Invoice[] }) {
    const paidInvoices = invoices.filter(i => i.status === "paid");
    const outstandingInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue");
    const overdueInvoices = invoices.filter(i => i.status === "overdue");

    const totalCollected = paidInvoices.reduce((s, i) => s + i.amount, 0);
    const totalOutstanding = outstandingInvoices.reduce((s, i) => s + i.amount, 0);
    const totalOverdue = overdueInvoices.reduce((s, i) => s + i.amount, 0);
    const collectionRate = invoices.length > 0
        ? Math.round((paidInvoices.length / invoices.length) * 100)
        : 0;

    // Monthly revenue — last 12 months
    const monthRevenue: Record<string, number> = {};
    paidInvoices.forEach(inv => {
        const key = (inv.paidAt ?? inv.issuedAt ?? "").slice(0, 7);
        if (key) monthRevenue[key] = (monthRevenue[key] ?? 0) + inv.amount;
    });
    const last12Months: string[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        last12Months.push(d.toISOString().slice(0, 7));
    }
    const monthRows = last12Months.reverse().map(k => ({
        key: k,
        label: new Date(k + "-02").toLocaleString("en-US", { month: "long", year: "numeric" }),
        revenue: monthRevenue[k] ?? 0,
    }));
    const maxRevenue = Math.max(...monthRows.map(r => r.revenue), 1);

    // Top clients
    const clientTotals: Record<string, number> = {};
    paidInvoices.forEach(inv => {
        const name = inv.tenantName ?? "Unknown";
        clientTotals[name] = (clientTotals[name] ?? 0) + inv.amount;
    });
    const topClients = Object.entries(clientTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <div>
            {/* Summary row */}
            <div className="row mb-4">
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Total Collected</div>
                            <div className="h5 font-weight-bold text-success mb-0">{fmtCurrency(totalCollected)}</div>
                            <small className="text-muted">Paid invoices</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Outstanding</div>
                            <div className="h5 font-weight-bold text-warning mb-0">{fmtCurrency(totalOutstanding)}</div>
                            <small className="text-muted">Sent + overdue</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Overdue</div>
                            <div className="h5 font-weight-bold text-danger mb-0">{fmtCurrency(totalOverdue)}</div>
                            <small className="text-muted">{overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? "s" : ""}</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Collection Rate</div>
                            <div className="h5 font-weight-bold mb-0">{collectionRate}%</div>
                            <small className="text-muted">Paid / total invoices</small>
                        </div>
                    </div>
                </div>
            </div>

            {paidInvoices.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-graph-up-arrow" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No paid invoices yet. Revenue data will appear here once invoices are marked paid.</p>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {/* Monthly Revenue table */}
                    <div className="col-md-8 mb-4">
                        <div className="card shadow-sm">
                            <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                                <strong><i className="bi bi-bar-chart-line mr-2" />Monthly Revenue (Last 12 Months)</strong>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Month</th>
                                            <th>Revenue</th>
                                            <th style={{ width: "40%" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthRows.map(row => (
                                            <tr key={row.key}>
                                                <td className="small">{row.label}</td>
                                                <td className="font-weight-bold small">{fmtCurrency(row.revenue)}</td>
                                                <td>
                                                    {row.revenue > 0 && (
                                                        <div style={{
                                                            height: 14,
                                                            width: `${Math.round((row.revenue / maxRevenue) * 100)}%`,
                                                            background: "#1a3a4a",
                                                            borderRadius: 3,
                                                            minWidth: 4,
                                                        }} />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div className="col-md-4 mb-4">
                        <div className="card shadow-sm">
                            <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                                <strong><i className="bi bi-trophy mr-2" />Top Clients by Revenue</strong>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Client</th>
                                            <th>Collected</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topClients.map(([name, amount]) => (
                                            <tr key={name}>
                                                <td className="small">{name}</td>
                                                <td className="font-weight-bold small text-success">{fmtCurrency(amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ——— Main export ———
type BusinessManagerViewProps = {
    invoices: Invoice[];
    loadingInvoices: boolean;
    busy: boolean;
    onUpdateInvoice: Parameters<typeof BillingView>[0]["onUpdateInvoice"];
    onDeleteInvoice: Parameters<typeof BillingView>[0]["onDeleteInvoice"];
};

export function BusinessManagerView({
    invoices,
    loadingInvoices,
    busy,
    onUpdateInvoice,
    onDeleteInvoice,
}: BusinessManagerViewProps) {
    const [tab, setTab] = useState<Tab>("invoices");
    const [assetSubTab, setAssetSubTab] = useState<AssetSubTab>("assets");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-briefcase-fill mr-2 text-primary" />
                        Business Manager
                    </h4>
                    <small className="text-muted">
                        Track all financial and asset aspects of your business — invoices, expenses, assets, and reporting.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${tab === "invoices" ? "active" : ""}`} onClick={() => setTab("invoices")}>
                        <i className="bi bi-receipt mr-1" />Invoices
                        <span className="badge badge-secondary ml-2">{invoices.length}</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "assets" ? "active" : ""}`} onClick={() => setTab("assets")}>
                        <i className="bi bi-bank mr-1" />Assets &amp; Expenses
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>
                        <i className="bi bi-graph-up-arrow mr-1" />Tax &amp; Reports
                    </button>
                </li>
            </ul>

            {tab === "invoices" && (
                <BillingView
                    invoices={invoices}
                    loadingInvoices={loadingInvoices}
                    busy={busy}
                    onUpdateInvoice={onUpdateInvoice}
                    onDeleteInvoice={onDeleteInvoice}
                />
            )}

            {tab === "assets" && (
                <div>
                    {/* Nested pills for Assets vs Expenses */}
                    <ul className="nav nav-pills mb-4">
                        <li className="nav-item">
                            <button className={`nav-link ${assetSubTab === "assets" ? "active" : ""}`}
                                onClick={() => setAssetSubTab("assets")}>
                                <i className="bi bi-building-check mr-1" />Assets
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${assetSubTab === "expenses" ? "active" : ""}`}
                                onClick={() => setAssetSubTab("expenses")}>
                                <i className="bi bi-cash-coin mr-1" />Expenses
                            </button>
                        </li>
                    </ul>
                    {assetSubTab === "assets" && <AssetsPanel />}
                    {assetSubTab === "expenses" && <ExpensesPanel />}
                </div>
            )}

            {tab === "reports" && (
                <TaxReportsPanel invoices={invoices} />
            )}
        </div>
    );
}
