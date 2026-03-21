import { useState } from "react";
import { WorkflowsView } from "./WorkflowsView";
import { MicroAppsView } from "./MicroAppsView";
import { AppSuitesView } from "./AppSuitesView";

type Tab = "builder" | "apps" | "suites" | "workflows";

function ModuleCard({ icon, title, description, available }: { icon: string; title: string; description: string; available?: boolean }) {
    return (
        <div className={`card h-100 ${available ? "border-success" : "border-secondary"}`}>
            <div className="card-body text-center py-3">
                <i className={`bi ${icon} display-6 d-block mb-2 ${available ? "text-success" : "text-muted"}`} />
                <h6 className="font-weight-bold mb-1" style={{ fontSize: "0.85rem" }}>{title}</h6>
                <p className="small text-muted mb-2" style={{ fontSize: "0.78rem" }}>{description}</p>
                {available ? (
                    <span className="badge badge-success" style={{ fontSize: "0.72rem" }}>Available</span>
                ) : (
                    <span className="badge badge-warning" style={{ fontSize: "0.72rem" }}>Coming Soon</span>
                )}
            </div>
        </div>
    );
}

export function AppDesignerView() {
    const [tab, setTab] = useState<Tab>("builder");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-grid-1x2-fill mr-2 text-primary" />
                        App Designer
                    </h4>
                    <small className="text-muted">
                        Build, version, and deploy custom applications to clients using modules, workflows, and templates.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "builder" ? "active" : ""}`}
                        onClick={() => setTab("builder")}
                    >
                        <i className="bi bi-tools mr-1" />
                        App Builder
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "apps" ? "active" : ""}`}
                        onClick={() => setTab("apps")}
                    >
                        <i className="bi bi-grid-3x3-gap-fill mr-1" />
                        Micro Apps
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "suites" ? "active" : ""}`}
                        onClick={() => setTab("suites")}
                    >
                        <i className="bi bi-collection-fill mr-1" />
                        App Suites
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "workflows" ? "active" : ""}`}
                        onClick={() => setTab("workflows")}
                    >
                        <i className="bi bi-diagram-3-fill mr-1" />
                        Workflows
                    </button>
                </li>
            </ul>

            {tab === "builder" && (
                <div>
                    <div className="alert alert-info mb-4">
                        <i className="bi bi-info-circle-fill mr-2" />
                        The App Builder lets you design custom applications using a drag-and-drop interface, combining
                        modules into versioned app bundles that can be sold and deployed to client tenants.
                        Each app gets its own URL managed from here — clients access the app directly at that URL with their login.
                    </div>

                    {/* Drag-drop canvas stub */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 font-weight-bold">
                                <i className="bi bi-pencil-square mr-2" />
                                Visual App Designer
                            </h6>
                            <div>
                                <button className="btn btn-outline-secondary btn-sm mr-2" disabled>
                                    <i className="bi bi-clock-history mr-1" />Versions
                                </button>
                                <button className="btn btn-primary btn-sm" disabled>
                                    <i className="bi bi-cloud-upload mr-1" />Publish
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div
                                className="d-flex align-items-center justify-content-center text-muted"
                                style={{
                                    minHeight: "320px",
                                    background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)",
                                    borderRadius: "0 0 4px 4px",
                                }}
                            >
                                <div className="text-center py-5">
                                    <i className="bi bi-layout-wtf display-1 d-block mb-3 text-muted" style={{ opacity: 0.4 }} />
                                    <h5 className="font-weight-bold text-muted">Drag-and-Drop App Builder</h5>
                                    <p className="text-muted mb-4" style={{ maxWidth: 400 }}>
                                        Drop modules onto the canvas to compose your application.
                                        Arrange, configure, and connect modules to define the app's structure.
                                    </p>
                                    <span className="badge badge-warning px-4 py-2" style={{ fontSize: "0.9rem" }}>
                                        <i className="bi bi-hammer mr-1" /> Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module palette */}
                    <div className="card shadow-sm">
                        <div className="card-header font-weight-bold">
                            <i className="bi bi-boxes mr-2" />
                            Available Modules
                            <small className="text-muted ml-2 font-weight-normal">
                                — mix and match to build your application
                            </small>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-calendar-check"
                                        title="Scheduling"
                                        description="Calendars, bookings, and shift management."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-kanban"
                                        title="Task Tracking"
                                        description="Kanban boards, assignments, due dates, and priorities."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-chat-left-dots"
                                        title="Forum"
                                        description="Discussion boards, threads, and replies."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-chat-dots-fill"
                                        title="Messaging"
                                        description="Real-time direct messaging and group channels."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-check2-square"
                                        title="Checklists"
                                        description="Reusable checklists, SOP procedures, and completion tracking."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-boxes"
                                        title="Inventory"
                                        description="Item tracking, stock levels, and location management."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-diagram-3"
                                        title="Workflow Engine"
                                        description="Multi-step approval and process workflows."
                                        available
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-person-badge"
                                        title="Directory"
                                        description="Staff/member directory with roles and profiles."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-file-earmark-text"
                                        title="Document Vault"
                                        description="Secure file storage and document sharing."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-graph-up"
                                        title="Reporting"
                                        description="Custom dashboards and report generation."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-map"
                                        title="Map / GIS"
                                        description="Location-based views and field operations."
                                    />
                                </div>
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <ModuleCard
                                        icon="bi-bell"
                                        title="Notifications"
                                        description="Email, SMS, and in-app alert routing."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === "apps"      && <MicroAppsView />}
            {tab === "suites"    && <AppSuitesView />}
            {tab === "workflows" && <WorkflowsView />}
        </div>
    );
}
