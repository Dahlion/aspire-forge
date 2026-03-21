import { useState, useRef } from "react";

function uid() { return Math.random().toString(36).slice(2, 10); }

type DeployStatus = "Running" | "Stopped" | "Error";

type DeployedApp = {
    id: string;
    name: string;
    version: string;
    filename: string;
    status: DeployStatus;
    deployedAt: string;
    url: string;
    size: string;
    logs: string[];
};

const SEED_APPS: DeployedApp[] = [
    {
        id: uid(), name: "EMS Dispatch Portal", version: "2.1.4",
        filename: "ems-dispatch-2.1.4.zip", status: "Running",
        deployedAt: "2026-03-15", url: "https://ems.cityofacme.gov", size: "4.2 MB",
        logs: [
            "[2026-03-15 09:12:01] Deployment started",
            "[2026-03-15 09:12:03] Extracting archive...",
            "[2026-03-15 09:12:05] Dependencies resolved",
            "[2026-03-15 09:12:07] App started on port 3000",
            "[2026-03-15 09:12:08] Health check passed — status: Running",
        ],
    },
    {
        id: uid(), name: "HR Employee Self-Service", version: "1.0.2",
        filename: "hr-self-service-1.0.2.zip", status: "Running",
        deployedAt: "2026-03-18", url: "https://hr.acmeinternal.com", size: "2.8 MB",
        logs: [
            "[2026-03-18 14:30:00] Deployment started",
            "[2026-03-18 14:30:02] Extracting archive...",
            "[2026-03-18 14:30:04] Running migrations...",
            "[2026-03-18 14:30:06] App started — status: Running",
        ],
    },
    {
        id: uid(), name: "Inventory Tracker v3", version: "3.0.0",
        filename: "inventory-tracker-3.0.0.zip", status: "Stopped",
        deployedAt: "2026-03-10", url: "https://inv.westcoastops.io", size: "6.1 MB",
        logs: [
            "[2026-03-10 11:00:00] Deployment started",
            "[2026-03-10 11:00:05] App started — status: Running",
            "[2026-03-20 08:00:00] Manual stop requested",
            "[2026-03-20 08:00:01] App stopped — status: Stopped",
        ],
    },
];

function statusVariant(s: DeployStatus) {
    return s === "Running" ? "success" : s === "Error" ? "danger" : "secondary";
}

