import { useState } from "react";
import type { SubscriptionPlan } from "../../../types/admin";

type Props = {
    plans: SubscriptionPlan[];
    loadingPlans: boolean;
    busy: boolean;
    onCreatePlan: (name: string, description: string, monthlyPrice: number, maxSeats: number, features: string, isActive: boolean) => void;
    onUpdatePlan: (planId: string, name: string, description: string, monthlyPrice: number, maxSeats: number, features: string, isActive: boolean) => void;
    onDeletePlan: (planId: string) => void;
};

const EMPTY_FORM = { name: "", description: "", monthlyPrice: "", maxSeats: "0", features: "", isActive: true };

export function PlansView({ plans, loadingPlans, busy, onCreatePlan, onUpdatePlan, onDeletePlan }: Props) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const startCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
    const startEdit = (plan: SubscriptionPlan) => {
        setForm({
            name: plan.name,
            description: plan.description ?? "",
            monthlyPrice: String(plan.monthlyPrice),
            maxSeats: String(plan.maxSeats),
            features: plan.features ?? "",
            isActive: plan.isActive,
        });
        setEditingId(plan.id);
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        const price = Number(form.monthlyPrice);
        const seats = Number(form.maxSeats);
        if (!Number.isFinite(price) || price < 0) return;

        if (editingId) {
            onUpdatePlan(editingId, form.name, form.description, price, seats, form.features, form.isActive);
        } else {
            onCreatePlan(form.name, form.description, price, seats, form.features, form.isActive);
        }
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const fmtPrice = (price: number, currency: string) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0">
                        <i className="bi bi-box-seam-fill mr-2" style={{ color: "#2F4F4F" }} />
                        Subscription Plans
                    </h4>
                    <small className="text-muted">Manage the available plans you offer to clients</small>
                </div>
                <button className="btn btn-primary btn-sm" onClick={startCreate} disabled={busy}>
                    <i className="bi bi-plus-circle mr-1" />
                    New Plan
                </button>
            </div>

            {/* Plan form */}
            {showForm && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ background: "#2F4F4F", color: "#fff" }}>
                        <strong>{editingId ? "Edit Plan" : "Create New Plan"}</strong>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Plan Name *</label>
                                    <input className="form-control form-control-sm" placeholder="e.g. Professional"
                                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Description</label>
                                    <input className="form-control form-control-sm" placeholder="Brief description"
                                        value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Monthly Price ($) *</label>
                                            <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                                                value={form.monthlyPrice} onChange={e => setForm(f => ({ ...f, monthlyPrice: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group mb-2">
                                            <label className="small font-weight-bold">Max Seats (0=unlimited)</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={form.maxSeats} onChange={e => setForm(f => ({ ...f, maxSeats: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-check mb-2">
                                    <input type="checkbox" className="form-check-input" id="plan-active"
                                        checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                                    <label className="form-check-label small" htmlFor="plan-active">Active (visible to admins)</label>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-2">
                                    <label className="small font-weight-bold">Features (one per line)</label>
                                    <textarea className="form-control form-control-sm" rows={6}
                                        placeholder={"24/7 Support\nUp to 10 users\nMonthly reporting"}
                                        value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm" disabled={busy || !form.name.trim()} onClick={handleSubmit}>
                                {busy ? <span className="spinner-border spinner-border-sm mr-1" role="status" /> : null}
                                {editingId ? "Save Changes" : "Create Plan"}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans grid */}
            {loadingPlans ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"><span className="sr-only">Loading…</span></div>
                </div>
            ) : plans.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        <i className="bi bi-box-seam" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                        <p className="mt-3 mb-0">No plans yet. Create your first plan to get started.</p>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {plans.map(plan => (
                        <div key={plan.id} className="col-md-4 mb-4">
                            <div className={`card shadow-sm h-100 ${!plan.isActive ? "border-secondary" : "border-0"}`}
                                style={{ borderTop: plan.isActive ? "3px solid #2F4F4F" : undefined }}>
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 className="mb-0 font-weight-bold">{plan.name}</h6>
                                            <code className="small text-muted">{plan.slug}</code>
                                        </div>
                                        <span className={`badge badge-${plan.isActive ? "success" : "secondary"}`}>
                                            {plan.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    {plan.description && (
                                        <p className="small text-muted mb-2">{plan.description}</p>
                                    )}

                                    <div className="mb-3">
                                        <span className="h4 font-weight-bold" style={{ color: "#2F4F4F" }}>
                                            {fmtPrice(plan.monthlyPrice, plan.currency)}
                                        </span>
                                        <span className="text-muted small">/mo</span>
                                    </div>

                                    {plan.maxSeats > 0 && (
                                        <p className="small mb-2">
                                            <i className="bi bi-people-fill mr-1 text-muted" />
                                            Up to {plan.maxSeats} seats
                                        </p>
                                    )}

                                    {plan.features && (
                                        <ul className="small text-muted pl-3 mb-3 flex-grow-1">
                                            {plan.features.split("\n").filter(Boolean).map((f, i) => (
                                                <li key={i}>{f}</li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="d-flex gap-2 mt-auto">
                                        <button className="btn btn-outline-secondary btn-sm flex-grow-1"
                                            onClick={() => startEdit(plan)} disabled={busy}>
                                            <i className="bi bi-pencil mr-1" />Edit
                                        </button>
                                        <button className="btn btn-outline-danger btn-sm"
                                            onClick={() => onDeletePlan(plan.id)} disabled={busy}>
                                            <i className="bi bi-trash" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
