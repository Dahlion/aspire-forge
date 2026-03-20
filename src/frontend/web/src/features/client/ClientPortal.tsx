interface Props {
    username: string;
    logout: () => void;
}

export function ClientPortal({ username, logout }: Props) {
    return (
        <div className="container-xl px-4 pb-5">
            {/* Welcome banner */}
            <div
                className="card border-0 shadow-sm mb-4"
                style={{ background: "linear-gradient(135deg, #2E8B57, #1d6b40)", borderRadius: 10 }}
            >
                <div className="card-body p-4 text-white d-flex align-items-center justify-content-between flex-wrap" style={{ gap: "1rem" }}>
                    <div>
                        <h4 className="font-weight-bold mb-1">
                            <i className="bi bi-person-circle mr-2" />
                            Welcome back{username && username !== "unknown" ? `, ${username}` : ""}!
                        </h4>
                        <p className="mb-0" style={{ color: "#c8e6d6", fontSize: "0.95rem" }}>
                            You're signed in to the Seacoast DevOps Client Portal.
                        </p>
                    </div>
                    <button className="btn btn-outline-light btn-sm" onClick={logout}>
                        <i className="bi bi-box-arrow-right mr-1" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Quick links */}
            <div className="row mb-4">
                {QUICK_LINKS.map((link) => (
                    <div key={link.title} className="col-md-4 mb-3">
                        <div
                            className="card border-0 shadow-sm h-100 text-center p-3"
                            style={{ borderRadius: 10, cursor: "default", opacity: 0.8 }}
                        >
                            <i className={`bi ${link.icon} mb-2`} style={{ fontSize: "2rem", color: "#2E8B57" }} />
                            <h6 className="font-weight-bold mb-1">{link.title}</h6>
                            <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>{link.description}</p>
                            <span className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>Coming Soon</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status placeholder */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 10 }}>
                <div
                    className="card-header font-weight-bold"
                    style={{ background: "#f8f9fa", borderRadius: "10px 10px 0 0", color: "#343a40" }}
                >
                    <i className="bi bi-activity mr-2 text-success" />
                    Service Status
                </div>
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-center py-5 text-muted flex-column">
                        <i className="bi bi-bar-chart-line display-4 mb-3" style={{ color: "#ced4da" }} />
                        <p className="mb-1 font-weight-bold">Your dashboard is being set up.</p>
                        <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                            Metrics and service data will appear here once your onboarding is complete.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const QUICK_LINKS = [
    {
        icon: "bi-graph-up",
        title: "Infrastructure Metrics",
        description: "View real-time performance and uptime for your cloud resources.",
    },
    {
        icon: "bi-arrow-repeat",
        title: "Deployment History",
        description: "Track your pipeline runs, deployments, and rollbacks.",
    },
    {
        icon: "bi-headset",
        title: "Support Tickets",
        description: "Open, track, and resolve support requests with our team.",
    },
];
