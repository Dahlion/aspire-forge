import { useAdminManagement } from "./hooks/useAdminManagement";
import { AdminSidebar } from "./components/AdminSidebar";
import { DashboardView } from "./components/DashboardView";
import { TenantDetailView } from "./components/TenantDetailView";
import { TenantsView } from "./components/TenantsView";
import { PlansView } from "./components/PlansView";
import { BillingView } from "./components/BillingView";
import { LeadsView } from "./components/LeadsView";
import { ToolboxView } from "./components/ToolboxView";
import { WorkflowsView } from "./components/WorkflowsView";
import { MicroAppsView } from "./components/MicroAppsView";
import { AppSuitesView } from "./components/AppSuitesView";

type AdminConsoleProps = {
    enabled: boolean;
};

export function AdminConsole({ enabled }: AdminConsoleProps) {
    const admin = useAdminManagement(enabled);

    return (
        <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 mb-4">
                <AdminSidebar
                    route={admin.route}
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
            </div>

            {/* Main content */}
            <div className="col-lg-9">
                {admin.errorMessage && (
                    <div className="alert alert-danger alert-dismissible mb-4" role="alert">
                        <i className="bi bi-exclamation-circle-fill mr-2" />
                        {admin.errorMessage}
                        <button type="button" className="close" onClick={() => admin.setErrorMessage(null)}>
                            <span>&times;</span>
                        </button>
                    </div>
                )}

                {admin.route.kind === "dashboard" && (
                    <DashboardView
                        dashboard={admin.dashboard}
                        loadingDashboard={admin.loadingDashboard}
                        onNavigate={admin.navigateToAdminRoute}
                    />
                )}

                {admin.route.kind === "tenants" && (
                    <TenantsView
                        tenants={admin.tenants}
                        loadingTenants={admin.loadingTenants}
                        onNavigate={admin.navigateToAdminRoute}
                    />
                )}

                {admin.route.kind === "tenant" && (
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
                        onAddContact={admin.addContactAction}
                        onUpdateContact={admin.updateContactAction}
                        onDeleteContact={admin.deleteContactAction}
                        onAddNote={admin.addNoteAction}
                        onDeleteNote={admin.deleteNoteAction}
                        onAddInvoice={admin.addTenantInvoiceAction}
                        onUpdateInvoice={admin.updateInvoiceAction}
                        onDeleteInvoice={admin.deleteInvoiceAction}
                        tenantInvoices={admin.invoices}
                    />
                )}

                {admin.route.kind === "plans" && (
                    <PlansView
                        plans={admin.plans}
                        loadingPlans={admin.loadingPlans}
                        busy={admin.busy}
                        onCreatePlan={admin.createPlanAction}
                        onUpdatePlan={admin.updatePlanAction}
                        onDeletePlan={admin.deletePlanAction}
                    />
                )}

                {admin.route.kind === "billing" && (
                    <BillingView
                        invoices={admin.invoices}
                        loadingInvoices={admin.loadingInvoices}
                        busy={admin.busy}
                        onUpdateInvoice={admin.updateInvoiceAction}
                        onDeleteInvoice={admin.deleteInvoiceAction}
                    />
                )}

                {admin.route.kind === "leads" && (
                    <LeadsView
                        leads={admin.leads}
                        loadingLeads={admin.loadingLeads}
                        busy={admin.busy}
                        onCreateLead={admin.createLeadAction}
                        onUpdateLead={admin.updateLeadAction}
                        onDeleteLead={admin.deleteLeadAction}
                    />
                )}

                {admin.route.kind === "workflows"  && <WorkflowsView />}
                {admin.route.kind === "microapps"  && <MicroAppsView />}
                {admin.route.kind === "suites"     && <AppSuitesView />}
                {admin.route.kind === "toolbox"    && <ToolboxView />}
            </div>
        </div>
    );
}