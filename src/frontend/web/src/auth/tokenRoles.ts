import { keycloak } from "./keycloak";

type ParsedToken = {
    realm_access?: { roles?: string[] };
    resource_access?: Record<string, { roles?: string[] }>;
};

export function getRoleSetFromToken(): Set<string> {
    const parsed = keycloak.tokenParsed as ParsedToken | undefined;
    const roles = new Set<string>();

    (parsed?.realm_access?.roles ?? []).forEach((role) => roles.add(role.toLowerCase()));

    if (parsed?.resource_access) {
        Object.values(parsed.resource_access).forEach((resource) => {
            (resource.roles ?? []).forEach((role) => roles.add(role.toLowerCase()));
        });
    }

    return roles;
}
