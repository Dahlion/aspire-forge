// ── Micro App Platform Types ───────────────────────────────────────────────────

export interface AppSuite {
    id: string;
    tenantId: string;
    name: string;
    slug: string;
    description?: string;
    iconClass: string;
    color: string;
    sortOrder: number;
    microApps?: MicroApp[];
    createdAt: string;
    updatedAt: string;
}

export interface MicroApp {
    id: string;
    tenantId: string;
    workflowProcessId: string;
    appSuiteId?: string;
    displayName: string;
    slug: string;
    description?: string;
    primaryColor: string;
    accentColor: string;
    iconClass: string;
    status: "active" | "archived" | "suspended";
    isPublic: boolean;
    deployedAt: string;
    updatedAt: string;

    // Populated when included
    process?: {
        id: string;
        name: string;
        description?: string;
        appSlug?: string;
        formSchema?: string;
        steps: { id: string; name: string; order: number }[];
    };
    suite?: AppSuite;
    domains?: AppDomain[];
    outboundLinks?: AppLink[];
}

export interface AppDomain {
    id: string;
    microAppId: string;
    hostname: string;
    isPrimary: boolean;
    sslStatus: "pending" | "provisioned" | "failed";
    verifiedAt?: string;
    createdAt: string;
}

export interface AppLink {
    id: string;
    sourceMicroAppId: string;
    targetMicroAppId: string;
    linkType: "related" | "child" | "data-feed" | "workflow-handoff";
    label?: string;
    createdAt: string;
    target?: Pick<MicroApp, "id" | "displayName" | "slug" | "iconClass" | "primaryColor">;
}

// ── Request types ──────────────────────────────────────────────────────────────

export interface CreateMicroAppInput {
    tenantId: string;
    workflowProcessId: string;
    displayName: string;
    slug?: string;
    description?: string;
    appSuiteId?: string;
    primaryColor?: string;
    accentColor?: string;
    iconClass?: string;
    isPublic?: boolean;
}

export interface UpdateMicroAppInput {
    displayName?: string;
    description?: string;
    appSuiteId?: string;
    primaryColor?: string;
    accentColor?: string;
    iconClass?: string;
    status?: "active" | "archived" | "suspended";
    isPublic?: boolean;
}

export interface CreateSuiteInput {
    tenantId: string;
    name: string;
    slug?: string;
    description?: string;
    iconClass?: string;
    color?: string;
    sortOrder?: number;
}

export interface UpdateSuiteInput {
    tenantId: string;
    name: string;
    description?: string;
    iconClass?: string;
    color?: string;
    sortOrder?: number;
}
