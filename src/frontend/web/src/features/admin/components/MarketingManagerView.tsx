import { useState } from "react";

function uid() { return Math.random().toString(36).slice(2, 10); }

type Tab = "campaigns" | "platforms" | "content";

// ——— Campaign types ———
type CampaignStatus = "Draft" | "Active" | "Paused" | "Completed";
type CampaignChannel = "Email" | "LinkedIn" | "X / Twitter" | "Facebook" | "Web" | "Other";
type Campaign = {
    id: string;
    name: string;
    channel: CampaignChannel;
    status: CampaignStatus;
    startDate: string;
    endDate: string;
    budget: number | null;
    goal: string;
    description: string;
};

// ——— Platform types ———
type PlatformEntry = {
    id: string;
    platform: string;
    handle: string;
    status: "Connected" | "Disconnected";
    notes: string;
};

// ——— Brand asset types ———
type AssetType = "Logo" | "Icon" | "Banner" | "Color Palette" | "Font" | "Template" | "Other";
type BrandAsset = {
    id: string;
    name: string;
    type: AssetType;
    url: string;
    notes: string;
    createdAt: string;
};

// ——— Constants ———
const CAMPAIGN_STATUSES: CampaignStatus[] = ["Draft", "Active", "Paused", "Completed"];
const CAMPAIGN_CHANNELS: CampaignChannel[] = ["Email", "LinkedIn", "X / Twitter", "Facebook", "Web", "Other"];

const CAMPAIGN_STATUS_BADGE: Record<CampaignStatus, string> = {
    Draft: "secondary",
    Active: "success",
    Paused: "warning",
    Completed: "primary",
};

const CHANNEL_ICONS: Record<CampaignChannel, string> = {
    Email: "bi-envelope-fill",
    LinkedIn: "bi-linkedin",
    "X / Twitter": "bi-twitter-x",
    Facebook: "bi-facebook",
    Web: "bi-globe",
    Other: "bi-megaphone",
};

const PLATFORM_LIST = [
    { name: "LinkedIn", icon: "bi-linkedin" },
    { name: "X / Twitter", icon: "bi-twitter-x" },
    { name: "Facebook", icon: "bi-facebook" },
    { name: "Instagram", icon: "bi-instagram" },
    { name: "Email Marketing", icon: "bi-envelope-fill" },
    { name: "Website/Blog", icon: "bi-globe" },
];

const PLATFORM_ICONS: Record<string, string> = Object.fromEntries(PLATFORM_LIST.map(p => [p.name, p.icon]));

const ASSET_TYPES: AssetType[] = ["Logo", "Icon", "Banner", "Color Palette", "Font", "Template", "Other"];

const fmtCurrency = (v: number | null) =>
    v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : null;

const fmtDate = (iso: string) =>
    iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

// ——— Empty forms ———
const emptyCampaign = (): Omit<Campaign, "id"> => ({
    name: "", channel: "Email", status: "Draft",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "", budget: null, goal: "", description: "",
});

const emptyPlatform = (): Omit<PlatformEntry, "id"> => ({
    platform: "LinkedIn", handle: "", status: "Disconnected", notes: "",
});

const emptyBrandAsset = (): Omit<BrandAsset, "id"> => ({
    name: "", type: "Logo", url: "", notes: "",
    createdAt: new Date().toISOString().slice(0, 10),
});

