import { useEffect, useState } from "react";
import { useAuthSession } from "./auth/useAuthSession";
import { AdminConsole } from "./features/admin/AdminConsole";
import { LandingPage } from "./features/landing/LandingPage";
import { AdminLoginPage } from "./features/login/AdminLoginPage";
import { ClientLoginPage } from "./features/login/ClientLoginPage";
import { ClientPortal } from "./features/client/ClientPortal";
import { ClientAppView } from "./features/client/ClientAppView";
import EmsPortal from "./features/ems/EmsPortal";

function useHash() {
    const [hash, setHash] = useState(window.location.hash);
    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);
    return hash;
}

export default function App() {
    const { ready, authenticated, busy, canManageTenants, username, tenantId, login, logout } = useAuthSession();
    const hash = useHash();

    // After login redirect to the right portal
    useEffect(() => {
        if (!ready || !authenticated) return;
        if (
            hash === "" ||
            hash === "#/login/admin" ||
            hash === "#/login/client"
        ) {
            window.location.hash = canManageTenants ? "/admin/dashboard" : "/client";
        }
    }, [ready, authenticated]);

    if (!ready) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading…</span>
                </div>
            </div>
        );
    }

    const isAdminRoute  = hash.startsWith("#/admin");
    const isClientRoute = hash.startsWith("#/client");
    const isEmsRoute    = hash.startsWith("#/ems");
    const clientAppSlug = hash.startsWith("#/client/app/") ? hash.slice("#/client/app/".length) : null;
    const isLoginAdmin = hash === "#/login/admin";
    const isLoginClient = hash === "#/login/client";
    const isLanding = !isAdminRoute && !isClientRoute && !isEmsRoute && !isLoginAdmin && !isLoginClient;

    // Login pages and portal pages handle their own full-page layout (no shared navbar)
    if (isLoginAdmin) {
        return <AdminLoginPage login={login} busy={busy} />;
    }
    if (isLoginClient) {
        return <ClientLoginPage login={login} busy={busy} />;
    }

    // EMS portal has its own nav/layout — render standalone
    if (isEmsRoute) {
        return authenticated
            ? <EmsPortal tenantId={tenantId ?? ""} username={username ?? ""} logout={logout} />
            : <ClientLoginPage login={login} busy={busy} />;
    }

    return (
        <>
            <Navbar
                authenticated={authenticated}
                busy={busy}
                logout={logout}
                isAdminRoute={isAdminRoute}
                isClientRoute={isClientRoute}
                isEmsRoute={isEmsRoute}
                isLanding={isLanding}
            />

            {isAdminRoute ? (
                authenticated && canManageTenants ? (
                    <div className="container-xl px-4 pt-4 pb-4">
                        <AdminConsole enabled={canManageTenants} />
                    </div>
                ) : authenticated ? (
                    <div className="container-xl px-4 pt-4">
                        <div className="card shadow-sm border-warning">
                            <div className="card-header bg-warning text-dark">
                                <strong>
                                    <i className="bi bi-exclamation-triangle-fill mr-2" />
                                    Platform Admin Access Required
                                </strong>
                            </div>
                            <div className="card-body">
                                <p>Your account does not include the <code>seacoast_owneradmin</code> role.</p>
                                <p className="mb-0 text-muted">Ask a platform administrator to assign the role in Keycloak.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="container-xl px-4">
                        <AdminLoginPage login={login} busy={busy} />
                    </div>
                )
            ) : isClientRoute ? (
                authenticated ? (
                    clientAppSlug
                        ? <ClientAppView slug={clientAppSlug} tenantId={tenantId} username={username} logout={logout} />
                        : <ClientPortal username={username} tenantId={tenantId} logout={logout} />
                ) : (
                    <ClientLoginPage login={login} busy={busy} />
                )
            ) : (
                <LandingPage />
            )}
        </>
    );
}

