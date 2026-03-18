import { useCallback, useEffect, useState } from "react";
import {
    createSubscription,
    createTenant,
    deleteSubscription,
    deleteTenant,
    getAdminDashboard,
    getTenantDetail,
    getTenants,
    SUBSCRIPTION_STATUSES,
    updateSubscription,
    updateTenant,
} from "../api";
import { toDateInput, toIsoFromDateInput } from "../../../lib/date";
import { navigateToAdminRoute, parseAdminHashRoute, type AdminRoute } from "../routing";
import type { DashboardData, Subscription, TenantDetail, TenantSummary } from "../../../types/admin";

function errorToMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

export function useAdminManagement(isEnabled: boolean) {
    const [route, setRoute] = useState<AdminRoute>(() => parseAdminHashRoute());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);

    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantSlug, setNewTenantSlug] = useState("");
    const [newTenantActive, setNewTenantActive] = useState(true);

    const [editTenantName, setEditTenantName] = useState("");
    const [editTenantSlug, setEditTenantSlug] = useState("");
    const [editTenantActive, setEditTenantActive] = useState(true);

    const [subPlanName, setSubPlanName] = useState("Starter");
    const [subStatus, setSubStatus] = useState<string>(SUBSCRIPTION_STATUSES[0]);
    const [subSeats, setSubSeats] = useState("5");
    const [subMonthlyPrice, setSubMonthlyPrice] = useState("49");
    const [subCurrency, setSubCurrency] = useState("USD");
    const [subAutoRenew, setSubAutoRenew] = useState(true);
    const [subStartedAt, setSubStartedAt] = useState(() => toDateInput(new Date().toISOString()));
    const [subRenewsAt, setSubRenewsAt] = useState("");
    const [subCancelledAt, setSubCancelledAt] = useState("");

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [loadingTenantDetail, setLoadingTenantDetail] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onHashChange = () => setRoute(parseAdminHashRoute());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const loadDashboard = useCallback(async () => {
        setLoadingDashboard(true);
        try {
            setDashboard(await getAdminDashboard());
        } finally {
            setLoadingDashboard(false);
        }
    }, []);

    const loadTenants = useCallback(async () => {
        setLoadingTenants(true);
        try {
            setTenants(await getTenants());
        } finally {
            setLoadingTenants(false);
        }
    }, []);

    const loadTenantDetail = useCallback(async (tenantId: string) => {
        setLoadingTenantDetail(true);
        try {
            const detail = await getTenantDetail(tenantId);
            setTenantDetail(detail);
            setEditTenantName(detail.name);
            setEditTenantSlug(detail.slug);
            setEditTenantActive(detail.isActive);
        } finally {
            setLoadingTenantDetail(false);
        }
    }, []);

    useEffect(() => {
        if (!isEnabled) return;

        setErrorMessage(null);
        loadDashboard().catch((error: unknown) => {
            setErrorMessage(errorToMessage(error, "Failed to load dashboard."));
        });
        loadTenants().catch((error: unknown) => {
            setErrorMessage(errorToMessage(error, "Failed to load tenants."));
        });
    }, [isEnabled, loadDashboard, loadTenants]);

    useEffect(() => {
        if (!isEnabled) return;
        if (route.kind !== "tenant") {
            setTenantDetail(null);
            return;
        }

        loadTenantDetail(route.tenantId).catch((error: unknown) => {
            setErrorMessage(errorToMessage(error, "Failed to load tenant detail."));
        });
    }, [route, isEnabled, loadTenantDetail]);

    const createTenantAction = async () => {
        if (!newTenantName.trim()) return;

        setBusy(true);
        setErrorMessage(null);
        try {
            await createTenant({
                name: newTenantName.trim(),
                slug: newTenantSlug.trim() || null,
                isActive: newTenantActive,
            });

            setNewTenantName("");
            setNewTenantSlug("");
            setNewTenantActive(true);
            await Promise.all([loadTenants(), loadDashboard()]);
        } catch (error: unknown) {
            setErrorMessage(errorToMessage(error, "Failed to create tenant."));
        } finally {
            setBusy(false);
        }
    };

    const updateTenantAction = async () => {
        if (!tenantDetail) return;

        setBusy(true);
        setErrorMessage(null);
        try {
            await updateTenant(tenantDetail.id, {
                name: editTenantName.trim(),
                slug: editTenantSlug.trim(),
                isActive: editTenantActive,
            });

            await Promise.all([loadTenants(), loadDashboard(), loadTenantDetail(tenantDetail.id)]);
        } catch (error: unknown) {
            setErrorMessage(errorToMessage(error, "Failed to update tenant."));
        } finally {
            setBusy(false);
        }
    };

    const deleteTenantAction = async () => {
        if (!tenantDetail) return;
        const confirmed = window.confirm(`Delete tenant ${tenantDetail.name}? This removes all subscriptions.`);
        if (!confirmed) return;

        setBusy(true);
        setErrorMessage(null);
        try {
            await deleteTenant(tenantDetail.id);
            await Promise.all([loadTenants(), loadDashboard()]);
            navigateToAdminRoute({ kind: "dashboard" });
        } catch (error: unknown) {
            setErrorMessage(errorToMessage(error, "Failed to delete tenant."));
        } finally {
            setBusy(false);
        }
    };

    const addSubscriptionAction = async () => {
        if (!tenantDetail || !subPlanName.trim()) return;

        const seats = Number(subSeats);
        const monthlyPrice = Number(subMonthlyPrice);
        const startedAt = toIsoFromDateInput(subStartedAt);

        if (!Number.isFinite(seats) || seats <= 0 || !Number.isFinite(monthlyPrice) || monthlyPrice < 0 || !startedAt) {
            setErrorMessage("Subscription form values are invalid.");
            return;
        }

        setBusy(true);
        setErrorMessage(null);
        try {
            await createSubscription(tenantDetail.id, {
                planName: subPlanName.trim(),
                status: subStatus,
                seats,
                monthlyPrice,
                currency: subCurrency.trim().toUpperCase(),
                autoRenew: subAutoRenew,
                startedAt,
                renewsAt: toIsoFromDateInput(subRenewsAt),
                cancelledAt: toIsoFromDateInput(subCancelledAt),
            });

            setSubPlanName("Starter");
            setSubStatus(SUBSCRIPTION_STATUSES[0]);
            setSubSeats("5");
            setSubMonthlyPrice("49");
            setSubCurrency("USD");
            setSubAutoRenew(true);
            setSubStartedAt(toDateInput(new Date().toISOString()));
            setSubRenewsAt("");
            setSubCancelledAt("");

            await Promise.all([loadTenantDetail(tenantDetail.id), loadTenants(), loadDashboard()]);
        } catch (error: unknown) {
            setErrorMessage(errorToMessage(error, "Failed to add subscription."));
        } finally {
            setBusy(false);
        }
    };

    const updateSubscriptionStatusAction = async (subscription: Subscription, nextStatus: string) => {
        if (!tenantDetail) return;

        setBusy(true);
        setErrorMessage(null);
        try {
            await updateSubscription(tenantDetail.id, subscription.id, {
                status: nextStatus,
                renewsAt: subscription.renewsAt,
                renewsAtSet: true,
                cancelledAt: nextStatus === "canceled" ? new Date().toISOString() : null,
                cancelledAtSet: true,
            });

            await Promise.all([loadTenantDetail(tenantDetail.id), loadTenants(), loadDashboard()]);
        } catch (error: unknown) {
            setErrorMessage(errorToMessage(error, "Failed to update subscription."));
        } finally {
            setBusy(false);
        }
    };

    const deleteSubscriptionAction = async (subscriptionId: string) => {
        if (!tenantDetail) return;

        const confirmed = window.confirm("Delete this subscription?");
        if (!confirmed) return;

        setBusy(true);
        setErrorMessage(null);
        try {
            await deleteSubscription(tenantDetail.id, subscriptionId);
            await Promise.all([loadTenantDetail(tenantDetail.id), loadTenants(), loadDashboard()]);
        } catch (error: unknown) {
            setErrorMessage(errorToMessage(error, "Failed to delete subscription."));
        } finally {
            setBusy(false);
        }
    };

    return {
        route,
        errorMessage,
        dashboard,
        tenants,
        tenantDetail,
        loadingDashboard,
        loadingTenants,
        loadingTenantDetail,
        busy,
        newTenantName,
        setNewTenantName,
        newTenantSlug,
        setNewTenantSlug,
        newTenantActive,
        setNewTenantActive,
        editTenantName,
        setEditTenantName,
        editTenantSlug,
        setEditTenantSlug,
        editTenantActive,
        setEditTenantActive,
        subPlanName,
        setSubPlanName,
        subStatus,
        setSubStatus,
        subSeats,
        setSubSeats,
        subMonthlyPrice,
        setSubMonthlyPrice,
        subCurrency,
        setSubCurrency,
        subAutoRenew,
        setSubAutoRenew,
        subStartedAt,
        setSubStartedAt,
        subRenewsAt,
        setSubRenewsAt,
        subCancelledAt,
        setSubCancelledAt,
        createTenantAction,
        updateTenantAction,
        deleteTenantAction,
        addSubscriptionAction,
        updateSubscriptionStatusAction,
        deleteSubscriptionAction,
        navigateToAdminRoute,
    };
}
