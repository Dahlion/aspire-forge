import { Button, Card, CardBody, CardHeader, Checkbox, Chip, Divider, Input, Spinner } from "@heroui/react";
import type { TenantSummary } from "../../../types/admin";
import { type AdminRoute } from "../routing";

type AdminSidebarProps = {
    tenants: TenantSummary[];
    loadingTenants: boolean;
    busy: boolean;
    newTenantName: string;
    newTenantSlug: string;
    newTenantActive: boolean;
    setNewTenantName: (value: string) => void;
    setNewTenantSlug: (value: string) => void;
    setNewTenantActive: (value: boolean) => void;
    onCreateTenant: () => void;
    onNavigate: (route: AdminRoute) => void;
};

export function AdminSidebar({
    tenants,
    loadingTenants,
    busy,
    newTenantName,
    newTenantSlug,
    newTenantActive,
    setNewTenantName,
    setNewTenantSlug,
    setNewTenantActive,
    onCreateTenant,
    onNavigate,
}: AdminSidebarProps) {
    return (
        <section className="space-y-4">
            <Card className="shadow-sm">
                <CardHeader className="flex items-center justify-between">
                    <div className="text-sm font-semibold uppercase tracking-wide opacity-70">Tenants</div>
                    <Button size="sm" variant="flat" onPress={() => onNavigate({ kind: "dashboard" })}>
                        Overview
                    </Button>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-2">
                    {loadingTenants && <Spinner size="sm" label="Loading tenants" />}
                    {tenants.map((tenant) => (
                        <button
                            key={tenant.id}
                            type="button"
                            onClick={() => onNavigate({ kind: "tenant", tenantId: tenant.id })}
                            className="flex w-full items-center justify-between rounded-xl border border-divider px-3 py-2 text-left hover:bg-content2"
                        >
                            <div>
                                <div className="font-medium">{tenant.name}</div>
                                <div className="text-xs opacity-70">{tenant.slug}</div>
                            </div>
                            <Chip size="sm" color={tenant.isActive ? "success" : "default"} variant="flat">
                                {tenant.subscriptionCount}
                            </Chip>
                        </button>
                    ))}
                </CardBody>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <div className="text-sm font-semibold uppercase tracking-wide opacity-70">Create Tenant</div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-3">
                    <Input label="Tenant name" value={newTenantName} onValueChange={setNewTenantName} />
                    <Input
                        label="Slug (optional)"
                        placeholder="acme-corp"
                        value={newTenantSlug}
                        onValueChange={setNewTenantSlug}
                    />
                    <Checkbox isSelected={newTenantActive} onValueChange={setNewTenantActive}>
                        Active tenant
                    </Checkbox>
                    <Button color="primary" isLoading={busy} isDisabled={!newTenantName.trim()} onPress={onCreateTenant}>
                        Create
                    </Button>
                </CardBody>
            </Card>
        </section>
    );
}
