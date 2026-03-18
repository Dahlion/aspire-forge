export const PLATFORM_ADMIN_ROLE = "platform_admin";

export function hasRole(roles: Set<string>, role: string): boolean {
    return roles.has(role.toLowerCase());
}

export function isPlatformAdmin(roles: Set<string>): boolean {
    return hasRole(roles, PLATFORM_ADMIN_ROLE);
}
