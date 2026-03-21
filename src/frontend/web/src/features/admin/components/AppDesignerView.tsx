import { useState } from "react";
import { WorkflowsView } from "./WorkflowsView";
import { MicroAppsView } from "./MicroAppsView";
import { AppSuitesView } from "./AppSuitesView";

function uid() { return Math.random().toString(36).slice(2, 10); }

function bumpVersion(v: string): string {
    const m = v.match(/^(v\d+\.)(\d+)$/);
    if (m) return `${m[1]}${parseInt(m[2]) + 1}`;
    return v + ".1";
}

// ——— Types ———
type ModuleType =
    | "scheduling" | "tasks" | "forum" | "messaging"
    | "checklists" | "inventory" | "workflow" | "directory"
    | "documents" | "reporting" | "maps" | "notifications";

type ConfigField = { key: string; label: string; placeholder: string };

type ModuleInfo = {
    icon: string;
    title: string;
    description: string;
    defaultConfig: Record<string, string>;
    configFields: ConfigField[];
};

const MODULE_REGISTRY: Record<ModuleType, ModuleInfo> = {
    scheduling: {
        icon: "bi-calendar-check", title: "Scheduling",
        description: "Calendars, bookings, and shift management.",
        defaultConfig: { sectionTitle: "Schedule", defaultView: "month" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Schedule" },
            { key: "defaultView", label: "Default View (month/week/day)", placeholder: "month" },
        ],
    },
    tasks: {
        icon: "bi-kanban", title: "Task Tracking",
        description: "Kanban boards, assignments, due dates, and priorities.",
        defaultConfig: { sectionTitle: "Tasks", columns: "To Do,In Progress,Done" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Tasks" },
            { key: "columns", label: "Board Columns (comma-separated)", placeholder: "To Do,In Progress,Done" },
        ],
    },
    forum: {
        icon: "bi-chat-left-dots", title: "Forum",
        description: "Discussion boards, threads, and replies.",
        defaultConfig: { sectionTitle: "Forum", categories: "General,Announcements,Support" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Forum" },
            { key: "categories", label: "Categories (comma-separated)", placeholder: "General,Announcements,Support" },
        ],
    },
    messaging: {
        icon: "bi-chat-dots-fill", title: "Messaging",
        description: "Real-time direct messaging and group channels.",
        defaultConfig: { sectionTitle: "Messages", defaultChannel: "General" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Messages" },
            { key: "defaultChannel", label: "Default Channel", placeholder: "General" },
        ],
    },
    checklists: {
        icon: "bi-check2-square", title: "Checklists",
        description: "Reusable checklists, SOP procedures, and completion tracking.",
        defaultConfig: { sectionTitle: "Checklists", defaultList: "Daily SOP" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Checklists" },
            { key: "defaultList", label: "Default Checklist Name", placeholder: "Daily SOP" },
        ],
    },
    inventory: {
        icon: "bi-boxes", title: "Inventory",
        description: "Item tracking, stock levels, and location management.",
        defaultConfig: { sectionTitle: "Inventory", categories: "Equipment,Supplies,Vehicles" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Inventory" },
            { key: "categories", label: "Item Categories (comma-separated)", placeholder: "Equipment,Supplies,Vehicles" },
        ],
    },
    workflow: {
        icon: "bi-diagram-3", title: "Workflow Engine",
        description: "Multi-step approval and process workflows.",
        defaultConfig: { sectionTitle: "Workflows", maxSteps: "10" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Workflows" },
            { key: "maxSteps", label: "Max Steps Per Workflow", placeholder: "10" },
        ],
    },
    directory: {
        icon: "bi-person-badge", title: "Directory",
        description: "Staff/member directory with roles and profiles.",
        defaultConfig: { sectionTitle: "Directory", fields: "Name,Role,Department,Phone,Email" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Directory" },
            { key: "fields", label: "Profile Fields (comma-separated)", placeholder: "Name,Role,Department,Phone,Email" },
        ],
    },
    documents: {
        icon: "bi-file-earmark-text", title: "Document Vault",
        description: "Secure file storage and document sharing.",
        defaultConfig: { sectionTitle: "Documents", folders: "General,Contracts,Reports" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Documents" },
            { key: "folders", label: "Top-Level Folders (comma-separated)", placeholder: "General,Contracts,Reports" },
        ],
    },
    reporting: {
        icon: "bi-graph-up", title: "Reporting",
        description: "Custom dashboards and report generation.",
        defaultConfig: { sectionTitle: "Reports", refreshInterval: "daily" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Reports" },
            { key: "refreshInterval", label: "Refresh Interval (hourly/daily/weekly)", placeholder: "daily" },
        ],
    },
    maps: {
        icon: "bi-map", title: "Map / GIS",
        description: "Location-based views and field operations.",
        defaultConfig: { sectionTitle: "Map", defaultZoom: "12" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Map" },
            { key: "defaultZoom", label: "Default Zoom Level (1–20)", placeholder: "12" },
        ],
    },
    notifications: {
        icon: "bi-bell", title: "Notifications",
        description: "Email, SMS, and in-app alert routing.",
        defaultConfig: { sectionTitle: "Notifications", channels: "email,in-app" },
        configFields: [
            { key: "sectionTitle", label: "Section Title", placeholder: "Notifications" },
            { key: "channels", label: "Channels (email, sms, in-app)", placeholder: "email,in-app" },
        ],
    },
};