// ——— Campaigns tab ———
function CampaignsTab() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyCampaign());
    const [filterStatus, setFilterStatus] = useState<CampaignStatus | "">("");

    const startCreate = () => { setForm(emptyCampaign()); setEditingId(null); setShowForm(true); };
    const startEdit = (c: Campaign) => {
        setForm({
            name: c.name, channel: c.channel, status: c.status,
            startDate: c.startDate, endDate: c.endDate,
            budget: c.budget, goal: c.goal, description: c.description,
        });
        setEditingId(c.id);
        setShowForm(true);
    };
    const cancelForm = () => { setShowForm(false); setEditingId(null); };

    const handleSave = () => {
        if (!form.name.trim()) return;
        if (editingId) {
            setCampaigns(cs => cs.map(c => c.id === editingId ? { ...form, id: editingId } : c));
        } else {
            setCampaigns(cs => [...cs, { ...form, id: uid() }]);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(emptyCampaign());
    };

    const deleteCampaign = (id: string) => setCampaigns(cs => cs.filter(c => c.id !== id));

    const totalBudget = campaigns.reduce((s, c) => s + (c.budget ?? 0), 0);
    const activeCount = campaigns.filter(c => c.status === "Active").length;
    const completedCount = campaigns.filter(c => c.status === "Completed").length;

    const filtered = filterStatus ? campaigns.filter(c => c.status === filterStatus) : campaigns;

    return (
        <div>
            {/* Summary cards */}
            <div className="row mb-4">
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Total Campaigns</div>
                            <div className="h4 font-weight-bold mb-0">{campaigns.length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Active</div>
                            <div className="h4 font-weight-bold text-success mb-0">{activeCount}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Total Budget</div>
                            <div className="h4 font-weight-bold mb-0">{fmtCurrency(totalBudget) ?? "$0"}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase font-weight-bold mb-1">Completed</div>
                            <div className="h4 font-weight-bold mb-0">{completedCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New campaign form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                        <strong>{editingId ? "Edit Campaign" : "New Campaign"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row mb-2">
                            <div className="col-md-5">
                                <label className="small font-weight-bold">Campaign Name *</label>
                                <input className="form-control form-control-sm" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Channel</label>
                                <select className="form-control form-control-sm" value={form.channel}
                                    onChange={e => setForm(f => ({ ...f, channel: e.target.value as CampaignChannel }))}>
                                    {CAMPAIGN_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small font-weight-bold">Status</label>
                                <select className="form-control form-control-sm" value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as CampaignStatus }))}>
                                    {CAMPAIGN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Start Date</label>
                                <input type="date" className="form-control form-control-sm" value={form.startDate}
                                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">End Date</label>
                                <input type="date" className="form-control form-control-sm" value={form.endDate}
                                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Budget (optional)</label>
                                <input type="number" min="0" className="form-control form-control-sm"
                                    value={form.budget ?? ""}
                                    onChange={e => setForm(f => ({ ...f, budget: e.target.value ? Number(e.target.value) : null }))} />
                            </div>
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">Goal</label>
                            <input className="form-control form-control-sm" value={form.goal}
                                placeholder="e.g. Generate 20 qualified leads"
                                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">Description</label>
                            <textarea className="form-control form-control-sm" rows={2} value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.name.trim()}>
                                {editingId ? "Save Changes" : "Add Campaign"}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelForm}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status filter pills + New button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="small font-weight-bold text-muted">Status:</span>
                    <button className={`btn btn-sm ${filterStatus === "" ? "btn-dark" : "btn-outline-secondary"}`}
                        onClick={() => setFilterStatus("")}>All</button>
                    {CAMPAIGN_STATUSES.map(s => (
                        <button key={s} className={`btn btn-sm ${filterStatus === s ? `btn-${CAMPAIGN_STATUS_BADGE[s]}` : "btn-outline-secondary"}`}
                            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}>
                            {s}
                        </button>
                    ))}
                </div>
                {!showForm && (
                    <button className="btn btn-primary btn-sm" onClick={startCreate}>
                        <i className="bi bi-plus mr-1" />New Campaign
                    </button>
                )}
            </div>

            {/* Campaign list */}
            {filtered.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-lightning-charge" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No campaigns found. Create your first campaign to get started.</p>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <ul className="list-group list-group-flush">
                        {filtered.map(c => (
                            <li key={c.id} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <i className={`bi ${CHANNEL_ICONS[c.channel]} text-muted`} />
                                            <strong>{c.name}</strong>
                                            <span className={`badge badge-${CAMPAIGN_STATUS_BADGE[c.status]}`}>{c.status}</span>
                                            <span className="badge badge-light text-dark border">{c.channel}</span>
                                            {c.budget != null && (
                                                <span className="badge badge-outline-info text-info border border-info small">
                                                    {fmtCurrency(c.budget)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="small text-muted mt-1">
                                            {c.startDate && <><i className="bi bi-calendar mr-1" />{fmtDate(c.startDate)}</>}
                                            {c.endDate && <><span className="mx-1">→</span>{fmtDate(c.endDate)}</>}
                                            {c.goal && <><span className="mx-2">·</span><i className="bi bi-bullseye mr-1" />{c.goal}</>}
                                        </div>
                                        {c.description && (
                                            <div className="small text-muted mt-1">{c.description}</div>
                                        )}
                                    </div>
                                    <div className="d-flex gap-1 ml-2">
                                        <button className="btn btn-xs btn-outline-secondary" onClick={() => startEdit(c)}>
                                            <i className="bi bi-pencil" />
                                        </button>
                                        <button className="btn btn-xs btn-outline-danger" onClick={() => deleteCampaign(c.id)}>
                                            <i className="bi bi-trash" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ——— Platforms tab ———
function PlatformsTab() {
    const [platforms, setPlatforms] = useState<PlatformEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyPlatform());

    const startCreate = () => { setForm(emptyPlatform()); setEditingId(null); setShowForm(true); };
    const startEdit = (p: PlatformEntry) => {
        setForm({ platform: p.platform, handle: p.handle, status: p.status, notes: p.notes });
        setEditingId(p.id);
        setShowForm(true);
    };
    const cancelForm = () => { setShowForm(false); setEditingId(null); };

    const handleSave = () => {
        if (editingId) {
            setPlatforms(ps => ps.map(p => p.id === editingId ? { ...form, id: editingId } : p));
        } else {
            setPlatforms(ps => [...ps, { ...form, id: uid() }]);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(emptyPlatform());
    };

    const deletePlatform = (id: string) => setPlatforms(ps => ps.filter(p => p.id !== id));

    return (
        <div>
            <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle-fill mr-2" />
                Configure your platform connections to publish and track campaigns from one place.
            </div>

            {/* Form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                        <strong>{editingId ? "Edit Platform" : "Add Platform"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row mb-2">
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Platform</label>
                                <select className="form-control form-control-sm" value={form.platform}
                                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                                    {PLATFORM_LIST.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Handle / Account</label>
                                <input className="form-control form-control-sm" value={form.handle}
                                    placeholder="@handle or URL or email address"
                                    onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} />
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Status</label>
                                <select className="form-control form-control-sm" value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as PlatformEntry["status"] }))}>
                                    <option value="Connected">Connected</option>
                                    <option value="Disconnected">Disconnected</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">Notes</label>
                            <input className="form-control form-control-sm" value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                {editingId ? "Save Changes" : "Add Platform"}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelForm}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {!showForm && (
                <div className="d-flex justify-content-end mb-3">
                    <button className="btn btn-primary btn-sm" onClick={startCreate}>
                        <i className="bi bi-plus mr-1" />Add Platform
                    </button>
                </div>
            )}

            {platforms.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-share" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No platforms added yet. Add a platform connection to get started.</p>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {platforms.map(p => {
                        const icon = PLATFORM_ICONS[p.platform] ?? "bi-globe";
                        return (
                            <div key={p.id} className="col-md-6 mb-3">
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="d-flex align-items-center gap-3">
                                                <i className={`bi ${icon} text-primary`} style={{ fontSize: "2rem" }} />
                                                <div>
                                                    <h6 className="font-weight-bold mb-1">{p.platform}</h6>
                                                    {p.handle && (
                                                        <div className="small text-muted">{p.handle}</div>
                                                    )}
                                                    <span className={`badge badge-${p.status === "Connected" ? "success" : "secondary"}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-xs btn-outline-secondary" onClick={() => startEdit(p)}>
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button className="btn btn-xs btn-outline-danger" onClick={() => deletePlatform(p.id)}>
                                                    <i className="bi bi-trash" />
                                                </button>
                                            </div>
                                        </div>
                                        {p.notes && (
                                            <p className="small text-muted mt-2 mb-0">{p.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ——— Content & Assets tab ———
function ContentAssetsTab() {
    const [assets, setAssets] = useState<BrandAsset[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyBrandAsset());
    const [filterType, setFilterType] = useState<AssetType | "">("");

    const startCreate = () => { setForm(emptyBrandAsset()); setEditingId(null); setShowForm(true); };
    const startEdit = (a: BrandAsset) => {
        setForm({ name: a.name, type: a.type, url: a.url, notes: a.notes, createdAt: a.createdAt });
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
        setForm(emptyBrandAsset());
    };

    const deleteAsset = (id: string) => setAssets(as => as.filter(a => a.id !== id));

    const filtered = filterType ? assets.filter(a => a.type === filterType) : assets;

    return (
        <div>
            <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle-fill mr-2" />
                Centralize your brand assets — logos, palettes, fonts, and templates.
            </div>

            {/* Form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#1a3a4a", color: "#fff" }}>
                        <strong>{editingId ? "Edit Asset" : "Add Asset"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row mb-2">
                            <div className="col-md-5">
                                <label className="small font-weight-bold">Name *</label>
                                <input className="form-control form-control-sm" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="col-md-3">
                                <label className="small font-weight-bold">Type</label>
                                <select className="form-control form-control-sm" value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))}>
                                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="small font-weight-bold">Created Date</label>
                                <input type="date" className="form-control form-control-sm" value={form.createdAt}
                                    onChange={e => setForm(f => ({ ...f, createdAt: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">URL or Reference</label>
                            <input className="form-control form-control-sm" value={form.url}
                                placeholder="https://... or file path"
                                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                        </div>
                        <div className="form-group mb-2">
                            <label className="small font-weight-bold">Notes</label>
                            <input className="form-control form-control-sm" value={form.notes}
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

            {/* Filter pills + Add button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="small font-weight-bold text-muted">Type:</span>
                    <button className={`btn btn-sm ${filterType === "" ? "btn-dark" : "btn-outline-secondary"}`}
                        onClick={() => setFilterType("")}>All</button>
                    {ASSET_TYPES.map(t => (
                        <button key={t} className={`btn btn-sm ${filterType === t ? "btn-dark" : "btn-outline-secondary"}`}
                            onClick={() => setFilterType(filterType === t ? "" : t)}>
                            {t}
                        </button>
                    ))}
                </div>
                {!showForm && (
                    <button className="btn btn-primary btn-sm" onClick={startCreate}>
                        <i className="bi bi-plus mr-1" />Add Asset
                    </button>
                )}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-palette" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No brand assets found. Add an asset to build your library.</p>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>URL / Reference</th>
                                    <th>Notes</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id}>
                                        <td className="font-weight-bold">{a.name}</td>
                                        <td><span className="badge badge-secondary">{a.type}</span></td>
                                        <td className="small" style={{ maxWidth: 220 }}>
                                            {a.url ? (
                                                a.url.startsWith("http") ? (
                                                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                                                        className="text-truncate d-inline-block" style={{ maxWidth: 200 }}>
                                                        {a.url}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted" title={a.url}>
                                                        {a.url.length > 40 ? a.url.slice(0, 40) + "…" : a.url}
                                                    </span>
                                                )
                                            ) : <span className="text-muted">—</span>}
                                        </td>
                                        <td className="small text-muted">{a.notes.length > 40 ? a.notes.slice(0, 40) + "…" : a.notes}</td>
                                        <td className="small text-muted">{a.createdAt}</td>
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

// ——— Main export ———
export function MarketingManagerView() {
    const [tab, setTab] = useState<Tab>("campaigns");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-megaphone-fill mr-2 text-primary" />
                        Marketing Manager
                    </h4>
                    <small className="text-muted">
                        Design and publish marketing content across platforms — campaigns, social media, and brand assets.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${tab === "campaigns" ? "active" : ""}`} onClick={() => setTab("campaigns")}>
                        <i className="bi bi-lightning-charge mr-1" />Campaigns
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "platforms" ? "active" : ""}`} onClick={() => setTab("platforms")}>
                        <i className="bi bi-share mr-1" />Platforms
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "content" ? "active" : ""}`} onClick={() => setTab("content")}>
                        <i className="bi bi-palette mr-1" />Content &amp; Assets
                    </button>
                </li>
            </ul>

            {tab === "campaigns" && <CampaignsTab />}
            {tab === "platforms" && <PlatformsTab />}
            {tab === "content" && <ContentAssetsTab />}
        </div>
    );
}
