interface Props {
    login: () => void;
    busy: boolean;
}

export function AdminLoginPage({ login, busy }: Props) {
    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{
                minHeight: "100vh",
                background: "linear-gradient(150deg, #2F4F4F 0%, #1a2e2e 100%)",
                padding: "2rem 1rem",
            }}
        >
            <div style={{ width: "100%", maxWidth: 440 }}>
                {/* Brand */}
                <div className="text-center mb-4">
                    <img src="/seacoastlogo.png" alt="Seacoast DevOps" style={{ maxHeight: 70, objectFit: "contain" }} />
                    <p className="mt-2 mb-0" style={{ color: "#71B5A1", fontSize: "0.9rem" }}>Admin Portal</p>
                </div>

                {/* Card */}
                <div className="card shadow-lg border-0" style={{ borderRadius: 12 }}>
                    <div
                        className="card-header text-white text-center py-3"
                        style={{ background: "#2F4F4F", borderRadius: "12px 12px 0 0" }}
                    >
                        <i className="bi bi-shield-lock-fill mr-2" />
                        <strong>Administrator Sign In</strong>
                    </div>
                    <div className="card-body p-4">
                        <p className="text-muted text-center mb-4" style={{ fontSize: "0.93rem" }}>
                            This portal is restricted to Seacoast DevOps staff. Sign in with your
                            organisation credentials to access the admin control plane.
                        </p>

                        <div
                            className="d-flex align-items-center p-3 mb-4 rounded"
                            style={{ background: "#e6f2ef", borderLeft: "4px solid #71B5A1" }}
                        >
                            <i className="bi bi-info-circle-fill mr-3" style={{ color: "#2F4F4F", fontSize: "1.1rem" }} />
                            <span style={{ fontSize: "0.88rem", color: "#343a40" }}>
                                Authentication is handled securely via Keycloak. You will be
                                redirected to the sign-in page.
                            </span>
                        </div>

                        <button
                            className="btn btn-block btn-lg font-weight-bold text-white"
                            style={{ background: "#2F4F4F", border: "none", borderRadius: 8 }}
                            onClick={login}
                            disabled={busy}
                        >
                            {busy ? (
                                <>
                                    <span className="spinner-border spinner-border-sm mr-2" role="status" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right mr-2" />
                                    Sign In to Admin Portal
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

                <p className="text-center mt-3" style={{ color: "#8ab5df", fontSize: "0.8rem" }}>
                    Need access? Contact your system administrator.
                </p>
            </div>
        </div>
    );
}
