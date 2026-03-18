import { Card, CardBody } from "@heroui/react";

type MetricCardProps = {
    label: string;
    value: string | number;
    loading: boolean;
};

export function MetricCard({ label, value, loading }: MetricCardProps) {
    return (
        <Card className="shadow-sm">
            <CardBody>
                <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{loading ? "..." : value}</div>
            </CardBody>
        </Card>
    );
}
