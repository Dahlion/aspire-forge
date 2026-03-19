export type AdminRoute =
    | { kind: "dashboard" }
    | { kind: "tenant"; tenantId: string }
    | { kind: "toolbox" };

export function parseAdminHashRoute(): AdminRoute {
    const raw = window.location.hash.replace(/^#/, "") || "/admin/dashboard";
    const parts = raw.split("/").filter(Boolean);

    if (parts.length === 3 && parts[0] === "admin" && parts[1] === "tenants") {
        return { kind: "tenant", tenantId: parts[2] };
    }

    if (parts[0] === "admin" && parts[1] === "toolbox") {
        return { kind: "toolbox" };
    }

    return { kind: "dashboard" };
}

export function navigateToAdminRoute(route: AdminRoute) {
    if (route.kind === "dashboard") {
        window.location.hash = "/admin/dashboard";
        return;
    }

    if (route.kind === "toolbox") {
        window.location.hash = "/admin/toolbox";
        return;
    }

    window.location.hash = `/admin/tenants/${route.tenantId}`;
}
