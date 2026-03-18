import { keycloak } from "../auth/keycloak";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
    await keycloak.updateToken(30);

    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");

    if (keycloak.token) {
        headers.set("Authorization", `Bearer ${keycloak.token}`);
    }

    if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
    });

    if (!response.ok) {
        const body = await response.text();
        throw new ApiError(response.status, body || `${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}