interface NavbarProps {
    authenticated: boolean;
    busy: boolean;
    logout: () => void;
    isAdminRoute: boolean;
    isClientRoute: boolean;
    isEmsRoute: boolean;
    isLanding: boolean;
}

function Navbar({ authenticated, busy, logout, isAdminRoute, isClientRoute, isEmsRoute, isLanding }: NavbarProps) {
    const scrollTo = (id: string) => {
        if (!isLanding) {
            window.location.hash = "";
            setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <nav
            className="navbar navbar-expand-lg navbar-dark px-3 shadow-sm"
            style={{ background: "#2F4F4F", zIndex: 100 }}
        >
            {/* Brand */}
            <a
                className="navbar-brand"
                href="#"
                onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
            >
                <img src="/seacoastlogo.png" alt="Seacoast DevOps" style={{ maxHeight: 36, objectFit: "contain" }} />
            </a>

            <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#mainNav"
                aria-controls="mainNav"
                aria-expanded="false"
            >
                <span className="navbar-toggler-icon" />
            </button>

            <div className="collapse navbar-collapse" id="mainNav">
                {/* Public nav links */}
                <ul className="navbar-nav mr-auto">
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); scrollTo("services"); }}>Services</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); scrollTo("who-we-serve"); }}>Who We Serve</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); scrollTo("pricing"); }}>Pricing</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); scrollTo("contact"); }}>Contact</a>
                    </li>
                    {authenticated && isAdminRoute && (
                        <li className="nav-item">
                            <span className="nav-link">
                                <i className="bi bi-shield-fill mr-1" />
                                Admin Portal
                            </span>
                        </li>
                    )}
                    {authenticated && isClientRoute && (
                        <li className="nav-item">
                            <span className="nav-link">
                                <i className="bi bi-person-badge-fill mr-1" />
                                Client Portal
                            </span>
                        </li>
                    )}
                    {authenticated && (
                        <li className="nav-item">
                            <a
                                className="nav-link"
                                href="#/ems"
                                onClick={e => { e.preventDefault(); window.location.hash = "/ems"; }}
                            >
                                <i className="bi bi-capsule-pill mr-1" />
                                MedTrack
                            </a>
                        </li>
                    )}
                </ul>

                {/* Right side */}
                <ul className="navbar-nav ml-auto align-items-center">
                    {!authenticated ? (
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle btn btn-light btn-sm text-dark px-3 font-weight-bold"
                                href="#"
                                id="loginDropdown"
                                role="button"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                                style={{ borderRadius: 6 }}
                                onClick={(e) => e.preventDefault()}
                            >
                                <i className="bi bi-person-circle mr-1" />
                                Login
                            </a>
                            <div className="dropdown-menu dropdown-menu-right shadow" aria-labelledby="loginDropdown">
                                <a
                                    className="dropdown-item"
                                    href="#/login/admin"
                                    onClick={() => { window.location.hash = "/login/admin"; }}
                                >
                                    <i className="bi bi-shield-lock-fill mr-2 text-primary" />
                                    Admin Portal
                                    <small className="d-block text-muted" style={{ fontSize: "0.78rem" }}>
                                        Seacoast DevOps staff
                                    </small>
                                </a>
                                <div className="dropdown-divider" />
                                <a
                                    className="dropdown-item"
                                    href="#/login/client"
                                    onClick={() => { window.location.hash = "/login/client"; }}
                                >
                                    <i className="bi bi-person-badge-fill mr-2 text-success" />
                                    Client Portal
                                    <small className="d-block text-muted" style={{ fontSize: "0.78rem" }}>
                                        Managed service clients
                                    </small>
                                </a>
                            </div>
                        </li>
                    ) : (
                        <li className="nav-item">
                            <button
                                className="btn btn-outline-light btn-sm ml-2"
                                onClick={logout}
                                disabled={busy}
                            >
                                <i className="bi bi-box-arrow-right mr-1" />
                                {busy ? "…" : "Sign Out"}
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
}
