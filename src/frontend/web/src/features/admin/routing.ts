export type AdminRoute =
    | { kind: "dashboard" }
    | { kind: "tenants" }
    | { kind: "tenant"; tenantId: string }
    | { kind: "plans" }
    | { kind: "billing" }
    | { kind: "leads" }
    | { kind: "toolbox" };

export function parseAdminHashRoute(): AdminRoute {
    const raw = window.location.hash.replace(/^#/, "") || "/admin/dashboard";
    const parts = raw.split("/").filter(Boolean);

    if (parts[0] !== "admin") return { kind: "dashboard" };

    if (parts.length === 3 && parts[1] === "tenants") {
        return { kind: "tenant", tenantId: parts[2] };
    }

    switch (parts[1]) {
        case "tenants":  return { kind: "tenants" };
        case "plans":    return { kind: "plans" };
        case "billing":  return { kind: "billing" };
        case "leads":    return { kind: "leads" };
        case "toolbox":  return { kind: "toolbox" };
        default:         return { kind: "dashboard" };
    }
}

export function navigateToAdminRoute(route: AdminRoute) {
    switch (route.kind) {
        case "dashboard": window.location.hash = "/admin/dashboard"; break;
        case "tenants":   window.location.hash = "/admin/tenants";   break;
        case "plans":     window.location.hash = "/admin/plans";     break;
        case "billing":   window.location.hash = "/admin/billing";   break;
        case "leads":     window.location.hash = "/admin/leads";     break;
        case "toolbox":   window.location.hash = "/admin/toolbox";   break;
        case "tenant":    window.location.hash = `/admin/tenants/${route.tenantId}`; break;
    }
}
