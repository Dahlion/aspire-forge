import { useState } from "react";

interface Props {
    login: () => void;
    busy: boolean;
}

const CLIENT_APPS = [
    "Project Tracker",
    "Infrastructure Dashboard",
    "Cost & Billing Portal",
    "Deployment Console",
    "Support Hub",
];

export function ClientLoginPage({ login, busy }: Props) {
    const [selectedApp, setSelectedApp] = useState("");

    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #2E8B57 0%, #1d6b40 60%, #0d3d25 100%)",
                padding: "2rem 1rem",
            }}
        >
            <div style={{ width: "100%", maxWidth: 440 }}>
                {/* Brand */}
                <div className="text-center mb-4">
                    <img src="/seacoastlogo.png" alt="Seacoast DevOps" style={{ maxHeight: 70, objectFit: "contain" }} />
                    <p className="mt-2 mb-0" style={{ color: "#A8D5C8", fontSize: "0.9rem" }}>Client Portal</p>
                </div>

                {/* Card */}
                <div className="card shadow-lg border-0" style={{ borderRadius: 12 }}>
                    <div
                        className="card-header text-white text-center py-3"
                        style={{ background: "#2E8B57", borderRadius: "12px 12px 0 0" }}
                    >
                        <i className="bi bi-person-badge-fill mr-2" />
                        <strong>Client Sign In</strong>
                    </div>
                    <div className="card-body p-4">
                        <p className="text-muted text-center mb-4" style={{ fontSize: "0.93rem" }}>
                            Welcome back. Select the application you'd like to access, then sign
                            in with your client credentials.
                        </p>

                        {/* App selector */}
                        <div className="form-group">
                            <label className="font-weight-bold small text-uppercase" style={{ letterSpacing: "0.05em", color: "#343a40" }}>
                                <i className="bi bi-grid-1x2-fill mr-1" style={{ color: "#2E8B57" }} />
                                Select Application
                            </label>
                            <select
                                className="form-control"
                                value={selectedApp}
                                onChange={(e) => setSelectedApp(e.target.value)}
                                style={{ borderColor: selectedApp ? "#2E8B57" : undefined, borderRadius: 8 }}
                            >
                                <option value="">Choose an application…</option>
                                {CLIENT_APPS.map((app) => (
                                    <option key={app} value={app}>{app}</option>
                                ))}
                            </select>
                            {!selectedApp && (
                                <small className="form-text text-muted">
                                    Please select the application you need to access.
                                </small>
                            )}
                        </div>

                        <div
                            className="d-flex align-items-center p-3 mb-4 rounded"
                            style={{ background: "#e8f5ee", borderLeft: "4px solid #2E8B57" }}
                        >
                            <i className="bi bi-info-circle-fill mr-3" style={{ color: "#2E8B57", fontSize: "1.1rem" }} />
                            <span style={{ fontSize: "0.88rem", color: "#343a40" }}>
                                You will be redirected to a secure sign-in page after selecting
                                your application.
                            </span>
                        </div>

                        <button
                            className="btn btn-block btn-lg font-weight-bold text-white"
                            onClick={login}
                            disabled={busy || !selectedApp}
                            style={{ background: "#2E8B57", borderRadius: 8, border: "none" }}
                        >
                            {busy ? (
                                <>
                                    <span className="spinner-border spinner-border-sm mr-2" role="status" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right mr-2" />
                                    Sign In{selectedApp ? ` to ${selectedApp}` : ""}
                                </>
                            )}
                        </button>

                        <div className="text-center mt-3">
                            <a
                                href="#"
                                style={{ color: "#6c757d", fontSize: "0.85rem" }}
                                onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
                            >
                                <i className="bi bi-arrow-left mr-1" />
                                Back to home
                            </a>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-3" style={{ color: "#a8d5bc", fontSize: "0.8rem" }}>
                    Don't have an account?{" "}
                    <a
                        href="#"
                        style={{ color: "#31cf9f" }}
                        onClick={(e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); window.location.hash = ""; }}
                    >
                        Contact us
                    </a>
                </p>
            </div>
        </div>
    );
}
