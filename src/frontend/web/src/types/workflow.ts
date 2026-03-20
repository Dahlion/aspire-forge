export type WorkflowStep = {
    id: string;
    workflowProcessId: string;
    name: string;
    order: number;
    allowBacktracking: boolean;
    canSkip: boolean;
    defaultAssigneeRole?: string;
};

export type FormFieldType = "text" | "number" | "textarea" | "select" | "date" | "email";

export type FormField = {
    key: string;
    label: string;
    type: FormFieldType;
    required?: boolean;
    options?: string[];   // for select type
    placeholder?: string;
};

export type WorkflowProcess = {
    id: string;
    name: string;
    description?: string;
    tenantId?: string | null;
    steps: WorkflowStep[];
    createdAt: string;
    primaryColor: string;
    accentColor: string;
    iconClass: string;
    appSlug?: string | null;
    formSchema?: string | null; // JSON-encoded FormField[]
};

export type WorkflowInstance = {
    id: string;
    tenantId: string;
    workflowProcessId: string;
    currentStepId: string;
    title: string;
    dataJson?: string;
    currentAssigneeId?: string;
    status: "Active" | "Completed" | "Cancelled";
    createdAt: string;
    updatedAt: string;
    process?: WorkflowProcess;
    currentStep?: WorkflowStep;
};

export type WorkflowDeployment = {
    id: string;
    workflowProcessId: string;
    tenantId: string;
    deployedAt: string;
    process?: WorkflowProcess;
    tenant?: { id: string; name: string; slug: string };
};

export type MoveRequest = {
    targetStepId: string;
    newAssigneeId?: string;
    comments?: string;
};

export function parseFormSchema(process: WorkflowProcess): FormField[] {
    if (!process.formSchema) return [];
    try { return JSON.parse(process.formSchema) as FormField[]; }
    catch { return []; }
}
