import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { keycloak } from "./auth/keycloak";
import { ToastProvider } from "./lib/ToastProvider";
import "./index.css";

async function bootstrap() {
    try {
        await keycloak.init({
            onLoad: "login-required",
            pkceMethod: "S256",
            checkLoginIframe: false,
        });
    } catch (err) {
        // keycloak.init() can reject when processing the OIDC redirect code (e.g. after
        // Keycloak redirects back to the app with ?code=…). If we let the rejection
        // propagate, ReactDOM.render() never runs and the page stays blank.
        // Falling through here renders the app in the unauthenticated state so the
        // user can click "Log in" and try again.
        console.error("[Keycloak] init failed — rendering unauthenticated:", err);
    }

    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <ToastProvider>
                <App />
            </ToastProvider>
        </React.StrictMode>
    );
}

bootstrap();
