export type AdminRoute =
    | { kind: "dashboard" }
    | { kind: "tenant"; tenantId: string }
    | { kind: "subscription-manager" }
    | { kind: "business-manager" }
    | { kind: "marketing-manager" }
    | { kind: "client-manager" }
    | { kind: "form-designer" }
    | { kind: "app-designer" }
    | { kind: "zip-deploy" }
    | { kind: "toolbox" };

export function parseAdminHashRoute(): AdminRoute {
    const raw = window.location.hash.replace(/^#/, "") || "/admin/dashboard";
    const parts = raw.split("/").filter(Boolean);

    if (parts[0] !== "admin") return { kind: "dashboard" };

    if (parts.length === 3 && parts[1] === "clients") {
        return { kind: "tenant", tenantId: parts[2] };
    }

    switch (parts[1]) {
        case "subscription-manager": return { kind: "subscription-manager" };
        case "business-manager":     return { kind: "business-manager" };
        case "marketing-manager":    return { kind: "marketing-manager" };
        case "clients":              return { kind: "client-manager" };
        case "form-designer":        return { kind: "form-designer" };
        case "app-designer":         return { kind: "app-designer" };
        case "zip-deploy":           return { kind: "zip-deploy" };
        case "toolbox":              return { kind: "toolbox" };
        default:                     return { kind: "dashboard" };
    }
}

export function navigateToAdminRoute(route: AdminRoute) {
    switch (route.kind) {
        case "dashboard":            window.location.hash = "/admin/dashboard";            break;
        case "subscription-manager": window.location.hash = "/admin/subscription-manager"; break;
        case "business-manager":     window.location.hash = "/admin/business-manager";     break;
        case "marketing-manager":    window.location.hash = "/admin/marketing-manager";    break;
        case "client-manager":       window.location.hash = "/admin/clients";              break;
        case "form-designer":        window.location.hash = "/admin/form-designer";        break;
        case "app-designer":         window.location.hash = "/admin/app-designer";         break;
        case "zip-deploy":           window.location.hash = "/admin/zip-deploy";           break;
        case "toolbox":              window.location.hash = "/admin/toolbox";              break;
        case "tenant":               window.location.hash = `/admin/clients/${route.tenantId}`; break;
    }
}
