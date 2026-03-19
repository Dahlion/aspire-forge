import { useEffect, type ReactNode } from "react";

type AppModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    size?: "sm" | "lg" | "xl";
};

/**
 * Project-standard modal using Bootstrap 4 markup.
 * The backdrop does NOT close the modal — users must use an explicit button.
 */
export function AppModal({ isOpen, onClose, title, footer, children, size }: AppModalProps) {
    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("modal-open");
        } else {
            document.body.classList.remove("modal-open");
        }
        return () => {
            document.body.classList.remove("modal-open");
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass = size ? ` modal-${size}` : "";

    return (
        <>
            <div
                className="modal fade show"
                style={{ display: "block" }}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
            >
                <div className={`modal-dialog modal-dialog-centered${sizeClass}`} role="document">
                    <div className="modal-content">
                        {title !== undefined && (
                            <div className="modal-header">
                                <h5 className="modal-title">{title}</h5>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={onClose}
                                    aria-label="Close"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                        )}
                        <div className="modal-body">{children}</div>
                        {footer !== undefined && (
                            <div className="modal-footer">{footer}</div>
                        )}
                    </div>
                </div>
            </div>
            {/* Static backdrop — no onClick, enforcing "cannot click outside" */}
            <div className="modal-backdrop fade show" />
        </>
    );
}
