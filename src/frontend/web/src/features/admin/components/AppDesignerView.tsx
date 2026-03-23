import { useState, useRef } from "react";
import { WorkflowsView } from "./WorkflowsView";
import { MicroAppsView } from "./MicroAppsView";
import { AppSuitesView } from "./AppSuitesView";

function uid() { return Math.random().toString(36).slice(2, 10); }

function bumpVersion(v: string): string {
    const m = v.match(/^(v\d+\.)(\d+)$/);
    if (m) return `${m[1]}${parseInt(m[2]) + 1}`;
    return v + ".1";
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ModuleType =
    | "scheduling" | "tasks" | "forum" | "messaging"
    | "checklists" | "inventory" | "workflow" | "directory"
    | "documents" | "reporting" | "maps" | "notifications";

type ConfigFieldKind = "text" | "select" | "toggle" | "number" | "textarea";
type ConfigField = {
    key: string; label: string; kind: ConfigFieldKind;
    placeholder?: string; options?: string[]; hint?: string;
};

type ModuleInfo = {
    icon: string; title: string; description: string;
    defaultConfig: Record<string, string>;
    configFields: ConfigField[];
};

type AppStatus = "Draft" | "Published" | "Archived";
type AppTheme = "light" | "dark";
type NavStyle = "sidebar" | "topnav";

type AppModule = { id: string; type: ModuleType; config: Record<string, string>; };
type AppVersion = { versionNum: string; publishedAt: string; modules: AppModule[]; };
type DesignedApp = {
    id: string; name: string; description: string; tagline: string;
    version: string; status: AppStatus;
    primaryColor: string; iconClass: string;
    slug: string; theme: AppTheme; navStyle: NavStyle;
    modules: AppModule[]; versions: AppVersion[];
    updatedAt: string;
};

// Task sub-types
type TaskPriority = "Low" | "Medium" | "High" | "Critical";
type TaskAttachment = { name: string; size: string; ext: string; };
type TaskComment = { id: string; author: string; content: string; timestamp: string; attachments: TaskAttachment[]; };
type TaskItem = {
    id: string; title: string; description: string;
    status: string; priority: TaskPriority; assignee: string;
    dueDate: string; parentId: string | null;
    comments: TaskComment[]; attachments: TaskAttachment[]; tags: string[];
};

// ─── Module Registry ──────────────────────────────────────────────────────────
const ALL_MODULE_TYPES: ModuleType[] = [
    "tasks", "scheduling", "messaging", "forum", "documents",
    "checklists", "inventory", "workflow", "directory", "reporting", "maps", "notifications",
];

const MODULE_REGISTRY: Record<ModuleType, ModuleInfo> = {
    tasks: {
        icon: "bi-kanban-fill", title: "Task Tracker",
        description: "Kanban boards with parent/child hierarchy, assignments, discussion, and file attachments.",
        defaultConfig: {
            sectionTitle: "", columns: "To Do,In Progress,Review,Done",
            enableParentTasks: "true", enableForum: "true", enableAttachments: "true",
            assignees: "Alice Chen,Bob Martinez,Carol Smith,Dave Johnson",
            priorities: "Low,Medium,High,Critical", defaultView: "dashboard",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Task Tracker" },
            { key: "columns", label: "Status Columns", kind: "text", placeholder: "To Do,In Progress,Review,Done", hint: "Comma-separated column names" },
            { key: "enableParentTasks", label: "Enable Parent Task Hierarchy", kind: "toggle" },
            { key: "enableForum", label: "Enable Per-Task Discussion Forum", kind: "toggle" },
            { key: "enableAttachments", label: "Enable File Attachments", kind: "toggle" },
            { key: "assignees", label: "Team Members", kind: "textarea", placeholder: "Alice Chen,Bob Martinez,...", hint: "Comma-separated names" },
            { key: "priorities", label: "Priority Levels", kind: "text", placeholder: "Low,Medium,High,Critical" },
            { key: "defaultView", label: "Default View", kind: "select", options: ["dashboard", "board", "list"] },
        ],
    },
    scheduling: {
        icon: "bi-calendar3", title: "Scheduling",
        description: "Event calendar with booking, resource management, and recurring events.",
        defaultConfig: {
            sectionTitle: "", defaultView: "week",
            eventTypes: "Meeting,Training,Inspection,Appointment",
            enableBooking: "true", workingHours: "8:00 AM – 5:00 PM",
            timeZone: "Eastern", enableRecurring: "true",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Scheduling" },
            { key: "defaultView", label: "Default View", kind: "select", options: ["day", "week", "month"] },
            { key: "eventTypes", label: "Event Types", kind: "text", placeholder: "Meeting,Training,Inspection", hint: "Comma-separated" },
            { key: "enableBooking", label: "Enable Self-Service Booking", kind: "toggle" },
            { key: "workingHours", label: "Working Hours", kind: "text", placeholder: "8:00 AM – 5:00 PM" },
            { key: "timeZone", label: "Time Zone", kind: "select", options: ["Eastern", "Central", "Mountain", "Pacific", "UTC"] },
            { key: "enableRecurring", label: "Enable Recurring Events", kind: "toggle" },
        ],
    },
    messaging: {
        icon: "bi-chat-dots-fill", title: "Messaging",
        description: "Real-time channels and direct messages with file sharing and reactions.",
        defaultConfig: {
            sectionTitle: "", channels: "general,announcements,support",
            enableDMs: "true", allowReactions: "true", fileTypes: "Images,PDFs,Documents",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Messaging" },
            { key: "channels", label: "Default Channels", kind: "text", placeholder: "general,announcements,support", hint: "Comma-separated" },
            { key: "enableDMs", label: "Enable Direct Messages", kind: "toggle" },
            { key: "allowReactions", label: "Allow Emoji Reactions", kind: "toggle" },
            { key: "fileTypes", label: "Allowed File Types", kind: "text", placeholder: "Images,PDFs,Documents" },
        ],
    },
    forum: {
        icon: "bi-chat-square-text-fill", title: "Forum",
        description: "Threaded discussion boards with categories, pinning, and moderation.",
        defaultConfig: {
            sectionTitle: "", categories: "General,Announcements,Q&A,Ideas",
            enableAttachments: "true", moderationMode: "open", allowAnonymous: "false",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Forum" },
            { key: "categories", label: "Categories", kind: "text", placeholder: "General,Announcements,Q&A", hint: "Comma-separated" },
            { key: "enableAttachments", label: "Allow File Attachments", kind: "toggle" },
            { key: "moderationMode", label: "Moderation Mode", kind: "select", options: ["open", "moderated", "approve-all"] },
            { key: "allowAnonymous", label: "Allow Anonymous Posts", kind: "toggle" },
        ],
    },
    documents: {
        icon: "bi-folder2-open", title: "Documents",
        description: "File storage with folder hierarchy, version control, and access permissions.",
        defaultConfig: {
            sectionTitle: "", folders: "General,Contracts,Reports,Policies",
            enableVersioning: "true", maxFileSizeMb: "25", allowedTypes: "PDF,Word,Excel,Images",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Documents" },
            { key: "folders", label: "Default Folders", kind: "text", placeholder: "General,Contracts,Reports", hint: "Comma-separated" },
            { key: "enableVersioning", label: "Enable Version Control", kind: "toggle" },
            { key: "maxFileSizeMb", label: "Max File Size (MB)", kind: "number", placeholder: "25" },
            { key: "allowedTypes", label: "Allowed File Types", kind: "text", placeholder: "PDF,Word,Excel,Images" },
        ],
    },
    checklists: {
        icon: "bi-check2-square", title: "Checklists",
        description: "Operational checklists with templates, recurring schedules, and sign-off tracking.",
        defaultConfig: {
            sectionTitle: "", defaultList: "Daily SOP",
            enableTemplates: "true", requireSignOff: "true", frequency: "daily",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Checklists" },
            { key: "defaultList", label: "Default Checklist Name", kind: "text", placeholder: "Daily SOP" },
            { key: "enableTemplates", label: "Enable Checklist Templates", kind: "toggle" },
            { key: "requireSignOff", label: "Require Digital Sign-Off", kind: "toggle" },
            { key: "frequency", label: "Default Frequency", kind: "select", options: ["daily", "weekly", "monthly", "once"] },
        ],
    },
    inventory: {
        icon: "bi-boxes", title: "Inventory",
        description: "Asset and inventory tracking with categories, check-in/out, and low-stock alerts.",
        defaultConfig: {
            sectionTitle: "", categories: "Equipment,Supplies,Vehicles",
            enableLowStockAlerts: "true", lowStockThreshold: "5", enableCheckInOut: "true",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Inventory" },
            { key: "categories", label: "Categories", kind: "text", placeholder: "Equipment,Supplies,Vehicles", hint: "Comma-separated" },
            { key: "enableLowStockAlerts", label: "Enable Low-Stock Alerts", kind: "toggle" },
            { key: "lowStockThreshold", label: "Low-Stock Threshold (units)", kind: "number", placeholder: "5" },
            { key: "enableCheckInOut", label: "Enable Check-In / Check-Out", kind: "toggle" },
        ],
    },
    workflow: {
        icon: "bi-diagram-3-fill", title: "Workflow",
        description: "Approval workflows and process automation with stage routing and notifications.",
        defaultConfig: {
            sectionTitle: "", stages: "Draft,Review,Approved,Rejected",
            enableApprovals: "true", notifyOnTransition: "true",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Workflow" },
            { key: "stages", label: "Workflow Stages", kind: "text", placeholder: "Draft,Review,Approved,Rejected", hint: "Comma-separated" },
            { key: "enableApprovals", label: "Enable Approval Steps", kind: "toggle" },
            { key: "notifyOnTransition", label: "Notify on Stage Change", kind: "toggle" },
        ],
    },
    directory: {
        icon: "bi-person-lines-fill", title: "Directory",
        description: "Staff and contact directory with departments, org chart, and search.",
        defaultConfig: {
            sectionTitle: "", departments: "Operations,HR,Finance,IT,Field",
            showOrgChart: "true", showContactInfo: "true", enableSearch: "true",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Directory" },
            { key: "departments", label: "Departments", kind: "text", placeholder: "Operations,HR,Finance,IT", hint: "Comma-separated" },
            { key: "showOrgChart", label: "Show Org Chart", kind: "toggle" },
            { key: "showContactInfo", label: "Show Contact Info", kind: "toggle" },
            { key: "enableSearch", label: "Enable Search", kind: "toggle" },
        ],
    },
    reporting: {
        icon: "bi-bar-chart-line-fill", title: "Reporting",
        description: "Dashboards, charts, and scheduled reports with data export.",
        defaultConfig: {
            sectionTitle: "", chartTypes: "Bar,Line,Pie,Table",
            enableExport: "true", enableScheduled: "true", dataRefreshMinutes: "15",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Reporting" },
            { key: "chartTypes", label: "Chart Types", kind: "text", placeholder: "Bar,Line,Pie,Table", hint: "Comma-separated" },
            { key: "enableExport", label: "Enable Data Export", kind: "toggle" },
            { key: "enableScheduled", label: "Enable Scheduled Reports", kind: "toggle" },
            { key: "dataRefreshMinutes", label: "Data Refresh Interval (minutes)", kind: "number", placeholder: "15" },
        ],
    },
    maps: {
        icon: "bi-map-fill", title: "Maps",
        description: "Interactive maps with pins, layers, geofencing, and annotated notes.",
        defaultConfig: {
            sectionTitle: "", defaultZoom: "12",
            enableGeofencing: "true", layers: "Assets,Incidents,Routes", enablePinNotes: "true",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Maps" },
            { key: "defaultZoom", label: "Default Zoom Level (1–20)", kind: "number", placeholder: "12" },
            { key: "enableGeofencing", label: "Enable Geofencing Zones", kind: "toggle" },
            { key: "layers", label: "Map Layers", kind: "text", placeholder: "Assets,Incidents,Routes", hint: "Comma-separated" },
            { key: "enablePinNotes", label: "Enable Pin Notes & Photos", kind: "toggle" },
        ],
    },
    notifications: {
        icon: "bi-bell-fill", title: "Notifications",
        description: "Multi-channel alerts via email, SMS, and push with template management.",
        defaultConfig: {
            sectionTitle: "", channels: "Email,SMS,Push",
            enableScheduled: "true", templates: "Alert,Reminder,Update,Approval",
        },
        configFields: [
            { key: "sectionTitle", label: "Section Title", kind: "text", placeholder: "Notifications" },
            { key: "channels", label: "Delivery Channels", kind: "text", placeholder: "Email,SMS,Push", hint: "Comma-separated" },
            { key: "enableScheduled", label: "Enable Scheduled Notifications", kind: "toggle" },
            { key: "templates", label: "Notification Templates", kind: "text", placeholder: "Alert,Reminder,Update,Approval" },
        ],
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusVariant(s: AppStatus) {
    return s === "Published" ? "success" : s === "Archived" ? "secondary" : "warning";
}
function priorityVariant(p: TaskPriority) {
    return p === "Critical" ? "danger" : p === "High" ? "warning" : p === "Medium" ? "info" : "secondary";
}
function fileIcon(ext: string) {
    if (ext === "pdf") return "bi-file-earmark-pdf text-danger";
    if (["xlsx", "csv"].includes(ext)) return "bi-file-earmark-spreadsheet text-success";
    if (["doc", "docx"].includes(ext)) return "bi-file-earmark-word text-primary";
    if (["sql", "js", "ts"].includes(ext)) return "bi-file-earmark-code text-warning";
    return "bi-file-earmark text-secondary";
}
function appUrl(slug: string) { return `https://portal.seacoastdevops.io/apps/${slug}`; }
function autoSlug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

// ─── Seed Task Data ───────────────────────────────────────────────────────────
const SEED_USERS = ["Alice Chen", "Bob Martinez", "Carol Smith", "Dave Johnson", "Eve Park"];

const SEED_TASKS: TaskItem[] = [
    {
        id: "t1", title: "Q1 System Rollout", description: "Complete all Q1 deliverables and deploy to production.",
        status: "In Progress", priority: "High", assignee: "Alice Chen",
        dueDate: "2026-03-31", parentId: null, tags: ["Q1", "Deployment"],
        comments: [
            { id: "c1", author: "Alice Chen", content: "UAT session with stakeholders kicked off today. Initial feedback is positive.", timestamp: "2026-03-18 09:15", attachments: [] },
            { id: "c2", author: "Bob Martinez", content: "Migration runbook attached for team review before Wednesday.", timestamp: "2026-03-19 14:30", attachments: [{ name: "migration-runbook-v2.pdf", size: "1.2 MB", ext: "pdf" }] },
        ],
        attachments: [{ name: "rollout-plan.xlsx", size: "432 KB", ext: "xlsx" }],
    },
    {
        id: "t2", title: "Client Onboarding – Acme City", description: "Full onboarding process for Acme City Government.",
        status: "To Do", priority: "High", assignee: "Bob Martinez",
        dueDate: "2026-04-15", parentId: null, tags: ["Onboarding", "Client"],
        comments: [], attachments: [],
    },
    {
        id: "t3", title: "Q2 Planning & Scoping", description: "Define scope, milestones, and resource allocation for Q2.",
        status: "To Do", priority: "Medium", assignee: "Carol Smith",
        dueDate: "2026-04-01", parentId: null, tags: ["Planning"],
        comments: [], attachments: [],
    },
    // Children of t1
    { id: "t1a", title: "Database migration script", description: "Write and test the production database migration.", status: "Done", priority: "High", assignee: "Carol Smith", dueDate: "2026-03-20", parentId: "t1", tags: ["DB"], comments: [{ id: "c3", author: "Carol Smith", content: "Migration verified on staging. Ready for prod.", timestamp: "2026-03-17 16:45", attachments: [] }], attachments: [{ name: "migration-v3.sql", size: "82 KB", ext: "sql" }] },
    { id: "t1b", title: "UAT with stakeholders", description: "Conduct user acceptance testing with department leads.", status: "In Progress", priority: "Medium", assignee: "Dave Johnson", dueDate: "2026-03-25", parentId: "t1", tags: ["UAT"], comments: [{ id: "c4", author: "Dave Johnson", content: "Session scheduled for March 24. Three confirmed.", timestamp: "2026-03-19 10:00", attachments: [] }], attachments: [] },
    { id: "t1c", title: "Production deployment", description: "Deploy final build to production with rollback plan ready.", status: "To Do", priority: "Critical", assignee: "Alice Chen", dueDate: "2026-03-31", parentId: "t1", tags: ["Deploy"], comments: [], attachments: [] },
    // Children of t2
    { id: "t2a", title: "Provision tenant environment", description: "Set up Acme City's isolated tenant environment.", status: "To Do", priority: "High", assignee: "Bob Martinez", dueDate: "2026-04-05", parentId: "t2", tags: ["Infra"], comments: [], attachments: [] },
    { id: "t2b", title: "Import client data", description: "Migrate legacy data into the new platform structure.", status: "To Do", priority: "Medium", assignee: "Carol Smith", dueDate: "2026-04-10", parentId: "t2", tags: ["Data"], comments: [], attachments: [] },
];

// ─── Seed Apps ────────────────────────────────────────────────────────────────
const SEED_APPS: DesignedApp[] = [
    {
        id: uid(), name: "Client Portal Pro", tagline: "Self-service client access and communication hub",
        description: "A full-featured client portal with document sharing, messaging, and notifications.",
        version: "v2.0", status: "Published", primaryColor: "#2F4F4F",
        iconClass: "bi-person-badge-fill", slug: "client-portal", theme: "light", navStyle: "sidebar",
        modules: [
            { id: uid(), type: "documents", config: { ...MODULE_REGISTRY.documents.defaultConfig } },
            { id: uid(), type: "messaging", config: { ...MODULE_REGISTRY.messaging.defaultConfig } },
            { id: uid(), type: "notifications", config: { ...MODULE_REGISTRY.notifications.defaultConfig } },
        ],
        versions: [{ versionNum: "v1.0", publishedAt: "2026-01-15", modules: [] }],
        updatedAt: "2026-03-10",
    },
    {
        id: uid(), name: "Field Operations Suite", tagline: "Coordinating field teams in real time",
        description: "Task management, scheduling, and checklists for field operations teams.",
        version: "v1.3", status: "Published", primaryColor: "#1a6b3c",
        iconClass: "bi-geo-alt-fill", slug: "field-ops", theme: "light", navStyle: "sidebar",
        modules: [
            { id: uid(), type: "tasks", config: { ...MODULE_REGISTRY.tasks.defaultConfig, sectionTitle: "Field Tasks" } },
            { id: uid(), type: "scheduling", config: { ...MODULE_REGISTRY.scheduling.defaultConfig } },
            { id: uid(), type: "checklists", config: { ...MODULE_REGISTRY.checklists.defaultConfig } },
            { id: uid(), type: "maps", config: { ...MODULE_REGISTRY.maps.defaultConfig } },
        ],
        versions: [
            { versionNum: "v1.0", publishedAt: "2026-01-01", modules: [] },
            { versionNum: "v1.2", publishedAt: "2026-02-10", modules: [] },
        ],
        updatedAt: "2026-03-15",
    },
    {
        id: uid(), name: "Internal Team Hub", tagline: "All-in-one collaboration for your team",
        description: "Messaging, forum, directory, and workflow tools for internal teams.",
        version: "v1.1", status: "Published", primaryColor: "#4a3080",
        iconClass: "bi-people-fill", slug: "team-hub", theme: "light", navStyle: "topnav",
        modules: [
            { id: uid(), type: "messaging", config: { ...MODULE_REGISTRY.messaging.defaultConfig } },
            { id: uid(), type: "forum", config: { ...MODULE_REGISTRY.forum.defaultConfig } },
            { id: uid(), type: "directory", config: { ...MODULE_REGISTRY.directory.defaultConfig } },
            { id: uid(), type: "workflow", config: { ...MODULE_REGISTRY.workflow.defaultConfig } },
        ],
        versions: [{ versionNum: "v1.0", publishedAt: "2026-02-01", modules: [] }],
        updatedAt: "2026-03-01",
    },
    {
        id: uid(), name: "Compliance Manager", tagline: "Stay audit-ready with automated compliance tracking",
        description: "Documents, checklists, reporting, and notifications for compliance management.",
        version: "v0.8", status: "Draft", primaryColor: "#8b1a1a",
        iconClass: "bi-shield-check", slug: "compliance", theme: "light", navStyle: "sidebar",
        modules: [
            { id: uid(), type: "documents", config: { ...MODULE_REGISTRY.documents.defaultConfig } },
            { id: uid(), type: "checklists", config: { ...MODULE_REGISTRY.checklists.defaultConfig } },
            { id: uid(), type: "reporting", config: { ...MODULE_REGISTRY.reporting.defaultConfig } },
            { id: uid(), type: "notifications", config: { ...MODULE_REGISTRY.notifications.defaultConfig } },
        ],
        versions: [], updatedAt: "2026-03-20",
    },
];

// ─── Task Module Preview ──────────────────────────────────────────────────────
function TaskModulePreview({ config, primaryColor }: { config: Record<string, string>; primaryColor: string }) {
    const [tasks, setTasks] = useState<TaskItem[]>(SEED_TASKS);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const [activeView, setActiveView] = useState<"dashboard" | "board">(
        (config.defaultView as "dashboard" | "board") === "board" ? "board" : "dashboard"
    );
    const [newComment, setNewComment] = useState("");
    const commentFileRef = useRef<HTMLInputElement>(null);

    const columns = (config.columns || "To Do,In Progress,Review,Done").split(",").map(s => s.trim());
    const assignees = (config.assignees || SEED_USERS.join(",")).split(",").map(s => s.trim()).filter(Boolean);
    const parentTasks = tasks.filter(t => t.parentId === null);
    const childrenOf = (id: string) => tasks.filter(t => t.parentId === id);
    const getProgress = (parentId: string) => {
        const ch = childrenOf(parentId);
        if (!ch.length) return null;
        const done = ch.filter(c => c.status === "Done").length;
        return { done, total: ch.length, pct: Math.round((done / ch.length) * 100) };
    };
    const updateTask = (updated: TaskItem) => {
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTask(updated);
    };
    const addComment = () => {
        if (!newComment.trim() || !selectedTask) return;
        const comment: TaskComment = {
            id: uid(), author: "You", content: newComment.trim(),
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "), attachments: [],
        };
        const updated = { ...selectedTask, comments: [...selectedTask.comments, comment] };
        updateTask(updated);
        setNewComment("");
    };

    // ── Task Detail Panel ──
    if (selectedTask) {
        const refreshed = tasks.find(t => t.id === selectedTask.id) || selectedTask;
        const children = childrenOf(refreshed.id);
        const parent = refreshed.parentId ? tasks.find(t => t.id === refreshed.parentId) : null;
        return (
            <div style={{ fontSize: "0.85rem" }}>
                <div className="d-flex align-items-center mb-3">
                    <button className="btn btn-xs btn-outline-secondary mr-2" onClick={() => setSelectedTask(null)}>
                        <i className="bi bi-arrow-left mr-1" />Back
                    </button>
                    <span className="text-muted small">{parent ? `Subtask of "${parent.title}"` : "Parent Task"}</span>
                    <div className="ml-auto d-flex gap-1">
                        <span className={`badge badge-${priorityVariant(refreshed.priority)}`}>{refreshed.priority}</span>
                        <span className={`badge badge-${refreshed.status === "Done" ? "success" : refreshed.status === "In Progress" ? "primary" : "secondary"}`}>{refreshed.status}</span>
                    </div>
                </div>

                <h6 className="font-weight-bold mb-1">{refreshed.title}</h6>
                <p className="text-muted small mb-3">{refreshed.description}</p>

                {/* Editable meta */}
                <div className="row mb-3">
                    <div className="col-4">
                        <label className="small font-weight-bold d-block">Status</label>
                        <select className="form-control form-control-sm" value={refreshed.status}
                            onChange={e => updateTask({ ...refreshed, status: e.target.value })}>
                            {columns.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="col-4">
                        <label className="small font-weight-bold d-block">Assignee</label>
                        <select className="form-control form-control-sm" value={refreshed.assignee}
                            onChange={e => updateTask({ ...refreshed, assignee: e.target.value })}>
                            {assignees.map(a => <option key={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="col-4">
                        <label className="small font-weight-bold d-block">Due Date</label>
                        <input type="date" className="form-control form-control-sm" value={refreshed.dueDate}
                            onChange={e => updateTask({ ...refreshed, dueDate: e.target.value })} />
                    </div>
                </div>

                {refreshed.tags.length > 0 && (
                    <div className="mb-3">
                        {refreshed.tags.map(tag => <span key={tag} className="badge badge-secondary mr-1">{tag}</span>)}
                    </div>
                )}

                {/* Subtasks */}
                {config.enableParentTasks !== "false" && children.length > 0 && (
                    <div className="mb-3">
                        <div className="font-weight-bold small mb-2">
                            <i className="bi bi-diagram-2 mr-1" />Subtasks ({children.filter(c => c.status === "Done").length}/{children.length} done)
                        </div>
                        {children.map(child => (
                            <div key={child.id} className="d-flex align-items-center border rounded p-2 mb-1 bg-white"
                                style={{ cursor: "pointer" }} onClick={() => setSelectedTask(child)}>
                                <i className={`bi ${child.status === "Done" ? "bi-check-circle-fill text-success" : "bi-circle text-muted"} mr-2`} />
                                <span className="flex-grow-1" style={{ color: "#212529" }}>{child.title}</span>
                                <small className="text-muted mr-2">{child.assignee.split(" ")[0]}</small>
                                <span className={`badge badge-${priorityVariant(child.priority)}`} style={{ fontSize: "0.7rem" }}>{child.priority}</span>
                                <i className="bi bi-chevron-right text-muted ml-1" style={{ fontSize: "0.7rem" }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Attachments */}
                {config.enableAttachments !== "false" && (
                    <div className="mb-3">
                        <div className="font-weight-bold small mb-2"><i className="bi bi-paperclip mr-1" />Attachments ({refreshed.attachments.length})</div>
                        {refreshed.attachments.map((att, i) => (
                            <div key={i} className="d-flex align-items-center border rounded p-2 mb-1">
                                <i className={`bi ${fileIcon(att.ext)} mr-2`} />
                                <span className="flex-grow-1" style={{ color: "#212529" }}>{att.name}</span>
                                <small className="text-muted">{att.size}</small>
                            </div>
                        ))}
                        {refreshed.attachments.length === 0 && <div className="text-muted small mb-1">No attachments yet.</div>}
                        <button className="btn btn-xs btn-outline-secondary">
                            <i className="bi bi-upload mr-1" />Upload File
                        </button>
                    </div>
                )}

                {/* Forum / Discussion */}
                {config.enableForum !== "false" && (
                    <div>
                        <div className="font-weight-bold small mb-2"><i className="bi bi-chat-square-text mr-1" />Discussion ({refreshed.comments.length})</div>
                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                            {refreshed.comments.length === 0 && (
                                <div className="text-muted small py-2">No comments yet — start the discussion.</div>
                            )}
                            {refreshed.comments.map(comment => (
                                <div key={comment.id} className="border rounded p-2 mb-2" style={{ background: "#f8f9fa", color: "#212529" }}>
                                    <div className="d-flex align-items-center mb-1">
                                        <i className="bi bi-person-circle mr-1 text-muted" />
                                        <span className="font-weight-bold mr-2" style={{ fontSize: "0.8rem" }}>{comment.author}</span>
                                        <small className="text-muted">{comment.timestamp}</small>
                                    </div>
                                    <div style={{ fontSize: "0.83rem" }}>{comment.content}</div>
                                    {comment.attachments.map((att, i) => (
                                        <div key={i} className="d-flex align-items-center mt-1 p-1 rounded border" style={{ fontSize: "0.78rem", background: "#fff", color: "#212529" }}>
                                            <i className={`bi ${fileIcon(att.ext)} mr-1`} />{att.name}
                                            <small className="text-muted ml-2">{att.size}</small>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="mt-2">
                            <textarea className="form-control form-control-sm mb-1" rows={2}
                                placeholder="Add a comment or update…"
                                value={newComment} onChange={e => setNewComment(e.target.value)}
                                style={{ resize: "none" }} />
                            <div className="d-flex gap-1">
                                <button className="btn btn-xs btn-primary" onClick={addComment} disabled={!newComment.trim()}>
                                    <i className="bi bi-send mr-1" />Post
                                </button>
                                <input type="file" ref={commentFileRef} style={{ display: "none" }} />
                                <button className="btn btn-xs btn-outline-secondary" onClick={() => commentFileRef.current?.click()}>
                                    <i className="bi bi-paperclip mr-1" />Attach File
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Dashboard View ──
    if (activeView === "dashboard") {
        const stats = [
            { label: "Total", value: tasks.length, color: primaryColor },
            { label: "In Progress", value: tasks.filter(t => t.status === "In Progress").length, color: "#0d6efd" },
            { label: "Completed", value: tasks.filter(t => t.status === "Done").length, color: "#198754" },
            { label: "Overdue", value: tasks.filter(t => t.status !== "Done" && t.dueDate < "2026-03-21").length, color: "#dc3545" },
        ];
        return (
            <div style={{ fontSize: "0.85rem" }}>
                <div className="d-flex align-items-center mb-3">
                    <span className="font-weight-bold"><i className="bi bi-speedometer2 mr-1" style={{ color: primaryColor }} />Dashboard</span>
                    <div className="ml-auto">
                        <button className="btn btn-xs btn-primary mr-1">Dashboard</button>
                        <button className="btn btn-xs btn-outline-secondary" onClick={() => setActiveView("board")}>Board</button>
                    </div>
                </div>
                <div className="row mb-3">
                    {stats.map(s => (
                        <div key={s.label} className="col-3">
                            <div className="text-center border rounded py-2" style={{ background: "#f8f9fa", color: "#212529" }}>
                                <div className="font-weight-bold" style={{ color: s.color, fontSize: "1.3rem" }}>{s.value}</div>
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="font-weight-bold small mb-2"><i className="bi bi-diagram-2 mr-1" />Parent Tasks</div>
                {parentTasks.map(task => {
                    const progress = getProgress(task.id);
                    return (
                        <div key={task.id} className="border rounded p-3 mb-2 bg-white"
                            style={{ cursor: "pointer", color: "#212529" }} onClick={() => setSelectedTask(task)}>
                            <div className="d-flex align-items-center mb-1">
                                <span className="font-weight-bold flex-grow-1">{task.title}</span>
                                <span className={`badge badge-${task.status === "Done" ? "success" : task.status === "In Progress" ? "primary" : "secondary"} mr-1`}>{task.status}</span>
                                <span className={`badge badge-${priorityVariant(task.priority)}`}>{task.priority}</span>
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-2">
                                <i className="bi bi-person mr-1" />{task.assignee}
                                <i className="bi bi-calendar3 ml-2 mr-1" />Due {task.dueDate}
                                {task.comments.length > 0 && <><i className="bi bi-chat ml-2 mr-1" />{task.comments.length}</>}
                                {task.attachments.length > 0 && <><i className="bi bi-paperclip ml-2 mr-1" />{task.attachments.length}</>}
                                <i className="bi bi-chevron-right ml-auto" />
                            </div>
                            {progress && (
                                <div>
                                    <div className="d-flex justify-content-between small text-muted mb-1">
                                        <span>{progress.done}/{progress.total} subtasks done</span>
                                        <span>{progress.pct}%</span>
                                    </div>
                                    <div className="progress" style={{ height: 6 }}>
                                        <div className="progress-bar bg-success" style={{ width: `${progress.pct}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // ── Board View ──
    return (
        <div style={{ fontSize: "0.85rem" }}>
            <div className="d-flex align-items-center mb-3">
                <span className="font-weight-bold"><i className="bi bi-kanban mr-1" style={{ color: primaryColor }} />Kanban Board</span>
                <div className="ml-auto">
                    <button className="btn btn-xs btn-outline-secondary mr-1" onClick={() => setActiveView("dashboard")}>Dashboard</button>
                    <button className="btn btn-xs btn-primary">Board</button>
                </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {columns.map(col => {
                    const colTasks = tasks.filter(t => t.status === col);
                    return (
                        <div key={col} style={{ minWidth: 175, flex: "0 0 175px" }}>
                            <div className="font-weight-bold small text-center py-1 rounded mb-2" style={{ background: "#eee", color: "#212529" }}>
                                {col} <span className="badge badge-secondary ml-1">{colTasks.length}</span>
                            </div>
                            {colTasks.map(task => (
                                <div key={task.id} className="border rounded p-2 mb-2 bg-white"
                                    style={{ cursor: "pointer", fontSize: "0.8rem", color: "#212529" }}
                                    onClick={() => setSelectedTask(task)}>
                                    <div className="font-weight-bold mb-1">{task.title}</div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className={`badge badge-${priorityVariant(task.priority)}`} style={{ fontSize: "0.68rem" }}>{task.priority}</span>
                                        <small className="text-muted">{task.assignee.split(" ")[0]}</small>
                                    </div>
                                    {(task.comments.length > 0 || task.attachments.length > 0) && (
                                        <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                                            {task.comments.length > 0 && <><i className="bi bi-chat mr-1" />{task.comments.length} </>}
                                            {task.attachments.length > 0 && <><i className="bi bi-paperclip mr-1" />{task.attachments.length}</>}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button className="btn btn-xs btn-outline-secondary w-100 mt-1" disabled>
                                <i className="bi bi-plus" /> Add task
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── App Preview ──────────────────────────────────────────────────────────────
function AppPreview({ app, onClose }: { app: DesignedApp; onClose: () => void }) {
    const [activeModule, setActiveModule] = useState<ModuleType | null>(
        app.modules.length > 0 ? app.modules[0].type : null
    );
    const current = app.modules.find(m => m.type === activeModule);
    const info = activeModule ? MODULE_REGISTRY[activeModule] : null;
    const url = appUrl(app.slug);

    const renderContent = () => {
        if (!current || !info) return (
            <div className="text-muted text-center py-5">
                <i className="bi bi-grid" style={{ fontSize: "2rem", opacity: 0.3 }} />
                <p className="mt-2">No module selected.</p>
            </div>
        );

        if (current.type === "tasks") return <TaskModulePreview config={current.config} primaryColor={app.primaryColor} />;

        if (current.type === "scheduling") {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return (
                <div style={{ fontSize: "0.85rem" }}>
                    <h6 className="font-weight-bold mb-3"><i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />{current.config.sectionTitle || info.title}</h6>
                    <div className="d-flex gap-1 mb-3">
                        {days.map((d, i) => (
                            <div key={d} className="text-center flex-grow-1 border rounded p-2"
                                style={{ background: i === 3 ? app.primaryColor : "#f8f9fa", color: i === 3 ? "#fff" : "#212529", fontSize: "0.78rem" }}>
                                <div className="font-weight-bold">{d}</div>
                                <div>{18 + i}</div>
                                {i === 3 && <div className="mt-1 rounded" style={{ background: "rgba(255,255,255,0.25)", fontSize: "0.66rem", padding: "1px 2px" }}>2 events</div>}
                            </div>
                        ))}
                    </div>
                    {(current.config.eventTypes || "Meeting,Training,Inspection").split(",").slice(0, 3).map((et, i) => (
                        <div key={i} className="border rounded p-2 mb-2 d-flex align-items-center" style={{ fontSize: "0.85rem", color: "#212529" }}>
                            <div className="rounded mr-2" style={{ width: 4, height: 36, flexShrink: 0, background: app.primaryColor }} />
                            <div>
                                <div className="font-weight-bold">{et.trim()} — {["09:00", "11:30", "14:00"][i]}</div>
                                <small className="text-muted">{["Conference Room A", "Training Center", "Field Site B"][i]}</small>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (current.type === "messaging") {
            const chs = (current.config.channels || "general,announcements,support").split(",");
            return (
                <div style={{ fontSize: "0.85rem" }}>
                    <h6 className="font-weight-bold mb-3"><i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />{current.config.sectionTitle || info.title}</h6>
                    <div className="d-flex border rounded overflow-hidden" style={{ height: 270 }}>
                        <div style={{ width: 120, borderRight: "1px solid #dee2e6", background: "#2c2c3e", overflowY: "auto" }}>
                            {chs.map((ch, i) => (
                                <div key={ch} className="px-2 py-1 d-flex align-items-center"
                                    style={{ cursor: "pointer", fontSize: "0.78rem", background: i === 0 ? app.primaryColor : "transparent", color: i === 0 ? "#fff" : "#adb5bd" }}>
                                    <i className="bi bi-hash mr-1" />{ch.trim()}
                                </div>
                            ))}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ flex: 1, padding: "0.5rem", overflowY: "auto" }}>
                                {[
                                    { author: "Alice", msg: "Morning team — status update in #announcements.", time: "9:02 AM", mine: false },
                                    { author: "Bob", msg: "Will review the deployment checklist this afternoon.", time: "9:14 AM", mine: false },
                                    { author: "You", msg: "Confirmed — UAT starts at 2pm today.", time: "9:30 AM", mine: true },
                                ].map((m, i) => (
                                    <div key={i} className={`d-flex mb-2 ${m.mine ? "flex-row-reverse" : ""}`}>
                                        <div className="rounded p-2"
                                            style={{ maxWidth: "78%", fontSize: "0.78rem", background: m.mine ? app.primaryColor : "#e9ecef", color: m.mine ? "#fff" : "#212529" }}>
                                            {!m.mine && <div className="font-weight-bold mb-1" style={{ fontSize: "0.7rem" }}>{m.author}</div>}
                                            {m.msg}
                                            <div className="text-right mt-1" style={{ fontSize: "0.66rem", opacity: 0.75 }}>{m.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-top p-2 d-flex gap-1">
                                <input className="form-control form-control-sm flex-grow-1" placeholder={`Message #${chs[0]?.trim()}…`} disabled />
                                <button className="btn btn-sm" style={{ background: app.primaryColor, color: "#fff" }} disabled>
                                    <i className="bi bi-send-fill" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (current.type === "documents") {
            const folders = (current.config.folders || "General,Contracts,Reports").split(",");
            return (
                <div style={{ fontSize: "0.85rem" }}>
                    <h6 className="font-weight-bold mb-3"><i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />{current.config.sectionTitle || info.title}</h6>
                    {folders.map((f, i) => (
                        <div key={i} className="d-flex align-items-center border rounded p-2 mb-2" style={{ color: "#212529" }}>
                            <i className="bi bi-folder2-fill mr-2" style={{ color: "#f0ad4e", fontSize: "1.1rem" }} />
                            <span className="flex-grow-1">{f.trim()}</span>
                            <small className="text-muted mr-3">{2 + i * 3} files</small>
                            <button className="btn btn-xs btn-outline-secondary" disabled><i className="bi bi-upload" /></button>
                        </div>
                    ))}
                    <button className="btn btn-sm btn-outline-primary mt-1" disabled>
                        <i className="bi bi-folder-plus mr-1" />New Folder
                    </button>
                </div>
            );
        }

        if (current.type === "checklists") {
            const items = ["Open facility and verify security log", "Check equipment inventory", "Complete morning briefing", "Submit daily report", "Lock facility and sign off"];
            return (
                <div style={{ fontSize: "0.85rem" }}>
                    <h6 className="font-weight-bold mb-3"><i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />{current.config.sectionTitle || current.config.defaultList || info.title}</h6>
                    {items.map((item, i) => (
                        <div key={i} className="d-flex align-items-center border rounded p-2 mb-1" style={{ color: "#212529" }}>
                            <i className={`bi ${i < 2 ? "bi-check-circle-fill text-success" : "bi-circle text-muted"} mr-2`} style={{ fontSize: "1.1rem" }} />
                            <span style={{ textDecoration: i < 2 ? "line-through" : undefined, color: i < 2 ? "#999" : undefined }}>{item}</span>
                        </div>
                    ))}
                    {current.config.requireSignOff === "true" && (
                        <div className="mt-2 border rounded p-2 d-flex align-items-center" style={{ background: "#f8f9fa", color: "#212529" }}>
                            <i className="bi bi-pen mr-2 text-muted" />
                            <small className="text-muted">Supervisor sign-off required to complete</small>
                            <button className="btn btn-xs btn-outline-success ml-auto" disabled>Sign Off</button>
                        </div>
                    )}
                </div>
            );
        }

        if (current.type === "forum") {
            const cats = (current.config.categories || "General,Q&A,Ideas").split(",");
            return (
                <div style={{ fontSize: "0.85rem" }}>
                    <h6 className="font-weight-bold mb-3"><i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />{current.config.sectionTitle || info.title}</h6>
                    {cats.map((cat, i) => (
                        <div key={i} className="border rounded p-2 mb-2" style={{ cursor: "pointer", color: "#212529" }}>
                            <div className="font-weight-bold mb-1">{cat.trim()}</div>
                            <div className="text-muted small">
                                <span className="mr-3"><i className="bi bi-chat mr-1" />{3 + i * 2} threads</span>
                                <span><i className="bi bi-eye mr-1" />{14 + i * 7} views</span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (current.type === "inventory") {
            const cats = (current.config.categories || "Equipment,Supplies,Vehicles").split(",");
            return (
                <div style={{ fontSize: "0.85rem" }}>
                    <h6 className="font-weight-bold mb-3"><i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />{current.config.sectionTitle || info.title}</h6>
                    {cats.map((cat, i) => (
                        <div key={i} className="border rounded p-2 mb-2" style={{ color: "#212529" }}>
                            <div className="d-flex align-items-center mb-1">
                                <i className="bi bi-boxes mr-2 text-muted" />
                                <span className="font-weight-bold">{cat.trim()}</span>
                                <span className="badge badge-secondary ml-auto">{10 + i * 8} items</span>
                            </div>
                            <div className="progress" style={{ height: 4 }}>
                                <div className="progress-bar" style={{ width: `${60 + i * 12}%`, background: app.primaryColor }} />
                            </div>
                            <small className="text-muted">{60 + i * 12}% in stock</small>
                        </div>
                    ))}
                </div>
            );
        }

        // Generic fallback
        return (
            <div>
                <h6 className="font-weight-bold mb-3">
                    <i className={`bi ${info.icon} mr-2`} style={{ color: app.primaryColor }} />
                    {current.config.sectionTitle || info.title}
                </h6>
                <p className="text-muted small">{info.description}</p>
                <div className="border rounded p-4 text-center text-muted" style={{ background: "#f8f9fa", color: "#212529" }}>
                    <i className={`bi ${info.icon} d-block mb-2`} style={{ fontSize: "2rem", opacity: 0.3 }} />
                    {info.title} module is configured and ready.
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1060, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}>
            <div style={{ width: "100%", maxWidth: 940, maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
                onClick={e => e.stopPropagation()}>

                {/* Browser chrome */}
                <div style={{ background: "#2c2c2c", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                        {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                        ))}
                    </div>
                    <div style={{ flex: 1, background: "#3c3c3c", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="bi bi-lock-fill" style={{ color: "#4caf50", fontSize: "0.72rem" }} />
                        <span style={{ color: "#e0e0e0", fontSize: "0.82rem", flex: 1, userSelect: "all" }}>{url}</span>
                        <i className="bi bi-box-arrow-up-right" style={{ color: "#aaa", fontSize: "0.75rem", cursor: "pointer" }} title="Open live URL" />
                    </div>
                    <button className="btn btn-xs" style={{ color: "#ccc", padding: "2px 8px" }} onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* App shell */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* App header */}
                    <div style={{ background: app.primaryColor, color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <i className={`bi ${app.iconClass}`} style={{ fontSize: "1.25rem" }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{app.name}</div>
                            {app.tagline && <div style={{ fontSize: "0.72rem", opacity: 0.8 }}>{app.tagline}</div>}
                        </div>
                        <div className="ml-auto d-flex align-items-center" style={{ gap: 12, fontSize: "0.85rem" }}>
                            <i className="bi bi-bell" />
                            <i className="bi bi-person-circle" style={{ fontSize: "1.2rem" }} />
                        </div>
                    </div>

                    {/* Top nav style */}
                    {app.navStyle === "topnav" && (
                        <div style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6", display: "flex", flexShrink: 0 }}>
                            {app.modules.map(m => {
                                const mi = MODULE_REGISTRY[m.type];
                                return (
                                    <button key={m.id}
                                        className="btn border-0 rounded-0 px-3 py-2"
                                        style={{
                                            fontSize: "0.82rem",
                                            borderBottom: activeModule === m.type ? `2px solid ${app.primaryColor}` : "2px solid transparent",
                                            color: activeModule === m.type ? app.primaryColor : "#212529",
                                        }}
                                        onClick={() => setActiveModule(m.type)}>
                                        <i className={`bi ${mi.icon} mr-1`} />{m.config.sectionTitle || mi.title}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                        {/* Sidebar nav */}
                        {app.navStyle === "sidebar" && (
                            <div style={{ width: 175, background: "#1e2a35", overflowY: "auto", flexShrink: 0 }}>
                                {app.modules.map(m => {
                                    const mi = MODULE_REGISTRY[m.type];
                                    return (
                                        <button key={m.id}
                                            className="btn btn-block text-left border-0 rounded-0 px-3 py-2 d-flex align-items-center"
                                            style={{
                                                fontSize: "0.83rem",
                                                background: activeModule === m.type ? app.primaryColor : "transparent",
                                                color: activeModule === m.type ? "#fff" : "#adb5bd",
                                                borderLeft: `3px solid ${activeModule === m.type ? "rgba(255,255,255,0.4)" : "transparent"}`,
                                            }}
                                            onClick={() => setActiveModule(m.type)}>
                                            <i className={`bi ${mi.icon} mr-2`} style={{ width: 16 }} />
                                            {m.config.sectionTitle || mi.title}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", background: "#fff" }}>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Version History ──────────────────────────────────────────────────────────
function AppVersionHistory({ app, onClose }: { app: DesignedApp; onClose: () => void }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}>
            <div className="card shadow" style={{ width: "100%", maxWidth: 520, maxHeight: "75vh", overflowY: "auto" }}
                onClick={e => e.stopPropagation()}>
                <div className="card-header d-flex justify-content-between align-items-center" style={{ background: "#1a3a4a", color: "#fff" }}>
                    <strong><i className="bi bi-clock-history mr-2" />{app.name} — Version History</strong>
                    <button className="btn btn-xs btn-outline-light" onClick={onClose}><i className="bi bi-x-lg" /></button>
                </div>
                <div className="card-body p-0">
                    {app.versions.length === 0 ? (
                        <div className="text-muted text-center py-4 px-3">No version history yet. Versions are saved automatically when a Published app is updated.</div>
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
                                        <td><span className="badge badge-secondary">{v.versionNum}</span></td>
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

// ─── Config Field Renderer ────────────────────────────────────────────────────
function ConfigFieldInput({ field, modId, value, onChange }: {
    field: ConfigField; modId: string; value: string; onChange: (v: string) => void;
}) {
    const inputId = `cfg-${modId}-${field.key}`;
    if (field.kind === "toggle") {
        return (
            <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
                <div>
                    <label htmlFor={inputId} className="small font-weight-bold mb-0">{field.label}</label>
                    {field.hint && <div className="text-muted" style={{ fontSize: "0.72rem" }}>{field.hint}</div>}
                </div>
                <div className="custom-control custom-switch">
                    <input type="checkbox" className="custom-control-input" id={inputId}
                        checked={value === "true"} onChange={e => onChange(e.target.checked ? "true" : "false")} />
                    <label className="custom-control-label" htmlFor={inputId} />
                </div>
            </div>
        );
    }
    if (field.kind === "select") {
        return (
            <div className="mb-2">
                <label htmlFor={inputId} className="small font-weight-bold">{field.label}</label>
                <select id={inputId} className="form-control form-control-sm" value={value} onChange={e => onChange(e.target.value)}>
                    {(field.options || []).map(o => <option key={o}>{o}</option>)}
                </select>
            </div>
        );
    }
    if (field.kind === "textarea") {
        return (
            <div className="mb-2">
                <label htmlFor={inputId} className="small font-weight-bold">{field.label}</label>
                {field.hint && <div className="text-muted mb-1" style={{ fontSize: "0.72rem" }}>{field.hint}</div>}
                <textarea id={inputId} className="form-control form-control-sm" rows={2}
                    placeholder={field.placeholder} value={value}
                    onChange={e => onChange(e.target.value)} style={{ resize: "none" }} />
            </div>
        );
    }
    return (
        <div className="mb-2">
            <label htmlFor={inputId} className="small font-weight-bold">{field.label}</label>
            {field.hint && <div className="text-muted mb-1" style={{ fontSize: "0.72rem" }}>{field.hint}</div>}
            <input id={inputId} type={field.kind === "number" ? "number" : "text"}
                className="form-control form-control-sm"
                placeholder={field.placeholder} value={value}
                onChange={e => onChange(e.target.value)} />
        </div>
    );
}

// ─── App Editor ───────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
    "bi-person-badge-fill", "bi-geo-alt-fill", "bi-people-fill", "bi-shield-check",
    "bi-building", "bi-truck", "bi-tools", "bi-hospital", "bi-briefcase-fill",
    "bi-diagram-3-fill", "bi-file-earmark-text-fill", "bi-globe", "bi-grid-fill",
    "bi-bar-chart-line-fill", "bi-calendar3", "bi-chat-dots-fill",
];

function makeApp(): DesignedApp {
    const id = uid();
    return {
        id, name: "New App", tagline: "", description: "",
        version: "v0.1", status: "Draft",
        primaryColor: "#2F4F4F", iconClass: "bi-grid-fill",
        slug: `app-${id.slice(0, 6)}`, theme: "light", navStyle: "sidebar",
        modules: [], versions: [], updatedAt: new Date().toISOString().slice(0, 10),
    };
}

type EditorTab = "general" | "appearance" | "modules";

function AppEditor({ app, onSave, onCancel }: { app: DesignedApp; onSave: (a: DesignedApp) => void; onCancel: () => void }) {
    const [draft, setDraft] = useState<DesignedApp>({
        ...app,
        modules: app.modules.map(m => ({ ...m, config: { ...m.config } })),
        versions: app.versions,
    });
    const [expandedModule, setExpandedModule] = useState<string | null>(null);
    const [editorTab, setEditorTab] = useState<EditorTab>("general");

    const addedTypes = new Set(draft.modules.map(m => m.type));
    const setMeta = (patch: Partial<DesignedApp>) => setDraft(prev => ({ ...prev, ...patch }));

    const addModule = (type: ModuleType) => {
        setDraft(prev => ({ ...prev, modules: [...prev.modules, { id: uid(), type, config: { ...MODULE_REGISTRY[type].defaultConfig } }] }));
    };
    const removeModule = (id: string) => {
        setDraft(prev => ({ ...prev, modules: prev.modules.filter(m => m.id !== id) }));
        if (expandedModule === id) setExpandedModule(null);
    };
    const moveModule = (idx: number, dir: -1 | 1) => {
        setDraft(prev => {
            const ms = [...prev.modules];
            [ms[idx], ms[idx + dir]] = [ms[idx + dir], ms[idx]];
            return { ...prev, modules: ms };
        });
    };
    const setModuleConfig = (id: string, key: string, value: string) => {
        setDraft(prev => ({
            ...prev,
            modules: prev.modules.map(m => m.id === id ? { ...m, config: { ...m.config, [key]: value } } : m),
        }));
    };

    const tabIcons: Record<EditorTab, string> = {
        general: "bi-sliders", appearance: "bi-palette", modules: "bi-grid",
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center justify-content-between" style={{ background: "#1a3a4a", color: "#fff" }}>
                <strong>
                    <i className={`bi ${draft.iconClass} mr-2`} />
                    {draft.name || "Untitled App"}
                    <span className={`badge badge-${statusVariant(draft.status)} ml-2`}>{draft.status}</span>
                </strong>
                <div className="d-flex gap-2">
                    <small className="text-muted mr-2" style={{ fontSize: "0.75rem" }}>{appUrl(draft.slug)}</small>
                    <button className="btn btn-xs btn-outline-light" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-xs btn-success" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
                        <i className="bi bi-check2 mr-1" />Save
                    </button>
                </div>
            </div>

            <div className="card-body p-0">
                {/* Editor tabs */}
                <ul className="nav nav-tabs px-3 pt-2" style={{ background: "#f8f9fa", color: "#212529" }}>
                    {(["general", "appearance", "modules"] as EditorTab[]).map(tab => (
                        <li key={tab} className="nav-item">
                            <button className={`nav-link ${editorTab === tab ? "active" : ""}`} onClick={() => setEditorTab(tab)}>
                                <i className={`bi ${tabIcons[tab]} mr-1`} />
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {tab === "modules" && <span className="badge badge-secondary ml-1">{draft.modules.length}</span>}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="p-3">
                    {/* General */}
                    {editorTab === "general" && (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="small font-weight-bold">App Name *</label>
                                    <input className="form-control form-control-sm" value={draft.name}
                                        onChange={e => {
                                            const name = e.target.value;
                                            setDraft(prev => ({
                                                ...prev, name,
                                                slug: (prev.slug === autoSlug(prev.name) || !prev.slug) ? autoSlug(name) : prev.slug,
                                            }));
                                        }} />
                                </div>
                                <div className="mb-3">
                                    <label className="small font-weight-bold">Tagline</label>
                                    <input className="form-control form-control-sm" value={draft.tagline}
                                        placeholder="Short headline shown in the app header"
                                        onChange={e => setMeta({ tagline: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="small font-weight-bold">Description</label>
                                    <textarea className="form-control form-control-sm" rows={2} value={draft.description}
                                        placeholder="Internal notes about this app's purpose"
                                        onChange={e => setMeta({ description: e.target.value })} style={{ resize: "none" }} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="small font-weight-bold">URL Endpoint</label>
                                    <div className="input-group input-group-sm">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text" style={{ fontSize: "0.72rem" }}>.../apps/</span>
                                        </div>
                                        <input className="form-control" value={draft.slug}
                                            onChange={e => setMeta({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                                    </div>
                                    <div className="text-muted mt-1" style={{ fontSize: "0.72rem" }}>
                                        Live URL: <code style={{ fontSize: "0.7rem" }}>{appUrl(draft.slug)}</code>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <label className="small font-weight-bold">Status</label>
                                        <select className="form-control form-control-sm" value={draft.status}
                                            onChange={e => setMeta({ status: e.target.value as AppStatus })}>
                                            {(["Draft", "Published", "Archived"] as AppStatus[]).map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label className="small font-weight-bold">Version</label>
                                        <input className="form-control form-control-sm" value={draft.version} readOnly
                                            style={{ background: "#f8f9fa", color: "#212529" }}
                                            title="Auto-incremented when a Published app is saved" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appearance */}
                    {editorTab === "appearance" && (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="small font-weight-bold">Primary Color</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" className="form-control form-control-sm p-0" style={{ width: 48, height: 31 }}
                                            value={draft.primaryColor} onChange={e => setMeta({ primaryColor: e.target.value })} />
                                        <input className="form-control form-control-sm" style={{ width: 110 }} value={draft.primaryColor}
                                            onChange={e => setMeta({ primaryColor: e.target.value })} />
                                        <div className="border rounded" style={{ width: 48, height: 31, background: draft.primaryColor }} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="small font-weight-bold">Navigation Style</label>
                                    <div className="d-flex gap-2">
                                        {(["sidebar", "topnav"] as NavStyle[]).map(ns => (
                                            <button key={ns}
                                                className={`btn btn-sm flex-grow-1 ${draft.navStyle === ns ? "btn-primary" : "btn-outline-secondary"}`}
                                                onClick={() => setMeta({ navStyle: ns })}>
                                                <i className={`bi ${ns === "sidebar" ? "bi-layout-sidebar" : "bi-layout-three-columns"} mr-1`} />
                                                {ns === "sidebar" ? "Sidebar" : "Top Nav"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="small font-weight-bold">Theme</label>
                                    <div className="d-flex gap-2">
                                        {(["light", "dark"] as AppTheme[]).map(t => (
                                            <button key={t}
                                                className={`btn btn-sm flex-grow-1 ${draft.theme === t ? "btn-primary" : "btn-outline-secondary"}`}
                                                onClick={() => setMeta({ theme: t })}>
                                                <i className={`bi ${t === "light" ? "bi-sun" : "bi-moon-stars"} mr-1`} />
                                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="small font-weight-bold d-block mb-2">App Icon</label>
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {ICON_OPTIONS.map(ic => (
                                        <button key={ic}
                                            className={`btn ${draft.iconClass === ic ? "btn-primary" : "btn-outline-secondary"}`}
                                            style={{ width: 38, height: 38, padding: 0 }}
                                            onClick={() => setMeta({ iconClass: ic })}
                                            title={ic.replace("bi-", "").replace(/-/g, " ")}>
                                            <i className={`bi ${ic}`} style={{ fontSize: "1rem" }} />
                                        </button>
                                    ))}
                                </div>
                                {/* Live header preview */}
                                <div className="border rounded overflow-hidden" style={{ fontSize: "0.82rem" }}>
                                    <div style={{ background: draft.primaryColor, color: "#fff", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className={`bi ${draft.iconClass}`} style={{ fontSize: "1.1rem" }} />
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{draft.name || "App Name"}</div>
                                            {draft.tagline && <div style={{ fontSize: "0.68rem", opacity: 0.8 }}>{draft.tagline}</div>}
                                        </div>
                                    </div>
                                    <div className="p-2 text-center text-muted" style={{ background: "#f8f9fa", color: "#212529", fontSize: "0.75rem" }}>
                                        Header preview · {draft.navStyle === "sidebar" ? "Sidebar navigation" : "Top navigation"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modules */}
                    {editorTab === "modules" && (
                        <div className="row">
                            {/* Palette */}
                            <div className="col-md-4">
                                <div className="font-weight-bold small mb-2">
                                    <i className="bi bi-boxes mr-1" />Available Modules
                                    <small className="text-muted ml-1">— click to add</small>
                                </div>
                                <div style={{ maxHeight: 420, overflowY: "auto" }}>
                                    {ALL_MODULE_TYPES.map(type => {
                                        const mi = MODULE_REGISTRY[type];
                                        const added = addedTypes.has(type);
                                        return (
                                            <button key={type}
                                                className={`btn btn-block text-left d-flex align-items-start p-2 mb-1 ${added ? "btn-light text-dark" : "btn-outline-primary"}`}
                                                style={{ fontSize: "0.82rem", borderRadius: 4 }}
                                                disabled={added}
                                                onClick={() => !added && addModule(type)}>
                                                <i className={`bi ${mi.icon} mr-2 mt-1`} style={{ width: 18, flexShrink: 0 }} />
                                                <div>
                                                    <div>{mi.title}{added && <i className="bi bi-check2 text-success ml-1" />}</div>
                                                    <div className="font-weight-normal" style={{ fontSize: "0.7rem", color: "#6c757d" }}>{mi.description.slice(0, 48)}…</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="col-md-8">
                                <div className="font-weight-bold small mb-2">
                                    <i className="bi bi-layout-wtf mr-1" />Module Canvas
                                    <span className="badge badge-secondary ml-2">{draft.modules.length} added</span>
                                </div>
                                {draft.modules.length === 0 ? (
                                    <div className="border rounded text-center text-muted py-5" style={{ borderStyle: "dashed" }}>
                                        <i className="bi bi-plus-circle d-block mb-2" style={{ fontSize: "1.5rem", opacity: 0.4 }} />
                                        Select modules from the palette to add them.
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: 420, overflowY: "auto" }}>
                                        {draft.modules.map((mod, idx) => {
                                            const mi = MODULE_REGISTRY[mod.type];
                                            const isExpanded = expandedModule === mod.id;
                                            return (
                                                <div key={mod.id} className="border rounded mb-2" style={{ background: "#f8f9fa", color: "#212529" }}>
                                                    <div className="d-flex align-items-center p-2">
                                                        <div className="d-flex flex-column mr-2" style={{ gap: 2 }}>
                                                            <button className="btn btn-xs btn-outline-secondary" disabled={idx === 0} onClick={() => moveModule(idx, -1)}>
                                                                <i className="bi bi-chevron-up" />
                                                            </button>
                                                            <button className="btn btn-xs btn-outline-secondary" disabled={idx === draft.modules.length - 1} onClick={() => moveModule(idx, 1)}>
                                                                <i className="bi bi-chevron-down" />
                                                            </button>
                                                        </div>
                                                        <i className={`bi ${mi.icon} mr-2 text-muted`} style={{ fontSize: "1.1rem" }} />
                                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                            <div className="font-weight-bold" style={{ fontSize: "0.88rem" }}>
                                                                {mod.config.sectionTitle || mi.title}
                                                            </div>
                                                            <small className="text-muted">{mi.description.slice(0, 55)}…</small>
                                                        </div>
                                                        <div className="d-flex gap-1 ml-2">
                                                            <button className="btn btn-xs btn-outline-secondary"
                                                                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                                                                title={isExpanded ? "Collapse settings" : "Configure module"}>
                                                                <i className={`bi bi-gear${isExpanded ? "-fill" : ""}`} />
                                                            </button>
                                                            <button className="btn btn-xs btn-outline-danger"
                                                                onClick={() => removeModule(mod.id)} title="Remove module">
                                                                <i className="bi bi-x-lg" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="border-top p-3" style={{ background: "#fff" }}>
                                                            <div className="small font-weight-bold text-muted mb-2">
                                                                <i className="bi bi-gear mr-1" />{mi.title} Settings
                                                            </div>
                                                            {mi.configFields.map(field => (
                                                                <ConfigFieldInput
                                                                    key={field.key}
                                                                    field={field}
                                                                    modId={mod.id}
                                                                    value={mod.config[field.key] ?? ""}
                                                                    onChange={val => setModuleConfig(mod.id, field.key, val)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── App Card ─────────────────────────────────────────────────────────────────
function AppCard({ app, onEdit, onDelete, onPreview, onHistory }: {
    app: DesignedApp;
    onEdit: () => void;
    onDelete: () => void;
    onPreview: () => void;
    onHistory: () => void;
}) {
    const url = appUrl(app.slug);
    return (
        <div className="card shadow-sm border-0 h-100">
            <div style={{ height: 5, background: app.primaryColor, borderRadius: "4px 4px 0 0" }} />
            <div className="card-body">
                <div className="d-flex align-items-start mb-2">
                    <div className="rounded mr-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 42, height: 42, background: app.primaryColor }}>
                        <i className={`bi ${app.iconClass}`} style={{ color: "#fff", fontSize: "1.25rem" }} />
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="font-weight-bold" style={{ fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {app.name}
                        </div>
                        <div className="text-muted small" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {app.tagline || app.description || <em>No description</em>}
                        </div>
                    </div>
                    <span className={`badge badge-${statusVariant(app.status)} ml-2 flex-shrink-0`}>{app.status}</span>
                </div>

                {/* Live URL */}
                <div className="d-flex align-items-center rounded mb-2 px-2 py-1" style={{ background: "#f8f9fa", fontSize: "0.75rem" }}>
                    <i className="bi bi-link-45deg text-muted mr-1" />
                    <code className="flex-grow-1 text-truncate" style={{ color: "#212529" }}>{url}</code>
                    <button className="btn btn-xs btn-outline-secondary ml-1" onClick={onPreview} title="Live Preview">
                        <i className="bi bi-box-arrow-up-right" />
                    </button>
                </div>

                {/* Modules */}
                <div className="d-flex flex-wrap gap-1 mb-2">
                    {app.modules.slice(0, 5).map(m => (
                        <span key={m.id} className="badge badge-light text-dark border" style={{ fontSize: "0.72rem" }}
                            title={MODULE_REGISTRY[m.type].title}>
                            <i className={`bi ${MODULE_REGISTRY[m.type].icon} mr-1`} />
                            {m.config.sectionTitle || MODULE_REGISTRY[m.type].title}
                        </span>
                    ))}
                    {app.modules.length > 5 && <span className="badge badge-secondary">+{app.modules.length - 5}</span>}
                    {app.modules.length === 0 && <span className="text-muted small">No modules added</span>}
                </div>

                <div className="d-flex align-items-center" style={{ fontSize: "0.75rem" }}>
                    <span className="badge badge-info mr-2">{app.version}</span>
                    {app.versions.length > 0 && <span className="text-muted mr-2">{app.versions.length} prev</span>}
                    <span className="text-muted ml-auto">Updated {app.updatedAt}</span>
                </div>
            </div>
            <div className="card-footer bg-light text-dark d-flex gap-1 py-2">
                <button className="btn btn-xs btn-outline-secondary flex-grow-1" onClick={onPreview}>
                    <i className="bi bi-eye mr-1" />Preview
                </button>
                <button className="btn btn-xs btn-outline-secondary" onClick={onHistory}
                    disabled={app.versions.length === 0} title="Version History">
                    <i className="bi bi-clock-history" />
                </button>
                <button className="btn btn-xs btn-outline-primary" onClick={onEdit} title="Edit">
                    <i className="bi bi-pencil" />
                </button>
                <button className="btn btn-xs btn-outline-danger" onClick={onDelete} title="Delete">
                    <i className="bi bi-trash" />
                </button>
            </div>
        </div>
    );
}

// ─── App Builder Tab ──────────────────────────────────────────────────────────
function AppBuilderTab() {
    const [apps, setApps] = useState<DesignedApp[]>(SEED_APPS);
    const [editingApp, setEditingApp] = useState<DesignedApp | null>(null);
    const [previewApp, setPreviewApp] = useState<DesignedApp | null>(null);
    const [historyApp, setHistoryApp] = useState<DesignedApp | null>(null);
    const today = new Date().toISOString().slice(0, 10);

    const saveApp = (app: DesignedApp) => {
        setApps(prev => {
            const existing = prev.find(a => a.id === app.id);
            if (existing && existing.status === "Published") {
                const snapshot: AppVersion = {
                    versionNum: existing.version,
                    publishedAt: existing.updatedAt,
                    modules: existing.modules.map(m => ({ ...m, config: { ...m.config } })),
                };
                return prev.map(a => a.id === app.id
                    ? { ...app, version: bumpVersion(existing.version), versions: [...existing.versions, snapshot], updatedAt: today }
                    : a);
            }
            if (existing) return prev.map(a => a.id === app.id ? { ...app, updatedAt: today } : a);
            return [{ ...app, updatedAt: today }, ...prev];
        });
        setEditingApp(null);
    };

    const deleteApp = (id: string) => {
        if (!window.confirm("Delete this app? This cannot be undone.")) return;
        setApps(prev => prev.filter(a => a.id !== id));
        if (editingApp?.id === id) setEditingApp(null);
    };

    const startEdit = (app: DesignedApp) => setEditingApp({
        ...app,
        modules: app.modules.map(m => ({ ...m, config: { ...m.config } })),
        versions: app.versions,
    });

    return (
        <div>
            {previewApp && <AppPreview app={previewApp} onClose={() => setPreviewApp(null)} />}
            {historyApp && <AppVersionHistory app={historyApp} onClose={() => setHistoryApp(null)} />}

            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h5 className="mb-0 font-weight-bold">
                        <i className="bi bi-grid-fill mr-2" style={{ color: "#2F4F4F" }} />App Builder
                    </h5>
                    <small className="text-muted">Build, configure, and deploy custom apps. Each app gets a live URL endpoint your clients can access.</small>
                </div>
                {!editingApp && (
                    <button className="btn btn-primary btn-sm" onClick={() => setEditingApp(makeApp())}>
                        <i className="bi bi-plus-circle mr-1" />New App
                    </button>
                )}
            </div>

            {editingApp && (
                <AppEditor app={editingApp} onSave={saveApp} onCancel={() => setEditingApp(null)} />
            )}

            {!editingApp && (
                <>
                    {apps.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            <i className="bi bi-grid" style={{ fontSize: "3rem", opacity: 0.25 }} />
                            <p className="mt-3">No apps yet. Click "New App" to get started.</p>
                        </div>
                    ) : (
                        <div className="row">
                            {apps.map(app => (
                                <div key={app.id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                                    <AppCard
                                        app={app}
                                        onEdit={() => startEdit(app)}
                                        onDelete={() => deleteApp(app.id)}
                                        onPreview={() => setPreviewApp(app)}
                                        onHistory={() => setHistoryApp(app)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Module reference */}
                    <div className="card shadow-sm mt-2">
                        <div className="card-header font-weight-bold" style={{ background: "#f8f9fa", color: "#212529" }}>
                            <i className="bi bi-boxes mr-2" />Available Modules
                            <small className="text-muted ml-2 font-weight-normal">— mix and match to build any application</small>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {ALL_MODULE_TYPES.map(type => {
                                    const mi = MODULE_REGISTRY[type];
                                    return (
                                        <div key={type} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                            <div className="card h-100 border-secondary">
                                                <div className="card-body text-center py-3">
                                                    <i className={`bi ${mi.icon} d-block mb-2 text-muted`} style={{ fontSize: "1.5rem" }} />
                                                    <h6 className="font-weight-bold mb-1" style={{ fontSize: "0.82rem" }}>{mi.title}</h6>
                                                    <p className="small text-muted mb-0" style={{ fontSize: "0.75rem" }}>{mi.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
type Tab = "builder" | "apps" | "suites" | "workflows"; // apps/suites kept for import compatibility

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
            <small className="text-muted d-block mt-2">
                <i className="bi bi-boxes mr-1" />
                To control public visibility and subscription requirements, use <strong>App Manager</strong> in the sidebar.
            </small>
        </div>
    );
}
