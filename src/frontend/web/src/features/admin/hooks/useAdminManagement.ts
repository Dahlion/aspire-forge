import { useCallback, useEffect, useState } from "react";
import {
    createContact,
    createInvoice,
    createLead,
    createNote,
    createSubscription,
    createTenant,
    deleteContact,
    deleteInvoice,
    deleteLead,
    deleteNote,
    deleteSubscription,
    deleteTenant,
    getAllInvoices,
    getAdminDashboard,
    getLeads,
    getPlans,
    getTenantDetail,
    getTenantInvoices,
    getTenants,
    SUBSCRIPTION_STATUSES,
    updateContact,
    updateInvoice,
    updateLead,
    updatePlan,
    createPlan,
    deletePlan,
    updateSubscription,
    updateTenant,
} from "../api";
import { toDateInput, toIsoFromDateInput } from "../../../lib/date";
import { navigateToAdminRoute, parseAdminHashRoute, type AdminRoute } from "../routing";
import type {
    DashboardData,
    Invoice,
    Lead,
    Subscription,
    SubscriptionPlan,
    TenantDetail,
    TenantSummary,
} from "../../../types/admin";

function errorToMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
}

export function useAdminManagement(isEnabled: boolean) {
    const [route, setRoute] = useState<AdminRoute>(() => parseAdminHashRoute());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ── Data state ──────────────────────────────────────────────────────────
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);

    // ── Loading flags ───────────────────────────────────────────────────────
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [loadingTenantDetail, setLoadingTenantDetail] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [busy, setBusy] = useState(false);

    // ── New Tenant form ─────────────────────────────────────────────────────
    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantSlug, setNewTenantSlug] = useState("");
    const [newTenantActive, setNewTenantActive] = useState(true);

    // ── Edit Tenant form ────────────────────────────────────────────────────
    const [editTenantName, setEditTenantName] = useState("");
    const [editTenantSlug, setEditTenantSlug] = useState("");
    const [editTenantActive, setEditTenantActive] = useState(true);

    // ── Subscription form ───────────────────────────────────────────────────
    const [subPlanName, setSubPlanName] = useState("Starter");
    const [subStatus, setSubStatus] = useState<string>(SUBSCRIPTION_STATUSES[0]);
    const [subSeats, setSubSeats] = useState("5");
    const [subMonthlyPrice, setSubMonthlyPrice] = useState("49");
    const [subCurrency, setSubCurrency] = useState("USD");
    const [subAutoRenew, setSubAutoRenew] = useState(true);
    const [subStartedAt, setSubStartedAt] = useState(() => toDateInput(new Date().toISOString()));
    const [subRenewsAt, setSubRenewsAt] = useState("");
    const [subCancelledAt, setSubCancelledAt] = useState("");

    // ── Route listener ──────────────────────────────────────────────────────
    useEffect(() => {
        const onHashChange = () => setRoute(parseAdminHashRoute());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    // ── Loaders ─────────────────────────────────────────────────────────────
    const loadDashboard = useCallback(async () => {
        setLoadingDashboard(true);
        try { setDashboard(await getAdminDashboard()); }
        finally { setLoadingDashboard(false); }
    }, []);

    const loadTenants = useCallback(async () => {
        setLoadingTenants(true);
        try { setTenants(await getTenants()); }
        finally { setLoadingTenants(false); }
    }, []);

    const loadTenantDetail = useCallback(async (tenantId: string) => {
        setLoadingTenantDetail(true);
        try {
            const [detail, tenantInvoices] = await Promise.all([
                getTenantDetail(tenantId),
                getTenantInvoices(tenantId),
            ]);
            setTenantDetail(detail);
            setEditTenantName(detail.name);
            setEditTenantSlug(detail.slug);
            setEditTenantActive(detail.isActive);
            setInvoices(tenantInvoices);
        } finally { setLoadingTenantDetail(false); }
    }, []);

    const loadPlans = useCallback(async () => {
        setLoadingPlans(true);
        try { setPlans(await getPlans()); }
        finally { setLoadingPlans(false); }
    }, []);

    const loadInvoices = useCallback(async () => {
        setLoadingInvoices(true);
        try { setInvoices(await getAllInvoices()); }
        finally { setLoadingInvoices(false); }
    }, []);

    const loadLeads = useCallback(async () => {
        setLoadingLeads(true);
        try { setLeads(await getLeads()); }
        finally { setLoadingLeads(false); }
    }, []);

    // ── Bootstrap on enable ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isEnabled) return;
        setErrorMessage(null);
        loadDashboard().catch((e: unknown) => setErrorMessage(errorToMessage(e, "Failed to load dashboard.")));
        loadTenants().catch((e: unknown) => setErrorMessage(errorToMessage(e, "Failed to load tenants.")));
    }, [isEnabled, loadDashboard, loadTenants]);

    // ── Load data when route changes ────────────────────────────────────────
    useEffect(() => {
        if (!isEnabled) return;

        if (route.kind === "tenant") {
            loadTenantDetail(route.tenantId).catch((e: unknown) =>
                setErrorMessage(errorToMessage(e, "Failed to load tenant detail.")));
        } else {
            setTenantDetail(null);
        }

        if (route.kind === "plans") {
            loadPlans().catch((e: unknown) => setErrorMessage(errorToMessage(e, "Failed to load plans.")));
        }
        if (route.kind === "billing") {
            loadInvoices().catch((e: unknown) => setErrorMessage(errorToMessage(e, "Failed to load invoices.")));
        }
        if (route.kind === "leads") {
            loadLeads().catch((e: unknown) => setErrorMessage(errorToMessage(e, "Failed to load leads.")));
        }
    }, [route, isEnabled, loadTenantDetail, loadPlans, loadInvoices, loadLeads]);

    // ── Tenant actions ──────────────────────────────────────────────────────
    const createTenantAction = async () => {
        if (!newTenantName.trim()) return;
        setBusy(true); setErrorMessage(null);
        try {
            await createTenant({ name: newTenantName.trim(), slug: newTenantSlug.trim() || null, isActive: newTenantActive });
            setNewTenantName(""); setNewTenantSlug(""); setNewTenantActive(true);
            await Promise.all([loadTenants(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to create tenant.")); }
        finally { setBusy(false); }
    };

    const updateTenantAction = async () => {
        if (!tenantDetail) return;
        setBusy(true); setErrorMessage(null);
        try {
            await updateTenant(tenantDetail.id, { name: editTenantName.trim(), slug: editTenantSlug.trim(), isActive: editTenantActive });
            await Promise.all([loadTenants(), loadDashboard(), loadTenantDetail(tenantDetail.id)]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to update tenant.")); }
        finally { setBusy(false); }
    };

    const deleteTenantAction = async () => {
        if (!tenantDetail) return;
        if (!window.confirm(`Delete tenant "${tenantDetail.name}"? This removes all subscriptions and invoices.`)) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deleteTenant(tenantDetail.id);
            await Promise.all([loadTenants(), loadDashboard()]);
            navigateToAdminRoute({ kind: "tenants" });
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete tenant.")); }
        finally { setBusy(false); }
    };

    // ── Subscription actions ────────────────────────────────────────────────
    const addSubscriptionAction = async () => {
        if (!tenantDetail || !subPlanName.trim()) return;
        const seats = Number(subSeats);
        const monthlyPrice = Number(subMonthlyPrice);
        const startedAt = toIsoFromDateInput(subStartedAt);
        if (!Number.isFinite(seats) || seats <= 0 || !Number.isFinite(monthlyPrice) || monthlyPrice < 0 || !startedAt) {
            setErrorMessage("Subscription form values are invalid."); return;
        }
        setBusy(true); setErrorMessage(null);
        try {
            await createSubscription(tenantDetail.id, {
                planName: subPlanName.trim(), status: subStatus, seats, monthlyPrice,
                currency: subCurrency.trim().toUpperCase(), autoRenew: subAutoRenew,
                startedAt, renewsAt: toIsoFromDateInput(subRenewsAt), cancelledAt: toIsoFromDateInput(subCancelledAt),
            });
            setSubPlanName("Starter"); setSubStatus(SUBSCRIPTION_STATUSES[0]);
            setSubSeats("5"); setSubMonthlyPrice("49"); setSubCurrency("USD");
            setSubAutoRenew(true); setSubStartedAt(toDateInput(new Date().toISOString()));
            setSubRenewsAt(""); setSubCancelledAt("");
            await Promise.all([loadTenantDetail(tenantDetail.id), loadTenants(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to add subscription.")); }
        finally { setBusy(false); }
    };

    const updateSubscriptionStatusAction = async (subscription: Subscription, nextStatus: string) => {
        if (!tenantDetail) return;
        setBusy(true); setErrorMessage(null);
        try {
            await updateSubscription(tenantDetail.id, subscription.id, {
                status: nextStatus,
                renewsAt: subscription.renewsAt, renewsAtSet: true,
                cancelledAt: nextStatus === "canceled" ? new Date().toISOString() : null,
                cancelledAtSet: true,
            });
            await Promise.all([loadTenantDetail(tenantDetail.id), loadTenants(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to update subscription.")); }
        finally { setBusy(false); }
    };

    const deleteSubscriptionAction = async (subscriptionId: string) => {
        if (!tenantDetail || !window.confirm("Delete this subscription?")) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deleteSubscription(tenantDetail.id, subscriptionId);
            await Promise.all([loadTenantDetail(tenantDetail.id), loadTenants(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete subscription.")); }
        finally { setBusy(false); }
    };

    // ── Contact actions ─────────────────────────────────────────────────────
    const addContactAction = async (name: string, title: string, email: string, phone: string, isPrimary: boolean) => {
        if (!tenantDetail || !name.trim()) return;
        setBusy(true); setErrorMessage(null);
        try {
            await createContact(tenantDetail.id, { name, title: title || null, email: email || null, phone: phone || null, isPrimary });
            await loadTenantDetail(tenantDetail.id);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to add contact.")); }
        finally { setBusy(false); }
    };

    const updateContactAction = async (contactId: string, name: string, title: string, email: string, phone: string, isPrimary: boolean) => {
        if (!tenantDetail) return;
        setBusy(true); setErrorMessage(null);
        try {
            await updateContact(tenantDetail.id, contactId, { name, title: title || null, email: email || null, phone: phone || null, isPrimary });
            await loadTenantDetail(tenantDetail.id);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to update contact.")); }
        finally { setBusy(false); }
    };

    const deleteContactAction = async (contactId: string) => {
        if (!tenantDetail || !window.confirm("Delete this contact?")) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deleteContact(tenantDetail.id, contactId);
            await loadTenantDetail(tenantDetail.id);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete contact.")); }
        finally { setBusy(false); }
    };

    // ── Note actions ────────────────────────────────────────────────────────
    const addNoteAction = async (content: string, category: string) => {
        if (!tenantDetail || !content.trim()) return;
        setBusy(true); setErrorMessage(null);
        try {
            await createNote(tenantDetail.id, { content, category: category || null });
            await loadTenantDetail(tenantDetail.id);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to add note.")); }
        finally { setBusy(false); }
    };

    const deleteNoteAction = async (noteId: string) => {
        if (!tenantDetail || !window.confirm("Delete this note?")) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deleteNote(tenantDetail.id, noteId);
            await loadTenantDetail(tenantDetail.id);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete note.")); }
        finally { setBusy(false); }
    };

    // ── Invoice actions (tenant-level) ──────────────────────────────────────
    const addTenantInvoiceAction = async (amount: number, dueAt: string, notes: string, subscriptionId: string) => {
        if (!tenantDetail) return;
        setBusy(true); setErrorMessage(null);
        try {
            await createInvoice(tenantDetail.id, {
                amount,
                dueAt: dueAt || null,
                notes: notes || null,
                subscriptionId: subscriptionId || null,
            });
            const updated = await getTenantInvoices(tenantDetail.id);
            setInvoices(updated);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to create invoice.")); }
        finally { setBusy(false); }
    };

    // ── Plan actions ────────────────────────────────────────────────────────
    const createPlanAction = async (name: string, description: string, monthlyPrice: number, maxSeats: number, features: string, isActive: boolean) => {
        setBusy(true); setErrorMessage(null);
        try {
            await createPlan({ name, description: description || null, monthlyPrice, maxSeats, features: features || null, isActive });
            await loadPlans();
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to create plan.")); }
        finally { setBusy(false); }
    };

    const updatePlanAction = async (planId: string, name: string, description: string, monthlyPrice: number, maxSeats: number, features: string, isActive: boolean) => {
        setBusy(true); setErrorMessage(null);
        try {
            await updatePlan(planId, { name, description: description || null, monthlyPrice, maxSeats, features: features || null, isActive });
            await loadPlans();
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to update plan.")); }
        finally { setBusy(false); }
    };

    const deletePlanAction = async (planId: string) => {
        if (!window.confirm("Delete this plan?")) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deletePlan(planId);
            await loadPlans();
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete plan.")); }
        finally { setBusy(false); }
    };

    // ── Lead actions ────────────────────────────────────────────────────────
    const createLeadAction = async (input: Parameters<typeof createLead>[0]) => {
        setBusy(true); setErrorMessage(null);
        try {
            await createLead(input);
            await Promise.all([loadLeads(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to create lead.")); }
        finally { setBusy(false); }
    };

    const updateLeadAction = async (leadId: string, input: Parameters<typeof updateLead>[1]) => {
        setBusy(true); setErrorMessage(null);
        try {
            await updateLead(leadId, input);
            await Promise.all([loadLeads(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to update lead.")); }
        finally { setBusy(false); }
    };

    const deleteLeadAction = async (leadId: string) => {
        if (!window.confirm("Delete this lead?")) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deleteLead(leadId);
            await Promise.all([loadLeads(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete lead.")); }
        finally { setBusy(false); }
    };

    // ── Invoice actions (billing view) ──────────────────────────────────────
    const updateInvoiceAction = async (invoiceId: string, input: Parameters<typeof updateInvoice>[1]) => {
        setBusy(true); setErrorMessage(null);
        try {
            await updateInvoice(invoiceId, input);
            await Promise.all([loadInvoices(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to update invoice.")); }
        finally { setBusy(false); }
    };

    const deleteInvoiceAction = async (invoiceId: string) => {
        if (!window.confirm("Delete this invoice?")) return;
        setBusy(true); setErrorMessage(null);
        try {
            await deleteInvoice(invoiceId);
            await Promise.all([loadInvoices(), loadDashboard()]);
        } catch (e: unknown) { setErrorMessage(errorToMessage(e, "Failed to delete invoice.")); }
        finally { setBusy(false); }
    };

    return {
        route,
        errorMessage,
        setErrorMessage,

        // Data
        dashboard, tenants, tenantDetail, plans, invoices, leads,

        // Loading
        loadingDashboard, loadingTenants, loadingTenantDetail,
        loadingPlans, loadingInvoices, loadingLeads, busy,

        // New Tenant form
        newTenantName, setNewTenantName,
        newTenantSlug, setNewTenantSlug,
        newTenantActive, setNewTenantActive,

        // Edit Tenant form
        editTenantName, setEditTenantName,
        editTenantSlug, setEditTenantSlug,
        editTenantActive, setEditTenantActive,

        // Subscription form
        subPlanName, setSubPlanName,
        subStatus, setSubStatus,
        subSeats, setSubSeats,
        subMonthlyPrice, setSubMonthlyPrice,
        subCurrency, setSubCurrency,
        subAutoRenew, setSubAutoRenew,
        subStartedAt, setSubStartedAt,
        subRenewsAt, setSubRenewsAt,
        subCancelledAt, setSubCancelledAt,

        // Actions
        createTenantAction, updateTenantAction, deleteTenantAction,
        addSubscriptionAction, updateSubscriptionStatusAction, deleteSubscriptionAction,
        addContactAction, updateContactAction, deleteContactAction,
        addNoteAction, deleteNoteAction,
        addTenantInvoiceAction,
        createPlanAction, updatePlanAction, deletePlanAction,
        createLeadAction, updateLeadAction, deleteLeadAction,
        updateInvoiceAction, deleteInvoiceAction,

        navigateToAdminRoute,
    };
}
