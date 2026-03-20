import { useEffect, useMemo, useState } from "react";
import { keycloak } from "./keycloak";
import { getRoleSetFromToken } from "./tokenRoles";
import { isPlatformAdmin } from "./roles";

type KeycloakEventCallbacks = {
    onAuthSuccess?: (() => void) | undefined;
    onAuthLogout?: (() => void) | undefined;
    onAuthRefreshSuccess?: (() => void) | undefined;
    onTokenExpired?: (() => void | Promise<void>) | undefined;
};

export function useAuthSession() {
    const [authenticated, setAuthenticated] = useState<boolean>(Boolean(keycloak.authenticated));
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const update = () => setAuthenticated(Boolean(keycloak.authenticated));
        const keycloakWithEvents = keycloak as typeof keycloak & KeycloakEventCallbacks;

        keycloakWithEvents.onAuthSuccess = update;
        keycloakWithEvents.onAuthLogout = update;
        keycloakWithEvents.onAuthRefreshSuccess = update;
        keycloakWithEvents.onTokenExpired = async () => {
            try {
                await keycloak.updateToken(30);
            } finally {
                update();
            }
        };

        update();
        setReady(true);

        return () => {
            keycloakWithEvents.onAuthSuccess = undefined;
            keycloakWithEvents.onAuthLogout = undefined;
            keycloakWithEvents.onAuthRefreshSuccess = undefined;
            keycloakWithEvents.onTokenExpired = undefined;
        };
    }, []);

    const roles = useMemo(() => getRoleSetFromToken(), [authenticated]);
    const canManageTenants = isPlatformAdmin(roles);

    const login = async () => {
        setBusy(true);
        try {
            await keycloak.login();
        } finally {
            setBusy(false);
        }
    };

    const logout = async () => {
        setBusy(true);
        try {
            await keycloak.logout({ redirectUri: window.location.origin });
        } finally {
            setBusy(false);
        }
    };

    const username = keycloak.tokenParsed?.preferred_username as string | undefined ?? "";

    return {
        ready,
        authenticated,
        busy,
        roles,
        canManageTenants,
        username,
        login,
        logout,
    };
}