export function ZipDeployView() {
    const [apps, setApps] = useState<DeployedApp[]>(SEED_APPS);
    const [dragging, setDragging] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [viewLogsId, setViewLogsId] = useState<string | null>(null);
    const [newAppName, setNewAppName] = useState("");
    const [newAppVersion, setNewAppVersion] = useState("1.0.0");
    const [newAppUrl, setNewAppUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const logsApp = apps.find(a => a.id === viewLogsId);
    const running = apps.filter(a => a.status === "Running").length;

    const applyFile = (file: File) => {
        setSelectedFile(file);
        if (!newAppName) {
            setNewAppName(
                file.name
                    .replace(/[-_][\d.]+\.zip$/i, "")
                    .replace(/\.zip$/i, "")
                    .replace(/[-_]/g, " ")
            );
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.toLowerCase().endsWith(".zip")) applyFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) applyFile(file);
    };

    const handleDeploy = () => {
        if (!selectedFile || !newAppName.trim()) return;
        setDeploying(true);
        const now = new Date().toISOString().slice(0, 10);
        const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
        const id = uid();
        const sizeMb = selectedFile.size > 1_048_576
            ? `${(selectedFile.size / 1_048_576).toFixed(1)} MB`
            : `${(selectedFile.size / 1024).toFixed(0)} KB`;

        setTimeout(() => {
            setApps(prev => [{
                id,
                name: newAppName.trim(),
                version: newAppVersion || "1.0.0",
                filename: selectedFile.name,
                status: "Running",
                deployedAt: now,
                url: newAppUrl || `https://app-${id.slice(0, 6)}.seacoastdevops.io`,
                size: sizeMb,
                logs: [
                    `[${ts}] Deployment started — ${selectedFile.name}`,
                    `[${ts}] Extracting archive (${sizeMb})...`,
                    `[${ts}] Resolving dependencies...`,
                    `[${ts}] Running pre-start checks...`,
                    `[${ts}] App "${newAppName.trim()}" v${newAppVersion} started`,
                    `[${ts}] Health check passed — status: Running`,
                ],
            }, ...prev]);
            setSelectedFile(null);
            setNewAppName("");
            setNewAppVersion("1.0.0");
            setNewAppUrl("");
            setDeploying(false);
        }, 1800);
    };

    const toggleStatus = (id: string) => {
        setApps(prev => prev.map(a => {
            if (a.id !== id) return a;
            const next: DeployStatus = a.status === "Running" ? "Stopped" : "Running";
            const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
            return {
                ...a, status: next,
                logs: [...a.logs, `[${ts}] ${next === "Running" ? "App started" : "Manual stop"} — status: ${next}`],
            };
        }));
    };

    const removeApp = (id: string) => {
        if (!window.confirm("Remove this deployed app?")) return;
        setApps(prev => prev.filter(a => a.id !== id));
        if (viewLogsId === id) setViewLogsId(null);
    };

    return (
        <div>
            {/* Log viewer overlay */}
            {viewLogsId && logsApp && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setViewLogsId(null)}
                >
                    <div className="card shadow" style={{ width: "100%", maxWidth: 680, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                        onClick={e => e.stopPropagation()}>
                        <div className="card-header d-flex justify-content-between align-items-center"
                            style={{ background: "#1a3a4a", color: "#fff" }}>
                            <strong><i className="bi bi-terminal-fill mr-2" />{logsApp.name} — Deploy Logs</strong>
                            <button className="btn btn-xs btn-outline-light" onClick={() => setViewLogsId(null)}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <pre style={{
                            margin: 0, padding: "1rem",
                            background: "#0d1117", color: "#58d68d",
                            fontSize: "0.82rem", fontFamily: "monospace",
                            overflowY: "auto", flex: 1, minHeight: 200,
                        }}>
                            {logsApp.logs.join("\n")}
                        </pre>
                    </div>
                </div>
            )}

            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-cloud-upload-fill mr-2 text-primary" />
                        Zip Deploy
                    </h4>
                    <small className="text-muted">
                        Upload compiled application bundles (.zip) and deploy them as standalone apps.
                    </small>
                </div>
            </div>

            {/* KPI cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm text-center">
                        <div className="card-body py-3">
                            <div className="h3 font-weight-bold text-primary mb-0">{apps.length}</div>
                            <small className="text-muted">Deployed Apps</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm text-center">
                        <div className="card-body py-3">
                            <div className="h3 font-weight-bold text-success mb-0">{running}</div>
                            <small className="text-muted">Running</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card shadow-sm text-center">
                        <div className="card-body py-3">
                            <div className="h3 font-weight-bold text-secondary mb-0">{apps.length - running}</div>
                            <small className="text-muted">Stopped / Error</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload zone */}
            <div className="card shadow-sm mb-4">
                <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                    <strong><i className="bi bi-upload mr-2" />Deploy New App</strong>
                </div>
                <div className="card-body">
                    <div
                        className={`border rounded text-center p-4 mb-3 ${dragging ? "border-primary bg-light" : ""}`}
                        style={{ borderStyle: "dashed", cursor: "pointer", transition: "all 0.15s" }}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input ref={fileRef} type="file" accept=".zip" style={{ display: "none" }} onChange={handleFileSelect} />
                        {selectedFile ? (
                            <div>
                                <i className="bi bi-file-zip-fill d-block mb-2" style={{ fontSize: "2rem", color: "#1a3a4a" }} />
                                <strong>{selectedFile.name}</strong>
                                <div className="text-muted small mt-1">
                                    {(selectedFile.size / 1_048_576).toFixed(2)} MB — click to change file
                                </div>
                            </div>
                        ) : (
                            <div>
                                <i className="bi bi-cloud-upload d-block mb-2" style={{ fontSize: "2rem", opacity: 0.4 }} />
                                <strong className="text-muted">Drop .zip file here or click to browse</strong>
                                <div className="text-muted small mt-1">
                                    Supports compiled React, Angular, Vue, .NET Blazor, or any static site bundle
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="row">
                            <div className="col-md-4 mb-2">
                                <label className="small font-weight-bold">App Name *</label>
                                <input className="form-control form-control-sm" value={newAppName}
                                    onChange={e => setNewAppName(e.target.value)} placeholder="e.g. EMS Dispatch Portal" />
                            </div>
                            <div className="col-md-2 mb-2">
                                <label className="small font-weight-bold">Version</label>
                                <input className="form-control form-control-sm" value={newAppVersion}
                                    onChange={e => setNewAppVersion(e.target.value)} placeholder="1.0.0" />
                            </div>
                            <div className="col-md-4 mb-2">
                                <label className="small font-weight-bold">URL / Domain</label>
                                <input className="form-control form-control-sm" value={newAppUrl}
                                    onChange={e => setNewAppUrl(e.target.value)} placeholder="https://app.yourdomain.com" />
                            </div>
                            <div className="col-md-2 mb-2 d-flex align-items-end">
                                <button className="btn btn-primary btn-sm btn-block"
                                    disabled={deploying || !newAppName.trim()}
                                    onClick={handleDeploy}>
                                    {deploying
                                        ? <><span className="spinner-border spinner-border-sm mr-1" />Deploying…</>
                                        : <><i className="bi bi-cloud-upload mr-1" />Deploy</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Deployed apps list */}
            <div className="card shadow-sm">
                <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                    <strong><i className="bi bi-server mr-2" />Deployed Apps</strong>
                </div>
                {apps.length === 0 ? (
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-cloud-slash" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No apps deployed yet. Upload a .zip bundle above to get started.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>App</th>
                                    <th>Version</th>
                                    <th>URL</th>
                                    <th>Size</th>
                                    <th>Status</th>
                                    <th>Deployed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map(app => (
                                    <tr key={app.id}>
                                        <td>
                                            <i className="bi bi-box-seam mr-2 text-muted" />
                                            <strong>{app.name}</strong>
                                            <div className="text-muted small">{app.filename}</div>
                                        </td>
                                        <td><span className="badge badge-info">{app.version}</span></td>
                                        <td>
                                            <a href={app.url} target="_blank" rel="noopener noreferrer"
                                                className="small text-monospace" onClick={e => e.stopPropagation()}>
                                                {app.url}
                                            </a>
                                        </td>
                                        <td className="text-muted small">{app.size}</td>
                                        <td>
                                            <span className={`badge badge-${statusVariant(app.status)}`}>
                                                <i className={`bi bi-${app.status === "Running" ? "play-circle-fill" : "stop-circle-fill"} mr-1`} />
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="text-muted small">{app.deployedAt}</td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className={`btn btn-xs ${app.status === "Running" ? "btn-outline-warning" : "btn-outline-success"}`}
                                                    onClick={() => toggleStatus(app.id)}
                                                    title={app.status === "Running" ? "Stop" : "Start"}>
                                                    <i className={`bi bi-${app.status === "Running" ? "stop-fill" : "play-fill"}`} />
                                                </button>
                                                <button className="btn btn-xs btn-outline-secondary"
                                                    onClick={() => setViewLogsId(app.id)} title="View Logs">
                                                    <i className="bi bi-terminal" />
                                                </button>
                                                <button className="btn btn-xs btn-outline-danger"
                                                    onClick={() => removeApp(app.id)} title="Remove">
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
    );
}
