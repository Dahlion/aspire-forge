import { useState } from "react";
import { BillingView } from "./BillingView";
import type { Invoice } from "../../../types/admin";

type Tab = "invoices" | "assets" | "reports";

type BusinessManagerViewProps = {
    invoices: Invoice[];
    loadingInvoices: boolean;
    busy: boolean;
    onUpdateInvoice: Parameters<typeof BillingView>[0]["onUpdateInvoice"];
    onDeleteInvoice: Parameters<typeof BillingView>[0]["onDeleteInvoice"];
};

function ComingSoonPanel({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="card border-secondary">
            <div className="card-body text-center py-5 text-muted">
                <i className={`bi ${icon} display-4 d-block mb-3`} />
                <h6 className="font-weight-bold">{title}</h6>
                <p className="small mb-3">{description}</p>
                <span className="badge badge-warning px-3 py-2" style={{ fontSize: "0.85rem" }}>
                    <i className="bi bi-hammer mr-1" /> Coming Soon
                </span>
            </div>
        </div>
    );
}

export function BusinessManagerView({
    invoices,
    loadingInvoices,
    busy,
    onUpdateInvoice,
    onDeleteInvoice,
}: BusinessManagerViewProps) {
    const [tab, setTab] = useState<Tab>("invoices");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-briefcase-fill mr-2 text-primary" />
                        Business Manager
                    </h4>
                    <small className="text-muted">
                        Track all financial and asset aspects of Seacoast DevOps — invoices, expenses, assets, and reporting.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "invoices" ? "active" : ""}`}
                        onClick={() => setTab("invoices")}
                    >
                        <i className="bi bi-receipt mr-1" />
                        Invoices
                        <span className="badge badge-secondary ml-2">{invoices.length}</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "assets" ? "active" : ""}`}
                        onClick={() => setTab("assets")}
                    >
                        <i className="bi bi-bank mr-1" />
                        Assets &amp; Expenses
                        <span className="badge badge-warning ml-2">Soon</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "reports" ? "active" : ""}`}
                        onClick={() => setTab("reports")}
                    >
                        <i className="bi bi-graph-up-arrow mr-1" />
                        Tax &amp; Reports
                        <span className="badge badge-warning ml-2">Soon</span>
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
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <ComingSoonPanel
                            icon="bi-building-check"
                            title="Asset Tracking"
                            description="Track physical and digital assets owned by Seacoast DevOps — hardware, software licenses, subscriptions, and equipment — with depreciation and valuation."
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <ComingSoonPanel
                            icon="bi-cash-coin"
                            title="Expense Tracking"
                            description="Log and categorize business expenses (Quicken-style) with vendor, category, and receipt attachment support for simplified bookkeeping."
                        />
                    </div>
                </div>
            )}

            {tab === "reports" && (
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <ComingSoonPanel
                            icon="bi-file-earmark-bar-graph"
                            title="Tax Reports"
                            description="Generate P&amp;L statements, expense summaries, and tax-ready reports categorized by fiscal year and business category."
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <ComingSoonPanel
                            icon="bi-clipboard2-data"
                            title="Revenue Reports"
                            description="MRR trends, churn analysis, customer lifetime value, and ARR projections with export to CSV and PDF."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
