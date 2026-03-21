import { useState } from "react";
import { PlansView } from "./PlansView";
import type { SubscriptionPlan } from "../../../types/admin";

type Tab = "plans" | "public-feed";

type SubscriptionManagerViewProps = {
    plans: SubscriptionPlan[];
    loadingPlans: boolean;
    busy: boolean;
    onCreatePlan: Parameters<typeof PlansView>[0]["onCreatePlan"];
    onUpdatePlan: Parameters<typeof PlansView>[0]["onUpdatePlan"];
    onDeletePlan: Parameters<typeof PlansView>[0]["onDeletePlan"];
};

export function SubscriptionManagerView({
    plans,
    loadingPlans,
    busy,
    onCreatePlan,
    onUpdatePlan,
    onDeletePlan,
}: SubscriptionManagerViewProps) {
    const [tab, setTab] = useState<Tab>("plans");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-box-seam-fill mr-2 text-primary" />
                        Subscription Manager
                    </h4>
                    <small className="text-muted">
                        Manage subscription plans, pricing tiers, and public-facing plan availability.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "plans" ? "active" : ""}`}
                        onClick={() => setTab("plans")}
                    >
                        <i className="bi bi-box-seam mr-1" />
                        Subscription Plans
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "public-feed" ? "active" : ""}`}
                        onClick={() => setTab("public-feed")}
                    >
                        <i className="bi bi-broadcast mr-1" />
                        Public Dashboard Feed
                        <span className="badge badge-warning ml-2">Soon</span>
                    </button>
                </li>
            </ul>

            {tab === "plans" && (
                <PlansView
                    plans={plans}
                    loadingPlans={loadingPlans}
                    busy={busy}
                    onCreatePlan={onCreatePlan}
                    onUpdatePlan={onUpdatePlan}
                    onDeletePlan={onDeletePlan}
                />
            )}

            {tab === "public-feed" && (
                <div className="card shadow-sm">
                    <div className="card-header font-weight-bold">
                        <i className="bi bi-broadcast mr-2" />
                        Public Dashboard Feed
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info mb-4">
                            <i className="bi bi-info-circle-fill mr-2" />
                            Configure which subscription plans are visible on the public-facing pricing page,
                            along with date-range applicability and versioning.
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <div className="card border-secondary h-100">
                                    <div className="card-body text-center py-5 text-muted">
                                        <i className="bi bi-calendar-range display-4 d-block mb-3" />
                                        <h6 className="font-weight-bold">Date-Range Applicability</h6>
                                        <p className="small mb-0">
                                            Schedule which plans are shown on the public site during specific date windows
                                            (e.g., promotional pricing, seasonal offers).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <div className="card border-secondary h-100">
                                    <div className="card-body text-center py-5 text-muted">
                                        <i className="bi bi-clock-history display-4 d-block mb-3" />
                                        <h6 className="font-weight-bold">Version Control</h6>
                                        <p className="small mb-0">
                                            Track historical plan versions and publish specific versions to the public
                                            dashboard with full rollback capability.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-3">
                            <span className="badge badge-warning px-3 py-2" style={{ fontSize: "0.85rem" }}>
                                <i className="bi bi-hammer mr-1" /> Coming Soon
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