type AppModule = {
    id: string;
    type: ModuleType;
    config: Record<string, string>;
};

type AppVersion = {
    versionNum: string;
    publishedAt: string;
    modules: AppModule[];
};

type DesignedApp = {
    id: string;
    name: string;
    description: string;
    version: string;
    status: "Draft" | "Published" | "Archived";
    primaryColor: string;
    iconClass: string;
    modules: AppModule[];
    versions: AppVersion[];
    updatedAt: string;
};

function makeModule(type: ModuleType): AppModule {
    return { id: uid(), type, config: { ...MODULE_REGISTRY[type].defaultConfig } };
}

const SEED_APPS: DesignedApp[] = [
    {
        id: uid(), name: "Client Portal Pro", version: "v2.0", status: "Published",
        description: "Self-service portal for clients to access documents, messaging, and alerts.",
        primaryColor: "#2F4F4F", iconClass: "bi-person-circle",
        updatedAt: "2026-03-10", versions: [],
        modules: [
            makeModule("documents"),
            makeModule("messaging"),
            makeModule("notifications"),
        ],
    },
    {
        id: uid(), name: "Field Operations Suite", version: "v1.3", status: "Published",
        description: "End-to-end solution for field crews — scheduling, task boards, checklists, and GPS mapping.",
        primaryColor: "#1a5276", iconClass: "bi-truck",
        updatedAt: "2026-03-15", versions: [],
        modules: [
            makeModule("scheduling"),
            makeModule("tasks"),
            makeModule("checklists"),
            makeModule("maps"),
        ],
    },
    {
        id: uid(), name: "Internal Team Hub", version: "v1.1", status: "Published",
        description: "Collaboration platform for internal staff — messaging, forums, directory, and workflows.",
        primaryColor: "#6c3483", iconClass: "bi-people-fill",
        updatedAt: "2026-03-18", versions: [],
        modules: [
            makeModule("messaging"),
            makeModule("forum"),
            makeModule("directory"),
            makeModule("workflow"),
        ],
    },
    {
        id: uid(), name: "Compliance Manager", version: "v0.8", status: "Draft",
        description: "Track regulatory compliance with document vault, checklists, reporting, and alerts.",
        primaryColor: "#784212", iconClass: "bi-shield-check",
        updatedAt: "2026-03-20", versions: [],
        modules: [
            makeModule("documents"),
            makeModule("checklists"),
            makeModule("reporting"),
            makeModule("notifications"),
        ],
    },
];

const ALL_MODULE_TYPES = Object.keys(MODULE_REGISTRY) as ModuleType[];
const STATUS_OPTIONS: DesignedApp["status"][] = ["Draft", "Published", "Archived"];

function statusVariant(s: DesignedApp["status"]) {
    return s === "Published" ? "success" : s === "Archived" ? "secondary" : "warning";
}

