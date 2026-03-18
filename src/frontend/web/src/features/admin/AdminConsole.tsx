import { Card, CardBody } from "@heroui/react";
import { useAdminManagement } from "./hooks/useAdminManagement";
import { AdminSidebar } from "./components/AdminSidebar";
import { DashboardView } from "./components/DashboardView";
import { TenantDetailView } from "./components/TenantDetailView";

type AdminConsoleProps = {
    enabled: boolean;
};

export function AdminConsole({ enabled }: AdminConsoleProps) {
    const admin = useAdminManagement(enabled);

    return (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <AdminSidebar
                tenants={admin.tenants}
                loadingTenants={admin.loadingTenants}
                busy={admin.busy}
                newTenantName={admin.newTenantName}
                newTenantSlug={admin.newTenantSlug}
                newTenantActive={admin.newTenantActive}
                setNewTenantName={admin.setNewTenantName}
                setNewTenantSlug={admin.setNewTenantSlug}
                setNewTenantActive={admin.setNewTenantActive}
                onCreateTenant={admin.createTenantAction}
                onNavigate={admin.navigateToAdminRoute}
            />

            <section className="space-y-4">
                {admin.errorMessage && (
                    <Card className="border border-danger-300 bg-danger-50 text-danger-800">
                        <CardBody className="text-sm">{admin.errorMessage}</CardBody>
                    </Card>
                )}

                {admin.route.kind === "dashboard" ? (
                    <DashboardView
                        dashboard={admin.dashboard}
                        loadingDashboard={admin.loadingDashboard}
                        onNavigate={admin.navigateToAdminRoute}
                    />
                ) : (
                    <TenantDetailView
                        tenantDetail={admin.tenantDetail}
                        loadingTenantDetail={admin.loadingTenantDetail}
                        busy={admin.busy}
                        editTenantName={admin.editTenantName}
                        setEditTenantName={admin.setEditTenantName}
                        editTenantSlug={admin.editTenantSlug}
                        setEditTenantSlug={admin.setEditTenantSlug}
                        editTenantActive={admin.editTenantActive}
                        setEditTenantActive={admin.setEditTenantActive}
                        subPlanName={admin.subPlanName}
                        setSubPlanName={admin.setSubPlanName}
                        subStatus={admin.subStatus}
                        setSubStatus={admin.setSubStatus}
                        subSeats={admin.subSeats}
                        setSubSeats={admin.setSubSeats}
                        subMonthlyPrice={admin.subMonthlyPrice}
                        setSubMonthlyPrice={admin.setSubMonthlyPrice}
                        subCurrency={admin.subCurrency}
                        setSubCurrency={admin.setSubCurrency}
                        subAutoRenew={admin.subAutoRenew}
                        setSubAutoRenew={admin.setSubAutoRenew}
                        subStartedAt={admin.subStartedAt}
                        setSubStartedAt={admin.setSubStartedAt}
                        subRenewsAt={admin.subRenewsAt}
                        setSubRenewsAt={admin.setSubRenewsAt}
                        subCancelledAt={admin.subCancelledAt}
                        setSubCancelledAt={admin.setSubCancelledAt}
                        onUpdateTenant={admin.updateTenantAction}
                        onDeleteTenant={admin.deleteTenantAction}
                        onAddSubscription={admin.addSubscriptionAction}
                        onUpdateSubscriptionStatus={admin.updateSubscriptionStatusAction}
                        onDeleteSubscription={admin.deleteSubscriptionAction}
                    />
                )}
            </section>
        </div>
    );
}
