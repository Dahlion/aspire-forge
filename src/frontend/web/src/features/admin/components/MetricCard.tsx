type MetricCardProps = {
    label: string;
    value: string | number;
    loading: boolean;
};

export function MetricCard({ label, value, loading }: MetricCardProps) {
    return (
        <div className="card shadow-sm h-100">
            <div className="card-body">
                <p className="text-muted text-uppercase small font-weight-bold mb-1">{label}</p>
                {loading ? (
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="sr-only">Loading…</span>
                    </div>
                ) : (
                    <h4 className="mb-0 font-weight-bold">{value}</h4>
                )}
            </div>
        </div>
    );
}
