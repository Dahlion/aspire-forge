import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Checkbox,
    Chip,
    Divider,
    Input,
    Select,
    SelectItem,
    Spinner,
} from "@heroui/react";
import { SUBSCRIPTION_STATUSES } from "../api";
import type { Subscription, TenantDetail } from "../../../types/admin";

type TenantDetailViewProps = {
    tenantDetail: TenantDetail | null;
    loadingTenantDetail: boolean;
    busy: boolean;
    editTenantName: string;
    setEditTenantName: (value: string) => void;
    editTenantSlug: string;
    setEditTenantSlug: (value: string) => void;
    editTenantActive: boolean;
    setEditTenantActive: (value: boolean) => void;
    subPlanName: string;
    setSubPlanName: (value: string) => void;
    subStatus: string;
    setSubStatus: (value: string) => void;
    subSeats: string;
    setSubSeats: (value: string) => void;
    subMonthlyPrice: string;
    setSubMonthlyPrice: (value: string) => void;
    subCurrency: string;
    setSubCurrency: (value: string) => void;
    subAutoRenew: boolean;
    setSubAutoRenew: (value: boolean) => void;
    subStartedAt: string;
    setSubStartedAt: (value: string) => void;
    subRenewsAt: string;
    setSubRenewsAt: (value: string) => void;
    subCancelledAt: string;
    setSubCancelledAt: (value: string) => void;
    onUpdateTenant: () => void;
    onDeleteTenant: () => void;
    onAddSubscription: () => void;
    onUpdateSubscriptionStatus: (subscription: Subscription, nextStatus: string) => void;
    onDeleteSubscription: (subscriptionId: string) => void;
};

export function TenantDetailView({
    tenantDetail,
    loadingTenantDetail,
    busy,
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
    onUpdateTenant,
    onDeleteTenant,
    onAddSubscription,
    onUpdateSubscriptionStatus,
    onDeleteSubscription,
}: TenantDetailViewProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold">{tenantDetail?.name ?? "Tenant"}</div>
                    <div className="text-sm opacity-70">Manage tenant profile and subscriptions</div>
                </div>
                {loadingTenantDetail && <Spinner size="sm" />}
            </CardHeader>
            <Divider />
            <CardBody className="space-y-6">
                {tenantDetail ? (
                    <>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input label="Tenant name" value={editTenantName} onValueChange={setEditTenantName} />
                            <Input label="Slug" value={editTenantSlug} onValueChange={setEditTenantSlug} />
                            <Checkbox isSelected={editTenantActive} onValueChange={setEditTenantActive}>
                                Active tenant
                            </Checkbox>
                        </div>
                        <div className="flex gap-2">
                            <Button color="primary" isLoading={busy} onPress={onUpdateTenant}>
                                Save tenant
                            </Button>
                            <Button color="danger" variant="flat" isLoading={busy} onPress={onDeleteTenant}>
                                Delete tenant
                            </Button>
                        </div>

                        <Divider />

                        <div className="space-y-3">
                            <div className="text-sm font-semibold uppercase tracking-wide opacity-70">Add Subscription</div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <Input label="Plan" value={subPlanName} onValueChange={setSubPlanName} />
                                <Select
                                    label="Status"
                                    selectedKeys={new Set([subStatus])}
                                    onSelectionChange={(keys) => {
                                        const first = Array.from(keys)[0];
                                        if (typeof first === "string") setSubStatus(first);
                                    }}
                                >
                                    {SUBSCRIPTION_STATUSES.map((status) => (
                                        <SelectItem key={status}>{status}</SelectItem>
                                    ))}
                                </Select>
                                <Input label="Seats" type="number" value={subSeats} onValueChange={setSubSeats} />
                                <Input
                                    label="Monthly price"
                                    type="number"
                                    step="0.01"
                                    value={subMonthlyPrice}
                                    onValueChange={setSubMonthlyPrice}
                                />
                                <Input label="Currency" value={subCurrency} onValueChange={setSubCurrency} />
                                <Input label="Start date" type="date" value={subStartedAt} onValueChange={setSubStartedAt} />
                                <Input label="Renews at" type="date" value={subRenewsAt} onValueChange={setSubRenewsAt} />
                                <Input
                                    label="Cancelled at"
                                    type="date"
                                    value={subCancelledAt}
                                    onValueChange={setSubCancelledAt}
                                />
                            </div>
                            <Checkbox isSelected={subAutoRenew} onValueChange={setSubAutoRenew}>
                                Auto renew
                            </Checkbox>
                            <Button color="secondary" isLoading={busy} onPress={onAddSubscription}>
                                Add subscription
                            </Button>
                        </div>

                        <Divider />

                        <div className="space-y-2">
                            <div className="text-sm font-semibold uppercase tracking-wide opacity-70">Subscriptions</div>
                            {tenantDetail.subscriptions.length === 0 ? (
                                <div className="text-sm opacity-70">No subscriptions yet.</div>
                            ) : (
                                tenantDetail.subscriptions.map((subscription) => (
                                    <div
                                        key={subscription.id}
                                        className="grid gap-3 rounded-xl border border-divider px-4 py-3 md:grid-cols-[1fr_auto]"
                                    >
                                        <div>
                                            <div className="font-medium">{subscription.planName}</div>
                                            <div className="text-sm opacity-70">
                                                {subscription.currency} {subscription.monthlyPrice.toFixed(2)} • {subscription.seats} seats
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Chip variant="flat" color={subscription.status === "active" ? "success" : "warning"}>
                                                {subscription.status}
                                            </Chip>
                                            {subscription.status !== "active" && (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => onUpdateSubscriptionStatus(subscription, "active")}
                                                >
                                                    Mark active
                                                </Button>
                                            )}
                                            {subscription.status !== "canceled" && (
                                                <Button
                                                    size="sm"
                                                    color="warning"
                                                    variant="flat"
                                                    onPress={() => onUpdateSubscriptionStatus(subscription, "canceled")}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                onPress={() => onDeleteSubscription(subscription.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-sm opacity-70">Select a tenant to view details.</div>
                )}
            </CardBody>
        </Card>
    );
}
