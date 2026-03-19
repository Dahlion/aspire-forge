import { useMemo } from "react";
import { useAuthSession } from "./auth/useAuthSession";
import { AdminConsole } from "./features/admin/AdminConsole";

export default function App() {
    const { ready, authenticated, busy, canManageTenants, login, logout } = useAuthSession();

    const statusBadge = useMemo(
        () =>
            authenticated ? (
                <span className="badge badge-success">Authenticated</span>
            ) : (
                <span className="badge badge-warning">Logged out</span>
            ),
        [authenticated]
    );

    if (!ready) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "100vh" }}
            >
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading…</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <nav className="navbar navbar-dark bg-primary px-3 mb-4 shadow-sm">
                <span className="navbar-brand mb-0 h5 font-weight-bold">
                    <i className="bi bi-layers-fill mr-2" />
                    AspireForge
                </span>
                <div className="d-flex align-items-center gap-2">
                    {statusBadge}
                    {!authenticated ? (
                        <button
                            className="btn btn-light btn-sm ml-2"
                            onClick={login}
                            disabled={busy}
                        >
                            {busy ? "…" : "Log in"}
                        </button>
                    ) : (
                        <button
                            className="btn btn-outline-light btn-sm ml-2"
                            onClick={logout}
                            disabled={busy}
                        >
                            {busy ? "…" : "Log out"}
                        </button>
                    )}
                </div>
            </nav>

            <div className="container-xl px-4 pb-4">
                {!authenticated ? (
                    <div className="card shadow-sm">
                        <div className="card-body text-center text-muted py-5">
                            <i className="bi bi-shield-lock display-4 d-block mb-3" />
                            Sign in to access the admin control plane.
                        </div>
                    </div>
                ) : !canManageTenants ? (
                    <div className="card shadow-sm border-warning">
                        <div className="card-header bg-warning text-dark">
                            <strong>
                                <i className="bi bi-exclamation-triangle-fill mr-2" />
                                Platform Admin Access Required
                            </strong>
                        </div>
                        <div className="card-body">
                            <p>
                                Your account is authenticated, but it does not include the{" "}
                                <code>platform_admin</code> role.
                            </p>
                            <p className="text-muted mb-0">
                                Ask a platform administrator to assign the role in Keycloak.
                            </p>
                        </div>
                    </div>
                ) : (
                    <AdminConsole enabled={canManageTenants} />
                )}
            </div>
        </>
    );
}
