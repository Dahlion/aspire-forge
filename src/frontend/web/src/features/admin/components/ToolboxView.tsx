type ToolEntry = {
    id: string;
    icon: string;
    name: string;
    description: string;
    url: string;
    badgeText: string;
    badgeClass: string;
    credentials?: { label: string; value: string }[];
    note?: string;
};

const TOOLS: ToolEntry[] = [
    {
        id: "pgadmin",
        icon: "bi-database-fill",
        name: "pgAdmin 4",
        description: "Full-featured PostgreSQL management GUI. Connect to the 'pg' resource using the dynamic credentials from the Aspire Dashboard.",
        url: "http://localhost:5050",
        badgeText: "Admin UI",
        badgeClass: "badge-primary",
        credentials: [
            { label: "Host", value: "localhost" },
            { label: "Port", value: "5432" },
            { label: "Database", value: "Postgres" },
            { label: "User/Pass", value: "See Aspire Dashboard -> 'pg' Resource" },
        ],
        note: "Use 'localhost' if connecting from your machine, or 'pg' if connecting from another container.",
    },
    {
        id: "mailpit",
        icon: "bi-envelope-fill",
        name: "Mailpit",
        description: "Dev SMTP trap. Captures all outgoing emails from the API so they never reach real recipients. No authentication required.",
        url: "http://localhost:8025",
        badgeText: "No login",
        badgeClass: "badge-success",
        credentials: [
            { label: "SMTP Host", value: "localhost" },
            { label: "SMTP Port", value: "1025" },
            { label: "Web UI Port", value: "8025" },
        ]
    },
    {
        id: "keycloak",
        icon: "bi-shield-lock-fill",
        name: "Keycloak Admin Console",
        description: "Manage users, roles, and realm settings. Log in with the Keycloak admin credentials below.",
        url: "http://localhost:8080/admin",
        badgeText: "Admin login",
        badgeClass: "badge-warning",
        credentials: [
            { label: "Username", value: "admin" },
            { label: "Password", value: "admin" },
            { label: "Realm", value: "aspireforge" },
        ],
        note: "If 'admin/admin' fails, check the environment variables of the 'keycloak' resource in the Aspire Dashboard.",
    },
    {
        id: "azurite",
        icon: "bi-cloud-fill",
        name: "Azure Blob Storage (Azurite)",
        description: "Local Azure Blob Storage emulator. Use Azure Storage Explorer to browse the 'test' container.",
        url: "https://azure.microsoft.com/en-us/products/storage/storage-explorer",
        badgeText: "Emulator",
        badgeClass: "badge-info",
        credentials: [
            { label: "Blob Port", value: "10000" },
            { label: "Queue Port", value: "10001" },
            { label: "Table Port", value: "10002" },
        ],
        note: "The Account Name is 'devstoreaccount1'. Check the Aspire Dashboard for the full connection string.",
    },
    {
        id: "aspire",
        icon: "bi-speedometer",
        name: "Aspire Dashboard",
        description: "The source of truth for all dynamic connection strings, logs, and container credentials.",
        url: "http://localhost:15288",
        badgeText: "Host UI",
        badgeClass: "badge-success",
        note: "This dashboard displays the REAL-TIME passwords for Postgres and Keycloak.",
    },
];

function CopyButton({ value }: { value: string }) {
    const handleCopy = () => {
        void navigator.clipboard.writeText(value);
    };
    return (
        <button
            className="btn btn-sm btn-outline-secondary ml-1 py-0 px-1"
            title="Copy to clipboard"
            onClick={handleCopy}
            style={{ fontSize: "0.75rem" }}
        >
            <i className="bi bi-clipboard" />
        </button>
    );
}

function ToolCard({ tool }: { tool: ToolEntry }) {
    return (
        <div className="card shadow-sm h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <i className={`bi ${tool.icon} mr-2 text-primary`} style={{ fontSize: "1.2rem" }} />
                    <strong>{tool.name}</strong>
                </div>
                <span className={`badge ${tool.badgeClass}`}>{tool.badgeText}</span>
            </div>

            <div className="card-body d-flex flex-column">
                <p className="text-muted small mb-3">{tool.description}</p>

                {tool.credentials && tool.credentials.length > 0 && (
                    <div className="mb-3">
                        <div className="small font-weight-bold text-uppercase text-muted mb-1">
                            Connection Details
                        </div>
                        <table className="table table-sm table-borderless mb-0">
                            <tbody>
                                {tool.credentials.map((c) => (
                                    <tr key={c.label}>
                                        <td
                                            className="text-muted small pl-0"
                                            style={{ width: "36%", whiteSpace: "nowrap" }}
                                        >
                                            {c.label}
                                        </td>
                                        <td className="pl-0">
                                            <code
                                                className="small"
                                                style={{
                                                    wordBreak: "break-all",
                                                    fontSize: "0.78rem",
                                                }}
                                            >
                                                {c.value}
                                            </code>
                                            <CopyButton value={c.value} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tool.note && (
                    <div className="alert alert-info small py-2 mb-3">
                        <i className="bi bi-info-circle mr-1" />
                        {tool.note}
                    </div>
                )}

                <div className="mt-auto">
                    <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                    >
                        <i className="bi bi-box-arrow-up-right mr-1" />
                        Open {tool.name}
                    </a>
                </div>
            </div>
        </div>
    );
}

export function ToolboxView() {
    return (
        <>
            <div className="mb-4">
                <h5 className="font-weight-bold mb-1">
                    <i className="bi bi-tools mr-2 text-primary" />
                    Admin Toolbox
                </h5>
                <p className="text-muted mb-0">
                    Direct access to every infrastructure service in the dev stack. Where noted, no
                    additional login is required — click <strong>Open</strong> and you're in.
                </p>
            </div>

            <div className="row">
                {TOOLS.map((tool) => (
                    <div key={tool.id} className="col-md-6 col-xl-4 mb-4">
                        <ToolCard tool={tool} />
                    </div>
                ))}
            </div>
        </>
    );
}
