import { useMemo } from "react";
import type { WorkflowProcess, WorkflowInstance, WorkflowStep } from "../../../types/workflow";

type Props = {
    process: WorkflowProcess;
    instances: WorkflowInstance[];
    onMove: (instanceId: string, targetStepId: string) => void;
    busy?: boolean;
};

export function WorkflowKanban({ process, instances, onMove, busy }: Props) {
    const sortedSteps = useMemo(() =>
        [...process.steps].sort((a, b) => a.order - b.order),
    [process.steps]);

    const columns = useMemo(() => {
        const map: Record<string, WorkflowInstance[]> = {};
        sortedSteps.forEach(s => map[s.id] = []);
        instances.forEach(i => {
            if (map[i.currentStepId]) map[i.currentStepId].push(i);
        });
        return map;
    }, [sortedSteps, instances]);

    const totalActive = instances.filter(i => i.status === "Active").length;
    const totalDone   = instances.filter(i => i.status === "Completed").length;

    return (
        <div>
            {/* Stats bar */}
            <div className="d-flex mb-3" style={{ gap: "0.75rem" }}>
                <span className="badge badge-pill px-3 py-2" style={{ background: process.primaryColor, color: "#fff", fontSize: "0.78rem" }}>
                    <i className="bi bi-activity mr-1" />{totalActive} active
                </span>
                <span className="badge badge-pill badge-success px-3 py-2" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-check2-circle mr-1" />{totalDone} completed
                </span>
                <span className="badge badge-pill badge-light px-3 py-2" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-layers mr-1" />{sortedSteps.length} stages
                </span>
            </div>

            {/* Kanban board */}
            <div className="d-flex overflow-auto pb-3" style={{ gap: "1.25rem", minHeight: "65vh" }}>
                {sortedSteps.map((step, idx) => {
                    const isLast = idx === sortedSteps.length - 1;
                    const colColor = isLast ? "#28a745" : process.primaryColor;

                    return (
                        <div
                            key={step.id}
                            className="bg-light rounded shadow-sm d-flex flex-column"
                            style={{ minWidth: "300px", maxWidth: "300px", borderTop: `4px solid ${colColor}` }}
                        >
                            {/* Column Header */}
                            <div className="p-3 d-flex justify-content-between align-items-center bg-white border-bottom">
                                <div className="d-flex align-items-center" style={{ gap: "0.4rem" }}>
                                    <span
                                        className="d-inline-block rounded-circle"
                                        style={{ width: 8, height: 8, background: colColor, flexShrink: 0 }}
                                    />
                                    <h6 className="mb-0 font-weight-bold text-uppercase small" style={{ letterSpacing: "0.5px" }}>
                                        {step.name}
                                    </h6>
                                </div>
                                <span className="badge badge-pill badge-secondary">
                                    {columns[step.id]?.length || 0}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div className="p-2 flex-grow-1 overflow-auto" style={{ backgroundColor: "#f4f7f6" }}>
                                {columns[step.id].map(inst => (
                                    <WorkflowCard
                                        key={inst.id}
                                        instance={inst}
                                        steps={sortedSteps}
                                        currentStep={step}
                                        accentColor={process.accentColor}
                                        onMove={onMove}
                                        busy={busy}
                                    />
                                ))}
                                {columns[step.id].length === 0 && (
                                    <div className="text-center text-muted py-4" style={{ fontSize: "0.78rem", opacity: 0.5 }}>
                                        Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function WorkflowCard({ instance, steps, currentStep, accentColor, onMove, busy }: {
    instance: WorkflowInstance;
    steps: WorkflowStep[];
    currentStep: WorkflowStep;
    accentColor: string;
    onMove: (id: string, stepId: string) => void;
    busy?: boolean;
}) {
    const nextStep = steps.find(s => s.order === currentStep.order + 1);
    const prevStep = steps.find(s => s.order === currentStep.order - 1);
    const isComplete = instance.status === "Completed";

    return (
        <div
            className="card border-0 mb-2"
            style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                opacity: isComplete ? 0.7 : 1
            }}
        >
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <code className="text-muted" style={{ fontSize: "0.7rem" }}>
                        {instance.id.split("-")[0]}
                    </code>
                    {instance.currentAssigneeId && (
                        <i className="bi bi-person-circle" style={{ color: accentColor }} title={instance.currentAssigneeId} />
                    )}
                </div>

                <h6 className="card-title font-weight-bold mb-2" style={{ fontSize: "0.9rem", lineHeight: 1.3 }}>
                    {instance.title}
                </h6>

                <div className="d-flex justify-content-between mt-3 pt-2 border-top align-items-center">
                    {/* Back */}
                    {prevStep && currentStep.allowBacktracking && !isComplete ? (
                        <button
                            className="btn btn-xs btn-outline-secondary"
                            onClick={() => onMove(instance.id, prevStep.id)}
                            disabled={busy}
                            title={`Move back to ${prevStep.name}`}
                        >
                            <i className="bi bi-arrow-left" />
                        </button>
                    ) : <span />}

                    <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                        {new Date(instance.updatedAt).toLocaleDateString()}
                    </small>

                    {/* Forward / Complete */}
                    {isComplete ? (
                        <span className="badge badge-success py-1 px-2">
                            <i className="bi bi-check2 mr-1" />Done
                        </span>
                    ) : nextStep ? (
                        <button
                            className="btn btn-xs btn-sm"
                            style={{ background: accentColor, color: "#fff", border: "none" }}
                            onClick={() => onMove(instance.id, nextStep.id)}
                            disabled={busy}
                            title={`Move to ${nextStep.name}`}
                        >
                            Next <i className="bi bi-arrow-right ml-1" />
                        </button>
                    ) : (
                        <button
                            className="btn btn-xs btn-success btn-sm"
                            onClick={() => onMove(instance.id, currentStep.id)}
                            disabled={busy}
                            title="Mark as complete"
                        >
                            <i className="bi bi-check2-all mr-1" />Complete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
