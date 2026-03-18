import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { keycloak } from "./auth/keycloak";
import { HeroUIProvider } from "@heroui/react";
import "./index.css";

async function bootstrap() {
    await keycloak.init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
    });

    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <HeroUIProvider>
                <App />
            </HeroUIProvider>
        </React.StrictMode>
    );
}

bootstrap();
