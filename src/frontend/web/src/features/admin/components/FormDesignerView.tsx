import { useState } from "react";

type Tab = "forms" | "packages";

function ComingSoonCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="card border-secondary h-100">
            <div className="card-body text-center py-4 text-muted">
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

const EXAMPLE_FORMS = [
    { name: "Non-Disclosure Agreement (NDA)", category: "Legal", status: "Draft", version: "v1.0", updated: "2026-03-21" },
    { name: "Service Agreement", category: "Legal", status: "Draft", version: "v1.0", updated: "2026-03-21" },
    { name: "Client Onboarding Questionnaire", category: "Onboarding", status: "Draft", version: "v1.0", updated: "2026-03-21" },
    { name: "Change Order Request", category: "Operations", status: "Draft", version: "v1.0", updated: "2026-03-21" },
    { name: "Project Acceptance Sign-Off", category: "Operations", status: "Draft", version: "v1.0", updated: "2026-03-21" },
];

export function FormDesignerView() {
    const [tab, setTab] = useState<Tab>("forms");

    return (
        <div>
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
                    <button
                        className={`nav-link ${tab === "forms" ? "active" : ""}`}
                        onClick={() => setTab("forms")}
                    >
                        <i className="bi bi-file-earmark-text mr-1" />
                        Forms Library
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "packages" ? "active" : ""}`}
                        onClick={() => setTab("packages")}
                    >
                        <i className="bi bi-archive mr-1" />
                        Form Packages
                    </button>
                </li>
            </ul>

            {tab === "forms" && (
                <div>
                    <div className="alert alert-info mb-3">
                        <i className="bi bi-info-circle-fill mr-2" />
                        Build and manage electronic forms with full version control. Send forms to clients for e-signature
                        or include them in documentation packages.
                    </div>

                    <div className="card shadow-sm mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 font-weight-bold">
                                <i className="bi bi-collection mr-2" />
                                Form Library
                            </h6>
                            <button className="btn btn-primary btn-sm" disabled title="Coming soon">
                                <i className="bi bi-plus mr-1" />New Form
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="thead-light">
                                    <tr>
                                        <th>Form Name</th>
                                        <th>Category</th>
                                        <th>Version</th>
                                        <th>Status</th>
                                        <th>Last Updated</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {EXAMPLE_FORMS.map(form => (
                                        <tr key={form.name}>
                                            <td>
                                                <i className="bi bi-file-earmark-text mr-2 text-muted" />
                                                {form.name}
                                            </td>
                                            <td>
                                                <span className="badge badge-secondary">{form.category}</span>
                                            </td>
                                            <td>
                                                <span className="badge badge-info">{form.version}</span>
                                            </td>
                                            <td>
                                                <span className="badge badge-warning">{form.status}</span>
                                            </td>
                                            <td className="text-muted small">{form.updated}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-secondary" disabled title="Coming soon">
                                                    <i className="bi bi-pencil" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer text-center text-muted small py-3">
                            <i className="bi bi-hammer mr-1" />
                            Form editor and e-signature integration — coming soon.
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <ComingSoonCard
                                icon="bi-clock-history"
                                title="Version Control"
                                description="Track every revision of each form with the ability to compare versions, restore prior versions, and lock published versions."
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <ComingSoonCard
                                icon="bi-pen"
                                title="E-Signature Integration"
                                description="Send forms directly to clients for electronic signature with audit trail and timestamp verification."
                            />
                        </div>
                    </div>
                </div>
            )}

            {tab === "packages" && (
                <div>
                    <div className="alert alert-info mb-4">
                        <i className="bi bi-info-circle-fill mr-2" />
                        Bundle multiple forms into a package and assign them to a client onboarding flow or service tier.
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <ComingSoonCard
                                icon="bi-archive-fill"
                                title="Package Builder"
                                description="Drag and drop forms into named packages (e.g., 'New Client Onboarding', 'Contract Renewal') and assign them to clients or subscription tiers."
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <ComingSoonCard
                                icon="bi-send-check"
                                title="Package Delivery"
                                description="Deliver form packages to clients via a secure link, track completion status, and receive notifications when all forms are signed."
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
