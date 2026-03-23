import { useAdminManagement } from "./hooks/useAdminManagement";
import { AdminSidebar } from "./components/AdminSidebar";
import { DashboardView } from "./components/DashboardView";
import { TenantDetailView } from "./components/TenantDetailView";
import { ToolboxView } from "./components/ToolboxView";
import { ClientManagerView } from "./components/ClientManagerView";
import { SubscriptionManagerView } from "./components/SubscriptionManagerView";
import { BusinessManagerView } from "./components/BusinessManagerView";
import { MarketingManagerView } from "./components/MarketingManagerView";
import { FormDesignerView } from "./components/FormDesignerView";
import { AppManagerView } from "./components/AppManagerView";
import { AppDesignerView } from "./components/AppDesignerView";
import { ZipDeployView } from "./components/ZipDeployView";

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

                {admin.route.kind === "client-manager" && (
                    <ClientManagerView
                        tenants={admin.tenants}
                        loadingTenants={admin.loadingTenants}
                        leads={admin.leads}
                        loadingLeads={admin.loadingLeads}
                        busy={admin.busy}
                        onNavigate={admin.navigateToAdminRoute}
                        onCreateLead={admin.createLeadAction}
                        onUpdateLead={admin.updateLeadAction}
                        onDeleteLead={admin.deleteLeadAction}
                        newTenantName={admin.newTenantName}
                        newTenantSlug={admin.newTenantSlug}
                        newTenantActive={admin.newTenantActive}
                        setNewTenantName={admin.setNewTenantName}
                        setNewTenantSlug={admin.setNewTenantSlug}
                        setNewTenantActive={admin.setNewTenantActive}
                        onCreateTenant={admin.createTenantAction}
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

                {admin.route.kind === "subscription-manager" && (
                    <SubscriptionManagerView
                        plans={admin.plans}
                        loadingPlans={admin.loadingPlans}
                        busy={admin.busy}
                        onCreatePlan={admin.createPlanAction}
                        onUpdatePlan={admin.updatePlanAction}
                        onDeletePlan={admin.deletePlanAction}
                    />
                )}

                {admin.route.kind === "business-manager" && (
                    <BusinessManagerView
                        invoices={admin.invoices}
                        loadingInvoices={admin.loadingInvoices}
                        busy={admin.busy}
                        onUpdateInvoice={admin.updateInvoiceAction}
                        onDeleteInvoice={admin.deleteInvoiceAction}
                    />
                )}

                {admin.route.kind === "marketing-manager" && <MarketingManagerView />}
                {admin.route.kind === "form-designer"      && <FormDesignerView />}
                {admin.route.kind === "app-manager"        && <AppManagerView />}
                {admin.route.kind === "app-designer"       && <AppDesignerView />}
                {admin.route.kind === "zip-deploy"         && <ZipDeployView />}
                {admin.route.kind === "toolbox"            && <ToolboxView />}
            </div>
        </div>
    );
}
