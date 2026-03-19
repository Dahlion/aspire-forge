import { useEffect, useRef } from "react";
import DTReact from "datatables.net-react";
import DT from "datatables.net-bs5";

// CSS — imported through the bundler, not via CDN
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";
import "datatables.net-buttons-bs5/css/buttons.bootstrap5.min.css";
import "datatables.net-searchbuilder-bs5/css/searchBuilder.bootstrap5.min.css";

// Extensions
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.html5.mjs";
import "datatables.net-buttons/js/buttons.print.mjs";
import "datatables.net-buttons/js/buttons.colVis.mjs";
import "datatables.net-colreorder-bs5";
import "datatables.net-fixedheader-bs5";
import "datatables.net-responsive-bs5";
import "datatables.net-select-bs5";
import "datatables.net-searchbuilder-bs5";

DTReact.use(DT);

export type DataTableAction = {
    action: string;
    id: string;
};

type DataTableProps = {
    id: string;
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
    "<'row mb-2'<'col-12'Q>>" + 
    "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
    "<'row'<'col-sm-12'tr>>" +
    "<'row mt-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>";

const DEFAULT_BUTTONS = [
    { extend: "copy",   className: "btn-sm btn-outline-secondary" },
    { extend: "csv",    className: "btn-sm btn-outline-secondary" },
    { extend: "print",  className: "btn-sm btn-outline-secondary" },
    { extend: "colvis", text: "Columns", className: "btn-sm btn-outline-info" },
];

export function DataTable({ columns, data, options, onAction }: DataTableProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const onActionRef = useRef(onAction);
    onActionRef.current = onAction;

    useEffect(() => {
        const container = wrapperRef.current;
        if (!container) return;

        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
            if (!target || !onActionRef.current) return;
            onActionRef.current({
                action: target.dataset.action!,
                id: target.dataset.id!,
            });
        };

        container.addEventListener("click", handleClick);
        return () => container.removeEventListener("click", handleClick);
    }, []);

    return (
        <div ref={wrapperRef}>
            <DTReact
                columns={columns}
                data={data}
                className="table table-striped table-hover table-bordered"
                options={{
                    destroy: true, // Destroy and recreate on each render to handle dynamic data/columns
                    dom: DEFAULT_DOM,
                    buttons: DEFAULT_BUTTONS,
                    colReorder: true,
                    fixedHeader: true,
                    responsive: true,
                    select: "single",
                    pageLength: 10,
                    lengthMenu: [5, 10, 25, 50, 100],
                    ...options,
                }}
            />
        </div>
    );
}