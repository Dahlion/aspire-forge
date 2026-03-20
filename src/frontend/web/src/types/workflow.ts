export type WorkflowStep = {
    id: string;
    workflowProcessId: string;
    name: string;
    order: number;
    allowBacktracking: boolean;
    canSkip: boolean;
    defaultAssigneeRole?: string;
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

export type MoveRequest = {
    targetStepId: string;
    newAssigneeId?: string;
    comments?: string;
};