// ——— App Preview overlay ———
function AppPreview({ app, onClose }: { app: DesignedApp; onClose: () => void }) {
    const [activeModule, setActiveModule] = useState(app.modules[0]?.type ?? null);
    const current = app.modules.find(m => m.type === activeModule);
    const info = current ? MODULE_REGISTRY[current.type] : null;

    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}
        >
            <div
                className="card shadow"
                style={{ width: "100%", maxWidth: 780, height: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
                onClick={e => e.stopPropagation()}
            >
                {/* App top bar */}
                <div style={{ background: app.primaryColor, color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i className={`bi ${app.iconClass}`} style={{ fontSize: "1.3rem" }} />
                        <div>
                            <div className="font-weight-bold">{app.name}</div>
                            <small style={{ opacity: 0.8 }}>v{app.version} Preview</small>
                        </div>
                    </div>
                    <button className="btn btn-xs btn-outline-light" onClick={onClose}><i className="bi bi-x-lg" /></button>
                </div>

                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                    {/* Sidebar nav */}
                    <div style={{ width: 200, borderRight: "1px solid #dee2e6", background: "#f8f9fa", color: "#212529", overflowY: "auto" }}>
                        {app.modules.map(m => {
                            const mi = MODULE_REGISTRY[m.type];
                            return (
                                <button
                                    key={m.id}
                                    className={`btn btn-block text-left px-3 py-2 d-flex align-items-center border-0 rounded-0 ${activeModule === m.type ? "btn-primary" : "btn-light"}`}
                                    style={{ borderBottom: "1px solid #dee2e6", fontSize: "0.88rem" }}
                                    onClick={() => setActiveModule(m.type)}
                                >
                                    <i className={`bi ${mi.icon} mr-2`} style={{ width: 16 }} />
                                    {m.config.sectionTitle || mi.title}
                                </button>
                            );
                        })}
                        {app.modules.length === 0 && (
                            <div className="text-muted small text-center py-4">No modules</div>
                        )}
                    </div>

                    {/* Module content area */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
                        {!current || !info ? (
                            <div className="text-muted text-center py-5">
                                <i className="bi bi-grid" style={{ fontSize: "2rem", opacity: 0.3 }} />
                                <p className="mt-2">No module selected.</p>
                            </div>
                        ) : (
                            <div>
                                <h5 className="font-weight-bold mb-1">
                                    <i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />
                                    {current.config.sectionTitle || info.title}
                                </h5>
                                <p className="text-muted small mb-4">{info.description}</p>

                                {/* Module-type-specific mockup */}
                                {current.type === "tasks" && (
                                    <div className="row">
                                        {(current.config.columns || "To Do,In Progress,Done").split(",").map((col, i) => (
                                            <div key={i} className="col">
                                                <div className="card shadow-sm">
                                                    <div className="card-header py-2 px-3 font-weight-bold small" style={{ background: "#eee", color: "#212529" }}>{col.trim()}</div>
                                                    <div className="card-body p-2">
                                                        {[1, 2].map(n => (
                                                            <div key={n} className="border rounded p-2 mb-2 bg-white" style={{ fontSize: "0.82rem" }}>
                                                                Sample Task {n}
                                                                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Assigned · Due tomorrow</div>
                                                            </div>
                                                        ))}
                                                        <button className="btn btn-sm btn-outline-secondary w-100" disabled>+ Add card</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "scheduling" && (
                                    <div className="border rounded" style={{ height: 200, background: "#f8f9fa", color: "#212529", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <div className="text-center text-muted">
                                            <i className="bi bi-calendar3 d-block mb-2" style={{ fontSize: "2rem" }} />
                                            <div>{current.config.defaultView || "month"} view calendar</div>
                                        </div>
                                    </div>
                                )}
                                {current.type === "messaging" && (
                                    <div>
                                        <div className="border rounded p-3 mb-2 bg-light text-dark" style={{ fontSize: "0.85rem" }}>
                                            <strong>#{current.config.defaultChannel || "general"}</strong>
                                        </div>
                                        {["Alice: Hey team, update on the project?", "Bob: Looking good — should wrap up tomorrow.", "You: Perfect, I'll notify the client."].map((msg, i) => (
                                            <div key={i} className="border rounded p-2 mb-1" style={{ fontSize: "0.85rem", background: i === 2 ? "#e3f2fd" : "#fff", color: "#212529" }}>{msg}</div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "documents" && (
                                    <div>
                                        {(current.config.folders || "General,Contracts,Reports").split(",").map((folder, i) => (
                                            <div key={i} className="d-flex align-items-center border rounded p-2 mb-2" style={{ fontSize: "0.85rem" }}>
                                                <i className="bi bi-folder2-fill mr-2" style={{ color: "#f0ad4e" }} />
                                                {folder.trim()}
                                                <span className="badge badge-light text-dark border ml-auto">{Math.floor(Math.random() * 8) + 1} files</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "checklists" && (
                                    <div>
                                        <div className="font-weight-bold small mb-2">{current.config.defaultList || "Daily SOP"}</div>
                                        {["Open facility and check security log", "Verify equipment inventory", "Complete morning briefing", "Submit daily report"].map((item, i) => (
                                            <div key={i} className="form-check mb-2">
                                                <input type="checkbox" className="form-check-input" disabled defaultChecked={i < 2} />
                                                <label className="form-check-label small" style={{ textDecoration: i < 2 ? "line-through" : undefined, color: i < 2 ? "#999" : undefined }}>{item}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "forum" && (
                                    <div>
                                        {(current.config.categories || "General,Announcements,Support").split(",").map((cat, i) => (
                                            <div key={i} className="border rounded p-2 mb-2 d-flex align-items-center" style={{ fontSize: "0.85rem" }}>
                                                <i className="bi bi-chat-left-text mr-2 text-muted" />
                                                <div>
                                                    <div className="font-weight-bold">{cat.trim()}</div>
                                                    <small className="text-muted">{3 + i} threads · last post 2h ago</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "directory" && (
                                    <div>
                                        {["Alice Johnson — Project Manager", "Bob Smith — Field Technician", "Carol Davis — Admin"].map((p, i) => (
                                            <div key={i} className="d-flex align-items-center border rounded p-2 mb-2" style={{ fontSize: "0.85rem" }}>
                                                <div className="rounded-circle d-flex align-items-center justify-content-center mr-2"
                                                    style={{ width: 32, height: 32, background: "#1a3a4a", color: "#fff", fontSize: "0.8rem", flexShrink: 0 }}>
                                                    {p[0]}
                                                </div>
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "maps" && (
                                    <div className="border rounded d-flex align-items-center justify-content-center"
                                        style={{ height: 200, background: "linear-gradient(135deg,#d4edda,#c3e6cb)" }}>
                                        <div className="text-center text-muted">
                                            <i className="bi bi-map d-block mb-1" style={{ fontSize: "2rem" }} />
                                            Map view — zoom {current.config.defaultZoom || "12"}
                                        </div>
                                    </div>
                                )}
                                {current.type === "reporting" && (
                                    <div className="row">
                                        {["Active Users", "Tasks Closed", "Avg Response"].map((label, i) => (
                                            <div key={i} className="col-4">
                                                <div className="card shadow-sm text-center p-2">
                                                    <div className="h4 font-weight-bold mb-0">{[42, 138, "4.2h"][i]}</div>
                                                    <small className="text-muted">{label}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "notifications" && (
                                    <div>
                                        {["Task assigned to you by Alice", "New document uploaded in Contracts", "Workflow step approved — pending your action"].map((n, i) => (
                                            <div key={i} className="border rounded p-2 mb-2 d-flex align-items-start" style={{ fontSize: "0.85rem" }}>
                                                <i className="bi bi-bell-fill mr-2 text-warning" style={{ marginTop: 2 }} />
                                                {n}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "workflow" && (
                                    <div>
                                        {["Contract Review — Step 2 of 4 — Awaiting Legal", "Onboarding — Step 1 of 3 — New submission"].map((w, i) => (
                                            <div key={i} className="border rounded p-2 mb-2 d-flex align-items-center" style={{ fontSize: "0.85rem" }}>
                                                <i className="bi bi-diagram-3 mr-2 text-primary" />
                                                {w}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {current.type === "inventory" && (
                                    <div>
                                        {(current.config.categories || "Equipment,Supplies,Vehicles").split(",").map((cat, i) => (
                                            <div key={i} className="d-flex align-items-center border rounded p-2 mb-2" style={{ fontSize: "0.85rem" }}>
                                                <i className="bi bi-boxes mr-2 text-muted" />
                                                {cat.trim()}
                                                <span className="badge badge-light text-dark border ml-auto">{10 + i * 7} items</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ——— Version History overlay ———
function AppVersionHistory({ app, onClose }: { app: DesignedApp; onClose: () => void }) {
    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}
        >
            <div className="card shadow" style={{ width: "100%", maxWidth: 520, maxHeight: "75vh", overflowY: "auto" }}
                onClick={e => e.stopPropagation()}>
                <div className="card-header d-flex justify-content-between align-items-center"
                    style={{ background: "#1a3a4a", color: "#fff" }}>
                    <strong><i className="bi bi-clock-history mr-2" />{app.name} — Version History</strong>
                    <button className="btn btn-xs btn-outline-light" onClick={onClose}><i className="bi bi-x-lg" /></button>
                </div>
                <div className="card-body p-0">
                    {app.versions.length === 0 ? (
                        <div className="text-muted text-center py-4">
                            <i className="bi bi-clock-history d-block mb-2" style={{ fontSize: "1.5rem", opacity: 0.4 }} />
                            No version history. Versions are created when a Published app is saved.
                        </div>
                    ) : (
                        <table className="table table-sm mb-0">
                            <thead className="thead-light">
                                <tr><th>Version</th><th>Published</th><th>Modules</th></tr>
                            </thead>
                            <tbody>
                                <tr className="table-active">
                                    <td><span className="badge badge-primary">{app.version}</span> <small className="text-muted">(current)</small></td>
                                    <td className="small text-muted">{app.updatedAt}</td>
                                    <td className="small text-muted">{app.modules.length}</td>
                                </tr>
                                {[...app.versions].reverse().map(v => (
                                    <tr key={v.versionNum}>
                                        <td><span className="badge badge-info">{v.versionNum}</span></td>
                                        <td className="small text-muted">{v.publishedAt}</td>
                                        <td className="small text-muted">{v.modules.length}</td>
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

// ——— AppEditor inline card ———
function AppEditor({ initial, onSave, onCancel, onPreview }: {
    initial: DesignedApp;
    onSave: (app: DesignedApp) => void;
    onCancel: () => void;
    onPreview: (app: DesignedApp) => void;
}) {
    const [app, setApp] = useState<DesignedApp>({ ...initial, modules: initial.modules.map(m => ({ ...m, config: { ...m.config } })) });
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    const setMeta = (patch: Partial<DesignedApp>) => setApp(a => ({ ...a, ...patch }));
    const addModule = (type: ModuleType) => setApp(a => ({ ...a, modules: [...a.modules, makeModule(type)] }));
    const removeModule = (id: string) => setApp(a => ({ ...a, modules: a.modules.filter(m => m.id !== id) }));
    const moveModule = (idx: number, dir: -1 | 1) => setApp(a => {
        const mods = [...a.modules];
        const t = idx + dir;
        if (t < 0 || t >= mods.length) return a;
        [mods[idx], mods[t]] = [mods[t], mods[idx]];
        return { ...a, modules: mods };
    });
    const setModuleConfig = (id: string, key: string, val: string) =>
        setApp(a => ({ ...a, modules: a.modules.map(m => m.id === id ? { ...m, config: { ...m.config, [key]: val } } : m) }));

    const handleSave = () => {
        if (!app.name.trim()) return;
        onSave({ ...app, updatedAt: new Date().toISOString().slice(0, 10) });
    };

    const addedTypes = new Set(app.modules.map(m => m.type));

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex justify-content-between align-items-center"
                style={{ background: "#1a3a4a", color: "#fff" }}>
                <strong>
                    <i className="bi bi-pencil-square mr-2" />
                    {initial.name ? "Edit App" : "New App"}
                </strong>
                <div className="d-flex gap-2">
                    <button className="btn btn-xs btn-outline-light" onClick={() => onPreview(app)}>
                        <i className="bi bi-eye mr-1" />Preview
                    </button>
                    <button className="btn btn-xs btn-light" onClick={handleSave} disabled={!app.name.trim()}>
                        <i className="bi bi-floppy mr-1" />Save
                    </button>
                </div>
            </div>
            <div className="card-body">
                {/* Metadata */}
                <div className="row mb-3">
                    <div className="col-md-4">
                        <label className="small font-weight-bold">App Name *</label>
                        <input className="form-control form-control-sm" value={app.name}
                            onChange={e => setMeta({ name: e.target.value })} placeholder="App name" />
                    </div>
                    <div className="col-md-4">
                        <label className="small font-weight-bold">Description</label>
                        <input className="form-control form-control-sm" value={app.description}
                            onChange={e => setMeta({ description: e.target.value })} placeholder="Brief description" />
                    </div>
                    <div className="col-md-2">
                        <label className="small font-weight-bold">Status</label>
                        <select className="form-control form-control-sm" value={app.status}
                            onChange={e => setMeta({ status: e.target.value as DesignedApp["status"] })}>
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-md-1">
                        <label className="small font-weight-bold">Color</label>
                        <input type="color" className="form-control form-control-sm p-0" style={{ height: 31 }}
                            value={app.primaryColor} onChange={e => setMeta({ primaryColor: e.target.value })} />
                    </div>
                    <div className="col-md-1">
                        <label className="small font-weight-bold">Version</label>
                        <input className="form-control form-control-sm" value={app.version} readOnly
                            style={{ background: "#f8f9fa", color: "#212529" }} title="Auto-incremented when a Published app is saved" />
                    </div>
                </div>

                <div className="row">
                    {/* Module Palette */}
                    <div className="col-md-4">
                        <div className="font-weight-bold small mb-2">
                            <i className="bi bi-boxes mr-1" />Available Modules
                            <small className="text-muted font-weight-normal ml-1">— click to add</small>
                        </div>
                        <div style={{ maxHeight: 420, overflowY: "auto" }}>
                            {ALL_MODULE_TYPES.map(type => {
                                const info = MODULE_REGISTRY[type];
                                const added = addedTypes.has(type);
                                return (
                                    <button
                                        key={type}
                                        className={`btn btn-block text-left d-flex align-items-center p-2 mb-1 ${added ? "btn-light text-muted" : "btn-outline-primary"}`}
                                        style={{ fontSize: "0.85rem", borderRadius: 4 }}
                                        onClick={() => !added && addModule(type)}
                                        disabled={added}
                                        title={added ? "Already added" : info.description}
                                    >
                                        <i className={`bi ${info.icon} mr-2`} style={{ fontSize: "1rem", width: 20 }} />
                                        <span className="flex-grow-1">{info.title}</span>
                                        {added && <i className="bi bi-check2 text-success" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* App Canvas */}
                    <div className="col-md-8">
                        <div className="font-weight-bold small mb-2">
                            <i className="bi bi-layout-wtf mr-1" />App Canvas
                            <span className="badge badge-secondary ml-2">{app.modules.length} module{app.modules.length !== 1 ? "s" : ""}</span>
                        </div>
                        {app.modules.length === 0 ? (
                            <div className="border rounded text-center text-muted py-5" style={{ borderStyle: "dashed" }}>
                                <i className="bi bi-plus-circle d-block mb-2" style={{ fontSize: "1.5rem", opacity: 0.4 }} />
                                Select modules from the palette to build your app.
                            </div>
                        ) : (
                            <div style={{ maxHeight: 420, overflowY: "auto" }}>
                                {app.modules.map((mod, idx) => {
                                    const info = MODULE_REGISTRY[mod.type];
                                    const isExpanded = expandedModule === mod.id;
                                    return (
                                        <div key={mod.id} className="border rounded mb-2" style={{ background: "#f8f9fa", color: "#212529" }}>
                                            <div className="d-flex align-items-center p-2">
                                                <div className="d-flex flex-column mr-2" style={{ gap: 2 }}>
                                                    <button className="btn btn-xs btn-outline-secondary" disabled={idx === 0} onClick={() => moveModule(idx, -1)}>
                                                        <i className="bi bi-chevron-up" />
                                                    </button>
                                                    <button className="btn btn-xs btn-outline-secondary" disabled={idx === app.modules.length - 1} onClick={() => moveModule(idx, 1)}>
                                                        <i className="bi bi-chevron-down" />
                                                    </button>
                                                </div>
                                                <i className={`bi ${info.icon} mr-2 text-muted`} style={{ fontSize: "1.1rem" }} />
                                                <div className="flex-grow-1">
                                                    <div className="font-weight-bold" style={{ fontSize: "0.88rem" }}>
                                                        {mod.config.sectionTitle || info.title}
                                                    </div>
                                                    <small className="text-muted">{info.description}</small>
                                                </div>
                                                <div className="d-flex gap-1 ml-2">
                                                    <button className="btn btn-xs btn-outline-secondary"
                                                        onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                                                        title="Configure">
                                                        <i className={`bi bi-gear${isExpanded ? "-fill" : ""}`} />
                                                    </button>
                                                    <button className="btn btn-xs btn-outline-danger" onClick={() => removeModule(mod.id)}>
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="border-top px-3 py-2">
                                                    <div className="row">
                                                        {info.configFields.map(cf => (
                                                            <div key={cf.key} className="col-md-6 mb-2">
                                                                <label className="small text-muted mb-1">{cf.label}</label>
                                                                <input className="form-control form-control-sm"
                                                                    value={mod.config[cf.key] || ""}
                                                                    placeholder={cf.placeholder}
                                                                    onChange={e => setModuleConfig(mod.id, cf.key, e.target.value)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="card-footer d-flex gap-2 justify-content-end">
                <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!app.name.trim()}>
                    <i className="bi bi-floppy mr-1" />Save App
                </button>
            </div>
        </div>
    );
}

// ——— Builder Tab ———
function AppBuilderTab() {
    const [apps, setApps] = useState<DesignedApp[]>(SEED_APPS);
    const [editingApp, setEditingApp] = useState<DesignedApp | null>(null);
    const [previewApp, setPreviewApp] = useState<DesignedApp | null>(null);
    const [historyApp, setHistoryApp] = useState<DesignedApp | null>(null);

    const emptyApp = (): DesignedApp => ({
        id: uid(), name: "", description: "", version: "v1.0", status: "Draft",
        primaryColor: "#2F4F4F", iconClass: "bi-grid-1x2-fill", modules: [],
        versions: [], updatedAt: new Date().toISOString().slice(0, 10),
    });

    const saveApp = (app: DesignedApp) => {
        setApps(prev => {
            const existing = prev.find(x => x.id === app.id);
            if (existing && existing.status === "Published") {
                const snapshot: AppVersion = {
                    versionNum: existing.version,
                    publishedAt: existing.updatedAt,
                    modules: existing.modules.map(m => ({ ...m, config: { ...m.config } })),
                };
                const updated: DesignedApp = {
                    ...app,
                    version: bumpVersion(existing.version),
                    versions: [...(existing.versions || []), snapshot],
                    updatedAt: new Date().toISOString().slice(0, 10),
                };
                return prev.map(x => x.id === app.id ? updated : x);
            }
            const updated = { ...app, updatedAt: new Date().toISOString().slice(0, 10) };
            return existing ? prev.map(x => x.id === app.id ? updated : x) : [...prev, updated];
        });
        setEditingApp(null);
    };

    const deleteApp = (id: string) => {
        if (!window.confirm("Delete this app?")) return;
        setApps(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div>
            {previewApp && <AppPreview app={previewApp} onClose={() => setPreviewApp(null)} />}
            {historyApp && <AppVersionHistory app={historyApp} onClose={() => setHistoryApp(null)} />}

            <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle-fill mr-2" />
                Compose apps from modules, configure each section, and preview the result. Publishing creates a versioned snapshot.
                Each app can be delivered to client tenants via the <strong>Micro Apps</strong> tab.
            </div>

            {editingApp ? (
                <AppEditor
                    initial={editingApp}
                    onSave={saveApp}
                    onCancel={() => setEditingApp(null)}
                    onPreview={setPreviewApp}
                />
            ) : (
                <div className="card shadow-sm mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center"
                        style={{ background: "#1a3a4a", color: "#fff" }}>
                        <strong><i className="bi bi-collection mr-2" />App Library</strong>
                        <button className="btn btn-sm btn-light" onClick={() => setEditingApp(emptyApp())}>
                            <i className="bi bi-plus mr-1" />New App
                        </button>
                    </div>
                    {apps.length === 0 ? (
                        <div className="card-body text-center text-muted py-5">
                            <i className="bi bi-grid" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                            <p className="mt-3 mb-0">No apps yet. Click "New App" to start building.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm table-hover mb-0">
                                <thead className="thead-light">
                                    <tr>
                                        <th>App</th>
                                        <th>Modules</th>
                                        <th>Version</th>
                                        <th>Status</th>
                                        <th>Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apps.map(app => (
                                        <tr key={app.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="rounded d-flex align-items-center justify-content-center mr-2"
                                                        style={{ width: 28, height: 28, background: app.primaryColor, color: "#fff", fontSize: "0.85rem", flexShrink: 0 }}>
                                                        <i className={`bi ${app.iconClass}`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-weight-bold" style={{ fontSize: "0.9rem" }}>{app.name}</div>
                                                        {app.description && <div className="text-muted small">{app.description}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {app.modules.slice(0, 4).map(m => (
                                                        <span key={m.id} className="badge badge-light text-dark border" title={MODULE_REGISTRY[m.type].title}>
                                                            <i className={`bi ${MODULE_REGISTRY[m.type].icon}`} />
                                                        </span>
                                                    ))}
                                                    {app.modules.length > 4 && (
                                                        <span className="badge badge-secondary">+{app.modules.length - 4}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-info">{app.version}</span>
                                                {app.versions.length > 0 && (
                                                    <span className="badge badge-light text-dark border ml-1">{app.versions.length} prev</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${statusVariant(app.status)}`}>{app.status}</span>
                                            </td>
                                            <td className="text-muted small">{app.updatedAt}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <button className="btn btn-xs btn-outline-secondary" title="Preview"
                                                        onClick={() => setPreviewApp(app)}>
                                                        <i className="bi bi-eye" />
                                                    </button>
                                                    <button className="btn btn-xs btn-outline-secondary" title="Version History"
                                                        onClick={() => setHistoryApp(app)} disabled={app.versions.length === 0}>
                                                        <i className="bi bi-clock-history" />
                                                    </button>
                                                    <button className="btn btn-xs btn-outline-secondary" title="Edit"
                                                        onClick={() => setEditingApp({ ...app, modules: app.modules.map(m => ({ ...m, config: { ...m.config } })), versions: app.versions })}>
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    <button className="btn btn-xs btn-outline-danger" title="Delete"
                                                        onClick={() => deleteApp(app.id)}>
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

            {/* Module reference */}
            {!editingApp && (
                <div className="card shadow-sm">
                    <div className="card-header font-weight-bold" style={{ background: "#f8f9fa", color: "#212529" }}>
                        <i className="bi bi-boxes mr-2" />Available Modules
                        <small className="text-muted ml-2 font-weight-normal">— mix and match to build your application</small>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {ALL_MODULE_TYPES.map(type => {
                                const info = MODULE_REGISTRY[type];
                                return (
                                    <div key={type} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                        <div className="card h-100 border-secondary">
                                            <div className="card-body text-center py-3">
                                                <i className={`bi ${info.icon} d-block mb-2 text-muted`} style={{ fontSize: "1.5rem" }} />
                                                <h6 className="font-weight-bold mb-1" style={{ fontSize: "0.82rem" }}>{info.title}</h6>
                                                <p className="small text-muted mb-0" style={{ fontSize: "0.75rem" }}>{info.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ——— Main export ———
type Tab = "builder" | "apps" | "suites" | "workflows";

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
                    <button className={`nav-link ${tab === "builder" ? "active" : ""}`} onClick={() => setTab("builder")}>
                        <i className="bi bi-tools mr-1" />App Builder
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "apps" ? "active" : ""}`} onClick={() => setTab("apps")}>
                        <i className="bi bi-grid-3x3-gap-fill mr-1" />Micro Apps
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "suites" ? "active" : ""}`} onClick={() => setTab("suites")}>
                        <i className="bi bi-collection-fill mr-1" />App Suites
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "workflows" ? "active" : ""}`} onClick={() => setTab("workflows")}>
                        <i className="bi bi-diagram-3-fill mr-1" />Workflows
                    </button>
                </li>
            </ul>

            {tab === "builder"   && <AppBuilderTab />}
            {tab === "apps"      && <MicroAppsView />}
            {tab === "suites"    && <AppSuitesView />}
            {tab === "workflows" && <WorkflowsView />}
        </div>
    );
}
