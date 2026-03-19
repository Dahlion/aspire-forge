import { useEffect, useRef } from "react";

export type DataTableAction = {
    action: string;
    id: string;
};

type DataTableProps = {
    id: string;
    /** DataTables column definitions (typed as any to avoid requiring datatables.net types) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: Record<string, any>;
    onAction?: (event: DataTableAction) => void;
};

const DEFAULT_DOM =
    "<'row mb-2'<'col-12'B>>" +
    "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
    "<'row'<'col-sm-12'tr>>" +
    "<'row mt-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>";

const DEFAULT_BUTTONS = [
    { extend: "copy",   className: "btn-sm btn-outline-secondary" },
    { extend: "csv",    className: "btn-sm btn-outline-secondary" },
    { extend: "excel",  className: "btn-sm btn-outline-secondary" },
    { extend: "pdf",    className: "btn-sm btn-outline-secondary" },
    { extend: "print",  className: "btn-sm btn-outline-secondary" },
    { extend: "colvis", text: "Columns", className: "btn-sm btn-outline-info" },
    { extend: "searchBuilder", text: '<i class="bi bi-funnel"></i> Filter', className: "btn-sm btn-outline-primary" },
];

export function DataTable({ id, columns, data, options, onAction }: DataTableProps) {
    const tableRef = useRef<HTMLTableElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dtRef = useRef<any>(null);
    const onActionRef = useRef(onAction);
    onActionRef.current = onAction;

    // Initialize DataTables once on mount
    useEffect(() => {
        if (!tableRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dt = $(tableRef.current as any).DataTable({
            columns,
            data,
            dom: DEFAULT_DOM,
            buttons: DEFAULT_BUTTONS,
            colReorder: true,
            fixedHeader: true,
            responsive: true,
            select: "single",
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50, 100],
            ...options,
        });

        dtRef.current = dt;

        // Event delegation for action buttons rendered inside table cells
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $(tableRef.current as any).on("click", "[data-action]", function (this: HTMLElement) {
            if (!onActionRef.current) return;
            const action = $(this).data("action") as string;
            const rowId = $(this).data("id") as string;
            onActionRef.current({ action, id: rowId });
        });

        return () => {
            if (dtRef.current) {
                dtRef.current.destroy();
                dtRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentional: init once; data updates handled in the effect below

    // Sync data updates without destroying + re-creating the table
    useEffect(() => {
        if (!dtRef.current) return;
        dtRef.current.clear().rows.add(data).draw(false);
    }, [data]);

    return (
        <table
            ref={tableRef}
            id={id}
            className="table table-striped table-hover table-bordered"
            style={{ width: "100%" }}
        />
    );
}
